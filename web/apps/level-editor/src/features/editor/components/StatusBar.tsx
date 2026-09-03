import { LAYER_LABELS, type BrushId, type EditorLayerId, type ValidationIssue } from '@bomberman/level-schema';
import type { JSX } from 'react';
import { SelectedHint } from './Palette.tsx';

interface StatusBarProps {
  width: number;
  height: number;
  hover: { x: number; y: number } | null;
  brush: BrushId;
  layer: EditorLayerId;
  issues: ValidationIssue[];
}

export function StatusBar({ width, height, hover, brush, layer }: StatusBarProps): JSX.Element {
  let coordLabel = 'grille';
  if (hover) {
    const cx = hover.x - Math.floor(width / 2);
    const cy = hover.y - Math.floor(height / 2);
    coordLabel = `${cx}, ${cy}`;
  }
  return (
    <div className="status">
      <span>
        <b>{width}×{height}</b>
        {' · '}
        {coordLabel}
        {' · '}
        {LAYER_LABELS[layer]}
        {' · '}
        <SelectedHint brush={brush} />
      </span>
    </div>
  );
}
