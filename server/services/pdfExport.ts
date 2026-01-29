/**
 * PDF Export Service
 * Generates standardized Triggerstix analysis reports in multiple formats
 */

import { CombinedAnalysis } from "../analysis/combined";

export interface StockInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  high52Week: number;
  low52Week: number;
}

/**
 * Generate long-form markdown report
 */
export function generateLongFormReport(
  stockInfo: StockInfo,
  analysis: CombinedAnalysis
): string {
  const { symbol, name, currentPrice, high52Week, low52Week } = stockInfo;
  const { gann, ney, combinedRisk, agreement, recommendation, scenarios } = analysis;
  
  const rangePosition = ((currentPrice - low52Week) / (high52Week - low52Week) * 100).toFixed(1);
  const pctFromHigh = ((high52Week - currentPrice) / high52Week * 100).toFixed(1);
  
  return `# ${symbol} (${name}) - Triggerstix Analysis Report

**Generated:** ${new Date().toLocaleDateString()}

## Executive Summary

**Current Price:** $${currentPrice.toFixed(2)} (${rangePosition}% of 52-week range)

**Triggerstix Agreement Score:** ${agreement}%

**Combined Risk Level:** ${combinedRisk}

**Final Recommendation:** ${recommendation.action}

---

## W.D. Gann Geometric Analysis

### Rally Angle Assessment
- **Angle:** ${gann.rallyAngle.angle}
- **Current Price:** $${gann.rallyAngle.currentPrice.toFixed(2)}
- **Sustainable Price:** $${gann.rallyAngle.sustainablePrice.toFixed(2)}
- **Deviation:** ${gann.rallyAngle.deviation > 0 ? "+" : ""}${gann.rallyAngle.deviation.toFixed(1)}%

### Risk Assessment
- **Risk Level:** ${gann.riskLevel}
- **Risk Score:** ${gann.riskScore}/5

### Square of Nine Levels

| Level | Price | Type | Status |
|-------|-------|------|--------|
${gann.squareOfNineLevels.slice(0, 5).map(l => 
  `| ${l.level} | $${l.price} | ${l.type} | ${l.active ? "✓ Active" : ""} |`
).join("\n")}

### Gann Summary
${gann.summary}

---

## Richard Ney Specialist Analysis

### Market Phase Identification
**Current Phase:** ${ney.currentPhase}

### Phase History

| Phase | Duration | Price Range | Volume Pattern |
|-------|----------|-------------|----------------|
${ney.phaseHistory.map(p => 
  `| ${p.phase} | ${p.duration} | ${p.priceRange} | ${p.volumePattern} |`
).join("\n")}

### Specialist Behavior
${ney.specialistBehavior}

### Volume Pattern
${ney.volumePattern}

### Risk Assessment
- **Risk Level:** ${ney.riskLevel}
- **Risk Score:** ${ney.riskScore}/5

### Ney Summary
${ney.summary}

---

## Combined Triggerstix Analysis

### Agreement Analysis
The Gann and Ney methodologies show **${agreement}% agreement**, indicating ${
  agreement >= 75 ? "strong alignment" : 
  agreement >= 50 ? "moderate alignment" : 
  "divergence"
} between geometric sustainability and institutional behavior.

### Risk Assessment
- **Combined Risk:** ${combinedRisk}
- **Combined Score:** ${analysis.combinedScore}/5

### Forecast Scenarios

${scenarios.map(s => `#### ${s.icon} ${s.name} (${s.probability}% probability)
- **Target:** ${s.target}
- **Timeline:** ${s.timeline}
`).join("\n")}

---

## Trading Recommendation

### Action: ${recommendation.action}

${recommendation.reasoning}

${recommendation.stopLoss ? `**Stop Loss:** $${recommendation.stopLoss.toFixed(2)}` : ""}
${recommendation.target ? `**Target:** $${recommendation.target.toFixed(2)}` : ""}

---

## Key Metrics

| Metric | Value |
|--------|-------|
| 52-Week High | $${high52Week.toFixed(2)} |
| 52-Week Low | $${low52Week.toFixed(2)} |
| Distance from High | ${pctFromHigh}% |
| Range Position | ${rangePosition}% |
| Gann Risk | ${gann.riskLevel} (${gann.riskScore}/5) |
| Ney Risk | ${ney.riskLevel} (${ney.riskScore}/5) |
| Agreement | ${agreement}% |
| Combined Risk | ${combinedRisk} (${analysis.combinedScore}/5) |

---

## Methodology

This analysis combines two proven methodologies:

1. **W.D. Gann Geometric Analysis** - Evaluates price sustainability through geometric angles and Square of Nine calculations
2. **Richard Ney Specialist Behavior** - Identifies institutional accumulation/distribution phases through volume analysis

When both methodologies align (high agreement score), it creates a high-confidence "trigger" signal - the Triggerstix methodology.

---

*Disclaimer: This analysis is for informational purposes only and does not constitute financial advice. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.*
`;
}

/**
 * Generate short-form summary (2-minute version)
 */
export function generateShortFormSummary(
  stockInfo: StockInfo,
  analysis: CombinedAnalysis
): string {
  const { symbol, currentPrice, high52Week, low52Week } = stockInfo;
  const { gann, ney, combinedRisk, agreement, recommendation } = analysis;
  
  const rangePosition = ((currentPrice - low52Week) / (high52Week - low52Week) * 100).toFixed(1);
  
  return `**${symbol} - Triggerstix Analysis**

**Current Price:** $${currentPrice.toFixed(2)} (${rangePosition}% of 52-week range)

**Gann Score:** ${gann.riskScore}/5 - ${gann.riskLevel}
- ${gann.rallyAngle.angle} angle
- ${gann.rallyAngle.deviation > 0 ? "+" : ""}${gann.rallyAngle.deviation.toFixed(1)}% from sustainable

**Ney Score:** ${ney.riskScore}/5 - ${ney.riskLevel}
- ${ney.currentPhase} phase
- ${ney.specialistBehavior}

**Triggerstix Agreement:** ${agreement}% - ${combinedRisk} risk

**Final Verdict:** ${recommendation.action}

**Trade Setup:**
- Entry: $${currentPrice.toFixed(2)}
${recommendation.stopLoss ? `- Stop: $${recommendation.stopLoss.toFixed(2)}` : ""}
${recommendation.target ? `- Target: $${recommendation.target.toFixed(2)}` : ""}

**Key Risk:** ${recommendation.reasoning}
`;
}

/**
 * Generate slideshow HTML (for PDF export)
 */
export function generateSlideshow(
  stockInfo: StockInfo,
  analysis: CombinedAnalysis
): string {
  const { symbol, name, currentPrice } = stockInfo;
  const { gann, ney, agreement, recommendation, scenarios } = analysis;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${symbol} Triggerstix Analysis</title>
  <style>
    @page { size: 1280px 720px; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .slide { 
      width: 1280px; 
      height: 720px; 
      background: #0a0e27; 
      color: white; 
      padding: 60px;
      box-sizing: border-box;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    h1 { color: #3b82f6; font-size: 64px; margin: 0 0 20px 0; }
    h2 { color: #60a5fa; font-size: 48px; margin: 0 0 40px 0; }
    h3 { color: #93c5fd; font-size: 32px; margin: 0 0 20px 0; }
    .metric { font-size: 24px; margin: 15px 0; }
    .score { font-size: 72px; color: #10b981; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .card { background: #1e293b; padding: 30px; border-radius: 8px; }
  </style>
</head>
<body>

<!-- Slide 1: Title -->
<div class="slide">
  <h1>${symbol}</h1>
  <h2>${name}</h2>
  <h3>Triggerstix Analysis</h3>
  <p style="font-size: 24px; color: #94a3b8;">W.D. Gann + Richard Ney Methodology</p>
  <p style="font-size: 20px; color: #64748b; margin-top: 40px;">${new Date().toLocaleDateString()}</p>
</div>

<!-- Slide 2: Overview -->
<div class="slide">
  <h2>Overview</h2>
  <div class="metric">Current Price: <strong>$${currentPrice.toFixed(2)}</strong></div>
  <div class="metric">Triggerstix Agreement: <strong>${agreement}%</strong></div>
  <div class="metric">Combined Risk: <strong>${analysis.combinedRisk}</strong></div>
  <div class="metric" style="font-size: 36px; margin-top: 40px; color: #3b82f6;">
    Recommendation: <strong>${recommendation.action}</strong>
  </div>
</div>

<!-- Slide 3: Gann Analysis -->
<div class="slide">
  <h2>W.D. Gann Analysis</h2>
  <div class="grid">
    <div>
      <h3>Rally Angle</h3>
      <div class="metric">Angle: <strong>${gann.rallyAngle.angle}</strong></div>
      <div class="metric">Deviation: <strong>${gann.rallyAngle.deviation > 0 ? "+" : ""}${gann.rallyAngle.deviation.toFixed(1)}%</strong></div>
    </div>
    <div>
      <h3>Risk Assessment</h3>
      <div class="score">${gann.riskScore}/5</div>
      <div class="metric">${gann.riskLevel}</div>
    </div>
  </div>
</div>

<!-- Slide 4: Ney Analysis -->
<div class="slide">
  <h2>Richard Ney Analysis</h2>
  <div class="grid">
    <div>
      <h3>Market Phase</h3>
      <div class="metric" style="font-size: 36px;"><strong>${ney.currentPhase}</strong></div>
      <div class="metric">${ney.specialistBehavior}</div>
    </div>
    <div>
      <h3>Risk Assessment</h3>
      <div class="score">${ney.riskScore}/5</div>
      <div class="metric">${ney.riskLevel}</div>
    </div>
  </div>
</div>

<!-- Slide 5: Scenarios -->
<div class="slide">
  <h2>Forecast Scenarios</h2>
  ${scenarios.map(s => `
    <div class="card">
      <h3>${s.icon} ${s.name} (${s.probability}%)</h3>
      <div class="metric">Target: ${s.target}</div>
      <div class="metric">Timeline: ${s.timeline}</div>
    </div>
  `).join("")}
</div>

<!-- Slide 6: Trade Setup -->
<div class="slide">
  <h2>Trade Setup</h2>
  <h3 style="color: #3b82f6; font-size: 48px;">${recommendation.action}</h3>
  <div class="metric" style="font-size: 28px; margin: 30px 0;">${recommendation.reasoning}</div>
  ${recommendation.stopLoss ? `<div class="metric">Stop Loss: <strong>$${recommendation.stopLoss.toFixed(2)}</strong></div>` : ""}
  ${recommendation.target ? `<div class="metric">Target: <strong>$${recommendation.target.toFixed(2)}</strong></div>` : ""}
</div>

</body>
</html>`;
}
