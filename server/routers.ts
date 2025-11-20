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

  analysis: router({
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
