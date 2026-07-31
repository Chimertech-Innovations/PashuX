import jsPDF from 'jspdf';
import { CHIMERTECH_LOGO_BASE64 } from './logoBase64';
import { IHERD_LOGO_BASE64, GOOGLE_PLAY_BASE64 } from './iherdLogoBase64';

export interface ReportPDFData {
  requestId: string;
  userEmail?: string;
  userName?: string;
  date: string;
  analysisType: string;
  bcsScore?: number;
  bcsConfidence?: number;
  possibleCondition?: string;
  diseaseConfidence?: number;
  severity?: string;
  observations?: string[];
  recommendations?: string[];
  aiSuggestions?: string;
  recommendedProducts?: Array<{
    name: string;
    category: string;
    price: number;
    description?: string;
    product_page_url?: string;
  }>;
}

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

export function generateHealthReportPDF(data: ReportPDFData) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 15;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
        // Continuation Header
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('PashuX AI Diagnostic Report (Continued)', 14, 12);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 14, pageWidth - 14, 14);
      }
    };

    // --- Header Section ---
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 28, 'F');

    try {
      doc.addImage(CHIMERTECH_LOGO_BASE64, 'PNG', 14, 4, 38, 20);
    } catch (e) {
      console.warn('Could not embed logo image in PDF:', e);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('PASHUX DIAGNOSTIC SYSTEM', 56, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('CATTLE HEALTH & BCS DIAGNOSTIC REPORT', 56, 18);

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(0, 28, pageWidth, 28);

    y = 34;

    // --- Meta Details Box (Clean & Non-Overlapping Layout) ---
    const boxHeight = data.userEmail ? 26 : 20;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, boxHeight, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    const refId = data.requestId.length > 28 ? `${data.requestId.slice(0, 28)}...` : data.requestId;

    // Line 1: Ref ID & Date
    doc.text(`Report Ref ID: ${refId}`, 18, y + 6);
    doc.text(`Date of Scan: ${data.date}`, 125, y + 6);

    // Line 2: Diagnostic Engine
    doc.text(`Diagnostic Engine: PASHUX NEURAL VISION (${data.analysisType.toUpperCase()})`, 18, y + 13);

    // Line 3: Registered Owner
    if (data.userEmail) {
      doc.text(`Registered Owner: ${data.userName || 'Cattle Owner'} (${data.userEmail})`, 18, y + 20);
    }

    y += boxHeight + 8;

    // --- Section 1: Diagnostic Overview ---
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text('1. Diagnostic Overview', 14, y);
    y += 5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, y, pageWidth - 14, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    if (data.bcsScore !== undefined && data.bcsScore !== null) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.text('• Body Condition Score (BCS):', 18, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`${data.bcsScore.toFixed(1)} / 5.0`, 75, y);

      if (data.bcsConfidence) {
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(`(Confidence: ${(data.bcsConfidence * 100).toFixed(0)}%)`, 105, y);
      }
      y += 7;
    }

    if (data.possibleCondition) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('• Screened Condition:', 18, y);

      const condText = String(data.possibleCondition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(condText, 62, y);

      if (data.severity) {
        const condWidth = doc.getTextWidth(condText);
        const sevX = Math.max(130, 64 + condWidth + 6);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(`(Severity: ${data.severity.toUpperCase()})`, sevX, y);
      }
      y += 7;
    }

    y += 4;

    // --- Section 2: Observations & Recommendations ---
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text('2. Clinical Observations & Actionable Protocols', 14, y);
    y += 5;
    doc.line(14, y, pageWidth - 14, y);
    y += 7;

    // Observations
    const obsList = data.observations && data.observations.length > 0
      ? data.observations
      : ['No abnormal physical signs detected during scan.'];

    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Observations:', 18, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    obsList.forEach(obs => {
      const cleanObs = String(obs).replace(/[^\x20-\x7E]/g, '');
      const splitObs = doc.splitTextToSize(`• ${cleanObs}`, pageWidth - 36);
      const reqH = splitObs.length * 5 + 2;
      checkPageBreak(reqH);
      doc.text(splitObs, 22, y);
      y += reqH;
    });

    y += 4;

    // Recommendations
    const recList = data.recommendations && data.recommendations.length > 0
      ? data.recommendations
      : ['Maintain normal balanced ration and monitor daily water intake.'];

    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Actionable Recommendations:', 18, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    recList.forEach(rec => {
      const cleanRec = String(rec).replace(/[^\x20-\x7E]/g, '');
      const splitRec = doc.splitTextToSize(`• ${cleanRec}`, pageWidth - 36);
      const reqH = splitRec.length * 5 + 2;
      checkPageBreak(reqH);
      doc.text(splitRec, 22, y);
      y += reqH;
    });

    if (data.aiSuggestions) {
      y += 4;
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('AI Specialist Guidance Notes:', 18, y);
      y += 6;

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      const cleanReply = String(data.aiSuggestions).replace(/[^\x20-\x7E]/g, '');
      const splitReply = doc.splitTextToSize(cleanReply, pageWidth - 36);
      const reqH = splitReply.length * 5 + 2;
      checkPageBreak(reqH);
      doc.text(splitReply, 22, y);
      y += reqH;
    }

    y += 6;

    // --- Section 3: Recommended Products with Purchase Links ---
    if (data.recommendedProducts && data.recommendedProducts.length > 0) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('3. Recommended Products & Direct Purchase Links', 14, y);
      y += 5;
      doc.line(14, y, pageWidth - 14, y);
      y += 7;

      doc.setFontSize(9);
      data.recommendedProducts.forEach((prod, idx) => {
        const cleanName = String(prod.name).replace(/[^\x20-\x7E]/g, '');
        const cleanCat  = String(prod.category || '').replace(/[^\x20-\x7E]/g, '');
        const cleanDesc = prod.description ? String(prod.description).replace(/[^\x20-\x7E]/g, '') : '';
        const buyUrl    = prod.product_page_url || `https://chimertech.shop/search?q=${encodeURIComponent(cleanName)}`;

        const titleText = `${idx + 1}. ${cleanName}  --  INR ${prod.price.toLocaleString('en-IN')}`;
        const catText   = `Category: ${cleanCat}`;
        const splitDesc = cleanDesc ? doc.splitTextToSize(cleanDesc, pageWidth - 36) : [];
        const cardHeight = 16 + (splitDesc.length * 4.5);

        checkPageBreak(cardHeight);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(titleText, 18, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(catText, 18, y);
        y += 4.5;

        if (splitDesc.length > 0) {
          doc.setTextColor(51, 65, 85);
          doc.text(splitDesc, 18, y);
          y += splitDesc.length * 4.5;
        }

        // Direct Purchase URL Link
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.textWithLink(`[Click Here to Purchase Product Online]`, 18, y, { url: buyUrl });
        y += 6;
      });
    }

    // --- Section 4: iHerd Mobile App Download Section ---
    y += 4;
    checkPageBreak(32);

    // Pristine White Card with Emerald Border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

    // Embed iHerd Cow Logo Image
    try {
      doc.addImage(IHERD_LOGO_BASE64, 'PNG', 18, y + 4, 18, 18);
    } catch (e) {
      console.warn('Could not embed iHerd logo in PDF:', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text('iHERD MOBILE APP -- OFFICIAL HERD MANAGEMENT', 40, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Record daily body condition scores, milk yields, vaccination routines & health logs.', 40, y + 14);

    // Embed Google Play Badge Image
    try {
      doc.addImage(GOOGLE_PLAY_BASE64, 'PNG', 40, y + 16, 28, 8);
    } catch (e) {
      console.warn('Could not embed Google Play badge in PDF:', e);
    }

    // Clickable link covering the badge area
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.textWithLink('[Click to Download iHerd App on Google Play]', 72, y + 21, { url: IHERD_PLAY_STORE_URL });

    y += 34;

    // --- Footer for all pages ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `PashuX AI Diagnostic System -- Powered by openpashu -- Page ${i} of ${pageCount}`,
        pageWidth / 2,
        287,
        { align: 'center' }
      );
    }

    doc.save(`PashuX_Health_Report_${data.requestId.slice(0, 8)}.pdf`);
  } catch (err) {
    console.error('jsPDF export error, falling back to printable window:', err);
    fallbackHTMLPrintReport(data);
  }
}

function fallbackHTMLPrintReport(data: ReportPDFData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PashuX Cattle Health Diagnostic Report - ${data.requestId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: auto; }
        .header { background: #f8fafc; border-bottom: 3px solid #10b981; padding: 20px; border-radius: 12px; margin-bottom: 25px; display: flex; align-items: center; gap: 20px; }
        .header img { height: 50px; }
        .header h1 { margin: 0; font-size: 20px; color: #0f172a; }
        .header p { margin: 4px 0 0 0; color: #10b981; font-weight: bold; font-size: 14px; }
        .meta { background: #f1f5f9; padding: 15px; border-radius: 8px; color: #334155; font-size: 13px; margin-bottom: 25px; line-height: 1.6; }
        .section-title { font-size: 16px; font-weight: 700; color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px; }
        .badge { background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; }
        ul { padding-left: 20px; line-height: 1.7; }
        .product-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        .buy-link { display: inline-block; margin-top: 6px; font-weight: bold; color: #059669; text-decoration: underline; }
        .app-banner { background: #ffffff; border: 2px solid #10b981; color: #0f172a; padding: 15px; border-radius: 12px; margin-top: 25px; display: flex; align-items: center; gap: 15px; }
        .app-banner img.logo { height: 45px; }
        .app-banner img.badge { height: 35px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="background:#10b981;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;margin-bottom:20px;">Download / Print PDF</button>
      <div class="header">
        <img src="${CHIMERTECH_LOGO_BASE64}" alt="PashuX Logo" />
        <div>
          <h1>PASHUX DIAGNOSTIC SYSTEM</h1>
          <p>CATTLE HEALTH & BCS DIAGNOSTIC REPORT</p>
        </div>
      </div>
      <div class="meta">
        <strong>Report Reference ID:</strong> ${data.requestId}<br/>
        <strong>Date:</strong> ${data.date}<br/>
        <strong>Diagnostic Engine:</strong> PASHUX NEURAL VISION (${data.analysisType.toUpperCase()})<br/>
        ${data.userEmail ? `<strong>Registered Owner:</strong> ${data.userName || 'Cattle Owner'} (${data.userEmail})<br/>` : ''}
      </div>

      <div class="section-title">1. Diagnostic Overview</div>
      <p>
        ${data.bcsScore !== undefined ? `<strong>BCS Score:</strong> <span class="badge">${data.bcsScore.toFixed(1)} / 5.0</span> ` : ''}
        ${data.possibleCondition ? `<strong>Screened Condition:</strong> <span class="badge">${data.possibleCondition}</span> ` : ''}
        ${data.severity ? `<strong>Severity:</strong> ${data.severity}` : ''}
      </p>

      <div class="section-title">2. AI Clinical Observations & Recommendations</div>
      <h4>Observations:</h4>
      <ul>
        ${(data.observations || ['No abnormal physical signs detected']).map(o => `<li>${o}</li>`).join('')}
      </ul>

      <h4>Recommendations:</h4>
      <ul>
        ${(data.recommendations || ['Maintain normal balanced ration']).map(r => `<li>${r}</li>`).join('')}
      </ul>

      ${data.aiSuggestions ? `<h4>AI Specialist Guidance Notes:</h4><blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #10b981;margin:0;">${data.aiSuggestions}</blockquote>` : ''}

      ${data.recommendedProducts && data.recommendedProducts.length > 0 ? `
        <div class="section-title">3. Recommended Products</div>
        ${data.recommendedProducts.map(p => `
          <div class="product-card">
            <strong>${p.name}</strong> — ₹${p.price.toLocaleString('en-IN')}<br/>
            <small style="color:#64748b;">${p.category}</small>
            ${p.description ? `<p style="margin:5px 0 0 0;font-size:13px;">${p.description}</p>` : ''}
            <a href="${p.product_page_url || `https://chimertech.shop/search?q=${encodeURIComponent(p.name)}`}" target="_blank" class="buy-link">🛒 Click to Purchase ${p.name} Online →</a>
          </div>
        `).join('')}
      ` : ''}

      <div class="app-banner">
        <img src="${IHERD_LOGO_BASE64}" class="logo" alt="iHerd Logo" />
        <div>
          <h4 style="margin:0;">Track Herd Health on iHerd Mobile App</h4>
          <p style="margin:4px 0 8px 0;font-size:13px;">Record daily body condition scores, milk yields, and vaccination logs on your smartphone.</p>
          <a href="${IHERD_PLAY_STORE_URL}" target="_blank">
            <img src="${GOOGLE_PLAY_BASE64}" class="badge" alt="Get it on Google Play" />
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}
