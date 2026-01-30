import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Pencil, TrendingUp, Trash2, Minus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface ChartData {
  time: string | number;  // string for daily (yyyy-mm-dd), number for intraday (Unix timestamp)
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
}

export default function InteractiveChart({ 
  data, 
  symbol, 
  currentPrice,
  supportLevels = [],
  resistanceLevels = [],
  timeframe: externalTimeframe,
  onTimeframeChange
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const drawingSeriesRef = useRef<any[]>([]);
  const priceLineRefs = useRef<any[]>([]);
  const [showVolume, setShowVolume] = useState(true);
  const [internalTimeframe, setInternalTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y');
  const timeframe = externalTimeframe ?? internalTimeframe;
  const setTimeframe = (tf: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y') => {
    setInternalTimeframe(tf);
    onTimeframeChange?.(tf);
  };
  const [drawingMode, setDrawingMode] = useState<'none' | 'trendline' | 'fibonacci' | 'horizontal'>('none');
  const [drawings, setDrawings] = useState<any[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ time: number; price: number } | null>(null);
  
  // SMA overlay states
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);
  const sma20SeriesRef = useRef<any>(null);
  const sma50SeriesRef = useRef<any>(null);
  const sma200SeriesRef = useRef<any>(null);

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
      setDrawings(savedDrawings);
    }
  }, [savedDrawings]);

  // Auto-save drawings when they change (debounced)
  useEffect(() => {
    if (!user || drawings.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveDrawingsMutation.mutate({ symbol, drawings });
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, symbol, user]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
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

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Convert data to lightweight-charts format
    const chartData: CandlestickData[] = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(chartData);

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as overlay
    });

    // Configure volume series positioning (v5 API)
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    const volumeData = data.map(d => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? '#10b98180' : '#ef444480',
    }));

    volumeSeries.setData(volumeData);

    // Calculate SMA helper function
    const calculateSMA = (period: number) => {
      const smaData: { time: Time; value: number }[] = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        smaData.push({
          time: data[i].time as Time,
          value: sum / period,
        });
      }
      return smaData;
    };

    // Add SMA series
    
    // SMA 20 (yellow)
    const sma20Series = chart.addSeries(LineSeries, {
      color: '#fbbf24',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20SeriesRef.current = sma20Series;
    if (data.length >= 20) {
      sma20Series.setData(calculateSMA(20));
    }
    sma20Series.applyOptions({ visible: showSMA20 });

    // SMA 50 (orange)
    const sma50Series = chart.addSeries(LineSeries, {
      color: '#f97316',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma50SeriesRef.current = sma50Series;
    if (data.length >= 50) {
      sma50Series.setData(calculateSMA(50));
    }
    sma50Series.applyOptions({ visible: showSMA50 });

    // SMA 200 (purple)
    const sma200Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma200SeriesRef.current = sma200Series;
    if (data.length >= 200) {
      sma200Series.setData(calculateSMA(200));
    }
    sma200Series.applyOptions({ visible: showSMA200 });

    // Add support/resistance lines
    supportLevels.forEach(level => {
      candlestickSeries.createPriceLine({
        price: level,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Support',
      });
    });

    resistanceLevels.forEach(level => {
      candlestickSeries.createPriceLine({
        price: level,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Resistance',
      });
    });

    // Add current price line
    candlestickSeries.createPriceLine({
      price: currentPrice,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'Current',
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Drawing functionality
    const handleChartClick = (param: any) => {
      if (drawingMode === 'none' || !param.point) return;

      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) return; // Guard against null price
      const time = param.time;

      // Horizontal line only needs one click
      if (drawingMode === 'horizontal') {
        const newDrawing = {
          type: 'horizontal',
          price,
          color: '#fbbf24', // Default yellow/gold color
        };
        setDrawings(prev => [...prev, newDrawing]);
        setDrawingMode('none');
        return;
      }

      // Trendline and Fibonacci need two clicks
      if (!param.time) return;

      if (!drawingStart) {
        // First click - start drawing
        setDrawingStart({ time, price });
      } else {
        // Second click - complete drawing
        const newDrawing = {
          type: drawingMode,
          start: drawingStart,
          end: { time, price },
        };
        setDrawings(prev => [...prev, newDrawing]);
        setDrawingStart(null);
        setDrawingMode('none');
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
      volumeSeriesRef.current.applyOptions({
        visible: showVolume,
      });
    }
  }, [showVolume]);

  // Render drawings
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current) return;

    // Clean up previous drawings to prevent duplicates
    drawingSeriesRef.current.forEach(series => {
      try {
        chartRef.current?.removeSeries(series);
      } catch (e) {
        // Series may already be removed
      }
    });
    drawingSeriesRef.current = [];

    priceLineRefs.current.forEach(priceLine => {
      try {
        candlestickSeriesRef.current?.removePriceLine(priceLine);
      } catch (e) {
        // Price line may already be removed
      }
    });
    priceLineRefs.current = [];

    drawings.forEach(drawing => {
      if (drawing.type === 'horizontal') {
        // Draw horizontal line
        const priceLine = candlestickSeriesRef.current.createPriceLine({
          price: drawing.price,
          color: drawing.color || '#fbbf24',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'H-Line',
        });
        priceLineRefs.current.push(priceLine);
      } else if (drawing.type === 'trendline') {
        // Draw trendline
        const series = (chartRef.current as any).addLineSeries({
          color: '#06b6d4',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData([
          { time: drawing.start.time, value: drawing.start.price },
          { time: drawing.end.time, value: drawing.end.price },
        ]);
        drawingSeriesRef.current.push(series);
      } else if (drawing.type === 'fibonacci') {
        // Draw Fibonacci retracement levels
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
            price,
            color: fib.color,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: fib.label,
          });
          priceLineRefs.current.push(priceLine);
        });
      }
    });
  }, [drawings]);

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 flex gap-1">
        {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            showVolume
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Volume
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'trendline' ? 'none' : 'trendline')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
            drawingMode === 'trendline'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="Draw Trendline"
        >
          <Pencil className="w-4 h-4" />
          Trendline
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'fibonacci' ? 'none' : 'fibonacci')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
            drawingMode === 'fibonacci'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="Draw Fibonacci Retracement"
        >
          <TrendingUp className="w-4 h-4" />
          Fibonacci
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'horizontal' ? 'none' : 'horizontal')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
            drawingMode === 'horizontal'
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="Draw Horizontal Line"
        >
          <Minus className="w-4 h-4" />
          H-Line
        </button>
        <div className="border-l border-slate-700 mx-1" />
        <button
          onClick={() => {
            setShowSMA20(!showSMA20);
            sma20SeriesRef.current?.applyOptions({ visible: !showSMA20 });
          }}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showSMA20
              ? 'bg-yellow-500 text-black'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="20-period Simple Moving Average"
        >
          SMA20
        </button>
        <button
          onClick={() => {
            setShowSMA50(!showSMA50);
            sma50SeriesRef.current?.applyOptions({ visible: !showSMA50 });
          }}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showSMA50
              ? 'bg-orange-500 text-black'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="50-period Simple Moving Average"
        >
          SMA50
        </button>
        <button
          onClick={() => {
            setShowSMA200(!showSMA200);
            sma200SeriesRef.current?.applyOptions({ visible: !showSMA200 });
          }}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showSMA200
              ? 'bg-purple-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          title="200-period Simple Moving Average"
        >
          SMA200
        </button>
        {drawings.length > 0 && (
          <button
            onClick={() => setDrawings([])}
            className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
