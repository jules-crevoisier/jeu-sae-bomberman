/** Grid helpers for the Bomberman level document. */

import { isObjectId, isTileId } from './catalog.ts';
import {
  CELL_SIZE,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  LEVEL_FORMAT_VERSION,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  type GridCell,
  type LevelDocument,
  type TerrainLayerId,
  type TileId,
} from './types.ts';

export function clampGridSize(value: number): number {
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(value)));
}

export function createFloorCell(): GridCell {
  return { ground: 'floor', solid: null, crate: null, objectId: null };
}

export function cloneCell(cell: GridCell): GridCell {
  return { ground: cell.ground, solid: cell.solid, crate: cell.crate, objectId: cell.objectId };
}

export function cellsEqual(left: GridCell, right: GridCell): boolean {
  return (
    left.ground === right.ground &&
    left.solid === right.solid &&
    left.crate === right.crate &&
    left.objectId === right.objectId
  );
}

export function cellBlocksMovement(cell: GridCell): boolean {
  return cell.solid !== null || cell.crate !== null;
}

export function cellTile(cell: GridCell): TileId | null {
  return cell.crate ?? cell.solid ?? cell.ground;
}

export function asLayerTile(value: unknown, whenTrue: TileId): TileId | null {
  if (typeof value === 'string' && isTileId(value)) {
    return value;
  }
  if (value === true) {
    return whenTrue;
  }
  return null;
}

export function cellIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

export function inBounds(width: number, height: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function getCell(document: LevelDocument, x: number, y: number): GridCell | null {
  if (!inBounds(document.width, document.height, x, y)) {
    return null;
  }
  return document.cells[cellIndex(document.width, x, y)] ?? null;
}

export function cloneCells(cells: readonly GridCell[]): GridCell[] {
  return cells.map(cloneCell);
}

export function normalizeCell(value: unknown): GridCell {
  if (typeof value !== 'object' || value === null) {
    return createFloorCell();
  }

  const record = value as Record<string, unknown>;
  const objectId = typeof record.objectId === 'string' && isObjectId(record.objectId) ? record.objectId : null;

  if ('ground' in record || 'solid' in record || 'crate' in record) {
    return {
      ground: asLayerTile(record.ground, 'floor'),
      solid: asLayerTile(record.solid, 'solid'),
      crate: asLayerTile(record.crate, 'crate'),
      objectId,
    };
  }

  if (isTileId(String(record.tile))) {
    return {
      ground: 'floor',
      solid: record.tile === 'solid' ? 'solid' : null,
      crate: record.tile === 'crate' ? 'crate' : null,
      objectId,
    };
  }

  return createFloorCell();
}

export function normalizeDocument(document: LevelDocument): LevelDocument {
  return {
    ...document,
    cells: document.cells.map(normalizeCell),
  };
}

export function createEmptyDocument(
  name = 'Nouveau niveau',
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): LevelDocument {
  const safeWidth = clampGridSize(width);
  const safeHeight = clampGridSize(height);
  const cells = Array.from({ length: safeWidth * safeHeight }, createFloorCell);

  return {
    version: LEVEL_FORMAT_VERSION,
    name,
    width: safeWidth,
    height: safeHeight,
    cellSize: CELL_SIZE,
    cells,
  };
}

export function replaceCell(
  cells: readonly GridCell[],
  width: number,
  x: number,
  y: number,
  next: GridCell,
): GridCell[] {
  const index = cellIndex(width, x, y);
  const current = cells[index];
  if (!current || cellsEqual(current, next)) {
    return cells as GridCell[];
  }

  const copy = cloneCells(cells);
  copy[index] = cloneCell(next);
  return copy;
}

export function resizeDocument(
  document: LevelDocument,
  nextWidth: number,
  nextHeight: number,
): LevelDocument {
  const width = clampGridSize(nextWidth);
  const height = clampGridSize(nextHeight);
  const cells = Array.from({ length: width * height }, createFloorCell);
  const copyWidth = Math.min(width, document.width);
  const copyHeight = Math.min(height, document.height);

  for (let y = 0; y < copyHeight; y += 1) {
    for (let x = 0; x < copyWidth; x += 1) {
      const source = document.cells[cellIndex(document.width, x, y)];
      if (source) {
        cells[cellIndex(width, x, y)] = cloneCell(source);
      }
    }
  }

  return { ...document, width, height, cells };
}

export function countObjects(document: LevelDocument, objectId: GridCell['objectId']): number {
  let total = 0;
  for (const cell of document.cells) {
    if (cell.objectId === objectId) {
      total += 1;
    }
  }
  return total;
}

export function withLayerTile(cell: GridCell, layer: TerrainLayerId, tile: TileId | null): GridCell {
  const next = cloneCell(cell);
  next[layer] = tile;
  if (cellBlocksMovement(next)) {
    next.objectId = null;
  }
  return next;
}
