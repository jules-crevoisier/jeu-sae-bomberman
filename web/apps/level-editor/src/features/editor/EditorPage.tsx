import { validateLevel, type BrushId, type ToolId } from '@bomberman/level-schema';
import { useEffect, useMemo, useReducer, useState, type JSX } from 'react';
import { createInitialSnapshot, editorReducer, tryImportLevel } from './editor-reducer.ts';
import { deleteDraft, loadBundle, saveDraft, type StoredDraft } from './storage.ts';
import { DraftsSheet } from './components/DraftsSheet.tsx';
import { countIssues, downloadJson, ExportSheet, parseBrushShortcut, previewJson } from './components/ExportSheet.tsx';
import { GridCanvas } from './components/GridCanvas.tsx';
import { Palette } from './components/Palette.tsx';
import { SettingsSheet } from './components/SettingsSheet.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { ToolRail } from './components/ToolRail.tsx';
import { TopBar } from './components/TopBar.tsx';

export function EditorPage(): JSX.Element {
  const [state, dispatch] = useReducer(editorReducer, undefined, createInitialSnapshot);
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const issues = useMemo(() => validateLevel(state.document), [state.document]);
  const json = useMemo(
    () => previewJson({ document: state.document, includeFloor: state.includeFloor }),
    [state.document, state.includeFloor],
  );

  useEffect(() => {
    const bundle = loadBundle();
    if (!bundle?.drafts[0]) {
      return;
    }
    setDrafts(bundle.drafts);
    const current = bundle.drafts.find((draft) => draft.id === bundle.currentId) ?? bundle.drafts[0];
    if (current) {
      dispatch({ type: 'load', document: current.document, draftId: current.id });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft(state.draftId, state.document);
      setDrafts(loadBundle()?.drafts ?? []);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state.document, state.draftId]);

  useEffect(() => {
    if (!state.toast) {
      return;
    }
    const timer = window.setTimeout(() => dispatch({ type: 'toast', message: null }), 1800);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        downloadJson(state.document.name, json);
        return;
      }
      const brush = parseBrushShortcut(event.code);
      if (brush) {
        dispatch({ type: 'setBrush', brush });
      }
      const tools: Record<string, ToolId> = { KeyB: 'paint', KeyE: 'erase', KeyG: 'rect', KeyI: 'picker', KeyH: 'pan' };
      const tool = tools[event.code];
      if (tool) {
        dispatch({ type: 'setTool', tool });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [json, state.document.name]);

  const importFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      dispatch({ type: 'load', document: tryImportLevel(text) });
      dispatch({ type: 'toast', message: 'Niveau importé' });
    } catch (error) {
      dispatch({ type: 'toast', message: error instanceof Error ? error.message : 'Import impossible' });
    }
  };

  const issueCount = countIssues(state.document);

  // Export blocking conditions
  const hasSpawnP1 = state.document.cells.some((cell) => cell.objectId === 'spawn_p1');
  const hasFondHoles = state.document.cells.some((cell) => cell.ground === null);
  const exportErrors: string[] = [];
  if (!hasSpawnP1) {
    exportErrors.push('Le joueur 1 (J1) doit être placé sur la grille.');
  }
  if (hasFondHoles) {
    exportErrors.push('Le calque Fond a des trous — il doit être entièrement rempli.');
  }
  const exportBlocked = exportErrors.length > 0;

  return (
    <div className="shell">
      <TopBar
        name={state.document.name}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onName={(name) => dispatch({ type: 'setName', name })}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        exportBlocked={exportBlocked}
        onExport={() => !exportBlocked && dispatch({ type: 'setSheet', sheet: 'export' })}
        onDrafts={() => dispatch({ type: 'setSheet', sheet: 'drafts' })}
        onSettings={() => dispatch({ type: 'setSheet', sheet: 'settings' })}
      />
      <div className="workspace">
        <GridCanvas
          document={state.document}
          tool={state.tool}
          brush={state.brush}
          activeLayer={state.activeLayer}
          layers={state.layers}
          hover={state.hover}
          onHover={(hover) => dispatch({ type: 'setHover', hover })}
          onStroke={(points, brush) => dispatch({ type: 'stroke', points, brush })}
          onRectFill={(x1, y1, x2, y2) => dispatch({ type: 'rectFill', x1, y1, x2, y2 })}
          onPick={(brush: BrushId) => dispatch({ type: 'setBrush', brush })}
          onBlocked={() => dispatch({ type: 'toast', message: 'Calque verrouillé' })}
        />
        <StatusBar
          width={state.document.width}
          height={state.document.height}
          hover={state.hover}
          brush={state.brush}
          layer={state.activeLayer}
          issues={issues}
        />
      </div>
      <ToolRail
        tool={state.tool}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onTool={(tool) => dispatch({ type: 'setTool', tool })}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
      />
      <Palette
        brush={state.brush}
        activeLayer={state.activeLayer}
        layers={state.layers}
        exportErrors={exportErrors}
        onSelect={(brush) => dispatch({ type: 'setBrush', brush })}
        onLayer={(layer) => dispatch({ type: 'setLayer', layer })}
        onToggleVisible={(layer) => dispatch({ type: 'toggleLayerVisible', layer })}
        onToggleLocked={(layer) => dispatch({ type: 'toggleLayerLocked', layer })}
        onClearLayer={(layer) => dispatch({ type: 'clearLayer', layer })}
      />
      {state.sheet === 'export' ? (
        <ExportSheet
          json={json}
          includeFloor={state.includeFloor}
          errorCount={issueCount.errors}
          warningCount={issueCount.warnings}
          onToggleFloor={() => dispatch({ type: 'toggleFloor' })}
          onCopy={() => {
            void navigator.clipboard.writeText(json);
            dispatch({ type: 'toast', message: 'JSON copié' });
          }}
          onDownload={() => {
            downloadJson(state.document.name, json);
            dispatch({ type: 'toast', message: 'Fichier téléchargé' });
          }}
          onClose={() => dispatch({ type: 'setSheet', sheet: 'none' })}
        />
      ) : null}
      {state.sheet === 'settings' ? (
        <SettingsSheet
          width={state.document.width}
          height={state.document.height}
          onTemplate={(templateId) => dispatch({ type: 'template', templateId })}
          onImportFile={(file) => {
            void importFile(file);
          }}
          onClose={() => dispatch({ type: 'setSheet', sheet: 'none' })}
        />
      ) : null}
      {state.sheet === 'drafts' ? (
        <DraftsSheet
          drafts={drafts}
          currentId={state.draftId}
          onLoad={(draft) => dispatch({ type: 'load', document: draft.document, draftId: draft.id })}
          onDelete={(id) => setDrafts(deleteDraft(id)?.drafts ?? [])}
          onClose={() => dispatch({ type: 'setSheet', sheet: 'none' })}
        />
      ) : null}
      {state.toast ? <div className="toast" role="status">{state.toast}</div> : null}
    </div>
  );
}
