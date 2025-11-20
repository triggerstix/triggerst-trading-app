/**
 * Combined Gann + Ney Analysis Engine
 * Integrates geometric and specialist/volume analysis for comprehensive forecasting
 */

import { GannAnalysis, analyzeGann } from "./gann";
import { NeyAnalysis, analyzeNey } from "./ney";

export interface Scenario {
  id: number;
  name: string;
  probability: number; // 0-100
  target: string;
  timeline: string;
  icon: string;
}

export interface Recommendation {
  action: "BUY" | "HOLD" | "SELL" | "AVOID" | "WAIT";
  stopLoss?: number;
  target?: number;
  reasoning: string;
}

export interface CombinedAnalysis {
  gann: GannAnalysis;
  ney: NeyAnalysis;
  combinedRisk: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  combinedScore: number;
  agreement: number; // 0-100, how much Gann and Ney agree
  scenarios: Scenario[];
  recommendation: Recommendation;
  summary: string;
}

/**
 * Calculate agreement between Gann and Ney analyses
 */
export function calculateAgreement(gann: GannAnalysis, ney: NeyAnalysis): number {
  // Both methodologies agree when risk levels are similar
  const riskLevels = { LOW: 1, MODERATE: 2, HIGH: 3, EXTREME: 4 };
  const gannRisk = riskLevels[gann.riskLevel];
  const neyRisk = riskLevels[ney.riskLevel];
  
  const difference = Math.abs(gannRisk - neyRisk);
  
  // Convert difference to agreement percentage
  if (difference === 0) return 100; // Perfect agreement
  if (difference === 1) return 75;  // Close agreement
  if (difference === 2) return 50;  // Moderate disagreement
  return 25; // Strong disagreement
}

/**
 * Combine risk assessments from both methodologies
 */
export function combineRisk(
  gann: GannAnalysis,
  ney: NeyAnalysis
): { level: "LOW" | "MODERATE" | "HIGH" | "EXTREME"; score: number } {
  // Average the risk scores
  const avgScore = (gann.riskScore + ney.riskScore) / 2;
  const roundedScore = Math.round(avgScore);
  
  // Determine combined level
  let level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  if (roundedScore >= 4) level = "EXTREME";
  else if (roundedScore >= 3) level = "HIGH";
  else if (roundedScore >= 2) level = "MODERATE";
  else level = "LOW";
  
  return { level, score: roundedScore };
}

/**
 * Generate forecast scenarios
 */
export function generateScenarios(
  gann: GannAnalysis,
  ney: NeyAnalysis,
  currentPrice: number
): Scenario[] {
  const risk = combineRisk(gann, ney);
  
  // Scenario probabilities based on combined analysis
  if (risk.level === "EXTREME") {
    // High probability of correction
    return [
      {
        id: 1,
        name: "CORRECTION",
        probability: 60,
        target: "Down 30-50%",
        timeline: "3-6 months",
        icon: "📉",
      },
      {
        id: 2,
        name: "CONSOLIDATION",
        probability: 30,
        target: "Sideways",
        timeline: "1-3 months",
        icon: "📊",
      },
      {
        id: 3,
        name: "CONTINUED RALLY",
        probability: 10,
        target: "Up 10-20%",
        timeline: "Short-term",
        icon: "📈",
      },
    ];
  } else if (risk.level === "HIGH") {
    return [
      {
        id: 1,
        name: "CONSOLIDATION",
        probability: 50,
        target: "Sideways",
        timeline: "3-6 months",
        icon: "📊",
      },
      {
        id: 2,
        name: "CORRECTION",
        probability: 30,
        target: "Down 15-30%",
        timeline: "3-6 months",
        icon: "📉",
      },
      {
        id: 3,
        name: "BREAKOUT",
        probability: 20,
        target: "Up 20-40%",
        timeline: "6-12 months",
        icon: "📈",
      },
    ];
  } else if (risk.level === "MODERATE") {
    return [
      {
        id: 1,
        name: "CONSOLIDATION",
        probability: 60,
        target: "Sideways",
        timeline: "3-6 months",
        icon: "📊",
      },
      {
        id: 2,
        name: "BREAKOUT",
        probability: 25,
        target: "Up 20-40%",
        timeline: "6-12 months",
        icon: "📈",
      },
      {
        id: 3,
        name: "CORRECTION",
        probability: 15,
        target: "Down 10-20%",
        timeline: "3-6 months",
        icon: "📉",
      },
    ];
  } else {
    // LOW risk - bullish
    return [
      {
        id: 1,
        name: "BREAKOUT",
        probability: 50,
        target: "Up 30-50%",
        timeline: "6-12 months",
        icon: "📈",
      },
      {
        id: 2,
        name: "CONSOLIDATION",
        probability: 40,
        target: "Sideways",
        timeline: "3-6 months",
        icon: "📊",
      },
      {
        id: 3,
        name: "CORRECTION",
        probability: 10,
        target: "Down 10-15%",
        timeline: "Short-term",
        icon: "📉",
      },
    ];
  }
}

/**
 * Generate trading recommendation
 */
export function generateRecommendation(
  gann: GannAnalysis,
  ney: NeyAnalysis,
  currentPrice: number,
  squareOfNineSupport: number
): Recommendation {
  const risk = combineRisk(gann, ney);
  
  if (risk.level === "EXTREME") {
    return {
      action: "AVOID",
      reasoning: "Both Gann and Ney indicate extreme risk. Price far above sustainable levels with distribution in progress.",
    };
  } else if (risk.level === "HIGH") {
    if (ney.currentPhase === "DISTRIBUTION") {
      return {
        action: "SELL",
        stopLoss: squareOfNineSupport,
        reasoning: "High risk with distribution phase active. Consider taking profits.",
      };
    } else {
      return {
        action: "HOLD",
        stopLoss: squareOfNineSupport,
        reasoning: "High risk but not in distribution. Hold with tight stop-loss.",
      };
    }
  } else if (risk.level === "MODERATE") {
    return {
      action: "HOLD",
      stopLoss: squareOfNineSupport * 0.95,
      target: gann.squareOfNineLevels.find(l => l.type === "resistance")?.price,
      reasoning: "Moderate risk. Hold current positions with stop-loss at key support.",
    };
  } else {
    // LOW risk
    if (gann.rallyAngle.deviation < 0) {
      return {
        action: "BUY",
        stopLoss: squareOfNineSupport * 0.9,
        target: gann.rallyAngle.sustainablePrice,
        reasoning: "Low risk with price below sustainable levels. Potential buying opportunity.",
      };
    } else {
      return {
        action: "HOLD",
        target: gann.squareOfNineLevels.find(l => l.type === "resistance")?.price,
        reasoning: "Low risk. Hold for upside potential.",
      };
    }
  }
}

/**
 * Perform complete combined analysis
 */
export function analyzeCombined(
  startPrice: number,
  peakPrice: number,
  currentPrice: number,
  days: number,
  priceData: { price: number; volume: number; date: Date }[]
): CombinedAnalysis {
  // Perform individual analyses
  const gann = analyzeGann(startPrice, peakPrice, days, currentPrice);
  const ney = analyzeNey(priceData, peakPrice, currentPrice);
  
  // Combine results
  const risk = combineRisk(gann, ney);
  const agreement = calculateAgreement(gann, ney);
  const scenarios = generateScenarios(gann, ney, currentPrice);
  
  // Find nearest support level
  const supportLevel = gann.squareOfNineLevels.find(l => l.type === "support" && l.price < currentPrice);
  const recommendation = generateRecommendation(gann, ney, currentPrice, supportLevel?.price || currentPrice * 0.9);
  
  const summary = `Combined analysis: ${risk.level} risk (${agreement}% agreement). ${recommendation.action}: ${recommendation.reasoning}`;
  
  return {
    gann,
    ney,
    combinedRisk: risk.level,
    combinedScore: risk.score,
    agreement,
    scenarios,
    recommendation,
    summary,
  };
}
