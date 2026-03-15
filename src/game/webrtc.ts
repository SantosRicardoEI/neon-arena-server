const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCPeer {
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  readonly remoteId: string;
  private _connected = false;
  private onMessage: (data: any) => void;
  private onDisconnect: () => void;
  onIceCandidate: ((candidate: RTCIceCandidateInit) => void) | null = null;

  constructor(remoteId: string, onMessage: (data: any) => void, onDisconnect: () => void) {
    this.remoteId = remoteId;
    this.onMessage = onMessage;
    this.onDisconnect = onDisconnect;
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.onIceCandidate) {
        this.onIceCandidate(e.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this._connected = false;
        this.onDisconnect();
      }
    };

    // For the answerer (client), handle incoming data channel
    this.pc.ondatachannel = (e) => {
      this.setupChannel(e.channel);
    };
  }

  get connected(): boolean {
    return this._connected;
  }

  // Host creates offer + data channel
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const channel = this.pc.createDataChannel('game', {
      ordered: false,
      maxRetransmits: 0,
    });
    this.setupChannel(channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return this.pc.localDescription!.toJSON();
  }

  // Client handles offer, creates answer
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return this.pc.localDescription!.toJSON();
  }

  // Host handles answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] Failed to add ICE candidate:', e);
    }
  }

  private setupChannel(channel: RTCDataChannel) {
    this.channel = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this._connected = true;
      console.log(`[WebRTC] DataChannel open with ${this.remoteId}`);
    };

    channel.onclose = () => {
      this._connected = false;
      this.onDisconnect();
    };

    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.onMessage(data);
      } catch (err) {
        console.warn('[WebRTC] Failed to parse message:', err);
      }
    };
  }

  send(data: any): void {
    if (this.channel && this.channel.readyState === 'open') {
      try {
        this.channel.send(JSON.stringify(data));
      } catch (e) {
        // Channel might be closing
      }
    }
  }

  close(): void {
    this.channel?.close();
    this.pc.close();
    this._connected = false;
  }
}
