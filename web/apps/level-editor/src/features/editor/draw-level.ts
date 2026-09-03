import { getCatalogItem, layerForPlaceable, type EditorLayerId, type LevelDocument } from '@bomberman/level-schema';
import { CELL_PX, type Camera } from './camera.ts';
import type { LayerViews } from './editor-state.ts';
import { drawSprite, type SheetMap } from './sprites.ts';

const INACTIVE_ALPHA = 0.42;

interface DrawLevelOptions {
  hover: { x: number; y: number } | null;
  layers: LayerViews;
  activeLayer: EditorLayerId;
}

function layerAlpha(layer: EditorLayerId, layers: LayerViews, activeLayer: EditorLayerId): number {
  if (!layers[layer].visible) {
    return 0;
  }
  return layer === activeLayer ? 1 : INACTIVE_ALPHA;
}

export function drawLevel(
  context: CanvasRenderingContext2D,
  document: LevelDocument,
  camera: Camera,
  sheets: SheetMap | null,
  options: DrawLevelOptions,
): void {
  context.imageSmoothingEnabled = false;
  const cell = CELL_PX * camera.scale;
  const groundAlpha = layerAlpha('ground', options.layers, options.activeLayer);
  const solidAlpha = layerAlpha('solid', options.layers, options.activeLayer);
  const crateAlpha = layerAlpha('crate', options.layers, options.activeLayer);

  for (let y = 0; y < document.height; y += 1) {
    for (let x = 0; x < document.width; x += 1) {
      const gridCell = document.cells[y * document.width + x];
      if (!gridCell) {
        continue;
      }
      const screenX = camera.x + x * cell;
      const screenY = camera.y + (document.height - 1 - y) * cell;
      context.fillStyle = (x + y) % 2 === 0 ? '#2c241c' : '#211a14';
      context.fillRect(screenX, screenY, cell, cell);

      if (gridCell.ground && groundAlpha > 0) {
        context.globalAlpha = groundAlpha;
        drawSprite(context, sheets, getCatalogItem(gridCell.ground), screenX, screenY, cell);
        context.globalAlpha = 1;
      }
      if (gridCell.solid && solidAlpha > 0) {
        context.globalAlpha = solidAlpha;
        drawSprite(context, sheets, getCatalogItem(gridCell.solid), screenX, screenY, cell);
        context.globalAlpha = 1;
      }
      if (gridCell.crate && crateAlpha > 0) {
        context.globalAlpha = crateAlpha;
        drawSprite(context, sheets, getCatalogItem(gridCell.crate), screenX, screenY, cell);
        context.globalAlpha = 1;
      }

      if (!gridCell.objectId) {
        continue;
      }
      const item = getCatalogItem(gridCell.objectId);
      const objectAlpha = layerAlpha(layerForPlaceable(item.id), options.layers, options.activeLayer);
      if (objectAlpha <= 0) {
        continue;
      }
      context.globalAlpha = objectAlpha;
      drawSprite(context, sheets, item, screenX, screenY, cell);
      if (item.kind === 'spawn') {
        drawSpawnBadge(context, screenX, screenY, cell, item.id === 'spawn_p2' ? 'J2' : 'J1', item.fallbackColor);
      }
      context.globalAlpha = 1;
    }
  }

  context.strokeStyle = 'rgba(246, 234, 212, 0.22)';
  context.lineWidth = 1;
  for (let x = 0; x <= document.width; x += 1) {
    const lineX = Math.round(camera.x + x * cell) + 0.5;
    context.beginPath();
    context.moveTo(lineX, camera.y);
    context.lineTo(lineX, camera.y + document.height * cell);
    context.stroke();
  }
  for (let y = 0; y <= document.height; y += 1) {
    const lineY = Math.round(camera.y + y * cell) + 0.5;
    context.beginPath();
    context.moveTo(camera.x, lineY);
    context.lineTo(camera.x + document.width * cell, lineY);
    context.stroke();
  }

  if (options.hover) {
    const hoverX = camera.x + options.hover.x * cell;
    const hoverY = camera.y + (document.height - 1 - options.hover.y) * cell;
    context.fillStyle = 'rgba(240, 193, 75, 0.28)';
    context.fillRect(hoverX, hoverY, cell, cell);
    context.strokeStyle = '#f0c14b';
    context.lineWidth = Math.max(2, camera.scale);
    context.strokeRect(hoverX + 1, hoverY + 1, cell - 2, cell - 2);
  }
}

function drawSpawnBadge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  label: string,
  color: string,
): void {
  const badge = Math.max(12, size * 0.38);
  context.fillStyle = color;
  context.fillRect(x + 2, y + 2, badge * 1.6, badge * 0.72);
  context.fillStyle = '#fff8e8';
  context.font = `700 ${Math.max(9, badge * 0.38)}px Sora, sans-serif`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(label, x + 6, y + 2 + badge * 0.36);
}
