import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine';
import { createInputState, setupInput } from '@/game/input';
import { PlayerSkin } from '@/game/types';
import { useState } from 'react';
import DevSpawnPanel from '@/gameplay/dev/DevSpawnPanel';
import type { DevSpawnCategory, DevSpawnOptionId } from '@/gameplay/dev/types';

interface GameCanvasProps {
  playerId: string;
  playerName: string;
  roomId: string;
  playerColor: string;
  playerSkin: PlayerSkin;
  mode: "solo" | "online" | "dev_test";
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

  const [devSelectedCategory, setDevSelectedCategory] = useState<DevSpawnCategory>('enemy');
  const [devSelectedOptionId, setDevSelectedOptionId] = useState<DevSpawnOptionId | null>(null);

    const handleSelectCategory = (category: DevSpawnCategory) => {
    setDevSelectedCategory(category);
    setDevSelectedOptionId(null);
    engineRef.current?.setDevSpawnSelection(category, null);
  };

  const handleSelectOption = (category: DevSpawnCategory, optionId: DevSpawnOptionId) => {
    setDevSelectedCategory(category);
    setDevSelectedOptionId(optionId);
    engineRef.current?.setDevSpawnSelection(category, optionId);
  };

  const handleClearDevWorld = () => {
    engineRef.current?.clearDevWorld();
  };

  useEffect(() => {
  if (mode !== 'dev_test') return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;

    setDevSelectedOptionId(null);
    engineRef.current?.clearDevSpawnSelection();
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [mode]);

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
    if (mode === 'dev_test') {
      engine.setDevSpawnSelection(devSelectedCategory, devSelectedOptionId);
    }
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

  const canvasCursorClass =
  mode === 'dev_test' && devSelectedOptionId
    ? 'cursor-copy'
    : 'cursor-crosshair';

        const handleDeselect = () => {
      setDevSelectedOptionId(null);
      engineRef.current?.setDevSpawnSelection(devSelectedCategory, null);
    };

  return (
    <div className="relative w-full h-full">
      {mode === 'dev_test' && (
        <DevSpawnPanel
          selectedCategory={devSelectedCategory}
          selectedOptionId={devSelectedOptionId}
          onSelectCategory={handleSelectCategory}
          onSelectOption={handleSelectOption}
          onClear={handleClearDevWorld}
          onDeselect={handleDeselect}
        />
      )}

      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${canvasCursorClass}`}
        style={{ background: 'hsl(240, 10%, 4%)' }}
      />
    </div>
  );
};



export default GameCanvas;