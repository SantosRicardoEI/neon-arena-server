let nextId = 0;

export function genId(): string {
  return `e${nextId++}_${Math.random().toString(36).slice(2, 6)}`;
}