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
  onSelect: (brush: BrushId) => void;
  onLayer: (layer: EditorLayerId) => void;
  onToggleVisible: (layer: EditorLayerId) => void;
  onToggleLocked: (layer: EditorLayerId) => void;
}

export function Palette({
  brush,
  activeLayer,
  layers,
  onSelect,
  onLayer,
  onToggleVisible,
  onToggleLocked,
}: PaletteProps): JSX.Element {
  return (
    <section className="palette" aria-label="Palette d’objets">
      <p className="group-label">Calques</p>
      <LayerStack
        activeLayer={activeLayer}
        layers={layers}
        onSelect={onLayer}
        onToggleVisible={onToggleVisible}
        onToggleLocked={onToggleLocked}
      />
      <p className="group-label palette-layer-name">{LAYER_LABELS[activeLayer]}</p>
      {activeLayer !== 'objects' ? (
        <p className="palette-hint">Pierre, mur ou bois — libre sur ce calque</p>
      ) : null}
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
