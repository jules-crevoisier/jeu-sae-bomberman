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

function exportedObject(id: PlaceableId, x: number, y: number, layer: EditorLayerId): LevelObject {
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
  const objects: LevelObject[] = [];

  for (let y = 0; y < document.height; y += 1) {
    for (let x = 0; x < document.width; x += 1) {
      const cell = document.cells[y * document.width + x];
      if (!cell) {
        continue;
      }

      if (cell.ground && (includeFloor || cell.ground !== 'floor')) {
        objects.push(exportedObject(cell.ground, x, y, 'ground'));
      }
      if (cell.solid) {
        objects.push(exportedObject(cell.solid, x, y, 'solid'));
      }
      if (cell.crate) {
        objects.push(exportedObject(cell.crate, x, y, 'crate'));
      }
      if (cell.objectId) {
        objects.push(exportedObject(cell.objectId, x, y, 'objects'));
      }
    }
  }

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
