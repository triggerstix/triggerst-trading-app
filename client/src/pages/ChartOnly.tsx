import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Maximize2 } from "lucide-react";
import InteractiveChart from "@/components/InteractiveChart";
import { Button } from "@/components/ui/button";

/**
 * Chart-Only View - Full-screen chart without analysis panel
 * Dedicated page for chart-focused analysis
 */
export default function ChartOnly() {
  const { symbol } = useParams<{ symbol: string }>();
  const [, setLocation] = useLocation();

  // Fetch analysis data
  const analysisQuery = trpc.analysis.analyzeStock.useQuery(
    { symbol: symbol || "" },
    { 
      enabled: !!symbol, 
      refetchOnWindowFocus: false,
      refetchInterval: 30000,
    }
  );

  const { data: response, isLoading, error } = analysisQuery;
  const analysis = response;

  // Memoize chartData to prevent chart recreation
  const chartData = useMemo(() => analysis?.chartData, [analysis?.chartData]);

  // Memoize support/resistance levels
  const supportLevels = useMemo(() => {
    if (!analysis?.gann?.rallyAngle?.sustainablePrice) return [];
    return [
      analysis.gann.rallyAngle.sustainablePrice * 0.5,
      analysis.gann.rallyAngle.sustainablePrice * 0.75,
      analysis.gann.rallyAngle.sustainablePrice,
    ];
  }, [analysis?.gann?.rallyAngle?.sustainablePrice]);

  const resistanceLevels = useMemo(() => {
    if (!analysis?.gann?.rallyAngle?.sustainablePrice) return [];
    return [
      analysis.gann.rallyAngle.sustainablePrice * 1.25,
      analysis.gann.rallyAngle.sustainablePrice * 1.5,
    ];
  }, [analysis?.gann?.rallyAngle?.sustainablePrice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load chart</h2>
          <p className="text-slate-400 mb-4">
            {error?.message || "Unable to fetch data"}
          </p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#0f1420] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/chart/${symbol}`)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{symbol}</h1>
            <span className="text-2xl font-bold text-white">
              ${analysis.stockInfo.currentPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-slate-400">Full Screen Chart</span>
        </div>
      </div>

      {/* Full-screen Chart */}
      <div className="flex-1 p-4">
        <div className="h-full rounded-lg overflow-hidden">
          <InteractiveChart
            data={chartData || []}
            symbol={symbol || ""}
            currentPrice={analysis.stockInfo.currentPrice}
            supportLevels={supportLevels}
            resistanceLevels={resistanceLevels}
          />
        </div>
      </div>
    </div>
  );
}
