/** Classic Bomberman arenas in the three agreed sizes: medium ± 5. */

import { applyBrush } from './paint.ts';
import { createEmptyDocument, replaceCell } from './grid.ts';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, LEVEL_SIZES } from './types.ts';
import type { LevelDocument, ObjectId } from './types.ts';

function setSolid(document: LevelDocument, x: number, y: number): LevelDocument {
  const current = document.cells[y * document.width + x];
  if (!current) {
    return document;
  }

  return {
    ...document,
    cells: replaceCell(document.cells, document.width, x, y, {
      ...current,
      solid: 'solid',
      crate: null,
      objectId: null,
    }),
  };
}

function setCrate(document: LevelDocument, x: number, y: number): LevelDocument {
  const current = document.cells[y * document.width + x];
  if (!current || current.solid) {
    return document;
  }

  return {
    ...document,
    cells: replaceCell(document.cells, document.width, x, y, {
      ...current,
      crate: 'crate',
      objectId: null,
    }),
  };
}

function paintBorder(document: LevelDocument): LevelDocument {
  let next = document;
  for (let x = 0; x < document.width; x += 1) {
    next = setSolid(next, x, 0);
    next = setSolid(next, x, document.height - 1);
  }
  for (let y = 0; y < document.height; y += 1) {
    next = setSolid(next, 0, y);
    next = setSolid(next, document.width - 1, y);
  }
  return next;
}

function paintPillars(document: LevelDocument): LevelDocument {
  let next = document;
  for (let y = 2; y < document.height - 1; y += 2) {
    for (let x = 2; x < document.width - 1; x += 2) {
      next = setSolid(next, x, y);
    }
  }
  return next;
}

function isSpawnSafe(x: number, y: number, spawns: ReadonlyArray<{ x: number; y: number }>): boolean {
  return spawns.some((spawn) => Math.abs(spawn.x - x) + Math.abs(spawn.y - y) <= 2);
}

function placeObject(document: LevelDocument, x: number, y: number, id: ObjectId): LevelDocument {
  const result = applyBrush(document, x, y, id);
  return { ...document, cells: result.cells };
}

export function createClassicDocument(
  name = 'Arène moyenne',
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): LevelDocument {
  let document = paintPillars(paintBorder(createEmptyDocument(name, width, height)));
  const spawns = [
    { x: 1, y: 1, id: 'spawn_p1' as const },
    { x: width - 2, y: height - 2, id: 'spawn_p2' as const },
  ];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const cell = document.cells[y * width + x];
      if (!cell || cell.solid || cell.crate) {
        continue;
      }
      if (isSpawnSafe(x, y, spawns)) {
        continue;
      }
      document = setCrate(document, x, y);
    }
  }

  for (const spawn of spawns) {
    document = placeObject(document, spawn.x, spawn.y, spawn.id);
  }

  return document;
}

export function createSizedClassicDocument(sizeId: (typeof LEVEL_SIZES)[number]['id']): LevelDocument {
  const size = LEVEL_SIZES.find((item) => item.id === sizeId);
  if (!size) {
    return createClassicDocument();
  }
  return createClassicDocument(`Arène ${size.label.toLowerCase()}`, size.width, size.height);
}

export const TEMPLATES = LEVEL_SIZES.map((size) => ({
  id: size.id,
  label: `${size.label} ${size.width}×${size.height}`,
  factory: () => createSizedClassicDocument(size.id),
}));
