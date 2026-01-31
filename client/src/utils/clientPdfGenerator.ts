/**
 * Client-side PDF Generator using jsPDF
 * Generates professional 5-page Investment Analysis PDFs
 * Color scheme: White, Black, Shades of Grey, Blue
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
  chartImageBase64?: string;
  logoBase64?: string;
}

// Color palette: White, Black, Shades of Grey, Blue
const WHITE = [255, 255, 255] as const;
const BLACK = [0, 0, 0] as const;
const DARK_GREY = [51, 51, 51] as const;
const MED_GREY = [102, 102, 102] as const;
const LIGHT_GREY = [153, 153, 153] as const;
const LIGHTER_GREY = [204, 204, 204] as const;
const LIGHTEST_GREY = [240, 240, 240] as const;
const PRIMARY_BLUE = [0, 102, 204] as const;
const DARK_BLUE = [0, 51, 102] as const;
const LIGHT_BLUE = [230, 242, 255] as const;
const GREEN = [0, 153, 76] as const;
const RED = [204, 0, 0] as const;

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
    chartImageBase64,
    logoBase64,
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
  const upside = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
  const downside = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(1);
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
    doc.setFillColor(...WHITE);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const drawHeader = (title: string) => {
    // Blue header bar
    doc.setFillColor(...PRIMARY_BLUE);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 33);
    
    // Symbol on right
    doc.setFontSize(14);
    doc.text(`${symbol} | ${dateStr}`, pageWidth - margin, 33, { align: 'right' });
  };

  const drawFooter = (pageNum: number) => {
    doc.setFillColor(...LIGHTEST_GREY);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(...MED_GREY);
    doc.text('Triggerstix Investment Analysis', margin, pageHeight - 12);
    doc.text(`Page ${pageNum} of 5`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  };

  const getActionColor = (action: string): readonly [number, number, number] => {
    if (action === 'BUY') return GREEN;
    if (action === 'SELL') return RED;
    return MED_GREY;
  };

  // ========== PAGE 1: Title + Executive Summary ==========
  drawBackground();
  
  // Large title section
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pageWidth, 200, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(...LIGHTER_GREY);
  doc.text('TRIGGERSTIX INVESTMENT ANALYSIS', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(64);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(symbol, pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.text(displayName, pageWidth / 2, 155, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(...LIGHTER_GREY);
  doc.text(`${sector} | ${industry}`, pageWidth / 2, 180, { align: 'center' });
  
  // Executive Summary section
  let y = 230;
  
  doc.setFontSize(16);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', margin, y);
  
  // Underline
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.setLineWidth(2);
  doc.line(margin, y + 5, margin + 170, y + 5);
  
  y += 40;
  
  // Action badge and price in row
  const actionColor = getActionColor(recommendation.action);
  doc.setFillColor(actionColor[0], actionColor[1], actionColor[2]);
  doc.roundedRect(margin, y - 20, 100, 45, 5, 5, 'F');
  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(recommendation.action, margin + 50, y + 8, { align: 'center' });
  
  // Current price
  doc.setFontSize(36);
  doc.setTextColor(...BLACK);
  doc.text(`$${currentPrice.toFixed(2)}`, margin + 140, y + 8);
  
  // Key metrics row
  y += 70;
  const metricsStartX = margin;
  const metricWidth = 140;
  
  const metrics = [
    { label: 'Risk Level', value: combinedRisk, color: combinedRisk === 'LOW' ? GREEN : combinedRisk === 'HIGH' ? RED : MED_GREY },
    { label: 'Agreement', value: `${agreement}%`, color: agreement >= 80 ? GREEN : MED_GREY },
    { label: 'Target', value: `$${targetPrice.toFixed(2)}`, color: GREEN },
    { label: 'Stop Loss', value: `$${stopLoss.toFixed(2)}`, color: RED },
    { label: 'Risk/Reward', value: `${riskReward}:1`, color: parseFloat(riskReward) >= 2 ? GREEN : MED_GREY },
  ];
  
  metrics.forEach((m, i) => {
    const x = metricsStartX + i * metricWidth;
    
    // Box
    doc.setFillColor(...LIGHTEST_GREY);
    doc.roundedRect(x, y, metricWidth - 10, 60, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, x + (metricWidth - 10) / 2, y + 18, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, x + (metricWidth - 10) / 2, y + 45, { align: 'center' });
  });
  
  // Reasoning
  y += 90;
  doc.setFontSize(12);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Reasoning:', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MED_GREY);
  const reasoningLines = doc.splitTextToSize(recommendation.reasoning, pageWidth - 2 * margin);
  doc.text(reasoningLines, margin, y + 20);
  
  drawFooter(1);

  // ========== PAGE 2: Analysis + Chart ==========
  doc.addPage();
  drawBackground();
  drawHeader('TECHNICAL ANALYSIS');
  
  y = 80;
  const colWidth = (pageWidth - 3 * margin) / 2;
  
  // Left column: Price Analysis
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE SUSTAINABILITY', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.setLineWidth(2);
  doc.line(margin, y + 5, margin + 150, y + 5);
  
  y += 30;
  const priceData = [
    { label: 'Sustainable Price', value: `$${sustainablePrice.toFixed(2)}` },
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { label: 'Deviation', value: `${((currentPrice - sustainablePrice) / sustainablePrice * 100).toFixed(1)}%` },
    { label: 'Risk Level', value: gann.rallyAngle.riskLevel },
    { label: '52-Week High', value: `$${high52Week.toFixed(2)}` },
    { label: '52-Week Low', value: `$${low52Week.toFixed(2)}` },
  ];
  
  priceData.forEach((item, i) => {
    doc.setFontSize(11);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin, y + i * 25);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, margin + colWidth - 20, y + i * 25, { align: 'right' });
  });
  
  // Market Phase section
  y += 180;
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET PHASE', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(margin, y + 5, margin + 110, y + 5);
  
  y += 30;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(margin, y, colWidth, 80, 5, 5, 'F');
  
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(ney.phase, margin + 15, y + 35);
  
  doc.setFontSize(10);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  const phaseDesc = getPhaseDescription(ney.phase).substring(0, 150) + '...';
  const phaseLines = doc.splitTextToSize(phaseDesc, colWidth - 30);
  doc.text(phaseLines, margin + 15, y + 55);
  
  // Right column: Chart image or placeholder
  const chartX = margin + colWidth + margin;
  const chartY = 80;
  const chartWidth = colWidth;
  const chartHeight = 320;
  
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE CHART', chartX, chartY);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(chartX, chartY + 5, chartX + 100, chartY + 5);
  
  // Chart area
  doc.setFillColor(...LIGHTEST_GREY);
  doc.setDrawColor(...LIGHTER_GREY);
  doc.setLineWidth(1);
  doc.roundedRect(chartX, chartY + 20, chartWidth, chartHeight, 5, 5, 'FD');
  
  if (chartImageBase64) {
    try {
      doc.addImage(chartImageBase64, 'PNG', chartX + 5, chartY + 25, chartWidth - 10, chartHeight - 10);
    } catch {
      // Fallback text if image fails
      doc.setFontSize(12);
      doc.setTextColor(...MED_GREY);
      doc.text('Chart visualization', chartX + chartWidth / 2, chartY + chartHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(12);
    doc.setTextColor(...MED_GREY);
    doc.text(`${symbol} Price Chart`, chartX + chartWidth / 2, chartY + chartHeight / 2, { align: 'center' });
    doc.setFontSize(10);
    doc.text('(View interactive chart in app)', chartX + chartWidth / 2, chartY + chartHeight / 2 + 20, { align: 'center' });
  }
  
  drawFooter(2);

  // ========== PAGE 3: Agreement Analysis + Trading Parameters ==========
  doc.addPage();
  drawBackground();
  drawHeader('TRADING PARAMETERS');
  
  y = 80;
  
  // Agreement Analysis
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('METHOD AGREEMENT', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(margin, y + 5, margin + 150, y + 5);
  
  y += 30;
  
  // Agreement table
  const tableWidth = pageWidth - 2 * margin;
  const col1 = margin;
  const col2 = margin + tableWidth * 0.4;
  const col3 = margin + tableWidth * 0.7;
  
  // Header row
  doc.setFillColor(...DARK_BLUE);
  doc.rect(margin, y, tableWidth, 30, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Method', col1 + 10, y + 20);
  doc.text('Signal', col2, y + 20);
  doc.text('Confidence', col3, y + 20);
  
  // Data rows
  y += 30;
  const methods = [
    { name: 'Price Sustainability', signal: gann.rallyAngle.riskLevel === 'LOW' ? 'BUY' : 'HOLD', confidence: `${100 - (gann.rallyAngle.riskLevel === 'LOW' ? 20 : 40)}%` },
    { name: 'Market Phase', signal: ney.signal, confidence: `${ney.confidence}%` },
  ];
  
  methods.forEach((m, i) => {
    const rowY = y + i * 35;
    const rowColor = i % 2 === 0 ? LIGHTEST_GREY : WHITE;
    doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
    doc.rect(margin, rowY, tableWidth, 35, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(m.name, col1 + 10, rowY + 22);
    
    const signalColor = m.signal === 'BUY' ? GREEN : m.signal === 'SELL' ? RED : MED_GREY;
    doc.setTextColor(signalColor[0], signalColor[1], signalColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(m.signal, col2, rowY + 22);
    
    doc.setTextColor(...DARK_GREY);
    doc.text(m.confidence, col3, rowY + 22);
  });
  
  // Overall agreement
  y += 100;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(margin, y, 200, 50, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Agreement:', margin + 15, y + 22);
  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(`${agreement}%`, margin + 150, y + 35);
  
  // Trading Parameters section
  y += 90;
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRY & EXIT LEVELS', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(margin, y + 5, margin + 150, y + 5);
  
  y += 30;
  const boxW = 180;
  const boxH = 90;
  const boxGap = 30;
  
  // Entry Zone
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin, y, boxW, boxH, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('ENTRY ZONE', margin + boxW / 2, y + 25, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${(currentPrice * 0.98).toFixed(2)} - $${(currentPrice * 1.02).toFixed(2)}`, margin + boxW / 2, y + 55, { align: 'center' });
  
  // Target
  doc.setFillColor(...PRIMARY_BLUE);
  doc.roundedRect(margin + boxW + boxGap, y, boxW, boxH, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('TARGET PRICE', margin + boxW + boxGap + boxW / 2, y + 25, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${targetPrice.toFixed(2)}`, margin + boxW + boxGap + boxW / 2, y + 50, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`+${upside}% upside`, margin + boxW + boxGap + boxW / 2, y + 70, { align: 'center' });
  
  // Stop Loss
  doc.setFillColor(...RED);
  doc.roundedRect(margin + 2 * (boxW + boxGap), y, boxW, boxH, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('STOP LOSS', margin + 2 * (boxW + boxGap) + boxW / 2, y + 25, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${stopLoss.toFixed(2)}`, margin + 2 * (boxW + boxGap) + boxW / 2, y + 50, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`-${downside}% risk`, margin + 2 * (boxW + boxGap) + boxW / 2, y + 70, { align: 'center' });
  
  // Key Levels
  y += 120;
  doc.setFontSize(12);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Support Levels:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const supportText = supportLevels.map(l => `$${l.level.toFixed(2)}`).join('  |  ') || 'N/A';
  doc.text(supportText, margin + 110, y);
  
  y += 25;
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Resistance Levels:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const resistanceText = resistanceLevels.map(l => `$${l.level.toFixed(2)}`).join('  |  ') || 'N/A';
  doc.text(resistanceText, margin + 125, y);
  
  drawFooter(3);

  // ========== PAGE 4: Company Profile ==========
  doc.addPage();
  drawBackground();
  drawHeader('COMPANY PROFILE');
  
  y = 80;
  
  // Logo and company name section
  const logoSize = 80;
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y, logoSize, logoSize);
    } catch {
      // Fallback: draw placeholder
      doc.setFillColor(...LIGHTEST_GREY);
      doc.roundedRect(margin, y, logoSize, logoSize, 5, 5, 'F');
      doc.setFontSize(24);
      doc.setTextColor(...LIGHT_GREY);
      doc.text(symbol.substring(0, 2), margin + logoSize / 2, y + logoSize / 2 + 8, { align: 'center' });
    }
  } else {
    // Draw placeholder
    doc.setFillColor(...LIGHTEST_GREY);
    doc.roundedRect(margin, y, logoSize, logoSize, 5, 5, 'F');
    doc.setFontSize(24);
    doc.setTextColor(...LIGHT_GREY);
    doc.text(symbol.substring(0, 2), margin + logoSize / 2, y + logoSize / 2 + 8, { align: 'center' });
  }
  
  // Company name and info next to logo
  const infoX = margin + logoSize + 20;
  doc.setFontSize(28);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(displayName, infoX, y + 30);
  
  doc.setFontSize(14);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sector} | ${industry}`, infoX, y + 55);
  
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.text(`Ticker: ${symbol}`, infoX, y + 80);
  
  // Business Summary
  y += 120;
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('ABOUT THE COMPANY', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(margin, y + 5, margin + 160, y + 5);
  
  y += 25;
  doc.setFontSize(11);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(businessSummary, pageWidth - 2 * margin);
  doc.text(summaryLines.slice(0, 8), margin, y);
  
  // Company History & Direction
  y += 130;
  doc.setFontSize(14);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY DIRECTION', margin, y);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(margin, y + 5, margin + 160, y + 5);
  
  y += 25;
  doc.setFontSize(11);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  
  // Generate direction text based on analysis
  const directionText = generateCompanyDirection(displayName, sector, industry, recommendation.action, ney.phase);
  const directionLines = doc.splitTextToSize(directionText, pageWidth - 2 * margin);
  doc.text(directionLines.slice(0, 6), margin, y);
  
  // Key Stats
  y += 100;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 60, 5, 5, 'F');
  
  const statWidth = (pageWidth - 2 * margin) / 4;
  const stats = [
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { label: '52-Week High', value: `$${high52Week.toFixed(2)}` },
    { label: '52-Week Low', value: `$${low52Week.toFixed(2)}` },
    { label: 'Market Phase', value: ney.phase },
  ];
  
  stats.forEach((stat, i) => {
    const x = margin + i * statWidth + statWidth / 2;
    doc.setFontSize(10);
    doc.setTextColor(...MED_GREY);
    doc.text(stat.label, x, y + 22, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(...DARK_BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x, y + 42, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  
  drawFooter(4);

  // ========== PAGE 5: Investment Thesis + Disclaimer ==========
  doc.addPage();
  drawBackground();
  drawHeader('INVESTMENT THESIS');
  
  y = 80;
  
  // Bull vs Bear case
  const caseWidth = (pageWidth - 3 * margin) / 2;
  const caseHeight = 200;
  
  // Bull Case
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin, y, caseWidth, caseHeight, 5, 5, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('BULL CASE', margin + caseWidth / 2, y + 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const bullPoints = [
    `• Price at $${currentPrice.toFixed(2)} vs sustainable $${sustainablePrice.toFixed(2)}`,
    `• ${agreement}% method agreement supports position`,
    `• Target price: $${targetPrice.toFixed(2)} (+${upside}%)`,
    `• Risk/reward ratio: ${riskReward}:1`,
    `• ${ney.phase} phase indicates opportunity`,
  ];
  bullPoints.forEach((point, i) => {
    doc.text(point, margin + 15, y + 60 + i * 25);
  });
  
  // Bear Case
  doc.setFillColor(...RED);
  doc.roundedRect(margin + caseWidth + margin, y, caseWidth, caseHeight, 5, 5, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('BEAR CASE', margin + caseWidth + margin + caseWidth / 2, y + 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const bearPoints = [
    '• Market conditions may deteriorate',
    '• Sector rotation could impact performance',
    `• Stop loss at $${stopLoss.toFixed(2)} (-${downside}%)`,
    '• External macro factors uncertain',
    '• Technical resistance may hold',
  ];
  bearPoints.forEach((point, i) => {
    doc.text(point, margin + caseWidth + margin + 15, y + 60 + i * 25);
  });
  
  // Disclaimer
  y += caseHeight + 40;
  doc.setFillColor(...LIGHTEST_GREY);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 150, 5, 5, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT DISCLAIMER', margin + 15, y + 25);
  
  doc.setFontSize(9);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions. The authors and publishers of this report assume no liability for any losses incurred as a result of using this information.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 30);
  doc.text(disclaimerLines, margin + 15, y + 45);
  
  drawFooter(5);

  // Return as blob
  return doc.output('blob');
}

function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    'ACCUMULATION': 'Institutional investors are quietly building positions. This phase typically occurs after a prolonged decline when smart money begins acquiring shares at depressed prices.',
    'MARKUP': 'Price is advancing with institutional support. This phase follows accumulation and is characterized by rising prices on increasing volume.',
    'DISTRIBUTION': 'Institutional investors are reducing positions. This phase occurs after a significant advance when smart money begins selling to retail investors.',
    'MARKDOWN': 'Price is declining as institutions exit positions. This phase follows distribution and is characterized by falling prices.',
  };
  return descriptions[phase] || 'Market phase analysis evaluates the current stage of the price cycle based on institutional activity patterns.';
}

function generateCompanyDirection(name: string, sector: string, industry: string, action: string, phase: string): string {
  const outlook = action === 'BUY' ? 'positive' : action === 'SELL' ? 'cautious' : 'neutral';
  const phaseContext = phase === 'ACCUMULATION' ? 'showing signs of institutional accumulation' :
                       phase === 'MARKUP' ? 'in an upward trend with strong momentum' :
                       phase === 'DISTRIBUTION' ? 'experiencing distribution patterns' :
                       'in a consolidation phase';
  
  return `${name} operates in the ${industry} sector within ${sector}. Based on current analysis, the company is ${phaseContext}. The technical outlook appears ${outlook} based on price sustainability metrics and institutional activity patterns. Investors should monitor key support and resistance levels while considering broader market conditions and sector-specific factors that may impact performance.`;
}
