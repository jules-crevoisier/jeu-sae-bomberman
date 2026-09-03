/** Shared Bomberman level format consumed by the web editor and later by Unity. */

export const LEVEL_FORMAT_VERSION = 1 as const;

export const DEFAULT_WIDTH = 21;
export const DEFAULT_HEIGHT = 13;
export const SIZE_STEP = 5;
export const MIN_GRID_SIZE = 5;
export const MAX_GRID_SIZE = 40;
export const CELL_SIZE = 1;

export const LEVEL_SIZES = [
  {
    id: 'small',
    label: 'Petite',
    width: DEFAULT_WIDTH - SIZE_STEP,
    height: DEFAULT_HEIGHT - SIZE_STEP,
  },
  {
    id: 'medium',
    label: 'Moyenne',
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  },
  {
    id: 'large',
    label: 'Grande',
    width: DEFAULT_WIDTH + SIZE_STEP,
    height: DEFAULT_HEIGHT + SIZE_STEP,
  },
] as const;

export type LevelSizeId = (typeof LEVEL_SIZES)[number]['id'];

export const TILE_IDS = ['floor', 'solid', 'crate'] as const;
export type TileId = (typeof TILE_IDS)[number];

export const OBJECT_IDS = [
  'spawn_p1',
  'spawn_p2',
  'conveyor_up',
  'conveyor_down',
  'conveyor_left',
  'conveyor_right',
  'powerup_fire',
  'powerup_bomb',
  'powerup_spike',
  'powerup_control',
  'powerup_kick',
] as const;
export type ObjectId = (typeof OBJECT_IDS)[number];

export type PlaceableId = TileId | ObjectId;
export type BrushId = PlaceableId | 'erase';

export const TOOL_IDS = ['paint', 'erase', 'pan'] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export interface GridCell {
  ground: TileId | null;
  solid: TileId | null;
  crate: TileId | null;
  objectId: ObjectId | null;
}

export interface LevelObject {
  id: PlaceableId;
  x: number;
  y: number;
  layer?: EditorLayerId;
}

export interface ExportedLevel {
  version: typeof LEVEL_FORMAT_VERSION;
  name: string;
  width: number;
  height: number;
  cellSize: typeof CELL_SIZE;
  origin: 'bottom-left';
  objects: LevelObject[];
}

export interface LevelDocument {
  version: typeof LEVEL_FORMAT_VERSION;
  name: string;
  width: number;
  height: number;
  cellSize: typeof CELL_SIZE;
  cells: GridCell[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  x?: number;
  y?: number;
  severity: 'error' | 'warning';
}

export interface PaintResult {
  cells: GridCell[];
  changed: boolean;
}

export type CatalogKind = 'tile' | 'spawn' | 'hazard' | 'powerup';
export type CatalogGroup = 'terrain' | 'spawns' | 'hazards' | 'powerups';
export type ConveyorDirection = 'up' | 'down' | 'left' | 'right';

export const EDITOR_LAYER_IDS = ['ground', 'solid', 'crate', 'objects'] as const;
export type EditorLayerId = (typeof EDITOR_LAYER_IDS)[number];
export type TerrainLayerId = 'ground' | 'solid' | 'crate';

export interface CatalogItem {
  id: PlaceableId;
  kind: CatalogKind;
  group: CatalogGroup;
  label: string;
  shortLabel: string;
  unityId: string;
  unique: boolean;
  walkable: boolean;
  blocksMovement: boolean;
  sprite: {
    sheet: 'blocks' | 'rat' | 'conveyor' | 'powerups';
    x: number;
    y: number;
    size: number;
    rotate: 0 | 90 | 180 | 270;
    tint: string | null;
  };
  fallbackColor: string;
}
