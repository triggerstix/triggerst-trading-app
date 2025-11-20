/**
 * Stock Data Service
 * Fetches real-time and historical stock data from Yahoo Finance via Manus Data API
 */

import { callDataApi } from "../_core/dataApi";

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
