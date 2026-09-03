import { LEVEL_SIZES } from '@bomberman/level-schema';
import type { JSX } from 'react';
import { Sheet } from './Sheet.tsx';

interface SettingsSheetProps {
  width: number;
  height: number;
  onTemplate: (id: string) => void;
  onImportFile: (file: File) => void;
  onClose: () => void;
}

export function SettingsSheet({
  width,
  height,
  onTemplate,
  onImportFile,
  onClose,
}: SettingsSheetProps): JSX.Element {
  return (
    <Sheet title="Taille du niveau" onClose={onClose}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
        Moyenne = 21×13. Petite −5, grande +5. Les bonus sortent des caisses au hasard, pas besoin de les poser.
      </p>
      <div className="size-grid">
        {LEVEL_SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            className="size-card"
            aria-pressed={width === size.width && height === size.height}
            onClick={() => onTemplate(size.id)}
          >
            <strong>{size.label}</strong>
            <span>{size.width}×{size.height}</span>
          </button>
        ))}
      </div>
      <label className="icon-btn" style={{ width: '100%' }}>
        Importer un JSON
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportFile(file);
            }
            event.target.value = '';
          }}
        />
      </label>
    </Sheet>
  );
}
