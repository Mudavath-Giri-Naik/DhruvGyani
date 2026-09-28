import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getRepo } from "@/lib/auth";

export const runtime = "nodejs";

function wrap(text: string, width: number, size: number, measure: (t: string, s: number) => number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next, size) > width) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** One-page printable teacher pack: glossary terms + discussion questions. */
export async function GET() {
  const repo = await getRepo();
  const glossary = (await repo.glossary()).slice(0, 12);
  const doc = await PDFDocument.create();
  doc.setTitle("DhruvGyani teacher pack: the cryosphere");
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.03, 0.08, 0.15);
  page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.23, 0.65, 0.88) });
  page.drawText("DhruvGyani · Teacher pack", { x: 40, y: 808, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("The cryosphere and India's polar research (Class 6-8)", { x: 40, y: 786, size: 11, font, color: rgb(1, 1, 1) });
  let y = 740;
  page.drawText("Key words", { x: 40, y, size: 14, font: bold, color: navy });
  y -= 20;
  for (const g of glossary) {
    page.drawText(g.term, { x: 40, y, size: 10, font: bold, color: navy });
    const lines = wrap(g.meaning_en, 400, 10, (t, s) => font.widthOfTextAtSize(t, s));
    lines.forEach((l, i) => page.drawText(l, { x: 150, y: y - i * 13, size: 10, font, color: navy }));
    y -= Math.max(1, lines.length) * 13 + 6;
  }
  y -= 10;
  page.drawText("Talk about it", { x: 40, y, size: 14, font: bold, color: navy });
  y -= 20;
  const qs = [
    "1. Why do scientists put weather stations in places where nobody lives?",
    "2. What could layers in a snow pit tell us about past snowfall?",
    "3. Why is the Himalaya sometimes called the 'third pole'?",
    "4. Find one expedition in DhruvGyani. What kinds of material did it produce?",
    "5. Pick a word above and explain it to a friend in Hindi or English.",
  ];
  for (const q of qs) {
    page.drawText(q, { x: 40, y, size: 11, font, color: navy });
    y -= 18;
  }
  page.drawText("Activity: use the Learn page quizzes, then open an item and switch the explainer between School, College and Expert.", {
    x: 40,
    y: y - 10,
    size: 9,
    font,
    color: rgb(0.3, 0.35, 0.4),
    maxWidth: 515,
  });
  page.drawText("Prototype for SIH26063. Sample content in DhruvGyani is fictional and labelled. Hindi glossary available online.", { x: 40, y: 30, size: 8, font, color: rgb(0.4, 0.45, 0.5) });
  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="dhruvgyani-teacher-pack.pdf"' },
  });
}
