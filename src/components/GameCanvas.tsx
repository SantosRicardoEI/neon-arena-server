import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine';
import { createInputState, setupInput } from '@/game/input';
import { PlayerSkin } from '@/game/types';

interface GameCanvasProps {
  playerId: string;
  playerName: string;
  roomId: string;
  playerColor: string;
  playerSkin: PlayerSkin;
  mode: "solo" | "online";
}

const GameCanvas = ({
  playerId,
  playerName,
  roomId,
  playerColor,
  playerSkin,
  mode,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log("[GameCanvas] mount", {
      playerId,
      playerName,
      roomId,
      playerColor,
      playerSkin,
      mode,
    });

    const input = createInputState();
    const cleanupInput = setupInput(canvas, input);

    const engine = new GameEngine(
      canvas,
      input,
      playerId,
      playerName,
      roomId,
      playerColor,
      playerSkin,
      mode
    );

    engineRef.current = engine;
    engine.start();

    const handleUnload = () => {
      engine.stop();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      console.log("[GameCanvas] cleanup");
      window.removeEventListener('beforeunload', handleUnload);
      cleanupInput();
      engine.stop();
      engineRef.current = null;
    };
  }, [playerId, playerName, roomId, playerColor, playerSkin, mode]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair"
      style={{ background: 'hsl(240, 10%, 4%)' }}
    />
  );
};

export default GameCanvas;