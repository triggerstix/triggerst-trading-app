import { describe, it, expect } from 'vitest';
import {
  findPeakPrice,
  findStartPrice,
  calculateTradingDays,
  preparePriceDataForNey,
  type HistoricalDataPoint,
} from './stockData';

describe('Stock Data Service', () => {
  const mockHistoricalData: HistoricalDataPoint[] = [
    {
      date: new Date('2024-01-01'),
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1000000,
    },
    {
      date: new Date('2024-01-02'),
      open: 103,
      high: 110,
      low: 102,
      close: 108,
      volume: 1200000,
    },
    {
      date: new Date('2024-01-03'),
      open: 108,
      high: 115,
      low: 107,
      close: 112,
      volume: 1500000,
    },
    {
      date: new Date('2024-01-04'),
      open: 112,
      high: 120,
      low: 111,
      close: 118,
      volume: 1800000,
    },
    {
      date: new Date('2024-01-05'),
      open: 118,
      high: 122,
      low: 115,
      close: 116,
      volume: 1400000,
    },
  ];

  describe('findPeakPrice', () => {
    it('should find the highest price in historical data', () => {
      const peak = findPeakPrice(mockHistoricalData);
      expect(peak.price).toBe(122);
      expect(peak.date).toEqual(new Date('2024-01-05'));
    });

    it('should handle empty array', () => {
      const peak = findPeakPrice([]);
      expect(peak.price).toBe(0);
    });

    it('should handle single data point', () => {
      const peak = findPeakPrice([mockHistoricalData[0]]);
      expect(peak.price).toBe(105);
    });
  });

  describe('findStartPrice', () => {
    it('should find the first valid price in historical data', () => {
      const start = findStartPrice(mockHistoricalData);
      expect(start.price).toBe(100);
      expect(start.date).toEqual(new Date('2024-01-01'));
    });

    it('should handle empty array', () => {
      const start = findStartPrice([]);
      expect(start.price).toBe(0);
    });

    it('should skip invalid data points with zero open price', () => {
      const dataWithInvalid: HistoricalDataPoint[] = [
        {
          date: new Date('2024-01-01'),
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          volume: 0,
        },
        ...mockHistoricalData,
      ];
      const start = findStartPrice(dataWithInvalid);
      expect(start.price).toBe(100);
      expect(start.date).toEqual(new Date('2024-01-01'));
    });
  });

  describe('calculateTradingDays', () => {
    it('should calculate approximate trading days between two dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-08'); // 7 days
      const tradingDays = calculateTradingDays(startDate, endDate);
      // 7 days * (5/7) = 5 trading days
      expect(tradingDays).toBe(5);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01');
      const tradingDays = calculateTradingDays(date, date);
      expect(tradingDays).toBe(0);
    });

    it('should handle longer periods', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31'); // ~365 days
      const tradingDays = calculateTradingDays(startDate, endDate);
      // Should be approximately 260 trading days (365 * 5/7 ≈ 260)
      expect(tradingDays).toBeGreaterThan(250);
      expect(tradingDays).toBeLessThan(270);
    });
  });

  describe('preparePriceDataForNey', () => {
    it('should return last 60 data points', () => {
      // Create 100 data points
      const largeDataset: HistoricalDataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1),
        open: 100 + i,
        high: 105 + i,
        low: 98 + i,
        close: 103 + i,
        volume: 1000000 + i * 10000,
      }));

      const neyData = preparePriceDataForNey(largeDataset);
      expect(neyData).toHaveLength(60);
      
      // Should be the last 60 points
      expect(neyData[0].price).toBe(143); // close price of 41st point (100 + 40 + 3)
      expect(neyData[59].price).toBe(202); // close price of 100th point (100 + 99 + 3)
    });

    it('should return all data if less than 60 points', () => {
      const neyData = preparePriceDataForNey(mockHistoricalData);
      expect(neyData).toHaveLength(5);
    });

    it('should format data correctly for Ney analysis', () => {
      const neyData = preparePriceDataForNey(mockHistoricalData);
      
      expect(neyData[0]).toHaveProperty('price');
      expect(neyData[0]).toHaveProperty('volume');
      expect(neyData[0]).toHaveProperty('date');
      
      expect(neyData[0].price).toBe(103);
      expect(neyData[0].volume).toBe(1000000);
      expect(typeof neyData[0].date).toBe('string');
    });

    it('should use close price for Ney analysis', () => {
      const neyData = preparePriceDataForNey(mockHistoricalData);
      
      // Verify it uses close prices, not open/high/low
      expect(neyData.map(d => d.price)).toEqual([103, 108, 112, 118, 116]);
    });
  });
});
