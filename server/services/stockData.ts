/**
 * Stock Data Service
 * Fetches real-time and historical stock data from Yahoo Finance via Manus Data API
 */

import { callDataApi } from "../_core/dataApi";

export interface CompanyProfile {
  symbol: string;
  shortName: string;
  longName: string;
  sector?: string;
  industry?: string;
  website?: string;
  longBusinessSummary?: string;
  country?: string;
  fullTimeEmployees?: number;
  beta?: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface StockChartData {
  symbol: string;
  meta: {
    currency: string;
    exchangeName: string;
    instrumentType: string;
    regularMarketPrice: number;
    previousClose: number;
    regularMarketVolume: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
  };
  historical: HistoricalDataPoint[];
}

/**
 * Fetch current stock quote
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response: any = await callDataApi("YahooFinance/get_stock_chart", {
      query: {
        symbol: symbol.toUpperCase(),
        region: "US",
        interval: "1d",
        range: "1d",
      },
    });

    if (!response || !response.chart || !response.chart.result || response.chart.result.length === 0) {
      console.error(`No data found for symbol: ${symbol}`);
      return null;
    }

    const result = response.chart.result[0];
    const meta = result.meta;

    const quote: StockQuote = {
      symbol: meta.symbol,
      price: meta.regularMarketPrice || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent: ((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1) * 100,
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap,
      high52Week: meta.fiftyTwoWeekHigh,
      low52Week: meta.fiftyTwoWeekLow,
    };

    return quote;
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical stock data
 */
export async function getHistoricalData(
  symbol: string,
  range: string = "1y",
  interval: string = "1d"
): Promise<StockChartData | null> {
  try {
    const response: any = await callDataApi("YahooFinance/get_stock_chart", {
      query: {
        symbol: symbol.toUpperCase(),
        region: "US",
        interval,
        range,
        events: "div,split",
      },
    });

    if (!response || !response.chart || !response.chart.result || response.chart.result.length === 0) {
      console.error(`No historical data found for symbol: ${symbol}`);
      return null;
    }

    const result = response.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

    // Convert to structured historical data
    const historical: HistoricalDataPoint[] = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000),
      open: quotes.open?.[index] || 0,
      high: quotes.high?.[index] || 0,
      low: quotes.low?.[index] || 0,
      close: quotes.close?.[index] || 0,
      volume: quotes.volume?.[index] || 0,
      adjClose: adjClose[index],
    })).filter((point: HistoricalDataPoint) => point.close > 0); // Filter out invalid data points

    const chartData: StockChartData = {
      symbol: meta.symbol,
      meta: {
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        instrumentType: meta.instrumentType,
        regularMarketPrice: meta.regularMarketPrice || 0,
        previousClose: meta.previousClose || 0,
        regularMarketVolume: meta.regularMarketVolume || 0,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      },
      historical,
    };

    return chartData;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Find the peak price and its date from historical data
 */
export function findPeakPrice(historical: HistoricalDataPoint[]): { price: number; date: Date } {
  if (historical.length === 0) {
    return { price: 0, date: new Date() };
  }

  let peak = historical[0];
  for (const point of historical) {
    if (point.high > peak.high) {
      peak = point;
    }
  }

  return { price: peak.high, date: peak.date };
}

/**
 * Find the starting price (first valid price in the range)
 */
export function findStartPrice(historical: HistoricalDataPoint[]): { price: number; date: Date } {
  if (historical.length === 0) {
    return { price: 0, date: new Date() };
  }

  // Find first valid data point
  const start = historical.find(point => point.open > 0) || historical[0];
  return { price: start.open, date: start.date };
}

/**
 * Calculate the number of trading days between two dates
 */
export function calculateTradingDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
  // Approximate trading days (excluding weekends and holidays)
  return Math.floor(days * (5 / 7)); // Rough estimate: 5 trading days per week
}

/**
 * Prepare price data for Ney analysis (last 60 trading days)
 */
export function preparePriceDataForNey(historical: HistoricalDataPoint[]): Array<{
  price: number;
  volume: number;
  date: string;
}> {
  // Get last 60 data points
  const recentData = historical.slice(-60);
  
  return recentData.map(point => ({
    price: point.close,
    volume: point.volume,
    date: point.date.toISOString(),
  }));
}


/**
 * Calculate Beta for a stock relative to S&P 500 (SPY)
 * Beta = Covariance(stock returns, market returns) / Variance(market returns)
 * Uses 1 year of daily returns
 */
export async function calculateBeta(symbol: string): Promise<number | undefined> {
  try {
    // Fetch 1 year of daily data for both stock and SPY (S&P 500)
    const [stockData, marketData] = await Promise.all([
      getHistoricalData(symbol, '1y', '1d'),
      getHistoricalData('SPY', '1y', '1d'),
    ]);

    if (!stockData || !marketData || stockData.historical.length < 30 || marketData.historical.length < 30) {
      return undefined;
    }

    const stockCloses = stockData.historical.map(h => h.close).filter(c => c > 0);
    const marketCloses = marketData.historical.map(h => h.close).filter(c => c > 0);
    const minLen = Math.min(stockCloses.length, marketCloses.length);

    // Calculate daily returns
    const stockReturns: number[] = [];
    const marketReturns: number[] = [];
    for (let i = 1; i < minLen; i++) {
      if (stockCloses[i] && stockCloses[i - 1] && marketCloses[i] && marketCloses[i - 1]) {
        stockReturns.push((stockCloses[i] - stockCloses[i - 1]) / stockCloses[i - 1]);
        marketReturns.push((marketCloses[i] - marketCloses[i - 1]) / marketCloses[i - 1]);
      }
    }

    if (stockReturns.length < 20) return undefined;

    const n = stockReturns.length;
    const meanStock = stockReturns.reduce((a, b) => a + b, 0) / n;
    const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let varianceMarket = 0;
    for (let i = 0; i < n; i++) {
      covariance += (stockReturns[i] - meanStock) * (marketReturns[i] - meanMarket);
      varianceMarket += (marketReturns[i] - meanMarket) ** 2;
    }
    covariance /= n;
    varianceMarket /= n;

    if (varianceMarket === 0) return undefined;

    const beta = covariance / varianceMarket;
    return Math.round(beta * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.warn(`[Beta] Error calculating beta for ${symbol}:`, error);
    return undefined;
  }
}

/**
 * Fetch company profile information (name, description, sector, etc.)
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const response: any = await callDataApi("YahooFinance/get_stock_profile", {
      query: {
        symbol: symbol.toUpperCase(),
        region: "US",
        lang: "en-US",
      },
    });

    if (!response) {
      console.error(`No profile data found for symbol: ${symbol}`);
      return null;
    }

    // Parse the quoteSummary response structure
    const result = response.quoteSummary?.result?.[0];
    if (!result) {
      console.error(`No quoteSummary result for symbol: ${symbol}`);
      return null;
    }

    const summaryProfile = result.summaryProfile || {};

    // The profile API doesn't return quoteType/longName, so fetch from chart API
    let shortName = symbol.toUpperCase();
    let longName = symbol.toUpperCase();
    try {
      const chartResponse: any = await callDataApi("YahooFinance/get_stock_chart", {
        query: { symbol: symbol.toUpperCase(), region: "US", interval: "1d", range: "1d" },
      });
      const chartMeta = chartResponse?.chart?.result?.[0]?.meta;
      if (chartMeta) {
        shortName = chartMeta.shortName || chartMeta.longName || symbol.toUpperCase();
        longName = chartMeta.longName || chartMeta.shortName || symbol.toUpperCase();
      }
    } catch (e) {
      console.warn(`[Profile] Could not fetch chart meta for ${symbol}:`, e);
    }

    const profile: CompanyProfile = {
      symbol: symbol.toUpperCase(),
      shortName,
      longName,
      sector: summaryProfile.sector,
      industry: summaryProfile.industry,
      website: summaryProfile.website,
      longBusinessSummary: summaryProfile.longBusinessSummary,
      country: summaryProfile.country,
      fullTimeEmployees: summaryProfile.fullTimeEmployees,
    };

    // Calculate Beta from historical data (stock vs SPY)
    try {
      profile.beta = await calculateBeta(symbol.toUpperCase());
    } catch (e) {
      console.warn(`[Beta] Could not calculate beta for ${symbol}:`, e);
    }

    return profile;
  } catch (error) {
    console.error(`Error fetching company profile for ${symbol}:`, error);
    return null;
  }
}
