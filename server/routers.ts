import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as marketData from "./services/marketData";
import * as astroData from "./services/astroData";
import { analyzeCombined } from "./analysis/combined";
import { analyzeGann } from "./analysis/gann";
import { analyzeNey } from "./analysis/ney";
import * as stockData from "./services/stockData";
import { exportRouter } from "./routers/export";
import * as db from "./db";
import { protectedProcedure } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  gann: router({
    getMarketData: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(({ input }) => marketData.getMarketData(input.symbol)),
    
    getHistoricalData: publicProcedure
      .input(z.object({ symbol: z.string(), days: z.number().optional() }))
      .query(({ input }) => marketData.getHistoricalData(input.symbol, input.days)),
    
    calculateGannAngles: publicProcedure
      .input(z.object({ 
        pivotPrice: z.number(), 
        pivotDate: z.string(), 
        currentDate: z.string() 
      }))
      .query(({ input }) => 
        marketData.calculateGannAngles(input.pivotPrice, input.pivotDate, input.currentDate)
      ),
    
    getLunarPhase: publicProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(({ input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return astroData.getLunarPhase(date);
      }),
    
    getPlanetaryPositions: publicProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(({ input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return astroData.getPlanetaryPositions(date);
      }),
    
    getPlanetaryAspects: publicProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(({ input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        const positions = astroData.getPlanetaryPositions(date);
        return astroData.getPlanetaryAspects(positions);
      }),
  }),

  export: exportRouter,

  watchlist: router({
    addToWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.addToWatchlist(ctx.user.id, input.symbol);
      }),

    removeFromWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromWatchlist(ctx.user.id, input.symbol);
        return { success: true };
      }),

    getWatchlist: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserWatchlist(ctx.user.id);
      }),

    isInWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.isInWatchlist(ctx.user.id, input.symbol);
      }),
  }),

  chartDrawings: router({
    saveDrawings: protectedProcedure
      .input(z.object({ 
        symbol: z.string(),
        drawings: z.array(z.any())
      }))
      .mutation(async ({ ctx, input }) => {
        return db.saveChartDrawings(ctx.user.id, input.symbol, input.drawings);
      }),

    getDrawings: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getChartDrawings(ctx.user.id, input.symbol);
      }),

    deleteDrawings: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChartDrawings(ctx.user.id, input.symbol);
        return { success: true };
      }),
  }),

  analysisHistory: router({
    save: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        companyName: z.string().nullable().optional(),
        recommendation: z.string().nullable().optional(),
        riskLevel: z.string().nullable().optional(),
        agreement: z.string().nullable().optional(),
        currentPrice: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.saveAnalysisHistory(
          ctx.user.id,
          input.symbol,
          input.companyName ?? null,
          input.recommendation ?? null,
          input.riskLevel ?? null,
          input.agreement ?? null,
          input.currentPrice ?? null
        );
      }),

    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getAnalysisHistory(ctx.user.id, input?.limit ?? 50);
      }),

    deleteItem: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAnalysisHistoryItem(ctx.user.id, input.id);
        return { success: true };
      }),

    clearHistory: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.clearAnalysisHistory(ctx.user.id);
        return { success: true };
      }),
  }),

  analysis: router({
    // Analyze stock with real Yahoo Finance data
    analyzeStock: publicProcedure
      .input(z.object({
        symbol: z.string(),
        timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y']).optional().default('1Y'),
      }))
      .query(async ({ input }) => {
        // Map timeframe to Yahoo Finance range/interval
        const timeframeMap: Record<string, { range: string; interval: string }> = {
          '1D': { range: '1d', interval: '5m' },
          '1W': { range: '5d', interval: '1h' },
          '1M': { range: '1mo', interval: '1h' },
          '3M': { range: '3mo', interval: '1d' },
          '6M': { range: '6mo', interval: '1d' },
          '1Y': { range: '1y', interval: '1d' },
          '5Y': { range: '5y', interval: '1wk' },
        };
        const { range, interval } = timeframeMap[input.timeframe];
        
        // Fetch historical data and company profile in parallel
        const [chartData, companyProfile] = await Promise.all([
          stockData.getHistoricalData(input.symbol, range, interval),
          stockData.getCompanyProfile(input.symbol),
        ]);
        
        if (!chartData || chartData.historical.length === 0) {
          throw new Error(`Unable to fetch data for symbol: ${input.symbol}`);
        }

        // Extract key data points
        const historical = chartData.historical;
        const currentPrice = chartData.meta.regularMarketPrice;
        const peak = stockData.findPeakPrice(historical);
        const start = stockData.findStartPrice(historical);
        const tradingDays = stockData.calculateTradingDays(start.date, new Date());
        
        // Prepare price data for Ney analysis
        const priceData = stockData.preparePriceDataForNey(historical);
        
        // Perform combined analysis
        const analysis = analyzeCombined(
          start.price,
          peak.price,
          currentPrice,
          tradingDays,
          priceData.map(d => ({
            ...d,
            date: new Date(d.date),
          }))
        );
        
        return {
          ...analysis,
          stockInfo: {
            symbol: chartData.symbol,
            currentPrice,
            currency: chartData.meta.currency,
            exchange: chartData.meta.exchangeName,
            high52Week: chartData.meta.fiftyTwoWeekHigh,
            low52Week: chartData.meta.fiftyTwoWeekLow,
            peakPrice: peak.price,
            peakDate: peak.date.toISOString(),
            startPrice: start.price,
            startDate: start.date.toISOString(),
            tradingDays,
          },
          companyProfile: companyProfile ? {
            shortName: companyProfile.shortName,
            longName: companyProfile.longName,
            sector: companyProfile.sector,
            industry: companyProfile.industry,
            longBusinessSummary: companyProfile.longBusinessSummary,
            beta: companyProfile.beta,
          } : null,
          chartData: historical.map(h => {
            // Use Unix timestamp for intraday data, date string for daily+
            const isIntraday = ['1D', '1W', '1M'].includes(input.timeframe);
            return {
              time: isIntraday 
                ? Math.floor(h.date.getTime() / 1000) 
                : h.date.toISOString().split('T')[0],
              open: h.open,
              high: h.high,
              low: h.low,
              close: h.close,
              volume: h.volume,
            };
          }).filter((item, index, arr) => {
            // Deduplicate by time
            return arr.findIndex(i => i.time === item.time) === index;
          }).sort((a, b) => {
            // Sort by time ascending
            if (typeof a.time === 'number' && typeof b.time === 'number') {
              return a.time - b.time;
            }
            return String(a.time).localeCompare(String(b.time));
          }),
        };
      }),

    // Combined Gann + Ney analysis for a stock
    analyze: publicProcedure
      .input(z.object({
        symbol: z.string(),
        startPrice: z.number(),
        peakPrice: z.number(),
        currentPrice: z.number(),
        days: z.number(),
        priceData: z.array(z.object({
          price: z.number(),
          volume: z.number(),
          date: z.string(),
        })),
      }))
      .query(({ input }) => {
        const priceData = input.priceData.map(d => ({
          ...d,
          date: new Date(d.date),
        }));
        
        return analyzeCombined(
          input.startPrice,
          input.peakPrice,
          input.currentPrice,
          input.days,
          priceData
        );
      }),
    
    // Gann-only analysis
    gannOnly: publicProcedure
      .input(z.object({
        startPrice: z.number(),
        endPrice: z.number(),
        days: z.number(),
        currentPrice: z.number().optional(),
      }))
      .query(({ input }) => {
        return analyzeGann(
          input.startPrice,
          input.endPrice,
          input.days,
          input.currentPrice
        );
      }),
    
    // Ney-only analysis
    neyOnly: publicProcedure
      .input(z.object({
        priceData: z.array(z.object({
          price: z.number(),
          volume: z.number(),
          date: z.string(),
        })),
        peakPrice: z.number(),
        currentPrice: z.number(),
      }))
      .query(({ input }) => {
        const priceData = input.priceData.map(d => ({
          ...d,
          date: new Date(d.date),
        }));
        
        return analyzeNey(priceData, input.peakPrice, input.currentPrice);
      }),
  }),
});

export type AppRouter = typeof appRouter;
