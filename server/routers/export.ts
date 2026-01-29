/**
 * Export Router
 * Handles PDF generation for Triggerstix analysis reports
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { analyzeCombined } from "../analysis/combined";
import * as stockData from "../services/stockData";
import { 
  generateLongFormReport, 
  generateShortFormSummary,
  generateSlideshow,
  type StockInfo 
} from "../services/pdfExport";

export const exportRouter = router({
  /**
   * Generate long-form PDF report
   */
  longForm: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      const chartData = await stockData.getHistoricalData(symbol, "1y", "1d");
      
      if (!chartData || chartData.historical.length === 0) {
        throw new Error(`Failed to fetch data for ${symbol}`);
      }
      
      const historical = chartData.historical;
      const currentPrice = chartData.meta.regularMarketPrice;
      const peak = stockData.findPeakPrice(historical);
      const start = stockData.findStartPrice(historical);
      const tradingDays = stockData.calculateTradingDays(start.date, new Date());
      const priceData = stockData.preparePriceDataForNey(historical);
      
      // Perform analysis
      const analysis = analyzeCombined(
        start.price,
        peak.price,
        currentPrice,
        tradingDays,
        priceData.map(d => ({ ...d, date: new Date(d.date) }))
      );
      
      // Generate report
      const stockInfo: StockInfo = {
        symbol: chartData.symbol,
        name: chartData.symbol, // Use symbol as name for now
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      const markdown = generateLongFormReport(stockInfo, analysis);
      
      return {
        format: "markdown" as const,
        content: markdown,
        filename: `${symbol}_Triggerstix_Report_${new Date().toISOString().split('T')[0]}.md`,
      };
    }),
  
  /**
   * Generate short-form summary
   */
  shortForm: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      const chartData = await stockData.getHistoricalData(symbol, "1y", "1d");
      
      if (!chartData || chartData.historical.length === 0) {
        throw new Error(`Failed to fetch data for ${symbol}`);
      }
      
      const historical = chartData.historical;
      const currentPrice = chartData.meta.regularMarketPrice;
      const peak = stockData.findPeakPrice(historical);
      const start = stockData.findStartPrice(historical);
      const tradingDays = stockData.calculateTradingDays(start.date, new Date());
      const priceData = stockData.preparePriceDataForNey(historical);
      
      const analysis = analyzeCombined(
        start.price,
        peak.price,
        currentPrice,
        tradingDays,
        priceData.map(d => ({ ...d, date: new Date(d.date) }))
      );
      
      const stockInfo: StockInfo = {
        symbol: chartData.symbol,
        name: chartData.symbol, // Use symbol as name for now
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      const summary = generateShortFormSummary(stockInfo, analysis);
      
      return {
        format: "text" as const,
        content: summary,
        filename: `${symbol}_Summary_${new Date().toISOString().split('T')[0]}.txt`,
      };
    }),
  
  /**
   * Generate slideshow HTML (for PDF conversion)
   */
  slideshow: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      const chartData = await stockData.getHistoricalData(symbol, "1y", "1d");
      
      if (!chartData || chartData.historical.length === 0) {
        throw new Error(`Failed to fetch data for ${symbol}`);
      }
      
      const historical = chartData.historical;
      const currentPrice = chartData.meta.regularMarketPrice;
      const peak = stockData.findPeakPrice(historical);
      const start = stockData.findStartPrice(historical);
      const tradingDays = stockData.calculateTradingDays(start.date, new Date());
      const priceData = stockData.preparePriceDataForNey(historical);
      
      const analysis = analyzeCombined(
        start.price,
        peak.price,
        currentPrice,
        tradingDays,
        priceData.map(d => ({ ...d, date: new Date(d.date) }))
      );
      
      const stockInfo: StockInfo = {
        symbol: chartData.symbol,
        name: chartData.symbol, // Use symbol as name for now
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      const html = generateSlideshow(stockInfo, analysis);
      
      return {
        format: "html" as const,
        content: html,
        filename: `${symbol}_Slides_${new Date().toISOString().split('T')[0]}.html`,
      };
    }),
});
