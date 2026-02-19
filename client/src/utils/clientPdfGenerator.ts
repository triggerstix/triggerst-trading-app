/**
 * Client-side PDF Generator using jsPDF
 * Generates polished 2-page Investment Analysis PDF
 * Color scheme: White, Black, Shades of Grey, Blue accents
 * Font: Helvetica (closest to Arial in jsPDF)
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

// Color palette
const WHITE = [255, 255, 255] as const;
const BLACK = [30, 30, 30] as const;
const DARK_GREY = [60, 60, 60] as const;
const MED_GREY = [110, 110, 110] as const;
const LIGHT_GREY = [160, 160, 160] as const;
const LIGHTER_GREY = [210, 210, 210] as const;
const LIGHTEST_GREY = [243, 243, 243] as const;
const PRIMARY_BLUE = [0, 90, 180] as const;
const DARK_BLUE = [15, 35, 65] as const;
const ACCENT_BLUE = [40, 120, 210] as const;
const GREEN = [16, 140, 70] as const;
const RED = [190, 30, 30] as const;
const AMBER = [180, 120, 0] as const;

type RGB = readonly [number, number, number];

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
    startPrice = currentPrice,
    chartImageBase64,
    logoBase64,
  } = data;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const targetPrice = recommendation.target || (currentPrice * 1.15);
  const stopLoss = recommendation.stopLoss || (startPrice * 0.85);
  const sustainablePrice = gann.rallyAngle.sustainablePrice;
  const supportLevels = gann.squareOfNineLevels.filter(l => l.type === 'support').slice(0, 3);
  const resistanceLevels = gann.squareOfNineLevels.filter(l => l.type === 'resistance').slice(0, 3);
  const upside = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
  const downside = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(1);
  const riskReward = ((targetPrice - currentPrice) / (currentPrice - stopLoss)).toFixed(2);

  const displayName = companyName || companyProfile?.longName || companyProfile?.shortName || symbol;
  const sector = companyProfile?.sector || 'N/A';
  const industry = companyProfile?.industry || 'N/A';
  const businessSummary = companyProfile?.longBusinessSummary || '';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter'
  });

  const pw = doc.internal.pageSize.getWidth();  // ~792
  const ph = doc.internal.pageSize.getHeight(); // ~612
  const m = 32; // margin

  const getActionColor = (action: string): RGB => {
    if (action === 'BUY') return GREEN;
    if (action === 'SELL') return RED;
    return AMBER;
  };

  const getRiskColor = (risk: string): RGB => {
    if (risk === 'LOW') return GREEN;
    if (risk === 'HIGH') return RED;
    return AMBER;
  };

  const drawPageBg = () => {
    doc.setFillColor(...WHITE);
    doc.rect(0, 0, pw, ph, 'F');
  };

  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(...LIGHTER_GREY);
    doc.setLineWidth(0.5);
    doc.line(m, ph - 28, pw - m, ph - 28);
    doc.setFontSize(6.5);
    doc.setTextColor(...LIGHT_GREY);
    doc.setFont('helvetica', 'italic');
    doc.text('Triggerstix Investment Analysis  |  For informational purposes only  |  Not investment advice', m, ph - 14);
    doc.text(`Page ${pageNum} of 2`, pw - m, ph - 14, { align: 'right' });
  };

  // ═══════════════════════════════════════════════════════
  // PAGE 1: ANALYSIS DASHBOARD
  // ═══════════════════════════════════════════════════════
  drawPageBg();

  // ── Header bar ──
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pw, 50, 'F');

  // Left: Ticker + Company Name (single line, no duplication)
  const headerTextX = m;
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(symbol, headerTextX, 22);
  // Company name next to ticker in lighter weight
  const tickerWidth = doc.getTextWidth(symbol);
  doc.setFontSize(14);
  doc.setTextColor(200, 215, 230);
  doc.setFont('helvetica', 'normal');
  doc.text(displayName !== symbol ? displayName : '', headerTextX + tickerWidth + 12, 22);

  // Subtitle: sector + industry
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sector}  |  ${industry}`, headerTextX, 40);

  // Right: date
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.text(dateStr, pw - m, 22, { align: 'right' });

  // Right: Triggerstix branding
  doc.setFontSize(8);
  doc.setTextColor(120, 150, 180);
  doc.setFont('helvetica', 'italic');
  doc.text('Triggerstix Analysis', pw - m, 40, { align: 'right' });

  // ── Signal + Price + Key Metrics bar ──
  let y = 62;
  const actionColor = getActionColor(recommendation.action);

  // Signal badge
  doc.setFillColor(actionColor[0], actionColor[1], actionColor[2]);
  doc.roundedRect(m, y, 60, 24, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(recommendation.action, m + 30, y + 16, { align: 'center' });

  // Current price
  doc.setFontSize(24);
  doc.setTextColor(...BLACK);
  doc.text(`$${currentPrice.toFixed(2)}`, m + 72, y + 18);

  // Inline metrics
  const metricStartX = m + 200;
  const metrics = [
    { label: 'Risk', value: combinedRisk, color: getRiskColor(combinedRisk) },
    { label: 'Agreement', value: `${agreement}%`, color: agreement >= 80 ? GREEN : AMBER },
    { label: 'Target', value: `$${targetPrice.toFixed(2)}`, color: GREEN },
    { label: 'Stop Loss', value: `$${stopLoss.toFixed(2)}`, color: RED },
    { label: 'R/R Ratio', value: `${riskReward}:1`, color: parseFloat(riskReward) >= 2 ? GREEN : AMBER },
    { label: '52W High', value: `$${high52Week.toFixed(2)}`, color: DARK_GREY },
    { label: '52W Low', value: `$${low52Week.toFixed(2)}`, color: DARK_GREY },
  ];

  const metricSpacing = (pw - m - metricStartX) / metrics.length;
  metrics.forEach((met, i) => {
    const x = metricStartX + i * metricSpacing;
    doc.setFontSize(6.5);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(met.label.toUpperCase(), x, y + 5);
    doc.setFontSize(10);
    doc.setTextColor(met.color[0], met.color[1], met.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(met.value, x, y + 18);
  });

  // ── Thin separator ──
  y = 94;
  doc.setDrawColor(...LIGHTER_GREY);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);

  // ── Two-column layout: Left = Chart, Right = Analysis ──
  const colGap = 24;
  const leftColW = (pw - 2 * m - colGap) * 0.56;
  const rightColW = (pw - 2 * m - colGap) * 0.44;
  const rightX = m + leftColW + colGap;
  const contentTop = y + 8;

  // LEFT: Chart image
  const chartH = 265;
  if (chartImageBase64) {
    try {
      doc.setDrawColor(...LIGHTER_GREY);
      doc.setLineWidth(0.5);
      doc.roundedRect(m, contentTop, leftColW, chartH, 2, 2, 'D');
      doc.addImage(chartImageBase64, 'PNG', m + 1, contentTop + 1, leftColW - 2, chartH - 2);
    } catch {
      doc.setFillColor(...LIGHTEST_GREY);
      doc.roundedRect(m, contentTop, leftColW, chartH, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setTextColor(...MED_GREY);
      doc.text('Price Chart', m + leftColW / 2, contentTop + chartH / 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(...LIGHTEST_GREY);
    doc.roundedRect(m, contentTop, leftColW, chartH, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...MED_GREY);
    doc.text('Price Chart', m + leftColW / 2, contentTop + chartH / 2, { align: 'center' });
  }

  // RIGHT COLUMN: Analysis sections
  let ry = contentTop;

  // ── Price Sustainability ──
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE SUSTAINABILITY', rightX, ry + 10);
  doc.setDrawColor(...ACCENT_BLUE);
  doc.setLineWidth(1.5);
  doc.line(rightX, ry + 14, rightX + 115, ry + 14);

  ry += 26;
  const deviation = ((currentPrice - sustainablePrice) / sustainablePrice * 100).toFixed(1);
  const priceRows = [
    { label: 'Sustainable Price', value: `$${sustainablePrice.toFixed(2)}` },
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { label: 'Deviation', value: `${deviation}%` },
    { label: 'Risk Level', value: gann.rallyAngle.riskLevel },
  ];

  priceRows.forEach((row) => {
    doc.setFontSize(8.5);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, rightX, ry);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.text(row.value, rightX + rightColW, ry, { align: 'right' });
    ry += 15;
  });

  // ── Market Phase ──
  ry += 6;
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET PHASE', rightX, ry);
  doc.setDrawColor(...ACCENT_BLUE);
  doc.line(rightX, ry + 4, rightX + 85, ry + 4);

  ry += 14;
  doc.setFillColor(235, 245, 255);
  doc.roundedRect(rightX, ry, rightColW, 42, 3, 3, 'F');
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(ney.phase, rightX + 10, ry + 16);
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  const phaseDesc = getPhaseDescription(ney.phase);
  const phaseLines = doc.splitTextToSize(phaseDesc, rightColW - 20);
  doc.text(phaseLines.slice(0, 2), rightX + 10, ry + 30);

  // ── Method Agreement ──
  ry += 54;
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('METHOD AGREEMENT', rightX, ry);
  doc.setDrawColor(...ACCENT_BLUE);
  doc.line(rightX, ry + 4, rightX + 110, ry + 4);

  ry += 14;
  // Table header
  doc.setFillColor(...DARK_BLUE);
  doc.rect(rightX, ry, rightColW, 16, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Method', rightX + 8, ry + 11);
  doc.text('Signal', rightX + rightColW * 0.55, ry + 11);
  doc.text('Confidence', rightX + rightColW - 8, ry + 11, { align: 'right' });

  ry += 16;
  const methods = [
    { name: 'Price Sustainability', signal: gann.rallyAngle.riskLevel === 'LOW' ? 'BUY' : gann.rallyAngle.riskLevel === 'HIGH' ? 'SELL' : 'HOLD', conf: `${100 - (gann.rallyAngle.riskLevel === 'LOW' ? 20 : 40)}%` },
    { name: 'Market Phase', signal: ney.signal, conf: `${ney.confidence}%` },
  ];

  methods.forEach((met, i) => {
    const rowBg = i % 2 === 0 ? LIGHTEST_GREY : WHITE;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(rightX, ry, rightColW, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(met.name, rightX + 8, ry + 10);
    const sigColor = met.signal === 'BUY' ? GREEN : met.signal === 'SELL' ? RED : AMBER;
    doc.setTextColor(sigColor[0], sigColor[1], sigColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(met.signal, rightX + rightColW * 0.55, ry + 10);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(met.conf, rightX + rightColW - 8, ry + 10, { align: 'right' });
    ry += 15;
  });

  // Overall agreement bar
  ry += 4;
  doc.setFillColor(235, 245, 255);
  doc.roundedRect(rightX, ry, rightColW, 20, 3, 3, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Agreement', rightX + 10, ry + 13);
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(`${agreement}%`, rightX + rightColW - 10, ry + 14, { align: 'right' });

  // ── Below chart: Trading Parameters ──
  const belowY = contentTop + chartH + 12;
  const boxGap = 12;
  const boxW = (pw - 2 * m - 2 * boxGap) / 3;
  const boxH = 48;

  // Entry Zone
  doc.setFillColor(...GREEN);
  doc.roundedRect(m, belowY, boxW, boxH, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('ENTRY ZONE', m + boxW / 2, belowY + 14, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${(currentPrice * 0.98).toFixed(2)} – $${(currentPrice * 1.02).toFixed(2)}`, m + boxW / 2, belowY + 32, { align: 'center' });

  // Target Price
  doc.setFillColor(...PRIMARY_BLUE);
  doc.roundedRect(m + boxW + boxGap, belowY, boxW, boxH, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('TARGET PRICE', m + boxW + boxGap + boxW / 2, belowY + 14, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${targetPrice.toFixed(2)}  (+${upside}%)`, m + boxW + boxGap + boxW / 2, belowY + 32, { align: 'center' });

  // Stop Loss
  doc.setFillColor(...RED);
  doc.roundedRect(m + 2 * (boxW + boxGap), belowY, boxW, boxH, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('STOP LOSS', m + 2 * (boxW + boxGap) + boxW / 2, belowY + 14, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${stopLoss.toFixed(2)}  (–${downside}%)`, m + 2 * (boxW + boxGap) + boxW / 2, belowY + 32, { align: 'center' });

  // ── Support / Resistance + Analysis text ──
  const infoY = belowY + boxH + 10;

  // Support levels
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Support:', m, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const supportStr = supportLevels.map(l => `$${l.level.toFixed(2)}`).join('    ') || 'N/A';
  doc.text(supportStr, m + 42, infoY);

  // Resistance levels
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Resistance:', pw / 2 - 20, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const resistStr = resistanceLevels.map(l => `$${l.level.toFixed(2)}`).join('    ') || 'N/A';
  doc.text(resistStr, pw / 2 + 35, infoY);

  // Analysis reasoning
  const reasonY = infoY + 14;
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis:', m, reasonY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const reasonLines = doc.splitTextToSize(recommendation.reasoning, pw - 2 * m - 50);
  doc.text(reasonLines.slice(0, 3), m + 45, reasonY);

  drawFooter(1);

  // ═══════════════════════════════════════════════════════
  // PAGE 2: COMPANY PROFILE & INVESTMENT THESIS
  // ═══════════════════════════════════════════════════════
  doc.addPage();
  drawPageBg();

  // ── Header bar ──
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pw, 42, 'F');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY PROFILE & INVESTMENT THESIS', m, 27);
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.text(dateStr, pw - m, 27, { align: 'right' });

  // ── Company info section ──
  y = 58;

  // Company name + sector (no duplicate ticker)
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(displayName !== symbol ? displayName : symbol, m, y + 12);

  doc.setFontSize(9);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${symbol}  |  ${sector}  |  ${industry}`, m, y + 28);

  // Business summary
  y += 42;
  if (businessSummary) {
    doc.setDrawColor(...LIGHTER_GREY);
    doc.setLineWidth(0.5);
    doc.line(m, y - 4, pw - m, y - 4);

    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(businessSummary, pw - 2 * m);
    doc.text(summaryLines.slice(0, 6), m, y + 8);
    y += Math.min(summaryLines.length, 6) * 11 + 16;
  }

  // ── Key Stats bar ──
  doc.setFillColor(...LIGHTEST_GREY);
  doc.roundedRect(m, y, pw - 2 * m, 32, 3, 3, 'F');

  const statItems = [
    { label: 'Price', value: `$${currentPrice.toFixed(2)}` },
    { label: '52W High', value: `$${high52Week.toFixed(2)}` },
    { label: '52W Low', value: `$${low52Week.toFixed(2)}` },
    { label: 'Phase', value: ney.phase },
    { label: 'Risk', value: combinedRisk },
    { label: 'Signal', value: recommendation.action },
  ];

  const statW = (pw - 2 * m) / statItems.length;
  statItems.forEach((s, i) => {
    const sx = m + i * statW + statW / 2;
    doc.setFontSize(6.5);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label.toUpperCase(), sx, y + 12, { align: 'center' });
    doc.setFontSize(10);
    const valColor = s.label === 'Signal' ? getActionColor(s.value) :
                     s.label === 'Risk' ? getRiskColor(s.value) : DARK_BLUE;
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, sx, y + 25, { align: 'center' });
  });

  y += 44;

  // ── Bull vs Bear cases ──
  const caseGap = 20;
  const caseW = (pw - 2 * m - caseGap) / 2;
  const caseH = 170;

  // Bull Case
  doc.setFillColor(242, 252, 245);
  doc.roundedRect(m, y, caseW, caseH, 4, 4, 'F');
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(2);
  doc.line(m, y, m + caseW, y);

  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.text('BULL CASE', m + 12, y + 18);

  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  const bullPts = [
    `Trading at $${currentPrice.toFixed(2)} vs sustainable price of $${sustainablePrice.toFixed(2)}`,
    `${agreement}% method agreement supports current position`,
    `Target price: $${targetPrice.toFixed(2)} representing +${upside}% upside`,
    `Risk/reward ratio of ${riskReward}:1`,
    `${ney.phase} phase suggests favorable conditions`,
  ];
  bullPts.forEach((pt, i) => {
    doc.text(`-  ${pt}`, m + 12, y + 36 + i * 24);
  });

  // Bear Case
  doc.setFillColor(255, 243, 243);
  doc.roundedRect(m + caseW + caseGap, y, caseW, caseH, 4, 4, 'F');
  doc.setDrawColor(...RED);
  doc.setLineWidth(2);
  doc.line(m + caseW + caseGap, y, m + caseW + caseGap + caseW, y);

  doc.setFontSize(10);
  doc.setTextColor(...RED);
  doc.setFont('helvetica', 'bold');
  doc.text('BEAR CASE', m + caseW + caseGap + 12, y + 18);

  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  const bearPts = [
    'Broader market conditions may deteriorate',
    'Sector rotation could negatively impact performance',
    `Stop loss at $${stopLoss.toFixed(2)} represents –${downside}% downside risk`,
    'External macroeconomic factors remain uncertain',
    'Technical resistance levels may limit upside',
  ];
  bearPts.forEach((pt, i) => {
    doc.text(`-  ${pt}`, m + caseW + caseGap + 12, y + 36 + i * 24);
  });

  // ── Disclaimer ──
  y += caseH + 10;
  doc.setFillColor(...LIGHTEST_GREY);
  doc.roundedRect(m, y, pw - 2 * m, 62, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCLAIMER', m + 10, y + 13);

  doc.setFontSize(6.5);
  doc.setTextColor(...LIGHT_GREY);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions.';
  const discLines = doc.splitTextToSize(disclaimer, pw - 2 * m - 20);
  doc.text(discLines, m + 10, y + 25);

  drawFooter(2);

  return doc.output('blob');
}

function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    'ACCUMULATION': 'Institutional investors are quietly building positions after a prolonged decline, acquiring shares at depressed prices.',
    'MARKUP': 'Price is advancing with institutional support, characterized by rising prices on increasing volume.',
    'DISTRIBUTION': 'Institutional investors are reducing positions after a significant advance, selling to retail investors.',
    'MARKDOWN': 'Price is declining as institutions exit positions, characterized by falling prices on increasing volume.',
  };
  return descriptions[phase] || 'Market phase analysis evaluates the current stage of the price cycle based on institutional activity patterns.';
}
