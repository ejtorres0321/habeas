"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DocumentAIPanel from "@/components/DocumentAIPanel";

interface CaseData {
  _id: string;
  civilNo: string;
  status: string;
  petitionerName: string;
  petitionerAge: string;
  petitionerAddress: string;
  yearsInUS: string;
  yearOfEntry: string;
  monthsDetained: string;
  detentionDate: string;
  apprehensionCircumstance: string;
  facilityName: string;
  wardenName: string;
  wardenTitle: string;
  fieldOfficeDirector: string;
  eroFieldOffice: string;
  immigrationCourtLocation: string;
  nextHearingDate: string;
  reliefType: string;
  familyDetails: string;
  usCitizenFamilyMembers: string;
  economicHarm: string;
  familialHarm: string;
  hasCriminalHistory: string;
  criminalHistoryDetails: string;
  employmentDetails: string;
  yearsAtResidence: string;
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;
}

function v(val: string | undefined, fallback = "[___]") {
  return val && val.trim() ? val.trim() : fallback;
}

function formatDate(val: string | undefined, fallback = "[___]") {
  if (!val || !val.trim()) return fallback;
  const date = new Date(val.trim() + "T00:00:00");
  if (isNaN(date.getTime())) return val.trim();
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

interface Section {
  id: string;
  label: string;
  indent?: boolean;
}

const baseSections: Section[] = [
  { id: "caption", label: "Caption" },
  { id: "introduction", label: "I. Introduction" },
  { id: "jurisdiction", label: "II. Jurisdiction" },
  { id: "facts", label: "III. Statement of Facts" },
  { id: "facts-1", label: "1. Background", indent: true },
  { id: "facts-2", label: "2. Detention", indent: true },
  { id: "facts-3", label: "3. Proceedings", indent: true },
  { id: "facts-4", label: "4. Harm", indent: true },
];

const remainingSections: Section[] = [
  { id: "claim", label: "IV. Claim for Relief" },
  { id: "claim-a", label: "A. Substantive Due Process", indent: true },
  { id: "claim-b", label: "B. Procedural Due Process", indent: true },
  { id: "claim-c", label: "C. Equal Protection", indent: true },
  { id: "claim-d", label: "D. Arbitrary Action", indent: true },
  { id: "claim-e", label: "E. As-Applied Challenge", indent: true },
  { id: "prayer", label: "V. Prayer for Relief" },
  { id: "verification", label: "VI. Verification" },
  { id: "service", label: "Certificates of Service" },
];

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeSection, setActiveSection] = useState("caption");
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [documentText, setDocumentText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const documentTextRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Re-extract document text after data refresh
        setTimeout(() => {
          setDocumentText(documentTextRef.current?.innerText || "");
        }, 200);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sections: Section[] = [...baseSections, ...remainingSections];

  // Extract document text for AI panel once rendered
  useEffect(() => {
    if (data && documentTextRef.current) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        setDocumentText(documentTextRef.current?.innerText || "");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Track active section on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !data) return;

    const handleScroll = () => {
      const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      const containerTop = container.scrollTop + 120;

      let current = sections[0].id;
      for (const el of sectionEls) {
        if (el.offsetTop - container.offsetTop <= containerTop) {
          current = el.id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [data, sections]);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    const container = contentRef.current;
    if (el && container) {
      const offset = el.offsetTop - container.offsetTop - 16;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  const handleLocate = useCallback((ref: string) => {
    const container = contentRef.current;
    if (!container) return;

    let target: HTMLElement | null = null;

    if (ref.startsWith("para-")) {
      // Find paragraph by its number prefix (e.g., "8." at the start of text)
      const paraNum = ref.slice(5);
      const allP = container.querySelectorAll("p");
      for (const p of allP) {
        const text = p.textContent?.trim() || "";
        if (text.startsWith(`${paraNum}.`) || text.startsWith(`${paraNum}. `)) {
          target = p as HTMLElement;
          break;
        }
      }
    } else {
      // Section ID (e.g., "introduction", "claim-a")
      target = document.getElementById(ref);
    }

    if (target) {
      // Scroll to the element
      const offset = target.offsetTop - container.offsetTop - 50;
      container.scrollTo({ top: offset, behavior: "smooth" });

      // Highlight with a yellow flash
      target.style.transition = "background-color 0.3s ease";
      target.style.backgroundColor = "#FEF3C7";
      target.style.borderRadius = "4px";
      setTimeout(() => {
        target!.style.backgroundColor = "#FDE68A";
      }, 300);
      setTimeout(() => {
        target!.style.transition = "background-color 1s ease";
        target!.style.backgroundColor = "transparent";
      }, 2000);
    }
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/cases/${id}/docx`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data?.petitionerName
        ? `Habeas_Corpus_${data.petitionerName.replace(/\s+/g, "_")}.docx`
        : "Habeas_Corpus_Petition.docx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function handleExportPdf() {
    const docEl = documentTextRef.current;
    if (!docEl) return;
    setExportingPdf(true);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setExportingPdf(false);
      return;
    }

    const title = data?.petitionerName
      ? `Habeas Corpus - ${data.petitionerName}`
      : "Habeas Corpus Petition";

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      margin: 0;
      padding: 0;
    }
    table { border-collapse: collapse; width: 100%; }
    td { vertical-align: top; padding: 1px 0; }
    .font-bold, strong { font-weight: bold; }
    .italic, em { font-style: italic; }
    .text-center { text-align: center; }
    .text-justify { text-align: justify; }
    .underline { text-decoration: underline; }
    .indent-8 { text-indent: 0.5in; }
    .ml-12 { margin-left: 0.75in; }
    .ml-8 { margin-left: 0.5in; }
    .ml-64 { margin-left: 3in; }
    .border-t { border-top: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    h2, h3 { page-break-after: avoid; }
    p { margin-bottom: 6pt; }
  </style>
</head>
<body>${docEl.innerHTML}</body>
</html>`);
    printWindow.document.close();

    printWindow.onafterprint = () => {
      printWindow.close();
      setExportingPdf(false);
    };

    // Delay to let styles render
    setTimeout(() => {
      printWindow.print();
      // Fallback in case onafterprint doesn't fire
      setTimeout(() => setExportingPdf(false), 1000);
    }, 250);
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`/api/cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading preview...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Case not found</div>
      </div>
    );
  }

  const hasCriminal = data.hasCriminalHistory === "yes";
  const reliefText = data.reliefType === "both"
    ? "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)"
    : v(data.reliefType, "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)");

  let pn = 0;
  const p = () => String(++pn);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Cases
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href={`/cases/${id}/edit`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showAiPanel
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Review
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 ${
                saveStatus === "saved"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {downloading ? "Generating..." : "Download DOCX"}
            </button>
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + document */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - section navigation */}
        <nav className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto py-4">
          <h3 className="px-4 pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Document Sections
          </h3>
          <ul className="space-y-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollTo(section.id)}
                  className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
                    section.indent ? "pl-8" : ""
                  } ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Document content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto py-8 px-4">
          <div
            ref={documentTextRef}
            contentEditable
            suppressContentEditableWarning
            className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-16 font-serif text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* === CAPTION === */}
            <div id="caption">
              <div className="text-center mb-4">
                <p className="font-bold">UNITED STATES DISTRICT COURT</p>
                <p className="font-bold">FOR THE SOUTHERN DISTRICT OF TEXAS</p>
                <p className="font-bold">HOUSTON DIVISION</p>
                <p className="font-bold">CIVIL No. {v(data.civilNo, "__________")}</p>
              </div>

              <div className="border-t border-b border-black py-2 mb-6">
                <table className="w-full" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "55%" }} />
                    <col style={{ width: "3%" }} />
                    <col style={{ width: "42%" }} />
                  </colgroup>
                  <tbody>
                    <tr><td>{v(data.petitionerName).toUpperCase()},</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td className="italic pl-4">Petitioner</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td className="font-bold">PETITION FOR</td></tr>
                    <tr><td>v.</td><td>&sect;</td><td className="font-bold">WRIT OF HABEAS CORPUS</td></tr>
                    <tr><td></td><td>&sect;</td><td className="font-bold">PURSUANT TO 28 U.S.C &sect;2241</td></tr>
                    <tr><td>{v(data.wardenName).toUpperCase()}, in {v(data.wardenTitle, "his")} official capacity</td><td>&sect;</td><td></td></tr>
                    <tr><td>as {v(data.wardenTitle, "Warden")} of the {v(data.facilityName)}</td><td>&sect;</td><td></td></tr>
                    <tr><td>Detention Center;</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td>{v(data.fieldOfficeDirector, "BRET BRADFORD").toUpperCase()}, in his official capacity as</td><td>&sect;</td><td></td></tr>
                    <tr><td>Field Office Director of ICE Enforcement and</td><td>&sect;</td><td></td></tr>
                    <tr><td>Removal Operations {v(data.eroFieldOffice, "Houston Field Office")};</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td>MARKWAYNE MULLIN, in his official capacity</td><td>&sect;</td><td></td></tr>
                    <tr><td>as Secretary of the Department of Homeland</td><td>&sect;</td><td></td></tr>
                    <tr><td>Security;</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td>TODD BLANCHE, in his official capacity as</td><td>&sect;</td><td></td></tr>
                    <tr><td>Acting Attorney General of the United States,</td><td>&sect;</td><td></td></tr>
                    <tr><td></td><td>&sect;</td><td></td></tr>
                    <tr><td className="italic pl-4">Respondents.</td><td>&sect;</td><td></td></tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center font-bold mb-8">
                <p>PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C. &sect;2241</p>
                <p>AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF</p>
              </div>
            </div>

            {/* === I. INTRODUCTION === */}
            <div id="introduction">
              <h2 className="text-center font-bold underline mt-8 mb-4">I. INTRODUCTION</h2>

              <p className="text-justify indent-8 mb-4">
                {hasCriminal
                  ? `Petitioner has been detained by Immigration and Customs Enforcement (ICE) for ${v(data.monthsDetained)} months without any individualized determination that he presents a flight risk or danger to the community. He seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for ${v(data.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, he maintained stable employment and residence and built deep family ties in the United States. He was detained solely due to a change in government policy, with no change in his individual circumstances.`
                  : `Petitioner has been detained by Immigration and Customs Enforcement (ICE) for ${v(data.monthsDetained)} months without any individualized determination that he presents a flight risk or danger to the community. He seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for ${v(data.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, he maintained stable employment and residence, built deep family ties in the United States, and had zero criminal arrests, charges, or convictions. He was detained solely due to a change in government policy, with no change in his individual circumstances.`}
              </p>

              <p className="text-justify indent-8 mb-4">
                This case does not challenge the Fifth Circuit&rsquo;s recent decision in <em>Buenrostro-Mendez v. Bondi</em>, No. 25-20496 (5th Cir. Feb. 6, 2026), which held that certain noncitizens are subject to mandatory detention under 8 U.S.C. &sect;1225(b)(2)(A). Rather, it challenges the constitutional application of that statute to Petitioner&rsquo;s specific circumstances.
              </p>

              <p className="text-justify indent-8 mb-4">
                The Fifth Circuit recognized that constitutional questions about prolonged detention under &sect;1225(b)(2)(A) were &ldquo;wholly speculative&rdquo; at the time of its decision. <em>Buenrostro-Mendez</em>
                {hasCriminal
                  ? `, slip op. at 21. Petitioner\u2019s ${v(data.monthsDetained)}-month detention, following ${v(data.yearsInUS)} years of residence in the United States with only ${v(data.criminalHistoryDetails, "a minor criminal citation")} which is not a violent crime or subject to moral turpitude, makes these concerns concrete. The Constitution does not permit indefinite detention without individualized review, regardless of statutory classification.`
                  : `, slip op. at 21. Petitioner\u2019s ${v(data.monthsDetained)}-month detention, following ${v(data.yearsInUS)} years of law-abiding residence in the United States without a single criminal violation or immigration infraction, makes these concerns concrete. The Constitution does not permit indefinite detention without individualized review, regardless of statutory classification.`}
              </p>
            </div>

            {/* === II. JURISDICTION === */}
            <div id="jurisdiction">
              <h2 className="text-center font-bold underline mt-8 mb-4">II. JURISDICTION AND AUTHORITY</h2>

              <p className="indent-8 mb-3">{p()}. Jurisdiction lies under 28 U.S.C. &sect;2241 and 28 U.S.C. &sect;1331.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Circuit recognizes habeas jurisdiction over challenges to the fact and legality of immigration detention, including constitutional claims. See <em>Zadvydas v. Davis</em>, 533 U.S. 678 (2001); <em>Pierre v. United States</em>, 525 F.2d 933 (5th Cir. 1976).</p>
              <p className="indent-8 mb-3 text-justify">{p()}. This Court has authority to issue a TRO to halt ongoing constitutional violations. See <em>Opulent Life Church v. City of Holly Springs</em>, 697 F.3d 279, 295 (5th Cir. 2012).</p>
            </div>

            {/* === III. STATEMENT OF FACTS === */}
            <div id="facts">
              <h2 className="text-center font-bold underline mt-8 mb-4">III. STATEMENT OF FACTS</h2>
            </div>

            <div id="facts-1">
              <h3 className="font-bold ml-8 mb-3">1. Background and Family Ties</h3>

              <p className="indent-8 mb-3">{p()}. Petitioner is {v(data.petitionerAge)} years old and has resided in the United States for {v(data.yearsInUS)} years, since {v(data.yearOfEntry)}. See attached Exhibit A.</p>
              <p className="indent-8 mb-3">{p()}. Petitioner and his family live at {v(data.petitionerAddress)}.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. {hasCriminal
                ? `Petitioner has ${v(data.criminalHistoryDetails, "a minor criminal citation")} and no history of immigration violations other than unlawful entry in ${v(data.yearOfEntry)}.`
                : `Petitioner has no criminal record and no history of immigration violations other than unlawful entry in ${v(data.yearOfEntry)}.`}</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Prior to his detention on {formatDate(data.detentionDate)}, Petitioner had never been apprehended, detained, or placed in removal proceedings by any immigration authority. He lived openly in the United States and had no prior ICE contact of any kind.</p>
            </div>

            <div id="facts-2">
              <h3 className="font-bold ml-8 mb-3">2. Detention Under &sect;1225(b)(2)(A)</h3>

              <p className="indent-8 mb-3">{p()}. On {formatDate(data.detentionDate)}, ICE apprehended Petitioner during {v(data.apprehensionCircumstance)} and took him into custody.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. ICE asserts authority to detain Petitioner under 8 U.S.C. &sect;1225(b)(2)(A), claiming he is an &ldquo;applicant for admission&rdquo; subject to mandatory detention based on his manner of entry {v(data.yearsInUS)} years ago.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. ICE has provided no explanation for its decision to detain Petitioner, other than changed &ldquo;policy&rdquo; following the Fifth Circuit&rsquo;s decision in <em>Buenrostro-Mendez v. Bondi</em>, No. 25-20496 (5th Cir. Feb. 6, 2026).</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Petitioner has been continuously detained at {v(data.facilityName)} since {formatDate(data.detentionDate)}&mdash;a total of {v(data.monthsDetained)} months to date. See attached Exhibit B: Detainee Locator.</p>
            </div>

            <div id="facts-3">
              <h3 className="font-bold ml-8 mb-3">3. Current Removal Proceedings and Likelihood of Relief</h3>

              <p className="indent-8 mb-3">{p()}. Petitioner is in removal proceedings before the {v(data.immigrationCourtLocation)} Immigration Court.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. His next master calendar hearing is scheduled for {formatDate(data.nextHearingDate)}. See attached Exhibit C: Automated Case Information. ICE has provided no timeline for completion of proceedings.</p>
              <p className="indent-8 mb-3">{p()}. Petitioner has applied for {reliefText}.</p>
            </div>

            <div id="facts-4">
              <h3 className="font-bold ml-8 mb-3">4. Harm from Continued Detention</h3>

              <p className="indent-8 mb-3">{p()}. Petitioner&rsquo;s continued detention causes severe and irreparable harm.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>Economic Harm:</strong> {v(data.economicHarm, "Loss of employment and income; family unable to pay rent or mortgage and facing eviction/foreclosure.")}</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>Familial Harm:</strong> {v(data.familialHarm, "Separation from spouse and children; spouse unable to work due to childcare responsibilities.")}</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>Inability to Defend Against Removal:</strong> Petitioner is unable to gather documentary evidence for his relief application while in custody; he has limited access to his attorney while in ICE custody; he cannot locate witnesses or obtain declarations needed to defend his case.</p>
              <p className="indent-8 mb-3">{p()}. Each day of continued detention exacerbates these harms.</p>
            </div>

            {/* === IV. CLAIM FOR RELIEF === */}
            <div id="claim">
              <h2 className="text-center font-bold underline mt-8 mb-4">IV. CLAIM FOR RELIEF</h2>
              <p className="text-center underline font-bold mb-4">VIOLATION OF FIFTH AMENDMENT DUE PROCESS</p>

              <p className="indent-8 mb-3">{p()}. Petitioner incorporates all preceding paragraphs.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Amendment to the United States Constitution guarantees that no person shall be deprived of life, liberty, or property without due process of law.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. <em>Zadvydas v. Davis</em>, 533 U.S. 678, 693 (2001); <em>Reno v. Flores</em>, 507 U.S. 292, 306 (1993).</p>
              <p className="indent-8 mb-3">{p()}. Petitioner&rsquo;s detention violates both substantive and procedural due process in multiple, reinforcing ways.</p>
            </div>

            {/* A. Substantive Due Process */}
            <div id="claim-a">
              <h3 className="font-bold ml-8 mb-3">A. Substantive Due Process: Indefinite Detention Without Individualized Determination</h3>

              <p className="indent-8 mb-3 text-justify">{p()}. The Supreme Court has held that indefinite or prolonged civil detention raises &ldquo;serious constitutional concerns.&rdquo; <em>Zadvydas</em>, 533 U.S. at 690.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. To avoid these concerns, the Supreme Court has &ldquo;read an implicit limitation&rdquo; into immigration detention statutes requiring individualized determinations and temporal limits. <em>Id.</em> at 689.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The Supreme Court identified six months as a &ldquo;presumptively reasonable period&rdquo; for immigration detention. <em>Id.</em> at 701.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. While Petitioner has been detained for {v(data.monthsDetained)} months, he faces indefinite detention with no end in sight:</p>

              <p className="ml-12 mb-2 text-justify">a. Section 1225(b)(2)(A) contains no temporal limitation whatsoever;</p>
              <p className="ml-12 mb-2 text-justify">b. The statute provides for detention &ldquo;pending a proceeding under section 1229a,&rdquo; which could last months or years;</p>
              <p className="ml-12 mb-2 text-justify">c. Petitioner&rsquo;s removal proceedings have no definite conclusion date and could last months or over a year for the adjudication and appellate process to conclude;</p>
              <p className="ml-12 mb-2 text-justify">d. Cases involving applications for relief and appeal to the Board of Immigration Appeals routinely take 9&ndash;24+ months to resolve;</p>
              <p className="ml-12 mb-2 text-justify">e. ICE has provided no timeline for completion of proceedings or release from detention.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. Even though Petitioner has been detained for &ldquo;only&rdquo; {v(data.monthsDetained)} months, the trajectory of his case makes clear he will be detained far beyond the six-month presumptively reasonable period absent intervention by this Court.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. Unlike the post-deportation/removal order detention at issue in <em>Zadvydas</em>, Petitioner&rsquo;s detention is even more troubling because:</p>

              <p className="ml-12 mb-2 text-justify">a. He is detained during, not after, removal proceedings, when he is actively pursuing relief;</p>
              <p className="ml-12 mb-2 text-justify">b. The proceedings themselves could last indefinitely;</p>
              <p className="ml-12 mb-2 text-justify">c. He has had no hearing whatsoever to determine the necessity of detention; and</p>
              <p className="ml-12 mb-2 text-justify">d. He faces categorical detention based on a recently-changed legal classification, not individualized facts.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. Respondents have made no individualized determination that Petitioner&rsquo;s continued detention is necessary to prevent flight or danger to the community, which are the only constitutionally permissible bases for preventive civil detention. <em>United States v. Salerno</em>, 481 U.S. 739, 748 (1987).</p>

              <p className="indent-8 mb-3">{p()}. To the contrary, all evidence demonstrates Petitioner poses neither risk:</p>

              <p className="ml-12 mb-2 text-justify">a. {hasCriminal
                ? `Petitioner has resided in the United States for ${v(data.yearsInUS)} years with only ${v(data.criminalHistoryDetails, "a minor criminal citation")} which is not a violent or a crime of moral turpitude;`
                : `Petitioner has resided in the United States for ${v(data.yearsInUS)} years without a single criminal arrest, charge, or conviction;`}</p>
              <p className="ml-12 mb-2 text-justify">b. Petitioner maintained stable employment and residence throughout his time in the United States{data.employmentDetails && data.employmentDetails.trim() ? ` ${data.employmentDetails.trim()}` : ""};</p>
              <p className="ml-12 mb-2 text-justify">c. {hasCriminal
                ? "Petitioner had zero violations of immigration condition;"
                : "Petitioner had zero violations of any law or immigration condition;"}</p>
              <p className="ml-12 mb-2 text-justify">d. Petitioner has deep family ties to the United States, including {v(data.usCitizenFamilyMembers, "U.S. citizen/LPR family members")};</p>
              <p className="ml-12 mb-2 text-justify">e. No individualized assessment has ever identified Petitioner as a flight risk or danger.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. Petitioner&rsquo;s detention is purely categorical, based solely on his legal classification as an &ldquo;applicant for admission&rdquo;&mdash;not on any individualized finding that he personally requires detention.</p>
              <p className="indent-8 mb-3">{p()}. This categorical, indefinite detention without individualized determination violates substantive due process.</p>
            </div>

            {/* B. Procedural Due Process */}
            <div id="claim-b">
              <h3 className="font-bold ml-8 mb-3">B. Procedural Due Process: Complete Deprivation of Hearing</h3>

              <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Amendment requires meaningful procedural protections before deprivation of physical liberty&mdash;one of the most fundamental interests protected by the Constitution.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Under <em>Mathews v. Eldridge</em>, 424 U.S. 319, 335 (1976), courts apply a three-part balancing test to determine what process is due: (1) the private interest affected by government action; (2) the risk of erroneous deprivation through procedures used and the probable value of additional safeguards; and (3) the government&rsquo;s interest, including the fiscal and administrative burdens of additional procedures.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Applying the <em>Mathews</em> balancing test here, the constitutional scales tip overwhelmingly in favor of providing Petitioner a hearing.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>First Factor: Private Interest.</strong> Petitioner&rsquo;s private interest is among the most fundamental protected by the Constitution&mdash;physical liberty and the ability to remain with his family.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>Second Factor: Risk of Erroneous Deprivation.</strong> The risk of erroneous deprivation here is not merely substantial&mdash;it is 100%.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. <strong>Third Factor: Government Interest.</strong> {hasCriminal
                ? "The government\u2019s interests are preventing flight and protecting public safety. However, these interests are not served by detaining someone who has proven through years of peaceful residence that he will appear and poses no danger."
                : "The government\u2019s interests are preventing flight and protecting public safety. However, these interests are not served by detaining someone who has proven through years of law-abiding conduct that he will appear and poses no danger."}</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The <em>Mathews</em> balancing test overwhelmingly favors providing Petitioner a hearing before a neutral decision-maker with authority to order release upon a showing that he is not a flight risk or danger.</p>

              <p className="indent-8 mb-3">{p()}. At minimum, due process requires:</p>
              <p className="ml-12 mb-2">a. Notice of the reasons for continued detention;</p>
              <p className="ml-12 mb-2">b. An opportunity to present evidence that Petitioner is neither a flight risk nor a danger to the community;</p>
              <p className="ml-12 mb-2">c. A hearing before a neutral decision-maker (not ICE, which is the prosecuting/detaining authority); and</p>
              <p className="ml-12 mb-2 text-justify">d. Authority in that decision-maker to order release on bond or conditions if Petitioner meets his burden.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. Respondents have provided none of these procedural protections. Petitioner has received no hearing, no opportunity to present evidence of his ties and compliance, and no review by any neutral arbiter.</p>
              <p className="indent-8 mb-3">{p()}. This complete deprivation of process violates the Fifth Amendment.</p>
            </div>

            {/* C. Equal Protection */}
            <div id="claim-c">
              <h3 className="font-bold ml-8 mb-3">C. Equal Protection: Arbitrary Classification</h3>

              <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Amendment&rsquo;s due process clause incorporates equal protection principles applicable to federal government action. <em>Bolling v. Sharpe</em>, 347 U.S. 497, 499 (1954).</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Equal protection requires that the government treat similarly situated individuals alike, absent a rational basis for differential treatment.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Respondents treat Petitioner&mdash;who entered the United States without inspection {v(data.yearsInUS)} years ago&mdash;fundamentally differently from a noncitizen who entered lawfully but overstayed a visa for many years.</p>
              <p className="indent-8 mb-3">{p()}. These two individuals are identically situated in all relevant respects.</p>
              <p className="indent-8 mb-3">{p()}. Yet the government treats them completely differently.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. This differential treatment is based solely on the manner of entry many years ago&mdash;a factor that bears no rational relationship to the government&rsquo;s stated interests in preventing flight and protecting public safety.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Indeed, the manner of entry {v(data.yearsInUS)} years ago tells us nothing about current flight risk or danger.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The government&rsquo;s asserted interest in &ldquo;equal treatment&rdquo; of noncitizens at the border and in the interior cannot justify this arbitrary classification.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. This classification violates equal protection because it treats identically situated individuals differently based on an arbitrary factor unrelated to any legitimate government interest.</p>
            </div>

            {/* D. Arbitrary and Capricious */}
            <div id="claim-d">
              <h3 className="font-bold ml-8 mb-3">D. Arbitrary and Capricious Government Action: Detention After Prolonged Non-Enforcement</h3>

              <p className="indent-8 mb-3 text-justify">{p()}. The Due Process Clause prohibits arbitrary government action. <em>County of Sacramento v. Lewis</em>, 523 U.S. 833, 845&ndash;46 (1998).</p>
              <p className="indent-8 mb-3 text-justify">{p()}. The government&rsquo;s sudden decision to detain Petitioner after {v(data.yearsInUS)} years of non-enforcement, with no change whatsoever in his individual circumstances, constitutes arbitrary government action.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. During {v(data.yearsInUS)} years of physical presence in the United States, Petitioner built an established life in reasonable reliance on his circumstances.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. {hasCriminal
                ? `The government\u2019s prolonged non-enforcement over ${v(data.yearsInUS)} years demonstrates that Petitioner presents no flight risk or danger. `
                : `The government\u2019s prolonged non-enforcement over ${v(data.yearsInUS)} years, combined with Petitioner\u2019s complete compliance with all applicable laws during that period, demonstrates that Petitioner presents no flight risk or danger. `}
                <em>Salerno</em>, 481 U.S. at 748.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Now, with no change in Petitioner&rsquo;s individual circumstances, the government has detained him based solely on a policy change following <em>Buenrostro-Mendez</em>. This is the paradigm of arbitrary action.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. While the Fifth Circuit has not recognized a formal doctrine of &ldquo;non-enforcement acquiescence&rdquo; in the immigration detention context, the due process prohibition on arbitrary government action provides an independent basis for relief. See <em>Lewis</em>, 523 U.S. at 845&ndash;46.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. This arbitrary detention, premised solely on a policy change and Petitioner&rsquo;s manner of entry {v(data.yearsInUS)} years ago rather than any current, individualized assessment, violates the Fifth Amendment&rsquo;s due process guarantee.</p>
            </div>

            {/* E. As-Applied */}
            <div id="claim-e">
              <h3 className="font-bold ml-8 mb-3">E. As-Applied Constitutional Challenge</h3>

              <p className="indent-8 mb-3 text-justify">{p()}. Even if &sect;1225(b)(2)(A) could be constitutionally applied to some individuals in some circumstances, its application to Petitioner violates the Constitution.</p>
              <p className="indent-8 mb-3">{p()}. Petitioner presents the precise scenario where mandatory detention without a hearing cannot be constitutionally sustained:</p>

              <p className="ml-12 mb-2">a. Long-term U.S. resident ({v(data.yearsInUS)} years) with deep community and family ties;</p>
              <p className="ml-12 mb-2 text-justify">b. Government engaged in {v(data.yearsInUS)} years of non-enforcement, during which Petitioner demonstrated zero flight risk or danger;</p>
              {!hasCriminal && (
                <p className="ml-12 mb-2 text-justify">c. Proven track record of compliance with all applicable laws, eliminating any individualized flight risk or danger concern;</p>
              )}
              <p className="ml-12 mb-2">{hasCriminal ? "c" : "d"}. Indefinite detention with no timeline for completion of proceedings;</p>
              <p className="ml-12 mb-2">{hasCriminal ? "d" : "e"}. Strong case for relief from removal ({reliefText});</p>
              <p className="ml-12 mb-2">{hasCriminal ? "e" : "f"}. Severe, irreparable harm from continued detention; and</p>
              <p className="ml-12 mb-2">{hasCriminal ? "f" : "g"}. Detention based solely on a policy change, not individual facts.</p>

              <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Circuit in <em>Buenrostro-Mendez</em> acknowledged that constitutional concerns about &sect;1225(b)(2)(A) were &ldquo;wholly speculative&rdquo; at the time. Slip op. at 21.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. Petitioner&rsquo;s case makes these concerns concrete, not speculative. This is precisely the type of as-applied challenge the Fifth Circuit did not address and could not foreclose.</p>
              <p className="indent-8 mb-3 text-justify">{p()}. For all these reasons, Petitioner&rsquo;s continued detention violates the Fifth Amendment&rsquo;s guarantee of due process and equal protection.</p>
            </div>

            {/* === V. PRAYER FOR RELIEF === */}
            <div id="prayer">
              <h2 className="text-center font-bold underline mt-8 mb-4">V. PRAYER FOR RELIEF</h2>

              <p className="indent-8 mb-3 text-justify">
                <strong>WHEREFORE</strong>, Petitioner respectfully requests that this Court:
              </p>
              <p className="ml-12 mb-2 text-justify">a. Declare that Petitioner&rsquo;s continued detention violates the Fifth Amendment to the United States Constitution;</p>
              <p className="ml-12 mb-2 text-justify">b. Issue a Writ of Habeas Corpus ordering Petitioner&rsquo;s immediate release from custody, subject to reasonable conditions of supervision including GPS monitoring, regular ICE check-ins, surrender of travel documents, and/or reasonable bond;</p>
              <p className="ml-12 mb-2 text-justify">c. Alternatively, order Respondents to provide Petitioner with an individualized hearing before a neutral decision-maker within seven (7) days;</p>
              <p className="ml-12 mb-2 text-justify">d. Enjoin Respondents from continuing to detain Petitioner in violation of his constitutional rights;</p>
              <p className="ml-12 mb-2">e. Order a stay of removal proceedings pending resolution of this petition;</p>
              <p className="ml-12 mb-2 text-justify">f. Award costs and attorney&rsquo;s fees pursuant to 28 U.S.C. &sect;2412 and other applicable law; and</p>
              <p className="ml-12 mb-2">g. Grant such other and further relief as the Court deems just and proper.</p>
            </div>

            {/* === VI. VERIFICATION === */}
            <div id="verification">
              <h2 className="text-center font-bold underline mt-8 mb-4">VI. VERIFICATION</h2>

              <p className="indent-8 mb-6 text-justify">I declare under penalty of perjury that the foregoing is true and correct.</p>

              <div className="mt-12 ml-64">
                <p>Respectfully submitted,</p>
                <p className="mt-6">/s/ Manuel E. Solis</p>
                <p className="font-bold">Manuel E. Solis</p>
                <p>Attorney for Petitioner</p>
                <p>State Bar No. 18826790</p>
                <p>P.O. Box 230593</p>
                <p>Houston TX 77223</p>
                <p>Houston Office: 713-481-1030</p>
                <p>casestatus@manuelsolis.com</p>
              </div>
            </div>

            {/* === CERTIFICATES OF SERVICE === */}
            <div id="service" className="mt-12 border-t pt-8">
              <h3 className="text-center font-bold mb-4">CERTIFICATE OF SERVICE</h3>
              <p className="text-justify indent-8 mb-6">
                On {formatDate(data.serviceDateWarden || data.serviceDateFieldOffice)}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, {v(data.wardenName, "RANDY TATE").toUpperCase()}, in {v(data.wardenTitle, "his")} Official Capacity as Warden of the {v(data.facilityName, "Montgomery Processing Center")}, at the Immigration and Customs Enforcement (&ldquo;ICE&rdquo;) {v(data.facilityName, "Montgomery Processing Center")}.
              </p>
              <div className="mb-2">
                <p>/s/ Manuel Solis</p>
                <p>Manuel Solis</p>
                <p>Attorney for Petitioner</p>
              </div>

              <h3 className="text-center font-bold mb-4 mt-8">CERTIFICATE OF SERVICE</h3>
              <p className="text-justify indent-8 mb-6">
                On {formatDate(data.serviceDateFieldOffice)}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, {v(data.fieldOfficeDirector, "Bret Bradford")}, in his Official Capacity as Field Office Director, of ICE Enforcement and Removal Operations {v(data.eroFieldOffice, "Houston Field Office")}, at the Office of the Field Office Director, Enforcement and Removal Operations, {v(data.eroFieldOffice, "Houston Field Office")}.
              </p>
              <div className="mb-2">
                <p>/s/ Manuel Solis</p>
                <p>Manuel Solis</p>
                <p>Attorney for Petitioner</p>
              </div>

              <h3 className="text-center font-bold mb-4 mt-8">CERTIFICATE OF SERVICE</h3>
              <p className="text-justify indent-8 mb-6">
                On {formatDate(data.serviceDateDHS)}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, MARKWAYNE MULLIN, in his Official Capacity as Director of U.S. Department of Homeland Security, at the Office of General Counsel, U.S. Department of Homeland Security, 245 Murray Lane, SW, Mail Stop 0485, Washington, D.C. 20530.
              </p>
              <div className="mb-2">
                <p>/s/ Manuel Solis</p>
                <p>Manuel Solis</p>
                <p>Attorney for Petitioner</p>
              </div>

              <h3 className="text-center font-bold mb-4 mt-8">CERTIFICATE OF SERVICE</h3>
              <p className="text-justify indent-8 mb-6">
                On {formatDate(data.serviceDateAG)}, Counsel for Plaintiff served a copy of the attached Petition via email, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, Todd Blanche, in his Official Capacity as Acting Attorney General of the United States, at Office of the Attorney General, 950 Pennsylvania Avenue, NW Washington, DC 20530.
              </p>
              <div className="mb-2">
                <p>/s/ Manuel Solis</p>
                <p>Manuel Solis</p>
                <p>Attorney for Petitioner</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Review Panel */}
        {showAiPanel && (
          <div className="w-96 flex-shrink-0 border-l border-gray-200">
            <DocumentAIPanel
              documentText={documentText}
              caseData={data as unknown as Record<string, string>}
              caseId={id}
              visible={showAiPanel}
              onClose={() => setShowAiPanel(false)}
              onDataUpdate={fetchData}
              onLocate={handleLocate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
