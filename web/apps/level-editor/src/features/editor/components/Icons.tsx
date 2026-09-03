/** Lucide icons for editor chrome. Game tiles stay as sprites. */

import {
  Download,
  Eraser,
  Eye,
  EyeOff,
  FolderOpen,
  Lock,
  LockOpen,
  Move,
  Paintbrush,
  PaintBucket,
  Redo2,
  RotateCcw,
  Settings2,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { JSX } from 'react';

const ICON = {
  size: 22,
  strokeWidth: 2.25,
  'aria-hidden': true,
} as const;

export function PlaceIcon(): JSX.Element {
  return <Square {...ICON} />;
}

export function PaintIcon(): JSX.Element {
  return <Paintbrush {...ICON} />;
}

export function EraseIcon(): JSX.Element {
  return <Eraser {...ICON} />;
}

export function FillIcon(): JSX.Element {
  return <PaintBucket {...ICON} />;
}

export function PanIcon(): JSX.Element {
  return <Move {...ICON} />;
}

export function UndoIcon(): JSX.Element {
  return <Undo2 {...ICON} />;
}

export function RedoIcon(): JSX.Element {
  return <Redo2 {...ICON} />;
}

export function ExportIcon(): JSX.Element {
  return <Download {...ICON} />;
}

export function SettingsIcon(): JSX.Element {
  return <Settings2 {...ICON} />;
}

export function FolderIcon(): JSX.Element {
  return <FolderOpen {...ICON} />;
}

export function ResetIcon(): JSX.Element { return <RotateCcw {...ICON} />; }

export function EyeIcon(): JSX.Element {
  return <Eye {...ICON} />;
}

export function EyeOffIcon(): JSX.Element {
  return <EyeOff {...ICON} />;
}

export function LockIcon(): JSX.Element {
  return <Lock {...ICON} />;
}

export function UnlockIcon(): JSX.Element {
  return <LockOpen {...ICON} />;
}

export function Trash2Icon(): JSX.Element {
  return <Trash2 {...ICON} />;
}
