import jsPDF from 'jspdf';

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
  }>;
}

export function generateHealthReportPDF(data: ReportPDFData) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Brand Header
    doc.setFillColor(16, 185, 129); // Emerald accent
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CHIMERTECH — CATTLE HEALTH & BCS DIAGNOSTIC REPORT', 14, 10);

    // Title Section
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(18);
    doc.text('Cattle Health Diagnostic Report', 14, y + 5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Report ID: ${data.requestId}`, 14, y + 12);
    doc.text(`Date Generated: ${data.date}`, 14, y + 17);
    if (data.userEmail) {
      doc.text(`User: ${data.userName || 'Cattle Owner'} (${data.userEmail})`, 14, y + 22);
    }

    y += 30;

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    // Analysis Results Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('1. Diagnostic Overview', 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    if (data.bcsScore !== undefined && data.bcsScore !== null) {
      doc.text(`• Body Condition Score (BCS): ${data.bcsScore.toFixed(1)} / 5.0`, 18, y);
      if (data.bcsConfidence) {
        doc.text(`  (Confidence: ${(data.bcsConfidence * 100).toFixed(0)}%)`, 110, y);
      }
      y += 7;
    }

    if (data.possibleCondition) {
      doc.text(`• Screened Condition: ${data.possibleCondition}`, 18, y);
      if (data.severity) {
        doc.text(`  (Severity: ${data.severity.toUpperCase()})`, 110, y);
      }
      y += 7;
    }

    if (!data.bcsScore && !data.possibleCondition) {
      doc.text(`• Analysis Type: ${data.analysisType.toUpperCase()} - Complete`, 18, y);
      y += 7;
    }

    y += 5;

    // Observations & AI Reply Suggestions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('2. AI Clinical Observations & Suggestions', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    const observationsList = data.observations && data.observations.length > 0 
      ? data.observations 
      : ['No abnormal physical signs detected during scan.'];

    doc.setFont('helvetica', 'bold');
    doc.text('Key Observations:', 18, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    observationsList.forEach(obs => {
      const splitObs = doc.splitTextToSize(`• ${obs}`, pageWidth - 36);
      doc.text(splitObs, 22, y);
      y += splitObs.length * 5;
    });

    y += 4;

    const recommendationsList = data.recommendations && data.recommendations.length > 0 
      ? data.recommendations 
      : ['Maintain normal balanced ration and monitor daily water intake.'];

    doc.setFont('helvetica', 'bold');
    doc.text('Actionable Recommendations:', 18, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    recommendationsList.forEach(rec => {
      const splitRec = doc.splitTextToSize(`• ${rec}`, pageWidth - 36);
      doc.text(splitRec, 22, y);
      y += splitRec.length * 5;
    });

    if (data.aiSuggestions) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('AI Veterinary Assistant Reply:', 18, y);
      y += 6;
      doc.setFont('helvetica', 'italic');
      const splitReply = doc.splitTextToSize(data.aiSuggestions, pageWidth - 36);
      doc.text(splitReply, 22, y);
      y += splitReply.length * 5;
    }

    y += 8;

    // Recommended Products Section
    if (data.recommendedProducts && data.recommendedProducts.length > 0) {
      // Check if page overflow
      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text('3. Recommended Nutritional & Veterinary Products', 14, y);
      y += 8;

      doc.setFontSize(10);
      data.recommendedProducts.forEach((prod, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${prod.name} — ₹${prod.price.toLocaleString('en-IN')}`, 18, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`   Category: ${prod.category}`, 18, y);
        y += 5;
        if (prod.description) {
          const splitDesc = doc.splitTextToSize(`   ${prod.description}`, pageWidth - 36);
          doc.text(splitDesc, 18, y);
          y += splitDesc.length * 5;
        }
        y += 3;
      });
    }

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Chimertech AI Cattle Diagnostic System — Page ${i} of ${pageCount}`,
        pageWidth / 2,
        287,
        { align: 'center' }
      );
    }

    doc.save(`Cattle_Health_Report_${data.requestId.slice(0, 8)}.pdf`);
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
      <title>Cattle Health Diagnostic Report - ${data.requestId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: auto; }
        .header { background: #10b981; color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
        .header h1 { margin: 0; font-size: 22px; }
        .meta { color: #64748b; font-size: 13px; margin-bottom: 25px; line-height: 1.6; }
        .section-title { font-size: 16px; font-weight: 700; color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px; }
        .badge { background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; }
        ul { padding-left: 20px; line-height: 1.7; }
        .product-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="background:#10b981;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;margin-bottom:20px;">Download / Print PDF</button>
      <div class="header">
        <h1>CHIMERTECH — CATTLE HEALTH & BCS DIAGNOSTIC REPORT</h1>
      </div>
      <div class="meta">
        <strong>Report ID:</strong> ${data.requestId}<br/>
        <strong>Date:</strong> ${data.date}<br/>
        ${data.userEmail ? `<strong>User:</strong> ${data.userName || 'Cattle Owner'} (${data.userEmail})<br/>` : ''}
      </div>

      <div class="section-title">1. Diagnostic Overview</div>
      <p>
        ${data.bcsScore !== undefined ? `<strong>BCS Score:</strong> <span class="badge">${data.bcsScore.toFixed(1)} / 5.0</span> ` : ''}
        ${data.possibleCondition ? `<strong>Screened Condition:</strong> <span class="badge">${data.possibleCondition}</span> ` : ''}
        ${data.severity ? `<strong>Severity:</strong> ${data.severity}` : ''}
      </p>

      <div class="section-title">2. AI Clinical Observations & Suggestions</div>
      <h4>Observations:</h4>
      <ul>
        ${(data.observations || ['No abnormal physical signs detected']).map(o => `<li>${o}</li>`).join('')}
      </ul>

      <h4>Recommendations:</h4>
      <ul>
        ${(data.recommendations || ['Maintain normal balanced ration']).map(r => `<li>${r}</li>`).join('')}
      </ul>

      ${data.aiSuggestions ? `<h4>AI Veterinary Assistant Reply:</h4><blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #10b981;margin:0;">${data.aiSuggestions}</blockquote>` : ''}

      ${data.recommendedProducts && data.recommendedProducts.length > 0 ? `
        <div class="section-title">3. Recommended Products</div>
        ${data.recommendedProducts.map(p => `
          <div class="product-card">
            <strong>${p.name}</strong> — ₹${p.price.toLocaleString('en-IN')}<br/>
            <small style="color:#64748b;">${p.category}</small>
            ${p.description ? `<p style="margin:5px 0 0 0;font-size:13px;">${p.description}</p>` : ''}
          </div>
        `).join('')}
      ` : ''}
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}
