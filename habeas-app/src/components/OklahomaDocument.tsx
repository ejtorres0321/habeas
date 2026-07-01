"use client";

import { getTemplateConfig } from "@/lib/templateConfig";
import { getEroFieldOfficeAddress } from "@/lib/eroFieldOffices";

interface OklahomaDocumentData {
  template?: string;
  civilNo: string;
  petitionerName: string;
  petitionerAge: string;
  petitionerAddress: string;
  yearsInUS: string;
  yearOfEntry: string;
  monthsDetained: string;
  detentionDate: string;
  apprehensionCircumstance: string;
  facilityName: string;
  facilityAddress: string;
  wardenName: string;
  wardenTitle: string;
  fieldOfficeDirector: string;
  eroFieldOffice: string;
  removalOrderDate?: string;
  usCitizenFamilyMembers: string;
  economicHarm: string;
  familialHarm: string;
  petitionerGender: string;
  hasCriminalHistory: string;
  criminalHistoryDetails: string;
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;
}

function v(val: string | undefined, fallback = "[___]") {
  return val && val.trim() ? val.trim() : fallback;
}

/** Split caption text into fixed-width lines so each line gets its own § (matches generateDocument.ts) */
function wrapCaptionText(text: string, maxLen = 36): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxLen) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function formatDate(val: string | undefined, fallback = "[___]") {
  if (!val || !val.trim()) return fallback;
  const date = new Date(val.trim() + "T00:00:00");
  if (isNaN(date.getTime())) return val.trim();
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function detentionDuration(detentionDate: string | undefined, monthsFallback: string | undefined) {
  if (detentionDate && detentionDate.trim()) {
    const start = new Date(detentionDate.trim() + "T00:00:00");
    if (!isNaN(start.getTime())) {
      const days = Math.floor((Date.now() - start.getTime()) / 86400000);
      if (days >= 0 && days < 14) return days <= 1 ? "one day" : `${days} days`;
      if (days >= 14 && days < 60) {
        const weeks = Math.round(days / 7);
        return weeks === 1 ? "one week" : `${weeks} weeks`;
      }
      if (days >= 60) {
        const months = Math.round(days / 30);
        return months === 1 ? "one month" : `${months} months`;
      }
    }
  }
  const m = (monthsFallback || "").trim();
  return m ? `${m} months` : "[___]";
}

export default function OklahomaDocument({ data }: { data: OklahomaDocumentData }) {
  const tpl = getTemplateConfig("oklahoma");
  const lc = tpl.localCounsel!;
  const hasCriminal = data.hasCriminalHistory === "yes";
  const pro = data.petitionerGender === "female"
    ? { subject: "she", Subject: "She", object: "her", possessive: "her", Possessive: "Her" }
    : { subject: "he", Subject: "He", object: "him", possessive: "his", Possessive: "His" };

  let pn = 0;
  const p = () => String(++pn);

  const facility = v(data.facilityName, "the detention facility");
  const warden = v(data.wardenName, "WARDEN");
  const fod = v(data.fieldOfficeDirector, tpl.defaultFieldOfficeDirector);
  const ero = v(data.eroFieldOffice, tpl.defaultEroFieldOffice);
  const removalDate = formatDate(data.removalOrderDate);
  const dur = detentionDuration(data.detentionDate, data.monthsDetained);

  const petitionerLines = wrapCaptionText(`${v(data.petitionerName).toUpperCase()},`);
  const resp1Lines = wrapCaptionText(`1. ${warden.toUpperCase()}, in the official capacity as Warden of the ${facility};`);
  const resp2Lines = wrapCaptionText(`2. ${fod.toUpperCase()}, in his official capacity as Field Office Director of ICE Enforcement and Removal Operations ${ero};`);
  const resp3Lines = wrapCaptionText("3. MARKWAYNE MULLIN, in his official capacity as Secretary of the Department of Homeland Security;");
  const resp4Lines = wrapCaptionText("4. TODD BLANCHE, in his official capacity as Acting Attorney General of the United States,");
  const capRow = (l: string, key: string, indent = false) => (
    <tr key={key}><td className={`align-top whitespace-nowrap${indent ? " caption-indent pl-5" : ""}`}>{l}</td><td className="align-top">&sect;</td><td></td></tr>
  );

  return (
    <>
      {/* Page-number hint (header in DOCX); excluded from export */}
      <p className="preview-page-number text-center mb-6" contentEditable={false}>1</p>

      {/* === CAPTION === */}
      <div id="caption">
        <div className="text-center mb-4">
          <p className="font-bold">UNITED STATES DISTRICT COURT</p>
          {tpl.captionLines.map((line) => (
            <p key={line} className="font-bold">{line}</p>
          ))}
          <p className="font-bold">CIVIL No. {v(data.civilNo, "__________")}</p>
        </div>

        <div className="border-t border-b border-black py-2 mb-6">
          <table className="w-full leading-tight" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "55%" }} />
              <col style={{ width: "3%" }} />
              <col style={{ width: "42%" }} />
            </colgroup>
            <tbody>
              {petitionerLines.map((l, i) => capRow(l, `pet${i}`, i > 0))}
              <tr><td></td><td>&sect;</td><td></td></tr>
              <tr><td>Petitioner</td><td>&sect;</td><td></td></tr>
              <tr><td></td><td>&sect;</td><td></td></tr>
              <tr><td></td><td>&sect;</td><td className="font-bold">PETITION FOR</td></tr>
              <tr><td>v.</td><td>&sect;</td><td className="font-bold">WRIT OF HABEAS CORPUS</td></tr>
              <tr><td></td><td>&sect;</td><td className="font-bold">PURSUANT TO 28 U.S.C</td></tr>
              <tr><td></td><td>&sect;</td><td className="font-bold">&sect;2241</td></tr>
              {resp1Lines.map((l, i) => capRow(l, `r1${i}`, i > 0))}
              <tr><td></td><td>&sect;</td><td></td></tr>
              {resp2Lines.map((l, i) => capRow(l, `r2${i}`, i > 0))}
              <tr><td></td><td>&sect;</td><td></td></tr>
              {resp3Lines.map((l, i) => capRow(l, `r3${i}`, i > 0))}
              <tr><td></td><td>&sect;</td><td></td></tr>
              {resp4Lines.map((l, i) => capRow(l, `r4${i}`, i > 0))}
              <tr><td></td><td>&sect;</td><td></td></tr>
              <tr><td>Respondents.</td><td>&sect;</td><td></td></tr>
            </tbody>
          </table>
        </div>

        <div className="text-center font-bold mb-8">
          <p>PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C.</p>
          <p>&sect;2241</p>
          <p>AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF</p>
        </div>
      </div>

      {/* === I. INTRODUCTION === */}
      <div id="introduction">
        <h2 className="text-center font-bold underline mt-8 mb-4">I. INTRODUCTION</h2>
        <p className="text-justify indent-8 mb-4">Petitioner has been detained by Immigration and Customs Enforcement (&ldquo;ICE&rdquo;) for approximately {dur} without any determination that {pro.subject} presently poses a flight risk or danger to the community. {pro.Subject} seeks immediate release or, at minimum, a hearing before a neutral decision-maker.</p>
        <p className="text-justify indent-8 mb-4">Although an Immigration Judge entered a removal order on {removalDate}, Petitioner timely appealed that decision to the Board of Immigration Appeals (&ldquo;BIA&rdquo;), and the appeal remains pending. Accordingly, Petitioner&rsquo;s removal proceedings are ongoing.</p>
        <p className="text-justify indent-8 mb-4">Prior to {pro.possessive} detention, Petitioner resided in the United States for approximately {v(data.yearsInUS)} years, during which {pro.subject} maintained stable employment and residence and developed substantial family and community ties in the United States.</p>
      </div>

      {/* === II. JURISDICTION === */}
      <div id="jurisdiction">
        <h2 className="text-center font-bold underline mt-8 mb-4">II. JURISDICTION AND AUTHORITY</h2>
        <p className="indent-8 mb-3">{p()}. Jurisdiction lies under 28 U.S.C. &sect;2241 and 28 U.S.C. &sect;1331.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Federal courts possess habeas jurisdiction over constitutional and statutory challenges to immigration detention pursuant to 28 U.S.C. &sect;&sect; 2241 and 1331. See <em>Zadvydas v. Davis</em>, 533 U.S. 678 (2001); <em>Jennings v. Rodriguez</em>, 583 U.S. 281 (2018).</p>
      </div>

      {/* === III. STATEMENT OF FACTS === */}
      <div id="facts">
        <h2 className="text-center font-bold underline mt-8 mb-4">III. STATEMENT OF FACTS</h2>
      </div>

      <div id="facts-1">
        <h3 className="font-bold ml-8 mb-3">1. Background and Family Ties</h3>
        <p className="indent-8 mb-3">{p()}. Petitioner is {v(data.petitionerAge)} years old and has resided in the United States for {v(data.yearsInUS)} years, since {v(data.yearOfEntry)}. See attached Exhibit A: Passport.</p>
        <p className="indent-8 mb-3">{p()}. Petitioner and {pro.possessive} family live at {v(data.petitionerAddress)}.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. {hasCriminal
          ? `Petitioner was previously charged with ${v(data.criminalHistoryDetails, "a criminal offense")}; however, the charge was dismissed and did not result in a conviction. Petitioner has no criminal convictions and no history of violent conduct. Other than unlawful entry in ${v(data.yearOfEntry)}, Petitioner has no history of immigration violations.`
          : `Petitioner has no criminal convictions and no history of violent conduct. Other than unlawful entry in ${v(data.yearOfEntry)}, Petitioner has no history of immigration violations.`}</p>
      </div>

      <div id="facts-2">
        <h3 className="font-bold ml-8 mb-3">2. Detention Under &sect;1225(b)(2)(A)</h3>
        <p className="indent-8 mb-3">{p()}. On {formatDate(data.detentionDate)}, ICE apprehended Petitioner during {v(data.apprehensionCircumstance)} and took {pro.object} into custody.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Respondents continue to detain Petitioner pursuant to 8 U.S.C. &sect;1225(b)(2)(A) based solely upon {pro.possessive} manner of entry approximately {v(data.yearsInUS)} years ago.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Petitioner has been continuously detained at {facility} since {formatDate(data.detentionDate)}&mdash;a total of {dur} to date. See attached Exhibit B: Detainee Locator.</p>
      </div>

      <div id="facts-3">
        <h3 className="font-bold ml-8 mb-3">3. Current Removal Proceedings and Administrative Appeal</h3>
        <p className="indent-8 mb-3 text-justify">{p()}. On {removalDate}, an Immigration Judge entered an order of removal against Petitioner. Petitioner timely appealed that decision to the Board of Immigration Appeals (&ldquo;BIA&rdquo;), and the appeal remains pending.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Because Petitioner&rsquo;s BIA appeal remains pending, {pro.possessive} removal proceedings are ongoing and the removal order is not yet administratively final for purposes of detention authority.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. ICE has provided no timeline regarding the completion of appellate proceedings or the duration of Petitioner&rsquo;s continued detention during the pendency of BIA review.</p>
      </div>

      <div id="facts-4">
        <h3 className="font-bold ml-8 mb-3">4. Harm from Continued Detention</h3>
        <p className="indent-8 mb-3">{p()}. Petitioner&rsquo;s continued detention causes severe and irreparable harm.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>Economic Harm:</strong> {v(data.economicHarm, "Loss of employment and income; family unable to meet household expenses, threatening the stability and well-being of Petitioner's family.")}</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>Familial Harm:</strong> {v(data.familialHarm, "Forced separation from Petitioner's family, causing irreparable emotional harm and undermining the best interests of Petitioner's U.S. citizen family members.")}</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>Inability to Defend Against Removal:</strong> Petitioner is unable to gather documentary evidence for {pro.possessive} relief application while in custody; {pro.subject} has limited access to {pro.possessive} attorney while in ICE custody; {pro.subject} cannot locate witnesses or obtain declarations needed to defend {pro.possessive} case.</p>
        <p className="indent-8 mb-3">{p()}. Each day of continued detention exacerbates these harms.</p>
      </div>

      {/* === IV. CLAIM FOR RELIEF === */}
      <div id="claim">
        <h2 className="text-center font-bold underline mt-8 mb-4">IV. CLAIM FOR RELIEF</h2>
        <p className="text-center font-bold mb-4">PETITIONER REMAINS DETAINED UNDER 8 U.S.C. &sect;1226 BECAUSE HIS REMOVAL ORDER IS NOT YET ADMINISTRATIVELY FINAL</p>
        <p className="indent-8 mb-3">{p()}. Petitioner incorporates all preceding paragraphs.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Although an Immigration Judge entered a removal order on {removalDate}, Petitioner timely appealed that decision to the Board of Immigration Appeals (&ldquo;BIA&rdquo;).</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Because the BIA appeal remains pending, the removal order is not yet administratively final for purposes of detention authority.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Because Petitioner&rsquo;s appeal remains pending before the BIA, detention authority properly arises under 8 U.S.C. &sect;1226 pending completion of removal proceedings.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Section 1226 governs detention of noncitizens during the pendency of removal proceedings, including appellate review before the BIA.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Unlike post-final-order detention under 8 U.S.C. &sect;1231, detention under &sect;1226 must remain reasonably related to its regulatory purposes of preventing flight and protecting public safety.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Continued detention without constitutionally adequate procedures ensuring that detention remains justified based upon present flight risk or danger violates the Due Process Clause of the Fifth Amendment.</p>

        <p className="text-center underline font-bold mb-4 mt-6">VIOLATION OF FIFTH AMENDMENT DUE PROCESS</p>
        <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Amendment to the United States Constitution guarantees that no person shall be deprived of life, liberty, or property without due process of law.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. <em>Zadvydas v. Davis</em>, 533 U.S. 678, 693 (2001); <em>Reno v. Flores</em>, 507 U.S. 292, 306 (1993).</p>
        <p className="indent-8 mb-3">{p()}. Petitioner&rsquo;s detention violates both substantive and procedural due process in multiple, reinforcing ways.</p>
      </div>

      {/* A. */}
      <div id="claim-a">
        <h3 className="font-bold ml-8 mb-3">A. Procedural and Substantive Due Process Violations Arising from Mandatory Detention Without Constitutionally Adequate Procedural Safeguards</h3>
        <p className="indent-8 mb-3 text-justify">{p()}. Although Petitioner has presently been detained for approximately {dur}, ongoing removal proceedings and appellate review before the BIA may substantially prolong detention absent constitutionally adequate procedural safeguards.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Because detention remains governed by &sect;1226 during the pendency of BIA proceedings, due process requires constitutionally adequate procedures to ensure continued detention remains justified based upon present flight risk or danger.</p>
        <p className="indent-8 mb-3">{p()}. Petitioner&rsquo;s detention raises serious constitutional concerns because:</p>
        <p className="ml-12 mb-2 text-justify">a. {pro.subject} remains detained during ongoing removal proceedings and appellate review;</p>
        <p className="ml-12 mb-2 text-justify">b. proceedings before the BIA may substantially extend detention;</p>
        <p className="ml-12 mb-2 text-justify">c. {pro.subject} has not received constitutionally adequate procedures ensuring continued detention remains justified based upon present flight risk or danger; and</p>
        <p className="ml-12 mb-2 text-justify">d. Respondents continue to impose mandatory detention without meaningful review before a neutral decision-maker.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Respondents have not provided constitutionally adequate procedures demonstrating that Petitioner&rsquo;s continued detention remains necessary to prevent flight or protect public safety, which are the recognized regulatory purposes of civil immigration detention. See <em>United States v. Salerno</em>, 481 U.S. 739, 748 (1987).</p>
        <p className="indent-8 mb-3">{p()}. The available evidence demonstrates Petitioner does not presently pose a danger to the community or significant flight risk:</p>
        <p className="ml-12 mb-2 text-justify">a. Petitioner has resided in the United States for approximately {v(data.yearsInUS)} years;</p>
        <p className="ml-12 mb-2 text-justify">b. {hasCriminal
          ? `although Petitioner was previously charged with ${v(data.criminalHistoryDetails, "a criminal offense")}, the charge was dismissed and resulted in no conviction;`
          : "Petitioner has no criminal convictions;"}</p>
        <p className="ml-12 mb-2 text-justify">c. Petitioner maintained stable employment and residence prior to detention;</p>
        <p className="ml-12 mb-2 text-justify">d. Petitioner has substantial family ties in the United States, including {v(data.usCitizenFamilyMembers, "U.S. citizen family members")}; and</p>
        <p className="ml-12 mb-2 text-justify">e. Respondents have not demonstrated that continued detention remains necessary to prevent flight or protect public safety.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Respondents continue to detain Petitioner based upon {pro.possessive} statutory classification as an &ldquo;applicant for admission&rdquo; without constitutionally adequate procedures ensuring that continued detention remains justified based upon present flight risk or danger.</p>
        <p className="indent-8 mb-3">{p()}. Continued mandatory detention without constitutionally adequate procedures violates substantive due process.</p>
      </div>

      {/* B. */}
      <div id="claim-b">
        <h3 className="font-bold ml-8 mb-3">B. Procedural Due Process Violations</h3>
        <p className="indent-8 mb-3 text-justify">{p()}. The Fifth Amendment requires meaningful procedural protections before deprivation of physical liberty&mdash;one of the most fundamental interests protected by the Constitution.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Under <em>Mathews v. Eldridge</em>, 424 U.S. 319, 335 (1976), courts apply a three-part balancing test to determine what process is due: (1) the private interest affected by government action; (2) the risk of erroneous deprivation through procedures used and the probable value of additional safeguards; and (3) the government&rsquo;s interest, including the fiscal and administrative burdens of additional procedures.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Applying the <em>Mathews</em> balancing test here, the constitutional scales tip overwhelmingly in favor of providing Petitioner a hearing.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>First Factor: Private Interest.</strong> Petitioner&rsquo;s private interest is among the most fundamental protected by the Constitution&mdash;physical liberty and the ability to remain with {pro.possessive} family.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>Second Factor: Risk of Erroneous Deprivation.</strong> The risk of erroneous deprivation is substantial because Petitioner remains detained without constitutionally adequate procedures to ensure that continued detention is justified based upon present flight risk or danger.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. <strong>Third Factor: Government Interest.</strong> The government&rsquo;s interests are preventing flight and protecting public safety. However, those interests are not materially advanced by continued detention of an individual who has demonstrated longstanding residence, stable employment, substantial family ties, and no criminal convictions.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. The <em>Mathews</em> balancing test overwhelmingly favors providing Petitioner a hearing before a neutral decision-maker with authority to order release upon a showing that {pro.subject} is not a flight risk or danger.</p>
        <p className="indent-8 mb-3">{p()}. At minimum, due process requires:</p>
        <p className="ml-12 mb-2">a. Notice of the reasons for continued detention;</p>
        <p className="ml-12 mb-2 text-justify">b. An opportunity to present evidence that Petitioner is neither a flight risk nor a danger to the community;</p>
        <p className="ml-12 mb-2 text-justify">c. A hearing before a neutral decision-maker (not ICE, which is the prosecuting/detaining authority); and</p>
        <p className="ml-12 mb-2 text-justify">d. Authority in that decision-maker to order release on bond or conditions if Petitioner meets {pro.possessive} burden.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Respondents have not provided Petitioner with constitutionally adequate procedures before a neutral decision-maker with authority to order release based upon present flight risk or danger.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Under these circumstances, the procedures afforded to Petitioner are constitutionally inadequate under the Fifth Amendment.</p>
      </div>

      {/* C. */}
      <div id="claim-c">
        <h3 className="font-bold ml-8 mb-3">C. As-Applied Constitutional Challenge</h3>
        <p className="indent-8 mb-3 text-justify">{p()}. Even if detention under &sect;1226 may initially be permissible, continued detention without constitutionally adequate procedural safeguards violates due process as applied to Petitioner.</p>
        <p className="indent-8 mb-3">{p()}. Petitioner presents substantial constitutional concerns because:</p>
        <p className="ml-12 mb-2 text-justify">a. {pro.possessive} removal proceedings remain pending before the BIA;</p>
        <p className="ml-12 mb-2 text-justify">b. {pro.possessive} detention continues without constitutionally adequate procedures before a neutral decision-maker;</p>
        <p className="ml-12 mb-2 text-justify">c. {pro.subject} has substantial family, employment, and community ties developed over approximately {v(data.yearsInUS)} years in the United States;</p>
        <p className="ml-12 mb-2 text-justify">d. {pro.subject} has no criminal convictions;</p>
        <p className="ml-12 mb-2 text-justify">e. continued detention imposes severe hardship upon both Petitioner and Petitioner&rsquo;s family; and</p>
        <p className="ml-12 mb-2 text-justify">f. Respondents have failed to demonstrate that continued detention remains necessary based upon present flight risk or danger.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Although the Tenth Circuit has not directly resolved the constitutional limits of prolonged detention during pending removal proceedings, the Supreme Court has repeatedly recognized that immigration detention statutes must be construed consistent with the Due Process Clause. See <em>Zadvydas v. Davis</em>, 533 U.S. 678 (2001); <em>Jennings v. Rodriguez</em>, 583 U.S. 281 (2018).</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Under these circumstances, continued detention without constitutionally adequate procedural safeguards violates the Fifth Amendment.</p>
      </div>

      {/* D. */}
      <div id="claim-d">
        <h3 className="font-bold ml-8 mb-3">D. Petitioner Should Not Be Required to Exhaust Administrative Remedies</h3>
        <p className="indent-8 mb-3 text-justify">{p()}. Petitioner should not be made to exhaust administrative remedies before the Executive Office of Immigration Review.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. The immigration courts and the Board of Immigration Appeals (&ldquo;BIA&rdquo;) are bound by agency precedence.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. On September 5, 2025, the BIA issued its ruling in <em>Yajure Hurtado</em>, 29 I&amp;N Dec. 216 (BIA 2025), holding that noncitizens who entered without inspection, like Petitioner, are subject to mandatory detention. 29 I&amp;N Dec. 216, 220-21 (BIA 2025).</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Requiring Petitioner to seek further administrative review would be futile because the Board of Immigration Appeals has already determined in <em>Matter of Yajure Hurtado</em> that similarly situated noncitizens are subject to mandatory detention.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Accordingly, further administrative exhaustion would not provide Petitioner an adequate or meaningful remedy regarding the constitutional claims raised in this habeas proceeding.</p>
        <p className="indent-8 mb-3 text-justify">{p()}. Thus, this Court should not require Petitioner to exhaust administrative remedies before granting habeas corpus relief.</p>
      </div>

      {/* === V. PRAYER FOR RELIEF === */}
      <div id="prayer">
        <h2 className="text-center font-bold underline mt-8 mb-4">V. PRAYER FOR RELIEF</h2>
        <p className="indent-8 mb-3 text-justify"><strong>WHEREFORE</strong>, Petitioner respectfully requests that this Court:</p>
        <p className="ml-12 mb-2 text-justify">a. Declare that Petitioner&rsquo;s continued detention violates the Fifth Amendment to the United States Constitution;</p>
        <p className="ml-12 mb-2 text-justify">b. Issue a Writ of Habeas Corpus ordering Petitioner&rsquo;s immediate release from custody, subject to reasonable conditions of supervision including GPS monitoring, regular ICE check-ins, surrender of travel documents, and/or reasonable bond;</p>
        <p className="ml-12 mb-2 text-justify">c. Alternatively, order Respondents to provide Petitioner with an individualized hearing before a neutral decision-maker within seven (7) days;</p>
        <p className="ml-12 mb-2 text-justify">d. Enjoin Respondents from continuing to detain Petitioner in violation of {pro.possessive} constitutional rights;</p>
        <p className="ml-12 mb-2">e. Order a stay of removal proceedings pending resolution of this petition;</p>
        <p className="ml-12 mb-2 text-justify">f. Award costs and attorney&rsquo;s fees pursuant to 28 U.S.C. &sect;2412 and other applicable law; and</p>
        <p className="ml-12 mb-2">g. Grant such other and further relief as the Court deems just and proper.</p>
      </div>

      {/* === VI. VERIFICATION === */}
      <div id="verification">
        <h2 className="text-center font-bold underline mt-8 mb-4">VI. VERIFICATION</h2>
        <p className="text-center mb-6">I declare under penalty of perjury that the foregoing is true and correct.</p>

        <div className="mt-8">
          <p>Respectfully submitted,</p>
          <p className="italic underline mt-6">/s/ Manuel E. Solis</p>
          <p className="font-bold">Manuel E. Solis</p>
          <p>Attorney for Petitioner</p>
          <p>State Bar No. 18826790</p>
          <p>P.O. Box 230593</p>
          <p>Houston TX 77223</p>
          <p>Houston Office: 713-481-1030</p>
          <p><a href="mailto:casestatus@manuelsolis.com" className="text-blue-700 underline">casestatus@manuelsolis.com</a></p>
          <p className="italic underline mt-6">/s/ {lc.name}</p>
          <p className="font-bold">{lc.name}, {lc.bar}</p>
          <p>{lc.firm}</p>
          {lc.addressLines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p>{lc.phone}</p>
          <p><a href={`mailto:${lc.email}`} className="text-blue-700 underline">{lc.email}</a></p>
          <p className="italic">Local Counsel</p>
        </div>
      </div>

      {/* === CERTIFICATES OF SERVICE === */}
      <div id="service" className="mt-12 pt-8">
        <OkCertificate
          date={formatDate(data.serviceDateWarden || data.serviceDateFieldOffice)}
          respondent={`${warden.toUpperCase()}, in ${v(data.wardenTitle, "Warden")} Official Capacity as Warden of the ${facility}`}
          address={`the Immigration and Customs Enforcement (\u201CICE\u201D) ${facility}, located at ${v(data.facilityAddress, "[ADDRESS]")}`}
          lcName={lc.name}
        />
        <OkCertificate
          date={formatDate(data.serviceDateFieldOffice)}
          respondent={`${fod}, in his Official Capacity as Field Office Director, of ICE Enforcement and Removal Operations ${ero}`}
          address={`the Office of the Field Office Director, Enforcement and Removal Operations, ${ero}, ${getEroFieldOfficeAddress(data.eroFieldOffice) || "8101 N. Stemmons Frwy, Dallas, TX 75247"}`}
          lcName={lc.name}
        />
        <OkCertificate
          date={formatDate(data.serviceDateDHS)}
          respondent="MARKWAYNE MULLIN, in his Official Capacity as Director of U.S. Department of Homeland Security"
          address="the Office of General Counsel, U.S. Department of Homeland Security, 245 Murray Lane, SW, Mail Stop 0485, Washington, D.C. 20530"
          lcName={lc.name}
        />
        <OkCertificate
          date={formatDate(data.serviceDateAG)}
          respondent="Todd Blanche, in his Official Capacity as Acting Attorney General of the United States"
          address="Office of the Attorney General, 950 Pennsylvania Avenue, NW Washington, DC 20530"
          via="mail"
          lcName={lc.name}
        />
      </div>
    </>
  );
}

function OkCertificate({ date, respondent, address, via = "USPS Mail", lcName }: {
  date: string;
  respondent: string;
  address: string;
  via?: string;
  lcName: string;
}) {
  return (
    <>
      <h3 className="text-center font-bold mb-4 mt-8">CERTIFICATE OF SERVICE</h3>
      <p className="text-justify indent-8 mb-6">On {date}, Counsel for Petitioner served a copy of the attached Petition via {via}, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, {respondent}, at {address}.</p>
      <div className="mb-2 mt-4">
        <p className="flex justify-between"><span className="italic underline">/s/ Manuel Solis</span><span className="underline">{date}</span></p>
        <p className="flex justify-between"><span>Manuel Solis</span><span className="underline">Date</span></p>
        <p>Attorney for Petitioner</p>
        <p className="italic underline mt-4">/s/ {lcName}</p>
        <p>{lcName}</p>
        <p>Local Counsel</p>
      </div>
    </>
  );
}
