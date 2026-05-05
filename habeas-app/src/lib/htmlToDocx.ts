/**
 * Converts edited document HTML (from the contentEditable preview) into a
 * properly formatted DOCX using the `docx` library.  This produces the same
 * quality output as generateHabeasDocument() — proper margins, fonts, headers
 * with page numbers, paragraph spacing, indentation — but reads content from
 * the HTML the user actually edited rather than from structured case fields.
 */

import { load, type CheerioAPI, type Cheerio } from "cheerio";
import type { Element as DomElement, Text as DomText, AnyNode } from "domhandler";
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  PageNumber,
  NumberFormat,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

// ---------- helpers matching generateDocument.ts formatting ----------

const FONT = "Times New Roman";
const SIZE = 24; // 12pt in half-points

function run(text: string, opts: { bold?: boolean; italic?: boolean; underline?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: SIZE,
    bold: opts.bold,
    italics: opts.italic,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

// ---------- inline run extraction ----------

interface RunDef {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/** Recursively extract text runs with formatting from an element's children */
function extractRuns(
  el: Cheerio<AnyNode>,
  $: CheerioAPI,
  inherited: { bold: boolean; italic: boolean; underline: boolean } = { bold: false, italic: false, underline: false },
): RunDef[] {
  const runs: RunDef[] = [];
  el.contents().each((_, node) => {
    if (node.type === "text") {
      const text = (node as DomText).data || "";
      if (text) {
        runs.push({ text, ...inherited });
      }
    } else if (node.type === "tag") {
      const tag = (node as DomElement).name?.toLowerCase();
      const child = $(node);
      const next = { ...inherited };
      if (tag === "strong" || tag === "b") next.bold = true;
      if (tag === "em" || tag === "i") next.italic = true;
      if (tag === "u") next.underline = true;
      runs.push(...extractRuns(child, $, next));
    }
  });
  return runs;
}

// ---------- paragraph builders (same formatting as generateDocument.ts) ----------

function centeredPara(runs: RunDef[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: runs.map((r) => run(r.text, r)),
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        underline: { type: UnderlineType.SINGLE },
        font: FONT,
        size: SIZE,
      }),
    ],
  });
}

function subSectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 200 },
    indent: { firstLine: 720 },
    children: [run(text, { bold: true })],
  });
}

function bodyPara(runs: RunDef[], justify: boolean): Paragraph {
  return new Paragraph({
    alignment: justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
    children: runs.map((r) => run(r.text, r)),
  });
}

function subItemPara(runs: RunDef[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360 },
    indent: { left: 1440, hanging: 360 },
    children: runs.map((r) => run(r.text, r)),
  });
}

function signaturePara(runs: RunDef[], spacing = 60): Paragraph {
  return new Paragraph({
    spacing: { after: spacing },
    indent: { left: 5760 },
    children: runs.map((r) => run(r.text, r)),
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

// ---------- table helpers (caption) ----------

const noBorder = { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function captionRow(leftText: string, rightText: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: noBorders,
        width: { size: 55, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: leftText ? [run(leftText)] : [],
          }),
        ],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 5, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: [run("\u00A7")],
          }),
        ],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: rightText ? [run(rightText, { bold: true })] : [],
          }),
        ],
      }),
    ],
  });
}

function parseTable(tableEl: Cheerio<AnyNode>, $: CheerioAPI): Table {
  const rows: TableRow[] = [];
  tableEl.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    const left = cells.eq(0).text().trim();
    const right = cells.eq(2).text().trim();
    rows.push(captionRow(left, right));
  });
  if (!rows.length) rows.push(captionRow("", ""));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows,
  });
}

// ---------- main element parser ----------

function hasClass(el: Cheerio<AnyNode>, cls: string): boolean {
  return (el.attr("class") || "").split(/\s+/).includes(cls);
}

function parseElement(
  node: AnyNode,
  $: CheerioAPI,
): (Paragraph | Table)[] {
  if (node.type !== "tag") return [];
  const el = $(node);
  const tag = (node as DomElement).name?.toLowerCase();

  // Section headers
  if (tag === "h2") {
    return [sectionTitle(el.text().trim())];
  }
  if (tag === "h3") {
    return [subSectionTitle(el.text().trim())];
  }

  // Paragraphs
  if (tag === "p") {
    const runs = extractRuns(el, $);
    if (!runs.length || runs.every((r) => !r.text.trim())) return [];

    // Signature-block paragraphs (far right indent)
    if (hasClass(el, "ml-64")) {
      return [signaturePara(runs)];
    }
    // Sub-items (a., b., c.)
    if (hasClass(el, "ml-12")) {
      return [subItemPara(runs)];
    }
    // Centered paragraphs
    if (hasClass(el, "text-center")) {
      return [centeredPara(runs)];
    }
    // Body paragraphs with indent
    if (hasClass(el, "indent-8")) {
      return [bodyPara(runs, hasClass(el, "text-justify"))];
    }
    // Default paragraph
    const justify = hasClass(el, "text-justify");
    return [
      new Paragraph({
        alignment: justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
        spacing: { after: 120 },
        children: runs.map((r) => run(r.text, r)),
      }),
    ];
  }

  // Tables (caption)
  if (tag === "table") {
    return [parseTable(el, $)];
  }

  // Container divs — recurse
  if (tag === "div") {
    const results: (Paragraph | Table)[] = [];
    el.children().each((_, child) => {
      results.push(...parseElement(child, $));
    });
    return results;
  }

  return [];
}

// ---------- public API ----------

export function generateFromHTML(html: string): Document {
  const $ = load(html);

  const children: (Paragraph | Table)[] = [];

  // The innerHTML has section divs as top-level elements.
  // cheerio.load wraps in <html><body>, so get body's children.
  $("body")
    .children()
    .each((_, node) => {
      children.push(...parseElement(node, $));
    });

  // Add a trailing empty line if content was found
  if (children.length) children.push(emptyLine());

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}
