/** Parse a Unity-facing JSON level back into an editor document. */

import { isObjectId, isPlaceableId, isTileId } from './catalog.ts';
import { createEmptyDocument, inBounds } from './grid.ts';
import { isEditorLayerId } from './layers.ts';
import { applyBrush } from './paint.ts';
import {
  CELL_SIZE,
  LEVEL_FORMAT_VERSION,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  type ExportedLevel,
  type LevelDocument,
  type LevelObject,
} from './types.ts';

export class LevelImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelImportError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new LevelImportError(`${field} must be an integer`);
  }
  if (value < MIN_GRID_SIZE || value > MAX_GRID_SIZE) {
    throw new LevelImportError(`${field} must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}`);
  }
  return value;
}

function parseObject(value: unknown, index: number): LevelObject {
  if (!isRecord(value)) {
    throw new LevelImportError(`objects[${index}] must be an object`);
  }
  if (typeof value.id !== 'string' || !isPlaceableId(value.id)) {
    throw new LevelImportError(`objects[${index}].id is unknown: ${String(value.id)}`);
  }
  if (typeof value.x !== 'number' || !Number.isInteger(value.x)) {
    throw new LevelImportError(`objects[${index}].x must be an integer`);
  }
  if (typeof value.y !== 'number' || !Number.isInteger(value.y)) {
    throw new LevelImportError(`objects[${index}].y must be an integer`);
  }

  const layer =
    typeof value.layer === 'string' && isEditorLayerId(value.layer) ? value.layer : undefined;

  return { id: value.id, x: value.x, y: value.y, layer };
}

export function parseExportedLevel(raw: unknown): ExportedLevel {
  if (!isRecord(raw)) {
    throw new LevelImportError('Level JSON must be an object');
  }

  const version = raw.version === undefined ? LEVEL_FORMAT_VERSION : raw.version;
  if (version !== LEVEL_FORMAT_VERSION) {
    throw new LevelImportError(`Unsupported version: ${String(version)}`);
  }

  if (typeof raw.name !== 'string') {
    throw new LevelImportError('name must be a string');
  }

  const width = readPositiveInt(raw.width, 'width');
  const height = readPositiveInt(raw.height, 'height');

  if (!Array.isArray(raw.objects)) {
    throw new LevelImportError('objects must be an array');
  }

  const objects = raw.objects.map(parseObject);

  return {
    version: LEVEL_FORMAT_VERSION,
    name: raw.name,
    width,
    height,
    cellSize: CELL_SIZE,
    origin: 'bottom-left',
    objects,
  };
}

export function documentFromExport(exported: ExportedLevel): LevelDocument {
  let document = createEmptyDocument(exported.name, exported.width, exported.height);
  const tiles = exported.objects.filter((item) => isTileId(item.id));
  const objects = exported.objects.filter((item) => isObjectId(item.id));
  const layerOrder: Record<string, number> = { ground: 0, solid: 1, crate: 2, objects: 3 };
  tiles.sort((left, right) => (layerOrder[left.layer ?? ''] ?? 0) - (layerOrder[right.layer ?? ''] ?? 0));

  for (const item of [...tiles, ...objects]) {
    if (!inBounds(document.width, document.height, item.x, item.y)) {
      throw new LevelImportError(`Object ${item.id} is outside the grid at ${item.x},${item.y}`);
    }
    const result = applyBrush(document, item.x, item.y, item.id, item.layer);
    document = { ...document, cells: result.cells };
  }

  return document;
}

export function importLevelJson(text: string): LevelDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new LevelImportError('Invalid JSON');
  }

  return documentFromExport(parseExportedLevel(parsed));
}
