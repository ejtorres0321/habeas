import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Case from "@/models/Case";

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const filter = search
    ? {
        $or: [
          { petitionerName: { $regex: search, $options: "i" } },
          { civilNo: { $regex: search, $options: "i" } },
          { facilityName: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const cases = await Case.find(filter).sort({ updatedAt: -1 });
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const body = await request.json();
  const newCase = await Case.create(body);
  return NextResponse.json(newCase, { status: 201 });
}
