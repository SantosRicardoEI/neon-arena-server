import * as C from '../constants';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  w: number,
  h: number,
): void {
  ctx.strokeStyle = C.COLORS.grid;
  ctx.lineWidth = C.GRID_LINE_WIDTH;

  const startX = Math.floor(camX / C.GRID_SIZE) * C.GRID_SIZE;
  const startY = Math.floor(camY / C.GRID_SIZE) * C.GRID_SIZE;

  ctx.beginPath();

  for (let x = startX; x < camX + w + C.GRID_SIZE; x += C.GRID_SIZE) {
    ctx.moveTo(x, camY);
    ctx.lineTo(x, camY + h);
  }

  for (let y = startY; y < camY + h + C.GRID_SIZE; y += C.GRID_SIZE) {
    ctx.moveTo(camX, y);
    ctx.lineTo(camX + w, y);
  }

  ctx.stroke();
}

export function drawWorldBorder(
  ctx: CanvasRenderingContext2D,
  ww: number,
  wh: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
): void {
  ctx.strokeStyle = C.BORDER_COLOR;
  ctx.lineWidth = C.BORDER_LINE_WIDTH;
  ctx.strokeRect(0, 0, ww, wh);

  const gw = C.BORDER_GLOW_WIDTH;
  const maxA = C.BORDER_GLOW_OPACITY;
  const hsl = C.BORDER_GLOW_COLOR;

  if (camX < gw) {
    const grad = ctx.createLinearGradient(0, 0, gw, 0);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.max(0, camY), gw, Math.min(wh, camY + vh) - Math.max(0, camY));
  }

  if (camX + vw > ww - gw) {
    const grad = ctx.createLinearGradient(ww, 0, ww - gw, 0);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(ww - gw, Math.max(0, camY), gw, Math.min(wh, camY + vh) - Math.max(0, camY));
  }

  if (camY < gw) {
    const grad = ctx.createLinearGradient(0, 0, 0, gw);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.max(0, camX), 0, Math.min(ww, camX + vw) - Math.max(0, camX), gw);
  }

  if (camY + vh > wh - gw) {
    const grad = ctx.createLinearGradient(0, wh, 0, wh - gw);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.max(0, camX), wh - gw, Math.min(ww, camX + vw) - Math.max(0, camX), gw);
  }
}