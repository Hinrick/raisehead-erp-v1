import PDFDocument from 'pdfkit';
import type { Quotation, Client, QuotationItem } from '@prisma/client';
import { config } from '../../../config/index.js';

type QuotationWithRelations = Quotation & {
  client: Client;
  items: QuotationItem[];
};

export async function generateQuotationPdf(quotation: QuotationWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `報價單 - ${quotation.quotationNumber}`,
        Author: config.company.name,
        Subject: quotation.projectName,
      },
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register fonts for Chinese support
    // Note: For production, you should add a Chinese font file (e.g., Noto Sans CJK)
    // doc.registerFont('Chinese', 'path/to/NotoSansCJK-Regular.ttf');

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    drawHeader(doc, pageWidth);

    // Client Info (甲方)
    drawClientSection(doc, quotation.client, pageWidth);

    // Provider Info (乙方)
    drawProviderSection(doc, quotation, pageWidth);

    // Items Table
    drawItemsTable(doc, quotation.items, pageWidth);

    // Pricing Summary
    drawPricingSummary(doc, quotation, pageWidth);

    // Payment Info
    drawPaymentInfo(doc, pageWidth);

    // Terms (if any)
    if (quotation.notes) {
      drawTerms(doc, quotation.notes, pageWidth);
    }

    doc.end();
  });
}

function drawHeader(doc: PDFKit.PDFDocument, pageWidth: number) {
  const centerX = doc.page.margins.left + pageWidth / 2;

  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(config.company.name, doc.page.margins.left, 50, {
       width: pageWidth,
       align: 'center',
     });

  doc.moveDown(0.5);

  doc.fontSize(18)
     .font('Helvetica')
     .text('合作契約書 / Quotation', {
       width: pageWidth,
       align: 'center',
     });

  doc.moveDown(1);

  // Horizontal line
  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.margins.left + pageWidth, doc.y)
     .stroke();

  doc.moveDown(1);
}

function drawClientSection(doc: PDFKit.PDFDocument, client: Client, pageWidth: number) {
  const startY = doc.y;
  const labelWidth = 100;
  const valueWidth = pageWidth / 2 - labelWidth - 20;

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('甲方 (Client)', doc.page.margins.left, startY);

  doc.moveDown(0.5);

  const leftColX = doc.page.margins.left;
  const rightColX = doc.page.margins.left + pageWidth / 2 + 10;
  let currentY = doc.y;

  // Left column
  drawLabelValue(doc, '公司名稱:', client.companyName, leftColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '統一編號:', client.taxId || '-', leftColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '聯絡人:', client.contactName, leftColX, currentY, labelWidth);

  // Right column
  currentY = doc.y - 60;
  drawLabelValue(doc, '電子郵件:', client.email || '-', rightColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '地址:', client.address || '-', rightColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '電話:', client.phone || '-', rightColX, currentY, labelWidth);

  doc.y = currentY + 30;
  doc.moveDown(1);
}

function drawProviderSection(doc: PDFKit.PDFDocument, quotation: QuotationWithRelations, pageWidth: number) {
  const labelWidth = 100;

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('乙方 (Provider)', doc.page.margins.left, doc.y);

  doc.moveDown(0.5);

  const leftColX = doc.page.margins.left;
  const rightColX = doc.page.margins.left + pageWidth / 2 + 10;
  let currentY = doc.y;

  // Left column
  drawLabelValue(doc, '專案名稱:', quotation.projectName, leftColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '報價單號:', quotation.quotationNumber, leftColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '報價日期:', formatDate(quotation.quotationDate), leftColX, currentY, labelWidth);

  // Right column
  currentY = doc.y - 60;
  drawLabelValue(doc, '公司名稱:', config.company.name, rightColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '統一編號:', config.company.taxId, rightColX, currentY, labelWidth);
  currentY += 20;
  drawLabelValue(doc, '電子郵件:', config.company.email, rightColX, currentY, labelWidth);

  doc.y = currentY + 30;
  doc.moveDown(1);

  // Horizontal line
  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.margins.left + pageWidth, doc.y)
     .stroke();

  doc.moveDown(1);
}

function drawItemsTable(doc: PDFKit.PDFDocument, items: QuotationItem[], pageWidth: number) {
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('內容細項 (Items)', doc.page.margins.left, doc.y);

  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = {
    number: 50,
    description: pageWidth - 50 - 100,
    amount: 100,
  };

  // Table header
  const headerY = tableTop;
  doc.fontSize(10)
     .font('Helvetica-Bold');

  doc.rect(doc.page.margins.left, headerY, pageWidth, 25)
     .fillAndStroke('#f0f0f0', '#000');

  doc.fillColor('#000')
     .text('項次', doc.page.margins.left + 5, headerY + 8, { width: colWidths.number - 10 })
     .text('內容描述', doc.page.margins.left + colWidths.number + 5, headerY + 8, { width: colWidths.description - 10 })
     .text('金額 (NT$)', doc.page.margins.left + colWidths.number + colWidths.description + 5, headerY + 8, { width: colWidths.amount - 10, align: 'right' });

  // Table rows
  let currentY = headerY + 25;
  doc.font('Helvetica').fontSize(10);

  for (const item of items) {
    const rowHeight = calculateRowHeight(doc, item, colWidths.description - 10);

    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 100) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    // Draw row border
    doc.rect(doc.page.margins.left, currentY, pageWidth, rowHeight)
       .stroke();

    // Draw cell content
    doc.text(item.itemNumber.toString(), doc.page.margins.left + 5, currentY + 5, { width: colWidths.number - 10 });

    let descY = currentY + 5;
    doc.text(item.description, doc.page.margins.left + colWidths.number + 5, descY, { width: colWidths.description - 10 });

    if (item.details) {
      doc.fontSize(8)
         .fillColor('#666')
         .text(item.details, doc.page.margins.left + colWidths.number + 5, doc.y + 2, { width: colWidths.description - 10 });
      doc.fontSize(10).fillColor('#000');
    }

    doc.text(formatCurrency(Number(item.amount)), doc.page.margins.left + colWidths.number + colWidths.description + 5, currentY + 5, { width: colWidths.amount - 10, align: 'right' });

    currentY += rowHeight;
  }

  doc.y = currentY + 10;
}

function drawPricingSummary(doc: PDFKit.PDFDocument, quotation: QuotationWithRelations, pageWidth: number) {
  const summaryWidth = 250;
  const startX = doc.page.margins.left + pageWidth - summaryWidth;
  let currentY = doc.y;

  doc.fontSize(11).font('Helvetica');

  // Original total
  doc.text('原價總計 (未稅):', startX, currentY, { width: 150 })
     .text(formatCurrency(Number(quotation.originalTotal)), startX + 150, currentY, { width: 100, align: 'right' });

  currentY += 25;

  // Discounted total
  doc.font('Helvetica-Bold')
     .fontSize(12);

  const taxLabel = quotation.taxIncluded ? '(含稅)' : '(未稅)';
  doc.text(`專案優惠價 ${taxLabel}:`, startX, currentY, { width: 150 })
     .text(formatCurrency(Number(quotation.discountedTotal)), startX + 150, currentY, { width: 100, align: 'right' });

  doc.y = currentY + 30;
  doc.moveDown(1);
}

function drawPaymentInfo(doc: PDFKit.PDFDocument, pageWidth: number) {
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('匯款資訊 (Payment Information)', doc.page.margins.left, doc.y);

  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  const labelWidth = 80;
  let currentY = doc.y;

  drawLabelValue(doc, '銀行:', config.company.bank, doc.page.margins.left, currentY, labelWidth);
  currentY += 18;
  drawLabelValue(doc, '帳號:', `(${config.company.bankCode})${config.company.bankAccount}`, doc.page.margins.left, currentY, labelWidth);
  currentY += 18;
  drawLabelValue(doc, '戶名:', config.company.name, doc.page.margins.left, currentY, labelWidth);
  currentY += 18;
  drawLabelValue(doc, '統一編號:', config.company.taxId, doc.page.margins.left, currentY, labelWidth);

  doc.y = currentY + 20;
}

function drawTerms(doc: PDFKit.PDFDocument, notes: string, pageWidth: number) {
  // Check if we need a new page
  if (doc.y > doc.page.height - doc.page.margins.bottom - 150) {
    doc.addPage();
  }

  doc.moveDown(1);

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('備註 / 條款 (Terms & Conditions)', doc.page.margins.left, doc.y);

  doc.moveDown(0.5);

  doc.fontSize(9)
     .font('Helvetica')
     .text(notes, doc.page.margins.left, doc.y, {
       width: pageWidth,
       align: 'left',
     });
}

// Helper functions
function drawLabelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, labelWidth: number) {
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text(label, x, y, { width: labelWidth, continued: false });

  doc.font('Helvetica')
     .text(value, x + labelWidth, y);
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

function calculateRowHeight(doc: PDFKit.PDFDocument, item: QuotationItem, maxWidth: number): number {
  const descHeight = doc.heightOfString(item.description, { width: maxWidth });
  const detailsHeight = item.details ? doc.heightOfString(item.details, { width: maxWidth }) + 5 : 0;
  return Math.max(30, descHeight + detailsHeight + 15);
}
