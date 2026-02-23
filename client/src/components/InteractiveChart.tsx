import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Pencil, TrendingUp, Trash2, Minus, MousePointer2, Type, Ruler, ZoomIn, ZoomOut, Crosshair, BarChart3, Activity, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface ChartData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface InteractiveChartProps {
  data: ChartData[];
  symbol: string;
  currentPrice: number;
  supportLevels?: number[];
  resistanceLevels?: number[];
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
  onTimeframeChange?: (tf: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y') => void;
  ohlc?: { open: number; high: number; low: number; close: number; change: number; changePercent: number; volume: number };
}

interface Drawing {
  id: string;
  type: 'trendline' | 'horizontal' | 'fibonacci';
  start?: { time: string | number; price: number };
  end?: { time: string | number; price: number };
  price?: number;
  color?: string;
}

// Drafting cursor crosshair dimensions
const CURSOR_SIZE = 16;

export default function InteractiveChart({
  data,
  symbol,
  currentPrice,
  supportLevels = [],
  resistanceLevels = [],
  timeframe: externalTimeframe,
  onTimeframeChange,
  ohlc
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const drawingSeriesRef = useRef<any[]>([]);
  const priceLineRefs = useRef<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [internalTimeframe, setInternalTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y');
  const timeframe = externalTimeframe ?? internalTimeframe;
  const setTimeframe = (tf: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y') => {
    setInternalTimeframe(tf);
    onTimeframeChange?.(tf);
  };
  const [drawingMode, setDrawingMode] = useState<'none' | 'trendline' | 'fibonacci' | 'horizontal'>('none');
  const drawingModeRef = useRef<'none' | 'trendline' | 'fibonacci' | 'horizontal'>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const drawingsRef = useRef<Drawing[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ time: string | number; price: number } | null>(null);
  const drawingStartRef = useRef<{ time: string | number; price: number } | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // Drafting cursor state (pixel coords on canvas)
  const [draftCursor, setDraftCursor] = useState<{ x: number; y: number } | null>(null);
  const draftCursorRef = useRef<{ x: number; y: number } | null>(null);
  // Ghost line endpoint while hovering after first click
  const ghostEndRef = useRef<{ time: string | number; price: number } | null>(null);

  // SMA overlay states
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);
  const sma20SeriesRef = useRef<any>(null);
  const sma50SeriesRef = useRef<any>(null);
  const sma200SeriesRef = useRef<any>(null);

  // EMA overlay states
  const [showEMA12, setShowEMA12] = useState(false);
  const [showEMA26, setShowEMA26] = useState(false);
  const ema12SeriesRef = useRef<any>(null);
  const ema26SeriesRef = useRef<any>(null);

  // RSI and MACD indicator states
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  // Auth and drawing persistence
  const { user } = useAuth();
  const saveDrawingsMutation = trpc.chartDrawings.saveDrawings.useMutation();
  const { data: savedDrawings } = trpc.chartDrawings.getDrawings.useQuery(
    { symbol },
    { enabled: !!user }
  );

  // Load saved drawings on mount
  useEffect(() => {
    if (savedDrawings && savedDrawings.length > 0) {
      setDrawings(savedDrawings as Drawing[]);
    }
  }, [savedDrawings]);

  // Auto-save drawings when they change (debounced)
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(() => {
      saveDrawingsMutation.mutate({ symbol, drawings });
    }, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, symbol, user]);

  // Keep refs in sync with state
  useEffect(() => { drawingModeRef.current = drawingMode; }, [drawingMode]);
  useEffect(() => { drawingStartRef.current = drawingStart; }, [drawingStart]);
  useEffect(() => { drawingsRef.current = drawings; }, [drawings]);
  useEffect(() => { draftCursorRef.current = draftCursor; }, [draftCursor]);

  // Delete selected drawing on keyboard Delete/Backspace
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }
      if (e.key === 'Escape') {
        setDrawingMode('none');
        setDrawingStart(null);
        ghostEndRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedDrawingId]);

  // Canvas overlay: draws committed drawings + ghost line + drafting cursor
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current;
    if (!canvas || !chart || !series) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = chartContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const currentDrawings = drawingsRef.current;
    const selected = selectedDrawingId;

    // Helper: draw a single trendline segment on canvas
    const drawTrendSegment = (
      x1: number, y1: number, x2: number, y2: number,
      color: string, isSelected: boolean, isDraft: boolean
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isDraft ? '#94a3b8' : (isSelected ? '#facc15' : color);
      ctx.lineWidth = isDraft ? 1.5 : (isSelected ? 3 : 2);
      if (isDraft) ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Endpoint dots
      [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isDraft ? 3 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isDraft ? '#94a3b8' : (isSelected ? '#facc15' : color);
        ctx.fill();
      });
      ctx.restore();
    };

    // Draw committed drawings
    currentDrawings.forEach(drawing => {
      const isSelected = drawing.id === selected;

      if (drawing.type === 'trendline' && drawing.start && drawing.end) {
        const x1 = chart.timeScale().timeToCoordinate(drawing.start.time as Time);
        const y1 = series.priceToCoordinate(drawing.start.price);
        const x2 = chart.timeScale().timeToCoordinate(drawing.end.time as Time);
        const y2 = series.priceToCoordinate(drawing.end.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return;

        drawTrendSegment(x1, y1, x2, y2, drawing.color || '#06b6d4', isSelected, false);

        // Price labels
        ctx.font = '11px sans-serif';
        ctx.fillStyle = isSelected ? '#facc15' : (drawing.color || '#06b6d4');
        ctx.fillText(`$${drawing.start.price.toFixed(2)}`, x1 + 6, y1 - 6);
        ctx.fillText(`$${drawing.end.price.toFixed(2)}`, x2 + 6, y2 - 6);

        // Selection hit-area indicator
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(Math.min(x1, x2) - 4, Math.min(y1, y2) - 4,
            Math.abs(x2 - x1) + 8, Math.abs(y2 - y1) + 8);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    });

    // Ghost line: from first click to current cursor position (during trendline/fibonacci draw)
    const ghost = ghostEndRef.current;
    const start = drawingStartRef.current;
    if (start && ghost && (drawingModeRef.current === 'trendline' || drawingModeRef.current === 'fibonacci')) {
      const x1 = chart.timeScale().timeToCoordinate(start.time as Time);
      const y1 = series.priceToCoordinate(start.price);
      const x2 = chart.timeScale().timeToCoordinate(ghost.time as Time);
      const y2 = series.priceToCoordinate(ghost.price);
      if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
        drawTrendSegment(x1, y1, x2, y2, '#94a3b8', false, true);
        // Ghost price label at cursor
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`$${ghost.price.toFixed(2)}`, x2 + 6, y2 - 6);
      }
    }

    // Drafting cursor crosshair
    const cursor = draftCursorRef.current;
    if (cursor && drawingModeRef.current !== 'none') {
      const { x, y } = cursor;
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      // Horizontal arm
      ctx.beginPath();
      ctx.moveTo(x - CURSOR_SIZE, y);
      ctx.lineTo(x + CURSOR_SIZE, y);
      ctx.stroke();
      // Vertical arm
      ctx.beginPath();
      ctx.moveTo(x, y - CURSOR_SIZE);
      ctx.lineTo(x, y + CURSOR_SIZE);
      ctx.stroke();
      // Center dot
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.restore();
    }
  }, [selectedDrawingId]);

  // Main chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0e1a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#334155',
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#64748b',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    const chartData: CandlestickData[] = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(chartData);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeriesRef.current = volumeSeries;

    const volumeData = data.map(d => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? '#10b98180' : '#ef444480',
    }));

    volumeSeries.setData(volumeData);

    // SMA calculations
    const calculateSMA = (period: number) => {
      const smaData: { time: Time; value: number }[] = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        smaData.push({ time: data[i].time as Time, value: sum / period });
      }
      return smaData;
    };

    const sma20Series = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    sma20SeriesRef.current = sma20Series;
    if (data.length >= 20) sma20Series.setData(calculateSMA(20));
    sma20Series.applyOptions({ visible: showSMA20 });

    const sma50Series = chart.addSeries(LineSeries, { color: '#f97316', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    sma50SeriesRef.current = sma50Series;
    if (data.length >= 50) sma50Series.setData(calculateSMA(50));
    sma50Series.applyOptions({ visible: showSMA50 });

    const sma200Series = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    sma200SeriesRef.current = sma200Series;
    if (data.length >= 200) sma200Series.setData(calculateSMA(200));
    sma200Series.applyOptions({ visible: showSMA200 });

    // EMA calculations
    const calculateEMA = (period: number) => {
      const emaData: { time: Time; value: number }[] = [];
      const multiplier = 2 / (period + 1);
      let ema = 0;
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) continue;
        else if (i === period - 1) {
          let sum = 0;
          for (let j = 0; j < period; j++) sum += data[i - j].close;
          ema = sum / period;
        } else {
          ema = (data[i].close - ema) * multiplier + ema;
        }
        emaData.push({ time: data[i].time as Time, value: ema });
      }
      return emaData;
    };

    const ema12Series = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    ema12SeriesRef.current = ema12Series;
    if (data.length >= 12) ema12Series.setData(calculateEMA(12));
    ema12Series.applyOptions({ visible: showEMA12 });

    const ema26Series = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    ema26SeriesRef.current = ema26Series;
    if (data.length >= 26) ema26Series.setData(calculateEMA(26));
    ema26Series.applyOptions({ visible: showEMA26 });

    // Support/Resistance lines
    supportLevels.forEach(level => {
      candlestickSeries.createPriceLine({ price: level, color: '#10b981', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'Support' });
    });
    resistanceLevels.forEach(level => {
      candlestickSeries.createPriceLine({ price: level, color: '#ef4444', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'Resistance' });
    });
    candlestickSeries.createPriceLine({ price: currentPrice, color: '#3b82f6', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'Current' });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        requestAnimationFrame(redrawCanvas);
      }
    };
    window.addEventListener('resize', handleResize);

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      requestAnimationFrame(redrawCanvas);
    });

    // crosshairMove: powers the drafting cursor + ghost line
    chart.subscribeCrosshairMove((param: any) => {
      const currentMode = drawingModeRef.current;

      if (!param.point) {
        setDraftCursor(null);
        ghostEndRef.current = null;
        requestAnimationFrame(redrawCanvas);
        return;
      }

      // Update drafting cursor position
      if (currentMode !== 'none') {
        setDraftCursor({ x: param.point.x, y: param.point.y });

        // Update ghost line end for trendline/fibonacci
        if ((currentMode === 'trendline' || currentMode === 'fibonacci') && drawingStartRef.current) {
          const price = candlestickSeries.coordinateToPrice(param.point.y);
          let time = param.time;
          if (!time && param.point && data.length > 0) {
            const logical = chart.timeScale().coordinateToLogical(param.point.x);
            if (logical !== null) {
              const idx = Math.max(0, Math.min(Math.round(logical), data.length - 1));
              time = data[idx]?.time;
            }
          }
          if (price !== null && time) {
            ghostEndRef.current = { time, price };
          }
        } else {
          ghostEndRef.current = null;
        }

        requestAnimationFrame(redrawCanvas);
      } else {
        setDraftCursor(null);
        ghostEndRef.current = null;
      }
    });

    // Click handler for drawing
    const handleChartClick = (param: any) => {
      const currentMode = drawingModeRef.current;
      if (currentMode === 'none' || !param.point) return;

      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) return;
      let time = param.time;

      if (!time && param.point && data.length > 0) {
        const logical = chart.timeScale().coordinateToLogical(param.point.x);
        if (logical !== null) {
          const idx = Math.max(0, Math.min(Math.round(logical), data.length - 1));
          time = data[idx]?.time;
        }
        if (!time) time = data[Math.floor(data.length / 2)]?.time;
      }

      if (currentMode === 'horizontal') {
        const newDrawing: Drawing = {
          id: `drawing-${Date.now()}`,
          type: 'horizontal',
          price,
          color: '#fbbf24',
        };
        setDrawings(prev => [...prev, newDrawing]);
        setDrawingMode('none');
        ghostEndRef.current = null;
        return;
      }

      if (!time) return;

      const currentStart = drawingStartRef.current;
      if (!currentStart) {
        setDrawingStart({ time, price });
      } else {
        const newDrawing: Drawing = {
          id: `drawing-${Date.now()}`,
          type: currentMode,
          start: currentStart,
          end: { time, price },
          color: currentMode === 'fibonacci' ? '#8b5cf6' : '#06b6d4',
        };
        setDrawings(prev => [...prev, newDrawing]);
        setDrawingStart(null);
        setDrawingMode('none');
        ghostEndRef.current = null;
      }
    };

    chart.subscribeClick(handleChartClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeClick(handleChartClick);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currentPrice, supportLevels, resistanceLevels]);

  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: showVolume });
    }
  }, [showVolume]);

  // RSI Chart
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || data.length < 14) return;

    const calculateRSI = (period: number = 14) => {
      const rsiData: { time: Time; value: number }[] = [];
      let gains = 0, losses = 0;
      for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
      }
      let avgGain = gains / period;
      let avgLoss = losses / period;
      for (let i = period; i < data.length; i++) {
        if (i > period) {
          const change = data[i].close - data[i - 1].close;
          avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
          avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
        }
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiData.push({ time: data[i].time as Time, value: rsi });
      }
      return rsiData;
    };

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 100,
      layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { visible: false },
    });
    rsiChartRef.current = rsiChart;
    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, priceLineVisible: false });
    rsiSeries.setData(calculateRSI());
    rsiSeries.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2 });
    rsiSeries.createPriceLine({ price: 30, color: '#10b981', lineWidth: 1, lineStyle: 2 });
    return () => { rsiChart.remove(); };
  }, [showRSI, data]);

  // MACD Chart
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current || data.length < 26) return;

    const calculateEMAArr = (period: number, prices: number[]) => {
      const k = 2 / (period + 1);
      const ema: number[] = [prices[0]];
      for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    };

    const closes = data.map(d => d.close);
    const ema12 = calculateEMAArr(12, closes);
    const ema26 = calculateEMAArr(26, closes);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calculateEMAArr(9, macdLine.slice(25));

    const macdData: { time: Time; value: number }[] = [];
    const signalData: { time: Time; value: number }[] = [];
    const histogramData: { time: Time; value: number; color: string }[] = [];

    for (let i = 25; i < data.length; i++) {
      macdData.push({ time: data[i].time as Time, value: macdLine[i] });
      if (i >= 33) {
        const sig = signalLine[i - 33];
        signalData.push({ time: data[i].time as Time, value: sig });
        const hist = macdLine[i] - sig;
        histogramData.push({ time: data[i].time as Time, value: hist, color: hist >= 0 ? '#10b981' : '#ef4444' });
      }
    }

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: 100,
      layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { visible: false },
    });
    macdChartRef.current = macdChart;
    const histSeries = macdChart.addSeries(HistogramSeries, { priceLineVisible: false });
    histSeries.setData(histogramData);
    const macdSeries = macdChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, priceLineVisible: false });
    macdSeries.setData(macdData);
    const sigSeries = macdChart.addSeries(LineSeries, { color: '#f97316', lineWidth: 2, priceLineVisible: false });
    sigSeries.setData(signalData);
    return () => { macdChart.remove(); };
  }, [showMACD, data]);

  // Render drawings (horizontal lines + fibonacci via price lines, trendlines via canvas)
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current) return;

    priceLineRefs.current.forEach(priceLine => {
      try { candlestickSeriesRef.current?.removePriceLine(priceLine); } catch (e) {}
    });
    priceLineRefs.current = [];

    drawings.forEach(drawing => {
      if (drawing.type === 'horizontal') {
        const priceLine = candlestickSeriesRef.current.createPriceLine({
          price: drawing.price!,
          color: drawing.color || '#fbbf24',
          lineWidth: drawing.id === selectedDrawingId ? 3 : 2,
          lineStyle: drawing.id === selectedDrawingId ? 0 : 2,
          axisLabelVisible: true,
          title: 'H-Line',
        });
        priceLineRefs.current.push(priceLine);
      } else if (drawing.type === 'fibonacci' && drawing.start && drawing.end) {
        const high = Math.max(drawing.start.price, drawing.end.price);
        const low = Math.min(drawing.start.price, drawing.end.price);
        const diff = high - low;
        const fibLevels = [
          { level: 0, label: '0%', color: '#64748b' },
          { level: 0.236, label: '23.6%', color: '#8b5cf6' },
          { level: 0.382, label: '38.2%', color: '#a855f7' },
          { level: 0.5, label: '50%', color: '#c026d3' },
          { level: 0.618, label: '61.8%', color: '#d946ef' },
          { level: 1, label: '100%', color: '#64748b' },
        ];
        fibLevels.forEach(fib => {
          const price = low + diff * (1 - fib.level);
          const priceLine = candlestickSeriesRef.current.createPriceLine({
            price, color: fib.color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: fib.label,
          });
          priceLineRefs.current.push(priceLine);
        });
      }
    });

    requestAnimationFrame(redrawCanvas);
  }, [drawings, selectedDrawingId, redrawCanvas]);

  // Helper: check if point is near a trendline (for click-to-select)
  const hitTestDrawing = useCallback((pixelX: number, pixelY: number): string | null => {
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current;
    if (!chart || !series) return null;

    for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
      const d = drawingsRef.current[i];
      if (d.type === 'trendline' && d.start && d.end) {
        const x1 = chart.timeScale().timeToCoordinate(d.start.time as Time);
        const y1 = series.priceToCoordinate(d.start.price);
        const x2 = chart.timeScale().timeToCoordinate(d.end.time as Time);
        const y2 = series.priceToCoordinate(d.end.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) continue;
        // Distance from point to segment
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((pixelX - x1) * dx + (pixelY - y1) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const nearX = x1 + t * dx, nearY = y1 + t * dy;
        const dist = Math.sqrt((pixelX - nearX) ** 2 + (pixelY - nearY) ** 2);
        if (dist < 8) return d.id;
      }
    }
    return null;
  }, []);

  return (
    <div className="relative flex">
      {/* Left vertical toolbar */}
      <div className="w-10 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-2 gap-1">
        <button
          onClick={() => { setDrawingMode('none'); setDrawingStart(null); ghostEndRef.current = null; }}
          className={`p-2 rounded transition-colors ${drawingMode === 'none' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Select / Pan"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setDrawingMode(drawingMode === 'trendline' ? 'none' : 'trendline'); setDrawingStart(null); ghostEndRef.current = null; }}
          className={`p-2 rounded transition-colors ${drawingMode === 'trendline' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Trendline"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setDrawingMode(drawingMode === 'horizontal' ? 'none' : 'horizontal'); setDrawingStart(null); ghostEndRef.current = null; }}
          className={`p-2 rounded transition-colors ${drawingMode === 'horizontal' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setDrawingMode(drawingMode === 'fibonacci' ? 'none' : 'fibonacci'); setDrawingStart(null); ghostEndRef.current = null; }}
          className={`p-2 rounded transition-colors ${drawingMode === 'fibonacci' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Fibonacci Retracement"
        >
          <Ruler className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-700 w-6 my-1" />
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`p-2 rounded transition-colors ${showVolume ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Toggle Volume"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowRSI(!showRSI)}
          className={`p-2 rounded transition-colors text-xs font-bold ${showRSI ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="RSI (14)"
        >
          RSI
        </button>
        <button
          onClick={() => setShowMACD(!showMACD)}
          className={`p-2 rounded transition-colors text-xs font-bold ${showMACD ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="MACD (12,26,9)"
        >
          MCD
        </button>
        <div className="border-t border-slate-700 w-6 my-1" />
        {selectedDrawingId && (
          <button
            onClick={() => { setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId)); setSelectedDrawingId(null); }}
            className="p-2 rounded text-red-400 hover:bg-slate-800 transition-colors"
            title="Delete Selected Drawing"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {drawings.length > 0 && (
          <button
            onClick={() => { setDrawings([]); setSelectedDrawingId(null); }}
            className="p-2 rounded text-red-400 hover:bg-slate-800 transition-colors opacity-50 hover:opacity-100"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main chart area */}
      <div className="flex-1 relative">
        {/* OHLC Header */}
        {ohlc && (
          <div className={`bg-slate-900/95 border-b border-slate-700 px-3 py-2 ${drawingMode !== 'none' ? 'pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white font-semibold">{symbol}</span>
              <span className="text-slate-400">O</span><span className="text-white">{ohlc.open.toFixed(2)}</span>
              <span className="text-slate-400">H</span><span className="text-emerald-400">{ohlc.high.toFixed(2)}</span>
              <span className="text-slate-400">L</span><span className="text-red-400">{ohlc.low.toFixed(2)}</span>
              <span className="text-slate-400">C</span>
              <span className={ohlc.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{ohlc.close.toFixed(2)}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${ohlc.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {ohlc.change >= 0 ? '+' : ''}{ohlc.change.toFixed(2)} ({ohlc.changePercent >= 0 ? '+' : ''}{ohlc.changePercent.toFixed(2)}%)
              </span>
              <span className="text-slate-400 ml-auto">Vol</span>
              <span className="text-cyan-400">{(ohlc.volume / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        )}

        {/* Drawing mode indicator */}
        {drawingMode !== 'none' && (
          <div className="absolute top-2 right-2 z-20 bg-slate-800/90 border border-slate-600 rounded px-3 py-1.5 text-xs text-white flex items-center gap-2 pointer-events-auto">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              drawingMode === 'trendline' ? 'bg-cyan-400' :
              drawingMode === 'horizontal' ? 'bg-yellow-400' : 'bg-purple-400'
            }`} />
            {drawingMode === 'trendline' && (drawingStart ? 'Click to set end point' : 'Click to set start point')}
            {drawingMode === 'horizontal' && 'Click to place horizontal line'}
            {drawingMode === 'fibonacci' && (drawingStart ? 'Click to set end point' : 'Click to set start point')}
            <button
              onClick={() => { setDrawingMode('none'); setDrawingStart(null); ghostEndRef.current = null; }}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Selected drawing indicator */}
        {selectedDrawingId && drawingMode === 'none' && (
          <div className="absolute top-2 right-2 z-20 bg-yellow-900/80 border border-yellow-600 rounded px-3 py-1.5 text-xs text-yellow-300 flex items-center gap-2">
            Drawing selected — press Delete or click <X className="w-3 h-3 inline" /> to remove
          </div>
        )}

        {/* Top toolbar - Timeframe and indicators */}
        <div
          className={`absolute top-2 left-2 z-10 flex flex-col gap-1 ${drawingMode !== 'none' ? 'pointer-events-none opacity-50' : ''}`}
          style={{ top: ohlc ? '48px' : '8px' }}
        >
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setShowSMA20(!showSMA20); sma20SeriesRef.current?.applyOptions({ visible: !showSMA20 }); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${showSMA20 ? 'bg-yellow-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`} title="20-period SMA">MA20</button>
            <button onClick={() => { setShowSMA50(!showSMA50); sma50SeriesRef.current?.applyOptions({ visible: !showSMA50 }); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${showSMA50 ? 'bg-orange-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`} title="50-period SMA">MA50</button>
            <button onClick={() => { setShowSMA200(!showSMA200); sma200SeriesRef.current?.applyOptions({ visible: !showSMA200 }); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${showSMA200 ? 'bg-purple-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`} title="200-period SMA">MA200</button>
            <span className="border-l border-slate-600 mx-1"></span>
            <button onClick={() => { setShowEMA12(!showEMA12); ema12SeriesRef.current?.applyOptions({ visible: !showEMA12 }); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${showEMA12 ? 'bg-cyan-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`} title="12-period EMA">EMA12</button>
            <button onClick={() => { setShowEMA26(!showEMA26); ema26SeriesRef.current?.applyOptions({ visible: !showEMA26 }); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${showEMA26 ? 'bg-pink-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`} title="26-period EMA">EMA26</button>
          </div>
        </div>

        {/* Chart container + canvas overlay */}
        <div className="relative">
          <div
            ref={chartContainerRef}
            data-chart-container
            className="w-full flex-1"
            style={{ minHeight: showRSI || showMACD ? 'calc(100% - 220px)' : '100%', cursor: drawingMode !== 'none' ? 'crosshair' : 'default' }}
          />
          {/* Canvas overlay: trendlines, ghost line, drafting cursor */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              zIndex: 5,
              pointerEvents: drawingMode === 'none' ? 'auto' : 'none',
              cursor: drawingMode !== 'none' ? 'crosshair' : 'default',
            }}
            onClick={(e) => {
              if (drawingMode !== 'none') return;
              const rect = canvasRef.current!.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const hitId = hitTestDrawing(x, y);
              setSelectedDrawingId(hitId);
            }}
          />
        </div>

        {/* RSI Indicator Pane */}
        {showRSI && (
          <div className="border-t border-slate-700">
            <div className="px-2 py-1 bg-slate-900/80 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-blue-400 font-medium">RSI</span>
              <span>14 close</span>
            </div>
            <div ref={rsiContainerRef} className="w-full" />
          </div>
        )}

        {/* MACD Indicator Pane */}
        {showMACD && (
          <div className="border-t border-slate-700">
            <div className="px-2 py-1 bg-slate-900/80 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-orange-400 font-medium">MACD</span>
              <span>12 26 close 9</span>
              <span className="text-blue-400">EMA</span>
              <span className="text-orange-400">EMA</span>
            </div>
            <div ref={macdContainerRef} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
