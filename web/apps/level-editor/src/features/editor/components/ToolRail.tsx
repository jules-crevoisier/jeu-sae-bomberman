import type { ToolId } from '@bomberman/level-schema';
import type { JSX } from 'react';
import type { PlacementMode } from '../editor-state.ts';
import { EraseIcon, FillIcon, PaintIcon, PanIcon, PlaceIcon } from './Icons.tsx';

interface ToolRailProps {
  tool: ToolId;
  placementMode: PlacementMode;
  onTool: (tool: ToolId) => void;
  onPlacementMode: (mode: PlacementMode) => void;
}

const TOOLS: Array<{ id: ToolId; label: string; icon: JSX.Element }> = [
  { id: 'paint', label: 'Place', icon: <PlaceIcon /> },
  { id: 'erase', label: 'Gomme', icon: <EraseIcon /> },
  { id: 'pan', label: 'Naviguer', icon: <PanIcon /> },
];

export function ToolRail({ tool, placementMode, onTool, onPlacementMode }: ToolRailProps): JSX.Element {
  return (
    <>
    <nav className="tools" aria-label="Outils">
      <div className="tool-list">
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
      </div>
    </nav>
      {tool !== 'pan' ? (
        <div className="tool-modes horizontal" role="group" aria-label="Mode d'application">
          <button
            type="button"
            className="mode-btn"
            aria-pressed={placementMode === 'paint'}
            onClick={() => onPlacementMode('paint')}
          >
            <PaintIcon />
            <span>Paint mode</span>
          </button>
          <button
            type="button"
            className="mode-btn"
            aria-pressed={placementMode === 'fill'}
            onClick={() => onPlacementMode('fill')}
          >
            <FillIcon />
            <span>Fill mode</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
