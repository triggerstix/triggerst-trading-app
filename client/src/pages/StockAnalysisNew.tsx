import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function StockAnalysisNew() {
  const [, params] = useRoute("/analyze/:symbol");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  const symbol = params?.symbol?.toUpperCase() || "AAPL";

  // Fetch real stock data and analysis from Yahoo Finance
  const { data: analysis, isLoading, error } = trpc.analysis.analyzeStock.useQuery(
    { symbol },
    {
      retry: 2,
      retryDelay: 1000,
      staleTime: 60000, // Cache for 1 minute
    }
  );

  const tabs = [
    { id: 0, name: "Overview", icon: "📊" },
    { id: 1, name: "Gann", icon: "📐" },
    { id: 2, name: "Ney", icon: "📈" },
    { id: 3, name: "Forecast", icon: "🔮" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 mb-4">Error loading analysis</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "EXTREME": return "text-red-500";
      case "HIGH": return "text-orange-500";
      case "MODERATE": return "text-yellow-500";
      case "LOW": return "text-green-500";
      default: return "text-slate-400";
    }
  };

  const getRiskDots = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < score ? "bg-red-500" : "bg-slate-700"
        }`}
      />
    ));
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY": return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "SELL": return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "HOLD": return <Minus className="h-5 w-5 text-blue-500" />;
      case "AVOID": return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <Minus className="h-5 w-5 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return "bg-green-600 hover:bg-green-700";
      case "SELL": return "bg-red-600 hover:bg-red-700";
      case "HOLD": return "bg-blue-600 hover:bg-blue-700";
      case "AVOID": return "bg-red-700 hover:bg-red-800";
      default: return "bg-slate-600 hover:bg-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white pb-8">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4 sticky top-0 bg-[#0a0e27] z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{symbol}</h1>
            <p className="text-sm text-slate-400">
              ${analysis?.stockInfo?.currentPrice?.toFixed(2) || "--"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 px-4 py-4 max-w-2xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 max-w-2xl mx-auto space-y-4">
        {/* Overview Tab */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Risk Summary Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Combined Risk</h3>
                <div className="flex gap-1">{getRiskDots(analysis.combinedScore)}</div>
              </div>
              <p className={`text-3xl font-bold mb-2 ${getRiskColor(analysis.combinedRisk)}`}>
                {analysis.combinedRisk}
              </p>
              <p className="text-sm text-slate-400">
                {analysis.agreement}% agreement between Gann and Ney
              </p>
            </div>

            {/* Recommendation Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getActionIcon(analysis.recommendation.action)}
                <h3 className="text-lg font-semibold">Recommendation</h3>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold mb-4 ${getActionColor(analysis.recommendation.action)}`}>
                {analysis.recommendation.action}
              </div>
              <p className="text-slate-300 mb-4">{analysis.recommendation.reasoning}</p>
              
              {analysis.recommendation.stopLoss && (
                <div className="flex items-center justify-between py-2 border-t border-slate-700">
                  <span className="text-sm text-slate-400">Stop Loss</span>
                  <span className="font-semibold text-red-400">
                    ${analysis.recommendation.stopLoss.toFixed(2)}
                  </span>
                </div>
              )}
              
              {analysis.recommendation.target && (
                <div className="flex items-center justify-between py-2 border-t border-slate-700">
                  <span className="text-sm text-slate-400">Target</span>
                  <span className="font-semibold text-green-400">
                    ${analysis.recommendation.target.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <p className="text-slate-300">{analysis.summary}</p>
            </div>
          </div>
        )}

        {/* Gann Tab */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Gann Analysis</h2>

            {/* Rally Angle */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-2">Rally Angle</h3>
              <p className="text-3xl font-bold text-white mb-2">{analysis.gann.rallyAngle.angle}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Price</span>
                  <span className="text-white font-semibold">
                    ${analysis.gann.rallyAngle.currentPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sustainable (1x1)</span>
                  <span className="text-white font-semibold">
                    ${analysis.gann.rallyAngle.sustainablePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deviation</span>
                  <span className={analysis.gann.rallyAngle.deviation > 0 ? "text-red-400" : "text-green-400"}>
                    {analysis.gann.rallyAngle.deviation > 0 ? "+" : ""}
                    {analysis.gann.rallyAngle.deviation.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-2">Gann Risk Level</h3>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${getRiskColor(analysis.gann.riskLevel)}`}>
                  {analysis.gann.riskLevel}
                </p>
                <div className="flex gap-1">{getRiskDots(analysis.gann.riskScore)}</div>
              </div>
            </div>

            {/* Square of Nine */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-4">Square of Nine Levels</h3>
              <div className="space-y-2">
                {analysis.gann.squareOfNineLevels.slice(0, 8).map((level, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <span className={`font-medium ${level.active ? "text-white" : "text-slate-400"}`}>
                      ${level.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        level.type === "resistance" 
                          ? "bg-red-900/30 text-red-400" 
                          : "bg-green-900/30 text-green-400"
                      }`}>
                        {level.type}
                      </span>
                      {level.active && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-400 italic">{analysis.gann.summary}</p>
          </div>
        )}

        {/* Ney Tab */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ney Analysis</h2>

            {/* Current Phase */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-2">Current Phase</h3>
              <p className="text-3xl font-bold text-white mb-2">{analysis.ney.currentPhase}</p>
              <p className="text-sm text-slate-300">{analysis.ney.specialistBehavior}</p>
            </div>

            {/* Risk Assessment */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-2">Ney Risk Level</h3>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${getRiskColor(analysis.ney.riskLevel)}`}>
                  {analysis.ney.riskLevel}
                </p>
                <div className="flex gap-1">{getRiskDots(analysis.ney.riskScore)}</div>
              </div>
            </div>

            {/* Volume Pattern */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-2">Volume Pattern</h3>
              <p className="text-white">{analysis.ney.volumePattern}</p>
            </div>

            {/* Phase History */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm text-slate-400 mb-4">Phase History</h3>
              <div className="space-y-3">
                {analysis.ney.phaseHistory.map((phase, idx) => (
                  <div key={idx} className="border-l-2 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{phase.phase}</span>
                      <span className="text-xs text-slate-400">{phase.duration}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {phase.priceRange} • {phase.volumePattern}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-400 italic">{analysis.ney.summary}</p>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Forecast Scenarios</h2>

            {analysis.scenarios.map((scenario) => (
              <div key={scenario.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{scenario.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{scenario.name}</h3>
                      <p className="text-sm text-slate-400">{scenario.timeline}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">{scenario.probability}%</p>
                    <p className="text-xs text-slate-400">probability</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Target</span>
                    <span className="font-semibold text-white">{scenario.target}</span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${scenario.probability}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Probabilities are based on combined Gann geometric analysis and Ney specialist behavior patterns. Market conditions can change rapidly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
