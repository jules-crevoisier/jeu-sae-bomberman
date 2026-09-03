/** Layer stack for ground, solid walls, crates, and objects. */

import { EDITOR_LAYER_IDS, getCatalogItem, LAYER_ICON_ID, LAYER_LABELS, type EditorLayerId } from '@bomberman/level-schema';
import type { JSX } from 'react';
import type { LayerViews } from '../editor-state.ts';
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon } from './Icons.tsx';
import { SpriteIcon } from './SpriteIcon.tsx';

interface LayerStackProps {
  activeLayer: EditorLayerId;
  layers: LayerViews;
  onSelect: (layer: EditorLayerId) => void;
  onToggleVisible: (layer: EditorLayerId) => void;
  onToggleLocked: (layer: EditorLayerId) => void;
}

export function LayerStack({
  activeLayer,
  layers,
  onSelect,
  onToggleVisible,
  onToggleLocked,
}: LayerStackProps): JSX.Element {
  return (
    <div className="layers" role="tablist" aria-label="Calques">
      {EDITOR_LAYER_IDS.map((layer) => {
        const view = layers[layer];
        const selected = activeLayer === layer;
        return (
          <div
            key={layer}
            className={`layer-card${selected ? ' is-active' : ''}${view.visible ? '' : ' is-hidden'}${view.locked ? ' is-locked' : ''}`}
          >
            <button
              type="button"
              className={`layer-icon${view.visible ? '' : ' is-off'}`}
              aria-label={view.visible ? `Masquer ${LAYER_LABELS[layer]}` : `Afficher ${LAYER_LABELS[layer]}`}
              aria-pressed={view.visible}
              onClick={() => onToggleVisible(layer)}
            >
              {view.visible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
            <button
              type="button"
              className="layer-select"
              role="tab"
              aria-selected={selected}
              aria-pressed={selected}
              onClick={() => onSelect(layer)}
            >
              <SpriteIcon item={getCatalogItem(LAYER_ICON_ID[layer])} size={22} />
              {LAYER_LABELS[layer]}
            </button>
            <button
              type="button"
              className={`layer-icon${view.locked ? '' : ' is-off'}`}
              aria-label={view.locked ? `Déverrouiller ${LAYER_LABELS[layer]}` : `Verrouiller ${LAYER_LABELS[layer]}`}
              aria-pressed={view.locked}
              onClick={() => onToggleLocked(layer)}
            >
              {view.locked ? <LockIcon /> : <UnlockIcon />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
