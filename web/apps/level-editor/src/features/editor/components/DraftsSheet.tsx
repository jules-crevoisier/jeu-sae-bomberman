import type { JSX } from 'react';
import type { StoredDraft } from '../storage.ts';
import { Sheet } from './Sheet.tsx';

interface DraftsSheetProps {
  drafts: StoredDraft[];
  currentId: string;
  onLoad: (draft: StoredDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function DraftsSheet({
  drafts,
  currentId,
  onLoad,
  onDelete,
  onClose,
}: DraftsSheetProps): JSX.Element {
  return (
    <Sheet title="Brouillons" onClose={onClose}>
      <div className="draft-list">
        {drafts.length === 0 ? <p>Aucun brouillon pour l’instant.</p> : null}
        {drafts.map((draft) => (
          <article key={draft.id} className="draft-item">
            <button type="button" className="ghost" style={{ flex: 1, textAlign: 'left' }} onClick={() => onLoad(draft)}>
              <strong>{draft.document.name}</strong>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                {draft.document.width}×{draft.document.height}
                {draft.id === currentId ? ' · ouvert' : ''}
                {' · '}
                {new Date(draft.updatedAt).toLocaleString('fr-FR')}
              </div>
            </button>
            <button type="button" className="icon-btn" aria-label="Supprimer" onClick={() => onDelete(draft.id)}>
              ✕
            </button>
          </article>
        ))}
      </div>
    </Sheet>
  );
}
