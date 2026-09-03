/** Editor layers are stacks. Any tile can be painted on Fond, Solides, or Caisses. */

import { EDITOR_CATALOG, isTileId } from './catalog.ts';
import type { BrushId, CatalogItem, EditorLayerId, ObjectId, PlaceableId } from './types.ts';
import { EDITOR_LAYER_IDS } from './types.ts';

export { EDITOR_LAYER_IDS };

export const LAYER_LABELS: Record<EditorLayerId, string> = {
  ground: 'Fond',
  solid: 'Solides',
  crate: 'Caisses',
  objects: 'Objets',
};

export const LAYER_ICON_ID: Record<EditorLayerId, PlaceableId> = {
  ground: 'floor',
  solid: 'solid',
  crate: 'crate',
  objects: 'spawn_p1',
};

export const LAYER_DEFAULT_BRUSH: Record<EditorLayerId, BrushId> = {
  ground: 'floor',
  solid: 'solid',
  crate: 'crate',
  objects: 'spawn_p1',
};

export function isTerrainLayer(layer: EditorLayerId): layer is 'ground' | 'solid' | 'crate' {
  return layer === 'ground' || layer === 'solid' || layer === 'crate';
}

export function defaultLayerForPlaceable(id: PlaceableId): EditorLayerId {
  if (id === 'floor') {
    return 'ground';
  }
  if (id === 'solid') {
    return 'solid';
  }
  if (id === 'crate') {
    return 'crate';
  }
  return 'objects';
}

export function layerForPlaceable(id: PlaceableId): EditorLayerId {
  return defaultLayerForPlaceable(id);
}

export function layerForBrush(brush: BrushId, currentLayer?: EditorLayerId): EditorLayerId | null {
  if (brush === 'erase') {
    return null;
  }
  if (isTileId(brush)) {
    return currentLayer && isTerrainLayer(currentLayer) ? currentLayer : defaultLayerForPlaceable(brush);
  }
  return 'objects';
}

export function brushBelongsToLayer(brush: BrushId, layer: EditorLayerId): boolean {
  if (brush === 'erase') {
    return true;
  }
  if (isTileId(brush)) {
    return isTerrainLayer(layer);
  }
  return layer === 'objects';
}

export function objectBelongsToLayer(objectId: ObjectId, layer: EditorLayerId): boolean {
  return layer === 'objects' && defaultLayerForPlaceable(objectId) === 'objects';
}

/** Each terrain layer only accepts its own tile type. */
const LAYER_TILE: Record<string, string> = {
  ground: 'floor',
  solid: 'solid',
  crate: 'crate',
};

export function catalogForLayer(layer: EditorLayerId): CatalogItem[] {
  if (isTerrainLayer(layer)) {
    const tileId = LAYER_TILE[layer];
    return EDITOR_CATALOG.filter((item) => item.kind === 'tile' && item.id === tileId);
  }
  return EDITOR_CATALOG.filter((item) => item.kind === 'spawn' || item.kind === 'hazard');
}

export function isEditorLayerId(value: string): value is EditorLayerId {
  return (EDITOR_LAYER_IDS as readonly string[]).includes(value);
}
