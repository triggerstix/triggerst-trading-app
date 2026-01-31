/**
 * Client-side PDF Generator
 * Generates Investment Analysis PDF entirely in the browser using jsPDF
 * No server-side puppeteer required - works in production
 */

import jsPDF from 'jspdf';

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
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = 792; // 11in * 72
  const pageHeight = 612; // 8.5in * 72
  const margin = 40;
  
  const navy = '#1a2b6d';
  const orange = '#e67e22';
  const lightGray = '#e8ecf1';
  const darkGray = '#4a5568';
  
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

  // Helper functions
  const drawBackground = () => {
    doc.setFillColor(232, 236, 241);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Grid pattern
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.3);
    for (let x = 0; x < pageWidth; x += 20) {
      doc.line(x, 0, x, pageHeight);
    }
    for (let y = 0; y < pageHeight; y += 20) {
      doc.line(0, y, pageWidth, y);
    }
  };

  const drawCornerBrackets = () => {
    doc.setDrawColor(26, 43, 109);
    doc.setLineWidth(2);
    // Top-left
    doc.line(margin, margin, margin + 30, margin);
    doc.line(margin, margin, margin, margin + 30);
    // Top-right
    doc.line(pageWidth - margin - 30, margin, pageWidth - margin, margin);
    doc.line(pageWidth - margin, margin, pageWidth - margin, margin + 30);
    // Bottom-left
    doc.line(margin, pageHeight - margin, margin + 30, pageHeight - margin);
    doc.line(margin, pageHeight - margin - 30, margin, pageHeight - margin);
    // Bottom-right
    doc.line(pageWidth - margin - 30, pageHeight - margin, pageWidth - margin, pageHeight - margin);
    doc.line(pageWidth - margin, pageHeight - margin - 30, pageWidth - margin, pageHeight - margin);
  };

  // PAGE 1: Title Page
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 43, 109);
  doc.text('TRIGGERSTIX DUAL-METHOD ANALYSIS', pageWidth / 2, 100, { align: 'center' });
  
  doc.setFontSize(72);
  doc.text(symbol, pageWidth / 2, 220, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(24);
  doc.text(companyName || companyProfile?.longName || symbol, pageWidth / 2, 280, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(dateStr, pageWidth / 2, 340, { align: 'center' });
  
  // Price box
  doc.setFillColor(26, 43, 109);
  doc.roundedRect(pageWidth / 2 - 100, 380, 200, 80, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text(`$${currentPrice.toFixed(2)}`, pageWidth / 2, 435, { align: 'center' });
  
  doc.setTextColor(26, 43, 109);
  doc.setFontSize(12);
  doc.text('Investment Analysis Report', pageWidth / 2, pageHeight - 80, { align: 'center' });

  // PAGE 2: Executive Summary
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, 80, { align: 'center' });
  
  // Recommendation box
  const recColor = recommendation.action === 'BUY' ? '#27ae60' : 
                   recommendation.action === 'SELL' ? '#e74c3c' : '#f39c12';
  doc.setFillColor(recColor);
  doc.roundedRect(pageWidth / 2 - 80, 110, 160, 60, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.text(recommendation.action, pageWidth / 2, 150, { align: 'center' });
  
  // Key metrics
  doc.setTextColor(26, 43, 109);
  doc.setFontSize(14);
  const metricsY = 200;
  const col1 = margin + 50;
  const col2 = pageWidth / 2;
  const col3 = pageWidth - margin - 150;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Current Price', col1, metricsY);
  doc.text('Risk Level', col2, metricsY);
  doc.text('Agreement', col3, metricsY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(`$${currentPrice.toFixed(2)}`, col1, metricsY + 30);
  doc.text(combinedRisk, col2, metricsY + 30);
  doc.setTextColor(39, 174, 96);
  doc.text(`${agreement}%`, col3, metricsY + 30);
  
  // Price targets
  doc.setTextColor(26, 43, 109);
  doc.setFontSize(18);
  doc.text('PRICE TARGETS', margin + 50, 300);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Target: $${targetPrice.toFixed(2)}`, margin + 50, 330);
  doc.text(`Stop Loss: $${stopLoss.toFixed(2)}`, margin + 50, 355);
  doc.text(`Sustainable: $${sustainablePrice.toFixed(2)}`, margin + 50, 380);
  
  // Reasoning
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ANALYSIS REASONING', margin + 50, 430);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const reasoningLines = doc.splitTextToSize(recommendation.reasoning, pageWidth - 2 * margin - 100);
  doc.text(reasoningLines, margin + 50, 460);

  // PAGE 3: Price Analysis
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('PRICE SUSTAINABILITY ANALYSIS', pageWidth / 2, 80, { align: 'center' });
  
  // Rally Angle section
  doc.setFontSize(18);
  doc.text('1x4 RALLY ANGLE ANALYSIS', margin + 50, 140);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`Start Price: $${startPrice.toFixed(2)}`, margin + 50, 180);
  doc.text(`Peak Price: $${peakPrice.toFixed(2)}`, margin + 50, 205);
  doc.text(`Trading Days: ${tradingDays}`, margin + 50, 230);
  doc.text(`Sustainable Price: $${sustainablePrice.toFixed(2)}`, margin + 50, 255);
  doc.text(`Signal: ${gann.rallyAngle.signal}`, margin + 50, 280);
  
  // Support/Resistance levels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PRICE LEVELS', pageWidth / 2 + 50, 140);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  let levelY = 180;
  doc.text('Support Levels:', pageWidth / 2 + 50, levelY);
  supportLevels.forEach((level, i) => {
    levelY += 25;
    doc.text(`  S${i + 1}: $${level.level.toFixed(2)}`, pageWidth / 2 + 50, levelY);
  });
  
  levelY += 40;
  doc.text('Resistance Levels:', pageWidth / 2 + 50, levelY);
  resistanceLevels.forEach((level, i) => {
    levelY += 25;
    doc.text(`  R${i + 1}: $${level.level.toFixed(2)}`, pageWidth / 2 + 50, levelY);
  });

  // PAGE 4: Market Phase Analysis
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('INSTITUTIONAL ACTIVITY TRACKING', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('MARKET PHASE ANALYSIS', margin + 50, 140);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`Current Phase: ${ney.phase}`, margin + 50, 180);
  doc.text(`Signal: ${ney.signal}`, margin + 50, 205);
  doc.text(`Confidence: ${ney.confidence}%`, margin + 50, 230);
  
  // Phase descriptions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PHASE INTERPRETATION', margin + 50, 290);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const phaseDesc = getPhaseDescription(ney.phase);
  const phaseLines = doc.splitTextToSize(phaseDesc, pageWidth - 2 * margin - 100);
  doc.text(phaseLines, margin + 50, 320);

  // PAGE 5: Agreement Analysis
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('DUAL-METHOD AGREEMENT', pageWidth / 2, 80, { align: 'center' });
  
  // Agreement table
  const tableY = 140;
  doc.setFillColor(26, 43, 109);
  doc.rect(margin + 50, tableY, pageWidth - 2 * margin - 100, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('METHOD', margin + 70, tableY + 25);
  doc.text('SIGNAL', pageWidth / 2 - 50, tableY + 25);
  doc.text('RISK', pageWidth / 2 + 100, tableY + 25);
  doc.text('CONFIDENCE', pageWidth - margin - 150, tableY + 25);
  
  // Price Analysis row
  doc.setTextColor(26, 43, 109);
  doc.setFillColor(245, 247, 250);
  doc.rect(margin + 50, tableY + 40, pageWidth - 2 * margin - 100, 35, 'F');
  doc.text('Price Analysis', margin + 70, tableY + 62);
  doc.text(gann.rallyAngle.signal, pageWidth / 2 - 50, tableY + 62);
  doc.text(gann.rallyAngle.riskLevel, pageWidth / 2 + 100, tableY + 62);
  doc.text('N/A', pageWidth - margin - 150, tableY + 62);
  
  // Market Phase row
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 50, tableY + 75, pageWidth - 2 * margin - 100, 35, 'F');
  doc.text('Market Phase', margin + 70, tableY + 97);
  doc.text(ney.signal, pageWidth / 2 - 50, tableY + 97);
  doc.text('N/A', pageWidth / 2 + 100, tableY + 97);
  doc.text(`${ney.confidence}%`, pageWidth - margin - 150, tableY + 97);
  
  // Agreement indicator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(39, 174, 96);
  doc.text(`${agreement}%`, pageWidth / 2, 320, { align: 'center' });
  doc.setFontSize(18);
  doc.setTextColor(26, 43, 109);
  doc.text('METHOD AGREEMENT', pageWidth / 2, 350, { align: 'center' });

  // PAGE 6: Company Profile
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('COMPANY PROFILE', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(20);
  doc.text(companyName || companyProfile?.longName || symbol, pageWidth / 2, 130, { align: 'center' });
  
  if (companyProfile?.sector) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(`Sector: ${companyProfile.sector}`, margin + 50, 170);
  }
  if (companyProfile?.industry) {
    doc.text(`Industry: ${companyProfile.industry}`, margin + 50, 195);
  }
  
  if (companyProfile?.longBusinessSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BUSINESS DESCRIPTION', margin + 50, 240);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(companyProfile.longBusinessSummary, pageWidth - 2 * margin - 100);
    doc.text(summaryLines.slice(0, 15), margin + 50, 270);
  }

  // PAGE 7: Trading Parameters
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('TRADING PARAMETERS', pageWidth / 2, 80, { align: 'center' });
  
  // Entry/Exit boxes
  const boxWidth = 200;
  const boxHeight = 120;
  const boxY = 150;
  
  // Entry box
  doc.setFillColor(39, 174, 96);
  doc.roundedRect(margin + 80, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('ENTRY ZONE', margin + 80 + boxWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.text(`$${(sustainablePrice * 0.95).toFixed(2)}`, margin + 80 + boxWidth / 2, boxY + 70, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`to $${sustainablePrice.toFixed(2)}`, margin + 80 + boxWidth / 2, boxY + 95, { align: 'center' });
  
  // Target box
  doc.setFillColor(230, 126, 34);
  doc.roundedRect(pageWidth / 2 - boxWidth / 2, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setFontSize(14);
  doc.text('TARGET PRICE', pageWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.text(`$${targetPrice.toFixed(2)}`, pageWidth / 2, boxY + 70, { align: 'center' });
  const upside = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(0);
  doc.setFontSize(12);
  doc.text(`+${upside}% upside`, pageWidth / 2, boxY + 95, { align: 'center' });
  
  // Stop loss box
  doc.setFillColor(231, 76, 60);
  doc.roundedRect(pageWidth - margin - 80 - boxWidth, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setFontSize(14);
  doc.text('STOP LOSS', pageWidth - margin - 80 - boxWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.text(`$${stopLoss.toFixed(2)}`, pageWidth - margin - 80 - boxWidth / 2, boxY + 70, { align: 'center' });
  const downside = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(0);
  doc.setFontSize(12);
  doc.text(`-${downside}% risk`, pageWidth - margin - 80 - boxWidth / 2, boxY + 95, { align: 'center' });
  
  // Risk/Reward
  doc.setTextColor(26, 43, 109);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RISK/REWARD ANALYSIS', margin + 50, 320);
  
  const riskReward = ((targetPrice - currentPrice) / (currentPrice - stopLoss)).toFixed(2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`Risk/Reward Ratio: ${riskReward}:1`, margin + 50, 350);
  doc.text(`52-Week High: $${high52Week.toFixed(2)}`, margin + 50, 375);
  doc.text(`52-Week Low: $${low52Week.toFixed(2)}`, margin + 50, 400);

  // PAGE 8: Investment Thesis
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('INVESTMENT THESIS', pageWidth / 2, 80, { align: 'center' });
  
  // Bull case
  doc.setFillColor(39, 174, 96);
  doc.roundedRect(margin + 50, 120, (pageWidth - 2 * margin - 120) / 2, 200, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('BULL CASE', margin + 50 + (pageWidth - 2 * margin - 120) / 4, 150, { align: 'center' });
  
  doc.setFontSize(11);
  const bullPoints = [
    `Price below sustainable level ($${sustainablePrice.toFixed(2)})`,
    `${agreement}% method agreement on ${recommendation.action}`,
    `Target upside of ${upside}%`,
    `Favorable risk/reward ratio`
  ];
  bullPoints.forEach((point, i) => {
    doc.text(`• ${point}`, margin + 70, 180 + i * 25);
  });
  
  // Bear case
  doc.setFillColor(231, 76, 60);
  doc.roundedRect(pageWidth / 2 + 10, 120, (pageWidth - 2 * margin - 120) / 2, 200, 5, 5, 'F');
  doc.setFontSize(18);
  doc.text('BEAR CASE', pageWidth / 2 + 10 + (pageWidth - 2 * margin - 120) / 4, 150, { align: 'center' });
  
  doc.setFontSize(11);
  const bearPoints = [
    'Market volatility risk',
    'Sector-specific headwinds possible',
    `Stop loss at $${stopLoss.toFixed(2)} (-${downside}%)`,
    'External macro factors'
  ];
  bearPoints.forEach((point, i) => {
    doc.text(`• ${point}`, pageWidth / 2 + 30, 180 + i * 25);
  });
  
  // Conclusion
  doc.setTextColor(26, 43, 109);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CONCLUSION', margin + 50, 360);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const conclusion = `Based on dual-method analysis, ${symbol} presents a ${recommendation.action} opportunity with ${combinedRisk} risk. Both price sustainability and institutional activity tracking methods show ${agreement}% agreement. The current price of $${currentPrice.toFixed(2)} is ${currentPrice < sustainablePrice ? 'below' : 'above'} the sustainable level of $${sustainablePrice.toFixed(2)}.`;
  const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - 2 * margin - 100);
  doc.text(conclusionLines, margin + 50, 390);

  // PAGE 9: Methodology & Disclaimer
  doc.addPage();
  drawBackground();
  drawCornerBrackets();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 43, 109);
  doc.text('METHODOLOGY & DISCLAIMER', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('TRIGGERSTIX DUAL-METHOD ANALYSIS FRAMEWORK', margin + 50, 130);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const methodology = `This analysis employs a proprietary dual-method approach combining Price Sustainability Analysis and Institutional Activity Tracking to generate investment signals.

PRICE SUSTAINABILITY ANALYSIS
Evaluates price movements against mathematically derived sustainable levels. The 1x4 Rally Angle calculates the maximum sustainable rate of price appreciation based on historical patterns. Prices above sustainable levels indicate elevated risk; prices below suggest potential opportunity.

INSTITUTIONAL ACTIVITY TRACKING
Monitors market phase transitions by analyzing price-volume relationships and accumulation/distribution patterns. This method identifies periods of institutional buying (accumulation) and selling (distribution) to anticipate major price movements.

AGREEMENT SCORING
When both methods generate concordant signals, confidence in the recommendation increases. 100% agreement indicates both methods support the same directional bias.`;

  const methodLines = doc.splitTextToSize(methodology, pageWidth - 2 * margin - 100);
  doc.text(methodLines, margin + 50, 160);
  
  // Disclaimer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('IMPORTANT DISCLAIMER', margin + 50, 420);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const disclaimer = `This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions. The authors and publishers of this report assume no liability for any losses incurred as a result of using this information.`;
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 100);
  doc.text(disclaimerLines, margin + 50, 445);
  
  doc.setFontSize(10);
  doc.text(`Generated by Triggerstix Analysis Platform | ${dateStr}`, pageWidth / 2, pageHeight - 50, { align: 'center' });

  return doc.output('blob');
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
