/** Convert an editor document to the Unity-facing JSON payload. */

import { getCatalogItem, isObjectId, isTileId } from './catalog.ts';
import { defaultLayerForPlaceable } from './layers.ts';
import type { EditorLayerId, ExportedLevel, LevelDocument, LevelObject, PlaceableId } from './types.ts';
import { CELL_SIZE, LEVEL_FORMAT_VERSION } from './types.ts';

export interface ExportOptions {
  includeFloor: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeFloor: false,
};

/** An exported object may carry optional w/h for rectangle blobs. */
export interface LevelObjectBlob extends LevelObject {
  w?: number;
  h?: number;
}

function makeKey(id: PlaceableId, layer: EditorLayerId): string {
  return `${id}::${layer}`;
}

/**
 * Compress a flat list of same-position objects into horizontal runs and
 * then into 2-D rectangles where rows are identical.
 */
function compress(flat: Array<LevelObjectBlob>): LevelObjectBlob[] {
  if (flat.length === 0) {
    return flat;
  }

  // Group by key (id + layer) then compress per group
  const groups = new Map<string, LevelObjectBlob[]>();
  for (const obj of flat) {
    const k = makeKey(obj.id, obj.layer as EditorLayerId ?? defaultLayerForPlaceable(obj.id) as EditorLayerId);
    const arr = groups.get(k) ?? [];
    arr.push(obj);
    groups.set(k, arr);
  }

  const result: LevelObjectBlob[] = [];

  for (const items of groups.values()) {
    // Sort by y then x
    items.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

    // Build a set of {x,y} for quick lookup
    const present = new Set(items.map((o) => `${o.x},${o.y}`));

    // Track which cells have been consumed
    const consumed = new Set<string>();

    for (const origin of items) {
      const cellKey = `${origin.x},${origin.y}`;
      if (consumed.has(cellKey)) {
        continue;
      }

      // Find horizontal run width
      let w = 1;
      while (present.has(`${origin.x + w},${origin.y}`) && !consumed.has(`${origin.x + w},${origin.y}`)) {
        w += 1;
      }

      // Try to extend into a rectangle (same run at each next row)
      let h = 1;
      outer: while (true) {
        for (let dx = 0; dx < w; dx += 1) {
          const k2 = `${origin.x + dx},${origin.y + h}`;
          if (!present.has(k2) || consumed.has(k2)) {
            break outer;
          }
        }
        h += 1;
      }

      // Mark all consumed
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          consumed.add(`${origin.x + dx},${origin.y + dy}`);
        }
      }

      const blob: LevelObjectBlob = { ...origin };
      if (w > 1) {
        blob.w = w;
      }
      if (h > 1) {
        blob.h = h;
      }
      result.push(blob);
    }
  }

  // Restore original field order: id, x, y, [w], [h], [layer]
  return result.map(({ id, x, y, w, h, layer }) => {
    const obj: LevelObjectBlob = { id, x, y };
    if (w !== undefined && w > 1) {
      obj.w = w;
    }
    if (h !== undefined && h > 1) {
      obj.h = h;
    }
    if (layer !== undefined) {
      obj.layer = layer;
    }
    return obj;
  });
}

function exportedObject(id: PlaceableId, x: number, y: number, layer: EditorLayerId): LevelObjectBlob {
  if (defaultLayerForPlaceable(id) === layer) {
    return { id, x, y };
  }
  return { id, x, y, layer };
}

export function exportLevel(
  document: LevelDocument,
  options: Partial<ExportOptions> = {},
): ExportedLevel {
  const { includeFloor } = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const flat: LevelObjectBlob[] = [];

  for (let y = 0; y < document.height; y += 1) {
    for (let x = 0; x < document.width; x += 1) {
      const cell = document.cells[y * document.width + x];
      if (!cell) {
        continue;
      }

      if (cell.ground && (includeFloor || cell.ground !== 'floor')) {
        flat.push(exportedObject(cell.ground, x, y, 'ground'));
      }
      if (cell.solid) {
        flat.push(exportedObject(cell.solid, x, y, 'solid'));
      }
      if (cell.crate) {
        flat.push(exportedObject(cell.crate, x, y, 'crate'));
      }
      if (cell.objectId) {
        flat.push(exportedObject(cell.objectId, x, y, 'objects'));
      }
    }
  }

  const objects = compress(flat) as LevelObject[];

  return {
    version: LEVEL_FORMAT_VERSION,
    name: document.name.trim() || 'Nouveau niveau',
    width: document.width,
    height: document.height,
    cellSize: CELL_SIZE,
    origin: 'bottom-left',
    objects,
  };
}

export function serializeLevel(
  document: LevelDocument,
  options: Partial<ExportOptions> = {},
): string {
  return `${JSON.stringify(exportLevel(document, options), null, 2)}\n`;
}

export function describeUnityMapping(id: LevelObject['id']): string {
  if (!isTileId(id) && !isObjectId(id)) {
    return id;
  }
  return getCatalogItem(id).unityId;
}
