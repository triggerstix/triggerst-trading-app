/**
 * Client-side PDF Generator using jsPDF
 * Generates polished 2-page Investment Analysis PDF
 * Color scheme: White, Black, Shades of Grey, Blue
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
  
  const displayName = companyName || companyProfile?.longName || symbol;
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
  const m = 30; // margin

  const getActionColor = (action: string): readonly [number, number, number] => {
    if (action === 'BUY') return GREEN;
    if (action === 'SELL') return RED;
    return MED_GREY;
  };

  const drawPageBg = () => {
    doc.setFillColor(...WHITE);
    doc.rect(0, 0, pw, ph, 'F');
  };

  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(...LIGHTER_GREY);
    doc.setLineWidth(0.5);
    doc.line(m, ph - 25, pw - m, ph - 25);
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text('Triggerstix Investment Analysis  •  For informational purposes only  •  Not investment advice', m, ph - 12);
    doc.text(`Page ${pageNum} of 2`, pw - m, ph - 12, { align: 'right' });
  };

  // ═══════════════════════════════════════════════════════
  // PAGE 1: Header + Signal + Key Metrics + Chart + Analysis
  // ═══════════════════════════════════════════════════════
  drawPageBg();

  // ── Top bar: dark blue with ticker, name, date ──
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pw, 55, 'F');

  // Logo placeholder or actual logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', m, 6, 42, 42); } catch {}
  }
  const nameX = logoBase64 ? m + 50 : m;

  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(symbol, nameX, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(displayName, nameX, 42);

  // Right side: date + sector
  doc.setFontSize(10);
  doc.text(dateStr, pw - m, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...LIGHTER_GREY);
  doc.text(`${sector}  •  ${industry}`, pw - m, 38, { align: 'right' });

  // ── Signal badge + Price row ──
  let y = 72;
  const actionColor = getActionColor(recommendation.action);

  // Action badge
  doc.setFillColor(actionColor[0], actionColor[1], actionColor[2]);
  doc.roundedRect(m, y - 14, 70, 28, 4, 4, 'F');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(recommendation.action, m + 35, y + 4, { align: 'center' });

  // Current price
  doc.setFontSize(28);
  doc.setTextColor(...BLACK);
  doc.text(`$${currentPrice.toFixed(2)}`, m + 82, y + 5);

  // Key metrics inline
  const metricStartX = m + 220;
  const inlineMetrics = [
    { label: 'Risk', value: combinedRisk, color: combinedRisk === 'LOW' ? GREEN : combinedRisk === 'HIGH' ? RED : MED_GREY },
    { label: 'Agreement', value: `${agreement}%`, color: agreement >= 80 ? GREEN : MED_GREY },
    { label: 'Target', value: `$${targetPrice.toFixed(2)}`, color: GREEN },
    { label: 'Stop', value: `$${stopLoss.toFixed(2)}`, color: RED },
    { label: 'R/R', value: `${riskReward}:1`, color: parseFloat(riskReward) >= 2 ? GREEN : MED_GREY },
    { label: '52W H', value: `$${high52Week.toFixed(2)}`, color: DARK_GREY },
    { label: '52W L', value: `$${low52Week.toFixed(2)}`, color: DARK_GREY },
  ];

  inlineMetrics.forEach((met, i) => {
    const x = metricStartX + i * 75;
    doc.setFontSize(7);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(met.label, x, y - 6);
    doc.setFontSize(11);
    doc.setTextColor(met.color[0], met.color[1], met.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(met.value, x, y + 6);
  });

  // ── Thin separator ──
  y = 105;
  doc.setDrawColor(...LIGHTER_GREY);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);

  // ── Two-column layout: Left = Chart, Right = Analysis ──
  const leftColW = (pw - 3 * m) * 0.55;
  const rightColW = (pw - 3 * m) * 0.45;
  const rightX = m + leftColW + m;
  const contentTop = y + 10;

  // LEFT: Chart image
  const chartH = 280;
  if (chartImageBase64) {
    try {
      doc.setDrawColor(...LIGHTER_GREY);
      doc.setLineWidth(0.5);
      doc.roundedRect(m, contentTop, leftColW, chartH, 3, 3, 'D');
      doc.addImage(chartImageBase64, 'PNG', m + 2, contentTop + 2, leftColW - 4, chartH - 4);
    } catch {
      doc.setFillColor(...LIGHTEST_GREY);
      doc.roundedRect(m, contentTop, leftColW, chartH, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(...MED_GREY);
      doc.text(`${symbol} Price Chart`, m + leftColW / 2, contentTop + chartH / 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(...LIGHTEST_GREY);
    doc.roundedRect(m, contentTop, leftColW, chartH, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(...MED_GREY);
    doc.text(`${symbol} Price Chart`, m + leftColW / 2, contentTop + chartH / 2, { align: 'center' });
  }

  // RIGHT: Price Analysis + Market Phase
  let ry = contentTop + 5;

  // Price Sustainability section
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE SUSTAINABILITY', rightX, ry);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.setLineWidth(1.5);
  doc.line(rightX, ry + 4, rightX + 120, ry + 4);

  ry += 20;
  const priceRows = [
    { label: 'Sustainable Price', value: `$${sustainablePrice.toFixed(2)}` },
    { label: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { label: 'Deviation', value: `${((currentPrice - sustainablePrice) / sustainablePrice * 100).toFixed(1)}%` },
    { label: 'Risk Level', value: gann.rallyAngle.riskLevel },
  ];

  priceRows.forEach((row) => {
    doc.setFontSize(9);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, rightX, ry);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.text(row.value, rightX + rightColW - 5, ry, { align: 'right' });
    ry += 16;
  });

  // Market Phase section
  ry += 8;
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET PHASE', rightX, ry);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(rightX, ry + 4, rightX + 90, ry + 4);

  ry += 18;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(rightX, ry, rightColW, 40, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(ney.phase, rightX + 10, ry + 17);
  doc.setFontSize(8);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  const phaseDesc = getPhaseDescription(ney.phase).substring(0, 120) + '...';
  const phaseLines = doc.splitTextToSize(phaseDesc, rightColW - 20);
  doc.text(phaseLines.slice(0, 2), rightX + 10, ry + 30);

  // Method Agreement section
  ry += 55;
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('METHOD AGREEMENT', rightX, ry);
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.line(rightX, ry + 4, rightX + 120, ry + 4);

  ry += 18;
  // Mini table
  doc.setFillColor(...DARK_BLUE);
  doc.rect(rightX, ry, rightColW, 18, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Method', rightX + 8, ry + 12);
  doc.text('Signal', rightX + rightColW * 0.55, ry + 12);
  doc.text('Conf.', rightX + rightColW - 10, ry + 12, { align: 'right' });

  ry += 18;
  const methods = [
    { name: 'Price Sustainability', signal: gann.rallyAngle.riskLevel === 'LOW' ? 'BUY' : 'HOLD', conf: `${100 - (gann.rallyAngle.riskLevel === 'LOW' ? 20 : 40)}%` },
    { name: 'Market Phase', signal: ney.signal, conf: `${ney.confidence}%` },
  ];

  methods.forEach((met, i) => {
    const rowBg = i % 2 === 0 ? LIGHTEST_GREY : WHITE;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(rightX, ry, rightColW, 16, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(met.name, rightX + 8, ry + 11);
    const sigColor = met.signal === 'BUY' ? GREEN : met.signal === 'SELL' ? RED : MED_GREY;
    doc.setTextColor(sigColor[0], sigColor[1], sigColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(met.signal, rightX + rightColW * 0.55, ry + 11);
    doc.setTextColor(...DARK_GREY);
    doc.text(met.conf, rightX + rightColW - 10, ry + 11, { align: 'right' });
    ry += 16;
  });

  // Overall agreement
  ry += 4;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(rightX, ry, rightColW, 22, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Agreement:', rightX + 10, ry + 15);
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(`${agreement}%`, rightX + rightColW - 15, ry + 16, { align: 'right' });

  // ── Below chart: Trading Parameters row ──
  const belowY = contentTop + chartH + 15;

  // Entry / Target / Stop boxes
  const boxW = (pw - 2 * m - 20) / 3;
  const boxH = 55;

  // Entry Zone
  doc.setFillColor(...GREEN);
  doc.roundedRect(m, belowY, boxW, boxH, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('ENTRY ZONE', m + boxW / 2, belowY + 15, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${(currentPrice * 0.98).toFixed(2)} – $${(currentPrice * 1.02).toFixed(2)}`, m + boxW / 2, belowY + 35, { align: 'center' });

  // Target
  doc.setFillColor(...PRIMARY_BLUE);
  doc.roundedRect(m + boxW + 10, belowY, boxW, boxH, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('TARGET PRICE', m + boxW + 10 + boxW / 2, belowY + 15, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${targetPrice.toFixed(2)}  (+${upside}%)`, m + boxW + 10 + boxW / 2, belowY + 35, { align: 'center' });

  // Stop Loss
  doc.setFillColor(...RED);
  doc.roundedRect(m + 2 * (boxW + 10), belowY, boxW, boxH, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.text('STOP LOSS', m + 2 * (boxW + 10) + boxW / 2, belowY + 15, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${stopLoss.toFixed(2)}  (–${downside}%)`, m + 2 * (boxW + 10) + boxW / 2, belowY + 35, { align: 'center' });

  // ── Support / Resistance row ──
  const levelsY = belowY + boxH + 10;
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Support:', m, levelsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const supportStr = supportLevels.map(l => `$${l.level.toFixed(2)}`).join('   ') || 'N/A';
  doc.text(supportStr, m + 45, levelsY);

  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Resistance:', pw / 2, levelsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const resistStr = resistanceLevels.map(l => `$${l.level.toFixed(2)}`).join('   ') || 'N/A';
  doc.text(resistStr, pw / 2 + 55, levelsY);

  // ── Reasoning ──
  const reasonY = levelsY + 16;
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis:', m, reasonY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);
  const reasonLines = doc.splitTextToSize(recommendation.reasoning, pw - 2 * m - 50);
  doc.text(reasonLines.slice(0, 3), m + 48, reasonY);

  drawFooter(1);

  // ═══════════════════════════════════════════════════════
  // PAGE 2: Company Profile + Bull/Bear + Disclaimer
  // ═══════════════════════════════════════════════════════
  doc.addPage();
  drawPageBg();

  // ── Header bar ──
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pw, 40, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY PROFILE & INVESTMENT THESIS', m, 26);
  doc.setFontSize(10);
  doc.text(`${symbol}  •  ${dateStr}`, pw - m, 26, { align: 'right' });

  // ── Company info ──
  y = 60;

  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', m, y, 45, 45); } catch {}
  }
  const compX = logoBase64 ? m + 55 : m;

  doc.setFontSize(18);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(displayName, compX, y + 15);

  doc.setFontSize(10);
  doc.setTextColor(...MED_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sector}  •  ${industry}  •  ${symbol}`, compX, y + 32);

  // Business summary
  y += 55;
  if (businessSummary) {
    doc.setFontSize(9);
    doc.setTextColor(...DARK_GREY);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(businessSummary, pw - 2 * m);
    doc.text(summaryLines.slice(0, 5), m, y);
    y += Math.min(summaryLines.length, 5) * 12 + 10;
  }

  // ── Key Stats bar ──
  doc.setFillColor(...LIGHTEST_GREY);
  doc.roundedRect(m, y, pw - 2 * m, 35, 3, 3, 'F');

  const statW = (pw - 2 * m) / 5;
  const statsData = [
    { label: 'Price', value: `$${currentPrice.toFixed(2)}` },
    { label: '52W High', value: `$${high52Week.toFixed(2)}` },
    { label: '52W Low', value: `$${low52Week.toFixed(2)}` },
    { label: 'Phase', value: ney.phase },
    { label: 'Risk', value: combinedRisk },
  ];

  statsData.forEach((s, i) => {
    const sx = m + i * statW + statW / 2;
    doc.setFontSize(7);
    doc.setTextColor(...MED_GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, sx, y + 13, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(...DARK_BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, sx, y + 27, { align: 'center' });
  });

  y += 50;

  // ── Bull vs Bear cases side by side ──
  const caseW = (pw - 3 * m) / 2;
  const caseH = 160;

  // Bull Case
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(m, y, caseW, caseH, 4, 4, 'F');
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.5);
  doc.line(m, y, m + caseW, y);

  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.text('BULL CASE', m + 12, y + 20);

  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  const bullPts = [
    `Price at $${currentPrice.toFixed(2)} vs sustainable $${sustainablePrice.toFixed(2)}`,
    `${agreement}% method agreement supports position`,
    `Target: $${targetPrice.toFixed(2)} (+${upside}% upside)`,
    `Risk/reward ratio: ${riskReward}:1`,
    `${ney.phase} phase indicates opportunity`,
  ];
  bullPts.forEach((pt, i) => {
    doc.text(`•  ${pt}`, m + 12, y + 38 + i * 22);
  });

  // Bear Case
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(m + caseW + m, y, caseW, caseH, 4, 4, 'F');
  doc.setDrawColor(...RED);
  doc.setLineWidth(1.5);
  doc.line(m + caseW + m, y, m + caseW + m + caseW, y);

  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.setFont('helvetica', 'bold');
  doc.text('BEAR CASE', m + caseW + m + 12, y + 20);

  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'normal');
  const bearPts = [
    'Market conditions may deteriorate',
    'Sector rotation could impact performance',
    `Stop loss at $${stopLoss.toFixed(2)} (–${downside}% risk)`,
    'External macro factors uncertain',
    'Technical resistance may hold',
  ];
  bearPts.forEach((pt, i) => {
    doc.text(`•  ${pt}`, m + caseW + m + 12, y + 38 + i * 22);
  });

  // ── Disclaimer ──
  y += caseH + 15;
  doc.setFillColor(...LIGHTEST_GREY);
  doc.roundedRect(m, y, pw - 2 * m, 70, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCLAIMER', m + 10, y + 14);

  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GREY);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'This report is for informational purposes only and does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All investments involve risk, including potential loss of principal. The analysis presented is based on historical data and mathematical models which may not accurately predict future price movements. Investors should conduct their own due diligence and consult with qualified financial advisors before making investment decisions.';
  const discLines = doc.splitTextToSize(disclaimer, pw - 2 * m - 20);
  doc.text(discLines, m + 10, y + 26);

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
