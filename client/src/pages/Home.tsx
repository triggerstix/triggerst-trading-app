import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

/**
 * Triggerstix - Webull-style Trading Interface
 * Chart-first layout with Gann+Ney analysis
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [symbol, setSymbol] = useState("");

  const popularSymbols = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "BTC-USD", name: "Bitcoin" },
    { symbol: "ETH-USD", name: "Ethereum" },
  ];

  const handleAnalyze = (sym: string) => {
    if (sym) {
      setLocation(`/chart/${sym.toUpperCase()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze(symbol);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1129]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Triggerstix
            </div>
            <div className="text-sm text-slate-400 hidden md:block">
              Your Trading Signal
            </div>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search symbol (e.g., AAPL, BTC-USD)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </form>

          <Button 
            onClick={() => handleAnalyze(symbol)}
            disabled={!symbol}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Analyze
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Find Your Entry Point
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Professional trading analysis combining W.D. Gann's geometric methods with Richard Ney's specialist behavior patterns
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

          {/* Popular Symbols */}
          <div className="mb-16">
            <p className="text-sm text-slate-400 mb-4">Popular symbols:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {popularSymbols.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleAnalyze(item.symbol)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <span className="font-semibold text-blue-400">{item.symbol}</span>
                  <span className="text-slate-400 text-sm ml-2">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
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
              Professional candlestick charts with drawing tools, Gann angles, and technical indicators
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Gann + Ney Analysis</h3>
            <p className="text-slate-400">
              Combined geometric analysis and specialist behavior patterns for high-probability setups
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

        {/* How It Works */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">W.D. Gann Analysis</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Geometric angles (1x1, 2x1, 4x1, 8x1)</li>
                <li>• Square of Nine support/resistance</li>
                <li>• Time and price relationships</li>
                <li>• Sustainable price calculations</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Richard Ney Analysis</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Market phase detection (4 phases)</li>
                <li>• Specialist behavior patterns</li>
                <li>• Volume analysis</li>
                <li>• Institutional buying/selling signals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0d1129] mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-400 text-sm">
            <p>Triggerstix - Where Geometry Meets Volume</p>
            <p className="mt-2">Professional trading analysis for serious traders</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
