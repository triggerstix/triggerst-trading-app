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
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

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
        name: chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      const markdown = generateLongFormReport(stockInfo, analysis);
      
      // Convert markdown to PDF using manus-md-to-pdf utility
      const timestamp = Date.now();
      const mdPath = join(tmpdir(), `${symbol}_report_${timestamp}.md`);
      const pdfPath = join(tmpdir(), `${symbol}_report_${timestamp}.pdf`);
      
      try {
        // Write markdown to temp file
        await writeFile(mdPath, markdown, 'utf-8');
        console.log(`[Export] Wrote markdown to ${mdPath}`);
        
        // Convert to PDF
        const { stdout, stderr } = await execAsync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`);
        console.log(`[Export] PDF conversion output:`, stdout);
        if (stderr) console.error(`[Export] PDF conversion errors:`, stderr);
        
        // Read PDF as base64
        const pdfBuffer = await readFile(pdfPath);
        console.log(`[Export] PDF size: ${pdfBuffer.length} bytes`);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        // Cleanup temp files
        await unlink(mdPath);
        await unlink(pdfPath);
        
        return {
          format: "pdf" as const,
          content: pdfBase64,
          filename: `${symbol}_Triggerstix_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        };
      } catch (error) {
        // Cleanup on error
        console.error(`[Export] PDF generation failed:`, error);
        try {
          await unlink(mdPath);
          await unlink(pdfPath);
        } catch {}
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
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
        name: chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      const summary = generateShortFormSummary(stockInfo, analysis);
      
      // Convert to markdown then PDF
      const markdown = `# ${symbol} - Quick Summary\n\n${summary}`;
      const timestamp = Date.now();
      const mdPath = join(tmpdir(), `${symbol}_summary_${timestamp}.md`);
      const pdfPath = join(tmpdir(), `${symbol}_summary_${timestamp}.pdf`);
      
      try {
        await writeFile(mdPath, markdown, 'utf-8');
        await execAsync(`manus-md-to-pdf ${mdPath} ${pdfPath}`);
        const pdfBuffer = await readFile(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        await unlink(mdPath);
        await unlink(pdfPath);
        
        return {
          format: "pdf" as const,
          content: pdfBase64,
          filename: `${symbol}_Summary_${new Date().toISOString().split('T')[0]}.pdf`,
        };
      } catch (error) {
        try {
          await unlink(mdPath);
          await unlink(pdfPath);
        } catch {}
        throw new Error(`PDF generation failed: ${error}`);
      }
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
      
      // For slideshow, return HTML directly (user can print to PDF from browser)
      return {
        format: "html" as const,
        content: html,
        filename: `${symbol}_Slides_${new Date().toISOString().split('T')[0]}.html`,
      };
    }),
});
