import type { BrushId, EditorLayerId, LevelDocument, ToolId } from '@bomberman/level-schema';

export type SheetId = 'none' | 'export' | 'settings' | 'drafts';

export interface LayerView {
  visible: boolean;
  locked: boolean;
}

export type LayerViews = Record<EditorLayerId, LayerView>;

export interface EditorSnapshot {
  document: LevelDocument;
  tool: ToolId;
  brush: BrushId;
  activeLayer: EditorLayerId;
  layers: LayerViews;
  includeFloor: boolean;
  sheet: SheetId;
  hover: { x: number; y: number } | null;
  draftId: string;
  past: LevelDocument[];
  future: LevelDocument[];
  toast: string | null;
}

export function createDefaultLayers(): LayerViews {
  return {
    ground: { visible: true, locked: false },
    solid: { visible: true, locked: false },
    crate: { visible: true, locked: false },
    objects: { visible: true, locked: false },
  };
}

export const MAX_HISTORY = 80;
