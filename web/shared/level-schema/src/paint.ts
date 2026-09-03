/** Paint and erase rules, scoped to one editor layer at a time. */

import { getCatalogItem, isObjectId, isTileId } from './catalog.ts';
import { cellBlocksMovement, cloneCell, cloneCells, inBounds, replaceCell, withLayerTile } from './grid.ts';
import { brushBelongsToLayer, isTerrainLayer, LAYER_DEFAULT_BRUSH } from './layers.ts';
import type {
  BrushId,
  EditorLayerId,
  GridCell,
  LevelDocument,
  ObjectId,
  PaintResult,
  TerrainLayerId,
  TileId,
} from './types.ts';

function clearUniqueObject(cells: readonly GridCell[], objectId: ObjectId): GridCell[] {
  let changed = false;
  const next = cells.map((cell) => {
    if (cell.objectId !== objectId) {
      return cell;
    }
    changed = true;
    return { ...cloneCell(cell), objectId: null };
  });

  return changed ? next : (cells as GridCell[]);
}

function resolveTerrainLayer(tile: TileId, layer?: EditorLayerId): TerrainLayerId {
  if (layer && isTerrainLayer(layer)) {
    return layer;
  }
  if (tile === 'solid' || tile === 'crate') {
    return tile;
  }
  return 'ground';
}

function isConveyor(objectId: ObjectId): boolean {
  return objectId.startsWith('conveyor_');
}

function isTeleporter(objectId: ObjectId): boolean {
  return objectId.startsWith('teleporter_');
}

export function canPlaceObject(cell: GridCell, objectId: ObjectId): boolean {
  if (getCatalogItem(objectId).kind === 'tile') {
    return false;
  }
  // Conveyors sit beneath crates, but cannot exist inside a solid wall.
  if (isConveyor(objectId)) {
    return cell.solid === null;
  }
  return !cellBlocksMovement(cell);
}

export function applyBrush(
  document: LevelDocument,
  x: number,
  y: number,
  brush: BrushId,
  layer?: EditorLayerId,
): PaintResult {
  if (!inBounds(document.width, document.height, x, y)) {
    return { cells: document.cells, changed: false };
  }

  const current = document.cells[y * document.width + x];
  if (!current) {
    return { cells: document.cells, changed: false };
  }

  if (brush === 'erase') {
    return layer ? eraseLayer(document, x, y, layer) : eraseCell(document, x, y);
  }

  if (layer && !brushBelongsToLayer(brush, layer)) {
    return { cells: document.cells, changed: false };
  }

  if (isTileId(brush)) {
    return paintTile(document, x, y, brush, layer);
  }

  if (isObjectId(brush)) {
    return paintObject(document, x, y, brush);
  }

  return { cells: document.cells, changed: false };
}

export function paintTile(
  document: LevelDocument,
  x: number,
  y: number,
  tile: TileId,
  layer?: EditorLayerId,
): PaintResult {
  const current = document.cells[y * document.width + x];
  if (!current) {
    return { cells: document.cells, changed: false };
  }

  const target = resolveTerrainLayer(tile, layer);
  if (current[target] === tile) {
    return { cells: document.cells, changed: false };
  }

  let next = withLayerTile(current, target, tile);

  // Mutual exclusion: solid and crate cannot coexist
  if (target === 'solid' && next.crate !== null) {
    next = { ...next, crate: null };
  } else if (target === 'crate' && next.solid !== null) {
    next = { ...next, solid: null };
  }

  // Conveyor belts cannot be on a solid block
  if (target === 'solid' && next.objectId !== null && isConveyor(next.objectId as ObjectId)) {
    next = { ...next, objectId: null };
  }

  const cells = replaceCell(document.cells, document.width, x, y, next);
  return { cells, changed: cells !== document.cells };
}

function paintObject(document: LevelDocument, x: number, y: number, objectId: ObjectId): PaintResult {
  const current = document.cells[y * document.width + x];
  if (!current) {
    return { cells: document.cells, changed: false };
  }

  if (!canPlaceObject(current, objectId) || current.objectId === objectId) {
    return { cells: document.cells, changed: false };
  }

  if (isTeleporter(objectId) && document.cells.filter((cell) => cell.objectId === objectId).length >= 2) {
    return { cells: document.cells, changed: false };
  }

  let cells = document.cells;
  if (getCatalogItem(objectId).unique) {
    cells = clearUniqueObject(cells, objectId);
  }

  cells = replaceCell(cells, document.width, x, y, { ...cloneCell(current), objectId });
  return { cells, changed: cells !== document.cells };
}

export function eraseCell(document: LevelDocument, x: number, y: number): PaintResult {
  const current = document.cells[y * document.width + x];
  if (!current) {
    return { cells: document.cells, changed: false };
  }

  if (current.objectId) {
    const cells = replaceCell(document.cells, document.width, x, y, { ...cloneCell(current), objectId: null });
    return { cells, changed: true };
  }

  if (current.crate) {
    const cells = replaceCell(document.cells, document.width, x, y, { ...cloneCell(current), crate: null });
    return { cells, changed: true };
  }

  if (current.solid) {
    const cells = replaceCell(document.cells, document.width, x, y, { ...cloneCell(current), solid: null });
    return { cells, changed: true };
  }

  return { cells: document.cells, changed: false };
}

export function eraseLayer(
  document: LevelDocument,
  x: number,
  y: number,
  layer: EditorLayerId,
): PaintResult {
  const current = document.cells[y * document.width + x];
  if (!current) {
    return { cells: document.cells, changed: false };
  }

  const next = cloneCell(current);
  if (isTerrainLayer(layer)) {
    if (layer === 'ground') {
      // Ground layer cannot have holes — reset to floor
      if (next.ground === 'floor') {
        return { cells: document.cells, changed: false };
      }
      next.ground = 'floor';
    } else {
      if (next[layer] === null) {
        return { cells: document.cells, changed: false };
      }
      next[layer] = null;
    }
  } else if (current.objectId) {
    next.objectId = null;
  } else {
    return { cells: document.cells, changed: false };
  }

  const cells = replaceCell(document.cells, document.width, x, y, next);
  return { cells, changed: cells !== document.cells };
}

export function pickBrush(cell: GridCell, layer?: EditorLayerId): BrushId {
  if (layer && isTerrainLayer(layer)) {
    return cell[layer] ?? LAYER_DEFAULT_BRUSH[layer];
  }
  if (layer === 'objects') {
    return cell.objectId ?? 'spawn_p1';
  }
  return cell.objectId ?? cell.crate ?? cell.solid ?? cell.ground ?? 'floor';
}

export function applyBrushStroke(
  document: LevelDocument,
  points: ReadonlyArray<{ x: number; y: number }>,
  brush: BrushId,
  layer?: EditorLayerId,
): PaintResult {
  let cells = document.cells;
  let changed = false;

  for (const point of points) {
    const result = applyBrush({ ...document, cells }, point.x, point.y, brush, layer);
    if (result.changed) {
      cells = result.cells;
      changed = true;
    }
  }

  return { cells: changed ? cloneCells(cells) : document.cells, changed };
}
