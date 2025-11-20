interface GannAnalysisProps {
  symbol: string;
  onSwipe?: (direction: "left" | "right") => void;
}

export default function GannAnalysis({ symbol }: GannAnalysisProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Gann Analysis</h2>

      {/* Rally Angle */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-2">Rally Angle</h3>
        <p className="text-3xl font-bold text-white">1.00x1</p>
        <p className="text-sm text-green-500 mt-1">✓ Sustainable</p>
      </div>

      {/* Above Sustainable */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-2">Above Sustainable</h3>
        <p className="text-3xl font-bold text-yellow-500">-21.7%</p>
        <p className="text-sm text-slate-400 mt-1">Below 1x1 angle (oversold)</p>
      </div>

      {/* Square of Nine */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-3">Square of Nine Levels</h3>
        <div className="space-y-2">
          {[
            { level: "$122k", status: "resistance", active: false },
            { level: "$108k", status: "resistance", active: false },
            { level: "$102k", status: "resistance", active: false },
            { level: "$90k", status: "support", active: true },
            { level: "$78k", status: "support", active: false },
          ].map((item) => (
            <div key={item.level} className="flex items-center justify-between">
              <span className={`font-medium ${item.active ? "text-white" : "text-slate-400"}`}>
                {item.level}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{item.status}</span>
                {item.active ? (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-slate-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Details Button */}
      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
        View Details
      </button>
    </div>
  );
}
