/**
 * Geometric Price Analysis Engine
 * Calculates price angles, Square of Nine levels, and geometric price projections
 */

export interface PricePoint {
  date: Date;
  price: number;
}

export interface PriceAngle {
  angle: string; // e.g., "1x1", "2x1", "8x1"
  multiplier: number;
  currentPrice: number;
  sustainablePrice: number;
  deviation: number; // percentage above/below sustainable
}

export interface SquareOfNineLevel {
  level: number;
  price: number;
  type: "support" | "resistance";
  active: boolean;
}

export interface PriceAnalysis {
  rallyAngle: PriceAngle;
  squareOfNineLevels: SquareOfNineLevel[];
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  riskScore: number; // 1-5
  summary: string;
}

/**
 * Calculate price angle from rally
 */
export function calculatePriceAngle(
  startPrice: number,
  endPrice: number,
  days: number
): PriceAngle {
  const priceChange = endPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;
  const dailyChange = priceChange / days;
  
  // Calculate angle multiplier
  // 1x1 = 1% per day, 2x1 = 2% per day, etc.
  const dailyPercentChange = priceChangePercent / days;
  const multiplier = dailyPercentChange;
  
  // Determine angle classification
  let angleString: string;
  if (multiplier >= 8) angleString = "8x1+";
  else if (multiplier >= 4) angleString = "4x1";
  else if (multiplier >= 2) angleString = "2x1";
  else if (multiplier >= 1) angleString = "1x1";
  else if (multiplier >= 0.5) angleString = "1x2";
  else angleString = "1x4";
  
  // Calculate sustainable price (1x1 angle)
  const sustainablePrice = startPrice * (1 + (days * 0.01)); // 1% per day
  const deviation = ((endPrice - sustainablePrice) / sustainablePrice) * 100;
  
  return {
    angle: angleString,
    multiplier,
    currentPrice: endPrice,
    sustainablePrice,
    deviation,
  };
}

/**
 * Calculate Square of Nine levels
 * Based on square root relationships
 */
export function calculateSquareOfNine(
  currentPrice: number,
  levels: number = 5
): SquareOfNineLevel[] {
  const sqrt = Math.sqrt(currentPrice);
  const results: SquareOfNineLevel[] = [];
  
  // Calculate levels above and below
  for (let i = -levels; i <= levels; i++) {
    if (i === 0) continue;
    
    const newSqrt = sqrt + i;
    const price = newSqrt * newSqrt;
    const type = i > 0 ? "resistance" : "support";
    const active = Math.abs(price - currentPrice) / currentPrice < 0.05; // Within 5%
    
    results.push({
      level: Math.round(newSqrt),
      price: Math.round(price),
      type,
      active,
    });
  }
  
  // Sort by price
  return results.sort((a, b) => b.price - a.price);
}

/**
 * Assess risk level based on price analysis
 */
export function assessPriceRisk(angle: PriceAngle): {
  level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  score: number;
} {
  const { deviation, multiplier } = angle;
  
  // Risk increases with:
  // 1. High deviation from sustainable (1x1)
  // 2. Parabolic angle (>4x1)
  
  let score = 1;
  
  // Deviation risk
  if (Math.abs(deviation) > 300) score += 2;
  else if (Math.abs(deviation) > 100) score += 1;
  
  // Angle risk
  if (multiplier > 8) score += 2;
  else if (multiplier > 4) score += 1;
  
  // Determine level
  let level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  if (score >= 4) level = "EXTREME";
  else if (score >= 3) level = "HIGH";
  else if (score >= 2) level = "MODERATE";
  else level = "LOW";
  
  return { level, score };
}

/**
 * Perform complete price analysis
 */
export function analyzePriceAction(
  startPrice: number,
  endPrice: number,
  days: number,
  currentPrice: number = endPrice
): PriceAnalysis {
  const rallyAngle = calculatePriceAngle(startPrice, endPrice, days);
  const squareOfNineLevels = calculateSquareOfNine(currentPrice);
  const risk = assessPriceRisk(rallyAngle);
  
  // Generate summary
  const summary = `Rally angle: ${rallyAngle.angle} (${rallyAngle.deviation > 0 ? "+" : ""}${rallyAngle.deviation.toFixed(1)}% ${
    rallyAngle.deviation > 0 ? "above" : "below"
  } sustainable). Risk: ${risk.level}.`;
  
  return {
    rallyAngle,
    squareOfNineLevels,
    riskLevel: risk.level,
    riskScore: risk.score,
    summary,
  };
}

// Backward-compatible aliases
export type GannAngle = PriceAngle;
export type GannAnalysis = PriceAnalysis;
export const calculateGannAngle = calculatePriceAngle;
export const assessGannRisk = assessPriceRisk;
export const analyzeGann = analyzePriceAction;
