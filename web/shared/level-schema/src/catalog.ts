/** Catalog of every placeable ID Unity can spawn from a custom level JSON. */

import type { CatalogItem, ObjectId, PlaceableId, TileId } from './types.ts';

const TILE_SPRITE_SIZE = 16;

export const CATALOG: readonly CatalogItem[] = [
  {
    id: 'floor',
    kind: 'tile',
    group: 'terrain',
    label: 'Pierre',
    shortLabel: 'Pierre',
    unityId: 'Blocks_Stone',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'blocks', x: 32, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#8d8d96',
  },
  {
    id: 'ice', kind: 'tile', group: 'terrain', label: 'Glace', shortLabel: 'Glace', unityId: 'Blocks_Ice', unique: false, walkable: true, blocksMovement: false,
    sprite: { sheet: 'blocks', x: 0, y: 16, size: TILE_SPRITE_SIZE, rotate: 0, tint: null }, fallbackColor: '#a9e5f5',
  },
  {
    id: 'solid',
    kind: 'tile',
    group: 'terrain',
    label: 'Mur',
    shortLabel: 'Mur',
    unityId: 'Blocks_Solid',
    unique: false,
    walkable: false,
    blocksMovement: true,
    sprite: { sheet: 'blocks', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#1c1c22',
  },
  {
    id: 'crate',
    kind: 'tile',
    group: 'terrain',
    label: 'Bois',
    shortLabel: 'Bois',
    unityId: 'Blocks_Wood',
    unique: false,
    walkable: false,
    blocksMovement: true,
    sprite: { sheet: 'blocks', x: 16, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#c46a28',
  },
  {
    id: 'spawn_p1',
    kind: 'spawn',
    group: 'spawns',
    label: 'Spawn joueur 1',
    shortLabel: 'Joueur 1',
    unityId: 'BomberRat_P1',
    unique: true,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'rat', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: '#3d7ae2' },
    fallbackColor: '#3d7ae2',
  },
  {
    id: 'spawn_p2',
    kind: 'spawn',
    group: 'spawns',
    label: 'Spawn joueur 2',
    shortLabel: 'Joueur 2',
    unityId: 'BomberRat_P2',
    unique: true,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'rat', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: '#e28a2a' },
    fallbackColor: '#e28a2a',
  },
  {
    id: 'conveyor_up',
    kind: 'hazard',
    group: 'hazards',
    label: 'Tapis haut',
    shortLabel: 'Haut',
    unityId: 'ConveyorBelt',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'conveyor', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 90, tint: null },
    fallbackColor: '#5c6570',
  },
  {
    id: 'conveyor_down',
    kind: 'hazard',
    group: 'hazards',
    label: 'Tapis bas',
    shortLabel: 'Bas',
    unityId: 'ConveyorBelt',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'conveyor', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 270, tint: null },
    fallbackColor: '#5c6570',
  },
  {
    id: 'conveyor_left',
    kind: 'hazard',
    group: 'hazards',
    label: 'Tapis gauche',
    shortLabel: 'Gauche',
    unityId: 'ConveyorBelt',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'conveyor', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#5c6570',
  },
  {
    id: 'conveyor_right',
    kind: 'hazard',
    group: 'hazards',
    label: 'Tapis droite',
    shortLabel: 'Droite',
    unityId: 'ConveyorBelt',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'conveyor', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 180, tint: null },
    fallbackColor: '#5c6570',
  },
  ...([
    ['red', '#ef3434'], ['purple', '#a54ce0'], ['blue', '#3d7ae2'], ['cyan', '#2abed0'], ['green', '#4bbd62'], ['orange', '#e28a2a'],
  ] as const).map(([color, tint]) => ({
    id: `teleporter_${color}` as ObjectId, kind: 'hazard' as const, group: 'hazards' as const, label: `Portail ${color}`, shortLabel: color, unityId: 'Teleporter', unique: false, walkable: true, blocksMovement: false,
    sprite: { sheet: 'teleporter' as const, x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0 as const, tint }, fallbackColor: tint,
  })),
  {
    id: 'powerup_fire',
    kind: 'powerup',
    group: 'powerups',
    label: 'Bonus portée',
    shortLabel: 'Feu',
    unityId: 'PowerUpFireRange',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'powerups', x: 0, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#e8b423',
  },
  {
    id: 'powerup_bomb',
    kind: 'powerup',
    group: 'powerups',
    label: 'Bonus bombes',
    shortLabel: 'Bombe',
    unityId: 'PowerUpBombPlus',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'powerups', x: 16, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#6b6b72',
  },
  {
    id: 'powerup_spike',
    kind: 'powerup',
    group: 'powerups',
    label: 'Bonus piques',
    shortLabel: 'Piques',
    unityId: 'PowerUpSpikeBomb',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'powerups', x: 32, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#7b4aa8',
  },
  {
    id: 'powerup_control',
    kind: 'powerup',
    group: 'powerups',
    label: 'Bonus détonateur',
    shortLabel: 'Remote',
    unityId: 'PowerUpBombControl',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'powerups', x: 48, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#2aa8b8',
  },
  {
    id: 'powerup_kick',
    kind: 'powerup',
    group: 'powerups',
    label: 'Bonus kick',
    shortLabel: 'Kick',
    unityId: 'PowerUpKick',
    unique: false,
    walkable: true,
    blocksMovement: false,
    sprite: { sheet: 'powerups', x: 64, y: 0, size: TILE_SPRITE_SIZE, rotate: 0, tint: null },
    fallbackColor: '#8a5a32',
  },
] as const;

const catalogById = new Map<PlaceableId, CatalogItem>(
  CATALOG.map((item) => [item.id, item]),
);

export function getCatalogItem(id: PlaceableId): CatalogItem {
  const item = catalogById.get(id);
  if (!item) {
    throw new Error(`Unknown placeable id: ${id}`);
  }
  return item;
}

export function isTileId(id: string): id is TileId {
  return id === 'floor' || id === 'ice' || id === 'solid' || id === 'crate';
}

export function isObjectId(id: string): id is ObjectId {
  return catalogById.get(id as PlaceableId)?.kind !== 'tile' && catalogById.has(id as PlaceableId);
}

export function isPlaceableId(id: string): id is PlaceableId {
  return catalogById.has(id as PlaceableId);
}

export const CATALOG_GROUPS: readonly CatalogItem['group'][] = [
  'terrain',
  'spawns',
  'hazards',
];

export const GROUP_LABELS: Record<CatalogItem['group'], string> = {
  terrain: 'Terrain',
  spawns: 'Joueurs',
  hazards: 'Tapis',
  powerups: 'Bonus',
};

export const EDITOR_CATALOG = CATALOG.filter((item) => item.kind !== 'powerup');
