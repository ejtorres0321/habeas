import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Case from "@/models/Case";
import { generateHabeasDocument } from "@/lib/generateDocument";
import { Packer } from "docx";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
