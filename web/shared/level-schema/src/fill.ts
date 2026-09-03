/** Layer-aware flood fill. Terrain fills keep other layers intact. */

import { getCatalogItem, isObjectId, isTileId } from './catalog.ts';
import { cloneCell, cloneCells, inBounds, withLayerTile } from './grid.ts';
import { isTerrainLayer, layerForPlaceable } from './layers.ts';
import { applyBrush, canPlaceObject } from './paint.ts';
import type {
  BrushId,
  EditorLayerId,
  LevelDocument,
  ObjectId,
  PaintResult,
  TerrainLayerId,
  TileId,
} from './types.ts';

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

export function floodFill(
  document: LevelDocument,
  startX: number,
  startY: number,
  brush: BrushId,
  layer?: EditorLayerId,
): PaintResult {
  const fillLayer =
    layer ??
    (brush === 'erase' ? undefined : isTileId(brush) || isObjectId(brush) ? layerForPlaceable(brush) : undefined);

  if (fillLayer && isTerrainLayer(fillLayer) && (brush === 'erase' || isTileId(brush))) {
    return floodTerrain(document, startX, startY, fillLayer, brush === 'erase' ? null : brush);
  }

  if (isObjectId(brush) && !getCatalogItem(brush).unique) {
    return floodFillObject(document, startX, startY, brush, fillLayer);
  }

  return applyBrush(document, startX, startY, brush, fillLayer);
}

function floodTerrain(
  document: LevelDocument,
  startX: number,
  startY: number,
  layer: TerrainLayerId,
  tile: TileId | null,
): PaintResult {
  const start = document.cells[startY * document.width + startX];
  if (!start) {
    return { cells: document.cells, changed: false };
  }

  const match = start[layer];
  if (match === tile) {
    return { cells: document.cells, changed: false };
  }

  const cells = cloneCells(document.cells);
  const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visited = new Set<string>();
  let changed = false;

  while (stack.length > 0) {
    const point = stack.pop();
    if (!point || !inBounds(document.width, document.height, point.x, point.y)) {
      continue;
    }

    const key = `${point.x},${point.y}`;
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const index = point.y * document.width + point.x;
    const cell = cells[index];
    if (!cell || cell[layer] !== match) {
      continue;
    }
    if (layer === 'crate' && Boolean(cell.solid) !== Boolean(start.solid)) {
      continue;
    }

    cells[index] = withLayerTile(cell, layer, tile);
    changed = true;

    for (const direction of DIRECTIONS) {
      stack.push({ x: point.x + direction.x, y: point.y + direction.y });
    }
  }

  return { cells: changed ? cells : document.cells, changed };
}

function floodFillObject(
  document: LevelDocument,
  startX: number,
  startY: number,
  objectId: ObjectId,
  layer?: EditorLayerId,
): PaintResult {
  if (getCatalogItem(objectId).unique) {
    return applyBrush(document, startX, startY, objectId, layer);
  }

  const start = document.cells[startY * document.width + startX];
  if (!start || !canPlaceObject(start, objectId)) {
    return { cells: document.cells, changed: false };
  }

  const cells = cloneCells(document.cells);
  const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visited = new Set<string>();
  let changed = false;

  while (stack.length > 0) {
    const point = stack.pop();
    if (!point || !inBounds(document.width, document.height, point.x, point.y)) {
      continue;
    }

    const key = `${point.x},${point.y}`;
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const index = point.y * document.width + point.x;
    const cell = cells[index];
    if (!cell || !canPlaceObject(cell, objectId) || (cell.objectId && cell.objectId !== objectId)) {
      continue;
    }

    if (cell.objectId !== objectId) {
      cells[index] = { ...cloneCell(cell), objectId };
      changed = true;
    }

    for (const direction of DIRECTIONS) {
      stack.push({ x: point.x + direction.x, y: point.y + direction.y });
    }
  }

  return { cells: changed ? cells : document.cells, changed };
}
