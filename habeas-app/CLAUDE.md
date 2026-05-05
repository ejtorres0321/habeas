@AGENTS.md

# Habeas Corpus Petition Generator

## Tech Stack
- Next.js 16.2.4 (App Router), React 19, TypeScript
- Auth: NextAuth 5 beta (Microsoft Entra ID) — see `src/auth.ts`
- Database: MongoDB via Mongoose 9.6 — schema in `src/models/Case.ts`
- Styling: Tailwind CSS 4
- DOCX: `docx` library 9.6 + `cheerio` 1.2 for HTML parsing
- AI: OpenAI (o3 for document review, o4-mini for chat)

## Project Structure (`src/`)
- `app/` — Pages and API routes (App Router)
- `components/` — Client components (`DocumentAIPanel.tsx`, `CaseForm.tsx`)
- `lib/` — Utilities and DOCX generators
- `models/` — Mongoose schemas

## Two-Path DOCX Generation
1. **Structured** (`lib/generateDocument.ts`): Builds DOCX from case fields. Used as GET fallback.
2. **Edited HTML** (`lib/htmlToDocx.ts`): Parses contentEditable innerHTML with cheerio, rebuilds DOCX with identical formatting (Times New Roman 12pt, 1" margins, page numbers, justified text, tab-stop signatures). Used when user edits the preview.

Both paths use the `docx` library directly for output — never use `html-to-docx` (it produces inferior formatting).

## Document Editing Flow
1. Preview page renders document in a `contentEditable` div
2. If `documentHTML` exists in DB, renders from it; otherwise generates from structured fields
3. **Save**: captures `innerHTML` → stores as `documentHTML` field in DB
4. **Download DOCX**: POSTs current `innerHTML` → server calls `generateFromHTML()` → cheerio parse → docx build
5. **AI Fix**: updates the field + clears `documentHTML` to "" → forces re-render from updated fields

## Key Conventions
- `v(val, fallback)` helper returns value or `[___]` placeholder for blanks
- Gender-aware pronouns via `pro` object (`he/she/him/her/his/her`) based on `petitionerGender` field
- Section IDs for navigation/AI locate: `caption`, `introduction`, `jurisdiction`, `facts`, `facts-1`–`facts-4`, `claim`, `claim-a`–`claim-e`, `prayer`, `verification`, `service`
- Certificate signature blocks use tab-stop layout with right-aligned underlined date extracted from body text
- `htmlToDocx.ts` propagates parent div classes (text-center, font-bold) to child elements via a context object

## AI Panel (`components/DocumentAIPanel.tsx`)
- Streams review/chat via `/api/document-chat`
- `[APPLY_FIX field="..."]...[/APPLY_FIX]` blocks for suggested corrections
- Apply Fix sends PUT with field value + `documentHTML: ""` to force re-render
- `[LOCATE:ref]` markers scroll to sections/paragraphs in preview
