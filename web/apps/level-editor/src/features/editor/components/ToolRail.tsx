import type { ToolId } from '@bomberman/level-schema';
import type { JSX } from 'react';
import { EraseIcon, FillIcon, PaintIcon, PanIcon, PickerIcon, RedoIcon, UndoIcon } from './Icons.tsx';

interface ToolRailProps {
  tool: ToolId;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: ToolId) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const TOOLS: Array<{ id: ToolId; label: string; icon: JSX.Element }> = [
  { id: 'paint', label: 'Peindre', icon: <PaintIcon /> },
  { id: 'erase', label: 'Gomme', icon: <EraseIcon /> },
  { id: 'rect', label: 'Zone', icon: <FillIcon /> },
  { id: 'picker', label: 'Pipette', icon: <PickerIcon /> },
  { id: 'pan', label: 'Bouger', icon: <PanIcon /> },
];

export function ToolRail({ tool, canUndo, canRedo, onTool, onUndo, onRedo }: ToolRailProps): JSX.Element {
  return (
    <nav className="tools" aria-label="Outils">
      <button type="button" className="tool-btn" aria-label="Undo" disabled={!canUndo} onClick={onUndo}>
        <UndoIcon />
        <span>Undo</span>
      </button>
      <button type="button" className="tool-btn" aria-label="Redo" disabled={!canRedo} onClick={onRedo}>
        <RedoIcon />
        <span>Redo</span>
      </button>
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="tool-btn"
          aria-pressed={tool === item.id}
          aria-label={item.label}
          onClick={() => onTool(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
