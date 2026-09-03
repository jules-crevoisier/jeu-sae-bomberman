import {
  catalogForLayer,
  getCatalogItem,
  LAYER_LABELS,
  type BrushId,
  type EditorLayerId,
} from '@bomberman/level-schema';
import { useState, type JSX } from 'react';
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
  onClearLayer: (layer: EditorLayerId) => void;
}

export function Palette({
  brush,
  activeLayer,
  layers,
  onSelect,
  onLayer,
  onToggleVisible,
  onToggleLocked,
  onClearLayer,
}: PaletteProps): JSX.Element {
  const [variantGroup, setVariantGroup] = useState<'conveyor' | 'teleporter' | null>(null);
  const entries = catalogForLayer(activeLayer);
  const compactObjects = activeLayer === 'objects';
  const variants = variantGroup === 'conveyor'
    ? entries.filter((entry) => entry.id.startsWith('conveyor_'))
    : entries.filter((entry) => entry.id.startsWith('teleporter_'));
  return (
    <section className="palette" aria-label="Palette d'objets">
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
          {entries.filter((entry) => !compactObjects || (!entry.id.startsWith('conveyor_') && !entry.id.startsWith('teleporter_'))).map((entry) => (
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
          {compactObjects ? <>
            <button type="button" className="chip" onClick={() => setVariantGroup('conveyor')}><SpriteIcon item={entries.find((entry) => entry.id === 'conveyor_left')!} /><small>Tapis</small></button>
            <button type="button" className="chip" onClick={() => setVariantGroup('teleporter')}><SpriteIcon item={entries.find((entry) => entry.id === 'teleporter_red')!} /><small>Portails</small></button>
          </> : null}
        </div>
      </div>
      {variantGroup ? <div className="variant-picker" role="dialog" aria-label="Variantes">
        <span>{variantGroup === 'conveyor' ? 'Direction du tapis' : 'Couleur du portail'}</span>
        {variants.map((entry) => <button key={entry.id} type="button" className="variant-btn" onClick={() => { onSelect(entry.id); setVariantGroup(null); }}><SpriteIcon item={entry} size={28} /><small>{entry.shortLabel}</small></button>)}
        <button type="button" className="variant-close" onClick={() => setVariantGroup(null)}>Fermer</button>
      </div> : null}
    </section>
  );
}

export function SelectedHint({ brush }: { brush: BrushId }): JSX.Element {
  if (brush === 'erase') {
    return <span>Gomme</span>;
  }
  return <span>{getCatalogItem(brush).label}</span>;
}
