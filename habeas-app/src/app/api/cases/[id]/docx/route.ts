import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Case from "@/models/Case";
import { generateHabeasDocument } from "@/lib/generateDocument";
import { generateFromHTML } from "@/lib/htmlToDocx";
import { Packer } from "docx";
import { auth } from "@/auth";

function docxResponse(buffer: Buffer | Uint8Array, filename: string) {
  return new NextResponse(new Uint8Array(buffer) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function getFilename(name?: string) {
  return name
    ? `Habeas_Corpus_${name.replace(/\s+/g, "_")}.docx`
    : "Habeas_Corpus_Petition.docx";
}

/** POST: generate DOCX from the edited HTML (same docx-library formatting) */
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
      const doc = generateFromHTML(html);
      const buffer = await Packer.toBuffer(doc);
      return docxResponse(buffer, filename);
    } catch (e) {
      console.error("HTML-to-DOCX conversion failed, falling back:", e);
    }
  }

  // Fallback: generate from structured fields
  const doc = generateHabeasDocument(caseDoc.toObject());
  const buffer = await Packer.toBuffer(doc);
  return docxResponse(buffer, filename);
}

/** GET: generate DOCX from structured case data */
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
  return docxResponse(buffer, getFilename(caseDoc.petitionerName));
}
