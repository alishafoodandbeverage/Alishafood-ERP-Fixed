import { jsPDF } from "jspdf";

interface SummaryItem {
  label: string;
  value: string;
}

export function generateReportPDF(
  reportTitle: string,
  branchName: string,
  location: string,
  headers: string[],
  rows: string[][],
  summaries: SummaryItem[] = [],
  accentColor: string = "#D31D1D" // default Alisha Red
) {
  // Create instance: A4 size (210 x 297 mm), portrait
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  let currentY = 15;

  // Helper to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 211;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 29;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 29;
    return { r, g, b };
  };

  const brandColor = hexToRgb(accentColor);

  // --- BRAND HEADER BANNER ---
  doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  doc.rect(10, currentY, pageWidth - 20, 30, "F");

  // Title & Subtitle inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ALISHA FOOD & BEVERAGE", 15, currentY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Premium Quality Food & Drinks Manufacturing", 15, currentY + 17);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(`Branch: ${branchName} | Location: ${location}`, 15, currentY + 24);

  currentY += 36;

  // --- REPORT TITLE & DATE ---
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(reportTitle.toUpperCase(), 12, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${today}`, pageWidth - 12, currentY, { align: "right" });

  currentY += 8;

  // Decorative divider line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(10, currentY, pageWidth - 10, currentY);

  currentY += 8;

  // --- SUMMARIES ROW (BENTO BOX STYLE) ---
  if (summaries && summaries.length > 0) {
    const boxWidth = (pageWidth - 20) / summaries.length;
    doc.setFillColor(248, 250, 252); // Slate 50

    summaries.forEach((summary, index) => {
      const boxX = 10 + index * boxWidth;
      doc.rect(boxX, currentY, boxWidth - 2, 16, "F");
      doc.setDrawColor(241, 245, 249);
      doc.rect(boxX, currentY, boxWidth - 2, 16, "S");

      // Label
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(summary.label.toUpperCase(), boxX + 4, currentY + 5);

      // Value
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(summary.value, boxX + 4, currentY + 12);
    });

    currentY += 24;
  }

  // --- TABLE SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  // Calculate dynamic column widths
  const tableWidth = pageWidth - 20;
  const colWidth = tableWidth / headers.length;

  // Draw Table Header Background
  doc.setFillColor(51, 65, 85); // Dark Slate header
  doc.rect(10, currentY, tableWidth, 8, "F");

  // Draw Table Headers text
  doc.setTextColor(255, 255, 255);
  headers.forEach((header, index) => {
    const align = index === headers.length - 1 ? "right" : "left";
    const xPos = align === "right" 
      ? 10 + (index + 1) * colWidth - 4 
      : 10 + index * colWidth + 4;
    doc.text(header, xPos, currentY + 5.5, { align });
  });

  currentY += 8;

  // Draw Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  rows.forEach((row, rowIndex) => {
    // Check page overflow
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 20;

      // Draw table header again on new page
      doc.setFillColor(51, 65, 85);
      doc.rect(10, currentY, tableWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        const align = index === headers.length - 1 ? "right" : "left";
        const xPos = align === "right" 
          ? 10 + (index + 1) * colWidth - 4 
          : 10 + index * colWidth + 4;
        doc.text(header, xPos, currentY + 5.5, { align });
      });
      currentY += 8;
      doc.setFont("helvetica", "normal");
    }

    // Alternating background color
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252); // Slate 50
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(10, currentY, tableWidth, 7.5, "F");

    // Horizontal bottom border
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(10, currentY + 7.5, pageWidth - 10, currentY + 7.5);

    // Draw row values
    doc.setTextColor(71, 85, 105); // Slate 600
    row.forEach((cell, cellIndex) => {
      const align = cellIndex === headers.length - 1 ? "right" : "left";
      const xPos = align === "right" 
        ? 10 + (cellIndex + 1) * colWidth - 4 
        : 10 + cellIndex * colWidth + 4;
      
      // Truncate cell text if it's too long
      const maxTextWidth = colWidth - 6;
      let textToDraw = String(cell);
      if (doc.getTextWidth(textToDraw) > maxTextWidth) {
        textToDraw = doc.splitTextToSize(textToDraw, maxTextWidth)[0] + "...";
      }
      
      doc.text(textToDraw, xPos, currentY + 5.2, { align });
    });

    currentY += 7.5;
  });

  // --- FOOTER BRAND STAMP ---
  currentY += 12;
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  // Footer decorative double-line
  doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
  doc.setLineWidth(0.6);
  doc.line(10, currentY, pageWidth - 10, currentY);
  
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(10, currentY + 1, pageWidth - 10, currentY + 1);

  currentY += 5;

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ALISHA FOOD & BEVERAGE ERP SYSTEM - SECURE INTEL DATA EXPORT", 10, currentY);
  
  doc.text(
    "CONFIDENTIAL REPORT FOR INTERNAL MANAGEMENT ONLY",
    pageWidth - 10,
    currentY,
    { align: "right" }
  );

  // Save the generated PDF
  const filename = `${reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export.pdf`;
  doc.save(filename);
}

export function createReportPDF(
  reportTitle: string,
  branchName: string,
  location: string,
  headers: string[],
  rows: string[][],
  summaries: SummaryItem[] = [],
  accentColor: string = "#D31D1D" // default Alisha Red
) {
  // Create instance: A4 size (210 x 297 mm), portrait
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  let currentY = 15;

  // Helper to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 211;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 29;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 29;
    return { r, g, b };
  };

  const brandColor = hexToRgb(accentColor);

  // --- BRAND HEADER BANNER ---
  doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  doc.rect(10, currentY, pageWidth - 20, 30, "F");

  // Title & Subtitle inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ALISHA FOOD & BEVERAGE", 15, currentY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Premium Quality Food & Drinks Manufacturing", 15, currentY + 17);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(`Branch: ${branchName} | Location: ${location}`, 15, currentY + 24);

  currentY += 36;

  // --- REPORT TITLE & DATE ---
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(reportTitle.toUpperCase(), 12, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${today}`, pageWidth - 12, currentY, { align: "right" });
  currentY += 8;

  // Decorative divider line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(10, currentY, pageWidth - 10, currentY);
  currentY += 8;

  // --- SUMMARIES ROW (BENTO BOX STYLE) ---
  if (summaries && summaries.length > 0) {
    const boxWidth = (pageWidth - 20) / summaries.length;
    doc.setFillColor(248, 250, 252); // Slate 50

    summaries.forEach((summary, index) => {
      const boxX = 10 + index * boxWidth;
      doc.rect(boxX, currentY, boxWidth - 2, 16, "F");
      doc.setDrawColor(241, 245, 249);
      doc.rect(boxX, currentY, boxWidth - 2, 16, "S");

      // Label
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(summary.label.toUpperCase(), boxX + 4, currentY + 5);

      // Value
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(summary.value, boxX + 4, currentY + 12);
    });
    currentY += 24;
  }

  // --- TABLE SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  // Calculate dynamic column widths
  const tableWidth = pageWidth - 20;
  const colWidth = tableWidth / headers.length;

  // Draw Table Header Background
  doc.setFillColor(51, 65, 85); // Dark Slate header
  doc.rect(10, currentY, tableWidth, 8, "F");

  // Draw Table Headers text
  doc.setTextColor(255, 255, 255);
  headers.forEach((header, index) => {
    const align = index === headers.length - 1 ? "right" : "left";
    const xPos = align === "right" 
      ? 10 + (index + 1) * colWidth - 4 
      : 10 + index * colWidth + 4;
    doc.text(header, xPos, currentY + 5.5, { align });
  });

  currentY += 8;

  // Draw Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  rows.forEach((row, rowIndex) => {
    // Check page overflow
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 20;

      // Draw table header again on new page
      doc.setFillColor(51, 65, 85);
      doc.rect(10, currentY, tableWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        const align = index === headers.length - 1 ? "right" : "left";
        const xPos = align === "right" 
          ? 10 + (index + 1) * colWidth - 4 
          : 10 + index * colWidth + 4;
        doc.text(header, xPos, currentY + 5.5, { align });
      });
      currentY += 8;
      doc.setFont("helvetica", "normal");
    }

    // Alternating background color
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252); // Slate 50
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(10, currentY, tableWidth, 7.5, "F");
    
    // Horizontal bottom border
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(10, currentY + 7.5, pageWidth - 10, currentY + 7.5);

    // Draw row values
    doc.setTextColor(71, 85, 105); // Slate 600
    row.forEach((cell, cellIndex) => {
      const align = cellIndex === headers.length - 1 ? "right" : "left";
      const xPos = align === "right" 
        ? 10 + (cellIndex + 1) * colWidth - 4 
        : 10 + cellIndex * colWidth + 4;
      
      // Truncate cell text if it's too long
      const maxTextWidth = colWidth - 6;
      let textToDraw = String(cell);
      if (doc.getTextWidth(textToDraw) > maxTextWidth) {
        textToDraw = doc.splitTextToSize(textToDraw, maxTextWidth)[0] + "...";
      }
      
      doc.text(textToDraw, xPos, currentY + 5.2, { align });
    });

    currentY += 7.5;
  });

  // --- FOOTER BRAND STAMP ---
  currentY += 12;
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  }

  // Footer decorative double-line
  doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
  doc.setLineWidth(0.6);
  doc.line(10, currentY, pageWidth - 10, currentY);
  
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(10, currentY + 1, pageWidth - 10, currentY + 1);

  currentY += 5;

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ALISHA FOOD & BEVERAGE ERP SYSTEM - SECURE INTEL DATA EXPORT", 10, currentY);
  
  doc.text(
    "CONFIDENTIAL REPORT FOR INTERNAL MANAGEMENT ONLY",
    pageWidth - 10,
    currentY,
    { align: "right" }
  );

  return doc;
}

export function generateInvoicePDF(
  branchName: string,
  location: string,
  memoNo: string,
  date: string,
  customerName: string,
  customerAddress: string,
  items: { description: string; quantity: number; rate: number; total: number }[],
  total: number,
  paid: number,
  due: number,
  accentColor: string = "#D31D1D"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5", // Cash memos are often A5
  });

  const pageWidth = 148;
  const pageHeight = 210;
  let currentY = 10;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(branchName.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(location, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // Memo Details
  doc.setFontSize(10);
  doc.text(`Memo No: ${memoNo}`, 10, currentY);
  doc.text(`Date: ${date}`, pageWidth - 10, currentY, { align: "right" });
  currentY += 6;
  doc.line(10, currentY, pageWidth - 10, currentY);
  currentY += 6;

  // Customer Details
  doc.text(`Name: ${customerName}`, 10, currentY);
  currentY += 5;
  doc.text(`Address: ${customerAddress}`, 10, currentY);
  currentY += 8;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(10, currentY, pageWidth - 20, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 12, currentY + 5);
  doc.text("Qty", 80, currentY + 5);
  doc.text("Rate", 100, currentY + 5);
  doc.text("Total", 130, currentY + 5, { align: "right" });
  currentY += 10;

  // Table Rows
  doc.setFont("helvetica", "normal");
  items.forEach((item) => {
    doc.text(item.description, 12, currentY);
    doc.text(item.quantity.toString(), 80, currentY);
    doc.text(item.rate.toString(), 100, currentY);
    doc.text(item.total.toString(), 130, currentY, { align: "right" });
    currentY += 6;
  });

  // Totals
  currentY += 4;
  doc.line(10, currentY, pageWidth - 10, currentY);
  currentY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total:", 100, currentY);
  doc.text(total.toString(), 130, currentY, { align: "right" });
  currentY += 6;
  doc.text("Paid:", 100, currentY);
  doc.text(paid.toString(), 130, currentY, { align: "right" });
  currentY += 6;
  doc.text("Due:", 100, currentY);
  doc.text(due.toString(), 130, currentY, { align: "right" });

  // In Words
  currentY += 10;
  doc.setFont("helvetica", "italic");
  doc.text("In words: _________________________________", 10, currentY);

  // Signature
  currentY += 20;
  doc.setFont("helvetica", "bold");
  doc.text("_________________", pageWidth - 40, currentY);
  doc.text("Authorized Signature", pageWidth - 40, currentY + 5);

  return doc;
}
