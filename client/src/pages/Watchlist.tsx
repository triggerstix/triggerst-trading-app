import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Watchlist() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const watchlistQuery = trpc.watchlist.getWatchlist.useQuery(undefined, {
    enabled: !!user,
  });

  const removeFromWatchlistMutation = trpc.watchlist.removeFromWatchlist.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`${variables.symbol} removed from watchlist`);
      utils.watchlist.getWatchlist.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <Star className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your watchlist</h2>
          <p className="text-slate-400 mb-6">Track your favorite stocks and crypto</p>
        </div>
      </div>
    );
  }

  const watchlist = watchlistQuery.data || [];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1129] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              Back to Home
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              My Watchlist
            </h1>
          </div>
          <div className="text-sm text-slate-400">
            {watchlist.length} {watchlist.length === 1 ? 'ticker' : 'tickers'}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {watchlistQuery.isLoading ? (
          <div className="text-center text-slate-400 py-12">
            Loading watchlist...
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-slate-400 mb-6">
              Analyze stocks and add them to your watchlist for quick access
            </p>
            <Button onClick={() => setLocation("/")}>
              Start Analyzing
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="bg-[#0d1129] border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{item.symbol}</h3>
                    <p className="text-sm text-slate-400">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWatchlistMutation.mutate({ symbol: item.symbol })}
                    disabled={removeFromWatchlistMutation.isPending}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/chart/${item.symbol}`)}
                >
                  View Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
