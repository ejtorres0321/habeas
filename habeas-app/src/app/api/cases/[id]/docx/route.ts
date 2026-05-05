import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Case from "@/models/Case";
import { generateHabeasDocument } from "@/lib/generateDocument";
import { Packer } from "docx";
import { auth } from "@/auth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const HTMLtoDOCX = require("html-to-docx");

/** Tailwind class → inline CSS mapping for DOCX conversion */
const twMap: Record<string, string> = {
  "text-center": "text-align:center",
  "text-justify": "text-align:justify",
  "font-bold": "font-weight:bold",
  "italic": "font-style:italic",
  "underline": "text-decoration:underline",
  "indent-8": "text-indent:2rem",
  "ml-8": "margin-left:2rem",
  "ml-12": "margin-left:3rem",
  "ml-64": "margin-left:16rem",
  "pl-4": "padding-left:1rem",
  "mb-2": "margin-bottom:0.5rem",
  "mb-3": "margin-bottom:0.75rem",
  "mb-4": "margin-bottom:1rem",
  "mb-6": "margin-bottom:1.5rem",
  "mb-8": "margin-bottom:2rem",
  "mt-6": "margin-top:1.5rem",
  "mt-8": "margin-top:2rem",
  "mt-12": "margin-top:3rem",
  "pt-8": "padding-top:2rem",
  "py-2": "padding-top:0.5rem;padding-bottom:0.5rem",
  "border-t": "border-top:1px solid black",
  "border-b": "border-bottom:1px solid black",
  "border-black": "",
  "w-full": "width:100%",
  "font-serif": "font-family:'Times New Roman',Times,serif",
};

/** Convert Tailwind class attributes to inline styles */
function tailwindToInline(html: string): string {
  return html.replace(/\bclass="([^"]*)"/g, (_match, classes: string) => {
    const classList = classes.split(/\s+/).filter(Boolean);
    const styles: string[] = [];
    const remaining: string[] = [];
    for (const cls of classList) {
      if (twMap[cls] !== undefined) {
        if (twMap[cls]) styles.push(twMap[cls]);
      } else {
        remaining.push(cls);
      }
    }
    const parts: string[] = [];
    if (styles.length) parts.push(`style="${styles.join(";")}"`);
    if (remaining.length) parts.push(`class="${remaining.join(" ")}"`);
    return parts.join(" ") || "";
  });
}

/** POST: convert posted HTML to DOCX (used when user has edited the document) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const { id } = await params;

  const caseDoc = await Case.findById(id);
  if (!caseDoc) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { html } = await request.json();

  let buffer: Buffer;

  if (html) {
    const styledHTML = tailwindToInline(html);
    const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;">${styledHTML}</body></html>`;
    buffer = await HTMLtoDOCX(fullHTML, null, {
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      font: "Times New Roman",
      fontSize: 24,
    });
  } else {
    const doc = generateHabeasDocument(caseDoc.toObject());
    buffer = await Packer.toBuffer(doc);
  }

  const filename = caseDoc.petitionerName
    ? `Habeas_Corpus_${caseDoc.petitionerName.replace(/\s+/g, "_")}.docx`
    : "Habeas_Corpus_Petition.docx";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** GET: fallback — generate DOCX from structured case data */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const { id } = await params;

  const caseDoc = await Case.findById(id);
  if (!caseDoc) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const doc = generateHabeasDocument(caseDoc.toObject());
  const buffer = await Packer.toBuffer(doc);

  const filename = caseDoc.petitionerName
    ? `Habeas_Corpus_${caseDoc.petitionerName.replace(/\s+/g, "_")}.docx`
    : "Habeas_Corpus_Petition.docx";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
