interface ChartViewProps {
  symbol: string;
  onSwipe?: (direction: "left" | "right") => void;
}

export default function ChartView({ symbol }: ChartViewProps) {
  return (
    <div className="space-y-4">
      {/* Price Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">{symbol}</h2>
        <p className="text-xl text-slate-400 mt-1">$91,431.41</p>
        <p className="text-sm text-red-500 mt-1">-3.02% (-$2,844.61)</p>
      </div>

      {/* Risk Indicator */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Risk Level</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < 2 ? "bg-yellow-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-2xl font-bold text-yellow-500">MODERATE</p>
        <p className="text-sm text-slate-400 mt-1">HOLD / WAIT</p>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-slate-500">Chart will load here</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-center gap-2">
        {["1D", "5D", "1M", "1Y", "5Y"].map((tf) => (
          <button
            key={tf}
            className={`px-3 py-1 rounded text-sm ${
              tf === "5Y"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* View Details Button */}
      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
        View Details
      </button>
    </div>
  );
}
