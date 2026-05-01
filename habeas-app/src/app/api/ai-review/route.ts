import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a legal assistant reviewing a Habeas Corpus petition form (28 U.S.C. §2241) for an immigration attorney. Review the form data and return a JSON array of suggestions.

For each suggestion, return an object with:
- "section": the form section name (e.g., "Petitioner Information", "Family Information", "Harm from Detention")
- "field": the exact field key from the form data
- "type": "error" for missing/invalid data, or "suggestion" for improvements
- "message": a brief explanation of the issue or suggestion
- "suggestedValue": (optional) the improved text to replace the current value. Only include this for narrative/textarea fields where you can write better content.

Rules:
1. Flag required fields as errors ONLY if the value is an empty string (""). The required fields are: petitionerName, detentionDate, facilityName, wardenName, immigrationCourtLocation. If a required field has ANY non-empty value, it is valid — do NOT flag it as placeholder, incomplete, or suspicious.
2. Do NOT validate dates — all dates are correct as entered. Do NOT flag dates as being in the future or invalid.
3. For narrative fields (familyDetails, spouseInfo, childrenInfo, usCitizenFamilyMembers, economicHarm, familialHarm, employmentDetails, criminalHistoryDetails), if the content is too brief or could be more compelling for a federal court filing, suggest improved text that:
   - Uses specific, persuasive legal language
   - Emphasizes irreparable harm and due process concerns
   - Highlights ties to the community and family
   - Is written in third person about the petitioner
4. If hasCriminalHistory is "yes", review criminalHistoryDetails for completeness and suggest improvements if needed. If hasCriminalHistory is "no", ignore criminalHistoryDetails.
5. Keep suggestions concise and actionable
6. Return ONLY valid JSON: { "suggestions": [...] }
7. If everything looks good, return { "suggestions": [] }`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Review this habeas corpus petition form data:\n\n${JSON.stringify(formData, null, 2)}` },
      ],
    });

    const content = completion.choices[0]?.message?.content || '{"suggestions":[]}';
    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI review error:", err);
    return NextResponse.json({ error: "AI review failed" }, { status: 500 });
  }
}
