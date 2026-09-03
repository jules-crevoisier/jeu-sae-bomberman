import type { ToolId } from '@bomberman/level-schema';
import type { JSX } from 'react';
import { EraseIcon, FillIcon, PaintIcon, PanIcon, PickerIcon, UndoIcon } from './Icons.tsx';

interface ToolRailProps {
  tool: ToolId;
  canUndo: boolean;
  onTool: (tool: ToolId) => void;
  onUndo: () => void;
}

const TOOLS: Array<{ id: ToolId; label: string; icon: JSX.Element }> = [
  { id: 'paint', label: 'Peindre', icon: <PaintIcon /> },
  { id: 'erase', label: 'Gomme', icon: <EraseIcon /> },
  { id: 'fill', label: 'Remplir', icon: <FillIcon /> },
  { id: 'picker', label: 'Pipette', icon: <PickerIcon /> },
  { id: 'pan', label: 'Bouger', icon: <PanIcon /> },
];

export function ToolRail({ tool, canUndo, onTool, onUndo }: ToolRailProps): JSX.Element {
  return (
    <nav className="tools" aria-label="Outils">
      <button type="button" className="tool-btn" aria-label="Retour" disabled={!canUndo} onClick={onUndo}>
        <UndoIcon />
        <span>Retour</span>
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
