import { serializeLevel, validateLevel, type BrushId } from '@bomberman/level-schema';
import type { JSX } from 'react';
import { Sheet } from './Sheet.tsx';

interface ExportSheetProps {
  json: string;
  includeFloor: boolean;
  errorCount: number;
  warningCount: number;
  onToggleFloor: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function ExportSheet({
  json,
  includeFloor,
  errorCount,
  warningCount,
  onToggleFloor,
  onCopy,
  onDownload,
  onClose,
}: ExportSheetProps): JSX.Element {
  return (
    <Sheet title="Export JSON" onClose={onClose}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
        Unity reçoit `id`, `x`, `y`. Origine bas-gauche, Y vers le haut.
        {errorCount > 0 ? ` ${errorCount} erreur(s).` : ''}
        {warningCount > 0 ? ` ${warningCount} warning(s).` : ''}
      </p>
      <label className="row" style={{ alignItems: 'center' }}>
        <input type="checkbox" checked={includeFloor} onChange={onToggleFloor} />
        Inclure les tuiles de sol
      </label>
      <textarea className="export-view" readOnly value={json} aria-label="JSON du niveau" />
      <div className="row">
        <button type="button" className="icon-btn" onClick={onCopy}>
          Copier
        </button>
        <button type="button" className="icon-btn primary" onClick={onDownload}>
          Télécharger .json
        </button>
      </div>
    </Sheet>
  );
}

export function buildFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'niveau'}.json`;
}

export function downloadJson(name: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildFileName(name);
  link.click();
  URL.revokeObjectURL(url);
}

interface PreviewArgs {
  document: Parameters<typeof serializeLevel>[0];
  includeFloor: boolean;
}

export function previewJson({ document, includeFloor }: PreviewArgs): string {
  return serializeLevel(document, { includeFloor });
}

export function countIssues(document: PreviewArgs['document']): { errors: number; warnings: number } {
  const issues = validateLevel(document);
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
  };
}

export function parseBrushShortcut(key: string): BrushId | null {
  const map: Record<string, BrushId> = {
    Digit1: 'floor',
    Digit2: 'solid',
    Digit3: 'crate',
    Digit4: 'spawn_p1',
    Digit5: 'spawn_p2',
  };
  return map[key] ?? null;
}
