import type { ApplicationInput } from "./domain";

export const sampleInput: ApplicationInput = {
  applicantName: "Nadia Pratama",
  purposeId: "purpose-1",
  email: "nadia@example.test",
  phone: "080000000001",
  address: "Jalan Contoh No. 12, Kota Bekasi (data sintetis)",
  title: "Pemanfaatan ruang terbuka hijau di Kota Bekasi",
  supervisor: "Dr. Dimas Contoh",
  institution: "Universitas Nusantara Demo",
  location: "Kecamatan Bekasi Selatan",
  startDate: "2026-11-02",
  endDate: "2026-12-18",
  letterNumber: "012/DEMO/UN/X/2026",
  letterDate: "2026-10-20",
};

// A small, valid PDF made only from synthetic text. No real identity document.
export function samplePdf(label = "Dokumen contoh SIPRIMA") {
  const safe = label.replace(/[^a-zA-Z0-9 .-]/g, " ");
  const stream = `BT /F1 18 Tf 50 760 Td (${safe}) Tj 0 -35 Td /F1 11 Tf (MODE DEMO - DATA SINTETIS) Tj 0 -25 Td (Bukan dokumen resmi atau identitas seseorang.) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
export function sampleFile(label = "dokumen-contoh") {
  return new File([samplePdf(label)], `${label}.pdf`, {
    type: "application/pdf",
  });
}
