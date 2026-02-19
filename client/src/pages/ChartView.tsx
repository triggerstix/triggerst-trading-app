import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Star, Maximize2 } from "lucide-react";
import InteractiveChart from "@/components/InteractiveChart";
import { useAuth } from "@/_core/hooks/useAuth";
import { generateClientPdf } from "@/utils/clientPdfGenerator";
import html2canvas from 'html2canvas';
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
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y');

  // Fetch analysis data with real-time updates
  const analysisQuery = trpc.analysis.analyzeStock.useQuery(
    { symbol: symbol || "", timeframe },
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
  
  // Calculate OHLC from latest data for header display (must be before early returns)
  const ohlcData = useMemo(() => {
    if (!chartData || chartData.length === 0) return undefined;
    const latest = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : latest;
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    return {
      open: latest.open,
      high: latest.high,
      low: latest.low,
      close: latest.close,
      change,
      changePercent,
      volume: latest.volume
    };
  }, [chartData]);

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

  // Save analysis to history
  const saveHistoryMutation = trpc.analysisHistory.save.useMutation();
  const [historySaved, setHistorySaved] = useState(false);

  useEffect(() => {
    if (user && analysis && symbol && !historySaved) {
      saveHistoryMutation.mutate({
        symbol: symbol.toUpperCase(),
        companyName: analysis.companyProfile?.longName || analysis.companyProfile?.shortName || null,
        recommendation: analysis.recommendation?.action || null,
        riskLevel: analysis.combinedRisk || null,
        agreement: analysis.agreement ? `${analysis.agreement}%` : null,
        currentPrice: analysis.stockInfo?.currentPrice?.toFixed(2) || null,
      });
      setHistorySaved(true);
    }
  }, [user, analysis, symbol, historySaved]);
  
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

  // Capture chart as image for PDF
  const captureChartImage = async (): Promise<string | undefined> => {
    try {
      // Try to get the chart container
      const chartElement = document.querySelector('[data-chart-container]') as HTMLElement;
      if (!chartElement) {
        console.log('Chart container not found');
        return undefined;
      }
      
      // Find the main canvas element (TradingView chart)
      const mainCanvas = chartElement.querySelector('canvas') as HTMLCanvasElement;
      if (mainCanvas) {
        // Directly export the canvas to image
        try {
          return mainCanvas.toDataURL('image/png');
        } catch (e) {
          console.log('Canvas export failed, trying html2canvas:', e);
        }
      }
      
      // Fallback to html2canvas for the entire container
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#0a0e1a',
        scale: 1.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture chart:', error);
      return undefined;
    }
  };

  // Fetch company logo via server proxy (bypasses CORS)
  const fetchCompanyLogo = async (): Promise<string | undefined> => {
    try {
      // Use fetch to call the tRPC endpoint directly with batch format
      const batchInput = JSON.stringify({"0":{"json":{"symbol": symbol}}});
      const response = await fetch(`/api/trpc/export.getCompanyLogo?batch=1&input=${encodeURIComponent(batchInput)}`);
      const data = await response.json();
      // Parse batch response format
      if (Array.isArray(data) && data[0]?.result?.data?.json?.success && data[0]?.result?.data?.json?.logoBase64) {
        return data[0].result.data.json.logoBase64;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  // Export handler - client-side PDF generation (works in production)
  const handleExport = async () => {
    if (!symbol || !analysis) return;
    
    const loadingToast = toast.loading('Generating Investment Analysis PDF...');
    
    try {
      // Capture chart image and fetch logo in parallel
      const [chartImageBase64, logoBase64] = await Promise.all([
        captureChartImage(),
        fetchCompanyLogo(),
      ]);
      
      // Generate PDF entirely on client side using jsPDF
      const pdfBlob = await generateClientPdf({
        symbol,
        companyName: analysis.companyProfile?.longName || analysis.companyProfile?.shortName || symbol,
        currentPrice: analysis.stockInfo.currentPrice,
        high52Week: analysis.stockInfo.high52Week,
        low52Week: analysis.stockInfo.low52Week,
        gann: {
          rallyAngle: {
            sustainablePrice: analysis.gann.rallyAngle.sustainablePrice,
            riskLevel: analysis.gann.riskLevel,
            signal: analysis.gann.riskLevel === 'LOW' ? 'BUY' : 'HOLD',
          },
          squareOfNineLevels: analysis.gann.squareOfNineLevels.map(l => ({ level: l.price, type: l.type, description: l.type })),
        },
        ney: {
          phase: analysis.ney.currentPhase,
          signal: analysis.ney.riskLevel === 'LOW' ? 'BUY' : analysis.ney.riskLevel === 'EXTREME' ? 'SELL' : 'HOLD',
          confidence: 100 - (analysis.ney.riskScore || 1) * 20,
        },
        recommendation: analysis.recommendation,
        agreement: analysis.agreement,
        combinedRisk: analysis.combinedRisk,
        companyProfile: analysis.companyProfile,
        peakPrice: analysis.stockInfo.peakPrice,
        startPrice: analysis.stockInfo.startPrice,
        tradingDays: analysis.stockInfo.tradingDays,
        chartImageBase64,
        logoBase64,
      });
      
      // Download the PDF - use blob URL for direct download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${symbol}InvestmentAnalysis.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      toast.dismiss(loadingToast);
      toast.success('Export complete!');
    } catch (error) {
      toast.dismiss(loadingToast);
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
              {/* Company Name and Beta */}
              {analysis.companyProfile?.longName && (
                <p className="text-slate-400 text-sm mt-0.5">
                  {analysis.companyProfile.longName}
                  {analysis.companyProfile.sector && (
                    <span className="text-slate-500"> • {analysis.companyProfile.sector}</span>
                  )}
                  {analysis.companyProfile.beta !== undefined && (
                    <span className="text-slate-500"> • β: {analysis.companyProfile.beta.toFixed(2)}</span>
                  )}
                </p>
              )}
              <div className="flex items-center gap-4 mt-1">
                <span className="text-2xl font-semibold">
                  ${currentPrice.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    ohlcData && ohlcData.changePercent >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {ohlcData && ohlcData.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {ohlcData ? `${ohlcData.changePercent >= 0 ? '+' : ''}${ohlcData.changePercent.toFixed(2)}%` : '0.00%'}
                </span>
                {analysis.companyProfile?.beta !== undefined && (
                  <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                    <span className="text-slate-400 text-sm">Volatility</span>
                    <span className={`font-semibold ${
                      analysis.companyProfile.beta > 1 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      Beta {analysis.companyProfile.beta.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Full Screen Button */}
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
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                ohlc={ohlcData}
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
        <div className="w-80 min-w-80 border-l border-slate-800 bg-[#0d1129] overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-slate-900 border-b border-slate-800 rounded-none">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gann">Price Analysis</TabsTrigger>
              <TabsTrigger value="ney">Market Phase</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-3 space-y-3">
              {/* Company Description */}
              {analysis.companyProfile?.longBusinessSummary && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">
                    ABOUT {symbol}
                  </h3>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {analysis.companyProfile.longBusinessSummary}
                    </p>
                    {analysis.companyProfile.industry && (
                      <p className="text-xs text-slate-500 mt-2">
                        Industry: {analysis.companyProfile.industry}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  COMBINED ANALYSIS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Risk Level</span>
                    <span className="text-sm font-semibold">{combinedRisk}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Agreement</span>
                    <span className="text-sm font-semibold text-green-400">
                      {agreement}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Action</span>
                    <span className="text-sm font-semibold text-blue-400">
                      {recommendation.action}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  PRICE TARGETS
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                  {recommendation.stopLoss && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Stop Loss</span>
                      <span className="text-sm font-semibold text-red-400">
                        ${recommendation.stopLoss.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {recommendation.target && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Target</span>
                      <span className="text-sm font-semibold text-green-400">
                        ${recommendation.target.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Current</span>
                    <span className="text-sm font-semibold">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  REASONING
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  EXPORT ANALYSIS
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
                  onClick={() => handleExport()}
                >
                  <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-orange-400">Download Analysis</span>
                </Button>
                <p className="text-xs text-slate-500 mt-2">2-page Investment Analysis PDF</p>
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
