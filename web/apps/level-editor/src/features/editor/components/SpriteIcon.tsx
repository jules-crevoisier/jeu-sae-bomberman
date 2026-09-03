import type { CatalogItem } from '@bomberman/level-schema';
import type { JSX } from 'react';

const SHEET_FILES: Record<CatalogItem['sprite']['sheet'], string> = {
  blocks: '/sprites/Blocks.png',
  rat: '/sprites/BomberRat.png',
  conveyor: '/sprites/ConveyorBelt.png',
  teleporter: '/sprites/teleporter.png',
  powerups: '/sprites/PowerUps.png',
};

const SHEET_WIDTH: Record<CatalogItem['sprite']['sheet'], number> = {
  blocks: 64,
  rat: 48,
  conveyor: 80,
  teleporter: 64,
  powerups: 80,
};

const DIRECTION_MARK: Record<string, string> = {
  conveyor_up: '▲',
  conveyor_down: '▼',
  conveyor_left: '◀',
  conveyor_right: '▶',
};

const PORTAL_FILTER: Record<string, string> = {
  teleporter_red: 'sepia(1) saturate(6) hue-rotate(320deg) brightness(.8)',
  teleporter_purple: 'sepia(1) saturate(5) hue-rotate(235deg) brightness(.9)',
  teleporter_blue: 'sepia(1) saturate(5) hue-rotate(175deg) brightness(.9)',
  teleporter_cyan: 'sepia(1) saturate(4) hue-rotate(125deg) brightness(1)',
  teleporter_green: 'sepia(1) saturate(4) hue-rotate(75deg) brightness(.85)',
  teleporter_orange: 'sepia(1) saturate(5) hue-rotate(335deg) brightness(.95)',
};

interface SpriteIconProps {
  item: CatalogItem;
  size?: number;
}

export function SpriteIcon({ item, size = 40 }: SpriteIconProps): JSX.Element {
  const scale = size / item.sprite.size;
  const mark = DIRECTION_MARK[item.id];
  return (
    <span className="sprite-wrap" aria-hidden="true">
      <span
        className="sprite"
        style={{
          width: size,
          height: size,
          backgroundColor: item.sprite.tint ? 'transparent' : item.fallbackColor,
          backgroundImage: `url(${SHEET_FILES[item.sprite.sheet]})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${SHEET_WIDTH[item.sprite.sheet] * scale}px ${16 * scale}px`,
          backgroundPosition: `${-item.sprite.x * scale}px ${-item.sprite.y * scale}px`,
          transform: mark ? 'none' : `rotate(${item.sprite.rotate}deg)`,
          imageRendering: 'pixelated',
          display: 'inline-block',
          borderRadius: 3,
          boxShadow: item.kind === 'spawn' ? `inset 0 -6px 0 ${item.fallbackColor}` : undefined,
          filter: PORTAL_FILTER[item.id],
        }}
      />
      {mark ? <span className="sprite-mark">{mark}</span> : null}
    </span>
  );
}
