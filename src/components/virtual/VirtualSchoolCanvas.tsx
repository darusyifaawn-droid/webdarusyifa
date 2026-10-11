/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualSchoolCanvas.tsx
 * Interactive 2.5D Isometric Pixel Art Canvas Viewport.
 * Renders the virtual campus, cute pixel avatars, furniture, floating status badges, and handles pan/zoom/clicks.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  VirtualSchoolSimulator, 
  GRID_SIZE_X, 
  GRID_SIZE_Y, 
  TILE_WIDTH, 
  TILE_HEIGHT,
  SCHOOL_ROOMS,
  INITIAL_FURNITURE,
  AvatarEntity,
  Furniture
} from './VirtualSchoolEngine';
import { ZoomIn, ZoomOut, RotateCcw, Grid, Tag, Sun, Moon } from 'lucide-react';

interface VirtualSchoolCanvasProps {
  simulator: VirtualSchoolSimulator;
  selectedAvatar: AvatarEntity | null;
  onSelectAvatar: (avatar: AvatarEntity | null) => void;
  activeRoomId?: string;
}

export const VirtualSchoolCanvas: React.FC<VirtualSchoolCanvasProps> = ({
  simulator,
  selectedAvatar,
  onSelectAvatar,
  activeRoomId
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transforms
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Visual toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Focus on room when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId || !containerRef.current) return;
    const room = SCHOOL_ROOMS.find(r => r.id === activeRoomId);
    if (room) {
      // Focus camera on room center
      const targetTileX = room.focusTile.x;
      const targetTileY = room.focusTile.y;
      const isoX = (targetTileX - targetTileY) * (TILE_WIDTH / 2);
      const isoY = (targetTileX + targetTileY) * (TILE_HEIGHT / 2);

      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - isoX * zoom,
        y: rect.height / 2 - isoY * zoom - 40
      });
    }
  }, [activeRoomId, zoom]);

  // Initial center position
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const midIsoX = 0;
      const midIsoY = (GRID_SIZE_X / 2 + GRID_SIZE_Y / 2) * (TILE_HEIGHT / 2);
      setPan({
        x: rect.width / 2 - midIsoX,
        y: rect.height / 2 - midIsoY * 0.95
      });
    }
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Advance physics and simulations
      simulator.tick(deltaTime);

      // Canvas dimensions & DPI scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false; // Keep crisp pixel art edges!

      // 1. Draw Background
      if (isNightMode) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGrad;
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#f0f9ff'); // Sky-50
        bgGrad.addColorStop(0.5, '#e0f2fe'); // Sky-100
        bgGrad.addColorStop(1, '#f1f5f9'); // Slate-100
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, width, height);

      // 2. Camera Transform
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Coordinate converter helper
      const gridToScreen = (gx: number, gy: number) => {
        const sx = (gx - gy) * (TILE_WIDTH / 2);
        const sy = (gx + gy) * (TILE_HEIGHT / 2);
        return { x: sx, y: sy };
      };

      // 3. Draw Isometric Tiles
      for (let y = 0; y < GRID_SIZE_Y; y++) {
        for (let x = 0; x < GRID_SIZE_X; x++) {
          const { x: sx, y: sy } = gridToScreen(x, y);

          // Find which room this tile belongs to
          const room = SCHOOL_ROOMS.find(
            r => x >= r.bounds.minX && x <= r.bounds.maxX && y >= r.bounds.minY && y <= r.bounds.maxY
          );

          // Tile base colors
          let fillColor = isNightMode ? '#1e293b' : '#f8fafc';
          let strokeColor = isNightMode ? '#334155' : '#e2e8f0';

          if (room) {
            if (room.id === 'classroom_a') {
              fillColor = isNightMode ? '#0c4a6e' : '#e0f2fe'; // Light blue classroom
              strokeColor = isNightMode ? '#0284c7' : '#bae6fd';
            } else if (room.id === 'admin_office') {
              fillColor = isNightMode ? '#064e3b' : '#dcfce7'; // Emerald admin
              strokeColor = isNightMode ? '#059669' : '#bbf7d0';
            } else if (room.id === 'library') {
              fillColor = isNightMode ? '#451a03' : '#fef3c7'; // Amber library
              strokeColor = isNightMode ? '#d97706' : '#fde68a';
            } else if (room.id === 'playground') {
              fillColor = isNightMode ? '#065f46' : '#ecfdf5'; // Playzone green
              strokeColor = isNightMode ? '#10b981' : '#a7f3d0';
            } else if (room.id === 'gate') {
              fillColor = isNightMode ? '#312e81' : '#e0e7ff'; // Indigo gate
              strokeColor = isNightMode ? '#6366f1' : '#c7d2fe';
            }
          }

          // Highlight hovered tile
          const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;
          if (isHovered) {
            fillColor = '#38bdf8';
            strokeColor = '#0284c7';
          }

          // Draw Diamond Tile
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
          ctx.lineTo(sx, sy + TILE_HEIGHT);
          ctx.lineTo(sx - TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
          ctx.closePath();

          ctx.fillStyle = fillColor;
          ctx.fill();

          if (showGrid) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Pixel grid corner dots
          ctx.fillStyle = isNightMode ? '#38bdf833' : '#0284c722';
          ctx.fillRect(sx - 1, sy + TILE_HEIGHT / 2 - 1, 2, 2);
        }
      }

      // 4. Room Perimeter / Divider Borders
      SCHOOL_ROOMS.forEach(room => {
        const { minX, maxX, minY, maxY } = room.bounds;
        const pTop = gridToScreen(minX, minY);
        const pRight = gridToScreen(maxX + 1, minY);
        const pBottom = gridToScreen(maxX + 1, maxY + 1);
        const pLeft = gridToScreen(minX, maxY + 1);

        ctx.beginPath();
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.lineTo(pBottom.x, pBottom.y);
        ctx.lineTo(pLeft.x, pLeft.y);
        ctx.closePath();

        ctx.strokeStyle = room.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 5. Draw Furniture & Objects (Depth sorted by X+Y)
      const renderQueue: Array<{
        type: 'furniture' | 'avatar';
        depth: number;
        data: Furniture | AvatarEntity;
      }> = [];

      INITIAL_FURNITURE.forEach(f => {
        renderQueue.push({ type: 'furniture', depth: f.x + f.y, data: f });
      });

      simulator.avatars.forEach(a => {
        renderQueue.push({ type: 'avatar', depth: a.x + a.y + 0.1, data: a });
      });

      // Sort back-to-front
      renderQueue.sort((a, b) => a.depth - b.depth);

      // Render Each Item in Order
      renderQueue.forEach(item => {
        if (item.type === 'furniture') {
          drawFurniture(ctx, item.data as Furniture, gridToScreen, isNightMode);
        } else {
          drawAvatar(
            ctx, 
            item.data as AvatarEntity, 
            gridToScreen, 
            selectedAvatar?.id === (item.data as AvatarEntity).id,
            showLabels,
            isNightMode
          );
        }
      });

      // 6. Draw Floating Activity Particles
      simulator.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });

      ctx.restore(); // Camera transform restore
      ctx.restore(); // DPI scale restore

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pan, zoom, showGrid, showLabels, isNightMode, hoveredTile, selectedAvatar, simulator]);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hit test tile coordinates under cursor
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Inverse isometric projection:
    // mouseX = (gx - gy) * (TILE_WIDTH / 2)
    // mouseY = (gx + gy) * (TILE_HEIGHT / 2)
    const invX = mouseX / (TILE_WIDTH / 2);
    const invY = mouseY / (TILE_HEIGHT / 2);
    const gx = Math.floor((invY + invX) / 2);
    const gy = Math.floor((invY - invX) / 2);

    if (gx >= 0 && gx < GRID_SIZE_X && gy >= 0 && gy < GRID_SIZE_Y) {
      setHoveredTile({ x: gx, y: gy });
    } else {
      setHoveredTile(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked an avatar directly
    let clickedAv: AvatarEntity | null = null;
    let minDist = 30; // click radius

    simulator.avatars.forEach(av => {
      const sx = (av.x - av.y) * (TILE_WIDTH / 2);
      const sy = (av.x + av.y) * (TILE_HEIGHT / 2) + TILE_HEIGHT / 2 - 14;
      const d = Math.hypot(mouseX - sx, mouseY - sy);
      if (d < minDist) {
        minDist = d;
        clickedAv = av;
      }
    });

    if (clickedAv) {
      onSelectAvatar(clickedAv);
      // Create sparkling particle
      const avScreenX = (clickedAv.x - clickedAv.y) * (TILE_WIDTH / 2);
      const avScreenY = (clickedAv.x + clickedAv.y) * (TILE_HEIGHT / 2);
      simulator.addParticle(avScreenX, avScreenY - 40, '✨ ' + clickedAv.role, '#38bdf8');
    } else {
      // Check if clicked room zone
      if (hoveredTile) {
        const room = SCHOOL_ROOMS.find(
          r => hoveredTile.x >= r.bounds.minX && hoveredTile.x <= r.bounds.maxX &&
               hoveredTile.y >= r.bounds.minY && hoveredTile.y <= r.bounds.maxY
        );
        if (room) {
          // Deselect avatar if clicking ground
          onSelectAvatar(null);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 2.2));
  };

  const resetView = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setZoom(1.0);
    setPan({
      x: rect.width / 2,
      y: rect.height / 2 - 280
    });
    onSelectAvatar(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas Quick Controls Bar */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 p-1.5 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-xl text-slate-300">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
          className="p-2 hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer"
          title="Perbesar (Zoom In)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
          className="p-2 hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer"
          title="Perkecil (Zoom Out)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={resetView}
          className="p-2 hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer"
          title="Pusatkan Kamera (Reset View)"
        >
          <RotateCcw size={16} />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-1" />

        <button
          onClick={() => setShowGrid(g => !g)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${showGrid ? 'bg-sky-500/20 text-sky-400 font-bold' : 'hover:bg-slate-800'}`}
          title="Tampilkan / Sembunyikan Garis Grid"
        >
          <Grid size={16} />
        </button>
        <button
          onClick={() => setShowLabels(l => !l)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${showLabels ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
          title="Tampilkan / Sembunyikan Label Status"
        >
          <Tag size={16} />
        </button>
        <button
          onClick={() => setIsNightMode(m => !m)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${isNightMode ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:bg-slate-800'}`}
          title="Ganti Tema Cyber Blueprint / Daylight"
        >
          {isNightMode ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* Floating Room Minimap Badge / Status Indicator */}
      <div className="absolute top-5 left-5 pointer-events-none flex items-center gap-2">
        <div className="px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-full border border-sky-500/30 text-[11px] font-bold text-sky-300 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Simulasi Kampus Virtual Live</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">RA Darusyifa Arjawinangun</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PIXEL ART DRAWING FUNCTIONS (CANVAS 2D)
// ==========================================

function drawFurniture(
  ctx: CanvasRenderingContext2D,
  f: Furniture,
  gridToScreen: (gx: number, gy: number) => { x: number; y: number },
  isNight: boolean
) {
  const { x: sx, y: sy } = gridToScreen(f.x, f.y);
  const cx = sx;
  const cy = sy + TILE_HEIGHT / 2;

  ctx.save();

  if (f.type === 'smartboard') {
    // 3D Isometric Digital Smartboard with glowing screen
    ctx.fillStyle = '#0f172a'; // Frame
    ctx.fillRect(cx - 16, cy - 36, 32, 22);

    // Glowing screen
    ctx.fillStyle = isNight ? '#0284c7' : '#0369a1';
    ctx.fillRect(cx - 14, cy - 34, 28, 18);

    // Smartboard charts line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 24);
    ctx.lineTo(cx - 4, cy - 28);
    ctx.lineTo(cx + 3, cy - 22);
    ctx.lineTo(cx + 10, cy - 30);
    ctx.stroke();

    // Board Stand
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 2, cy - 14, 4, 14);
    ctx.fillRect(cx - 8, cy - 2, 16, 3);
  } else if (f.type === 'desk_teacher' || f.type === 'desk_student') {
    // Isometric Wooden Desk
    const isTeacher = f.type === 'desk_teacher';
    const deskColor = isTeacher ? '#b45309' : '#d97706';
    const topColor = isTeacher ? '#f59e0b' : '#fbbf24';

    // Desk top diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 14, cy - 9);
    ctx.lineTo(cx, cy - 2);
    ctx.lineTo(cx - 14, cy - 9);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Desk front legs
    ctx.fillStyle = deskColor;
    ctx.fillRect(cx - 14, cy - 9, 3, 10);
    ctx.fillRect(cx + 11, cy - 9, 3, 10);
    ctx.fillRect(cx - 1, cy - 2, 2, 10);

    // Laptop or Books on Desk
    if (isTeacher) {
      // Laptop
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 4, cy - 14, 8, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 3, cy - 13, 6, 3);
    } else {
      // Small notebook
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 3, cy - 11, 6, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 10, 4, 2);
    }
  } else if (f.type === 'bookshelf') {
    // Isometric Bookshelf
    ctx.fillStyle = '#78350f'; // Dark wood frame
    ctx.fillRect(cx - 12, cy - 34, 24, 30);

    // Shelves with colored pixel books
    const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    for (let row = 0; row < 3; row++) {
      const shelfY = cy - 30 + row * 9;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 10, shelfY + 7, 20, 2);

      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = bookColors[(b + row) % bookColors.length];
        ctx.fillRect(cx - 9 + b * 4, shelfY, 3, 7);
      }
    }
  } else if (f.type === 'computer_tu') {
    // Workstation desk with PC & Keyboard
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 12, cy - 12, 24, 10);

    // Monitor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 6, cy - 24, 12, 9);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 5, cy - 23, 10, 7);

    // Stand
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 2, cy - 15, 4, 3);
  } else if (f.type === 'slide') {
    // Playzone Slide
    ctx.fillStyle = '#ef4444'; // Bright Red Slide
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 28);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx + 8, cy + 3);
    ctx.lineTo(cx - 14, cy - 25);
    ctx.closePath();
    ctx.fill();

    // Ladder
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 14, cy - 28, 4, 28);
  } else if (f.type === 'plant') {
    // Potted Green Plant
    // Pot
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(cx - 5, cy - 6, 10, 6);

    // Bush
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 14, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.type === 'gate_scanner') {
    // RFID / QR Checkpoint Gate Post
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(cx - 4, cy - 26, 8, 24);

    // Glowing Scanner Pad
    ctx.fillStyle = '#a5b4fc';
    ctx.fillRect(cx - 3, cy - 22, 6, 6);
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(cx - 2, cy - 21, 4, 4);

    // Pulse emitter
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  av: AvatarEntity,
  gridToScreen: (gx: number, gy: number) => { x: number; y: number },
  isSelected: boolean,
  showLabels: boolean,
  isNight: boolean
) {
  const { x: sx, y: sy } = gridToScreen(av.x, av.y);
  const cx = sx;
  const cy = sy + TILE_HEIGHT / 2;

  ctx.save();

  // 1. Shadow underneath
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight Ring if selected
  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 13, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Walking Bobbing calculation
  const bob = Math.sin(av.walkCycle) * 1.5;
  const legOffset = Math.sin(av.walkCycle) * 3;

  // 3. Cute Pixel Chibi Body Construction
  // Feet
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 5 + legOffset * 0.4, cy - 4, 4, 4);
  ctx.fillRect(cx + 1 - legOffset * 0.4, cy - 4, 4, 4);

  // Torso / Shirt
  ctx.fillStyle = av.uniformColor;
  ctx.fillRect(cx - 6, cy - 16 + bob, 12, 12);

  // Uniform Accent / Tie / Scarf
  ctx.fillStyle = av.accentColor;
  ctx.fillRect(cx - 2, cy - 14 + bob, 4, 7);

  // Cute Head & Hair / Hijab
  const headY = cy - 27 + bob;

  if (av.gender === 'f') {
    // Hijab Muslimah Pixel Style (for Teacher / Girl pupil)
    ctx.fillStyle = av.avatarType === 'guru' ? '#0369a1' : '#10b981';
    ctx.beginPath();
    ctx.arc(cx, headY + 5, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Face skin tone
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(cx - 5, headY + 2, 10, 8);
  } else {
    // Boy / Admin Haircut
    ctx.fillStyle = '#1e293b'; // Dark hair
    ctx.fillRect(cx - 6, headY - 2, 12, 5);

    // Face skin
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(cx - 5, headY + 2, 10, 8);
  }

  // Cute Big Pixel Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 3, headY + 4, 2, 3);
  ctx.fillRect(cx + 2, headY + 4, 2, 3);

  // Pupil White Highlights
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 3, headY + 4, 1, 1);
  ctx.fillRect(cx + 2, headY + 4, 1, 1);

  // Rosy cheeks
  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(cx - 4, headY + 7, 2, 1);
  ctx.fillRect(cx + 3, headY + 7, 2, 1);

  // Backpack for pupils
  if (av.avatarType === 'siswa_m' || av.avatarType === 'siswa_f') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 8, cy - 15 + bob, 2, 8);
  }

  // 4. FLOATING LABELS & STATUS BADGES (Requested by user)
  if (showLabels) {
    const labelBaseY = headY - 14;

    // Role Name Label: [Guru Kelas], [Tata Usaha], [Siswa Hadir], etc.
    ctx.font = 'bold 9px sans-serif';
    const roleText = av.role;
    const roleWidth = ctx.measureText(roleText).width;

    ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = av.uniformColor;
    ctx.lineWidth = 1;

    const padX = 6;
    const padY = 2;
    const rectX = cx - roleWidth / 2 - padX;
    const rectY = labelBaseY - 11;
    const rectW = roleWidth + padX * 2;
    const rectH = 14;

    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectW, rectH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isNight ? '#e2e8f0' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(roleText, cx, labelBaseY);

    // Status Indicator Badge: 'Mengajar', 'Merekap Nilai', 'Standby', etc.
    const statusY = labelBaseY - 17;
    const statusText = av.status;
    ctx.font = 'bold 8.5px sans-serif';
    const statusWidth = ctx.measureText(statusText).width;

    // Status color mapping
    let statusBg = '#0284c7';
    if (av.status === 'Mengajar') statusBg = '#0284c7'; // Blue
    else if (av.status === 'Merekap Nilai') statusBg = '#8b5cf6'; // Violet
    else if (av.status === 'Absensi Masuk') statusBg = '#10b981'; // Green
    else if (av.status === 'Menabung') statusBg = '#f59e0b'; // Amber
    else if (av.status === 'Bermain') statusBg = '#ec4899'; // Pink
    else if (av.status === 'Membaca') statusBg = '#d97706'; // Orange
    else if (av.status === 'Standby') statusBg = '#64748b'; // Slate

    const sRectX = cx - statusWidth / 2 - 9;
    const sRectY = statusY - 10;
    const sRectW = statusWidth + 18;
    const sRectH = 13;

    ctx.fillStyle = statusBg;
    ctx.beginPath();
    ctx.roundRect(sRectX, sRectY, sRectW, sRectH, 4);
    ctx.fill();

    // Little pulsing dot inside status
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sRectX + 5, sRectY + 6.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, cx + 4, statusY);
  }

  // 5. Speech / Thought Bubble (When active)
  if (av.speechBubble) {
    const bubbleY = headY - 48;
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(av.speechBubble.text).width;
    const bW = textWidth + 14;
    const bH = 20;
    const bX = cx - bW / 2;

    // White rounded speech balloon
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bX, bubbleY, bW, bH, 6);
    ctx.fill();
    ctx.stroke();

    // Little pointer arrow
    ctx.beginPath();
    ctx.moveTo(cx - 3, bubbleY + bH);
    ctx.lineTo(cx, bubbleY + bH + 4);
    ctx.lineTo(cx + 3, bubbleY + bH);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(av.speechBubble.text, cx, bubbleY + 14);
  }

  ctx.restore();
}
