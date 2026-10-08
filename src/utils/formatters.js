import confetti from 'canvas-confetti';

// Format currency in Indian Numbering System (e.g. ₹ 40,00,000 or ₹ 8,27,450)
export const formatINR = (amount, includeDecimal = false) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹ 0';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimal ? 2 : 0,
    minimumFractionDigits: includeDecimal ? 2 : 0,
  }).format(num);
};

// Compact Indian format: e.g. ₹ 40.00 L, ₹ 3.31 Cr
export const formatCompactINR = (amount) => {
  if (!amount || isNaN(amount)) return '₹ 0';
  const num = Math.abs(Number(amount));
  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹ ${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `₹ ${(num / 1000).toFixed(1)} K`;
  }
  return formatINR(amount);
};

export const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
};

// Export JSON records array as CSV file download
export const exportToCSV = (data, filename = 'al-meezan-export.csv') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export JSON records array as Native Excel format (.xls / .xlsx)
export const exportToExcel = (data, filename = 'al-meezan-report.xls') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; }
      th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 8px 12px; border: 1px solid #cbd5e1; }
      td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11pt; }
      tr:nth-child(even) { background-color: #f8fafc; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const finalFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`;
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Dedicated Professional Print / PDF Report Generator
export const printReport = (data = null, title = 'Audited Financial Report', subtitle = '') => {
  // If data is provided, generate a clean, isolated official document (no website UI screenshots)
  if (data && Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 18px 24px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .org-badge {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .org-name {
            font-size: 20px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .org-sub {
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            margin-top: 2px;
          }
          .report-heading {
            margin-top: 8px;
          }
          .report-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }
          .report-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .meta-box {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .confidential-tag {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: 800;
            font-size: 10px;
            letter-spacing: 0.5px;
            padding: 3px 10px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #1e293b;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #64748b;
            white-space: nowrap;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
            vertical-align: middle;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-right {
            text-align: right;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 600;
          }
          .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="org-name">Zakat System</div>
            <div class="org-sub">2.5% Shariah Audited Accounting • Welfare & Education Fund</div>
            <div class="report-heading">
              <div class="report-title">${title}</div>
              ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
            </div>
          </div>
          <div class="meta-box">
            <div class="confidential-tag">OFFICIAL AUDIT DOCUMENT</div>
            <div>Generated: <strong>${dateStr}</strong></div>
            <div>Total Records: <strong>${data.length}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${headers.map(h => {
                const isNum = h.toLowerCase().includes('inr') || h.toLowerCase().includes('budget') || h.toLowerCase().includes('paid') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('balance') || h.toLowerCase().includes('count') || h.toLowerCase().includes('%') || h.toLowerCase().includes('students');
                return `<th class="${isNum ? 'text-right' : ''}">${h}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(h => {
                  const val = row[h] ?? '';
                  const isNum = h.toLowerCase().includes('inr') || h.toLowerCase().includes('budget') || h.toLowerCase().includes('paid') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('balance') || h.toLowerCase().includes('count') || h.toLowerCase().includes('%') || h.toLowerCase().includes('students');
                  const isCurrency = (h.toLowerCase().includes('inr') || h.toLowerCase().includes('budget') || h.toLowerCase().includes('paid') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('balance')) && (typeof val === 'number' || (!isNaN(Number(val)) && val !== ''));
                  let formattedVal = val;
                  if (isCurrency) {
                    formattedVal = '₹ ' + Number(val).toLocaleString('en-IN');
                  }
                  return `<td class="${isNum ? 'text-right font-mono' : ''}">${formattedVal}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Certified Financial Report • Generated via Zakat System Accounting Engine</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);
    return;
  }

  // Graceful fallback if no dataset is passed
  window.print();
};

// Celebration Confetti for disbursement milestone / One-click Mark as Paid
export const triggerPaidConfetti = () => {
  try {
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#f59e0b', '#3b82f6', '#34d399', '#fcd34d']
    });
  } catch (err) {
    console.error('Confetti error', err);
  }
};
