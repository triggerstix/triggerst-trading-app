import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Pencil, TrendingUp, Trash2, Minus, MousePointer2, Type, Ruler, ZoomIn, ZoomOut, Crosshair, BarChart3, Activity } from 'lucide-react';
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
  ohlc?: { open: number; high: number; low: number; close: number; change: number; changePercent: number; volume: number };
}

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

    // Calculate EMA helper function
    const calculateEMA = (period: number) => {
      const emaData: { time: Time; value: number }[] = [];
      const multiplier = 2 / (period + 1);
      let ema = 0;
      
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          // Not enough data yet, skip
          continue;
        } else if (i === period - 1) {
          // First EMA is SMA
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
          }
          ema = sum / period;
        } else {
          // EMA = (Close - Previous EMA) * multiplier + Previous EMA
          ema = (data[i].close - ema) * multiplier + ema;
        }
        emaData.push({
          time: data[i].time as Time,
          value: ema,
        });
      }
      return emaData;
    };

    // Add EMA series
    
    // EMA 12 (cyan/teal)
    const ema12Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema12SeriesRef.current = ema12Series;
    if (data.length >= 12) {
      ema12Series.setData(calculateEMA(12));
    }
    ema12Series.applyOptions({ visible: showEMA12 });

    // EMA 26 (pink/magenta)
    const ema26Series = chart.addSeries(LineSeries, {
      color: '#ec4899',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema26SeriesRef.current = ema26Series;
    if (data.length >= 26) {
      ema26Series.setData(calculateEMA(26));
    }
    ema26Series.applyOptions({ visible: showEMA26 });

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

  // RSI Chart
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || data.length < 14) return;

    // Calculate RSI
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

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: false,
    });
    rsiSeries.setData(calculateRSI());

    // Add overbought/oversold lines
    rsiSeries.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2 });
    rsiSeries.createPriceLine({ price: 30, color: '#10b981', lineWidth: 1, lineStyle: 2 });

    return () => { rsiChart.remove(); };
  }, [showRSI, data]);

  // MACD Chart
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current || data.length < 26) return;

    // Calculate EMA
    const calculateEMA = (period: number, prices: number[]) => {
      const k = 2 / (period + 1);
      const ema: number[] = [prices[0]];
      for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    };

    const closes = data.map(d => d.close);
    const ema12 = calculateEMA(12, closes);
    const ema26 = calculateEMA(26, closes);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calculateEMA(9, macdLine.slice(25));

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
    <div className="relative flex">
      {/* Left vertical toolbar - Webull style */}
      <div className="w-10 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-2 gap-1">
        <button
          onClick={() => setDrawingMode('none')}
          className={`p-2 rounded transition-colors ${
            drawingMode === 'none' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Select"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'trendline' ? 'none' : 'trendline')}
          className={`p-2 rounded transition-colors ${
            drawingMode === 'trendline' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Trendline"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'horizontal' ? 'none' : 'horizontal')}
          className={`p-2 rounded transition-colors ${
            drawingMode === 'horizontal' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDrawingMode(drawingMode === 'fibonacci' ? 'none' : 'fibonacci')}
          className={`p-2 rounded transition-colors ${
            drawingMode === 'fibonacci' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Fibonacci Retracement"
        >
          <Ruler className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-700 w-6 my-1" />
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`p-2 rounded transition-colors ${
            showVolume ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Volume"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowRSI(!showRSI)}
          className={`p-2 rounded transition-colors text-xs font-bold ${
            showRSI ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="RSI (14)"
        >
          RSI
        </button>
        <button
          onClick={() => setShowMACD(!showMACD)}
          className={`p-2 rounded transition-colors text-xs font-bold ${
            showMACD ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="MACD (12,26,9)"
        >
          MCD
        </button>
        <div className="border-t border-slate-700 w-6 my-1" />
        {drawings.length > 0 && (
          <button
            onClick={() => setDrawings([])}
            className="p-2 rounded text-red-400 hover:bg-slate-800 transition-colors"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Main chart area */}
      <div className="flex-1 relative">
        {/* OHLC Header - Webull style */}
        {ohlc && (
          <div className="bg-slate-900/95 border-b border-slate-700 px-3 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white font-semibold">{symbol}</span>
              <span className="text-slate-400">O</span>
              <span className="text-white">{ohlc.open.toFixed(2)}</span>
              <span className="text-slate-400">H</span>
              <span className="text-emerald-400">{ohlc.high.toFixed(2)}</span>
              <span className="text-slate-400">L</span>
              <span className="text-red-400">{ohlc.low.toFixed(2)}</span>
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
        {/* Top toolbar - Timeframe and indicators */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1" style={{ top: ohlc ? '48px' : '8px' }}>
          {/* Timeframe buttons */}
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          {/* SMA and EMA indicators - stacked below timeframe */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                setShowSMA20(!showSMA20);
                sma20SeriesRef.current?.applyOptions({ visible: !showSMA20 });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showSMA20 ? 'bg-yellow-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
              }`}
              title="20-period SMA"
            >
              MA20
            </button>
            <button
              onClick={() => {
                setShowSMA50(!showSMA50);
                sma50SeriesRef.current?.applyOptions({ visible: !showSMA50 });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showSMA50 ? 'bg-orange-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
              }`}
              title="50-period SMA"
            >
              MA50
            </button>
            <button
              onClick={() => {
                setShowSMA200(!showSMA200);
                sma200SeriesRef.current?.applyOptions({ visible: !showSMA200 });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showSMA200 ? 'bg-purple-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
              }`}
              title="200-period SMA"
            >
              MA200
            </button>
            <span className="border-l border-slate-600 mx-1"></span>
            <button
              onClick={() => {
                setShowEMA12(!showEMA12);
                ema12SeriesRef.current?.applyOptions({ visible: !showEMA12 });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showEMA12 ? 'bg-cyan-500 text-black' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
              }`}
              title="12-period EMA"
            >
              EMA12
            </button>
            <button
              onClick={() => {
                setShowEMA26(!showEMA26);
                ema26SeriesRef.current?.applyOptions({ visible: !showEMA26 });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showEMA26 ? 'bg-pink-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
              }`}
              title="26-period EMA"
            >
              EMA26
            </button>
          </div>
        </div>
        <div ref={chartContainerRef} data-chart-container className="w-full flex-1" style={{ minHeight: showRSI || showMACD ? 'calc(100% - 220px)' : '100%' }} />
        
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
