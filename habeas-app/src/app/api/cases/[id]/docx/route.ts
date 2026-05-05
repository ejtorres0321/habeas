import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Case from "@/models/Case";
import { generateHabeasDocument } from "@/lib/generateDocument";
import { Packer } from "docx";
import { auth } from "@/auth";

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

/** Convert Tailwind class attributes to inline styles, merging with existing style attrs */
function tailwindToInline(html: string): string {
  // First pass: convert class→style, appending to any existing style attribute
  let result = html.replace(
    /(<[^>]*?)\bclass="([^"]*)"([^>]*>)/g,
    (_match, before: string, classes: string, after: string) => {
      const classList = classes.split(/\s+/).filter(Boolean);
      const newStyles: string[] = [];
      const remaining: string[] = [];
      for (const cls of classList) {
        if (twMap[cls] !== undefined) {
          if (twMap[cls]) newStyles.push(twMap[cls]);
        } else {
          remaining.push(cls);
        }
      }
      // Check if tag already has a style attribute
      const full = before + after;
      const existingStyle = full.match(/style="([^"]*)"/);
      if (existingStyle && newStyles.length) {
        // Merge: append new styles to existing
        const merged = existingStyle[1].replace(/;?\s*$/, "") + ";" + newStyles.join(";");
        const updatedBefore = before.replace(/style="[^"]*"/, `style="${merged}"`);
        const updatedAfter = after.replace(/style="[^"]*"/, `style="${merged}"`);
        const classAttr = remaining.length ? `class="${remaining.join(" ")}"` : "";
        return updatedBefore + classAttr + updatedAfter;
      }
      const parts: string[] = [];
      if (newStyles.length) parts.push(`style="${newStyles.join(";")}"`);
      if (remaining.length) parts.push(`class="${remaining.join(" ")}"`);
      return before + (parts.length ? parts.join(" ") : "") + after;
    }
  );
  // Strip leftover empty class attributes
  result = result.replace(/\s*class=""\s*/g, " ");
  return result;
}

/** Convert html-to-docx result (Buffer or Blob) to Uint8Array */
async function toBytes(result: unknown): Promise<Uint8Array> {
  if (Buffer.isBuffer(result)) {
    return new Uint8Array(result);
  }
  if (result instanceof ArrayBuffer) {
    return new Uint8Array(result);
  }
  if (result instanceof Blob) {
    const ab = await result.arrayBuffer();
    return new Uint8Array(ab);
  }
  // Fallback: try treating as Buffer-like
  return new Uint8Array(result as ArrayBuffer);
}

function docxResponse(bytes: Uint8Array, filename: string) {
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function getFilename(petitionerName?: string) {
  return petitionerName
    ? `Habeas_Corpus_${petitionerName.replace(/\s+/g, "_")}.docx`
    : "Habeas_Corpus_Petition.docx";
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
  const filename = getFilename(caseDoc.petitionerName);

  if (html) {
    try {
      const HTMLtoDOCX = (await import("html-to-docx")).default;
      const styledHTML = tailwindToInline(html);
      const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;">${styledHTML}</body></html>`;
      const result = await HTMLtoDOCX(fullHTML, null, {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        font: "Times New Roman",
        fontSize: 24,
      });
      const bytes = await toBytes(result);
      return docxResponse(bytes, filename);
    } catch (e) {
      console.error("html-to-docx failed, falling back to structured generation:", e);
    }
  }

  // Fallback: generate from structured case data
  const doc = generateHabeasDocument(caseDoc.toObject());
  const buffer = await Packer.toBuffer(doc);
  return docxResponse(new Uint8Array(buffer), filename);
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
  return docxResponse(new Uint8Array(buffer), getFilename(caseDoc.petitionerName));
}
