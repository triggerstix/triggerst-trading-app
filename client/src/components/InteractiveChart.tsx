import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, Time } from 'lightweight-charts';

interface ChartData {
  time: string;
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
}

export default function InteractiveChart({ 
  data, 
  symbol, 
  currentPrice,
  supportLevels = [],
  resistanceLevels = []
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [showVolume, setShowVolume] = useState(true);

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
    const candlestickSeries = (chart as any).addCandlestickSeries({
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
    const volumeSeries = (chart as any).addHistogramSeries({
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
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

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, currentPrice, supportLevels, resistanceLevels]);

  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({
        visible: showVolume,
      });
    }
  }, [showVolume]);

  return (
    <div className="relative">
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
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
