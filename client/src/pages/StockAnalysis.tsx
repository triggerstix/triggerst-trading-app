import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import ChartView from "@/components/analysis/ChartView";
import GannAnalysis from "@/components/analysis/GannAnalysis";
import NeyAnalysis from "@/components/analysis/NeyAnalysis";
import Forecast from "@/components/analysis/Forecast";

export default function StockAnalysis() {
  const [, params] = useRoute("/analyze/:symbol");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  const symbol = params?.symbol || "AAPL";

  const tabs = [
    { id: 0, name: "Chart", component: ChartView },
    { id: 1, name: "Gann", component: GannAnalysis },
    { id: 2, name: "Ney", component: NeyAnalysis },
    { id: 3, name: "Forecast", component: Forecast },
  ];

  const ActiveComponent = tabs[activeTab].component;

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    } else if (direction === "right" && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Trading Tools</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Swipe Hint */}
      <div className="text-center py-2 text-sm text-slate-500">
        Swipe for tabs
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 px-4 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 max-w-md mx-auto">
        <ActiveComponent symbol={symbol} onSwipe={handleSwipe} />
      </div>
    </div>
  );
}
