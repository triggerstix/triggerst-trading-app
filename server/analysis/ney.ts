/**
 * Richard Ney Specialist/Volume Analysis Engine
 * Identifies accumulation, markup, distribution, and markdown phases
 */

export interface VolumeData {
  date: Date;
  volume: number;
  price: number;
}

export type Phase = "ACCUMULATION" | "MARKUP" | "DISTRIBUTION" | "MARKDOWN";

export interface PhaseInfo {
  phase: Phase;
  duration: string;
  priceRange: string;
  volumePattern: string;
}

export interface NeyAnalysis {
  currentPhase: Phase;
  phaseHistory: PhaseInfo[];
  specialistBehavior: string;
  volumePattern: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  riskScore: number;
  summary: string;
}

/**
 * Identify current market phase based on price and volume
 */
export function identifyPhase(
  priceData: { price: number; volume: number }[],
  lookbackPeriod: number = 30
): Phase {
  if (priceData.length < lookbackPeriod) {
    return "ACCUMULATION";
  }
  
  const recent = priceData.slice(-lookbackPeriod);
  const earlier = priceData.slice(-lookbackPeriod * 2, -lookbackPeriod);
  
  // Calculate averages
  const recentAvgPrice = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
  const recentAvgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
  const earlierAvgPrice = earlier.reduce((sum, d) => sum + d.price, 0) / earlier.length;
  const earlierAvgVolume = earlier.reduce((sum, d) => sum + d.volume, 0) / earlier.length;
  
  const priceChange = (recentAvgPrice - earlierAvgPrice) / earlierAvgPrice;
  const volumeChange = (recentAvgVolume - earlierAvgVolume) / earlierAvgVolume;
  
  // Phase identification logic
  if (priceChange < -0.1 && volumeChange < 0) {
    return "MARKDOWN"; // Falling price, declining volume
  } else if (priceChange > 0.2 && volumeChange > 0.5) {
    return "DISTRIBUTION"; // Rising price, high volume (specialists selling)
  } else if (priceChange > 0.1 && volumeChange < 0.2) {
    return "MARKUP"; // Rising price, moderate volume
  } else {
    return "ACCUMULATION"; // Sideways/low price, low volume
  }
}

/**
 * Analyze specialist behavior
 */
export function analyzeSpecialistBehavior(
  currentPhase: Phase,
  priceAtPeak: number,
  currentPrice: number
): string {
  const drawdown = ((priceAtPeak - currentPrice) / priceAtPeak) * 100;
  
  switch (currentPhase) {
    case "ACCUMULATION":
      return "Specialists accumulating inventory at low prices";
    case "MARKUP":
      return "Specialists allowing price to rise, holding inventory";
    case "DISTRIBUTION":
      return "Specialists distributing inventory to public at high prices";
    case "MARKDOWN":
      if (drawdown > 30) {
        return "Specialists have exited, price declining";
      } else {
        return "Specialists may re-accumulate if support holds";
      }
  }
}

/**
 * Assess risk level based on Ney analysis
 */
export function assessNeyRisk(
  phase: Phase,
  drawdown: number
): {
  level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  score: number;
} {
  let score = 1;
  
  // Phase risk
  if (phase === "DISTRIBUTION") score += 2;
  else if (phase === "MARKDOWN") score += 1;
  else if (phase === "MARKUP") score += 1;
  
  // Drawdown risk
  if (drawdown > 40) score += 1;
  else if (drawdown < -20) score -= 1; // Oversold
  
  // Determine level
  let level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  if (score >= 4) level = "EXTREME";
  else if (score >= 3) level = "HIGH";
  else if (score >= 2) level = "MODERATE";
  else level = "LOW";
  
  return { level, score };
}

/**
 * Perform complete Ney analysis
 */
export function analyzeNey(
  priceData: { price: number; volume: number; date: Date }[],
  peakPrice: number,
  currentPrice: number
): NeyAnalysis {
  const currentPhase = identifyPhase(priceData);
  const drawdown = ((peakPrice - currentPrice) / peakPrice) * 100;
  const specialistBehavior = analyzeSpecialistBehavior(currentPhase, peakPrice, currentPrice);
  const risk = assessNeyRisk(currentPhase, drawdown);
  
  // Simplified phase history
  const phaseHistory: PhaseInfo[] = [
    {
      phase: "ACCUMULATION",
      duration: "Long base period",
      priceRange: "Low prices",
      volumePattern: "Low volume",
    },
    {
      phase: "MARKUP",
      duration: "Gradual rise",
      priceRange: "Increasing",
      volumePattern: "Moderate volume",
    },
    {
      phase: "DISTRIBUTION",
      duration: "At peak",
      priceRange: "High prices",
      volumePattern: "High volume",
    },
  ];
  
  if (currentPhase === "MARKDOWN") {
    phaseHistory.push({
      phase: "MARKDOWN",
      duration: "Current",
      priceRange: `Down ${drawdown.toFixed(1)}%`,
      volumePattern: "Declining volume",
    });
  }
  
  const volumePattern = currentPhase === "DISTRIBUTION" 
    ? "Peak volume at highs"
    : currentPhase === "MARKDOWN"
    ? "Declining on pullback"
    : "Moderate volume";
  
  const summary = `Phase: ${currentPhase}. ${specialistBehavior}. Risk: ${risk.level}.`;
  
  return {
    currentPhase,
    phaseHistory,
    specialistBehavior,
    volumePattern,
    riskLevel: risk.level,
    riskScore: risk.score,
    summary,
  };
}
