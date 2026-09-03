import { describe, expect, it } from 'vitest';
import { applyBrush, pickBrush } from './paint.ts';
import { cellTile, createEmptyDocument } from './grid.ts';
import { floodFill } from './fill.ts';
import { exportLevel } from './export.ts';
import { importLevelJson } from './import.ts';
import { layerForBrush } from './layers.ts';
import { createClassicDocument, createSizedClassicDocument } from './templates.ts';
import { validateLevel } from './validate.ts';

describe('paint', () => {
  it('places a crate on a floor cell without removing the ground', () => {
    const document = createEmptyDocument('test', 5, 5);
    const result = applyBrush(document, 2, 2, 'crate');
    expect(result.changed).toBe(true);
    expect(result.cells[2 * 5 + 2]?.crate).toBe('crate');
    expect(result.cells[2 * 5 + 2]?.ground).toBe('floor');
    expect(cellTile(result.cells[2 * 5 + 2]!)).toBe('crate');
  });

  it('paints wood on the ground layer without switching stacks', () => {
    const document = createEmptyDocument('test', 5, 5);
    const result = applyBrush(document, 2, 2, 'crate', 'ground');
    expect(result.changed).toBe(true);
    expect(result.cells[2 * 5 + 2]?.ground).toBe('crate');
    expect(result.cells[2 * 5 + 2]?.crate).toBeNull();
    expect(layerForBrush('crate', 'ground')).toBe('ground');
  });

  it('paints stone on the crate layer', () => {
    const document = createEmptyDocument('test', 5, 5);
    const result = applyBrush(document, 1, 1, 'floor', 'crate');
    expect(result.cells[1 * 5 + 1]?.crate).toBe('floor');
    expect(result.cells[1 * 5 + 1]?.ground).toBe('floor');
  });

  it('rejects a spawn on a solid wall', () => {
    const walled = applyBrush(createEmptyDocument('test', 5, 5), 1, 1, 'solid');
    const document = { ...createEmptyDocument('test', 5, 5), cells: walled.cells };
    const result = applyBrush(document, 1, 1, 'spawn_p1');
    expect(result.changed).toBe(false);
  });

  it('allows a spawn on a wooden ground', () => {
    const floored = applyBrush(createEmptyDocument('test', 5, 5), 1, 1, 'crate', 'ground');
    const document = { ...createEmptyDocument('test', 5, 5), cells: floored.cells };
    const result = applyBrush(document, 1, 1, 'spawn_p1');
    expect(result.changed).toBe(true);
    expect(result.cells[1 * 5 + 1]?.objectId).toBe('spawn_p1');
    expect(result.cells[1 * 5 + 1]?.ground).toBe('crate');
  });

  it('keeps a unique spawn by moving it', () => {
    let document = createEmptyDocument('test', 7, 7);
    document = { ...document, cells: applyBrush(document, 1, 1, 'spawn_p1').cells };
    document = { ...document, cells: applyBrush(document, 3, 3, 'spawn_p1').cells };
    const first = document.cells[1 * 7 + 1];
    const second = document.cells[3 * 7 + 3];
    expect(first?.objectId).toBeNull();
    expect(second?.objectId).toBe('spawn_p1');
  });

  it('erase removes the object before the tile', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'spawn_p1').cells };
    const once = applyBrush(document, 2, 2, 'erase');
    expect(once.cells[2 * 5 + 2]?.objectId).toBeNull();
    expect(once.cells[2 * 5 + 2]?.ground).toBe('floor');
  });

  it('erases crates without removing the ground', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'crate').cells };
    const erased = applyBrush(document, 2, 2, 'erase', 'crate');
    expect(erased.cells[2 * 5 + 2]?.crate).toBeNull();
    expect(erased.cells[2 * 5 + 2]?.ground).toBe('floor');
  });

  it('erases only the object on the objects layer', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'spawn_p1').cells };
    const erased = applyBrush(document, 2, 2, 'erase', 'objects');
    expect(erased.cells[2 * 5 + 2]?.objectId).toBeNull();
    expect(erased.cells[2 * 5 + 2]?.ground).toBe('floor');
  });

  it('does not erase a conveyor from the crate layer', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'conveyor_right').cells };
    const erased = applyBrush(document, 2, 2, 'erase', 'crate');
    expect(erased.changed).toBe(false);
    expect(erased.cells[2 * 5 + 2]?.objectId).toBe('conveyor_right');
  });

  it('places a conveyor beneath a crate', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'crate').cells };
    const result = applyBrush(document, 2, 2, 'conveyor_right');

    expect(result.changed).toBe(true);
    expect(result.cells[2 * 5 + 2]).toMatchObject({ crate: 'crate', objectId: 'conveyor_right' });
    expect(validateLevel({ ...document, cells: result.cells }).some((issue) => issue.code === 'blocked_object')).toBe(false);
  });

  it('places a teleporter beneath a crate', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 2, 'crate').cells };
    const result = applyBrush(document, 2, 2, 'teleporter_red');

    expect(result.changed).toBe(true);
    expect(result.cells[2 * 5 + 2]).toMatchObject({ crate: 'crate', objectId: 'teleporter_red' });
    expect(validateLevel({ ...document, cells: result.cells }).some((issue) => issue.code === 'blocked_object')).toBe(false);
  });
});

describe('fill', () => {
  it('fills connected floor tiles with crates', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 2, 0, 'solid').cells };
    document = { ...document, cells: applyBrush(document, 2, 1, 'solid').cells };
    document = { ...document, cells: applyBrush(document, 2, 2, 'solid').cells };
    document = { ...document, cells: applyBrush(document, 2, 3, 'solid').cells };
    document = { ...document, cells: applyBrush(document, 2, 4, 'solid').cells };

    const filled = floodFill(document, 0, 0, 'crate');
    expect(filled.cells[0]?.crate).toBe('crate');
    expect(filled.cells[0]?.ground).toBe('floor');
    expect(filled.cells[1]?.crate).toBe('crate');
    expect(filled.cells[3]?.crate).toBeNull();
  });

  it('fills wooden ground without touching the crate layer', () => {
    const document = createEmptyDocument('test', 5, 5);
    const filled = floodFill(document, 0, 0, 'crate', 'ground');
    expect(filled.cells[0]?.ground).toBe('crate');
    expect(filled.cells[1]?.ground).toBe('crate');
    expect(filled.cells[4]?.ground).toBe('crate');
    expect(filled.cells[0]?.crate).toBeNull();
  });

  it('fills connected walkable cells with a conveyor on the objects layer', () => {
    const document = createEmptyDocument('test', 3, 1);
    const filled = floodFill(document, 0, 0, 'conveyor_right', 'objects');
    expect(filled.cells[0]?.objectId).toBe('conveyor_right');
    expect(filled.cells[1]?.objectId).toBe('conveyor_right');
    expect(filled.cells[2]?.objectId).toBe('conveyor_right');
  });
});

describe('export/import', () => {
  it('round-trips object ids and positions', () => {
    let document = createEmptyDocument('Arena', 7, 7);
    document = { ...document, cells: applyBrush(document, 0, 0, 'solid').cells };
    document = { ...document, cells: applyBrush(document, 1, 1, 'spawn_p1').cells };
    document = { ...document, cells: applyBrush(document, 2, 3, 'conveyor_right').cells };

    const json = JSON.stringify(exportLevel(document));
    const imported = importLevelJson(json);

    expect(imported.width).toBe(7);
    expect(imported.height).toBe(7);
    expect(imported.cells[0]?.solid).toBe('solid');
    expect(imported.cells[0]?.ground).toBe('floor');
    expect(imported.cells[1 * 7 + 1]?.objectId).toBe('spawn_p1');
    expect(imported.cells[3 * 7 + 2]?.objectId).toBe('conveyor_right');
  });

  it('omits floor tiles by default', () => {
    const document = createEmptyDocument('Empty', 5, 5);
    const exported = exportLevel(document);
    expect(exported.objects).toHaveLength(0);
    expect(exported.origin).toBe('bottom-left');
  });

  it('exports floor under crates when includeFloor is on', () => {
    // MIN_GRID_SIZE is 5 so we use 5×5
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 1, 1, 'crate').cells };
    const exported = exportLevel(document, { includeFloor: true });
    // RLE may compress floors into blobs; round-trip checks the cell is correct
    const reimported = importLevelJson(JSON.stringify(exported));
    expect(reimported.cells[1 * 5 + 1]?.ground).toBe('floor');
    expect(reimported.cells[1 * 5 + 1]?.crate).toBe('crate');
    // The crate at (1,1) is a single cell, so it's not blobbed
    expect(exported.objects.some((item) => item.id === 'crate' && item.x === 1 && item.y === 1)).toBe(true);
  });

  it('compresses a full block of solid into a single rect blob', () => {
    // MIN_GRID_SIZE is 5, so a 3-requested grid becomes 5×5
    let document = createEmptyDocument('test', 5, 5);
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        document = { ...document, cells: applyBrush(document, x, y, 'solid').cells };
      }
    }
    const exported = exportLevel(document);
    const solidBlobs = exported.objects.filter((item) => item.id === 'solid');
    // Should be a single blob covering the full 5×5
    expect(solidBlobs).toHaveLength(1);
    const blob = solidBlobs[0] as { id: string; x: number; y: number; w?: number; h?: number };
    expect(blob.x).toBe(0);
    expect(blob.y).toBe(0);
    expect(blob.w).toBe(5);
    expect(blob.h).toBe(5);
    // Round-trip: importing the blob restores all 25 cells
    const reimported = importLevelJson(JSON.stringify(exported));
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        expect(reimported.cells[y * 5 + x]?.solid).toBe('solid');
      }
    }
  });

  it('exports a swapped wood floor with an explicit layer', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 1, 1, 'crate', 'ground').cells };
    const exported = exportLevel(document);
    expect(exported.objects).toEqual([{ id: 'crate', x: 1, y: 1, layer: 'ground' }]);
    const imported = importLevelJson(JSON.stringify(exported));
    expect(imported.cells[1 * imported.width + 1]).toEqual({
      ground: 'crate',
      solid: null,
      crate: null,
      objectId: null,
    });
  });

  it('picks the object overlay over the tile', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 1, 1, 'spawn_p2').cells };
    expect(pickBrush(document.cells[1 * 5 + 1]!)).toBe('spawn_p2');
  });

  it('picks the tile currently on the active terrain layer', () => {
    let document = createEmptyDocument('test', 5, 5);
    document = { ...document, cells: applyBrush(document, 1, 1, 'crate', 'ground').cells };
    expect(pickBrush(document.cells[1 * 5 + 1]!, 'ground')).toBe('crate');
  });
});

describe('classic template', () => {
  it('matches the Unity scene size and has both spawns', () => {
    const document = createClassicDocument();
    expect(document.width).toBe(21);
    expect(document.height).toBe(13);
    expect(document.cells[1 * 21 + 1]?.objectId).toBe('spawn_p1');
    expect(document.cells[11 * 21 + 19]?.objectId).toBe('spawn_p2');
    expect(validateLevel(document).filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });

  it('builds small and large as medium ± 5', () => {
    const small = createSizedClassicDocument('small');
    const large = createSizedClassicDocument('large');
    expect(small.width).toBe(16);
    expect(small.height).toBe(8);
    expect(large.width).toBe(26);
    expect(large.height).toBe(18);
  });
});
