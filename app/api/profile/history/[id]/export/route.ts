import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAuth } from "@/server/middlewares/auth";
import { getProfileHistoryDetail } from "@/server/services/profile-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wrapText(text: string, maxChars = 95) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const detail = await getProfileHistoryDetail(auth.principal.id, id);
    if (!detail) {
      return NextResponse.json({ error: "History item not found." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const width = page.getWidth();
    const height = page.getHeight();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let y = height - 48;

    const write = (text: string, size = 11, isBold = false, color = rgb(0.9, 0.93, 1)) => {
      page.drawText(text, {
        x: 48,
        y,
        size,
        font: isBold ? bold : font,
        color
      });
      y -= size + 8;
    };

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.04, 0.06, 0.1)
    });

    write("TruthChain-X Analysis Report", 20, true, rgb(0.96, 0.98, 1));
    write(`Input: ${detail.inputValue}`, 11, false);
    write(`Type: ${detail.inputType.toUpperCase()}   Score: ${detail.score}/100   Verdict: ${detail.verdict.replace("_", " ")}   Confidence: ${detail.confidence}%`, 11, false);
    write(`Generated: ${new Date(detail.updatedAt).toLocaleString()}`, 10, false, rgb(0.7, 0.77, 0.88));

    y -= 8;
    write("Explanation", 14, true, rgb(0.78, 0.92, 1));
    for (const item of detail.explanation.slice(0, 8)) {
      for (const line of wrapText(`- ${item}`)) {
        write(line, 10, false, rgb(0.88, 0.91, 0.96));
      }
    }

    y -= 6;
    write("Safe Signals", 14, true, rgb(0.72, 0.96, 0.84));
    if (detail.safeSignals.length) {
      for (const item of detail.safeSignals.slice(0, 8)) {
        for (const line of wrapText(`- ${item}`)) {
          write(line, 10, false, rgb(0.88, 0.91, 0.96));
        }
      }
    } else {
      write("- None stored", 10, false, rgb(0.88, 0.91, 0.96));
    }

    y -= 6;
    write("Risk Signals", 14, true, rgb(1, 0.8, 0.84));
    if (detail.riskSignals.length) {
      for (const item of detail.riskSignals.slice(0, 8)) {
        for (const line of wrapText(`- ${item}`)) {
          write(line, 10, false, rgb(0.88, 0.91, 0.96));
        }
      }
    } else {
      write("- None stored", 10, false, rgb(0.88, 0.91, 0.96));
    }

    y -= 6;
    write("Reports", 14, true, rgb(0.78, 0.92, 1));
    if (detail.reports.length) {
      for (const report of detail.reports.slice(0, 6)) {
        for (const line of wrapText(`- ${report.title} (${report.source})`)) {
          write(line, 10, false, rgb(0.88, 0.91, 0.96));
        }
        if (report.url) {
          for (const line of wrapText(`  ${report.url}`)) {
            write(line, 9, false, rgb(0.63, 0.83, 1));
          }
        }
      }
    } else {
      write("- None stored", 10, false, rgb(0.88, 0.91, 0.96));
    }

    y -= 6;
    write("Similarity", 14, true, rgb(0.78, 0.92, 1));
    if (detail.similarity.length) {
      for (const item of detail.similarity.slice(0, 6)) {
        for (const line of wrapText(`- ${item.title} (${item.matchPercent}% match)`)) {
          write(line, 10, false, rgb(0.88, 0.91, 0.96));
        }
        if (item.url) {
          for (const line of wrapText(`  ${item.url}`)) {
            write(line, 9, false, rgb(0.63, 0.83, 1));
          }
        }
      }
    } else {
      write("- None stored", 10, false, rgb(0.88, 0.91, 0.96));
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="truthchain-analysis-${detail.id}.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to export report." }, { status: 400 });
  }
}
