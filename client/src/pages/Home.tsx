import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Activity, 
  Grid3x3, 
  Clock, 
  Moon, 
  BarChart3, 
  LineChart, 
  Pencil,
  Target
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      id: "market-data",
      title: "Market Data",
      description: "Real-time market data and price tracking for multiple symbols",
      icon: Activity,
      path: "/market-data",
      color: "text-blue-400",
    },
    {
      id: "gann-angles",
      title: "Gann Angles & Charts",
      description: "Calculate and visualize Gann angles from pivot points",
      icon: TrendingUp,
      path: "/gann-angles",
      color: "text-green-400",
    },
    {
      id: "square-of-nine",
      title: "Square of Nine",
      description: "Interactive Square of Nine calculator for price and time analysis",
      icon: Grid3x3,
      path: "/square-of-nine",
      color: "text-purple-400",
    },
    {
      id: "time-cycles",
      title: "Time Cycles",
      description: "Analyze market cycles and time-based patterns",
      icon: Clock,
      path: "/time-cycles",
      color: "text-orange-400",
    },
    {
      id: "astrological",
      title: "Astrological Analysis",
      description: "Lunar phases, planetary positions, and astrological aspects",
      icon: Moon,
      path: "/astrological",
      color: "text-indigo-400",
    },
    {
      id: "historical-charts",
      title: "Historical Charts",
      description: "View historical price data with technical indicators",
      icon: BarChart3,
      path: "/historical-charts",
      color: "text-cyan-400",
    },
    {
      id: "interactive-chart",
      title: "Interactive Gann Chart",
      description: "Live market data with interactive Gann angle overlays and real-time analysis",
      icon: LineChart,
      path: "/interactive-chart",
      color: "text-emerald-400",
    },
    {
      id: "drafting-machine",
      title: "Gann Drafting Machine",
      description: "Upload chart images and overlay Gann angles, hexagons, and geometric patterns",
      icon: Pencil,
      path: "/drafting-machine",
      color: "text-pink-400",
    },
    {
      id: "stock-analysis",
      title: "Stock Analysis",
      description: "Combined Gann + Ney analysis with risk assessment and trading recommendations",
      icon: Target,
      path: "/stock-analysis",
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold">W.D. Gann Trading Platform</h1>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {user?.name || user?.email || "User"}
                </span>
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Master the Markets with W.D. Gann Methods
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            A comprehensive trading platform implementing all of W.D. Gann's legendary trading 
            methodologies including Gann Angles, Square of Nine, Time Cycles, and Astrological Analysis.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              onClick={() => setLocation("/stock-analysis")}
            >
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8"
            >
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Complete Gann Trading Toolkit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer group"
                  onClick={() => setLocation(feature.path)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-slate-900/50 ${feature.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2 group-hover:text-blue-400 transition-colors">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">About W.D. Gann</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                William Delbert Gann (1878-1955) was one of the most successful traders of all time. 
                He developed unique trading techniques based on geometry, astronomy, astrology, and 
                ancient mathematics.
              </p>
              <p className="font-semibold text-white">
                This platform implements Gann's core methodologies:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong className="text-white">Gann Angles:</strong> Geometric price and time relationships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong className="text-white">Square of Nine:</strong> Mathematical price calculator based on square root relationships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong className="text-white">Time Cycles:</strong> Natural market cycles and turning points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong className="text-white">Astrological Analysis:</strong> Planetary influences on market behavior</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="container mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 W.D. Gann Trading Platform. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
