import { getCatalogItem, isObjectId, isTileId, type BrushId, type EditorLayerId, type LevelDocument, type ToolId } from '@bomberman/level-schema';
import { useEffect, useRef, type JSX } from 'react';
import { CELL_PX, fitCamera, screenToCell, zoomAt, type Camera } from '../camera.ts';
import { drawLevel } from '../draw-level.ts';
import type { LayerViews, PlacementMode } from '../editor-state.ts';
import { drawSprite, loadSheets, type SheetMap } from '../sprites.ts';

type AnimationKind = 'place' | 'erase';

interface CellAnimation {
  points: Array<{ x: number; y: number }>;
  brush: Exclude<BrushId, 'erase'>;
  kind: AnimationKind;
  startedAt: number;
}

interface GridCanvasProps {
  document: LevelDocument;
  tool: ToolId;
  placementMode: PlacementMode;
  brush: BrushId;
  activeLayer: EditorLayerId;
  layers: LayerViews;
  hover: { x: number; y: number } | null;
  onHover: (cell: { x: number; y: number } | null) => void;
  onStroke: (points: Array<{ x: number; y: number }>, brush: BrushId) => void;
  onFillArea: (x1: number, y1: number, x2: number, y2: number, brush: BrushId) => void;
  onBlocked: () => void;
}

export function GridCanvas({
  document,
  tool,
  placementMode,
  brush,
  activeLayer,
  layers,
  hover,
  onHover,
  onStroke,
  onFillArea,
  onBlocked,
}: GridCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const sheetsRef = useRef<SheetMap | null>(null);
  const strokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const rectStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectEndRef = useRef<{ x: number; y: number } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ distance: number } | null>(null);
  const skipPaintRef = useRef(false);
  const erasedCellsRef = useRef<Set<string>>(new Set());
  const animationsRef = useRef<CellAnimation[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const fittedRef = useRef(false);
  const latestRef = useRef({
    document,
    tool,
    placementMode,
    brush,
    activeLayer,
    layers,
    hover,
    onHover,
    onStroke,
    onFillArea,
    onBlocked,
  });
  latestRef.current = {
    document,
    tool,
    placementMode,
    brush,
    activeLayer,
    layers,
    hover,
    onHover,
    onStroke,
    onFillArea,
    onBlocked,
  };

  useEffect(() => {
    let disposed = false;
    void loadSheets().then((sheets) => {
      if (!disposed) {
        sheetsRef.current = sheets;
        paint();
      }
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    paint();
  }, [document, hover, layers, activeLayer, tool, placementMode, brush]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      if (!fittedRef.current && rect.width > 0) {
        cameraRef.current = fitCamera(rect.width, rect.height, latestRef.current.document.width, latestRef.current.document.height);
        fittedRef.current = true;
      }
      paint();
    };
    fittedRef.current = false;
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [document.width, document.height]);

  const paint = (): void => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const current = latestRef.current;
    drawLevel(context, current.document, cameraRef.current, sheetsRef.current, {
      hover: current.hover,
      layers: current.layers,
      activeLayer: current.activeLayer,
    });
    const cellSize = CELL_PX * cameraRef.current.scale;

    for (const point of strokeRef.current) {
      const brushId = current.tool === 'erase' ? 'erase' : current.brush;
      const screenX = cameraRef.current.x + point.x * cellSize;
      const screenY = cameraRef.current.y + (current.document.height - 1 - point.y) * cellSize;
      if (brushId === 'erase') {
        continue;
      } else if (isTileId(brushId) || isObjectId(brushId)) {
        drawSprite(context, sheetsRef.current, getCatalogItem(brushId), screenX, screenY, cellSize);
      }
    }

    const now = performance.now();
    let hasActiveAnimation = false;
    animationsRef.current = animationsRef.current.filter((animation) => {
      const progress = (now - animation.startedAt) / 180;
      if (progress >= 1) {
        return false;
      }

      hasActiveAnimation = true;
      const scale =
        animation.kind === 'place'
          ? 1 + Math.sin(progress * Math.PI) * 0.16
          : Math.max(0.04, 1 - progress * 0.96);
      const rotation =
        animation.kind === 'place'
          ? Math.sin(progress * Math.PI * 3) * 0.08
          : progress * Math.PI * 4;
      const brushItem = getCatalogItem(animation.brush);
      for (const point of animation.points) {
          const centerX = cameraRef.current.x + (point.x + 0.5) * cellSize;
          const centerY = cameraRef.current.y + (current.document.height - point.y - 0.5) * cellSize;
          context.save();
          context.translate(centerX, centerY);
          if (animation.kind === 'erase') {
            context.globalAlpha = 1 - progress;
            context.translate(0, cellSize * progress * 0.12);
          }
          context.rotate(rotation);
          drawSprite(context, sheetsRef.current, brushItem, -(cellSize * scale) / 2, -(cellSize * scale) / 2, cellSize * scale);
          context.restore();
      }
      return true;
    });
    if (hasActiveAnimation && animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => { animationFrameRef.current = null; paint(); });
    }

    const rStart = rectStartRef.current;
    const rEnd = rectEndRef.current;
    if (current.tool !== 'pan' && current.placementMode === 'fill' && rStart && rEnd) {
      const x1 = Math.min(rStart.x, rEnd.x);
      const x2 = Math.max(rStart.x, rEnd.x);
      const y1 = Math.min(rStart.y, rEnd.y);
      const y2 = Math.max(rStart.y, rEnd.y);
      const screenX1 = cameraRef.current.x + x1 * cellSize;
      const screenY1 = cameraRef.current.y + (current.document.height - 1 - y2) * cellSize;
      const rectW = (x2 - x1 + 1) * cellSize;
      const rectH = (y2 - y1 + 1) * cellSize;
      context.fillStyle = 'rgba(90, 160, 255, 0.25)';
      context.fillRect(screenX1, screenY1, rectW, rectH);
      context.strokeStyle = 'rgba(90, 160, 255, 0.85)';
      context.lineWidth = 2;
      context.strokeRect(screenX1, screenY1, rectW, rectH);
    }
  };

  const localPoint = (event: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0 };
    }
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / ratio;
    const cssHeight = canvas.height / ratio;
    return {
      x: ((event.clientX - rect.left) / rect.width) * cssWidth,
      y: ((event.clientY - rect.top) / rect.height) * cssHeight,
    };
  };

  const appendStrokeSegment = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): Array<{ x: number; y: number }> => {
    const appended: Array<{ x: number; y: number }> = [];
    let x = from.x;
    let y = from.y;
    const deltaX = Math.abs(to.x - from.x);
    const deltaY = Math.abs(to.y - from.y);
    const stepX = from.x < to.x ? 1 : -1;
    const stepY = from.y < to.y ? 1 : -1;
    let error = deltaX - deltaY;

    while (x !== to.x || y !== to.y) {
      const doubledError = error * 2;
      if (doubledError > -deltaY) {
        error -= deltaY;
        x += stepX;
      }
      if (doubledError < deltaX) {
        error += deltaX;
        y += stepY;
      }
      const point = { x, y };
      strokeRef.current.push(point);
      appended.push(point);
    }
    return appended;
  };

  const startAnimation = (kind: AnimationKind, points: Array<{ x: number; y: number }>, brush: BrushId): void => {
    if (brush !== 'erase') {
      animationsRef.current.push({ points, brush, kind, startedAt: performance.now() });
      return;
    }

    const current = latestRef.current;
    const byBrush = new Map<Exclude<BrushId, 'erase'>, Array<{ x: number; y: number }>>();
    for (const point of points) {
      const cell = current.document.cells[point.y * current.document.width + point.x];
      if (!cell) {
        continue;
      }
      const item = current.activeLayer === 'objects'
        ? cell.objectId
        : cell[current.activeLayer];
      if (!item || (current.activeLayer === 'ground' && item === 'floor')) {
        continue;
      }
      const animatedPoints = byBrush.get(item) ?? [];
      animatedPoints.push(point);
      byBrush.set(item, animatedPoints);
    }
    const startedAt = performance.now();
    for (const [item, animatedPoints] of byBrush) {
      animationsRef.current.push({ points: animatedPoints, brush: item, kind, startedAt });
    }
  };

  const eraseImmediately = (points: Array<{ x: number; y: number }>): void => {
    const freshPoints = points.filter((point) => {
      const key = `${point.x},${point.y}`;
      if (erasedCellsRef.current.has(key)) {
        return false;
      }
      erasedCellsRef.current.add(key);
      return true;
    });
    if (freshPoints.length === 0) {
      return;
    }
    startAnimation('erase', freshPoints, 'erase');
    latestRef.current.onStroke(freshPoints, 'erase');
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = localPoint(event.nativeEvent);
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size >= 2) {
      skipPaintRef.current = true;
      strokeRef.current = [];
      rectStartRef.current = null;
      rectEndRef.current = null;
      const [a, b] = [...pointersRef.current.values()];
      if (a && b) {
        pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
      }
      paint();
      return;
    }
    if (latestRef.current.tool === 'pan') {
      return;
    }
    const cell = screenToCell(cameraRef.current, latestRef.current.document.width, latestRef.current.document.height, point.x, point.y);
    if (!cell) {
      return;
    }
    if (latestRef.current.layers[latestRef.current.activeLayer].locked) {
      latestRef.current.onBlocked();
      return;
    }
    latestRef.current.onHover(cell);
    if (latestRef.current.placementMode === 'fill') {
      rectStartRef.current = cell;
      rectEndRef.current = cell;
      paint();
      return;
    }
    skipPaintRef.current = false;
    strokeRef.current = [cell];
    erasedCellsRef.current = new Set();
    if (latestRef.current.tool === 'erase') {
      eraseImmediately([cell]);
    }
    paint();
    if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const point = localPoint(event.nativeEvent);
    const previous = pointersRef.current.get(event.pointerId);
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      if (a && b && pinchRef.current) {
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        cameraRef.current = zoomAt(cameraRef.current, midX, midY, distance / pinchRef.current.distance);
        pinchRef.current = { distance };
        paint();
      }
      return;
    }
    if (latestRef.current.tool === 'pan' && event.buttons > 0 && previous) {
      cameraRef.current = {
        ...cameraRef.current,
        x: cameraRef.current.x + (point.x - previous.x),
        y: cameraRef.current.y + (point.y - previous.y),
      };
      paint();
      return;
    }
    const cell = screenToCell(cameraRef.current, latestRef.current.document.width, latestRef.current.document.height, point.x, point.y);
    latestRef.current.onHover(cell);

    if (latestRef.current.placementMode === 'fill' && rectStartRef.current && cell) {
      rectEndRef.current = cell;
      paint();
      return;
    }

    if (skipPaintRef.current || strokeRef.current.length === 0 || !cell) {
      return;
    }
    const last = strokeRef.current[strokeRef.current.length - 1];
    if (!last || last.x !== cell.x || last.y !== cell.y) {
      if (last) {
        const appended = appendStrokeSegment(last, cell);
        if (latestRef.current.tool === 'erase') {
          eraseImmediately(appended);
        }
      } else {
        strokeRef.current = [cell];
      }
      paint();
    }
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (latestRef.current.tool !== 'pan' && latestRef.current.placementMode === 'fill' && rectStartRef.current) {
      const end = rectEndRef.current ?? rectStartRef.current;
      const start = rectStartRef.current;
      const appliedBrush = latestRef.current.tool === 'erase' ? 'erase' : latestRef.current.brush;
      const points: Array<{ x: number; y: number }> = [];
      for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y += 1) {
        for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x += 1) {
          points.push({ x, y });
        }
      }
      latestRef.current.onFillArea(
        start.x,
        start.y,
        end.x,
        end.y,
        appliedBrush,
      );
      startAnimation(appliedBrush === 'erase' ? 'erase' : 'place', points, appliedBrush);
      rectStartRef.current = null;
      rectEndRef.current = null;
      paint();
      return;
    }

    if (
      pointersRef.current.size === 0 &&
      strokeRef.current.length > 0 &&
      !skipPaintRef.current &&
      latestRef.current.tool !== 'erase'
    ) {
      const appliedBrush = latestRef.current.brush;
      latestRef.current.onStroke(strokeRef.current, appliedBrush);
      startAnimation('place', [...strokeRef.current], appliedBrush);
    }
    if (pointersRef.current.size === 0) {
      strokeRef.current = [];
      erasedCellsRef.current.clear();
      skipPaintRef.current = false;
      paint();
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>): void => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    cameraRef.current = zoomAt(
      cameraRef.current,
      event.clientX - rect.left,
      event.clientY - rect.top,
      event.deltaY < 0 ? 1.12 : 0.9,
    );
    paint();
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label="Grille du niveau"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onWheel={handleWheel}
    />
  );
}
