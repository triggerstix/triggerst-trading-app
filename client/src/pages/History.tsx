import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, RefreshCw, Trash2, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function History() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: history, isLoading, refetch } = trpc.analysisHistory.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  
  const deleteItemMutation = trpc.analysisHistory.deleteItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Analysis removed from history");
    },
    onError: () => {
      toast.error("Failed to remove analysis");
    },
  });
  
  const clearHistoryMutation = trpc.analysisHistory.clearHistory.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("History cleared");
    },
    onError: () => {
      toast.error("Failed to clear history");
    },
  });

  const getRecommendationIcon = (recommendation: string | null) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'HOLD':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      case 'AVOID':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRecommendationColor = (recommendation: string | null) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'SELL':
        return 'text-red-400 bg-red-500/20';
      case 'HOLD':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'AVOID':
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk?.toUpperCase()) {
      case 'LOW':
        return 'text-emerald-400';
      case 'MODERATE':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-orange-400';
      case 'EXTREME':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-slate-400 mb-6">
            Sign in to view your analysis history and track your past recommendations.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
          <Link href="/">
            <Button variant="ghost" className="mt-4 text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Analysis History</h1>
                <p className="text-sm text-slate-400">
                  {history?.length ?? 0} analyses recorded
                </p>
              </div>
            </div>
            {history && history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all history?')) {
                    clearHistoryMutation.mutate();
                  }
                }}
                className="text-red-400 border-red-400/30 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Analysis History</h2>
            <p className="text-slate-400 mb-6">
              Your analyzed tickers will appear here for quick reference.
            </p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Analyze Your First Stock
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Symbol and Company */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{item.symbol}</span>
                        {getRecommendationIcon(item.recommendation)}
                      </div>
                      {item.companyName && (
                        <p className="text-sm text-slate-400 truncate max-w-[200px]">
                          {item.companyName}
                        </p>
                      )}
                    </div>

                    {/* Recommendation Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(item.recommendation)}`}>
                      {item.recommendation || 'N/A'}
                    </div>

                    {/* Risk Level */}
                    <div className="hidden sm:block">
                      <span className="text-xs text-slate-500">Risk</span>
                      <p className={`text-sm font-medium ${getRiskColor(item.riskLevel)}`}>
                        {item.riskLevel || 'N/A'}
                      </p>
                    </div>

                    {/* Agreement */}
                    <div className="hidden md:block">
                      <span className="text-xs text-slate-500">Agreement</span>
                      <p className="text-sm font-medium text-blue-400">
                        {item.agreement || 'N/A'}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="hidden lg:block">
                      <span className="text-xs text-slate-500">Price</span>
                      <p className="text-sm font-medium text-white">
                        ${item.currentPrice || 'N/A'}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="hidden xl:block text-right">
                      <span className="text-xs text-slate-500">Analyzed</span>
                      <p className="text-sm text-slate-400">
                        {formatDate(item.analyzedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/chart/${item.symbol}`)}
                      className="text-blue-400 border-blue-400/30 hover:bg-blue-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analyze
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItemMutation.mutate({ id: item.id })}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile date */}
                <div className="xl:hidden mt-2 pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    {formatDate(item.analyzedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
