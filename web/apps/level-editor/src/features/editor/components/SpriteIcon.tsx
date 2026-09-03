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
          filter: item.sprite.tint ? `sepia(1) saturate(1.7)` : undefined,
        }}
      />
      {mark ? <span className="sprite-mark">{mark}</span> : null}
    </span>
  );
}
