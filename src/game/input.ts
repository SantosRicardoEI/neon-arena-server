import { InputState } from './types';

export function createInputState(): InputState {
  return {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    canvasRect: null,
  };
}

export function setupInput(canvas: HTMLCanvasElement, input: InputState): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    input.keys.add(e.key.toLowerCase());
    // Prevent scrolling
    if (['w', 'a', 's', 'd', ' ', 'r', 'f'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    input.keys.delete(e.key.toLowerCase());
  };
  const onMouseMove = (e: MouseEvent) => {
    input.canvasRect = canvas.getBoundingClientRect();
    input.mouseX = e.clientX - input.canvasRect.left;
    input.mouseY = e.clientY - input.canvasRect.top;
  };
  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) input.mouseDown = true;
  };
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) input.mouseDown = false;
  };
  const onContextMenu = (e: MouseEvent) => e.preventDefault();
  const onBlur = () => {
    input.keys.clear();
    input.mouseDown = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', onBlur);
  };
}
