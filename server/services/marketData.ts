// Market data service for W.D. Gann Trading Platform
import YahooFinance from 'yahoo-finance2';

// Create instance
const yahooFinance = new YahooFinance();

// Get real-time market data from Yahoo Finance
export async function getMarketData(symbol: string) {
  try {
    const quote: any = await yahooFinance.quote(symbol);
    
    if (!quote) {
      throw new Error(`No data found for symbol ${symbol}`);
    }
    
    const price = quote.regularMarketPrice || 0;
    const previousClose = quote.regularMarketPreviousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    
    return {
      symbol: quote.symbol || symbol,
      price: price,
      change: change,
      changePercent: changePercent,
      high: quote.regularMarketDayHigh || price,
      low: quote.regularMarketDayLow || price,
      open: quote.regularMarketOpen || price,
      volume: quote.regularMarketVolume || 0,
      beta: quote.beta || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw new Error(`Failed to fetch market data for ${symbol}`);
  }
}

// Get historical data from Yahoo Finance
export async function getHistoricalData(symbol: string, days: number = 90) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result: any = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });
    
    if (!result || result.length === 0) {
      throw new Error(`No historical data found for symbol ${symbol}`);
    }
    
    return result.map((item: any) => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }
}

// Calculate Gann angles from a pivot point
export function calculateGannAngles(pivotPrice: number, pivotDate: string, currentDate: string) {
  const angles = [
    { name: '1x1', angle: 45, multiplier: 1 },
    { name: '1x2', angle: 26.25, multiplier: 0.5 },
    { name: '1x4', angle: 15, multiplier: 0.25 },
    { name: '1x8', angle: 7.5, multiplier: 0.125 },
    { name: '2x1', angle: 63.75, multiplier: 2 },
    { name: '4x1', angle: 75, multiplier: 4 },
    { name: '8x1', angle: 82.5, multiplier: 8 },
  ];
  
  const pivot = new Date(pivotDate);
  const current = new Date(currentDate);
  const daysDiff = Math.floor((current.getTime() - pivot.getTime()) / (1000 * 60 * 60 * 24));
  
  return angles.map(angle => ({
    ...angle,
    upPrice: pivotPrice + (daysDiff * angle.multiplier),
    downPrice: pivotPrice - (daysDiff * angle.multiplier),
  }));
}

