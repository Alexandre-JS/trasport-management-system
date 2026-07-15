import type { jsPDF } from "jspdf";

const BRAND_BLUE: [number, number, number] = [30, 80, 171];
const TEXT_DARK: [number, number, number] = [15, 23, 42];
const TEXT_MUTED: [number, number, number] = [71, 85, 105];

export async function addPdfHeader(
  pdf: jsPDF,
  title: string,
  subtitle?: string,
) {
  const logo = await imageDataUrl("/lumac-logo.png");
  if (logo) pdf.addImage(logo, "PNG", 18, 13, 54, 18);

  pdf.setTextColor(...BRAND_BLUE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, 192, 20, { align: "right", maxWidth: 108 });
  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...TEXT_MUTED);
    pdf.text(subtitle, 192, 28, { align: "right", maxWidth: 108 });
  }
  pdf.setDrawColor(...BRAND_BLUE);
  pdf.setLineWidth(0.7);
  pdf.line(18, 37, 192, 37);
  pdf.setTextColor(...TEXT_DARK);
  pdf.setFont("helvetica", "normal");
}

export function addPdfFooter(pdf: jsPDF, note: string) {
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.2);
  pdf.line(18, 272, 192, 272);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(note, 18, 278);
  pdf.text("LUMAC Transportes & Logística", 192, 278, { align: "right" });
}

async function imageDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
