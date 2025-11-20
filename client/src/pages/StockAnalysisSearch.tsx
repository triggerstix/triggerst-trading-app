import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function StockAnalysisSearch() {
  const [symbol, setSymbol] = useState("");
  const [, setLocation] = useLocation();

  const handleAnalyze = () => {
    if (symbol.trim()) {
      setLocation(`/analyze/${symbol.toUpperCase()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  // Recent analyses - hardcoded for now
  const recentAnalyses = [
    { symbol: "BTC-USD", price: "$91,431", risk: "MODERATE", riskLevel: 2, color: "yellow" },
    { symbol: "AAPL", price: "$268.56", risk: "LOW", riskLevel: 1, color: "green" },
    { symbol: "PLTR", price: "$193.61", risk: "EXTREME", riskLevel: 5, color: "red" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold">Stock Analysis</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 max-w-md mx-auto">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search Symbol (e.g., AAPL, BTC-USD)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 h-12 text-lg"
            />
          </div>
          <Button 
            onClick={handleAnalyze}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
          >
            Analyze Stock
          </Button>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-300">Recent Analyses</h2>
          <div className="space-y-3">
            {recentAnalyses.map((analysis) => (
              <Card 
                key={analysis.symbol}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => setLocation(`/analyze/${analysis.symbol}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{analysis.symbol}</h3>
                      <p className="text-slate-400 text-sm">{analysis.price}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-0.5 mb-1 justify-end">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < analysis.riskLevel
                                ? analysis.color === "red"
                                  ? "bg-red-500"
                                  : analysis.color === "green"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                                : "bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-sm font-medium ${
                        analysis.color === "red" 
                          ? "text-red-500" 
                          : analysis.color === "green"
                          ? "text-green-500"
                          : "text-yellow-500"
                      }`}>
                        {analysis.risk}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-slate-800/30 border-slate-700">
          <CardContent className="p-6 text-slate-400 text-sm space-y-3">
            <p>
              Combining <strong className="text-white">W.D. Gann's</strong> geometric analysis 
              with <strong className="text-white">Richard Ney's</strong> specialist behavior patterns.
            </p>
            <div className="space-y-2">
              <p><strong className="text-white">Gann Analysis:</strong> Angles, Square of Nine, geometric levels</p>
              <p><strong className="text-white">Ney Analysis:</strong> Accumulation, distribution, specialist signals</p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 text-center mt-8">
          For educational purposes only. Not financial advice.
        </p>
      </main>
    </div>
  );
}
