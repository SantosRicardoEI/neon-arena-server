import type { InputState } from './types';

export type ControlKey =
  | string
  | 'mouse_left';

export type ControlAction =
  | 'move_up'
  | 'move_down'
  | 'move_left'
  | 'move_right'
  | 'shoot'
  | 'dash'
  | 'reload'
  | 'respawn'
  | 'chat_open'
  | 'chat_cancel';

export const CONTROLS: Record<ControlAction, ControlKey[]> = {
  move_up: ['w', 'arrowup'],
  move_down: ['s', 'arrowdown'],
  move_left: ['a', 'arrowleft'],
  move_right: ['d', 'arrowright'],

  shoot: ['mouse_left',' '],
  dash: ['shift'],
  reload: ['r'],
  respawn: ['f'],

  chat_open: ['enter'],
  chat_cancel: ['escape'],
};

export function formatControlKey(binding: ControlKey): string {
  switch (binding) {
    case 'mouse_left':
      return 'LEFT CLICK';
    case ' ':
      return 'SPACE';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'shift':
      return 'SHIFT';
    case 'enter':
      return 'ENTER';
    case 'escape':
      return 'ESC';
    default:
      return binding.toUpperCase();
  }
}

export function formatControlBindings(bindings: ControlKey[]): string {
  return bindings.map(formatControlKey).join(' / ');
}

export function getControlDisplayValue(action: ControlAction): string {
  return formatControlBindings(CONTROLS[action]);
}

export function getMovementDisplayValue(): string {
  const up = CONTROLS.move_up;
  const down = CONTROLS.move_down;
  const left = CONTROLS.move_left;
  const right = CONTROLS.move_right;

  const isWasd =
    up.includes('w') &&
    down.includes('s') &&
    left.includes('a') &&
    right.includes('d');

  const isArrows =
    up.includes('arrowup') &&
    down.includes('arrowdown') &&
    left.includes('arrowleft') &&
    right.includes('arrowright');

  if (isWasd && isArrows) {
    return 'WASD / ARROWS';
  }

  if (isWasd) {
    return 'WASD';
  }

  if (isArrows) {
    return 'ARROWS';
  }

  return [
    formatControlBindings(up),
    formatControlBindings(down),
    formatControlBindings(left),
    formatControlBindings(right),
  ].join(' · ');
}

export function isControlPressed(
  input: InputState,
  action: ControlAction,
): boolean {
  const bindings = CONTROLS[action];

  for (const binding of bindings) {
    if (binding === 'mouse_left') {
      if (input.mouseDown) return true;
      continue;
    }

    if (input.keys.has(binding)) {
      return true;
    }
  }

  return false;

}