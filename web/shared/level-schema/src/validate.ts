/** Level sanity checks for the editor and for Unity import later. */

import { getCatalogItem } from './catalog.ts';
import { getCell } from './grid.ts';
import type { LevelDocument, ValidationIssue } from './types.ts';

export function validateLevel(document: LevelDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let spawnCount = 0;
  let walkableCount = 0;
  let missingBorder = false;

  for (let y = 0; y < document.height; y += 1) {
    for (let x = 0; x < document.width; x += 1) {
      const cell = getCell(document, x, y);
      if (!cell) {
        continue;
      }

      const isBorder =
        x === 0 || y === 0 || x === document.width - 1 || y === document.height - 1;
      if (isBorder && cell.solid === null) {
        missingBorder = true;
      }

      if (!cell.solid && !cell.crate) {
        walkableCount += 1;
      }

      if (!cell.objectId) {
        continue;
      }

      const object = getCatalogItem(cell.objectId);
      if (object.kind === 'spawn') {
        spawnCount += 1;
      }

      if (cell.solid !== null || cell.crate !== null) {
        issues.push({
          code: 'blocked_object',
          message: `${object.label} est sur une case bloquée`,
          x,
          y,
          severity: 'error',
        });
      }
    }
  }

  if (spawnCount === 0) {
    issues.push({
      code: 'missing_spawn',
      message: 'Place au moins un spawn (J1 ou J2)',
      severity: 'error',
    });
  }

  if (walkableCount === 0) {
    issues.push({
      code: 'no_walkable',
      message: 'Aucune case praticable',
      severity: 'error',
    });
  }

  if (missingBorder) {
    issues.push({
      code: 'open_border',
      message: 'Le contour n’est pas entièrement en murs solides',
      severity: 'warning',
    });
  }

  return issues;
}

export function hasBlockingErrors(issues: readonly ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
