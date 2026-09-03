import type { ReactNode, JSX } from 'react';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps): JSX.Element {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="icon-btn ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
