import {
  applyBrush,
  brushBelongsToLayer,
  createClassicDocument,
  floodFill,
  importLevelJson,
  LAYER_DEFAULT_BRUSH,
  layerForBrush,
  normalizeDocument,
  resizeDocument,
  TEMPLATES,
  type BrushId,
  type EditorLayerId,
  type LevelDocument,
  type ToolId,
} from '@bomberman/level-schema';
import { createDefaultLayers, MAX_HISTORY, type EditorSnapshot, type SheetId } from './editor-state.ts';

export type EditorAction =
  | { type: 'stroke'; points: ReadonlyArray<{ x: number; y: number }>; brush: BrushId }
  | { type: 'fill'; x: number; y: number }
  | { type: 'setTool'; tool: ToolId }
  | { type: 'setBrush'; brush: BrushId }
  | { type: 'setLayer'; layer: EditorLayerId }
  | { type: 'toggleLayerVisible'; layer: EditorLayerId }
  | { type: 'toggleLayerLocked'; layer: EditorLayerId }
  | { type: 'setName'; name: string }
  | { type: 'resize'; width: number; height: number }
  | { type: 'load'; document: LevelDocument; draftId?: string }
  | { type: 'template'; templateId: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'setSheet'; sheet: SheetId }
  | { type: 'setHover'; hover: { x: number; y: number } | null }
  | { type: 'toggleFloor' }
  | { type: 'toast'; message: string | null };

function pushHistory(state: EditorSnapshot, nextDocument: LevelDocument): EditorSnapshot {
  return {
    ...state,
    document: nextDocument,
    past: [...state.past, state.document].slice(-MAX_HISTORY),
    future: [],
  };
}

function showLayer(state: EditorSnapshot, layer: EditorLayerId): EditorSnapshot['layers'] {
  const current = state.layers[layer];
  if (current.visible) {
    return state.layers;
  }
  return { ...state.layers, [layer]: { ...current, visible: true } };
}

export function createInitialSnapshot(): EditorSnapshot {
  return {
    document: createClassicDocument(),
    tool: 'paint',
    brush: 'crate',
    activeLayer: 'crate',
    layers: createDefaultLayers(),
    includeFloor: false,
    sheet: 'none',
    hover: null,
    draftId: crypto.randomUUID(),
    past: [],
    future: [],
    toast: null,
  };
}

export function editorReducer(state: EditorSnapshot, action: EditorAction): EditorSnapshot {
  switch (action.type) {
    case 'setTool':
      return {
        ...state,
        tool: action.tool,
        brush: action.tool === 'erase' ? 'erase' : state.brush === 'erase' ? LAYER_DEFAULT_BRUSH[state.activeLayer] : state.brush,
      };
    case 'setBrush': {
      const nextLayer = layerForBrush(action.brush, state.activeLayer) ?? state.activeLayer;
      return {
        ...state,
        brush: action.brush,
        tool: action.brush === 'erase' ? 'erase' : 'paint',
        activeLayer: nextLayer,
        layers: showLayer({ ...state, activeLayer: nextLayer }, nextLayer),
      };
    }
    case 'setLayer': {
      const keepTool = state.tool === 'erase' || state.tool === 'fill' || state.tool === 'picker' || state.tool === 'pan';
      const brush =
        state.tool === 'erase' || brushBelongsToLayer(state.brush, action.layer)
          ? state.brush
          : LAYER_DEFAULT_BRUSH[action.layer];
      return {
        ...state,
        activeLayer: action.layer,
        brush,
        tool: keepTool ? state.tool : 'paint',
        layers: showLayer(state, action.layer),
      };
    }
    case 'toggleLayerVisible': {
      const current = state.layers[action.layer];
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...current, visible: !current.visible },
        },
      };
    }
    case 'toggleLayerLocked': {
      const current = state.layers[action.layer];
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...current, locked: !current.locked },
        },
      };
    }
    case 'setName':
      return { ...state, document: { ...state.document, name: action.name } };
    case 'setSheet':
      return { ...state, sheet: action.sheet };
    case 'setHover': {
      const same =
        state.hover?.x === action.hover?.x &&
        state.hover?.y === action.hover?.y &&
        Boolean(state.hover) === Boolean(action.hover);
      return same ? state : { ...state, hover: action.hover };
    }
    case 'toggleFloor':
      return { ...state, includeFloor: !state.includeFloor };
    case 'toast':
      return { ...state, toast: action.message };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) {
        return state;
      }
      return {
        ...state,
        document: previous,
        past: state.past.slice(0, -1),
        future: [state.document, ...state.future],
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) {
        return state;
      }
      return {
        ...state,
        document: next,
        past: [...state.past, state.document],
        future: rest,
      };
    }
    case 'load':
      return {
        ...state,
        document: normalizeDocument(action.document),
        draftId: action.draftId ?? crypto.randomUUID(),
        past: [],
        future: [],
        sheet: 'none',
      };
    case 'template': {
      const template = TEMPLATES.find((item) => item.id === action.templateId);
      if (!template) {
        return state;
      }
      return pushHistory(state, template.factory());
    }
    case 'resize':
      return pushHistory(state, resizeDocument(state.document, action.width, action.height));
    case 'stroke': {
      if (state.layers[state.activeLayer].locked) {
        return { ...state, toast: 'Calque verrouillé' };
      }
      let cells = state.document.cells;
      let changed = false;
      for (const point of action.points) {
        const result = applyBrush(
          { ...state.document, cells },
          point.x,
          point.y,
          action.brush,
          state.activeLayer,
        );
        if (result.changed) {
          cells = result.cells;
          changed = true;
        }
      }
      if (!changed) {
        return state;
      }
      return {
        ...pushHistory(state, { ...state.document, cells }),
        layers: showLayer(state, state.activeLayer),
      };
    }
    case 'fill': {
      if (state.layers[state.activeLayer].locked) {
        return { ...state, toast: 'Calque verrouillé' };
      }
      const result = floodFill(state.document, action.x, action.y, state.brush, state.activeLayer);
      if (!result.changed) {
        return state;
      }
      return {
        ...pushHistory(state, { ...state.document, cells: result.cells }),
        layers: showLayer(state, state.activeLayer),
      };
    }
    default:
      return state;
  }
}

export function tryImportLevel(text: string): LevelDocument {
  return importLevelJson(text);
}
