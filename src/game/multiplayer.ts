import { supabase } from '@/integrations/supabase/client';
import { NetworkPlayerState, NetworkGameState } from './types';
import { WebRTCPeer } from './webrtc';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { syncRoomPresence } from '@/lib/rooms';

export class MultiplayerManager {
  private channel: RealtimeChannel | null = null;
  private playerId: string;
  private roomId: string;
  private peers: Map<string, WebRTCPeer> = new Map();
  private hostId: string | null = null;

  // Callbacks
  private onPlayerUpdate: (state: NetworkPlayerState) => void;
  private onPlayerLeave: (playerId: string) => void;
  private onShoot: (senderId: string, angle: number) => void;
  private onGameState: (state: NetworkGameState) => void;
  private onHostChanged: (isHost: boolean, hostId: string) => void;
  private onPauseChanged: (paused: boolean) => void;
  private onChatMessage: (senderId: string, senderName: string, text: string) => void;
  private onRespawnRequest: (playerId: string) => void;

  // Fallback throttling (Supabase only - WebRTC has no throttle)
  private lastSupabaseBroadcast = 0;
  private lastSupabaseGameState = 0;
  private _isHost = false;
  private joinedAt = Date.now();
  private pendingConnections = new Set<string>();
  private hasTracked = false;

  constructor(
    playerId: string,
    roomId: string,
    callbacks: {
      onPlayerUpdate: (state: NetworkPlayerState) => void;
      onPlayerLeave: (playerId: string) => void;
      onShoot: (senderId: string, angle: number, projId?: string, startX?: number, startY?: number) => void;
      onGameState: (state: NetworkGameState) => void;
      onHostChanged: (isHost: boolean, hostId: string) => void;
      onPauseChanged: (paused: boolean) => void;
      onChatMessage: (senderId: string, senderName: string, text: string) => void;
      onRespawnRequest: (playerId: string) => void;
    }
  ) {
    this.playerId = playerId;
    this.roomId = roomId;
    this.onPlayerUpdate = callbacks.onPlayerUpdate;
    this.onPlayerLeave = callbacks.onPlayerLeave;
    this.onShoot = callbacks.onShoot;
    this.onGameState = callbacks.onGameState;
    this.onHostChanged = callbacks.onHostChanged;
    this.onPauseChanged = callbacks.onPauseChanged;
    this.onChatMessage = callbacks.onChatMessage;
    this.onRespawnRequest = callbacks.onRespawnRequest;
  }

  get isHost(): boolean {
    return this._isHost;
  }

  private get hasAnyWebRTC(): boolean {
    for (const peer of this.peers.values()) {
      if (peer.connected) return true;
    }
    return false;
  }

  private isPeerConnected(peerId: string): boolean {
    return this.peers.get(peerId)?.connected ?? false;
  }

  async connect() {
    this.channel = supabase.channel(`game:${this.roomId}`, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'webrtc_signal' }, ({ payload }) => {
        this.handleSignal(payload);
      })
      .on('broadcast', { event: 'player_state' }, ({ payload }) => {
        if (payload.id !== this.playerId && !this.isPeerConnected(payload.id)) {
          this.onPlayerUpdate(payload as NetworkPlayerState);
        }
      })
      .on('broadcast', { event: 'shoot' }, ({ payload }) => {
        if (payload.senderId !== this.playerId && !this.isPeerConnected(payload.senderId)) {
          this.onShoot(payload.senderId, payload.angle);
        }
      })
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        if (!this._isHost && !this.isPeerConnected(this.hostId || '')) {
          this.onGameState(payload as NetworkGameState);
        }
      })
      .on('broadcast', { event: 'player_leave' }, ({ payload }) => {
        this.onPlayerLeave(payload.id);
      })
      .on('broadcast', { event: 'host_pause' }, ({ payload }) => {
        this.onPauseChanged(payload.paused);
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        if (payload.senderId !== this.playerId) {
          this.onChatMessage(payload.senderId, payload.senderName, payload.text);
        }
      })
      .on('broadcast', { event: 'respawn_request' }, ({ payload }) => {
        if (this._isHost && payload.playerId && payload.playerId !== this.playerId) {
          this.onRespawnRequest(payload.playerId);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        this.electHost();
        this.initiateWebRTCConnections();
        this.syncRoomCount();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences) {
          const pid = (p as any).player_id;
          if (pid) {
            this.removePeer(pid);
            this.onPlayerLeave(pid);
          }
        }
        // Check if room is now empty and handle cleanup
        this.syncRoomCount();
      });

    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel!.track({
          player_id: this.playerId,
          joined_at: this.joinedAt,
        });
        this.hasTracked = true;
        // Sync after tracking to ensure we're counted
        this.syncRoomCount();
      }
    });
  }

  private syncRoomCount() {
    if (!this.channel) return;
    // Don't sync before we've tracked ourselves — avoids race condition
    // where sync fires with count=0 before track() completes, deleting the room
    if (!this.hasTracked) return;

    const presenceState = this.channel.presenceState();
    let count = 0;
    for (const key of Object.keys(presenceState)) {
      count += presenceState[key].length;
    }
    syncRoomPresence(this.roomId, count);
  }

  private electHost() {
    if (!this.channel) return;
    const presenceState = this.channel.presenceState();
    const allPresences: any[] = [];
    for (const key of Object.keys(presenceState)) {
      allPresences.push(...presenceState[key]);
    }
    if (allPresences.length === 0) return;

    allPresences.sort((a, b) => a.joined_at - b.joined_at);
    this.hostId = allPresences[0].player_id;
    const newIsHost = this.hostId === this.playerId;

    if (newIsHost !== this._isHost) {
      this._isHost = newIsHost;
      this.onHostChanged(newIsHost, this.hostId!);
    }
  }

  private initiateWebRTCConnections() {
    if (!this.channel || !this._isHost) return;

    const presenceState = this.channel.presenceState();
    const allPresences: any[] = [];
    for (const key of Object.keys(presenceState)) {
      allPresences.push(...presenceState[key]);
    }

    for (const p of allPresences) {
      const pid = p.player_id;
      if (pid === this.playerId) continue;
      if (this.peers.has(pid) || this.pendingConnections.has(pid)) continue;
      this.createPeerConnection(pid, true);
    }
  }

  private async createPeerConnection(remoteId: string, isInitiator: boolean) {
    this.pendingConnections.add(remoteId);

    const peer = new WebRTCPeer(
      remoteId,
      (data) => this.handlePeerMessage(remoteId, data),
      () => this.removePeer(remoteId)
    );

    peer.onIceCandidate = (candidate) => {
      this.sendSignal(remoteId, { type: 'ice', candidate });
    };

    this.peers.set(remoteId, peer);

    if (isInitiator) {
      try {
        const offer = await peer.createOffer();
        this.sendSignal(remoteId, { type: 'offer', sdp: offer });
      } catch (e) {
        console.error('[WebRTC] Failed to create offer:', e);
        this.removePeer(remoteId);
      }
    }

    this.pendingConnections.delete(remoteId);
  }

  private async handleSignal(payload: any) {
    const { fromId, toId, data } = payload;
    if (toId !== this.playerId) return;

    if (data.type === 'offer') {
      if (!this.peers.has(fromId)) {
        await this.createPeerConnection(fromId, false);
      }
      const peer = this.peers.get(fromId);
      if (peer) {
        try {
          const answer = await peer.handleOffer(data.sdp);
          this.sendSignal(fromId, { type: 'answer', sdp: answer });
        } catch (e) {
          console.error('[WebRTC] Failed to handle offer:', e);
        }
      }
    } else if (data.type === 'answer') {
      const peer = this.peers.get(fromId);
      if (peer) {
        try {
          await peer.handleAnswer(data.sdp);
        } catch (e) {
          console.error('[WebRTC] Failed to handle answer:', e);
        }
      }
    } else if (data.type === 'ice') {
      const peer = this.peers.get(fromId);
      if (peer) {
        await peer.addIceCandidate(data.candidate);
      }
    }
  }

  private sendSignal(toId: string, data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'webrtc_signal',
      payload: { fromId: this.playerId, toId, data },
    });
  }

  private handlePeerMessage(fromId: string, msg: any) {
    switch (msg.type) {
      case 'player_state':
        if (fromId !== this.playerId) {
          this.onPlayerUpdate(msg.data as NetworkPlayerState);
        }
        break;
      case 'game_state':
        if (!this._isHost) {
          this.onGameState(msg.data as NetworkGameState);
        }
        break;
      case 'shoot':
        this.onShoot(fromId, msg.data.angle);
        break;
      case 'host_pause':
        this.onPauseChanged(msg.data.paused);
        break;
      case 'chat_message':
        if (fromId !== this.playerId) {
          this.onChatMessage(fromId, msg.data.senderName, msg.data.text);
        }
        break;
      case 'respawn_request':
        if (this._isHost && fromId !== this.playerId) {
          this.onRespawnRequest(fromId);
        }
        break;
    }
  }

  private removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
    }
    this.pendingConnections.delete(peerId);
  }

  // NO THROTTLE on WebRTC — send every frame for maximum responsiveness.
  // Supabase fallback throttled at 50ms to avoid HTTP spam.
  broadcastState(state: NetworkPlayerState, now: number) {
    const msg = { type: 'player_state', data: state };
    let sentViaWebRTC = false;

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
        sentViaWebRTC = true;
      }
    }

    if (!sentViaWebRTC) {
      if (now - this.lastSupabaseBroadcast < 50) return;
      this.lastSupabaseBroadcast = now;
      this.channel?.send({
        type: 'broadcast',
        event: 'player_state',
        payload: state,
      });
    }
  }

  // NO THROTTLE on WebRTC — host sends game state every frame.
  // Supabase fallback throttled at 50ms.
  broadcastGameState(gameState: NetworkGameState, now: number) {
    if (!this._isHost) return;

    const msg = { type: 'game_state', data: gameState };
    let allViaWebRTC = this.peers.size > 0;

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
      } else {
        allViaWebRTC = false;
      }
    }

    if (!allViaWebRTC) {
      if (now - this.lastSupabaseGameState < 50) return;
      this.lastSupabaseGameState = now;
      this.channel?.send({
        type: 'broadcast',
        event: 'game_state',
        payload: gameState,
      });
    }
  }

  broadcastShoot(angle: number) {
    const msg = { type: 'shoot', data: { angle } };
    let sentViaWebRTC = false;

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
        sentViaWebRTC = true;
      }
    }

    if (!sentViaWebRTC) {
      this.channel?.send({
        type: 'broadcast',
        event: 'shoot',
        payload: { senderId: this.playerId, angle },
      });
    }
  }

  requestRespawn() {
    const msg = { type: 'respawn_request', data: {} };

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
      }
    }

    // Always send reliable path too
    this.channel?.send({
      type: 'broadcast',
      event: 'respawn_request',
      payload: { playerId: this.playerId },
    });
  }

  broadcastPause(paused: boolean) {
    const msg = { type: 'host_pause', data: { paused } };

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
      }
    }

    this.channel?.send({
      type: 'broadcast',
      event: 'host_pause',
      payload: { paused },
    });
  }

  broadcastChat(senderName: string, text: string) {
    const msg = { type: 'chat_message', data: { senderName, text } };
    let sentViaWebRTC = false;

    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(msg);
        sentViaWebRTC = true;
      }
    }

    if (!sentViaWebRTC) {
      this.channel?.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: { senderId: this.playerId, senderName, text },
      });
    }
  }

  async disconnect() {
    for (const peer of this.peers.values()) {
      peer.close();
    }
    this.peers.clear();

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_leave',
        payload: { id: this.playerId },
      });
      await this.channel.untrack();

      // Check remaining presence after untracking
      const presenceState = this.channel.presenceState();
      let remaining = 0;
      for (const key of Object.keys(presenceState)) {
        remaining += presenceState[key].length;
      }
      // Sync final count (including 0 for cleanup)
      await syncRoomPresence(this.roomId, remaining);

      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
