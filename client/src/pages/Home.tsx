import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Triggerstix - Webull-style Trading Interface
 * Chart-first layout with Gann+Ney analysis
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [symbol, setSymbol] = useState("");



  const handleAnalyze = (sym: string) => {
    if (sym) {
      setLocation(`/chart/${sym.toUpperCase()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze(symbol);
  };

  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      {user && (
        <div className="border-b border-slate-800 bg-[#0d1129]">
          <div className="container mx-auto px-4 py-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/watchlist")}
              className="text-slate-400 hover:text-white flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              My Watchlist
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Triggerstix Trading Analysis
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Advanced market analysis combining price sustainability metrics with institutional activity tracking
          </p>

          {/* Search */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter stock symbol (AAPL, NVDA, BTC-USD...)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="pl-12 h-14 text-lg bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button 
                type="submit"
                disabled={!symbol}
                className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700"
              >
                Analyze
              </Button>
            </div>
          </form>


        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Interactive Charts</h3>
            <p className="text-slate-400">
              Professional candlestick charts with drawing tools and technical indicators
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Dual-Method Analysis</h3>
            <p className="text-slate-400">
              Proprietary analysis combining price sustainability with institutional activity patterns
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Signals</h3>
            <p className="text-slate-400">
              Clear BUY/SELL/HOLD recommendations with price targets and stop-loss levels
            </p>
          </div>
        </div>

        {/* Analysis Methods */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">Price Sustainability</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Geometric price relationships</li>
                <li>• Key support/resistance levels</li>
                <li>• Time and price cycle analysis</li>
                <li>• Sustainable price targets</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Institutional Activity</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Market phase identification</li>
                <li>• Smart money behavior tracking</li>
                <li>• Volume pattern analysis</li>
                <li>• Accumulation/distribution signals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0d1129] mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-400 text-sm">
            <p>Triggerstix Trading Analysis</p>
            <p className="mt-2">Advanced market intelligence for serious traders</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
