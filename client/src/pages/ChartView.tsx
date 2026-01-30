import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Star, Maximize2 } from "lucide-react";
import InteractiveChart from "@/components/InteractiveChart";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Triggerstix Chart View - Webull-style Trading Interface
 * Full-screen chart with dual-method analysis sidebar
 */
export default function ChartView() {
  const { symbol } = useParams<{ symbol: string }>();
  const [, setLocation] = useLocation();

  // Fetch analysis data with real-time updates
  const analysisQuery = trpc.analysis.analyzeStock.useQuery(
    { symbol: symbol || "" },
    { 
      enabled: !!symbol, 
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: response, isLoading, error } = analysisQuery;
  const analysis = response;

  // Memoize chartData to prevent chart recreation on refetch
  const chartData = useMemo(() => analysis?.chartData, [analysis?.chartData]);

  // Show toast notification when signals change
  const [prevRecommendation, setPrevRecommendation] = useState<string | null>(null);
  
  useEffect(() => {
    if (analysis?.recommendation?.action) {
      if (prevRecommendation && prevRecommendation !== analysis.recommendation.action) {
        toast.info(`Signal changed: ${analysis.recommendation.action}`, {
          description: `${symbol} recommendation updated`,
        });
      }
      setPrevRecommendation(analysis.recommendation.action);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.recommendation?.action, symbol]);

  // Auth and watchlist
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const isInWatchlistQuery = trpc.watchlist.isInWatchlist.useQuery(
    { symbol: symbol || "" },
    { enabled: !!symbol && !!user }
  );
  
  const addToWatchlistMutation = trpc.watchlist.addToWatchlist.useMutation({
    onSuccess: () => {
      toast.success(`${symbol} added to watchlist`);
      utils.watchlist.isInWatchlist.invalidate();
      utils.watchlist.getWatchlist.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add to watchlist: ${error.message}`);
    },
  });
  
  const removeFromWatchlistMutation = trpc.watchlist.removeFromWatchlist.useMutation({
    onSuccess: () => {
      toast.success(`${symbol} removed from watchlist`);
      utils.watchlist.isInWatchlist.invalidate();
      utils.watchlist.getWatchlist.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove from watchlist: ${error.message}`);
    },
  });
  
  const handleWatchlistToggle = () => {
    if (!user) {
      toast.error("Please sign in to use watchlist");
      return;
    }
    
    if (!symbol) return;
    
    if (isInWatchlistQuery.data) {
      removeFromWatchlistMutation.mutate({ symbol });
    } else {
      addToWatchlistMutation.mutate({ symbol });
    }
  };

  // Memoize support/resistance levels to prevent chart recreation
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

  // Export handlers
  const handleExport = async (format: 'longForm' | 'shortForm' | 'slideshow') => {
    if (!symbol) return;
    
    try {
      toast.info(`Generating ${format === 'longForm' ? 'long-form report' : format === 'shortForm' ? 'short summary' : 'slideshow'}...`);
      
      // Fetch export data using tRPC client
      const fetchExport = async () => {
        if (format === 'longForm') {
          return await utils.client.export.longForm.query({ symbol: symbol || "" });
        } else if (format === 'shortForm') {
          return await utils.client.export.shortForm.query({ symbol: symbol || "" });
        } else {
          return await utils.client.export.slideshow.query({ symbol: symbol || "" });
        }
      };
      
      const result = await fetchExport() as { format: 'pdf' | 'html' | 'text'; content: string; filename: string };
      
      // Create download
      let blob: Blob;
      if (result.format === 'pdf') {
        // Decode base64 PDF
        const binaryString = atob(result.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/pdf' });
      } else if (result.format === 'html') {
        blob = new Blob([result.content], { type: 'text/html' });
      } else {
        blob = new Blob([result.content], { type: 'text/plain' });
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Export complete!');
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Risk color mapping
  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-400 bg-green-400/10 border-green-400/30";
      case "MODERATE":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "HIGH":
        return "text-orange-400 bg-orange-400/10 border-orange-400/30";
      case "EXTREME":
        return "text-red-400 bg-red-400/10 border-red-400/30";
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/30";
    }
  };

  // Recommendation color
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "BUY":
        return "text-green-400 bg-green-400/20";
      case "SELL":
        return "text-red-400 bg-red-400/20";
      case "HOLD":
        return "text-yellow-400 bg-yellow-400/20";
      case "AVOID":
        return "text-orange-400 bg-orange-400/20";
      default:
        return "text-slate-400 bg-slate-400/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Analyzing {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    // Common ticker typos
    const suggestions: Record<string, string> = {
      'APPL': 'AAPL',
      'GOOGL': 'GOOG',
      'TSLA': 'TSLA',
      'AMZN': 'AMZN',
    };
    const suggestion = suggestions[symbol || ''];

    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400 text-lg font-semibold mb-2">Symbol Not Found</p>
            <p className="text-slate-300 mb-4">
              Unable to fetch data for <span className="font-mono font-bold">{symbol}</span>
            </p>
            {suggestion && (
              <p className="text-slate-400 text-sm">
                Did you mean <button 
                  onClick={() => setLocation(`/chart/${suggestion}`)}
                  className="text-blue-400 hover:text-blue-300 underline font-mono font-bold"
                >
                  {suggestion}
                </button>?
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            {suggestion && (
              <Button onClick={() => setLocation(`/chart/${suggestion}`)} className="bg-blue-600 hover:bg-blue-700">
                Try {suggestion}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;
  
  const { gann, ney, combinedRisk, agreement, recommendation } = analysis;
  const currentPrice = response?.stockInfo?.currentPrice || 0;
  const pivotPrice = gann.rallyAngle.sustainablePrice;

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1129]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{symbol}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(
                    combinedRisk
                  )}`}
                >
                  {combinedRisk} RISK
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-2xl font-semibold">
                  ${currentPrice.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    currentPrice >= pivotPrice
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {currentPrice >= pivotPrice ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {gann.rallyAngle.deviation.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Chart-Only Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/chart-only/${symbol}`)}
              className="flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Full Screen
            </Button>

            {/* Watchlist Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWatchlistToggle}
              disabled={!user || addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending}
              className="flex items-center gap-2"
            >
              <Star 
                className={`w-4 h-4 ${isInWatchlistQuery.data ? 'fill-yellow-400 text-yellow-400' : ''}`}
              />
              {isInWatchlistQuery.data ? 'Remove' : 'Watchlist'}
            </Button>

            {/* Recommendation */}
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Recommendation</div>
              <div
                className={`px-6 py-2 rounded-lg text-xl font-bold ${getRecommendationColor(
                  recommendation.action
                )}`}
              >
                {recommendation.action}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Chart Area (Left) */}
        <div className="flex-1 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl h-full overflow-hidden">
            {chartData && (
              <InteractiveChart
                data={chartData}
                symbol={symbol || ''}
                currentPrice={currentPrice}
                supportLevels={supportLevels}
                resistanceLevels={resistanceLevels}
              />
            )}
            {!analysis?.chartData && (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Loading chart data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Panel (Right) */}
        <div className="w-96 border-l border-slate-800 bg-[#0d1129] overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-slate-900 border-b border-slate-800 rounded-none">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gann">Price Analysis</TabsTrigger>
              <TabsTrigger value="ney">Market Phase</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  COMBINED ANALYSIS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Risk Level</span>
                    <span className="font-semibold">{combinedRisk}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Agreement</span>
                    <span className="font-semibold text-green-400">
                      {agreement}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Action</span>
                    <span className="font-semibold text-blue-400">
                      {recommendation.action}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  PRICE TARGETS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  {recommendation.stopLoss && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Stop Loss</span>
                      <span className="font-semibold text-red-400">
                        ${recommendation.stopLoss.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {recommendation.target && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Target</span>
                      <span className="font-semibold text-green-400">
                        ${recommendation.target.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current</span>
                    <span className="font-semibold">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  REASONING
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  EXPORT REPORTS
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleExport('longForm')}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Long-Form Report (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleExport('shortForm')}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Short Summary (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleExport('slideshow')}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Slideshow (PDF)
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Price Analysis Tab */}
            <TabsContent value="gann" className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  PRICE ANGLES
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Rally Angle</span>
                    <span className="font-semibold">{gann.rallyAngle.angle}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Sustainable Price</span>
                    <span className="font-semibold">${gann.rallyAngle.sustainablePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Deviation</span>
                    <span
                      className={`font-semibold ${
                        gann.rallyAngle.deviation < 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {gann.rallyAngle.deviation.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  KEY LEVELS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  {gann.squareOfNineLevels
                    .filter(l => l.type === "support")
                    .slice(0, 2)
                    .map((level, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-slate-400">Support {idx + 1}</span>
                        <span className="font-semibold text-green-400">
                          ${level.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {gann.squareOfNineLevels
                    .filter(l => l.type === "resistance")
                    .slice(0, 2)
                    .map((level, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-slate-400">Resistance {idx + 1}</span>
                        <span className="font-semibold text-red-400">
                          ${level.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  SUMMARY
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {gann.summary}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Market Phase Tab */}
            <TabsContent value="ney" className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  MARKET PHASE
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {ney.currentPhase}
                    </div>
                    <div className="text-sm text-slate-400">Current Phase</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Specialist Behavior</span>
                    <span className="font-semibold">{ney.specialistBehavior}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  VOLUME ANALYSIS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Pattern</span>
                    <span className="font-semibold">{ney.volumePattern}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Risk Level</span>
                    <span className="font-semibold">{ney.riskLevel}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  SUMMARY
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {ney.summary}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
