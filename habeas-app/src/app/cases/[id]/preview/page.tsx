"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  immigrationCourtLocation: string;
  nextHearingDate: string;
  reliefType: string;
  familyDetails: string;
  usCitizenFamilyMembers: string;
  economicHarm: string;
  familialHarm: string;
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;
}

function v(val: string | undefined, fallback = "[___]") {
  return val && val.trim() ? val.trim() : fallback;
}

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

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

  const reliefText = data.reliefType === "both"
    ? "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)"
    : v(data.reliefType, "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
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
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {downloading ? "Generating..." : "Download DOCX"}
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-white shadow-lg rounded-lg p-16 font-serif text-sm leading-relaxed" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {/* Caption */}
          <div className="text-center mb-4">
            <p className="font-bold">UNITED STATES DISTRICT COURT</p>
            <p className="font-bold">FOR THE SOUTHERN DISTRICT OF TEXAS</p>
            <p className="font-bold">HOUSTON DIVISION</p>
            <p className="font-bold">CIVIL No. {v(data.civilNo, "__________")}</p>
          </div>

          {/* Case Header with § dividers */}
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
                <tr><td>BRET BRADFORD, in his official capacity as</td><td>&sect;</td><td></td></tr>
                <tr><td>Field Office Director of ICE Enforcement and</td><td>&sect;</td><td></td></tr>
                <tr><td>Removal Operations Houston Field Office;</td><td>&sect;</td><td></td></tr>
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

          {/* Title */}
          <div className="text-center font-bold mb-8">
            <p>PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C. &sect;2241</p>
            <p>AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF</p>
          </div>

          {/* I. INTRODUCTION */}
          <h2 className="text-center font-bold underline mt-8 mb-4">I. INTRODUCTION</h2>

          <p className="text-justify indent-8 mb-4">
            Petitioner has been detained by Immigration and Customs Enforcement (ICE) for {v(data.monthsDetained)} months without any individualized determination that he presents a flight risk or danger to the community. He seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for {v(data.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, he maintained stable employment and residence, built deep family ties in the United States, and had zero criminal arrests, charges, or convictions.
          </p>

          <p className="text-justify indent-8 mb-4">
            This case does not challenge the Fifth Circuit&rsquo;s recent decision in <em>Buenrostro-Mendez v. Bondi</em>, No. 25-20496 (5th Cir. Feb. 6, 2026), which held that certain noncitizens are subject to mandatory detention under 8 U.S.C. &sect;1225(b)(2)(A). Rather, it challenges the constitutional application of that statute to Petitioner&rsquo;s specific circumstances.
          </p>

          <p className="text-justify indent-8 mb-4">
            The Fifth Circuit recognized that constitutional questions about prolonged detention under &sect;1225(b)(2)(A) were &ldquo;wholly speculative&rdquo; at the time of its decision. Petitioner&rsquo;s {v(data.monthsDetained)}-month detention, following {v(data.yearsInUS)} years of law-abiding residence in the United States without a single criminal violation or immigration infraction, makes these concerns concrete.
          </p>

          {/* II. JURISDICTION */}
          <h2 className="text-center font-bold underline mt-8 mb-4">II. JURISDICTION AND AUTHORITY</h2>

          <p className="indent-8 mb-3">1. Jurisdiction lies under 28 U.S.C. &sect;2241 and 28 U.S.C. &sect;1331.</p>
          <p className="indent-8 mb-3">2. The Fifth Circuit recognizes habeas jurisdiction over challenges to the fact and legality of immigration detention. See <em>Zadvydas v. Davis</em>, 533 U.S. 678 (2001).</p>
          <p className="indent-8 mb-3">3. This Court has authority to issue a TRO to halt ongoing constitutional violations.</p>

          {/* III. STATEMENT OF FACTS */}
          <h2 className="text-center font-bold underline mt-8 mb-4">III. STATEMENT OF FACTS</h2>
          <h3 className="font-bold ml-8 mb-3">1. Background and Family Ties</h3>

          <p className="indent-8 mb-3">4. Petitioner is {v(data.petitionerAge)} years old and has resided in the United States for {v(data.yearsInUS)} years, since {v(data.yearOfEntry)}.</p>
          <p className="indent-8 mb-3">5. Petitioner and his family live at {v(data.petitionerAddress)}.</p>
          <p className="indent-8 mb-3">6. Petitioner has no criminal record and no history of immigration violations other than unlawful entry in {v(data.yearOfEntry)}.</p>
          <p className="indent-8 mb-3">9. Prior to his detention on {v(data.detentionDate)}, Petitioner had never been apprehended, detained, or placed in removal proceedings.</p>

          <h3 className="font-bold ml-8 mb-3">2. Detention Under &sect;1225(b)(2)(A)</h3>

          <p className="indent-8 mb-3">10. On {v(data.detentionDate)}, ICE apprehended Petitioner during {v(data.apprehensionCircumstance)} and took him into custody.</p>
          <p className="indent-8 mb-3">11. ICE asserts authority to detain Petitioner under 8 U.S.C. &sect;1225(b)(2)(A), claiming he is an &ldquo;applicant for admission&rdquo; subject to mandatory detention based on his manner of entry {v(data.yearsInUS)} years ago.</p>
          <p className="indent-8 mb-3">13. Petitioner has been continuously detained at {v(data.facilityName)} since {v(data.detentionDate)}&mdash;a total of {v(data.monthsDetained)} months to date.</p>

          <h3 className="font-bold ml-8 mb-3">3. Current Removal Proceedings</h3>

          <p className="indent-8 mb-3">14. Petitioner is in removal proceedings before the {v(data.immigrationCourtLocation)} Immigration Court.</p>
          <p className="indent-8 mb-3">15. His next master calendar hearing is scheduled for {v(data.nextHearingDate)}.</p>
          <p className="indent-8 mb-3">16. Petitioner has applied for {reliefText}.</p>

          <h3 className="font-bold ml-8 mb-3">4. Harm from Continued Detention</h3>

          <p className="indent-8 mb-3">17. Petitioner&rsquo;s continued detention causes severe and irreparable harm.</p>
          <p className="indent-8 mb-3">18. <strong>Economic Harm:</strong> {v(data.economicHarm, "Loss of employment and income; family unable to pay rent or mortgage.")}</p>
          <p className="indent-8 mb-3">19. <strong>Familial Harm:</strong> {v(data.familialHarm, "Separation from spouse and children.")}</p>

          {/* IV. CLAIM FOR RELIEF */}
          <h2 className="text-center font-bold underline mt-8 mb-4">IV. CLAIM FOR RELIEF</h2>
          <p className="text-center underline font-bold mb-4">VIOLATION OF FIFTH AMENDMENT DUE PROCESS</p>

          <p className="indent-8 mb-3">34. Petitioner incorporates all preceding paragraphs.</p>
          <p className="indent-8 mb-3">35. The Fifth Amendment guarantees that no person shall be deprived of life, liberty, or property without due process of law.</p>
          <p className="indent-8 mb-3 text-justify">36. This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. <em>Zadvydas v. Davis</em>, 533 U.S. 678, 693 (2001).</p>

          <p className="text-center text-gray-400 my-8">[ ... Full document continues with all legal arguments ... ]</p>

          {/* V. PRAYER FOR RELIEF */}
          <h2 className="text-center font-bold underline mt-8 mb-4">V. PRAYER FOR RELIEF</h2>

          <p className="indent-8 mb-3 text-justify">
            <strong>WHEREFORE</strong>, Petitioner respectfully requests that this Court:
          </p>
          <p className="ml-12 mb-2">a. Declare that Petitioner&rsquo;s continued detention violates the Fifth Amendment;</p>
          <p className="ml-12 mb-2">b. Issue a Writ of Habeas Corpus ordering Petitioner&rsquo;s immediate release;</p>
          <p className="ml-12 mb-2">c. Order an individualized hearing before a neutral decision-maker within seven (7) days;</p>
          <p className="ml-12 mb-2">d. Enjoin Respondents from continuing to detain Petitioner;</p>
          <p className="ml-12 mb-2">e. Order a stay of removal proceedings;</p>
          <p className="ml-12 mb-2">f. Award costs and attorney&rsquo;s fees; and</p>
          <p className="ml-12 mb-2">g. Grant such other relief as the Court deems just and proper.</p>

          {/* Signature */}
          <div className="mt-12">
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

          {/* Certificates of Service */}
          <div className="mt-12 border-t pt-8">
            <h3 className="text-center font-bold mb-4">CERTIFICATE OF SERVICE</h3>
            <p className="text-justify indent-8 mb-6">
              On {v(data.serviceDateWarden, "[DATE]")}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail upon the Respondent, {v(data.wardenName, "RANDY TATE").toUpperCase()}, at the {v(data.facilityName)} located at {v(data.facilityName, "[ADDRESS]")}.
            </p>
            <p className="text-gray-400 text-center italic">[Additional certificates of service for all respondents included in downloaded DOCX]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
