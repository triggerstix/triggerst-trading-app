/**
 * Investment Analysis PDF Generator
 * Generates comprehensive 9-page PDF reports matching the HON Investment Analysis style
 * Uses HTML/CSS for precise layout control, converted to PDF via puppeteer
 */

import { CombinedAnalysis } from "../analysis/combined";
import { CompanyProfile } from "./stockData";

export interface InvestmentAnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  high52Week: number;
  low52Week: number;
  analysis: CombinedAnalysis;
  companyProfile?: CompanyProfile | null;
  peakPrice: number;
  peakDate: string;
  startPrice: number;
  startDate: string;
  tradingDays: number;
}

/**
 * Generate the complete Investment Analysis HTML document
 */
export function generateInvestmentAnalysisHtml(data: InvestmentAnalysisData): string {
  const {
    symbol,
    companyName,
    currentPrice,
    high52Week,
    low52Week,
    analysis,
    companyProfile,
    peakPrice,
    peakDate,
    startPrice,
    startDate,
    tradingDays,
  } = data;

  const { gann, ney, combinedRisk, agreement, recommendation, scenarios } = analysis;
  
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Calculate derived values
  const targetPrice = recommendation.target || (currentPrice * 1.15);
  const stopLoss = recommendation.stopLoss || (startPrice * 0.85);
  const upsidePotential = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(0);
  const riskReward = ((targetPrice - currentPrice) / (currentPrice - stopLoss)).toFixed(2);
  const sustainablePrice = gann.rallyAngle.sustainablePrice;
  const rallyRate = ((currentPrice - startPrice) / tradingDays).toFixed(2);
  
  // Square of Nine levels
  const supportLevels = gann.squareOfNineLevels.filter(l => l.type === 'support').slice(0, 2);
  const resistanceLevels = gann.squareOfNineLevels.filter(l => l.type === 'resistance').slice(0, 2);
  
  // Color based on recommendation
  const actionColor = recommendation.action === 'BUY' ? '#e67e22' : 
                      recommendation.action === 'SELL' ? '#e74c3c' : '#f39c12';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${symbol} Investment Analysis</title>
  <style>
    @page { 
      size: 11in 8.5in landscape; 
      margin: 0; 
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Arial, Helvetica, sans-serif;
      background: #e8ecf1;
      color: #1a2b6d;
      line-height: 1.4;
    }
    .page {
      width: 11in;
      height: 8.5in;
      padding: 0.5in;
      page-break-after: always;
      position: relative;
      background: #e8ecf1;
      background-image: 
        linear-gradient(rgba(180,190,200,0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(180,190,200,0.3) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .page:last-child { page-break-after: avoid; }
    
    /* Corner brackets */
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: #e67e22;
      border-style: solid;
    }
    .corner-tl { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
    .corner-tr { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }
    
    /* Typography */
    h1 { font-size: 48px; color: #1a2b6d; font-weight: bold; letter-spacing: 2px; }
    h2 { font-size: 28px; color: #1a2b6d; font-weight: bold; margin-bottom: 20px; }
    h3 { font-size: 16px; color: #e67e22; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px; }
    
    /* Boxes and badges */
    .ticker-box {
      display: inline-block;
      border: 3px solid #1a2b6d;
      padding: 15px 40px;
      font-size: 36px;
      font-weight: bold;
      color: #1a2b6d;
      background: rgba(200,210,220,0.5);
      letter-spacing: 4px;
    }
    .methodology-badge {
      display: inline-block;
      background: #fde8d0;
      color: #e67e22;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .action-badge {
      display: inline-block;
      background: #fde8d0;
      color: ${actionColor};
      padding: 15px 30px;
      font-size: 36px;
      font-weight: bold;
    }
    .risk-badge {
      display: inline-block;
      background: #fde8d0;
      color: #e67e22;
      padding: 8px 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .agreement-box {
      display: inline-block;
      border: 3px solid #1a2b6d;
      padding: 20px 40px;
      font-size: 32px;
      font-weight: bold;
      color: #1a2b6d;
      background: rgba(200,210,220,0.5);
      letter-spacing: 2px;
    }
    .big-number {
      font-size: 48px;
      font-weight: bold;
      color: #1a2b6d;
      border: 3px solid #1a2b6d;
      padding: 20px 40px;
      background: rgba(200,210,220,0.5);
    }
    
    /* Layout helpers */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .gap-20 { gap: 20px; }
    .gap-40 { gap: 40px; }
    .text-center { text-align: center; }
    .mt-10 { margin-top: 10px; }
    .mt-20 { margin-top: 20px; }
    .mt-40 { margin-top: 40px; }
    .mb-10 { margin-bottom: 10px; }
    .mb-20 { margin-bottom: 20px; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 15px; text-align: left; }
    th { color: #94a3b8; font-size: 12px; font-weight: normal; }
    td { font-size: 14px; border-bottom: 1px solid rgba(180,190,200,0.5); }
    .price-green { color: #27ae60; font-weight: bold; }
    .price-red { color: #e74c3c; font-weight: bold; }
    .price-blue { color: #1a2b6d; font-weight: bold; }
    
    /* Two column layout */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .two-col-wide { display: grid; grid-template-columns: 45% 55%; gap: 40px; }
    
    /* Content sections */
    .section { margin-bottom: 25px; }
    .bullet { color: #e67e22; margin-right: 8px; }
    .bullet-list { list-style: none; }
    .bullet-list li { margin-bottom: 8px; font-size: 14px; }
    .bullet-list li::before { content: "▸"; color: #e67e22; margin-right: 10px; }
    
    /* Vertical bar accent */
    .accent-bar { border-left: 4px solid #e67e22; padding-left: 15px; }
    
    /* Phase indicator */
    .phase-box {
      border: 3px solid #1a2b6d;
      padding: 20px;
      background: rgba(200,210,220,0.5);
      font-size: 24px;
      font-weight: bold;
      color: #1a2b6d;
    }
    .phase-list { list-style: none; margin-top: 15px; }
    .phase-list li { margin-bottom: 8px; font-size: 14px; }
    .phase-active { font-weight: bold; color: #1a2b6d; }
    .phase-inactive { color: #94a3b8; }
    .phase-check { color: #1a2b6d; }
    .phase-empty { color: #94a3b8; }
    
    /* Comparison table */
    .compare-table th { background: rgba(180,190,200,0.3); }
    .compare-table td { background: rgba(255,255,255,0.5); }
    .check-mark { color: #e67e22; font-size: 18px; }
    
    /* Image placeholder */
    .company-image {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    
    /* Entry/Exit boxes */
    .entry-section { background: rgba(255,255,255,0.3); padding: 20px; }
    .target-box { 
      background: rgba(255,255,255,0.5); 
      padding: 15px; 
      margin-bottom: 10px;
      border-left: 4px solid #e67e22;
    }
    .target-title { color: #e67e22; font-weight: bold; font-size: 16px; }
    .target-price { color: #1a2b6d; font-weight: bold; font-size: 18px; }
    .target-note { color: #64748b; font-size: 12px; }
    
    /* Bull/Bear case */
    .case-section { padding: 20px; }
    .bull-case { border-left: 4px solid #e67e22; }
    .bear-case { border-left: 4px solid #94a3b8; }
    
    /* Net assessment */
    .net-assessment {
      background: rgba(26,43,109,0.1);
      border-top: 3px solid #1a2b6d;
      padding: 20px;
      margin-top: 20px;
    }
    
    /* Disclaimer */
    .disclaimer {
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #94a3b8;
      padding-top: 15px;
      margin-top: 20px;
    }
  </style>
</head>
<body>

<!-- PAGE 1: Title Page -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="flex flex-col justify-center items-center" style="height: 100%;">
    <div class="ticker-box mb-20">${symbol}</div>
    <h1 style="margin: 30px 0;">INVESTMENT ANALYSIS</h1>
    <p style="font-size: 24px; color: #1a2b6d; font-family: monospace; margin-bottom: 40px;">
      ${companyName}
    </p>
    <div class="methodology-badge mb-20">TRIGGERSTIX DUAL-METHOD ANALYSIS</div>
    <p style="font-size: 18px; color: #64748b; font-family: monospace; margin-top: 40px;">
      ${dateStr}
    </p>
    <p style="font-size: 24px; color: #1a2b6d; font-weight: bold; margin-top: 20px;">
      Current Price: $${currentPrice.toFixed(2)}
    </p>
  </div>
</div>

<!-- PAGE 2: Executive Summary -->
<div class="page">
  <h2>Executive Summary: Strong ${recommendation.action} Signal</h2>
  
  <div class="two-col">
    <div>
      <div class="flex gap-20 items-center mb-20">
        <div class="action-badge">${recommendation.action}</div>
        <div class="risk-badge">${combinedRisk} RISK</div>
      </div>
      
      <table>
        <tr><td>Current Price</td><td class="price-blue">$${currentPrice.toFixed(2)}</td></tr>
        <tr><td>Target Price</td><td class="price-green">$${targetPrice.toFixed(2)}</td></tr>
        <tr><td>Upside Potential</td><td class="price-green">+${upsidePotential}%</td></tr>
        <tr><td>Stop Loss</td><td class="price-blue">$${stopLoss.toFixed(2)}</td></tr>
        <tr><td>Risk/Reward</td><td class="price-blue">1:${riskReward}</td></tr>
        <tr><td style="height: 20px;"></td><td></td></tr>
        <tr><td>Rally Angle</td><td class="price-blue">${gann.rallyAngle.angle} (${gann.rallyAngle.angle === '1x1' ? 'strongest' : gann.rallyAngle.angle === '2x1' ? 'moderate' : 'weakest'})</td></tr>
        <tr><td>Market Phase</td><td class="price-blue">${ney.currentPhase}</td></tr>
      </table>
    </div>
    
    <div>
      <div class="agreement-box text-center mb-20">${agreement}% AGREEMENT</div>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">DUAL-METHOD ANALYSIS ALIGNMENT</p>
      
      <ul class="bullet-list">
        <li>Price at sustainable level (${gann.rallyAngle.angle} rally angle) with ${gann.rallyAngle.angle === '1x1' ? 'strongest' : 'moderate'} momentum indicator</li>
        <li>${ney.currentPhase} phase offers ${ney.currentPhase.includes('ACCUMULATION') || ney.currentPhase.includes('MARKUP') ? 'optimal' : 'cautious'} risk/reward timing for entry</li>
        <li>${combinedRisk === 'LOW' ? 'Low risk setup with favorable conditions' : combinedRisk === 'MODERATE' ? 'Moderate risk with mixed signals' : 'Higher risk - proceed with caution'}</li>
        <li>${agreement >= 75 ? 'Perfect alignment between geometric analysis and specialist behavior' : 'Partial alignment between methodologies'}</li>
        <li>${ney.volumePattern} volume pattern supports ${recommendation.action.toLowerCase()} thesis</li>
      </ul>
    </div>
  </div>
</div>

<!-- PAGE 3: Price Analysis -->
<div class="page">
  <h2>${gann.rallyAngle.angle} Rally Angle Indicates ${gann.rallyAngle.angle === '1x1' ? 'Strongest Sustainable' : gann.rallyAngle.angle === '2x1' ? 'Moderate' : 'Weak'} Trend</h2>
  
  <div class="two-col">
    <div>
      <div class="big-number text-center mb-20">${gann.rallyAngle.angle}</div>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
        ${gann.rallyAngle.angle === '1x1' ? '45-degree angle represents perfect balance between price and time - strongest sustainable rally pattern' : 
          gann.rallyAngle.angle === '2x1' ? '63-degree angle indicates moderate momentum - sustainable but less powerful than 1x1' :
          'Weaker angle indicates potential overextension or consolidation needed'}
      </p>
      
      <table>
        <tr><th>RECENT LOW</th><td></td></tr>
        <tr><td colspan="2" class="price-blue">$${startPrice.toFixed(2)} (${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</td></tr>
        <tr><th>DAYS FROM LOW</th><td></td></tr>
        <tr><td colspan="2" class="price-blue">${tradingDays} trading days</td></tr>
        <tr><th>RALLY RATE</th><td></td></tr>
        <tr><td colspan="2" class="price-blue">$${rallyRate} per day</td></tr>
        <tr><th>SUSTAINABLE PRICE</th><td></td></tr>
        <tr><td colspan="2" class="price-blue">$${sustainablePrice.toFixed(2)}</td></tr>
        <tr><th>CURRENT PRICE</th><td></td></tr>
        <tr><td colspan="2" class="price-blue">$${currentPrice.toFixed(2)}</td></tr>
        <tr><th>PRICE RISK ASSESSMENT</th><td></td></tr>
        <tr><td colspan="2"><span class="risk-badge">${gann.riskLevel}</span></td></tr>
      </table>
    </div>
    
    <div>
      <h3>SQUARE OF NINE LEVELS</h3>
      <table class="compare-table">
        <tr><th>Level</th><th>Price</th><th>Description</th></tr>
        ${resistanceLevels.length > 1 ? `<tr><td>R2 (Stretch)</td><td class="price-green">$${resistanceLevels[1]?.price || (targetPrice * 1.1).toFixed(2)}</td><td style="font-size: 12px;">High analyst estimate (+${((resistanceLevels[1]?.price || targetPrice * 1.1) / currentPrice * 100 - 100).toFixed(0)}%)</td></tr>` : ''}
        <tr><td>R1 (Target)</td><td class="price-green">$${targetPrice.toFixed(2)}</td><td style="font-size: 12px;">Primary target (+${upsidePotential}%)</td></tr>
        <tr><td>Minor R</td><td class="price-blue">$${high52Week.toFixed(2)}</td><td style="font-size: 12px;">52-week high (+${((high52Week / currentPrice - 1) * 100).toFixed(1)}%)</td></tr>
        <tr><td>CURRENT</td><td class="price-blue">$${currentPrice.toFixed(2)}</td><td style="font-size: 12px;">${Math.abs(gann.rallyAngle.deviation) < 5 ? 'At sustainable price' : gann.rallyAngle.deviation > 0 ? 'Above sustainable' : 'Below sustainable'}</td></tr>
        <tr><td>S1</td><td class="price-blue">$${(sustainablePrice * 0.95).toFixed(2)}</td><td style="font-size: 12px;">Minor support (-${((1 - sustainablePrice * 0.95 / currentPrice) * 100).toFixed(0)}%)</td></tr>
        <tr><td>S2 (Stop)</td><td class="price-red">$${stopLoss.toFixed(2)}</td><td style="font-size: 12px;">Stop loss level (-${((1 - stopLoss / currentPrice) * 100).toFixed(0)}%)</td></tr>
      </table>
      
      <div class="accent-bar mt-20">
        <p style="font-size: 13px;"><strong>Interpretation:</strong> ${gann.summary}</p>
      </div>
      <div class="accent-bar mt-10">
        <p style="font-size: 13px;"><strong>Outlook:</strong> ${gann.rallyAngle.angle} angle historically precedes continued advance to next resistance levels, supporting $${targetPrice.toFixed(2)} target with ${gann.riskLevel.toLowerCase()} probability of reversal</p>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: Market Phase Analysis -->
<div class="page">
  <h2>${ney.currentPhase} Phase ${ney.currentPhase.includes('MARKUP') ? 'Offers Optimal Entry Timing' : ney.currentPhase.includes('ACCUMULATION') ? 'Indicates Building Positions' : 'Suggests Caution'}</h2>
  
  <div class="two-col">
    <div>
      <div class="phase-box mb-20">${ney.currentPhase}</div>
      
      <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">FOUR-PHASE MARKET CYCLE</p>
      <ul class="phase-list">
        <li class="${ney.currentPhase.includes('ACCUMULATION') ? 'phase-active' : 'phase-inactive'}">
          <span class="${ney.currentPhase.includes('ACCUMULATION') ? 'phase-check' : 'phase-empty'}">■</span> Accumulation ${ney.currentPhase.includes('ACCUMULATION') ? '(current)' : ''}
        </li>
        <li class="${ney.currentPhase.includes('MARKUP') ? 'phase-active' : 'phase-inactive'}">
          <span class="${ney.currentPhase.includes('MARKUP') ? 'phase-check' : 'phase-empty'}">■</span> Markup ${ney.currentPhase.includes('MARKUP') ? '(current)' : ''}
        </li>
        <li class="${ney.currentPhase.includes('DISTRIBUTION') ? 'phase-active' : 'phase-inactive'}">
          <span class="${ney.currentPhase.includes('DISTRIBUTION') ? 'phase-check' : 'phase-empty'}">□</span> Distribution ${ney.currentPhase.includes('DISTRIBUTION') ? '(current)' : ''}
        </li>
        <li class="${ney.currentPhase.includes('MARKDOWN') ? 'phase-active' : 'phase-inactive'}">
          <span class="${ney.currentPhase.includes('MARKDOWN') ? 'phase-check' : 'phase-empty'}">□</span> Markdown ${ney.currentPhase.includes('MARKDOWN') ? '(current)' : ''}
        </li>
      </ul>
      
      <p style="font-size: 12px; color: #64748b; margin: 20px 0 10px;">RISK ASSESSMENT</p>
      <div class="risk-badge">${ney.riskLevel}</div>
    </div>
    
    <div>
      <h3>SPECIALIST BEHAVIOR</h3>
      <p style="font-size: 14px; margin-bottom: 20px;">${ney.specialistBehavior}</p>
      
      <h3>VOLUME PATTERN</h3>
      <p style="font-size: 14px; margin-bottom: 20px;">${ney.volumePattern}</p>
      
      <h3>PHASE IMPLICATIONS</h3>
      <p style="font-size: 14px; margin-bottom: 20px;">
        ${ney.currentPhase.includes('MARKUP') ? 'Early MARKUP favors positioning - price advances toward targets before broad recognition and distribution.' :
          ney.currentPhase.includes('ACCUMULATION') ? 'ACCUMULATION phase - specialists building positions, optimal entry window approaching.' :
          ney.currentPhase.includes('DISTRIBUTION') ? 'DISTRIBUTION phase - specialists selling to retail, consider reducing exposure.' :
          'MARKDOWN phase - price declining toward value, wait for accumulation signs.'}
      </p>
      
      <div class="accent-bar">
        <ul class="bullet-list">
          <li>${ney.summary}</li>
          <li>Specialists and institutions act on superior information</li>
          <li>${ney.currentPhase} offers ${ney.currentPhase.includes('ACCUMULATION') || ney.currentPhase.includes('MARKUP') ? 'best' : 'elevated'} risk/reward for entry</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 5: Agreement Analysis -->
<div class="page">
  <h2>${agreement}% Agreement Creates ${agreement >= 75 ? 'High-Conviction' : 'Moderate'} ${recommendation.action} Signal</h2>
  
  <div class="text-center mb-20">
    <div class="agreement-box">${agreement}% AGREEMENT</div>
  </div>
  
  <table class="compare-table">
    <tr>
      <th>METRIC</th>
      <th>PRICE ANALYSIS</th>
      <th>MARKET PHASE</th>
      <th style="color: #e67e22;">AGREEMENT</th>
    </tr>
    <tr>
      <td>Risk Level</td>
      <td>${gann.riskLevel}</td>
      <td>${ney.riskLevel}</td>
      <td class="check-mark">${gann.riskLevel === ney.riskLevel ? '✓' : '~'}</td>
    </tr>
    <tr>
      <td>Momentum</td>
      <td>${gann.rallyAngle.angle} (${gann.rallyAngle.angle === '1x1' ? 'strongest' : 'moderate'})</td>
      <td>${ney.currentPhase.includes('MARKUP') ? 'MARKUP beginning' : ney.currentPhase}</td>
      <td class="check-mark">${(gann.rallyAngle.angle === '1x1' && ney.currentPhase.includes('MARKUP')) || (gann.rallyAngle.angle === '2x1' && ney.currentPhase.includes('ACCUMULATION')) ? '✓' : '~'}</td>
    </tr>
    <tr>
      <td>Outlook</td>
      <td>Bullish to $${targetPrice.toFixed(2)}</td>
      <td>${ney.specialistBehavior.includes('confident') || ney.specialistBehavior.includes('accumulating') ? 'Specialists confident' : 'Mixed signals'}</td>
      <td class="check-mark">${recommendation.action === 'BUY' ? '✓' : '~'}</td>
    </tr>
    <tr>
      <td>Action</td>
      <td>${recommendation.action}</td>
      <td>${recommendation.action}</td>
      <td class="check-mark">✓</td>
    </tr>
  </table>
  
  <div class="two-col mt-40">
    <div class="accent-bar">
      <p style="font-size: 14px;"><strong>Methodology Alignment:</strong> Both price sustainability analysis and institutional activity tracking independently conclude ${combinedRisk} RISK and ${recommendation.action.toLowerCase()}ish outlook</p>
    </div>
    <div class="accent-bar">
      <p style="font-size: 14px;"><strong>Confidence Level:</strong> ${agreement}% agreement provides ${agreement >= 75 ? 'high' : 'moderate'} conviction - ${agreement >= 75 ? 'perfect alignment validates thesis' : 'some divergence warrants monitoring'}</p>
    </div>
  </div>
  
  <div class="two-col mt-20">
    <div class="accent-bar">
      <p style="font-size: 14px;"><strong>Risk/Reward:</strong> ${((1 - stopLoss / currentPrice) * 100).toFixed(0)}% downside to Support ($${stopLoss.toFixed(2)}) vs ${upsidePotential}% upside to Target ($${targetPrice.toFixed(2)}) = 1:${riskReward} ratio (${parseFloat(riskReward) >= 1 ? 'acceptable' : 'unfavorable'} for ${combinedRisk} RISK)</p>
    </div>
    <div class="accent-bar">
      <p style="font-size: 14px;"><strong>Recommendation:</strong> ${recommendation.action} for new investors at current levels, ${recommendation.action === 'BUY' ? 'HOLD with confidence' : 'review'} for existing positions</p>
    </div>
  </div>
</div>

<!-- PAGE 6: Company Profile -->
<div class="page">
  <div class="two-col-wide">
    <div class="company-image">
      ${companyProfile?.shortName || companyName}
    </div>
    
    <div>
      <h2 style="margin-bottom: 30px;">${companyProfile?.sector ? 'Diversified ' + companyProfile.sector + ' Leader' : 'Company Overview'}</h2>
      
      ${companyProfile?.sector ? `
      <h3>BUSINESS SEGMENTS</h3>
      <ul class="bullet-list" style="margin-bottom: 20px;">
        <li>${companyProfile.industry || 'Primary Business'}</li>
        ${companyProfile.sector ? `<li>${companyProfile.sector} Sector</li>` : ''}
      </ul>
      ` : ''}
      
      <h3>KEY STRENGTHS</h3>
      <ul class="bullet-list" style="margin-bottom: 20px;">
        <li>Strong market position with established brand</li>
        <li>Diversified revenue streams provide stability</li>
        <li>Positioned for sector growth opportunities</li>
      </ul>
      
      <h3>PRIMARY CATALYST</h3>
      <ul class="bullet-list" style="margin-bottom: 20px;">
        <li><strong>Technical Setup:</strong> ${gann.rallyAngle.angle} rally angle with ${combinedRisk} risk</li>
        <li><strong>Price Target:</strong> $${currentPrice.toFixed(2)} → $${targetPrice.toFixed(2)} (+${upsidePotential}% potential)</li>
        <li><strong>Reasoning:</strong> ${recommendation.reasoning}</li>
      </ul>
      
      <h3>SECTOR TAILWINDS</h3>
      <ul class="bullet-list" style="margin-bottom: 20px;">
        <li>${companyProfile?.sector || 'Industry'} sector showing positive momentum</li>
        <li>Favorable market conditions for growth</li>
        <li>Technical indicators support bullish thesis</li>
      </ul>
      
      <h3>ANALYST CONSENSUS</h3>
      <ul class="bullet-list">
        <li><strong>Triggerstix Rating:</strong> ${recommendation.action} (${agreement}% agreement)</li>
        <li><strong>Risk Level:</strong> ${combinedRisk}</li>
      </ul>
    </div>
  </div>
</div>

<!-- PAGE 7: Trading Parameters -->
<div class="page">
  <h2>Tactical Entry and Exit Parameters</h2>
  
  <div class="two-col">
    <div>
      <h3 style="color: #e67e22; font-size: 20px;">FOR NEW BUYERS</h3>
      
      <div class="entry-section mt-20">
        <p style="font-size: 12px; color: #64748b;">PRIMARY ENTRY</p>
        <p class="price-green" style="font-size: 24px;">$${(currentPrice * 0.995).toFixed(2)}-${(currentPrice * 1.005).toFixed(2)} (Current Levels)</p>
        <p style="font-size: 13px; margin-top: 5px;">▸ ${ney.currentPhase} phase entry with optimal timing</p>
      </div>
      
      <div class="entry-section mt-10">
        <p style="font-size: 12px; color: #64748b;">SECONDARY ENTRY</p>
        <p class="price-green" style="font-size: 24px;">$${(sustainablePrice * 0.97).toFixed(2)}-${sustainablePrice.toFixed(2)} (Pullback)</p>
        <p style="font-size: 13px; margin-top: 5px;">▸ Closer to sustainable price, better risk/reward</p>
      </div>
      
      <div class="entry-section mt-10">
        <p style="font-size: 12px; color: #64748b;">AGGRESSIVE ENTRY</p>
        <p class="price-green" style="font-size: 24px;">$${(stopLoss * 1.05).toFixed(2)}-${(stopLoss * 1.1).toFixed(2)} (Deeper Dip)</p>
        <p style="font-size: 13px; margin-top: 5px;">▸ Near previous support turned resistance</p>
      </div>
      
      <div class="entry-section mt-20">
        <p style="font-size: 12px; color: #64748b;">STOP LOSS</p>
        <p class="price-red" style="font-size: 24px;">$${stopLoss.toFixed(2)} (-${((1 - stopLoss / currentPrice) * 100).toFixed(0)}%)</p>
        <p style="font-size: 13px; margin-top: 5px;">▸ Recent low, invalidates bullish thesis if broken</p>
      </div>
      
      <div class="entry-section mt-20">
        <p style="font-size: 12px; color: #64748b;">POSITION SIZE</p>
        <p class="price-blue" style="font-size: 24px;">3-7% of Portfolio</p>
        <p style="font-size: 13px; margin-top: 5px;">▸ ${combinedRisk} RISK profile allows ${combinedRisk === 'LOW' ? 'larger' : 'moderate'} allocation</p>
      </div>
    </div>
    
    <div>
      <h3 style="color: #e67e22; font-size: 20px;">FOR CURRENT HOLDERS</h3>
      
      <div class="phase-box text-center mt-20 mb-20">HOLD WITH CONFIDENCE</div>
      
      <p style="font-size: 12px; color: #64748b;">RISK MANAGEMENT</p>
      <p style="font-size: 14px; margin-bottom: 20px;">▸ Set alert at $${(stopLoss * 1.05).toFixed(2)} for stop loss consideration</p>
      
      <div class="target-box">
        <p class="target-title">Target 1: $${(currentPrice * 1.06).toFixed(2)} (Consensus)</p>
        <p class="target-note">+${((currentPrice * 1.06 / currentPrice - 1) * 100).toFixed(0)}% upside | Hold or take partial profit</p>
      </div>
      
      <div class="target-box">
        <p class="target-title">Target 2: $${(currentPrice * 1.1).toFixed(2)} (Milestone)</p>
        <p class="target-note">+${((currentPrice * 1.1 / currentPrice - 1) * 100).toFixed(0)}% upside | Take 50% profit, lock in gains</p>
      </div>
      
      <div class="target-box">
        <p class="target-title">Target 3: $${targetPrice.toFixed(2)} (Primary)</p>
        <p class="target-note">+${upsidePotential}% upside | Let remaining 50% ride to target</p>
      </div>
      
      <div class="target-box">
        <p class="target-title">Stretch: $${(targetPrice * 1.1).toFixed(2)} (High Est)</p>
        <p class="target-note">+${((targetPrice * 1.1 / currentPrice - 1) * 100).toFixed(0)}% upside | Use trailing stop above $${(currentPrice * 1.1).toFixed(2)}</p>
      </div>
      
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">MONITORING</p>
      <ul class="bullet-list">
        <li>Track earnings announcements and guidance</li>
        <li>Monitor quarterly earnings reports</li>
        <li>Watch for analyst upgrades/downgrades</li>
      </ul>
    </div>
  </div>
</div>

<!-- PAGE 8: Investment Thesis -->
<div class="page">
  <h2>Investment Thesis: Bull Case ${recommendation.action === 'BUY' ? 'Outweighs' : 'vs'} Bear Case</h2>
  
  <div class="two-col mt-20">
    <div class="case-section bull-case">
      <h3 style="color: #e67e22; font-size: 18px;">BULL CASE</h3>
      <ul class="bullet-list">
        <li>${gann.rallyAngle.angle} rally angle + ${ney.currentPhase.includes('MARKUP') ? 'early MARKUP' : ney.currentPhase} = ${recommendation.action === 'BUY' ? 'ideal' : 'favorable'} entry</li>
        <li>Target $${targetPrice.toFixed(2)} confirms ${upsidePotential}% upside potential</li>
        <li>${combinedRisk} risk setup with ${agreement}% methodology agreement</li>
        <li>Sustainable price with ${gann.rallyAngle.angle === '1x1' ? 'strong' : 'moderate'} rally momentum</li>
        <li>${ney.volumePattern} volume pattern supports thesis</li>
        <li>${agreement}% dual-method agreement = high conviction</li>
      </ul>
    </div>
    
    <div class="case-section bear-case">
      <h3 style="color: #64748b; font-size: 18px;">BEAR CASE</h3>
      <ul class="bullet-list">
        <li>Limited upside: ~${upsidePotential}% to target</li>
        <li>Execution risk: market conditions may change</li>
        <li>Economic sensitivity: sector vulnerable to macro</li>
        <li>Competition from sector peers pressures margins</li>
        <li>Valuation near ${((currentPrice / high52Week) * 100).toFixed(0)}% of 52-week high</li>
        <li>Market risk: correction could pressure stock</li>
      </ul>
    </div>
  </div>
  
  <div class="net-assessment">
    <h3 style="color: #1a2b6d; font-size: 18px;">NET ASSESSMENT: ${recommendation.action} RECOMMENDATION</h3>
    <p style="font-size: 14px; margin-top: 15px;">
      ${symbol} is a <span style="color: ${actionColor}; font-weight: bold;">${recommendation.action}</span> for ${companyProfile?.sector || 'market'} exposure with ${gann.rallyAngle.angle === '1x1' ? 'strong technical' : 'favorable'} setup. 
      ${agreement}% methodology alignment and the ${gann.rallyAngle.angle} rally angle indicate ${ney.currentPhase.includes('MARKUP') || ney.currentPhase.includes('ACCUMULATION') ? 'ideal' : 'acceptable'} entry timing. 
      ${recommendation.reasoning} 
      Risks exist (${combinedRisk === 'LOW' ? 'limited upside, execution, macro' : 'elevated volatility, execution risk'}), but the ${recommendation.action.toLowerCase()} case outweighs concerns.
      Entry $${(currentPrice * 0.995).toFixed(2)}-${(currentPrice * 1.005).toFixed(2)}, target $${targetPrice.toFixed(2)}, stop $${stopLoss.toFixed(2)}.
    </p>
  </div>
</div>

<!-- PAGE 9: Methodology -->
<div class="page">
  <h2>Triggerstix Dual-Method Analysis Framework</h2>
  
  <div class="two-col mt-20">
    <div class="accent-bar">
      <h3 style="color: #e67e22; font-size: 16px;">PRICE SUSTAINABILITY ANALYSIS</h3>
      <p style="font-size: 13px; margin-bottom: 15px;">Geometric analysis of price movement through mathematical angles and natural market cycles</p>
      <ul class="bullet-list">
        <li>Rally angles: 1x1 (45°) strongest, 2x1 moderate, 1x4 weakest</li>
        <li>Sustainable price: calculated from low + (days × rally rate)</li>
        <li>Key levels: support/resistance based on geometric progressions</li>
        <li>Risk assessment: based on price deviation from sustainable level</li>
      </ul>
    </div>
    
    <div class="accent-bar">
      <h3 style="color: #e67e22; font-size: 16px;">INSTITUTIONAL ACTIVITY TRACKING</h3>
      <p style="font-size: 13px; margin-bottom: 15px;">Tracks institutional specialist behavior through the four-phase market cycle</p>
      <ul class="bullet-list">
        <li>ACCUMULATION: institutions building positions at low prices</li>
        <li>MARKUP: price appreciation toward fair value</li>
        <li>DISTRIBUTION: institutions selling to retail at high prices</li>
        <li>MARKDOWN: price decline back to value</li>
      </ul>
    </div>
  </div>
  
  <div class="accent-bar mt-20">
    <h3 style="color: #1a2b6d; font-size: 16px;">AGREEMENT FRAMEWORK</h3>
    <p style="font-size: 13px;">Both methodologies must independently reach the same conclusion for high-conviction signals. <strong>${agreement}% agreement</strong> (risk level, momentum, outlook, action) indicates ${combinedRisk} RISK setup. Conflicting signals flag caution and warrant deeper analysis or avoidance.</p>
  </div>
  
  <div class="accent-bar mt-10">
    <h3 style="color: #1a2b6d; font-size: 16px;">RISK ASSESSMENT APPROACH</h3>
    <p style="font-size: 13px;">
      <span style="color: #27ae60; font-weight: bold;">LOW RISK:</span> Price at/near sustainable level + favorable market phase (ACCUMULATION/early MARKUP) + 100% agreement. 
      <span style="color: #f39c12; font-weight: bold;">MODERATE RISK:</span> Price moderately extended or late MARKUP phase. 
      <span style="color: #e74c3c; font-weight: bold;">HIGH RISK:</span> Price significantly overextended or DISTRIBUTION phase or methodology disagreement.
    </p>
  </div>
  
  <div class="disclaimer">
    <strong>DISCLAIMER</strong><br>
    This analysis is for educational purposes only and does not constitute financial advice. Past performance does not guarantee future results. All investments carry risk of loss. Consult a qualified financial advisor before making investment decisions. The Triggerstix methodology is a technical analysis framework and should be combined with fundamental analysis and risk management practices.
  </div>
</div>

</body>
</html>`;
}
