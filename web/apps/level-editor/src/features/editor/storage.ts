import { normalizeDocument, type LevelDocument } from '@bomberman/level-schema';

const STORAGE_KEY = 'bomberman.level-editor.v1';
const MAX_DRAFTS = 12;

export interface StoredDraft {
  id: string;
  updatedAt: number;
  document: LevelDocument;
}

interface StoredBundle {
  version: 1;
  currentId: string;
  drafts: StoredDraft[];
}

function isBundle(value: unknown): value is StoredBundle {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.version === 1 && typeof record.currentId === 'string' && Array.isArray(record.drafts);
}

export function loadBundle(): StoredBundle | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isBundle(parsed)) {
      return null;
    }
    return {
      ...parsed,
      drafts: parsed.drafts.map((draft) => ({
        ...draft,
        document: normalizeDocument(draft.document),
      })),
    };
  } catch {
    return null;
  }
}

export function saveDraft(draftId: string, document: LevelDocument): void {
  const bundle = loadBundle() ?? { version: 1 as const, currentId: draftId, drafts: [] };
  const nextDraft: StoredDraft = { id: draftId, updatedAt: Date.now(), document };
  const drafts = [nextDraft, ...bundle.drafts.filter((draft) => draft.id !== draftId)].slice(0, MAX_DRAFTS);
  const payload: StoredBundle = { version: 1, currentId: draftId, drafts };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function deleteDraft(draftId: string): StoredBundle | null {
  const bundle = loadBundle();
  if (!bundle) {
    return null;
  }
  const drafts = bundle.drafts.filter((draft) => draft.id !== draftId);
  const next: StoredBundle = {
    version: 1,
    currentId: drafts[0]?.id ?? '',
    drafts,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
