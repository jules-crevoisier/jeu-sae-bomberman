import type { CatalogItem } from '@bomberman/level-schema';

export interface SheetMap {
  blocks: HTMLImageElement;
  rat: HTMLImageElement;
  conveyor: HTMLImageElement;
  teleporter: HTMLImageElement;
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
    const [blocks, rat, conveyor, teleporter] = await Promise.all([
      loadImage('/sprites/Blocks.png'),
      loadImage('/sprites/BomberRat.png'),
      loadImage('/sprites/ConveyorBelt.png'),
      loadImage('/sprites/teleporter.png'),
    ]);
    return { blocks, rat, conveyor, teleporter };
  } catch { return null; }
}

export function drawSprite(
  context: CanvasRenderingContext2D,
  sheets: SheetMap | null,
  item: CatalogItem,
  dx: number,
  dy: number,
  size: number,
): void {
  const sheet = item.sprite.sheet === 'powerups' ? null : sheets?.[item.sprite.sheet];
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
  if (item.kind === 'hazard' && item.sprite.tint) {
    const buffer = document.createElement('canvas');
    buffer.width = item.sprite.size;
    buffer.height = item.sprite.size;
    const bufferContext = buffer.getContext('2d');
    if (bufferContext) {
      bufferContext.drawImage(sheet, item.sprite.x, item.sprite.y, item.sprite.size, item.sprite.size, 0, 0, item.sprite.size, item.sprite.size);
      const imageData = bufferContext.getImageData(0, 0, item.sprite.size, item.sprite.size);
      const tint = item.sprite.tint.match(/\w\w/g)?.map((value) => Number.parseInt(value, 16)) ?? [255, 255, 255];
      const [tintRed = 255, tintGreen = 255, tintBlue = 255] = tint;
      for (let index = 0; index < imageData.data.length; index += 4) {
        imageData.data[index] = Math.round(((imageData.data[index] ?? 0) * tintRed) / 255);
        imageData.data[index + 1] = Math.round(((imageData.data[index + 1] ?? 0) * tintGreen) / 255);
        imageData.data[index + 2] = Math.round(((imageData.data[index + 2] ?? 0) * tintBlue) / 255);
      }
      bufferContext.putImageData(imageData, 0, 0);
      context.drawImage(buffer, -size / 2, -size / 2, size, size);
    }
  } else {
    context.drawImage(sheet, item.sprite.x, item.sprite.y, item.sprite.size, item.sprite.size, -size / 2, -size / 2, size, size);
  }
  context.restore();
}
