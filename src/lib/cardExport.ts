import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Member } from '../types/database';

// Standard CR80 dimensions in millimeters
export const CR80_WIDTH_MM = 85.6;
export const CR80_HEIGHT_MM = 53.98;

/**
 * Captures an element using html2canvas with high scale for 300+ DPI sharpness
 */
export async function captureCardElement(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // 3x scale ensures crisp text, sharp QR codes and graphics
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to capture card element:', err);
    return null;
  }
}

/**
 * Downloads a single member card as a standard CR80 printable PDF (Front & Back)
 */
export async function downloadMemberCardPdf(member: Member): Promise<boolean> {
  const frontImg = await captureCardElement(`card-front-${member.id}`);
  const backImg = await captureCardElement(`card-back-${member.id}`);

  if (!frontImg) {
    alert('Unable to capture the membership card. Please ensure it is visible on screen.');
    return false;
  }

  try {
    // Landscape PDF with exact CR80 dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CR80_WIDTH_MM, CR80_HEIGHT_MM],
    });

    // Page 1: Front
    pdf.addImage(frontImg, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');

    // Page 2: Back (if available)
    if (backImg) {
      pdf.addPage([CR80_WIDTH_MM, CR80_HEIGHT_MM], 'landscape');
      pdf.addImage(backImg, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');
    }

    const safeName = member.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`MYC_Card_${member.membership_number}_${safeName}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating card PDF:', err);
    return false;
  }
}

/**
 * Downloads multiple membership cards laid out neatly on A4 sheets for batch printing
 */
export async function downloadBatchCardsA4Pdf(members: Member[]): Promise<boolean> {
  if (members.length === 0) return false;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // A4 dimensions: 210 x 297 mm
    // Margin: 15mm left/right, 15mm top
    // 2 columns x 4 rows = 8 cards per sheet
    const marginX = 14;
    const marginY = 15;
    const gapX = 10;
    const gapY = 12;

    let currentCardIndex = 0;

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const frontImg = await captureCardElement(`card-front-${member.id}`);
      if (!frontImg) continue;

      const pagePos = currentCardIndex % 8;
      if (currentCardIndex > 0 && pagePos === 0) {
        pdf.addPage('a4', 'portrait');
      }

      const col = pagePos % 2;
      const row = Math.floor(pagePos / 2);

      const x = marginX + col * (CR80_WIDTH_MM + gapX);
      const y = marginY + row * (CR80_HEIGHT_MM + gapY);

      // Draw light cutting outline
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.rect(x - 0.5, y - 0.5, CR80_WIDTH_MM + 1, CR80_HEIGHT_MM + 1);

      pdf.addImage(frontImg, 'PNG', x, y, CR80_WIDTH_MM, CR80_HEIGHT_MM, undefined, 'FAST');

      currentCardIndex++;
    }

    pdf.save(`MYC_Membership_Cards_Batch_${Date.now()}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating batch PDF:', err);
    return false;
  }
}
