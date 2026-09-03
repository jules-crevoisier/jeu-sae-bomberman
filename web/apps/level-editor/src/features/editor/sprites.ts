import type { CatalogItem } from '@bomberman/level-schema';

export interface SheetMap {
  blocks: HTMLImageElement;
  rat: HTMLImageElement;
  conveyor: HTMLImageElement;
  teleporter: HTMLImageElement;
  powerups: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

export async function loadSheets(): Promise<SheetMap | null> {
  try {
    const [blocks, rat, conveyor, teleporter, powerups] = await Promise.all([
      loadImage('/sprites/Blocks.png'),
      loadImage('/sprites/BomberRat.png'),
      loadImage('/sprites/ConveyorBelt.png'),
      loadImage('/sprites/teleporter.png'),
      loadImage('/sprites/PowerUps.png'),
    ]);
    return { blocks, rat, conveyor, teleporter, powerups };
  } catch {
    return null;
  }
}

export function drawSprite(
  context: CanvasRenderingContext2D,
  sheets: SheetMap | null,
  item: CatalogItem,
  dx: number,
  dy: number,
  size: number,
): void {
  const sheet = sheets?.[item.sprite.sheet];
  if (!sheet) {
    context.fillStyle = item.fallbackColor;
    context.fillRect(dx, dy, size, size);
    return;
  }

  context.save();
  context.imageSmoothingEnabled = false;
  const centerX = dx + size / 2;
  const centerY = dy + size / 2;
  context.translate(centerX, centerY);
  context.rotate((item.sprite.rotate * Math.PI) / 180);
  context.drawImage(
    sheet,
    item.sprite.x,
    item.sprite.y,
    item.sprite.size,
    item.sprite.size,
    -size / 2,
    -size / 2,
    size,
    size,
  );
  context.restore();
}
