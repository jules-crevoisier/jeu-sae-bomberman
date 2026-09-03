import { hasBlockingErrors, LAYER_LABELS, type BrushId, type EditorLayerId, type ValidationIssue } from '@bomberman/level-schema';
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

export function StatusBar({ width, height, hover, brush, layer, issues }: StatusBarProps): JSX.Element {
  const errors = hasBlockingErrors(issues);
  return (
    <div className="status">
      <span>
        <b>{width}×{height}</b>
        {' · '}
        {hover ? `${hover.x}, ${hover.y}` : 'grille'}
        {' · '}
        {LAYER_LABELS[layer]}
        {' · '}
        <SelectedHint brush={brush} />
      </span>
      <span className={errors ? 'issue-bad' : 'issue-ok'}>
        {errors ? issues[0]?.message : 'Prêt pour Unity'}
      </span>
    </div>
  );
}
