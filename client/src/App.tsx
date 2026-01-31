import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ChartView from "./pages/ChartView";
import Watchlist from "./pages/Watchlist";
import StockAnalysisNew from "./pages/StockAnalysisNew";
import StockAnalysisSearch from "./pages/StockAnalysisSearch";
import ChartOnly from "./pages/ChartOnly";
import History from "./pages/History";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chart/:symbol" component={ChartView} />
      <Route path="/chart-only/:symbol" component={ChartOnly} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/history" component={History} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

