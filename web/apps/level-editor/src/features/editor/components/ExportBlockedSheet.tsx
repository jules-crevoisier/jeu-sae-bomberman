import type { JSX } from 'react';
import { Sheet } from './Sheet.tsx';

interface ExportBlockedSheetProps {
  errors: string[];
  onClose: () => void;
}

export function ExportBlockedSheet({ errors, onClose }: ExportBlockedSheetProps): JSX.Element {
  return (
    <Sheet title="Export impossible" onClose={onClose}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
        Corrige ces points avant d'exporter le niveau.
      </p>
      <div className="alert-list" role="alert">
        {errors.map((error) => (
          <p key={error} className="alert-line">
            {error}
          </p>
        ))}
      </div>
      <div className="row">
        <button type="button" className="icon-btn primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Sheet>
  );
}
