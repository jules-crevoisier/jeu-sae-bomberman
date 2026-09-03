import {
  applyBrush,
  brushBelongsToLayer,
  createClassicDocument,
  importLevelJson,
  LAYER_DEFAULT_BRUSH,
  layerForBrush,
  normalizeDocument,
  resizeDocument,
  TEMPLATES,
  type BrushId,
  type EditorLayerId,
  type GridCell,
  type LevelDocument,
  type ToolId,
} from '@bomberman/level-schema';
import { createDefaultLayers, MAX_HISTORY, type EditorSnapshot, type SheetId } from './editor-state.ts';

export type EditorAction =
  | { type: 'stroke'; points: ReadonlyArray<{ x: number; y: number }>; brush: BrushId }
  | { type: 'rectFill'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'clearLayer'; layer: EditorLayerId }
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
      const keepTool = state.tool === 'erase' || state.tool === 'rect' || state.tool === 'picker' || state.tool === 'pan';
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
    case 'rectFill': {
      if (state.layers[state.activeLayer].locked) {
        return { ...state, toast: 'Calque verrouillé' };
      }
      const x1 = Math.min(action.x1, action.x2);
      const x2 = Math.max(action.x1, action.x2);
      const y1 = Math.min(action.y1, action.y2);
      const y2 = Math.max(action.y1, action.y2);
      const points: Array<{ x: number; y: number }> = [];
      for (let ry = y1; ry <= y2; ry += 1) {
        for (let rx = x1; rx <= x2; rx += 1) {
          points.push({ x: rx, y: ry });
        }
      }
      let cells = state.document.cells;
      let changed = false;
      for (const point of points) {
        const result = applyBrush(
          { ...state.document, cells },
          point.x,
          point.y,
          state.brush,
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
    case 'clearLayer': {
      const layer = action.layer;
      const next: GridCell[] = state.document.cells.map((cell) => {
        switch (layer) {
          case 'ground':
            return cell.ground === 'floor' ? cell : { ...cell, ground: 'floor' };
          case 'solid':
            return cell.solid === null ? cell : { ...cell, solid: null };
          case 'crate':
            return cell.crate === null ? cell : { ...cell, crate: null };
          case 'objects':
            return cell.objectId === null ? cell : { ...cell, objectId: null };
          default:
            return cell;
        }
      });
      const changed2 = next.some((c, i) => c !== state.document.cells[i]);
      if (!changed2) {
        return state;
      }
      return pushHistory(state, { ...state.document, cells: next });
    }
    default:
      return state;
  }
}

export function tryImportLevel(text: string): LevelDocument {
  return importLevelJson(text);
}
