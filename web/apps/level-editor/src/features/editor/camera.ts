export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export const CELL_PX = 16;
export const MIN_SCALE = 0.7;
export const MAX_SCALE = 8;

export function fitCamera(
  viewWidth: number,
  viewHeight: number,
  gridWidth: number,
  gridHeight: number,
): Camera {
  const padding = 24;
  const scale = Math.min(
    (viewWidth - padding * 2) / (gridWidth * CELL_PX),
    (viewHeight - padding * 2) / (gridHeight * CELL_PX),
    4,
  );
  const contentWidth = gridWidth * CELL_PX * scale;
  const contentHeight = gridHeight * CELL_PX * scale;
  return {
    x: (viewWidth - contentWidth) / 2,
    y: (viewHeight - contentHeight) / 2,
    scale: Math.max(scale, MIN_SCALE),
  };
}

export function screenToCell(
  camera: Camera,
  gridWidth: number,
  gridHeight: number,
  localX: number,
  localY: number,
): { x: number; y: number } | null {
  const cellSize = CELL_PX * camera.scale;
  const x = Math.floor((localX - camera.x) / cellSize);
  const visualY = Math.floor((localY - camera.y) / cellSize);
  const y = gridHeight - 1 - visualY;
  if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) {
    return null;
  }
  return { x, y };
}

export function zoomAt(camera: Camera, localX: number, localY: number, factor: number): Camera {
  const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, camera.scale * factor));
  const worldX = (localX - camera.x) / camera.scale;
  const worldY = (localY - camera.y) / camera.scale;
  return {
    scale: nextScale,
    x: localX - worldX * nextScale,
    y: localY - worldY * nextScale,
  };
}
