/**
 * Export Router
 * Handles PDF generation for Triggerstix analysis reports
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { analyzeCombined } from "../analysis/combined";
import * as stockData from "../services/stockData";
import { generateInvestmentAnalysisHtml, InvestmentAnalysisData } from "../services/investmentAnalysisPdf";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper to convert HTML to PDF using puppeteer
async function htmlToPdf(html: string, filename: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const htmlPath = path.join(tmpDir, `${filename}.html`);
  const pdfPath = path.join(tmpDir, `${filename}.pdf`);
  
  try {
    // Write HTML to temp file
    fs.writeFileSync(htmlPath, html, 'utf-8');
    
    // Dynamic import puppeteer
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Read HTML from file instead of passing as string
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      width: '11in',
      height: '8.5in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    
    // Read PDF and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64 = pdfBuffer.toString('base64');
    
    // Cleanup temp files
    try {
      fs.unlinkSync(htmlPath);
      fs.unlinkSync(pdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return base64;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    console.error('[Export] PDF conversion error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const exportRouter = router({
  /**
   * Proxy endpoint to fetch company logos (bypasses CORS)
   */
  getCompanyLogo: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      
      // Common ticker to domain mappings
      const tickerDomainMap: Record<string, string> = {
        'AAPL': 'apple.com',
        'MSFT': 'microsoft.com',
        'GOOGL': 'google.com',
        'GOOG': 'google.com',
        'AMZN': 'amazon.com',
        'META': 'meta.com',
        'TSLA': 'tesla.com',
        'NVDA': 'nvidia.com',
        'JPM': 'jpmorganchase.com',
        'V': 'visa.com',
        'MA': 'mastercard.com',
        'DIS': 'disney.com',
        'NFLX': 'netflix.com',
        'INTC': 'intel.com',
        'AMD': 'amd.com',
        'CRM': 'salesforce.com',
        'ORCL': 'oracle.com',
        'IBM': 'ibm.com',
        'CSCO': 'cisco.com',
        'ADBE': 'adobe.com',
        'PYPL': 'paypal.com',
        'BA': 'boeing.com',
        'KO': 'coca-cola.com',
        'PEP': 'pepsi.com',
        'WMT': 'walmart.com',
        'HD': 'homedepot.com',
        'MCD': 'mcdonalds.com',
        'NKE': 'nike.com',
        'SBUX': 'starbucks.com',
        'UNH': 'unitedhealthgroup.com',
        'JNJ': 'jnj.com',
        'PFE': 'pfizer.com',
        'MRNA': 'modernatx.com',
        'XOM': 'exxonmobil.com',
        'CVX': 'chevron.com',
        'BRK.A': 'berkshirehathaway.com',
        'BRK.B': 'berkshirehathaway.com',
        'GS': 'goldmansachs.com',
        'MS': 'morganstanley.com',
        'BAC': 'bankofamerica.com',
        'C': 'citigroup.com',
        'WFC': 'wellsfargo.com',
        'T': 'att.com',
        'VZ': 'verizon.com',
        'TMUS': 't-mobile.com',
        'IDCC': 'interdigital.com',
        'HON': 'honeywell.com',
      };
      
      // Try different domain variations
      const domains = [
        tickerDomainMap[symbol.toUpperCase()],
        `${symbol.toLowerCase()}.com`,
      ].filter(Boolean) as string[];
      
      for (const domain of domains) {
        try {
          // Use Google's favicon service (more reliable than Clearbit)
          const logoUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
          const response = await fetch(logoUrl);
          
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const contentType = response.headers.get('content-type') || 'image/png';
            return {
              success: true,
              logoBase64: `data:${contentType};base64,${base64}`,
            };
          }
        } catch (e) {
          // Try next domain
        }
      }
      
      return { success: false, logoBase64: null };
    }),

  /**
   * Generate comprehensive Investment Analysis PDF (9 pages, HON style)
   */
  investmentAnalysis: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      
      // Fetch all required data in parallel
      const [chartData, companyProfile] = await Promise.all([
        stockData.getHistoricalData(symbol, "1y", "1d"),
        stockData.getCompanyProfile(symbol),
      ]);
      
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
      
      // Prepare data for PDF generation
      const pdfData: InvestmentAnalysisData = {
        symbol: chartData.symbol,
        companyName: companyProfile?.longName || companyProfile?.shortName || chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
        analysis,
        companyProfile,
        peakPrice: peak.price,
        peakDate: peak.date.toISOString(),
        startPrice: start.price,
        startDate: start.date.toISOString(),
        tradingDays,
      };
      
      // Generate HTML and convert to PDF
      const html = generateInvestmentAnalysisHtml(pdfData);
      const pdfBase64 = await htmlToPdf(html, `${symbol}_analysis_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}InvestmentAnalysis.pdf`,
      };
    }),

  /**
   * Generate long-form PDF report (legacy - now uses investment analysis)
   */
  longForm: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      
      const [chartData, companyProfile] = await Promise.all([
        stockData.getHistoricalData(symbol, "1y", "1d"),
        stockData.getCompanyProfile(symbol),
      ]);
      
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
      
      const pdfData: InvestmentAnalysisData = {
        symbol: chartData.symbol,
        companyName: companyProfile?.longName || companyProfile?.shortName || chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
        analysis,
        companyProfile,
        peakPrice: peak.price,
        peakDate: peak.date.toISOString(),
        startPrice: start.price,
        startDate: start.date.toISOString(),
        tradingDays,
      };
      
      const html = generateInvestmentAnalysisHtml(pdfData);
      const pdfBase64 = await htmlToPdf(html, `${symbol}_report_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}InvestmentAnalysis.pdf`,
      };
    }),
  
  /**
   * Generate short-form summary PDF (legacy - now uses investment analysis)
   */
  shortForm: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      
      const [chartData, companyProfile] = await Promise.all([
        stockData.getHistoricalData(symbol, "1y", "1d"),
        stockData.getCompanyProfile(symbol),
      ]);
      
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
      
      const pdfData: InvestmentAnalysisData = {
        symbol: chartData.symbol,
        companyName: companyProfile?.longName || companyProfile?.shortName || chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
        analysis,
        companyProfile,
        peakPrice: peak.price,
        peakDate: peak.date.toISOString(),
        startPrice: start.price,
        startDate: start.date.toISOString(),
        tradingDays,
      };
      
      const html = generateInvestmentAnalysisHtml(pdfData);
      const pdfBase64 = await htmlToPdf(html, `${symbol}_summary_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}InvestmentAnalysis.pdf`,
      };
    }),
  
  /**
   * Generate slideshow PDF (legacy - now uses investment analysis)
   */
  slideshow: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const { symbol } = input;
      
      const [chartData, companyProfile] = await Promise.all([
        stockData.getHistoricalData(symbol, "1y", "1d"),
        stockData.getCompanyProfile(symbol),
      ]);
      
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
      
      const pdfData: InvestmentAnalysisData = {
        symbol: chartData.symbol,
        companyName: companyProfile?.longName || companyProfile?.shortName || chartData.symbol,
        currentPrice,
        high52Week: chartData.meta.fiftyTwoWeekHigh || currentPrice,
        low52Week: chartData.meta.fiftyTwoWeekLow || currentPrice,
        analysis,
        companyProfile,
        peakPrice: peak.price,
        peakDate: peak.date.toISOString(),
        startPrice: start.price,
        startDate: start.date.toISOString(),
        tradingDays,
      };
      
      const html = generateInvestmentAnalysisHtml(pdfData);
      const pdfBase64 = await htmlToPdf(html, `${symbol}_slides_${Date.now()}`);
      
      return {
        format: "pdf" as const,
        content: pdfBase64,
        filename: `${symbol}InvestmentAnalysis.pdf`,
      };
    }),
});
