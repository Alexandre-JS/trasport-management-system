import type { jsPDF } from "jspdf";

const BRAND_BLUE: [number, number, number] = [30, 80, 171];
const TEXT_DARK: [number, number, number] = [15, 23, 42];
const TEXT_MUTED: [number, number, number] = [71, 85, 105];

// Margem lateral partilhada por cabeçalho, rodapé e tabelas — mantém tudo
// alinhado à mesma coluna, em retrato (210mm) ou paisagem (297mm).
export const PDF_MARGIN = 18;

export async function addPdfHeader(
  pdf: jsPDF,
  title: string,
  subtitle?: string,
) {
  const pageW = pdf.internal.pageSize.getWidth();
  const right = pageW - PDF_MARGIN;

  const logo = await loadImage("/lumac-logo.png");
  if (logo) {
    const h = 18;
    const w = h * (logo.width / logo.height);
    pdf.addImage(logo.dataUrl, "PNG", PDF_MARGIN, 13, w, h);
  }

  pdf.setTextColor(...BRAND_BLUE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, right, 20, { align: "right", maxWidth: pageW * 0.55 });
  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...TEXT_MUTED);
    pdf.text(subtitle, right, 28, { align: "right", maxWidth: pageW * 0.55 });
  }
  pdf.setDrawColor(...BRAND_BLUE);
  pdf.setLineWidth(0.7);
  pdf.line(PDF_MARGIN, 37, right, 37);
  pdf.setTextColor(...TEXT_DARK);
  pdf.setFont("helvetica", "normal");
}

export function addPdfFooter(pdf: jsPDF, note: string) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const right = pageW - PDF_MARGIN;
  const lineY = pageH - 25;
  const textY = pageH - 19;

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.2);
  pdf.line(PDF_MARGIN, lineY, right, lineY);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(note, PDF_MARGIN, textY);
  pdf.text("LUMAC Transportes & Logística", right, textY, { align: "right" });
}

type LoadedImage = { dataUrl: string; width: number; height: number };

async function loadImage(src: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const size = await new Promise<{ width: number; height: number }>(
      (resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 876, height: 284 });
        img.src = dataUrl;
      },
    );
    return { dataUrl, ...size };
  } catch {
    return null;
  }
}
