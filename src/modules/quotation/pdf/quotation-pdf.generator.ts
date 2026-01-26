import PDFDocument from 'pdfkit';
import type { Quotation, Client, QuotationItem } from '@prisma/client';
import { config } from '../../../config/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../../../../assets');
const FONT_REGULAR = path.join(ASSETS_DIR, 'fonts/NotoSansTC-Regular.otf');
const FONT_BOLD = path.join(ASSETS_DIR, 'fonts/NotoSansTC-Bold.otf');
const STAMP_PATH = path.join(ASSETS_DIR, 'company_stamp.png');

// Light purple theme
const C = {
  purple: '#6D28D9',
  purpleLine: '#8B5CF6',
  purpleBg: '#EDE9FE',
  purpleLight: '#F5F3FF',
  border: '#C4B5FD',
  text: '#1F2937',
  textLight: '#6B7280',
  white: '#FFFFFF',
};

type QuotationWithRelations = Quotation & {
  client: Client;
  items: QuotationItem[];
};

export async function generateQuotationPdf(quotation: QuotationWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
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

    const pw = doc.page.width - 80;
    const ml = 40;
    const pageBottom = doc.page.height - 36;
    let y = 36;

    // ── HEADER ──────────────────────────────────────────
    doc.fontSize(17).font('TC-Bold').fillColor(C.purple);
    doc.text(config.company.name, ml, y, { width: pw, align: 'center', lineBreak: false });
    y += 25;

    doc.fontSize(11).font('TC').fillColor(C.textLight);
    doc.text('合作契約書 / Quotation', ml, y, { width: pw, align: 'center', lineBreak: false });
    y += 18;

    doc.moveTo(ml, y).lineTo(ml + pw, y).lineWidth(1.5).strokeColor(C.purpleLine).stroke();
    y += 12;

    // ── INFO GRID (3 columns: Client / Project / Payment) ──
    const colW = [Math.round(pw * 0.34), Math.round(pw * 0.30), 0];
    colW[2] = pw - colW[0] - colW[1];
    const colX = [ml, ml + colW[0], ml + colW[0] + colW[1]];
    const gHdr = 16;
    const gRow = 13;
    const gPad = 4;
    const lblW = 46;
    const maxRows = 5;
    const gContentH = maxRows * gRow;

    // Header row
    for (let i = 0; i < 3; i++) {
      doc.rect(colX[i], y, colW[i], gHdr).lineWidth(0.5).fillAndStroke(C.purpleBg, C.border);
    }
    doc.fontSize(8).font('TC-Bold').fillColor(C.purple);
    doc.text('甲方 Client', colX[0] + gPad, y + 3.5, { lineBreak: false });
    doc.text('專案 Project', colX[1] + gPad, y + 3.5, { lineBreak: false });
    doc.text('匯款資訊 Payment', colX[2] + gPad, y + 3.5, { lineBreak: false });
    y += gHdr;

    // Content cells
    for (let i = 0; i < 3; i++) {
      doc.rect(colX[i], y, colW[i], gContentH).lineWidth(0.5).fillAndStroke(C.white, C.border);
    }

    const gridInfo: [string, string][][] = [
      [
        ['公司名稱', quotation.client.companyName],
        ['統一編號', quotation.client.taxId || '-'],
        ['聯絡人', quotation.client.contactName],
        ['電子郵件', quotation.client.email || '-'],
        ['電話', quotation.client.phone || '-'],
      ],
      [
        ['專案名稱', quotation.projectName],
        ['報價單號', quotation.quotationNumber],
        ['報價日期', formatDate(quotation.quotationDate)],
      ],
      [
        ['銀行', config.company.bank],
        ['帳號', `(${config.company.bankCode})${config.company.bankAccount}`],
        ['戶名', config.company.name],
        ['統一編號', config.company.taxId],
      ],
    ];

    for (let col = 0; col < 3; col++) {
      let gy = y + 2;
      for (const [label, value] of gridInfo[col]) {
        doc.fontSize(7).font('TC-Bold').fillColor(C.textLight);
        doc.text(label, colX[col] + gPad, gy, { lineBreak: false });
        doc.fontSize(7.5).font('TC').fillColor(C.text);
        doc.text(value, colX[col] + gPad + lblW, gy, {
          width: colW[col] - gPad * 2 - lblW,
          lineBreak: false,
        });
        gy += gRow;
      }
    }
    y += gContentH + 12;

    // ── ITEMS TABLE ───────────────────────────────────
    const numCol = 28;
    const amtCol = 85;
    const descCol = pw - numCol - amtCol;
    const thH = 18;

    // Table header
    drawTableHeader(doc, ml, y, pw, thH, numCol, descCol, amtCol);
    y += thH;

    // Table rows
    const items = quotation.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Measure row height
      doc.fontSize(8.5).font('TC-Bold');
      const descH = doc.heightOfString(item.description, { width: descCol - 12 });
      let detH = 0;
      if (item.details) {
        doc.fontSize(7.5).font('TC');
        detH = doc.heightOfString(item.details, { width: descCol - 12 }) + 2;
      }
      const rh = Math.max(20, descH + detH + 8);

      // Page break if needed (reserve space for pricing/terms/stamp)
      if (y + rh > pageBottom - 130) {
        doc.addPage();
        y = 36;
        drawTableHeader(doc, ml, y, pw, thH, numCol, descCol, amtCol);
        y += thH;
      }

      // Row background (alternating)
      const rowBg = i % 2 === 1 ? C.purpleLight : C.white;
      doc.rect(ml, y, pw, rh).lineWidth(0.5).fillAndStroke(rowBg, C.border);

      // Column dividers
      doc.moveTo(ml + numCol, y).lineTo(ml + numCol, y + rh)
         .lineWidth(0.5).strokeColor(C.border).stroke();
      doc.moveTo(ml + numCol + descCol, y).lineTo(ml + numCol + descCol, y + rh)
         .lineWidth(0.5).strokeColor(C.border).stroke();

      // Item number
      doc.fontSize(8.5).font('TC').fillColor(C.text);
      doc.text(String(item.itemNumber), ml + 2, y + 4, {
        width: numCol - 4, align: 'center', lineBreak: false,
      });

      // Description (bold, wraps)
      doc.fontSize(8.5).font('TC-Bold').fillColor(C.text);
      doc.text(item.description, ml + numCol + 5, y + 4, { width: descCol - 12 });

      // Details (smaller, gray)
      if (item.details) {
        const detY = y + 4 + descH;
        doc.fontSize(7.5).font('TC').fillColor(C.textLight);
        doc.text(item.details, ml + numCol + 5, detY + 1, { width: descCol - 12 });
      }

      // Amount
      doc.fontSize(8.5).font('TC').fillColor(C.text);
      doc.text(formatCurrency(Number(item.amount)), ml + numCol + descCol + 2, y + 4, {
        width: amtCol - 6, align: 'right', lineBreak: false,
      });

      y += rh;
    }

    y += 8;

    // ── PRICING SUMMARY ─────────────────────────────
    const priceX = ml + pw - 240;

    doc.fontSize(9).font('TC').fillColor(C.text);
    doc.text('原價總計 (未稅):', priceX, y, { lineBreak: false });
    doc.text(formatCurrency(Number(quotation.originalTotal)), priceX + 140, y, {
      width: 95, align: 'right', lineBreak: false,
    });
    y += 16;

    const taxLabel = quotation.taxIncluded ? '(含稅)' : '(未稅)';
    doc.fontSize(10).font('TC-Bold').fillColor(C.purple);
    doc.text(`專案優惠價 ${taxLabel}:`, priceX, y, { lineBreak: false });
    doc.text(formatCurrency(Number(quotation.discountedTotal)), priceX + 140, y, {
      width: 95, align: 'right', lineBreak: false,
    });
    y += 20;

    // ── TERMS ────────────────────────────────────────
    if (quotation.notes) {
      doc.moveTo(ml, y).lineTo(ml + pw, y)
         .lineWidth(0.5).strokeColor(C.border).stroke();
      y += 8;

      doc.fontSize(8.5).font('TC-Bold').fillColor(C.purple);
      doc.text('備註 / Terms & Conditions', ml, y, { lineBreak: false });
      y += 14;

      doc.fontSize(7.5).font('TC').fillColor(C.textLight);
      const notesH = doc.heightOfString(quotation.notes, { width: pw });
      doc.text(quotation.notes, ml, y, { width: pw });
      y += notesH + 5;
    }

    // ── STAMP & SIGNATURE ────────────────────────────
    const stampExists = fs.existsSync(STAMP_PATH);
    const stampW = 95;
    const stampH = 88;
    const stampY = Math.max(y + 15, pageBottom - stampH - 25);

    if (stampExists) {
      doc.image(STAMP_PATH, ml + pw - stampW - 5, stampY, {
        fit: [stampW, stampH],
      });
    }

    doc.fontSize(9).font('TC').fillColor(C.text);
    doc.text('甲方簽章：', ml, stampY + stampH - 22, { lineBreak: false });
    doc.moveTo(ml + 52, stampY + stampH - 10)
       .lineTo(ml + 170, stampY + stampH - 10)
       .lineWidth(0.5).strokeColor(C.textLight).stroke();

    doc.end();
  });
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  ml: number, y: number, pw: number, thH: number,
  numCol: number, descCol: number, amtCol: number,
) {
  doc.rect(ml, y, pw, thH).lineWidth(0.5).fillAndStroke(C.purpleBg, C.border);
  doc.fontSize(8).font('TC-Bold').fillColor(C.purple);
  doc.text('#', ml + 2, y + 5, { width: numCol - 4, align: 'center', lineBreak: false });
  doc.text('內容描述', ml + numCol + 5, y + 5, { lineBreak: false });
  doc.text('金額 (NT$)', ml + numCol + descCol + 2, y + 5, {
    width: amtCol - 6, align: 'right', lineBreak: false,
  });
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
