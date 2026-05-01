import { NextRequest } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDITABLE_FIELDS = [
  "economicHarm",
  "familialHarm",
  "familyDetails",
  "spouseInfo",
  "childrenInfo",
  "usCitizenFamilyMembers",
  "employmentDetails",
  "criminalHistoryDetails",
  "apprehensionCircumstance",
];

const SECTION_IDS = [
  "caption", "introduction", "jurisdiction",
  "facts", "facts-1", "facts-2", "facts-3", "facts-4",
  "claim", "claim-a", "claim-b", "claim-c", "claim-d", "claim-e",
  "prayer", "verification", "service",
];

const FIX_FORMAT_INSTRUCTIONS = `
FORMATTING RULES — follow exactly:

1. For EACH issue, first describe it, then IMMEDIATELY place the [APPLY_FIX] block right below the description (not grouped at the end). One issue → one fix.

2. To help the user locate each issue in the document, add a [LOCATE:ref] tag on the SAME LINE as the issue heading. The ref must be one of:
   - "para-N" where N is the paragraph number (e.g., [LOCATE:para-8])
   - A section ID: ${SECTION_IDS.join(", ")} (e.g., [LOCATE:caption])

   Example:
   **Incomplete Apprehension Detail** [LOCATE:para-8]
   Paragraph 8 says "during other" which is placeholder text...

   [APPLY_FIX field="apprehensionCircumstance"]
   a routine traffic stop
   [/APPLY_FIX]

3. Editable field names for fixes: ${EDITABLE_FIELDS.join(", ")}
   ONLY suggest fixes for these narrative fields. NEVER suggest fixes for names, dates, addresses, or other identity fields.
   CRITICAL: Suggested replacement text must ONLY rephrase or strengthen what the field already says. NEVER add fabricated specifics (dollar amounts, employer names, job titles, etc.) that are not in the current field value.`;

const REVIEW_PROMPT = `You are a senior legal document reviewer specializing in habeas corpus petitions filed under 28 U.S.C. §2241 in federal district courts.

CRITICAL RULES — DO NOT VIOLATE:
- Do NOT suggest corrections to names of government officials, judges, respondents, attorneys, or parties. These are correct as entered by the attorney.
- Do NOT flag or question any dates. All dates are correct as entered.
- Do NOT suggest new case citations or legal authorities not already in the document.
- Do NOT comment on whether the legal standard or law is "current" — assume the attorney knows the current state of the law.
- NEVER FABRICATE FACTS. Do NOT invent specific details that are not already in the document — no dollar amounts, salaries, job titles, employer names, ages, addresses, medical conditions, school names, or any other concrete facts. If the document says "stable employment," do NOT add "$700/week at a construction company" unless that exact detail already appears in the document.
- When suggesting improved text, you may ONLY rephrase, restructure, or strengthen language that is ALREADY present. Use generic legal phrasing like "loss of primary income" instead of inventing specific figures.
- Focus ONLY on the internal quality, consistency, and completeness of the document itself.

Review the petition for:
1. **Internal inconsistencies**: Facts, numbers, or claims that contradict each other WITHIN the document (e.g., years in US stated differently in different paragraphs).
2. **Placeholder text**: Any [___] or blank values that need to be filled in before filing.
3. **Paragraph numbering**: Whether paragraph numbers are sequential and correctly ordered.
4. **Argument completeness**: Whether claims are fully supported within the petition's own framework.
5. **Persuasiveness**: Where existing narrative text could use stronger legal language — but ONLY by rephrasing what is already stated, never by adding fabricated facts.

For each issue, describe it with a [LOCATE] tag, then immediately place the fix below it (do NOT group fixes at the end).
${FIX_FORMAT_INSTRUCTIONS}

End with a brief overall assessment of the petition's readiness for filing.`;

const CHAT_PROMPT = `You are a legal document assistant for a habeas corpus petition (28 U.S.C. §2241).

CRITICAL RULES:
- Answer ONLY based on the content of this document.
- Do NOT invent facts, case citations, or legal arguments not present in the document.
- NEVER FABRICATE specific details — no dollar amounts, salaries, employer names, ages, or any concrete facts not already in the document. When suggesting text improvements, only rephrase or strengthen what already exists.
- Do NOT question or correct names of officials, parties, or dates — they are correct as entered.
- Cite paragraph numbers or sections when referencing the document.
- Be concise and precise.
${FIX_FORMAT_INSTRUCTIONS}

DOCUMENT:
`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { documentText, caseData, messages, mode } = await request.json();

  if (!documentText) {
    return new Response("No document text provided", { status: 400 });
  }

  const isReview = mode === "review";
  const model = isReview ? "o3" : "o4-mini";

  // Build field context for the AI so it knows current values
  const fieldContext = caseData
    ? "\n\nCURRENT FIELD VALUES:\n" +
      EDITABLE_FIELDS.map(
        (f) => `${f}: "${(caseData[f] || "").slice(0, 500)}"`
      ).join("\n")
    : "";

  let chatMessages: OpenAI.Chat.ChatCompletionMessageParam[];

  if (isReview) {
    chatMessages = [
      { role: "developer", content: REVIEW_PROMPT },
      { role: "user", content: documentText + fieldContext },
    ];
  } else {
    chatMessages = [
      { role: "developer", content: CHAT_PROMPT + documentText + fieldContext },
      ...(messages || []),
    ];
  }

  try {
    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      messages: chatMessages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Document chat error:", err);
    return new Response("AI request failed", { status: 500 });
  }
}
