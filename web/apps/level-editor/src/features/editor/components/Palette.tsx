import {
  catalogForLayer,
  getCatalogItem,
  LAYER_LABELS,
  type BrushId,
  type EditorLayerId,
} from '@bomberman/level-schema';
import type { JSX } from 'react';
import type { LayerViews } from '../editor-state.ts';
import { LayerStack } from './LayerStack.tsx';
import { SpriteIcon } from './SpriteIcon.tsx';

interface PaletteProps {
  brush: BrushId;
  activeLayer: EditorLayerId;
  layers: LayerViews;
  exportErrors: string[];
  onSelect: (brush: BrushId) => void;
  onLayer: (layer: EditorLayerId) => void;
  onToggleVisible: (layer: EditorLayerId) => void;
  onToggleLocked: (layer: EditorLayerId) => void;
  onClearLayer: (layer: EditorLayerId) => void;
}

export function Palette({
  brush,
  activeLayer,
  layers,
  exportErrors,
  onSelect,
  onLayer,
  onToggleVisible,
  onToggleLocked,
  onClearLayer,
}: PaletteProps): JSX.Element {
  return (
    <section className="palette" aria-label="Palette d'objets">
      {exportErrors.length > 0 ? (
        <div className="export-errors" role="alert">
          {exportErrors.map((msg) => (
            <p key={msg} className="export-error-line">⚠ {msg}</p>
          ))}
        </div>
      ) : null}
      <p className="group-label">Calques</p>
      <LayerStack
        activeLayer={activeLayer}
        layers={layers}
        onSelect={onLayer}
        onToggleVisible={onToggleVisible}
        onToggleLocked={onToggleLocked}
        onClearLayer={onClearLayer}
      />
      <p className="group-label palette-layer-name">{LAYER_LABELS[activeLayer]}</p>
      <div className="palette-group is-active">
        <div className="chip-row">
          {catalogForLayer(activeLayer).map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="chip"
              aria-pressed={brush === entry.id}
              onClick={() => onSelect(entry.id)}
            >
              <SpriteIcon item={entry} />
              <small>{entry.shortLabel}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SelectedHint({ brush }: { brush: BrushId }): JSX.Element {
  if (brush === 'erase') {
    return <span>Gomme</span>;
  }
  return <span>{getCatalogItem(brush).label}</span>;
}
