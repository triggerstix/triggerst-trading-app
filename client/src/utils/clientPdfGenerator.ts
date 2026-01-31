/**
 * Client-side PDF Generator using jsPDF
 * Generates professional Investment Analysis PDFs without html2canvas
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

// Colors
const NAVY = [26, 43, 109] as const;
const ORANGE = [230, 126, 34] as const;
const GREEN = [39, 174, 96] as const;
const RED = [231, 76, 60] as const;
const GRAY = [74, 85, 104] as const;
const LIGHT_BG = [232, 236, 241] as const;

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
  } = data;

  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const targetPrice = recommendation.target || (currentPrice * 1.15);
  const stopLoss = recommendation.stopLoss || (startPrice * 0.85);
  const sustainablePrice = gann.rallyAngle.sustainablePrice;
  const supportLevels = gann.squareOfNineLevels.filter(l => l.type === 'support').slice(0, 3);
  const resistanceLevels = gann.squareOfNineLevels.filter(l => l.type === 'resistance').slice(0, 3);
  const upside = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(0);
  const downside = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(0);
  const riskReward = ((targetPrice - currentPrice) / (currentPrice - stopLoss)).toFixed(2);
  
  const displayName = companyName || companyProfile?.longName || symbol;
  const sector = companyProfile?.sector || 'N/A';
  const industry = companyProfile?.industry || 'N/A';
  const businessSummary = companyProfile?.longBusinessSummary || 'Company information not available.';

  // Create PDF in landscape mode
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Helper functions
  const drawBackground = () => {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Draw grid pattern
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.3);
    for (let x = 0; x < pageWidth; x += 20) {
      doc.line(x, 0, x, pageHeight);
    }
    for (let y = 0; y < pageHeight; y += 20) {
      doc.line(0, y, pageWidth, y);
    }
  };

  const drawCorners = () => {
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(3);
    const cornerSize = 25;
    // Top-left
    doc.line(margin - 10, margin - 10, margin - 10 + cornerSize, margin - 10);
    doc.line(margin - 10, margin - 10, margin - 10, margin - 10 + cornerSize);
    // Top-right
    doc.line(pageWidth - margin + 10 - cornerSize, margin - 10, pageWidth - margin + 10, margin - 10);
    doc.line(pageWidth - margin + 10, margin - 10, pageWidth - margin + 10, margin - 10 + cornerSize);
    // Bottom-left
    doc.line(margin - 10, pageHeight - margin + 10, margin - 10 + cornerSize, pageHeight - margin + 10);
    doc.line(margin - 10, pageHeight - margin + 10 - cornerSize, margin - 10, pageHeight - margin + 10);
    // Bottom-right
    doc.line(pageWidth - margin + 10 - cornerSize, pageHeight - margin + 10, pageWidth - margin + 10, pageHeight - margin + 10);
    doc.line(pageWidth - margin + 10, pageHeight - margin + 10 - cornerSize, pageWidth - margin + 10, pageHeight - margin + 10);
  };

  const drawFooter = (text: string) => {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(text, pageWidth / 2, pageHeight - 20, { align: 'center' });
  };

  const getActionColor = (action: string): readonly [number, number, number] => {
    if (action === 'BUY') return GREEN;
    if (action === 'SELL') return RED;
    return ORANGE;
  };

  // PAGE 1: Title Page
  drawBackground();
  drawCorners();
  
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('TRIGGERSTIX DUAL-METHOD ANALYSIS', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(72);
  doc.setFont('helvetica', 'bold');
  doc.text(symbol, pageWidth / 2, 200, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.text(displayName, pageWidth / 2, 250, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(...GRAY);
  doc.text(dateStr, pageWidth / 2, 290, { align: 'center' });
  
  // Price box
  doc.setFillColor(...NAVY);
  doc.roundedRect(pageWidth / 2 - 80, 330, 160, 60, 5, 5, 'F');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${currentPrice.toFixed(2)}`, pageWidth / 2, 370, { align: 'center' });
  
  drawFooter('Investment Analysis Report');

  // PAGE 2: Executive Summary
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, 70, { align: 'center' });
  
  // Action badge
  const actionColor = getActionColor(recommendation.action);
  doc.setFillColor(actionColor[0], actionColor[1], actionColor[2]);
  doc.roundedRect(pageWidth / 2 - 70, 100, 140, 50, 5, 5, 'F');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(recommendation.action, pageWidth / 2, 135, { align: 'center' });
  
  // Key metrics row
  const metricsY = 190;
  const metricSpacing = 180;
  const metrics = [
    { label: 'Risk Level', value: combinedRisk, color: combinedRisk === 'LOW' ? GREEN : combinedRisk === 'HIGH' ? RED : ORANGE },
    { label: 'Agreement', value: `${agreement}%`, color: agreement >= 80 ? GREEN : ORANGE },
    { label: 'Upside', value: `+${upside}%`, color: GREEN },
    { label: 'Downside', value: `-${downside}%`, color: RED },
    { label: 'Risk/Reward', value: `${riskReward}:1`, color: parseFloat(riskReward) >= 2 ? GREEN : ORANGE },
  ];
  
  metrics.forEach((m, i) => {
    const x = margin + 80 + i * metricSpacing;
    doc.setFontSize(11);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text(m.label, x, metricsY, { align: 'center' });
    doc.setFontSize(22);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, x, metricsY + 25, { align: 'center' });
  });
  
  // Price targets section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('PRICE TARGETS', margin, 280);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 285, margin + 120, 285);
  
  const targetsY = 310;
  const targetData = [
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}`, color: NAVY },
    { label: 'Target Price', value: `$${targetPrice.toFixed(2)}`, color: GREEN },
    { label: 'Stop Loss', value: `$${stopLoss.toFixed(2)}`, color: RED },
    { label: 'Sustainable', value: `$${sustainablePrice.toFixed(2)}`, color: NAVY },
  ];
  
  targetData.forEach((t, i) => {
    doc.setFontSize(12);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text(t.label, margin + 20, targetsY + i * 30);
    doc.setFontSize(14);
    doc.setTextColor(t.color[0], t.color[1], t.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(t.value, margin + 200, targetsY + i * 30, { align: 'right' });
  });
  
  // Reasoning section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('INVESTMENT REASONING', pageWidth / 2 + 40, 280);
  doc.setDrawColor(...ORANGE);
  doc.line(pageWidth / 2 + 40, 285, pageWidth / 2 + 200, 285);
  
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  const reasoningLines = doc.splitTextToSize(recommendation.reasoning, 320);
  doc.text(reasoningLines, pageWidth / 2 + 40, 310);
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 3: Price Analysis
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE ANALYSIS', pageWidth / 2, 70, { align: 'center' });
  
  // Left column - Rally Angle
  doc.setFontSize(16);
  doc.text('RALLY ANGLE ANALYSIS', margin, 120);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 125, margin + 180, 125);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  
  const rallyData = [
    { label: 'Angle Type', value: '1x4 Rally Angle' },
    { label: 'Sustainable Price', value: `$${sustainablePrice.toFixed(2)}` },
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { label: 'Deviation', value: `${((currentPrice - sustainablePrice) / sustainablePrice * 100).toFixed(1)}%` },
    { label: 'Risk Level', value: gann.rallyAngle.riskLevel },
  ];
  
  rallyData.forEach((r, i) => {
    doc.setTextColor(...GRAY);
    doc.text(r.label, margin + 20, 160 + i * 35);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(r.value, margin + 280, 160 + i * 35, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });
  
  // Right column - Square of Nine
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('SQUARE OF NINE LEVELS', pageWidth / 2 + 40, 120);
  doc.setDrawColor(...ORANGE);
  doc.line(pageWidth / 2 + 40, 125, pageWidth / 2 + 220, 125);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Support levels
  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.text('Support Levels', pageWidth / 2 + 60, 160);
  doc.setFont('helvetica', 'normal');
  supportLevels.forEach((level, i) => {
    doc.setTextColor(...GRAY);
    doc.text(`S${i + 1}:`, pageWidth / 2 + 60, 185 + i * 25);
    doc.setTextColor(...GREEN);
    doc.text(`$${level.level.toFixed(2)}`, pageWidth / 2 + 100, 185 + i * 25);
  });
  
  // Resistance levels
  doc.setTextColor(...RED);
  doc.setFont('helvetica', 'bold');
  doc.text('Resistance Levels', pageWidth / 2 + 220, 160);
  doc.setFont('helvetica', 'normal');
  resistanceLevels.forEach((level, i) => {
    doc.setTextColor(...GRAY);
    doc.text(`R${i + 1}:`, pageWidth / 2 + 220, 185 + i * 25);
    doc.setTextColor(...RED);
    doc.text(`$${level.level.toFixed(2)}`, pageWidth / 2 + 260, 185 + i * 25);
  });
  
  // Price range info
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('52-WEEK RANGE', margin, 380);
  doc.setDrawColor(...ORANGE);
  doc.line(margin, 385, margin + 130, 385);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text(`Low: $${low52Week.toFixed(2)}`, margin + 20, 415);
  doc.text(`High: $${high52Week.toFixed(2)}`, margin + 20, 440);
  doc.text(`Current: $${currentPrice.toFixed(2)}`, margin + 20, 465);
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 4: Market Phase Analysis
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET PHASE ANALYSIS', pageWidth / 2, 70, { align: 'center' });
  
  // Current phase
  doc.setFontSize(16);
  doc.text('CURRENT PHASE', margin, 120);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 125, margin + 130, 125);
  
  const phaseColor = ney.phase === 'ACCUMULATION' || ney.phase === 'MARKUP' ? GREEN : RED;
  doc.setFillColor(phaseColor[0], phaseColor[1], phaseColor[2]);
  doc.roundedRect(margin, 150, 200, 50, 5, 5, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(ney.phase, margin + 100, 182, { align: 'center' });
  
  // Phase details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  
  const phaseDetails = [
    { label: 'Signal', value: ney.signal },
    { label: 'Confidence', value: `${ney.confidence}%` },
    { label: 'Risk Level', value: combinedRisk },
  ];
  
  phaseDetails.forEach((p, i) => {
    doc.setTextColor(...GRAY);
    doc.text(p.label, margin + 20, 240 + i * 30);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(p.value, margin + 180, 240 + i * 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });
  
  // Phase description
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('PHASE DESCRIPTION', pageWidth / 2 + 40, 120);
  doc.setDrawColor(...ORANGE);
  doc.line(pageWidth / 2 + 40, 125, pageWidth / 2 + 190, 125);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  const phaseDesc = getPhaseDescription(ney.phase);
  const descLines = doc.splitTextToSize(phaseDesc, 340);
  doc.text(descLines, pageWidth / 2 + 40, 160);
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 5: Agreement Analysis
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('AGREEMENT ANALYSIS', pageWidth / 2, 70, { align: 'center' });
  
  // Big agreement number
  doc.setFontSize(72);
  const agreementColor = agreement >= 80 ? GREEN : ORANGE;
  doc.setTextColor(agreementColor[0], agreementColor[1], agreementColor[2]);
  doc.text(`${agreement}%`, pageWidth / 2, 180, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('METHOD AGREEMENT', pageWidth / 2, 210, { align: 'center' });
  
  // Comparison table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('METHOD COMPARISON', margin, 270);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 275, margin + 160, 275);
  
  // Table headers
  const tableY = 310;
  doc.setFillColor(...NAVY);
  doc.rect(margin, tableY, pageWidth - 2 * margin, 30, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Metric', margin + 20, tableY + 20);
  doc.text('Price Analysis', margin + 250, tableY + 20);
  doc.text('Market Phase', margin + 450, tableY + 20);
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  const tableData = [
    { metric: 'Signal', price: gann.rallyAngle.signal, market: ney.signal },
    { metric: 'Risk Level', price: gann.rallyAngle.riskLevel, market: combinedRisk },
    { metric: 'Confidence', price: 'High', market: `${ney.confidence}%` },
  ];
  
  tableData.forEach((row, i) => {
    const rowY = tableY + 50 + i * 35;
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, rowY - 12, pageWidth - 2 * margin, 35, 'F');
    }
    doc.setTextColor(...GRAY);
    doc.text(row.metric, margin + 20, rowY + 10);
    doc.setTextColor(...NAVY);
    doc.text(row.price, margin + 250, rowY + 10);
    doc.text(row.market, margin + 450, rowY + 10);
  });
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 6: Company Profile
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY PROFILE', pageWidth / 2, 70, { align: 'center' });
  
  // Company info
  doc.setFontSize(20);
  doc.text(displayName, pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sector} | ${industry}`, pageWidth / 2, 145, { align: 'center' });
  
  // Business summary
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSINESS DESCRIPTION', margin, 190);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 195, margin + 180, 195);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  const summaryLines = doc.splitTextToSize(businessSummary.substring(0, 1200), pageWidth - 2 * margin - 40);
  doc.text(summaryLines, margin + 20, 225);
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 7: Trading Parameters
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADING PARAMETERS', pageWidth / 2, 70, { align: 'center' });
  
  // Entry/Exit boxes
  const boxWidth = 200;
  const boxHeight = 120;
  const boxY = 130;
  
  // Entry box
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin + 60, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ENTRY ZONE', margin + 60 + boxWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${(currentPrice * 0.98).toFixed(2)}`, margin + 60 + boxWidth / 2, boxY + 70, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`to $${(currentPrice * 1.02).toFixed(2)}`, margin + 60 + boxWidth / 2, boxY + 95, { align: 'center' });
  
  // Target box
  doc.setFillColor(...ORANGE);
  doc.roundedRect(pageWidth / 2 - boxWidth / 2, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setFontSize(14);
  doc.text('TARGET PRICE', pageWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${targetPrice.toFixed(2)}`, pageWidth / 2, boxY + 70, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`+${upside}% upside`, pageWidth / 2, boxY + 95, { align: 'center' });
  
  // Stop loss box
  doc.setFillColor(...RED);
  doc.roundedRect(pageWidth - margin - 60 - boxWidth, boxY, boxWidth, boxHeight, 5, 5, 'F');
  doc.setFontSize(14);
  doc.text('STOP LOSS', pageWidth - margin - 60 - boxWidth / 2, boxY + 30, { align: 'center' });
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${stopLoss.toFixed(2)}`, pageWidth - margin - 60 - boxWidth / 2, boxY + 70, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`-${downside}% risk`, pageWidth - margin - 60 - boxWidth / 2, boxY + 95, { align: 'center' });
  
  // Position sizing
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('POSITION SIZING GUIDE', margin, 300);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 305, margin + 190, 305);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  const sizingText = `Risk/Reward Ratio: ${riskReward}:1\n\nRecommended position size should be based on your total portfolio value and risk tolerance. Never risk more than 1-2% of your portfolio on a single trade.`;
  const sizingLines = doc.splitTextToSize(sizingText, 300);
  doc.text(sizingLines, margin + 20, 340);
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 8: Investment Thesis
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTMENT THESIS', pageWidth / 2, 70, { align: 'center' });
  
  // Bull case
  const caseWidth = (pageWidth - 3 * margin) / 2;
  const caseHeight = 350;
  const caseY = 110;
  
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin, caseY, caseWidth, caseHeight, 5, 5, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('BULL CASE', margin + caseWidth / 2, caseY + 35, { align: 'center' });
  
  doc.setFontSize(10);
  const bullPoints = [
    `• Price below sustainable level ($${sustainablePrice.toFixed(2)})`,
    `• ${agreement}% method agreement supports bullish bias`,
    `• Target price of $${targetPrice.toFixed(2)} (+${upside}%)`,
    `• Favorable risk/reward ratio of ${riskReward}:1`,
    `• ${ney.phase} phase indicates potential upside`,
  ];
  bullPoints.forEach((point, i) => {
    doc.text(point, margin + 15, caseY + 70 + i * 30);
  });
  
  // Bear case
  doc.setFillColor(...RED);
  doc.roundedRect(margin + caseWidth + margin, caseY, caseWidth, caseHeight, 5, 5, 'F');
  doc.setFontSize(18);
  doc.text('BEAR CASE', margin + caseWidth + margin + caseWidth / 2, caseY + 35, { align: 'center' });
  
  doc.setFontSize(10);
  const bearPoints = [
    '• Market conditions may deteriorate',
    '• Sector rotation could impact performance',
    `• Stop loss at $${stopLoss.toFixed(2)} (-${downside}%)`,
    '• External macro factors remain uncertain',
    '• Technical resistance levels may hold',
  ];
  bearPoints.forEach((point, i) => {
    doc.text(point, margin + caseWidth + margin + 15, caseY + 70 + i * 30);
  });
  
  drawFooter(`${symbol} Investment Analysis | ${dateStr}`);

  // PAGE 9: Methodology & Disclaimer
  doc.addPage();
  drawBackground();
  drawCorners();
  
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('METHODOLOGY', pageWidth / 2, 70, { align: 'center' });
  
  // Methodology sections
  doc.setFontSize(14);
  doc.text('TRIGGERSTIX DUAL-METHOD ANALYSIS FRAMEWORK', margin, 120);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(margin, 125, margin + 350, 125);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  
  const methodText = 'This analysis employs a proprietary dual-method approach combining Price Sustainability Analysis and Institutional Activity Tracking to generate investment signals.';
  doc.text(doc.splitTextToSize(methodText, pageWidth - 2 * margin), margin, 150);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('PRICE SUSTAINABILITY ANALYSIS', margin, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  const priceText = 'Evaluates price movements against mathematically derived sustainable levels. The 1x4 Rally Angle calculates the maximum sustainable rate of price appreciation based on historical patterns.';
  doc.text(doc.splitTextToSize(priceText, pageWidth - 2 * margin), margin, 220);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('INSTITUTIONAL ACTIVITY TRACKING', margin, 280);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  const instText = 'Monitors market phase transitions by analyzing price-volume relationships and accumulation/distribution patterns. This method identifies periods of institutional buying and selling.';
  doc.text(doc.splitTextToSize(instText, pageWidth - 2 * margin), margin, 300);
  
  // Disclaimer
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, 360, pageWidth - 2 * margin, 150, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('IMPORTANT DISCLAIMER', margin + 15, 380);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const disclaimer = 'This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions. The authors and publishers of this report assume no liability for any losses incurred as a result of using this information.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 30);
  doc.text(disclaimerLines, margin + 15, 400);
  
  drawFooter(`Generated by Triggerstix Analysis Platform | ${dateStr}`);

  // Return as blob
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
