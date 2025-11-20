interface ForecastProps {
  symbol: string;
  onSwipe?: (direction: "left" | "right") => void;
}

export default function Forecast({ symbol }: ForecastProps) {
  const scenarios = [
    {
      id: 1,
      name: "CONSOLIDATION",
      probability: "60%",
      target: "3-6 months",
      icon: "📊",
      color: "green",
    },
    {
      id: 2,
      name: "BREAKOUT",
      probability: "25%",
      target: "$108k-$122k",
      icon: "📈",
      color: "blue",
    },
    {
      id: 3,
      name: "CORRECTION",
      probability: "15%",
      target: "$78k-$50k",
      icon: "📉",
      color: "red",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Forecast</h2>

      {/* Scenarios */}
      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`bg-slate-800/50 border ${
              scenario.color === "green"
                ? "border-green-700/50"
                : scenario.color === "blue"
                ? "border-blue-700/50"
                : "border-red-700/50"
            } rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{scenario.icon}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-slate-400">Scenario {scenario.id}:</p>
                    <p className="text-lg font-bold text-white">{scenario.name}</p>
                  </div>
                  <p className="text-sm text-slate-400">{scenario.target}</p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    scenario.color === "green"
                      ? "text-green-500"
                      : scenario.color === "blue"
                      ? "text-blue-500"
                      : "text-red-500"
                  }`}
                >
                  {scenario.probability} <span className="text-sm text-slate-400">Probability</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-2">Recommendation</h3>
        <p className="text-2xl font-bold text-white mb-3">HOLD / WAIT</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Stop-loss:</p>
            <p className="text-white font-medium">$88k</p>
          </div>
          <div>
            <p className="text-slate-400">Target</p>
            <p className="text-white font-medium">$102k</p>
          </div>
        </div>
      </div>
    </div>
  );
}
