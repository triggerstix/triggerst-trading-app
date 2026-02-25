import React, { useState, useRef, useEffect } from 'react';

export type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'fibonacci' | 'text';

export interface Drawing {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number }[];
  text?: string;
  color: string;
}

interface DrawingToolsProps {
  width: number;
  height: number;
  onDrawingsChange: (drawings: Drawing[]) => void;
}

export const DrawingTools: React.FC<DrawingToolsProps> = ({ width, height, onDrawingsChange }) => {
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    onDrawingsChange(drawings);
  }, [drawings, onDrawingsChange]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none') return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newDrawing: Drawing = {
      id: `drawing-${Date.now()}`,
      type: activeTool,
      points: [{ x, y }],
      color: '#3b82f6',
    };

    setCurrentDrawing(newDrawing);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentDrawing) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentDrawing.type === 'trendline' || currentDrawing.type === 'fibonacci') {
      setCurrentDrawing({
        ...currentDrawing,
        points: [currentDrawing.points[0], { x, y }],
      });
    } else if (currentDrawing.type === 'horizontal') {
      setCurrentDrawing({
        ...currentDrawing,
        points: [{ x: 0, y: currentDrawing.points[0].y }, { x: width, y: currentDrawing.points[0].y }],
      });
    }
  };

  const handleMouseUp = () => {
    if (currentDrawing && isDrawing) {
      setDrawings([...drawings, currentDrawing]);
      setCurrentDrawing(null);
      setIsDrawing(false);
      setActiveTool('none');
    }
  };

  const clearDrawings = () => {
    setDrawings([]);
  };

  const renderDrawing = (drawing: Drawing) => {
    if (drawing.points.length < 2) return null;

    const [p1, p2] = drawing.points;

    switch (drawing.type) {
      case 'trendline':
        return (
          <line
            key={drawing.id}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={drawing.color}
            strokeWidth={2}
            strokeDasharray="none"
          />
        );

      case 'horizontal':
        return (
          <line
            key={drawing.id}
            x1={0}
            y1={p1.y}
            x2={width}
            y2={p1.y}
            stroke={drawing.color}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );

      case 'fibonacci':
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const yDiff = p2.y - p1.y;

        return (
          <g key={drawing.id}>
            {levels.map((level, idx) => {
              const y = p1.y + yDiff * level;
              const labelColor = level === 0.5 ? '#ef4444' : '#3b82f6';

              return (
                <g key={idx}>
                  <line
                    x1={Math.min(p1.x, p2.x)}
                    y1={y}
                    x2={Math.max(p1.x, p2.x)}
                    y2={y}
                    stroke={labelColor}
                    strokeWidth={level === 0.5 ? 2 : 1}
                    strokeDasharray={level === 0.5 ? 'none' : '3,3'}
                    opacity={0.7}
                  />
                  <text
                    x={Math.max(p1.x, p2.x) + 5}
                    y={y + 4}
                    fill={labelColor}
                    fontSize="12"
                    fontWeight={level === 0.5 ? 'bold' : 'normal'}
                  >
                    {(level * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="absolute top-2 left-2 z-10 bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-700">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setActiveTool('trendline')}
            className={`px-3 py-2 rounded ${
              activeTool === 'trendline'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Draw Trend Line"
          >
            📈 Trend
          </button>
          <button
            onClick={() => setActiveTool('horizontal')}
            className={`px-3 py-2 rounded ${
              activeTool === 'horizontal'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Draw Horizontal Line"
          >
            ➖ Horizontal
          </button>
          <button
            onClick={() => setActiveTool('fibonacci')}
            className={`px-3 py-2 rounded ${
              activeTool === 'fibonacci'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Draw Fibonacci Retracement"
          >
            🔢 Fibonacci
          </button>
          <button
            onClick={clearDrawings}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            title="Clear All Drawings"
          >
            🗑️ Clear
          </button>
          <button
            onClick={() => setActiveTool('none')}
            className={`px-3 py-2 rounded ${
              activeTool === 'none'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Selection Tool"
          >
            ↖️ Select
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-600 mx-1" />

          {/* Help button */}
          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-100 transition-colors text-sm font-bold"
            title="Drawing Tools Help"
          >
            ?
          </a>
        </div>
      </div>

      {/* SVG Overlay */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ cursor: activeTool !== 'none' ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render completed drawings */}
        {drawings.map(renderDrawing)}

        {/* Render current drawing in progress */}
        {currentDrawing && renderDrawing(currentDrawing)}
      </svg>

      {/* Instructions */}
      {activeTool !== 'none' && (
        <div className="absolute bottom-2 left-2 z-10 bg-slate-800 rounded-lg px-4 py-2 shadow-lg border border-slate-700">
          <p className="text-sm text-slate-300">
            {activeTool === 'trendline' && '📍 Click and drag to draw a trend line'}
            {activeTool === 'horizontal' && '📍 Click to place a horizontal support/resistance line'}
            {activeTool === 'fibonacci' && '📍 Click and drag from low to high (or high to low)'}
          </p>
        </div>
      )}
    </div>
  );
};
