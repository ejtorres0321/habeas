/**
 * Converts edited document HTML (from the contentEditable preview) into a
 * properly formatted DOCX using the `docx` library.  Produces the same
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
  TabStopType,
  TabStopPosition,
} from "docx";

// ---------- helpers matching generateDocument.ts formatting ----------

const FONT = "Times New Roman";
const SIZE = 24; // 12pt in half-points

/** Only pass truthy formatting flags so docx doesn't emit val="false" */
function mkRun(text: string, opts: { bold?: boolean; italic?: boolean; underline?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: SIZE,
    bold: opts.bold || undefined,
    italics: opts.italic || undefined,
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
  inherited: { bold: boolean; italic: boolean; underline: boolean },
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

// ---------- context flowing from parent divs ----------

interface ParseCtx {
  centerAlign: boolean;
  parentBold: boolean;
}

const defaultCtx: ParseCtx = { centerAlign: false, parentBold: false };

// ---------- paragraph builders (same formatting as generateDocument.ts) ----------

function centeredPara(runs: RunDef[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: runs.map((r) => mkRun(r.text, r)),
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [mkRun(text, { bold: true, underline: true })],
  });
}

function subSectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 200 },
    indent: { firstLine: 720 },
    children: [mkRun(text, { bold: true })],
  });
}

function bodyPara(runs: RunDef[], justify: boolean): Paragraph {
  return new Paragraph({
    alignment: justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
    children: runs.map((r) => mkRun(r.text, r)),
  });
}

function subItemPara(runs: RunDef[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360 },
    indent: { left: 1440, hanging: 360 },
    children: runs.map((r) => mkRun(r.text, r)),
  });
}

function signaturePara(runs: RunDef[], spacing = 60): Paragraph {
  return new Paragraph({
    spacing: { after: spacing },
    indent: { left: 5760 },
    children: runs.map((r) => mkRun(r.text, r)),
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

/** Certificate of service signature block with right-tab date (matches generateDocument.ts) */
function certSignatureBlock(date: string): Paragraph[] {
  const rightTab = { type: TabStopType.RIGHT, position: TabStopPosition.MAX };
  return [
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [mkRun("/s/ Manuel Solis"), mkRun("\t"), mkRun(date, { underline: true })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [mkRun("Manuel Solis"), mkRun("\t"), mkRun("Date", { underline: true })],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [mkRun("Attorney for Petitioner")],
    }),
  ];
}

/** Extract date from certificate body text: "On April 30, 2026, Counsel..." → "April 30, 2026" */
function extractDateFromCertText(text: string): string {
  const m = text.match(/^On\s+(.+?),\s+Counsel/i);
  return m ? m[1] : "[___]";
}

/** Horizontal rule paragraph (border line) matching generateDocument.ts */
function borderLine(spacing = 0): Paragraph {
  return new Paragraph({
    spacing: { after: spacing },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" },
    },
    children: [],
  });
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
            children: leftText ? [mkRun(leftText)] : [],
          }),
        ],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 5, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: [mkRun("\u00A7")],
          }),
        ],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: rightText ? [mkRun(rightText, { bold: true })] : [],
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

// ---------- class helpers ----------

function cls(el: Cheerio<AnyNode>): string[] {
  return (el.attr("class") || "").split(/\s+/).filter(Boolean);
}

function has(classes: string[], name: string): boolean {
  return classes.includes(name);
}

// ---------- main element parser ----------

function parseElement(
  node: AnyNode,
  $: CheerioAPI,
  ctx: ParseCtx,
): (Paragraph | Table)[] {
  if (node.type !== "tag") return [];
  const el = $(node);
  const tag = (node as DomElement).name?.toLowerCase();
  const classes = cls(el);

  // Section headers
  if (tag === "h2") {
    return [sectionTitle(el.text().trim())];
  }
  if (tag === "h3") {
    // Centered h3 (e.g., CERTIFICATE OF SERVICE) vs. indented subsection
    if (has(classes, "text-center")) {
      return [centeredPara([{ text: el.text().trim(), bold: true, italic: false, underline: false }])];
    }
    return [subSectionTitle(el.text().trim())];
  }

  // Paragraphs
  if (tag === "p") {
    // Determine inherited bold: from parent div context OR from own font-bold class
    const isBold = ctx.parentBold || has(classes, "font-bold");
    const inherited = { bold: isBold, italic: has(classes, "italic"), underline: false };
    const runs = extractRuns(el, $, inherited);
    if (!runs.length || runs.every((r) => !r.text.trim())) return [];

    // Determine alignment: own class > parent context
    const isCenter = has(classes, "text-center") || ctx.centerAlign;
    const isJustify = has(classes, "text-justify");

    // Signature-block paragraphs (far right indent)
    if (has(classes, "ml-64")) {
      return [signaturePara(runs)];
    }
    // Sub-items (a., b., c.)
    if (has(classes, "ml-12")) {
      return [subItemPara(runs)];
    }
    // Centered paragraphs
    if (isCenter) {
      return [centeredPara(runs)];
    }
    // Body paragraphs with indent
    if (has(classes, "indent-8")) {
      return [bodyPara(runs, isJustify)];
    }
    // Default paragraph
    return [
      new Paragraph({
        alignment: isJustify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
        spacing: { after: 120 },
        children: runs.map((r) => mkRun(r.text, r)),
      }),
    ];
  }

  // Tables (caption)
  if (tag === "table") {
    return [parseTable(el, $)];
  }

  // Container divs — recurse, propagating context from classes
  if (tag === "div") {
    const childCtx: ParseCtx = {
      centerAlign: ctx.centerAlign || has(classes, "text-center"),
      parentBold: ctx.parentBold || has(classes, "font-bold"),
    };

    // Certificate signature block: <div class="mb-2"> whose first <p> starts with "/s/"
    if (has(classes, "mb-2")) {
      const paras = el.children("p");
      const firstText = paras.first().text().trim();
      if (firstText.startsWith("/s/")) {
        // Extract date from the preceding sibling paragraph
        const prevSibling = el.prev("p");
        const certDate = prevSibling.length
          ? extractDateFromCertText(prevSibling.text().trim())
          : "[___]";
        return [emptyLine(), ...certSignatureBlock(certDate)];
      }
    }

    // Check if this div has border classes (caption table wrapper)
    const hasBorderTop = has(classes, "border-t");
    const hasBorderBottom = has(classes, "border-b");

    const results: (Paragraph | Table)[] = [];
    if (hasBorderTop) results.push(borderLine(0));

    el.children().each((_, child) => {
      results.push(...parseElement(child, $, childCtx));
    });

    if (hasBorderBottom) results.push(borderLine(200));
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
      children.push(...parseElement(node, $, defaultCtx));
    });

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
