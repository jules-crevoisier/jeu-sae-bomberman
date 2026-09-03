import type { JSX } from 'react';
import { ExportIcon, FolderIcon, RedoIcon, SettingsIcon, UndoIcon } from './Icons.tsx';

interface TopBarProps {
  name: string;
  canUndo: boolean;
  canRedo: boolean;
  onName: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onDrafts: () => void;
  onSettings: () => void;
}

export function TopBar({
  name,
  canUndo,
  canRedo,
  onName,
  onUndo,
  onRedo,
  onExport,
  onDrafts,
  onSettings,
}: TopBarProps): JSX.Element {
  return (
    <header className="topbar">
      <div className="brand">
        <strong>BOMB LAB</strong>
        <span>éditeur</span>
      </div>
      <label className="sr-only" htmlFor="level-name">
        Nom du niveau
      </label>
      <input
        id="level-name"
        className="name-input"
        value={name}
        maxLength={48}
        onChange={(event) => onName(event.target.value)}
      />
      <button type="button" className="icon-btn" aria-label="Retour" disabled={!canUndo} onClick={onUndo}>
        <UndoIcon />
      </button>
      <button type="button" className="icon-btn" aria-label="Rétablir" disabled={!canRedo} onClick={onRedo}>
        <RedoIcon />
      </button>
      <button type="button" className="icon-btn" aria-label="Brouillons" onClick={onDrafts}>
        <FolderIcon />
      </button>
      <button type="button" className="icon-btn" aria-label="Réglages" onClick={onSettings}>
        <SettingsIcon />
      </button>
      <button type="button" className="icon-btn primary" aria-label="Exporter JSON" onClick={onExport}>
        <ExportIcon />
      </button>
    </header>
  );
}
