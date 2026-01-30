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
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper to convert markdown to PDF using manus-md-to-pdf
async function markdownToPdf(markdown: string, filename: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const mdPath = path.join(tmpDir, `${filename}.md`);
  const pdfPath = path.join(tmpDir, `${filename}.pdf`);
  
  try {
    // Write markdown to temp file
    fs.writeFileSync(mdPath, markdown, 'utf-8');
    
    // Convert to PDF using manus-md-to-pdf
    execSync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`, {
      timeout: 60000,
      stdio: 'pipe'
    });
    
    // Read PDF and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64 = pdfBuffer.toString('base64');
    
    // Cleanup temp files
    try {
      fs.unlinkSync(mdPath);
      fs.unlinkSync(pdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return base64;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    console.error('[Export] PDF conversion error:', error);
    throw new Error('Failed to generate PDF');
  }
}

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
      const dateStr = new Date().toISOString().split('T')[0];
      const pdfBase64 = await markdownToPdf(markdown, `${symbol}_report_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}_Triggerstix_Report_${dateStr}.pdf`,
      };
    }),
  
  /**
   * Generate short-form summary PDF
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
      
      // Convert summary to markdown format for PDF
      const summary = generateShortFormSummary(stockInfo, analysis);
      const markdown = `# ${symbol} Quick Summary\n\n${summary}`;
      const dateStr = new Date().toISOString().split('T')[0];
      const pdfBase64 = await markdownToPdf(markdown, `${symbol}_summary_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}_Summary_${dateStr}.pdf`,
      };
    }),
  
  /**
   * Generate slideshow PDF
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
        name: chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
      };
      
      // Generate slideshow as markdown for PDF conversion
      const markdown = `# ${symbol} Analysis Slides

---

## Slide 1: Overview

**${symbol}** - Current Price: $${currentPrice.toFixed(2)}

- 52-Week High: $${stockInfo.high52Week.toFixed(2)}
- 52-Week Low: $${stockInfo.low52Week.toFixed(2)}

---

## Slide 2: Triggerstix Score

**Agreement Score:** ${analysis.agreement}%

**Risk Level:** ${analysis.combinedRisk}

**Recommendation:** ${analysis.recommendation.action}

---

## Slide 3: Price Analysis (Gann)

- Rally Angle: ${analysis.gann.rallyAngle.angle}
- Sustainable Price: $${analysis.gann.rallyAngle.sustainablePrice.toFixed(2)}
- Deviation: ${analysis.gann.rallyAngle.deviation.toFixed(1)}%

---

## Slide 4: Market Phase (Ney)

- Current Phase: ${analysis.ney.currentPhase}
- Volume Pattern: ${analysis.ney.volumePattern}

---

## Slide 5: Action Items

${analysis.recommendation.action === 'BUY' ? '✅ Consider entering position' : 
  analysis.recommendation.action === 'SELL' ? '🔴 Consider exiting position' : 
  '⚠️ Hold current position'}

- Stop Loss: $${(analysis.recommendation.stopLoss || 0).toFixed(2)}
- Target: $${(analysis.recommendation.target || 0).toFixed(2)}
`;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const pdfBase64 = await markdownToPdf(markdown, `${symbol}_slides_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}_Slides_${dateStr}.pdf`,
      };
    }),
});
