/**
 * Client-side PDF Generator
 * Uses html2pdf.js to render HTML/CSS to PDF in the browser
 * Produces high-quality PDFs matching the HON Investment Analysis style
 */

import html2pdf from 'html2pdf.js';

interface AnalysisData {
  symbol: string;
  companyName?: string;
  currentPrice: number;
  high52Week?: number;
  low52Week?: number;
  gann: {
    rallyAngle: {
      sustainablePrice: number;
      riskLevel: string;
      signal: string;
    };
    squareOfNineLevels: Array<{ level: number; type: string; description: string }>;
  };
  ney: {
    phase: string;
    signal: string;
    confidence: number;
  };
  recommendation: {
    action: string;
    target?: number;
    stopLoss?: number;
    reasoning: string;
  };
  agreement: number;
  combinedRisk: string;
  companyProfile?: {
    longName?: string;
    shortName?: string;
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
  } | null;
  peakPrice?: number;
  startPrice?: number;
  tradingDays?: number;
}

export async function generateClientPdf(data: AnalysisData): Promise<Blob> {
  const {
    symbol,
    companyName,
    currentPrice,
    high52Week = currentPrice,
    low52Week = currentPrice,
    gann,
    ney,
    recommendation,
    agreement,
    combinedRisk,
    companyProfile,
    peakPrice = currentPrice,
    startPrice = currentPrice,
    tradingDays = 252,
  } = data;

  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const targetPrice = recommendation.target || (currentPrice * 1.15);
  const stopLoss = recommendation.stopLoss || (startPrice * 0.85);
  const sustainablePrice = gann.rallyAngle.sustainablePrice;
  const supportLevels = gann.squareOfNineLevels.filter(l => l.type === 'support').slice(0, 2);
  const resistanceLevels = gann.squareOfNineLevels.filter(l => l.type === 'resistance').slice(0, 2);
  const upside = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(0);
  const downside = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(0);
  const riskReward = ((targetPrice - currentPrice) / (currentPrice - stopLoss)).toFixed(2);
  
  const actionColor = recommendation.action === 'BUY' ? '#27ae60' : 
                      recommendation.action === 'SELL' ? '#e74c3c' : '#f39c12';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 11in 8.5in landscape; margin: 0; }
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
    
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute;
      width: 30px;
      height: 30px;
      border-color: #1a2b6d;
      border-style: solid;
      border-width: 0;
    }
    .corner-tl { top: 0.3in; left: 0.3in; border-top-width: 3px; border-left-width: 3px; }
    .corner-tr { top: 0.3in; right: 0.3in; border-top-width: 3px; border-right-width: 3px; }
    .corner-bl { bottom: 0.3in; left: 0.3in; border-bottom-width: 3px; border-left-width: 3px; }
    .corner-br { bottom: 0.3in; right: 0.3in; border-bottom-width: 3px; border-right-width: 3px; }
    
    .page-title {
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      color: #1a2b6d;
      margin-bottom: 30px;
    }
    
    .subtitle {
      font-size: 14px;
      text-align: center;
      color: #1a2b6d;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    
    .big-symbol {
      font-size: 72px;
      font-weight: bold;
      text-align: center;
      color: #1a2b6d;
      margin: 40px 0 20px;
    }
    
    .company-name {
      font-size: 24px;
      text-align: center;
      color: #1a2b6d;
      margin-bottom: 20px;
    }
    
    .date {
      font-size: 16px;
      text-align: center;
      color: #4a5568;
      margin-bottom: 40px;
    }
    
    .price-box {
      width: 200px;
      margin: 0 auto;
      background: #1a2b6d;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .price-box .price {
      font-size: 36px;
      font-weight: bold;
      color: white;
    }
    
    .action-badge {
      display: inline-block;
      padding: 15px 50px;
      border-radius: 8px;
      font-size: 32px;
      font-weight: bold;
      color: white;
      margin: 20px auto;
    }
    
    .metrics-row {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    
    .metric {
      text-align: center;
    }
    
    .metric-label {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1a2b6d;
    }
    
    .metric-value.green { color: #27ae60; }
    .metric-value.orange { color: #e67e22; }
    .metric-value.red { color: #e74c3c; }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1a2b6d;
      margin: 25px 0 15px;
      border-bottom: 2px solid #e67e22;
      padding-bottom: 5px;
    }
    
    .two-column {
      display: flex;
      gap: 40px;
    }
    
    .column {
      flex: 1;
    }
    
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(26, 43, 109, 0.1);
    }
    
    .data-label {
      color: #4a5568;
    }
    
    .data-value {
      font-weight: bold;
      color: #1a2b6d;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .table th {
      background: #1a2b6d;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 14px;
    }
    
    .table td {
      padding: 12px;
      border-bottom: 1px solid rgba(26, 43, 109, 0.1);
    }
    
    .table tr:nth-child(even) {
      background: rgba(26, 43, 109, 0.03);
    }
    
    .box-row {
      display: flex;
      gap: 20px;
      margin: 30px 0;
    }
    
    .info-box {
      flex: 1;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .info-box.green { background: #27ae60; color: white; }
    .info-box.orange { background: #e67e22; color: white; }
    .info-box.red { background: #e74c3c; color: white; }
    
    .info-box .box-title {
      font-size: 14px;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    
    .info-box .box-value {
      font-size: 28px;
      font-weight: bold;
    }
    
    .info-box .box-subtitle {
      font-size: 12px;
      margin-top: 5px;
      opacity: 0.8;
    }
    
    .case-box {
      flex: 1;
      padding: 20px;
      border-radius: 8px;
      color: white;
    }
    
    .case-box.bull { background: #27ae60; }
    .case-box.bear { background: #e74c3c; }
    
    .case-box h3 {
      font-size: 18px;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .case-box ul {
      list-style: none;
      padding: 0;
    }
    
    .case-box li {
      padding: 8px 0;
      font-size: 13px;
    }
    
    .case-box li:before {
      content: "• ";
    }
    
    .agreement-big {
      font-size: 64px;
      font-weight: bold;
      color: #27ae60;
      text-align: center;
      margin: 30px 0 10px;
    }
    
    .agreement-label {
      font-size: 18px;
      text-align: center;
      color: #1a2b6d;
    }
    
    .description {
      font-size: 12px;
      line-height: 1.6;
      color: #4a5568;
      text-align: justify;
    }
    
    .footer {
      position: absolute;
      bottom: 0.4in;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #4a5568;
    }
    
    .disclaimer {
      font-size: 9px;
      line-height: 1.5;
      color: #666;
      text-align: justify;
      margin-top: 20px;
      padding: 15px;
      background: rgba(26, 43, 109, 0.05);
      border-radius: 5px;
    }
  </style>
</head>
<body>

<!-- PAGE 1: Title -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="subtitle">TRIGGERSTIX DUAL-METHOD ANALYSIS</div>
  <div class="big-symbol">${symbol}</div>
  <div class="company-name">${companyName || companyProfile?.longName || symbol}</div>
  <div class="date">${dateStr}</div>
  <div class="price-box">
    <div class="price">$${currentPrice.toFixed(2)}</div>
  </div>
  <div class="footer">Investment Analysis Report</div>
</div>

<!-- PAGE 2: Executive Summary -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">EXECUTIVE SUMMARY</div>
  
  <div style="text-align: center;">
    <div class="action-badge" style="background: ${actionColor};">${recommendation.action}</div>
  </div>
  
  <div class="metrics-row">
    <div class="metric">
      <div class="metric-label">Current Price</div>
      <div class="metric-value">$${currentPrice.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Risk Level</div>
      <div class="metric-value ${combinedRisk === 'LOW' ? 'green' : combinedRisk === 'HIGH' || combinedRisk === 'EXTREME' ? 'red' : 'orange'}">${combinedRisk}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Agreement</div>
      <div class="metric-value green">${agreement}%</div>
    </div>
  </div>
  
  <div class="section-title">PRICE TARGETS</div>
  <div class="two-column">
    <div class="column">
      <div class="data-row">
        <span class="data-label">Target Price</span>
        <span class="data-value" style="color: #27ae60;">$${targetPrice.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Stop Loss</span>
        <span class="data-value" style="color: #e74c3c;">$${stopLoss.toFixed(2)}</span>
      </div>
    </div>
    <div class="column">
      <div class="data-row">
        <span class="data-label">Sustainable Price</span>
        <span class="data-value">$${sustainablePrice.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Risk/Reward</span>
        <span class="data-value">${riskReward}:1</span>
      </div>
    </div>
  </div>
  
  <div class="section-title">ANALYSIS REASONING</div>
  <p class="description">${recommendation.reasoning}</p>
</div>

<!-- PAGE 3: Price Sustainability Analysis -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">PRICE SUSTAINABILITY ANALYSIS</div>
  
  <div class="two-column">
    <div class="column">
      <div class="section-title">1x4 RALLY ANGLE</div>
      <div class="data-row">
        <span class="data-label">Start Price</span>
        <span class="data-value">$${startPrice.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Peak Price</span>
        <span class="data-value">$${peakPrice.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Trading Days</span>
        <span class="data-value">${tradingDays}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Sustainable Price</span>
        <span class="data-value" style="color: #e67e22;">$${sustainablePrice.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Signal</span>
        <span class="data-value" style="color: ${gann.rallyAngle.signal === 'BUY' ? '#27ae60' : '#e74c3c'};">${gann.rallyAngle.signal}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Risk Level</span>
        <span class="data-value">${gann.rallyAngle.riskLevel}</span>
      </div>
    </div>
    <div class="column">
      <div class="section-title">PRICE LEVELS</div>
      <table class="table">
        <tr><th>Type</th><th>Level</th></tr>
        ${supportLevels.map((l, i) => `<tr><td>Support ${i + 1}</td><td style="color: #27ae60;">$${l.level.toFixed(2)}</td></tr>`).join('')}
        ${resistanceLevels.map((l, i) => `<tr><td>Resistance ${i + 1}</td><td style="color: #e74c3c;">$${l.level.toFixed(2)}</td></tr>`).join('')}
      </table>
    </div>
  </div>
</div>

<!-- PAGE 4: Market Phase Analysis -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">INSTITUTIONAL ACTIVITY TRACKING</div>
  
  <div class="section-title">MARKET PHASE ANALYSIS</div>
  <div class="two-column">
    <div class="column">
      <div class="data-row">
        <span class="data-label">Current Phase</span>
        <span class="data-value" style="color: #e67e22;">${ney.phase}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Signal</span>
        <span class="data-value" style="color: ${ney.signal === 'BUY' ? '#27ae60' : ney.signal === 'SELL' ? '#e74c3c' : '#f39c12'};">${ney.signal}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Confidence</span>
        <span class="data-value">${ney.confidence}%</span>
      </div>
    </div>
    <div class="column">
      <div class="section-title">PHASE INTERPRETATION</div>
      <p class="description">${getPhaseDescription(ney.phase)}</p>
    </div>
  </div>
</div>

<!-- PAGE 5: Agreement Analysis -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">DUAL-METHOD AGREEMENT</div>
  
  <table class="table">
    <tr>
      <th>METHOD</th>
      <th>SIGNAL</th>
      <th>RISK</th>
      <th>CONFIDENCE</th>
    </tr>
    <tr>
      <td>Price Analysis</td>
      <td style="color: ${gann.rallyAngle.signal === 'BUY' ? '#27ae60' : '#e74c3c'};">${gann.rallyAngle.signal}</td>
      <td>${gann.rallyAngle.riskLevel}</td>
      <td>—</td>
    </tr>
    <tr>
      <td>Market Phase</td>
      <td style="color: ${ney.signal === 'BUY' ? '#27ae60' : ney.signal === 'SELL' ? '#e74c3c' : '#f39c12'};">${ney.signal}</td>
      <td>—</td>
      <td>${ney.confidence}%</td>
    </tr>
  </table>
  
  <div class="agreement-big">${agreement}%</div>
  <div class="agreement-label">METHOD AGREEMENT</div>
</div>

<!-- PAGE 6: Company Profile -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">COMPANY PROFILE</div>
  
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold; color: #1a2b6d;">${companyName || companyProfile?.longName || symbol}</div>
  </div>
  
  <div class="two-column">
    <div class="column">
      <div class="data-row">
        <span class="data-label">Sector</span>
        <span class="data-value">${companyProfile?.sector || 'N/A'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Industry</span>
        <span class="data-value">${companyProfile?.industry || 'N/A'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">52-Week High</span>
        <span class="data-value">$${high52Week.toFixed(2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">52-Week Low</span>
        <span class="data-value">$${low52Week.toFixed(2)}</span>
      </div>
    </div>
    <div class="column">
      <div class="section-title">BUSINESS DESCRIPTION</div>
      <p class="description">${companyProfile?.longBusinessSummary?.substring(0, 800) || 'Company description not available.'}${(companyProfile?.longBusinessSummary?.length || 0) > 800 ? '...' : ''}</p>
    </div>
  </div>
</div>

<!-- PAGE 7: Trading Parameters -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">TRADING PARAMETERS</div>
  
  <div class="box-row">
    <div class="info-box green">
      <div class="box-title">ENTRY ZONE</div>
      <div class="box-value">$${(sustainablePrice * 0.95).toFixed(2)}</div>
      <div class="box-subtitle">to $${sustainablePrice.toFixed(2)}</div>
    </div>
    <div class="info-box orange">
      <div class="box-title">TARGET PRICE</div>
      <div class="box-value">$${targetPrice.toFixed(2)}</div>
      <div class="box-subtitle">+${upside}% upside</div>
    </div>
    <div class="info-box red">
      <div class="box-title">STOP LOSS</div>
      <div class="box-value">$${stopLoss.toFixed(2)}</div>
      <div class="box-subtitle">-${downside}% risk</div>
    </div>
  </div>
  
  <div class="section-title">RISK/REWARD ANALYSIS</div>
  <div class="two-column">
    <div class="column">
      <div class="data-row">
        <span class="data-label">Risk/Reward Ratio</span>
        <span class="data-value">${riskReward}:1</span>
      </div>
      <div class="data-row">
        <span class="data-label">Potential Upside</span>
        <span class="data-value" style="color: #27ae60;">+${upside}%</span>
      </div>
    </div>
    <div class="column">
      <div class="data-row">
        <span class="data-label">Potential Downside</span>
        <span class="data-value" style="color: #e74c3c;">-${downside}%</span>
      </div>
      <div class="data-row">
        <span class="data-label">Current vs Sustainable</span>
        <span class="data-value">${currentPrice < sustainablePrice ? 'Below' : 'Above'}</span>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 8: Investment Thesis -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">INVESTMENT THESIS</div>
  
  <div class="box-row">
    <div class="case-box bull">
      <h3>BULL CASE</h3>
      <ul>
        <li>Price below sustainable level ($${sustainablePrice.toFixed(2)})</li>
        <li>${agreement}% method agreement on ${recommendation.action}</li>
        <li>Target upside of ${upside}%</li>
        <li>Favorable risk/reward ratio of ${riskReward}:1</li>
      </ul>
    </div>
    <div class="case-box bear">
      <h3>BEAR CASE</h3>
      <ul>
        <li>Market volatility risk</li>
        <li>Sector-specific headwinds possible</li>
        <li>Stop loss at $${stopLoss.toFixed(2)} (-${downside}%)</li>
        <li>External macro factors</li>
      </ul>
    </div>
  </div>
  
  <div class="section-title">CONCLUSION</div>
  <p class="description">Based on dual-method analysis, ${symbol} presents a ${recommendation.action} opportunity with ${combinedRisk} risk. Both price sustainability and institutional activity tracking methods show ${agreement}% agreement. The current price of $${currentPrice.toFixed(2)} is ${currentPrice < sustainablePrice ? 'below' : 'above'} the sustainable level of $${sustainablePrice.toFixed(2)}, suggesting ${currentPrice < sustainablePrice ? 'potential upside' : 'elevated risk'}.</p>
</div>

<!-- PAGE 9: Methodology & Disclaimer -->
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  
  <div class="page-title">METHODOLOGY & DISCLAIMER</div>
  
  <div class="section-title">TRIGGERSTIX DUAL-METHOD ANALYSIS FRAMEWORK</div>
  <p class="description">This analysis employs a proprietary dual-method approach combining Price Sustainability Analysis and Institutional Activity Tracking to generate investment signals.</p>
  
  <div class="section-title">PRICE SUSTAINABILITY ANALYSIS</div>
  <p class="description">Evaluates price movements against mathematically derived sustainable levels. The 1x4 Rally Angle calculates the maximum sustainable rate of price appreciation based on historical patterns. Prices above sustainable levels indicate elevated risk; prices below suggest potential opportunity.</p>
  
  <div class="section-title">INSTITUTIONAL ACTIVITY TRACKING</div>
  <p class="description">Monitors market phase transitions by analyzing price-volume relationships and accumulation/distribution patterns. This method identifies periods of institutional buying (accumulation) and selling (distribution) to anticipate major price movements.</p>
  
  <div class="section-title">AGREEMENT SCORING</div>
  <p class="description">When both methods generate concordant signals, confidence in the recommendation increases. 100% agreement indicates both methods support the same directional bias.</p>
  
  <div class="disclaimer">
    <strong>IMPORTANT DISCLAIMER:</strong> This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions. The authors and publishers of this report assume no liability for any losses incurred as a result of using this information.
  </div>
  
  <div class="footer">Generated by Triggerstix Analysis Platform | ${dateStr}</div>
</div>

</body>
</html>
`;

  // Create a temporary container to render the HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const opt = {
      margin: 0,
      filename: `${symbol}InvestmentAnalysis.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'in' as const, 
        format: 'letter', 
        orientation: 'landscape' as const 
      },
      pagebreak: { mode: 'css', before: '.page', avoid: 'img' }
    };

    const pdf = await html2pdf().set(opt).from(container).outputPdf('blob');
    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}

function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    'ACCUMULATION': 'Institutional investors are quietly building positions. This phase typically occurs after a prolonged decline when smart money begins acquiring shares at depressed prices. Volume patterns show absorption of selling pressure.',
    'MARKUP': 'Price is advancing with institutional support. This phase follows accumulation and is characterized by rising prices on increasing volume. The trend is bullish with higher highs and higher lows.',
    'DISTRIBUTION': 'Institutional investors are reducing positions. This phase occurs after a significant advance when smart money begins selling to retail investors. Volume patterns show supply entering the market.',
    'MARKDOWN': 'Price is declining as institutions exit positions. This phase follows distribution and is characterized by falling prices, often on increasing volume. The trend is bearish with lower highs and lower lows.',
  };
  return descriptions[phase] || 'Market phase analysis evaluates the current stage of the price cycle based on institutional activity patterns.';
}
