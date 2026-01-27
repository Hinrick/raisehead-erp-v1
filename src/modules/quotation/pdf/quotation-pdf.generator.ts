import PDFDocument from 'pdfkit';
import type { Quotation, Client, QuotationItem, PaymentTerm, QuotationNote } from '@prisma/client';
import { config } from '../../../config/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../../../../assets');
const FONT_REGULAR = path.join(ASSETS_DIR, 'fonts/NotoSansTC-Regular.otf');
const FONT_BOLD = path.join(ASSETS_DIR, 'fonts/NotoSansTC-Bold.otf');
const STAMP_PATH = path.join(ASSETS_DIR, 'company_stamp.png');

// Modern light purple theme
const C = {
  purple: '#6D28D9',
  purpleDark: '#4C1D95',
  indigo: '#4338CA',
  teal: '#0D9488',
  green: '#059669',
  pageBg: '#F3F4F6',
  cardBg: '#F9FAFB',
  termsBg: '#EEF2FF',
  purpleLight: '#F5F3FF',
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  text: '#1F2937',
  textLight: '#6B7280',
  textFaint: '#9CA3AF',
  watermark: '#E5E7EB',
  white: '#FFFFFF',
};

type QuotationWithRelations = Quotation & {
  client: Client;
  items: QuotationItem[];
  paymentTerms: PaymentTerm[];
  notes: QuotationNote[];
};

/** Split text into lines that fit within maxWidth. All rendering uses lineBreak:false. */
function wrapText(doc: PDFKit.PDFDocument, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    const test = current + ch;
    if (doc.widthOfString(test) > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Render wrapped text lines at (x, y) with lineBreak:false. Returns total height used. */
function drawWrappedText(
  doc: PDFKit.PDFDocument, text: string, x: number, y: number,
  maxWidth: number, lineH: number,
): number {
  const lines = wrapText(doc, text, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], x, y + i * lineH, { lineBreak: false });
  }
  return lines.length * lineH;
}

/** Measure how tall wrapped text will be */
function measureWrapped(doc: PDFKit.PDFDocument, text: string, maxWidth: number, lineH: number): number {
  return wrapText(doc, text, maxWidth).length * lineH;
}

export async function generateQuotationPdf(quotation: QuotationWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: false,
      info: {
        Title: `報價單 - ${quotation.quotationNumber}`,
        Author: config.company.name,
        Subject: quotation.projectName,
      },
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('TC', FONT_REGULAR);
    doc.registerFont('TC-Bold', FONT_BOLD);

    // Add first page manually (prevents auto page-break issues)
    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

    const fullW = doc.page.width;   // 595.28
    const fullH = doc.page.height;  // 841.89
    const ml = 50;
    const pw = fullW - ml * 2;
    let y = 0;

    function newPage() {
      doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      doc.rect(0, 0, fullW, fullH).fill(C.pageBg);
      drawGradientBar(doc, 0, 6, fullW);
      y = 30;
    }

    // ── PAGE BACKGROUND ────────────────────────────
    doc.rect(0, 0, fullW, fullH).fill(C.pageBg);

    // ── GRADIENT BAR AT TOP ────────────────────────
    drawGradientBar(doc, 0, 6, fullW);
    y = 30;

    // ── COMPANY HEADER ─────────────────────────────
    const logoSize = 36;
    doc.roundedRect(ml, y, logoSize, logoSize, 8).fill(C.purple);
    doc.fontSize(22).font('TC-Bold').fillColor(C.white);
    const logoTextH = doc.heightOfString('抬', { width: logoSize });
    doc.text('抬', ml, y + (logoSize - logoTextH) / 2, { width: logoSize, align: 'center', lineBreak: false });

    doc.fontSize(18).font('TC-Bold').fillColor(C.text);
    doc.text(config.company.name, ml + logoSize + 12, y + 6, { lineBreak: false });

    doc.fontSize(36).font('TC-Bold').fillColor(C.watermark);
    doc.text('QUOTATION', ml + pw - 270, y - 6, { width: 270, align: 'right', lineBreak: false });

    y += logoSize + 8;

    // Company details
    doc.fontSize(8.5).font('TC').fillColor(C.textLight);
    doc.text(`統一編號：${config.company.taxId}`, ml, y, { lineBreak: false });

    const riX = ml + pw - 170;
    doc.fontSize(8.5).font('TC').fillColor(C.textLight);
    doc.text('報價單號', riX, y, { lineBreak: false });
    doc.fontSize(11).font('TC-Bold').fillColor(C.text);
    doc.text(quotation.quotationNumber, riX + 58, y - 1, { lineBreak: false });

    y += 14;
    if (config.company.email) {
      doc.fontSize(8.5).font('TC').fillColor(C.textLight);
      doc.text(`電子郵件：${config.company.email}`, ml, y, { lineBreak: false });
    }
    doc.fontSize(8.5).font('TC').fillColor(C.textLight);
    doc.text('報價日期', riX, y, { lineBreak: false });
    doc.fontSize(11).font('TC-Bold').fillColor(C.text);
    doc.text(formatDate(quotation.quotationDate), riX + 58, y - 1, { lineBreak: false });

    y += 14;
    if (config.company.address) {
      doc.fontSize(8.5).font('TC').fillColor(C.textLight);
      doc.text(config.company.address, ml, y, { lineBreak: false });
    }

    y += 20;

    // ── DIVIDER ────────────────────────────────────
    doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(0.5).strokeColor(C.borderDark).stroke();
    y += 20;

    // ── CLIENT INFO + PROJECT DETAILS ──────────────
    const halfW = pw * 0.48;
    const rightX = ml + pw - halfW;

    doc.fontSize(9).font('TC-Bold').fillColor(C.indigo);
    doc.text('客戶資料 CLIENT INFO', ml, y, { lineBreak: false });
    doc.text('專案內容 PROJECT DETAILS', rightX, y, { lineBreak: false });
    y += 20;

    const clientStartY = y;
    doc.fontSize(14).font('TC-Bold').fillColor(C.text);
    doc.text(quotation.client.companyName, ml, y, { lineBreak: false });
    y += 24;

    const clblW = 55;
    const clientFields: [string, string][] = [
      ['統一編號', quotation.client.taxId || '-'],
      ['聯絡窗口', quotation.client.contactName],
      ['電子郵件', quotation.client.email || '-'],
      ['聯絡電話', quotation.client.phone || '-'],
    ];
    for (const [label, value] of clientFields) {
      doc.fontSize(8.5).font('TC').fillColor(C.textLight);
      doc.text(label, ml, y, { lineBreak: false });
      doc.fontSize(9).font('TC').fillColor(C.text);
      doc.text(value, ml + clblW, y, { lineBreak: false });
      y += 16;
    }

    // Project card
    const projW = halfW - 30;
    doc.fontSize(14).font('TC-Bold');
    const projLines = wrapText(doc, quotation.projectName, projW);
    const projTextH = projLines.length * 20;
    const cardH = Math.max(65, 30 + projTextH + 12);

    doc.roundedRect(rightX, clientStartY, halfW, cardH, 6).fill(C.cardBg);
    doc.fontSize(8.5).font('TC').fillColor(C.textLight);
    doc.text('專案名稱', rightX + 15, clientStartY + 12, { lineBreak: false });
    doc.fontSize(14).font('TC-Bold').fillColor(C.text);
    for (let i = 0; i < projLines.length; i++) {
      doc.text(projLines[i], rightX + 15, clientStartY + 30 + i * 20, { lineBreak: false });
    }

    y += 10;

    // ── DIVIDER ────────────────────────────────────
    doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(0.5).strokeColor(C.borderDark).stroke();
    y += 20;

    // ── ITEMS TABLE ────────────────────────────────
    const numW = 40;
    const amtW = 80;
    const descW = pw - numW - amtW;
    const descTextW = descW - 10;
    const descLineH = 14;
    const detLineH = 12;

    // Header
    doc.fontSize(8.5).font('TC-Bold').fillColor(C.textLight);
    doc.text('#', ml + 5, y, { lineBreak: false });
    doc.text('項目內容 (DESCRIPTION)', ml + numW, y, { lineBreak: false });
    doc.text('金額 (NT$)', ml + numW + descW, y, { width: amtW, align: 'right', lineBreak: false });
    y += 14;
    doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(0.5).strokeColor(C.borderDark).stroke();
    y += 5;

    // Rows
    for (let i = 0; i < quotation.items.length; i++) {
      const item = quotation.items[i];

      // Measure row height using manual wrapping
      doc.fontSize(10).font('TC-Bold');
      const descLines = wrapText(doc, item.description, descTextW);
      const descH = descLines.length * descLineH;

      let detLines: string[] = [];
      let detH = 0;
      if (item.details) {
        doc.fontSize(8.5).font('TC');
        detLines = wrapText(doc, item.details, descTextW);
        detH = detLines.length * detLineH + 3;
      }
      const rowH = Math.max(38, descH + detH + 18);

      // Page break check for items
      if (y + rowH > fullH - 100) {
        newPage();
      }

      // Alternating row bg
      if (i % 2 === 1) {
        doc.roundedRect(ml - 8, y, pw + 16, rowH, 4).fill(C.purpleLight);
      }

      // Number
      doc.fontSize(11).font('TC').fillColor(C.textFaint);
      doc.text(String(item.itemNumber).padStart(2, '0'), ml + 5, y + 10, { lineBreak: false });

      // Description (manual wrapping)
      doc.fontSize(10).font('TC-Bold').fillColor(C.text);
      for (let j = 0; j < descLines.length; j++) {
        doc.text(descLines[j], ml + numW, y + 8 + j * descLineH, { lineBreak: false });
      }

      // Details (manual wrapping)
      if (item.details && detLines.length > 0) {
        const detY = y + 8 + descH + 3;
        doc.fontSize(8.5).font('TC').fillColor(C.textLight);
        for (let j = 0; j < detLines.length; j++) {
          doc.text(detLines[j], ml + numW, detY + j * detLineH, { lineBreak: false });
        }
      }

      // Amount
      doc.fontSize(10).font('TC').fillColor(C.text);
      doc.text(formatCurrency(Number(item.amount)), ml + numW + descW, y + 10, {
        width: amtW, align: 'right', lineBreak: false,
      });

      y += rowH;

      if (i < quotation.items.length - 1) {
        doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(0.3).strokeColor(C.border).stroke();
      }
      y += 4;
    }

    y += 18;

    // ── TERMS + PRICING (side by side) ─────────────
    const termsBoxW = pw * 0.44;
    const bulletW = termsBoxW - 30;
    const bulletLineH = 13;
    const priceSectionX = ml + pw * 0.50;
    const priceSectionW = pw * 0.50;

    const ptLines = quotation.paymentTerms.map(pt => pt.content);
    const noteLines = quotation.notes.map(n => n.content);
    const hasPT = ptLines.length > 0;
    const hasNotes = noteLines.length > 0;
    const hasTerms = hasPT || hasNotes;

    // Pre-measure terms box height
    let termsH = 0;
    const ptWrapped: string[][] = [];
    const noteWrapped: string[][] = [];

    if (hasTerms) {
      doc.fontSize(8.5).font('TC');
      for (const line of ptLines) {
        const wrapped = wrapText(doc, '•   ' + line, bulletW);
        ptWrapped.push(wrapped);
        termsH += wrapped.length * bulletLineH + 6;
      }
      for (const line of noteLines) {
        const wrapped = wrapText(doc, '•   ' + line, bulletW);
        noteWrapped.push(wrapped);
        termsH += wrapped.length * bulletLineH + 6;
      }
      termsH += 16 + (hasPT ? 22 : 0) + (hasNotes ? 22 : 0);
      termsH = Math.max(65, termsH);
    }

    // Check if terms+pricing fits on this page (don't require bank section to fit too)
    const pricingH = 65;
    const termsAndPricingH = Math.max(hasTerms ? termsH : 0, pricingH);
    if (y + termsAndPricingH > fullH - 30) {
      newPage();
    }

    // Pricing (right side)
    doc.fontSize(9.5).font('TC').fillColor(C.textLight);
    doc.text('原價總計 (未稅)', priceSectionX, y + 2, { lineBreak: false });
    doc.fontSize(10).font('TC').fillColor(C.text);
    doc.text(formatCurrency(Number(quotation.originalTotal)), priceSectionX + priceSectionW - 100, y + 1, {
      width: 100, align: 'right', lineBreak: false,
    });

    const priceY1 = y + 24;
    const taxIncludedTotal = Math.round(Number(quotation.originalTotal) * 1.05);
    doc.fontSize(9.5).font('TC-Bold').fillColor(C.green);
    doc.text('原價總計(含稅)', priceSectionX, priceY1, { lineBreak: false });

    doc.fontSize(24).font('TC-Bold').fillColor(C.text);
    doc.text(formatCurrency(taxIncludedTotal), priceSectionX, priceY1 + 18, {
      width: priceSectionW, align: 'right', lineBreak: false,
    });

    // Terms box (left side)
    if (hasTerms) {
      doc.roundedRect(ml, y - 2, termsBoxW, termsH, 8).fill(C.termsBg);

      let ny = y + 10;

      if (hasPT) {
        doc.fontSize(9.5).font('TC-Bold').fillColor(C.indigo);
        doc.text('付款條件 Payment Terms', ml + 15, ny, { lineBreak: false });
        ny += 22;
        doc.fontSize(8.5).font('TC').fillColor(C.indigo);
        for (const lines of ptWrapped) {
          for (let j = 0; j < lines.length; j++) {
            doc.text(lines[j], ml + 15, ny + j * bulletLineH, { lineBreak: false });
          }
          ny += lines.length * bulletLineH + 6;
        }
      }

      if (hasNotes) {
        doc.fontSize(9.5).font('TC-Bold').fillColor(C.indigo);
        doc.text('備註 Notes', ml + 15, ny, { lineBreak: false });
        ny += 22;
        doc.fontSize(8.5).font('TC').fillColor(C.indigo);
        for (const lines of noteWrapped) {
          for (let j = 0; j < lines.length; j++) {
            doc.text(lines[j], ml + 15, ny + j * bulletLineH, { lineBreak: false });
          }
          ny += lines.length * bulletLineH + 6;
        }
      }
    }

    y += Math.max(hasTerms ? termsH : 0, pricingH) + 20;

    // Check if bank+signatures+footer fits on this page
    const bankSigFooterH = 130;
    if (y + bankSigFooterH > fullH - 30) {
      newPage();
    }

    // ── BANK DETAILS + SIGNATURES ──────────────────
    doc.fontSize(11).font('TC-Bold').fillColor(C.text);
    doc.text('匯款資訊 Bank Details', ml, y, { lineBreak: false });
    y += 20;

    const bankMatch = config.company.bank.match(/^(.+?)[\(（](.+?)[\)）]$/);
    const bankName = bankMatch ? bankMatch[1] : config.company.bank;
    const bankBranch = bankMatch ? bankMatch[2] : '';

    const bLblW = 55;
    const bankStartY = y;
    const bankFields: [string, string][] = [
      ['銀行代碼', `${bankName} (${config.company.bankCode})`],
      ['分行', bankBranch],
      ['戶名', config.company.name],
      ['帳號', config.company.bankAccount],
    ];
    for (const [label, value] of bankFields) {
      doc.fontSize(8.5).font('TC').fillColor(C.textLight);
      doc.text(label, ml, y, { lineBreak: false });
      doc.fontSize(9).font('TC').fillColor(C.text);
      doc.text(value, ml + bLblW, y, { lineBreak: false });
      y += 16;
    }

    // Signature areas (right side)
    const sigBaseX = priceSectionX;
    const sigW = (priceSectionW - 30) / 2;
    const sig1X = sigBaseX;
    const sig2X = sigBaseX + sigW + 30;

    doc.moveTo(sigBaseX, bankStartY + 50).lineTo(sigBaseX + priceSectionW, bankStartY + 50)
       .lineWidth(0.5).strokeColor(C.borderDark).stroke();

    // Stamp
    const stampExists = fs.existsSync(STAMP_PATH);
    if (stampExists) {
      const stW = 128;
      const stCx = sig2X + sigW / 2;
      const stCy = bankStartY + 55;
      doc.save();
      doc.translate(stCx, stCy);
      doc.rotate(-8);
      doc.image(STAMP_PATH, -stW / 2, -stW / 2, { fit: [stW, stW] });
      doc.restore();
    }

    // Signature labels
    doc.fontSize(8).font('TC').fillColor(C.textLight);
    doc.text('甲方簽章 Client', sig1X, bankStartY + 56, { width: sigW, align: 'center', lineBreak: false });
    doc.text('Signature', sig1X, bankStartY + 68, { width: sigW, align: 'center', lineBreak: false });
    doc.text('乙方簽章 Provider', sig2X, bankStartY + 56, { width: sigW, align: 'center', lineBreak: false });
    doc.text('Signature', sig2X, bankStartY + 68, { width: sigW, align: 'center', lineBreak: false });

    y = Math.max(y, bankStartY + 85);

    // ── FOOTER ─────────────────────────────────────
    y += 10;
    doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(0.5).strokeColor(C.border).stroke();

    doc.fontSize(8.5).font('TC').fillColor(C.textLight);
    doc.text('感謝您的合作與信任！ Thank you for your business.', ml, y + 12, {
      width: pw, align: 'center', lineBreak: false,
    });

    doc.end();
  });
}

function drawGradientBar(doc: PDFKit.PDFDocument, y: number, h: number, w: number) {
  const steps = 60;
  const sw = w / steps;
  const stops = [
    [124, 58, 237],
    [99, 102, 241],
    [59, 130, 246],
    [6, 182, 212],
  ];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const si = Math.min(Math.floor(t * (stops.length - 1)), stops.length - 2);
    const lt = t * (stops.length - 1) - si;
    const r = Math.round(stops[si][0] + (stops[si + 1][0] - stops[si][0]) * lt);
    const g = Math.round(stops[si][1] + (stops[si + 1][1] - stops[si][1]) * lt);
    const b = Math.round(stops[si][2] + (stops[si + 1][2] - stops[si][2]) * lt);
    doc.rect(i * sw, y, sw + 0.5, h).fill(`rgb(${r},${g},${b})`);
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
