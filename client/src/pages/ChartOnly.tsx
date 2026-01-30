/**
 * ChartOnly - Full-screen chart view without analysis panel
 */
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import InteractiveChart from '@/components/InteractiveChart';
import { useMemo, useState } from 'react';

export default function ChartOnly() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || '';
  const [, setLocation] = useLocation();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y');

  const { data: analysis, isLoading, error } = trpc.analysis.analyzeStock.useQuery(
    { symbol, timeframe },
    { 
      enabled: !!symbol,
      refetchInterval: 30000,
    }
  );

  const chartData = useMemo(() => {
    if (!analysis?.chartData) return [];
    return analysis.chartData;
  }, [analysis?.chartData]);

  const supportLevels = useMemo(() => {
    if (!analysis?.gann?.rallyAngle?.sustainablePrice) return [];
    return [
      analysis.gann.rallyAngle.sustainablePrice * 0.75,
      analysis.gann.rallyAngle.sustainablePrice * 0.5,
    ];
  }, [analysis?.gann?.rallyAngle?.sustainablePrice]);

  const resistanceLevels = useMemo(() => {
    if (!analysis?.gann?.rallyAngle?.sustainablePrice) return [];
    return [
      analysis.gann.rallyAngle.sustainablePrice * 1.25,
      analysis.gann.rallyAngle.sustainablePrice * 1.5,
    ];
  }, [analysis?.gann?.rallyAngle?.sustainablePrice]);

  if (!symbol) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">No symbol provided</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/chart/${symbol}`)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Analysis
          </Button>
          <span className="text-xl font-bold text-white">{symbol}</span>
          {analysis && (
            <span className="text-lg text-slate-400">
              ${analysis.stockInfo?.currentPrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Full-screen Chart */}
      <div className="flex-1 p-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-400">Error loading chart data</p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[calc(100vh-60px)]">
            <InteractiveChart
              data={chartData}
              symbol={symbol}
              currentPrice={analysis?.stockInfo?.currentPrice || 0}
              supportLevels={supportLevels}
              resistanceLevels={resistanceLevels}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
