interface NeyAnalysisProps {
  symbol: string;
  onSwipe?: (direction: "left" | "right") => void;
}

export default function NeyAnalysis({ symbol }: NeyAnalysisProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Ney Analysis</h2>

      {/* Current Phase */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-2">Current Phase</h3>
        <p className="text-3xl font-bold text-yellow-500">Distribution</p>
      </div>

      {/* Specialist Behavior */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-3">Specialist Behavior</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5" />
            <div>
              <p className="text-white font-medium">Accumulation</p>
              <p className="text-sm text-slate-400">4 years at $16k-$25k</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5" />
            <div>
              <p className="text-white font-medium">Markup</p>
              <p className="text-sm text-slate-400">Explosive rally to $108k</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
            <div>
              <p className="text-white font-medium">Distribution</p>
              <p className="text-sm text-red-400">Now - Testing support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Pattern */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-3">Volume Pattern</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Peak volume</span>
            <span className="text-white font-medium">At $108k</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current trend</span>
            <span className="text-yellow-500 font-medium">Declining</span>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
        View Details
      </button>
    </div>
  );
}
