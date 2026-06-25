import { getEroFieldOfficeAddress } from "./eroFieldOffices";
import { getTemplateConfig, templates } from "./templateConfig";
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  UnderlineType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ExternalHyperlink,
} from "docx";

interface CaseData {
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

  immigrationCourtLocation: string;
  nextHearingDate: string;
  reliefType: string;
  removalOrderDate?: string;
  familyDetails: string;
  spouseInfo: string;
  childrenInfo: string;
  usCitizenFamilyMembers: string;
  economicHarm: string;
  familialHarm: string;
  petitionerGender: string;
  hasCriminalHistory: string;
  criminalHistoryDetails: string;
  employmentDetails: string;
  yearsAtResidence: string;
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;

}

let CURRENT_SIZE = 24;

function v(val: string, fallback = "[___]"): string {
  return val && val.trim() ? val.trim() : fallback;
}

function formatDate(val: string, fallback = "[___]"): string {
  if (!val || !val.trim()) return fallback;
  const date = new Date(val.trim() + "T00:00:00");
  if (isNaN(date.getTime())) return val.trim();
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function bold(text: string): TextRun {
  return new TextRun({ text, bold: true, font: "Times New Roman", size: CURRENT_SIZE });
}

function normal(text: string): TextRun {
  return new TextRun({ text, font: "Times New Roman", size: CURRENT_SIZE });
}

function italic(text: string): TextRun {
  return new TextRun({ text, italics: true, font: "Times New Roman", size: CURRENT_SIZE });
}

function underline(text: string): TextRun {
  return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, font: "Times New Roman", size: CURRENT_SIZE });
}

function italicUnderline(text: string): TextRun {
  return new TextRun({ text, italics: true, underline: { type: UnderlineType.SINGLE }, font: "Times New Roman", size: CURRENT_SIZE });
}

function centered(...runs: TextRun[]): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: runs });
}

function justified(...runs: TextRun[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
    children: runs,
  });
}

function numberedPara(num: string, ...runs: TextRun[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
    children: [normal(`${num}. `), ...runs],
  });
}

function subPara(letter: string, ...runs: TextRun[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360 },
    indent: { left: 1440, hanging: 360 },
    children: [normal(`${letter}. `), ...runs],
  });
}

function boldUnderline(text: string): TextRun {
  return new TextRun({ text, bold: true, underline: { type: UnderlineType.SINGLE }, font: "Times New Roman", size: CURRENT_SIZE });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [boldUnderline(text)],
  });
}

function subSectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 200 },
    indent: { firstLine: 720 },
    children: [bold(text)],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

const noBorder = { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const topBottomBorder = {
  top: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" },
  left: noBorder,
  right: noBorder,
};

function captionRow(leftRuns: TextRun[], rightRuns: TextRun[], indentLeft = 0): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: noBorders,
        width: { size: 55, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ spacing: { after: 0, line: 240 }, indent: indentLeft ? { left: indentLeft } : undefined, children: leftRuns })],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 5, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [normal("\u00A7")] })],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: rightRuns })],
      }),
    ],
  });
}

export function generateHabeasDocument(data: CaseData): Document {
  const d = data;
  const tpl = getTemplateConfig(d.template);
  CURRENT_SIZE = tpl.fontSizeHalfPoints;
  if (tpl.id === "oklahoma") {
    return generateOklahomaDocument(data);
  }
  const hasCriminal = d.hasCriminalHistory === "yes";
  const pro = d.petitionerGender === "female"
    ? { subject: "she", Subject: "She", object: "her", possessive: "her", Possessive: "Her" }
    : { subject: "he", Subject: "He", object: "him", possessive: "his", Possessive: "His" };
  let pn = 0;
  const p = () => String(++pn);

  const reliefText = d.reliefType === "both"
    ? "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)"
    : v(d.reliefType, "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)");

  // --- Build document children dynamically ---

  const children: (Paragraph | Table)[] = [
    // CAPTION
    centered(bold("UNITED STATES DISTRICT COURT")),
    ...tpl.captionLines.map((line) => centered(bold(line))),
    centered(bold(`CIVIL No. ${v(d.civilNo, "__________")}`)),

    // Horizontal line above caption
    new Paragraph({
      spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
      children: [],
    }),

    // Case caption table with § dividers
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        captionRow([normal(`${v(d.petitionerName).toUpperCase()},`)], []),
        captionRow([], []),
        captionRow([italic("     Petitioner")], []),
        captionRow([], []),
        captionRow([], [bold("PETITION FOR")]),
        captionRow([normal("v.")], [bold("WRIT OF HABEAS CORPUS")]),
        captionRow([], [bold("PURSUANT TO 28 U.S.C \u00A72241")]),
        captionRow([normal(`${v(d.wardenName).toUpperCase()}, in ${v(d.wardenTitle, "his")} official capacity`)], []),
        captionRow([normal(`as ${v(d.wardenTitle, "Warden")} of the ${v(d.facilityName)} Detention Center;`)], []),
        captionRow([], []),
        captionRow([normal(`${v(d.fieldOfficeDirector, tpl.defaultFieldOfficeDirector).toUpperCase()}, in his official capacity as`)], []),
        captionRow([normal("Field Office Director of ICE Enforcement and")], []),
        captionRow([normal(`Removal Operations ${v(d.eroFieldOffice, tpl.defaultEroFieldOffice)};`)], []),
        captionRow([], []),
        captionRow([normal("MARKWAYNE MULLIN, in his official capacity as")], []),
        captionRow([normal("Secretary of the Department of Homeland Security;")], []),
        captionRow([], []),
        captionRow([normal("TODD BLANCHE, in his official capacity as")], []),
        captionRow([normal("Acting Attorney General of the United States,")], []),
        captionRow([], []),
        captionRow([italic("     Respondents.")], []),
      ],
    }),

    // Horizontal line below caption
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
      children: [],
    }),

    // Title
    centered(bold("PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C. \u00A72241")),
    centered(bold("AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF")),
    emptyLine(),

    // I. INTRODUCTION
    sectionTitle("I. INTRODUCTION"),

    justified(
      normal(hasCriminal
        ? `Petitioner has been detained by Immigration and Customs Enforcement (ICE) for ${v(d.monthsDetained)} months without any individualized determination that ${pro.subject} presents a flight risk or danger to the community. ${pro.Subject} seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for ${v(d.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, ${pro.subject} maintained stable employment and residence and built deep family ties in the United States. ${pro.Subject} was detained solely due to a change in government policy, with no change in ${pro.possessive} individual circumstances.`
        : `Petitioner has been detained by Immigration and Customs Enforcement (ICE) for ${v(d.monthsDetained)} months without any individualized determination that ${pro.subject} presents a flight risk or danger to the community. ${pro.Subject} seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for ${v(d.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, ${pro.subject} maintained stable employment and residence, built deep family ties in the United States, and had zero criminal arrests, charges, or convictions. ${pro.Subject} was detained solely due to a change in government policy, with no change in ${pro.possessive} individual circumstances.`)
    ),

    justified(
      normal(`This case does not challenge the Fifth Circuit\u2019s recent decision in `),
      italic("Buenrostro-Mendez v. Bondi"),
      normal(`, No. 25-20496 (5th Cir. Feb. 6, 2026), which held that certain noncitizens are subject to mandatory detention under 8 U.S.C. \u00A71225(b)(2)(A). Rather, it challenges the constitutional application of that statute to Petitioner\u2019s specific circumstances.`)
    ),

    justified(
      normal(`The Fifth Circuit recognized that constitutional questions about prolonged detention under \u00A71225(b)(2)(A) were \u201Cwholly speculative\u201D at the time of its decision. `),
      italic("Buenrostro-Mendez"),
      normal(hasCriminal
        ? `, slip op. at 21. Petitioner\u2019s ${v(d.monthsDetained)}-month detention, following ${v(d.yearsInUS)} years of residence in the United States with only ${v(d.criminalHistoryDetails, "a minor criminal citation")} which is not a violent crime or subject to moral turpitude, makes these concerns concrete. The Constitution does not permit indefinite detention without individualized review, regardless of statutory classification.`
        : `, slip op. at 21. Petitioner\u2019s ${v(d.monthsDetained)}-month detention, following ${v(d.yearsInUS)} years of law-abiding residence in the United States without a single criminal violation or immigration infraction, makes these concerns concrete. The Constitution does not permit indefinite detention without individualized review, regardless of statutory classification.`)
    ),

    // II. JURISDICTION
    sectionTitle("II. JURISDICTION AND AUTHORITY"),

    numberedPara(p(), normal("Jurisdiction lies under 28 U.S.C. \u00A72241 and 28 U.S.C. \u00A71331.")),

    numberedPara(p(), normal(`The ${tpl.circuitName} Circuit recognizes habeas jurisdiction over challenges to the fact and legality of immigration detention, including constitutional claims. See `),
      italic("Zadvydas v. Davis"),
      normal(", 533 U.S. 678 (2001); "),
      italic(tpl.habeasSecondaryCase),
      normal(`, ${tpl.habeasSecondaryCite}.`)
    ),

    numberedPara(p(), normal("This Court has authority to issue a TRO to halt ongoing constitutional violations. See "),
      italic(tpl.troCase),
      normal(`, ${tpl.troCite}.`)
    ),

    // III. STATEMENT OF FACTS
    sectionTitle("III. STATEMENT OF FACTS"),
    subSectionTitle("1. Background and Family Ties"),

    numberedPara(p(), normal(`Petitioner is ${v(d.petitionerAge)} years old and has resided in the United States for ${v(d.yearsInUS)} years, since ${v(d.yearOfEntry)}. See attached Exhibit A.`)),

    numberedPara(p(), normal(`Petitioner and ${pro.possessive} family live at ${v(d.petitionerAddress)}.`)),

    numberedPara(p(), normal(hasCriminal
      ? `Petitioner has ${v(d.criminalHistoryDetails, "a minor criminal citation")} and no history of immigration violations other than unlawful entry in ${v(d.yearOfEntry)}.`
      : `Petitioner has no criminal record and no history of immigration violations other than unlawful entry in ${v(d.yearOfEntry)}.`)),

    numberedPara(p(), normal(`Prior to ${pro.possessive} detention on ${formatDate(d.detentionDate)}, Petitioner had never been apprehended, detained, or placed in removal proceedings by any immigration authority. ${pro.Subject} lived openly in the United States and had no prior ICE contact of any kind.`)),

    subSectionTitle("2. Detention Under \u00A71225(b)(2)(A)"),

    numberedPara(p(), normal(`On ${formatDate(d.detentionDate)}, ICE apprehended Petitioner during ${v(d.apprehensionCircumstance)} and took ${pro.object} into custody.`)),

    numberedPara(p(), normal(`ICE asserts authority to detain Petitioner under 8 U.S.C. \u00A71225(b)(2)(A), claiming ${pro.subject} is an \u201Capplicant for admission\u201D subject to mandatory detention based on ${pro.possessive} manner of entry ${v(d.yearsInUS)} years ago.`)),

    numberedPara(p(), normal("ICE has provided no explanation for its decision to detain Petitioner, other than changed \u201Cpolicy\u201D following the Fifth Circuit\u2019s decision in "),
      italic("Buenrostro-Mendez v. Bondi"),
      normal(", No. 25-20496 (5th Cir. Feb. 6, 2026).")
    ),

    numberedPara(p(), normal(`Petitioner has been continuously detained at ${v(d.facilityName)} since ${formatDate(d.detentionDate)}\u2014a total of ${v(d.monthsDetained)} months to date. See attached Exhibit B: Detainee Locator.`)),

    subSectionTitle("3. Current Removal Proceedings and Likelihood of Relief"),

    numberedPara(p(), normal(`Petitioner is in removal proceedings before the ${v(d.immigrationCourtLocation)} Immigration Court.`)),

    numberedPara(p(), normal(`${pro.Possessive} next master calendar hearing is scheduled for ${formatDate(d.nextHearingDate)}. See attached Exhibit C: Automated Case Information. ICE has provided no timeline for completion of proceedings.`)),

    numberedPara(p(), normal(`Petitioner has applied for ${reliefText}.`)),

    subSectionTitle("4. Harm from Continued Detention"),

    numberedPara(p(), normal("Petitioner\u2019s continued detention causes severe and irreparable harm.")),

    numberedPara(p(), bold("Economic Harm: "), normal(v(d.economicHarm, "Loss of employment and income; family unable to pay rent or mortgage and facing eviction/foreclosure."))),

    numberedPara(p(), bold("Familial Harm: "), normal(v(d.familialHarm, "Separation from spouse and children; spouse unable to work due to childcare responsibilities."))),

    numberedPara(p(), bold("Inability to Defend Against Removal: "), normal(`Petitioner is unable to gather documentary evidence for ${pro.possessive} relief application while in custody; ${pro.subject} has limited access to ${pro.possessive} attorney while in ICE custody; ${pro.subject} cannot locate witnesses or obtain declarations needed to defend ${pro.possessive} case.`)),

    numberedPara(p(), normal("Each day of continued detention exacerbates these harms.")),
  ];

  // --- IV. CLAIM FOR RELIEF ---
  children.push(
    sectionTitle("IV. CLAIM FOR RELIEF"),
    centered(underline("VIOLATION OF FIFTH AMENDMENT DUE PROCESS")),

    numberedPara(p(), normal("Petitioner incorporates all preceding paragraphs.")),

    numberedPara(p(), normal("The Fifth Amendment to the United States Constitution guarantees that no person shall be deprived of life, liberty, or property without due process of law.")),

    numberedPara(p(), normal("This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. "),
      italic("Zadvydas v. Davis"),
      normal(", 533 U.S. 678, 693 (2001); "),
      italic("Reno v. Flores"),
      normal(", 507 U.S. 292, 306 (1993).")
    ),

    numberedPara(p(), normal("Petitioner\u2019s detention violates both substantive and procedural due process in multiple, reinforcing ways.")),

    // A. Substantive Due Process
    subSectionTitle("A. Substantive Due Process: Indefinite Detention Without Individualized Determination"),

    numberedPara(p(), normal("The Supreme Court has held that indefinite or prolonged civil detention raises \u201Cserious constitutional concerns.\u201D "),
      italic("Zadvydas"),
      normal(", 533 U.S. at 690.")
    ),

    numberedPara(p(), normal("To avoid these concerns, the Supreme Court has \u201Cread an implicit limitation\u201D into immigration detention statutes requiring individualized determinations and temporal limits. "),
      italic("Id."),
      normal(" at 689.")
    ),

    numberedPara(p(), normal("The Supreme Court identified six months as a \u201Cpresumptively reasonable period\u201D for immigration detention. "),
      italic("Id."),
      normal(" at 701.")
    ),

    numberedPara(p(), normal(`While Petitioner has been detained for ${v(d.monthsDetained)} months, ${pro.subject} faces indefinite detention with no end in sight:`)),

    subPara("a", normal("Section 1225(b)(2)(A) contains no temporal limitation whatsoever;")),
    subPara("b", normal("The statute provides for detention \u201Cpending a proceeding under section 1229a,\u201D which could last months or years;")),
    subPara("c", normal("Petitioner\u2019s removal proceedings have no definite conclusion date and could last months or over a year for the adjudication and appellate process to conclude;")),
    subPara("d", normal("Cases involving applications for relief and appeal to the Board of Immigration Appeals routinely take 9\u201324+ months to resolve;")),
    subPara("e", normal("ICE has provided no timeline for completion of proceedings or release from detention.")),

    numberedPara(p(), normal(`Even though Petitioner has been detained for \u201Conly\u201D ${v(d.monthsDetained)} months, the trajectory of ${pro.possessive} case makes clear ${pro.subject} will be detained far beyond the six-month presumptively reasonable period absent intervention by this Court.`)),

    numberedPara(p(), normal("Unlike the post-deportation/removal order detention at issue in "),
      italic("Zadvydas"),
      normal(", Petitioner\u2019s detention is even more troubling because:")
    ),

    subPara("a", normal(`${pro.Subject} is detained during, not after, removal proceedings, when ${pro.subject} is actively pursuing relief;`)),
    subPara("b", normal("The proceedings themselves could last indefinitely;")),
    subPara("c", normal(`${pro.Subject} has had no hearing whatsoever to determine the necessity of detention; and`)),
    subPara("d", normal(`${pro.Subject} faces categorical detention based on a recently-changed legal classification, not individualized facts.`)),

    numberedPara(p(), normal("Respondents have made no individualized determination that Petitioner\u2019s continued detention is necessary to prevent flight or danger to the community, which are the only constitutionally permissible bases for preventive civil detention. "),
      italic("United States v. Salerno"),
      normal(", 481 U.S. 739, 748 (1987).")
    ),

    numberedPara(p(), normal("To the contrary, all evidence demonstrates Petitioner poses neither risk:")),

    subPara("a", normal(hasCriminal
      ? `Petitioner has resided in the United States for ${v(d.yearsInUS)} years with only ${v(d.criminalHistoryDetails, "a minor criminal citation")} which is not a violent or a crime of moral turpitude;`
      : `Petitioner has resided in the United States for ${v(d.yearsInUS)} years without a single criminal arrest, charge, or conviction;`)),
    subPara("b", normal(`Petitioner maintained stable employment and residence throughout ${pro.possessive} time in the United States${d.employmentDetails && d.employmentDetails.trim() ? " " + d.employmentDetails.trim() : ""};`)),
    subPara("c", normal(hasCriminal
      ? "Petitioner had zero violations of immigration condition;"
      : "Petitioner had zero violations of any law or immigration condition;")),
    subPara("d", normal(`Petitioner has deep family ties to the United States, including ${v(d.usCitizenFamilyMembers, "U.S. citizen/LPR family members")};`)),
    subPara("e", normal("No individualized assessment has ever identified Petitioner as a flight risk or danger.")),

    numberedPara(p(), normal(`Petitioner\u2019s detention is purely categorical, based solely on ${pro.possessive} legal classification as an \u201Capplicant for admission\u201D\u2014not on any individualized finding that ${pro.subject} personally requires detention.`)),

    numberedPara(p(), normal("This categorical, indefinite detention without individualized determination violates substantive due process.")),

    // B. Procedural Due Process
    subSectionTitle("B. Procedural Due Process: Complete Deprivation of Hearing"),

    numberedPara(p(), normal("The Fifth Amendment requires meaningful procedural protections before deprivation of physical liberty\u2014one of the most fundamental interests protected by the Constitution.")),

    numberedPara(p(), normal("Under "),
      italic("Mathews v. Eldridge"),
      normal(", 424 U.S. 319, 335 (1976), courts apply a three-part balancing test to determine what process is due: (1) the private interest affected by government action; (2) the risk of erroneous deprivation through procedures used and the probable value of additional safeguards; and (3) the government\u2019s interest, including the fiscal and administrative burdens of additional procedures.")
    ),

    numberedPara(p(), normal("Applying the "),
      italic("Mathews"),
      normal(" balancing test here, the constitutional scales tip overwhelmingly in favor of providing Petitioner a hearing.")
    ),

    numberedPara(p(), bold("First Factor: Private Interest. "), normal(`Petitioner\u2019s private interest is among the most fundamental protected by the Constitution\u2014physical liberty and the ability to remain with ${pro.possessive} family.`)),

    numberedPara(p(), bold("Second Factor: Risk of Erroneous Deprivation. "), normal("The risk of erroneous deprivation here is not merely substantial\u2014it is 100%.")),

    numberedPara(p(), bold("Third Factor: Government Interest. "), normal(hasCriminal
      ? `The government\u2019s interests are preventing flight and protecting public safety. However, these interests are not served by detaining someone who has proven through years of peaceful residence that ${pro.subject} will appear and poses no danger.`
      : `The government\u2019s interests are preventing flight and protecting public safety. However, these interests are not served by detaining someone who has proven through years of law-abiding conduct that ${pro.subject} will appear and poses no danger.`)),

    numberedPara(p(), normal("The "),
      italic("Mathews"),
      normal(` balancing test overwhelmingly favors providing Petitioner a hearing before a neutral decision-maker with authority to order release upon a showing that ${pro.subject} is not a flight risk or danger.`)
    ),

    numberedPara(p(), normal("At minimum, due process requires:")),
    subPara("a", normal("Notice of the reasons for continued detention;")),
    subPara("b", normal("An opportunity to present evidence that Petitioner is neither a flight risk nor a danger to the community;")),
    subPara("c", normal("A hearing before a neutral decision-maker (not ICE, which is the prosecuting/detaining authority); and")),
    subPara("d", normal(`Authority in that decision-maker to order release on bond or conditions if Petitioner meets ${pro.possessive} burden.`)),

    numberedPara(p(), normal(`Respondents have provided none of these procedural protections. Petitioner has received no hearing, no opportunity to present evidence of ${pro.possessive} ties and compliance, and no review by any neutral arbiter.`)),

    numberedPara(p(), normal("This complete deprivation of process violates the Fifth Amendment.")),

    // C. Equal Protection
    subSectionTitle("C. Equal Protection: Arbitrary Classification"),

    numberedPara(p(), normal("The Fifth Amendment\u2019s due process clause incorporates equal protection principles applicable to federal government action. "),
      italic("Bolling v. Sharpe"),
      normal(", 347 U.S. 497, 499 (1954).")
    ),

    numberedPara(p(), normal("Equal protection requires that the government treat similarly situated individuals alike, absent a rational basis for differential treatment.")),

    numberedPara(p(), normal(`Respondents treat Petitioner\u2014who entered the United States without inspection ${v(d.yearsInUS)} years ago\u2014fundamentally differently from a noncitizen who entered lawfully but overstayed a visa for many years.`)),

    numberedPara(p(), normal("These two individuals are identically situated in all relevant respects.")),

    numberedPara(p(), normal("Yet the government treats them completely differently.")),

    numberedPara(p(), normal(`This differential treatment is based solely on the manner of entry many years ago\u2014a factor that bears no rational relationship to the government\u2019s stated interests in preventing flight and protecting public safety.`)),

    numberedPara(p(), normal(`Indeed, the manner of entry ${v(d.yearsInUS)} years ago tells us nothing about current flight risk or danger.`)),

    numberedPara(p(), normal("The government\u2019s asserted interest in \u201Cequal treatment\u201D of noncitizens at the border and in the interior cannot justify this arbitrary classification.")),

    numberedPara(p(), normal("This classification violates equal protection because it treats identically situated individuals differently based on an arbitrary factor unrelated to any legitimate government interest.")),

    // D. Arbitrary and Capricious
    subSectionTitle("D. Arbitrary and Capricious Government Action: Detention After Prolonged Non-Enforcement"),

    numberedPara(p(), normal("The Due Process Clause prohibits arbitrary government action. "),
      italic("County of Sacramento v. Lewis"),
      normal(", 523 U.S. 833, 845\u201346 (1998).")
    ),

    numberedPara(p(), normal(`The government\u2019s sudden decision to detain Petitioner after ${v(d.yearsInUS)} years of non-enforcement, with no change whatsoever in ${pro.possessive} individual circumstances, constitutes arbitrary government action.`)),

    numberedPara(p(), normal(`During ${v(d.yearsInUS)} years of physical presence in the United States, Petitioner built an established life in reasonable reliance on ${pro.possessive} circumstances.`)),

    numberedPara(p(), normal(hasCriminal
      ? `The government\u2019s prolonged non-enforcement over ${v(d.yearsInUS)} years demonstrates that Petitioner presents no flight risk or danger. `
      : `The government\u2019s prolonged non-enforcement over ${v(d.yearsInUS)} years, combined with Petitioner\u2019s complete compliance with all applicable laws during that period, demonstrates that Petitioner presents no flight risk or danger. `),
      italic("Salerno"),
      normal(", 481 U.S. at 748.")
    ),

    numberedPara(p(), normal(`Now, with no change in Petitioner\u2019s individual circumstances, the government has detained ${pro.object} based solely on a policy change following `),
      italic("Buenrostro-Mendez"),
      normal(". This is the paradigm of arbitrary action.")
    ),

    numberedPara(p(), normal(`While the ${tpl.circuitName} Circuit has not recognized a formal doctrine of \u201Cnon-enforcement acquiescence\u201D in the immigration detention context, the due process prohibition on arbitrary government action provides an independent basis for relief. See `),
      italic("Lewis"),
      normal(", 523 U.S. at 845\u201346.")
    ),

    numberedPara(p(), normal(`This arbitrary detention, premised solely on a policy change and Petitioner\u2019s manner of entry ${v(d.yearsInUS)} years ago rather than any current, individualized assessment, violates the Fifth Amendment\u2019s due process guarantee.`)),

    // E. As-Applied
    subSectionTitle("E. As-Applied Constitutional Challenge"),

    numberedPara(p(), normal("Even if \u00A71225(b)(2)(A) could be constitutionally applied to some individuals in some circumstances, its application to Petitioner violates the Constitution.")),

    numberedPara(p(), normal("Petitioner presents the precise scenario where mandatory detention without a hearing cannot be constitutionally sustained:")),

    subPara("a", normal(`Long-term U.S. resident (${v(d.yearsInUS)} years) with deep community and family ties;`)),
    subPara("b", normal(`Government engaged in ${v(d.yearsInUS)} years of non-enforcement, during which Petitioner demonstrated zero flight risk or danger;`)),
    ...(hasCriminal ? [] : [
      subPara("c", normal("Proven track record of compliance with all applicable laws, eliminating any individualized flight risk or danger concern;")),
    ]),
    subPara(hasCriminal ? "c" : "d", normal("Indefinite detention with no timeline for completion of proceedings;")),
    subPara(hasCriminal ? "d" : "e", normal(`Strong case for relief from removal (${reliefText});`)),
    subPara(hasCriminal ? "e" : "f", normal("Severe, irreparable harm from continued detention; and")),
    subPara(hasCriminal ? "f" : "g", normal("Detention based solely on a policy change, not individual facts.")),

    numberedPara(p(), normal("The Fifth Circuit in "),
      italic("Buenrostro-Mendez"),
      normal(" acknowledged that constitutional concerns about \u00A71225(b)(2)(A) were \u201Cwholly speculative\u201D at the time. Slip op. at 21.")
    ),

    numberedPara(p(), normal(`Petitioner\u2019s case makes these concerns concrete, not speculative. This is precisely the type of as-applied challenge the ${tpl.circuitName} Circuit did not address and could not foreclose.`)),

    numberedPara(p(), normal("For all these reasons, Petitioner\u2019s continued detention violates the Fifth Amendment\u2019s guarantee of due process and equal protection.")),

    // V. PRAYER FOR RELIEF
    sectionTitle("V. PRAYER FOR RELIEF"),

    justified(bold("WHEREFORE"), normal(", Petitioner respectfully requests that this Court:")),

    subPara("a", normal("Declare that Petitioner\u2019s continued detention violates the Fifth Amendment to the United States Constitution;")),
    subPara("b", normal("Issue a Writ of Habeas Corpus ordering Petitioner\u2019s immediate release from custody, subject to reasonable conditions of supervision including GPS monitoring, regular ICE check-ins, surrender of travel documents, and/or reasonable bond;")),
    subPara("c", normal("Alternatively, order Respondents to provide Petitioner with an individualized hearing before a neutral decision-maker within seven (7) days;")),
    subPara("d", normal(`Enjoin Respondents from continuing to detain Petitioner in violation of ${pro.possessive} constitutional rights;`)),
    subPara("e", normal("Order a stay of removal proceedings pending resolution of this petition;")),
    subPara("f", normal("Award costs and attorney\u2019s fees pursuant to 28 U.S.C. \u00A72412 and other applicable law; and")),
    subPara("g", normal("Grant such other and further relief as the Court deems just and proper.")),

    // VI. VERIFICATION
    sectionTitle("VI. VERIFICATION"),

    justified(normal("I declare under penalty of perjury that the foregoing is true and correct.")),

    emptyLine(),
    emptyLine(),

    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("Respectfully submitted,")],
    }),
    emptyLine(),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [italic("/s/ Manuel E. Solis")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [bold("Manuel E. Solis")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("Attorney for Petitioner")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("State Bar No. 18826790")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("P.O. Box 230593")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("Houston TX 77223")],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 4320 },
      children: [normal("Houston Office: 713-481-1030")],
    }),
    new Paragraph({
      spacing: { after: 200 },
      indent: { left: 4320 },
      children: [normal("casestatus@manuelsolis.com")],
    }),

    // CERTIFICATES OF SERVICE
    ...generateCertificateOfService(
      formatDate(d.serviceDateWarden || d.serviceDateFieldOffice),
      `${v(d.wardenName, "RANDY TATE").toUpperCase()}, in ${v(d.wardenTitle, "his")} Official Capacity as Warden of the ${v(d.facilityName, "Montgomery Processing Center")}`,
      `Immigration and Customs Enforcement (\u201CICE\u201D) ${v(d.facilityName, "Montgomery Processing Center")}, located at ${v(d.facilityAddress, "[ADDRESS]")}`
    ),

    ...generateCertificateOfService(
      formatDate(d.serviceDateFieldOffice),
      `${v(d.fieldOfficeDirector, tpl.defaultFieldOfficeDirector)}, in his Official Capacity as Field Office Director, of ICE Enforcement and Removal Operations ${v(d.eroFieldOffice, tpl.defaultEroFieldOffice)}`,
      `(1) Office of the Field Office Director, Enforcement and Removal Operations, ${v(d.eroFieldOffice, tpl.defaultEroFieldOffice)}, ${getEroFieldOfficeAddress(d.eroFieldOffice) || "126 Northpoint Drive, Houston, Texas 77060"}`
    ),

    ...generateCertificateOfService(
      formatDate(d.serviceDateDHS),
      "MARKWAYNE MULLIN, in his Official Capacity as Director of U.S. Department of Homeland Security",
      "(1) Office of General Counsel, U.S. Department of Homeland Security, 245 Murray Lane, SW, Mail Stop 0485, Washington, D.C. 20530"
    ),

    ...generateCertificateOfServiceEmail(
      formatDate(d.serviceDateAG),
      "Todd Blanche, in his Official Capacity as Acting Attorney General of the United States",
      "Office of the Attorney General, 950 Pennsylvania Avenue, NW Washington, DC 20530"
    ),
  );

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
                    font: "Times New Roman",
                    size: CURRENT_SIZE - 4,
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

function certSignatureBlock(date: string): Paragraph[] {
  const rightTab = { type: TabStopType.RIGHT, position: TabStopPosition.MAX };
  return [
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [normal("/s/ Manuel Solis"), normal("\t"), underline(date)],
    }),
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [normal("Manuel Solis"), normal("\t"), underline("Date")],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [normal("Attorney for Petitioner")],
    }),
  ];
}

function generateCertificateOfService(date: string, respondent: string, address: string): Paragraph[] {
  return [
    centered(bold("CERTIFICATE OF SERVICE")),
    justified(
      normal(`On ${date}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, ${respondent}, at the ${address}.`)
    ),
    emptyLine(),
    ...certSignatureBlock(date),
  ];
}

function generateCertificateOfServiceEmail(date: string, respondent: string, address: string): Paragraph[] {
  return [
    centered(bold("CERTIFICATE OF SERVICE")),
    justified(
      normal(`On ${date}, Counsel for Plaintiff served a copy of the attached Petition via email, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, ${respondent}, at ${address}.`)
    ),
    emptyLine(),
    ...certSignatureBlock(date),
  ];
}

// ============================================================================
// OKLAHOMA TEMPLATE (W.D. Oklahoma) — §1226 / pending BIA appeal theory
// Replicates the corrected petition format provided by local counsel.
// ============================================================================

function leftPara(...runs: TextRun[]): Paragraph {
  return new Paragraph({ spacing: { after: 60 }, children: runs });
}

function emailLinkPara(email: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new ExternalHyperlink({
        link: `mailto:${email}`,
        children: [
          new TextRun({ text: email, font: "Times New Roman", size: CURRENT_SIZE, color: "0563C1", underline: { type: UnderlineType.SINGLE } }),
        ],
      }),
    ],
  });
}

function okSignatureBlock(): Paragraph[] {
  const lc = templates.oklahoma.localCounsel!;
  return [
    leftPara(normal("Respectfully submitted,")),
    emptyLine(),
    leftPara(italicUnderline("/s/ Manuel E. Solis")),
    leftPara(bold("Manuel E. Solis")),
    leftPara(normal("Attorney for Petitioner")),
    leftPara(normal("State Bar No. 18826790")),
    leftPara(normal("P.O. Box 230593")),
    leftPara(normal("Houston TX 77223")),
    leftPara(normal("Houston Office: 713-481-1030")),
    emailLinkPara("casestatus@manuelsolis.com"),
    emptyLine(),
    leftPara(italicUnderline(`/s/ ${lc.name}`)),
    leftPara(bold(`${lc.name}, ${lc.bar}`)),
    leftPara(normal(lc.firm)),
    ...lc.addressLines.map((l) => leftPara(normal(l))),
    leftPara(normal(lc.phone)),
    emailLinkPara(lc.email),
    leftPara(italic("Local Counsel")),
  ];
}

function okCertSignatureBlock(date: string): Paragraph[] {
  const lc = templates.oklahoma.localCounsel!;
  const rightTab = { type: TabStopType.RIGHT, position: TabStopPosition.MAX };
  return [
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [italicUnderline("/s/ Manuel Solis"), normal("\t"), underline(date)],
    }),
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [rightTab],
      children: [normal("Manuel Solis"), normal("\t"), underline("Date")],
    }),
    leftPara(normal("Attorney for Petitioner")),
    emptyLine(),
    leftPara(italicUnderline(`/s/ ${lc.name}`)),
    leftPara(normal(lc.name)),
    leftPara(normal("Local Counsel")),
    emptyLine(),
  ];
}

function okCertificate(date: string, respondent: string, address: string, via = "USPS Mail"): Paragraph[] {
  return [
    centered(bold("CERTIFICATE OF SERVICE")),
    justified(
      normal(`On ${date}, Counsel for Petitioner served a copy of the attached Petition via ${via}, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, ${respondent}, at ${address}.`)
    ),
    emptyLine(),
    ...okCertSignatureBlock(date),
  ];
}

function detentionDuration(detentionDate?: string, monthsFallback?: string): string {
  if (detentionDate) {
    const start = new Date(detentionDate);
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

/** Split caption text into fixed-width lines so each visual line gets its own § (no gaps). */
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

export function generateOklahomaDocument(data: CaseData): Document {
  const d = data;
  const tpl = templates.oklahoma;
  CURRENT_SIZE = tpl.fontSizeHalfPoints;
  const hasCriminal = d.hasCriminalHistory === "yes";
  const pro = d.petitionerGender === "female"
    ? { subject: "she", Subject: "She", object: "her", possessive: "her", Possessive: "Her" }
    : { subject: "he", Subject: "He", object: "him", possessive: "his", Possessive: "His" };
  let pn = 0;
  const p = () => String(++pn);

  const facility = v(d.facilityName, "the detention facility");
  const warden = v(d.wardenName, "WARDEN");
  const fod = v(d.fieldOfficeDirector, tpl.defaultFieldOfficeDirector);
  const ero = v(d.eroFieldOffice, tpl.defaultEroFieldOffice);
  const removalDate = formatDate(d.removalOrderDate || "");
  const dur = detentionDuration(d.detentionDate, d.monthsDetained);

  const children: (Paragraph | Table)[] = [
    // CAPTION
    centered(bold("UNITED STATES DISTRICT COURT")),
    ...tpl.captionLines.map((line) => centered(bold(line))),
    centered(bold(`CIVIL No. ${v(d.civilNo, "__________")}`)),

    new Paragraph({
      spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
      children: [],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        ...wrapCaptionText(`${v(d.petitionerName).toUpperCase()},`).map((l, i) => captionRow([normal(l)], [], i === 0 ? 0 : 288)),
        captionRow([], []),
        captionRow([normal("Petitioner")], []),
        captionRow([], []),
        captionRow([], [bold("PETITION FOR")]),
        captionRow([normal("v.")], [bold("WRIT OF HABEAS CORPUS")]),
        captionRow([], [bold("PURSUANT TO 28 U.S.C")]),
        captionRow([], [bold("\u00A72241")]),
        ...wrapCaptionText(`1. ${warden.toUpperCase()}, in the official capacity as Warden of the ${facility};`).map((l, i) => captionRow([normal(l)], [], i === 0 ? 0 : 288)),
        captionRow([], []),
        ...wrapCaptionText(`2. ${fod.toUpperCase()}, in his official capacity as Field Office Director of ICE Enforcement and Removal Operations ${ero};`).map((l, i) => captionRow([normal(l)], [], i === 0 ? 0 : 288)),
        captionRow([], []),
        ...wrapCaptionText("3. MARKWAYNE MULLIN, in his official capacity as Secretary of the Department of Homeland Security;").map((l, i) => captionRow([normal(l)], [], i === 0 ? 0 : 288)),
        captionRow([], []),
        ...wrapCaptionText("4. TODD BLANCHE, in his official capacity as Acting Attorney General of the United States,").map((l, i) => captionRow([normal(l)], [], i === 0 ? 0 : 288)),
        captionRow([], []),
        captionRow([normal("Respondents.")], []),
      ],
    }),

    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
      children: [],
    }),

    centered(bold("PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C.")),
    centered(bold("\u00A72241")),
    centered(bold("AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF")),
    emptyLine(),

    // I. INTRODUCTION
    sectionTitle("I. INTRODUCTION"),
    justified(normal(`Petitioner has been detained by Immigration and Customs Enforcement (\u201CICE\u201D) for approximately ${dur} without any determination that ${pro.subject} presently poses a flight risk or danger to the community. ${pro.Subject} seeks immediate release or, at minimum, a hearing before a neutral decision-maker.`)),
    justified(normal(`Although an Immigration Judge entered a removal order on ${removalDate}, Petitioner timely appealed that decision to the Board of Immigration Appeals (\u201CBIA\u201D), and the appeal remains pending. Accordingly, Petitioner\u2019s removal proceedings are ongoing.`)),
    justified(normal(`Prior to ${pro.possessive} detention, Petitioner resided in the United States for approximately ${v(d.yearsInUS)} years, during which ${pro.subject} maintained stable employment and residence and developed substantial family and community ties in the United States.`)),

    // II. JURISDICTION
    sectionTitle("II. JURISDICTION AND AUTHORITY"),
    numberedPara(p(), normal("Jurisdiction lies under 28 U.S.C. \u00A72241 and 28 U.S.C. \u00A71331.")),
    numberedPara(p(), normal("Federal courts possess habeas jurisdiction over constitutional and statutory challenges to immigration detention pursuant to 28 U.S.C. \u00A7\u00A7 2241 and 1331. See "),
      italic("Zadvydas v. Davis"), normal(", 533 U.S. 678 (2001); "),
      italic("Jennings v. Rodriguez"), normal(", 583 U.S. 281 (2018).")
    ),

    // III. STATEMENT OF FACTS
    sectionTitle("III. STATEMENT OF FACTS"),
    subSectionTitle("1. Background and Family Ties"),
    numberedPara(p(), normal(`Petitioner is ${v(d.petitionerAge)} years old and has resided in the United States for ${v(d.yearsInUS)} years, since ${v(d.yearOfEntry)}. See attached Exhibit A: Passport.`)),
    numberedPara(p(), normal(`Petitioner and ${pro.possessive} family live at ${v(d.petitionerAddress)}.`)),
    numberedPara(p(), normal(hasCriminal
      ? `Petitioner was previously charged with ${v(d.criminalHistoryDetails, "a criminal offense")}; however, the charge was dismissed and did not result in a conviction. Petitioner has no criminal convictions and no history of violent conduct. Other than unlawful entry in ${v(d.yearOfEntry)}, Petitioner has no history of immigration violations.`
      : `Petitioner has no criminal convictions and no history of violent conduct. Other than unlawful entry in ${v(d.yearOfEntry)}, Petitioner has no history of immigration violations.`)),

    subSectionTitle("2. Detention Under \u00A71225(b)(2)(A)"),
    numberedPara(p(), normal(`On ${formatDate(d.detentionDate)}, ICE apprehended Petitioner during ${v(d.apprehensionCircumstance)} and took ${pro.object} into custody.`)),
    numberedPara(p(), normal(`Respondents continue to detain Petitioner pursuant to 8 U.S.C. \u00A71225(b)(2)(A) based solely upon ${pro.possessive} manner of entry approximately ${v(d.yearsInUS)} years ago.`)),
    numberedPara(p(), normal(`Petitioner has been continuously detained at ${facility} since ${formatDate(d.detentionDate)}\u2014a total of ${dur} to date. See attached Exhibit B: Detainee Locator.`)),

    subSectionTitle("3. Current Removal Proceedings and Administrative Appeal"),
    numberedPara(p(), normal(`On ${removalDate}, an Immigration Judge entered an order of removal against Petitioner. Petitioner timely appealed that decision to the Board of Immigration Appeals (\u201CBIA\u201D), and the appeal remains pending.`)),
    numberedPara(p(), normal(`Because Petitioner\u2019s BIA appeal remains pending, ${pro.possessive} removal proceedings are ongoing and the removal order is not yet administratively final for purposes of detention authority.`)),
    numberedPara(p(), normal(`ICE has provided no timeline regarding the completion of appellate proceedings or the duration of Petitioner\u2019s continued detention during the pendency of BIA review.`)),

    subSectionTitle("4. Harm from Continued Detention"),
    numberedPara(p(), normal("Petitioner\u2019s continued detention causes severe and irreparable harm.")),
    numberedPara(p(), bold("Economic Harm: "), normal(v(d.economicHarm, "Loss of employment and income; family unable to meet household expenses, threatening the stability and well-being of Petitioner\u2019s family."))),
    numberedPara(p(), bold("Familial Harm: "), normal(v(d.familialHarm, "Forced separation from Petitioner\u2019s family, causing irreparable emotional harm and undermining the best interests of Petitioner\u2019s U.S. citizen family members."))),
    numberedPara(p(), bold("Inability to Defend Against Removal: "), normal(`Petitioner is unable to gather documentary evidence for ${pro.possessive} relief application while in custody; ${pro.subject} has limited access to ${pro.possessive} attorney while in ICE custody; ${pro.subject} cannot locate witnesses or obtain declarations needed to defend ${pro.possessive} case.`)),
    numberedPara(p(), normal("Each day of continued detention exacerbates these harms.")),

    // IV. CLAIM FOR RELIEF
    sectionTitle("IV. CLAIM FOR RELIEF"),
    centered(bold("PETITIONER REMAINS DETAINED UNDER 8 U.S.C. \u00A71226 BECAUSE HIS REMOVAL ORDER IS NOT YET ADMINISTRATIVELY FINAL")),
    numberedPara(p(), normal("Petitioner incorporates all preceding paragraphs.")),
    numberedPara(p(), normal(`Although an Immigration Judge entered a removal order on ${removalDate}, Petitioner timely appealed that decision to the Board of Immigration Appeals (\u201CBIA\u201D).`)),
    numberedPara(p(), normal("Because the BIA appeal remains pending, the removal order is not yet administratively final for purposes of detention authority.")),
    numberedPara(p(), normal("Because Petitioner\u2019s appeal remains pending before the BIA, detention authority properly arises under 8 U.S.C. \u00A71226 pending completion of removal proceedings.")),
    numberedPara(p(), normal("Section 1226 governs detention of noncitizens during the pendency of removal proceedings, including appellate review before the BIA.")),
    numberedPara(p(), normal("Unlike post-final-order detention under 8 U.S.C. \u00A71231, detention under \u00A71226 must remain reasonably related to its regulatory purposes of preventing flight and protecting public safety.")),
    numberedPara(p(), normal("Continued detention without constitutionally adequate procedures ensuring that detention remains justified based upon present flight risk or danger violates the Due Process Clause of the Fifth Amendment.")),

    centered(underline("VIOLATION OF FIFTH AMENDMENT DUE PROCESS")),
    numberedPara(p(), normal("The Fifth Amendment to the United States Constitution guarantees that no person shall be deprived of life, liberty, or property without due process of law.")),
    numberedPara(p(), normal("This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. "),
      italic("Zadvydas v. Davis"), normal(", 533 U.S. 678, 693 (2001); "),
      italic("Reno v. Flores"), normal(", 507 U.S. 292, 306 (1993).")
    ),
    numberedPara(p(), normal("Petitioner\u2019s detention violates both substantive and procedural due process in multiple, reinforcing ways.")),

    // A.
    subSectionTitle("A. Procedural and Substantive Due Process Violations Arising from Mandatory Detention Without Constitutionally Adequate Procedural Safeguards"),
    numberedPara(p(), normal(`Although Petitioner has presently been detained for approximately ${dur}, ongoing removal proceedings and appellate review before the BIA may substantially prolong detention absent constitutionally adequate procedural safeguards.`)),
    numberedPara(p(), normal("Because detention remains governed by \u00A71226 during the pendency of BIA proceedings, due process requires constitutionally adequate procedures to ensure continued detention remains justified based upon present flight risk or danger.")),
    numberedPara(p(), normal("Petitioner\u2019s detention raises serious constitutional concerns because:")),
    subPara("a", normal(`${pro.subject} remains detained during ongoing removal proceedings and appellate review;`)),
    subPara("b", normal("proceedings before the BIA may substantially extend detention;")),
    subPara("c", normal(`${pro.subject} has not received constitutionally adequate procedures ensuring continued detention remains justified based upon present flight risk or danger; and`)),
    subPara("d", normal("Respondents continue to impose mandatory detention without meaningful review before a neutral decision-maker.")),
    numberedPara(p(), normal("Respondents have not provided constitutionally adequate procedures demonstrating that Petitioner\u2019s continued detention remains necessary to prevent flight or protect public safety, which are the recognized regulatory purposes of civil immigration detention. See "),
      italic("United States v. Salerno"), normal(", 481 U.S. 739, 748 (1987).")
    ),
    numberedPara(p(), normal("The available evidence demonstrates Petitioner does not presently pose a danger to the community or significant flight risk:")),
    subPara("a", normal(`Petitioner has resided in the United States for approximately ${v(d.yearsInUS)} years;`)),
    ...(hasCriminal
      ? [subPara("b", normal(`although Petitioner was previously charged with ${v(d.criminalHistoryDetails, "a criminal offense")}, the charge was dismissed and resulted in no conviction;`))]
      : [subPara("b", normal("Petitioner has no criminal convictions;"))]),
    subPara("c", normal("Petitioner maintained stable employment and residence prior to detention;")),
    subPara("d", normal(`Petitioner has substantial family ties in the United States, including ${v(d.usCitizenFamilyMembers, "U.S. citizen family members")}; and`)),
    subPara("e", normal("Respondents have not demonstrated that continued detention remains necessary to prevent flight or protect public safety.")),
    numberedPara(p(), normal(`Respondents continue to detain Petitioner based upon ${pro.possessive} statutory classification as an \u201Capplicant for admission\u201D without constitutionally adequate procedures ensuring that continued detention remains justified based upon present flight risk or danger.`)),
    numberedPara(p(), normal("Continued mandatory detention without constitutionally adequate procedures violates substantive due process.")),

    // B.
    subSectionTitle("B. Procedural Due Process Violations"),
    numberedPara(p(), normal("The Fifth Amendment requires meaningful procedural protections before deprivation of physical liberty\u2014one of the most fundamental interests protected by the Constitution.")),
    numberedPara(p(), normal("Under "),
      italic("Mathews v. Eldridge"), normal(", 424 U.S. 319, 335 (1976), courts apply a three-part balancing test to determine what process is due: (1) the private interest affected by government action; (2) the risk of erroneous deprivation through procedures used and the probable value of additional safeguards; and (3) the government\u2019s interest, including the fiscal and administrative burdens of additional procedures.")
    ),
    numberedPara(p(), normal("Applying the "), italic("Mathews"), normal(" balancing test here, the constitutional scales tip overwhelmingly in favor of providing Petitioner a hearing.")),
    numberedPara(p(), bold("First Factor: Private Interest. "), normal(`Petitioner\u2019s private interest is among the most fundamental protected by the Constitution\u2014physical liberty and the ability to remain with ${pro.possessive} family.`)),
    numberedPara(p(), bold("Second Factor: Risk of Erroneous Deprivation. "), normal("The risk of erroneous deprivation is substantial because Petitioner remains detained without constitutionally adequate procedures to ensure that continued detention is justified based upon present flight risk or danger.")),
    numberedPara(p(), bold("Third Factor: Government Interest. "), normal("The government\u2019s interests are preventing flight and protecting public safety. However, those interests are not materially advanced by continued detention of an individual who has demonstrated longstanding residence, stable employment, substantial family ties, and no criminal convictions.")),
    numberedPara(p(), normal("The "), italic("Mathews"), normal(` balancing test overwhelmingly favors providing Petitioner a hearing before a neutral decision-maker with authority to order release upon a showing that ${pro.subject} is not a flight risk or danger.`)),
    numberedPara(p(), normal("At minimum, due process requires:")),
    subPara("a", normal("Notice of the reasons for continued detention;")),
    subPara("b", normal("An opportunity to present evidence that Petitioner is neither a flight risk nor a danger to the community;")),
    subPara("c", normal("A hearing before a neutral decision-maker (not ICE, which is the prosecuting/detaining authority); and")),
    subPara("d", normal(`Authority in that decision-maker to order release on bond or conditions if Petitioner meets ${pro.possessive} burden.`)),
    numberedPara(p(), normal("Respondents have not provided Petitioner with constitutionally adequate procedures before a neutral decision-maker with authority to order release based upon present flight risk or danger.")),
    numberedPara(p(), normal("Under these circumstances, the procedures afforded to Petitioner are constitutionally inadequate under the Fifth Amendment.")),

    // C.
    subSectionTitle("C. As-Applied Constitutional Challenge"),
    numberedPara(p(), normal("Even if detention under \u00A71226 may initially be permissible, continued detention without constitutionally adequate procedural safeguards violates due process as applied to Petitioner.")),
    numberedPara(p(), normal("Petitioner presents substantial constitutional concerns because:")),
    subPara("a", normal(`${pro.possessive} removal proceedings remain pending before the BIA;`)),
    subPara("b", normal(`${pro.possessive} detention continues without constitutionally adequate procedures before a neutral decision-maker;`)),
    subPara("c", normal(`${pro.subject} has substantial family, employment, and community ties developed over approximately ${v(d.yearsInUS)} years in the United States;`)),
    subPara("d", normal(`${pro.subject} has no criminal convictions;`)),
    subPara("e", normal("continued detention imposes severe hardship upon both Petitioner and Petitioner\u2019s family; and")),
    subPara("f", normal("Respondents have failed to demonstrate that continued detention remains necessary based upon present flight risk or danger.")),
    numberedPara(p(), normal("Although the Tenth Circuit has not directly resolved the constitutional limits of prolonged detention during pending removal proceedings, the Supreme Court has repeatedly recognized that immigration detention statutes must be construed consistent with the Due Process Clause. See "),
      italic("Zadvydas v. Davis"), normal(", 533 U.S. 678 (2001); "),
      italic("Jennings v. Rodriguez"), normal(", 583 U.S. 281 (2018).")
    ),
    numberedPara(p(), normal("Under these circumstances, continued detention without constitutionally adequate procedural safeguards violates the Fifth Amendment.")),

    // D.
    subSectionTitle("D. Petitioner Should Not Be Required to Exhaust Administrative Remedies"),
    numberedPara(p(), normal("Petitioner should not be made to exhaust administrative remedies before the Executive Office of Immigration Review.")),
    numberedPara(p(), normal("The immigration courts and the Board of Immigration Appeals (\u201CBIA\u201D) are bound by agency precedence.")),
    numberedPara(p(), normal("On September 5, 2025, the BIA issued its ruling in "),
      italic("Yajure Hurtado"), normal(", 29 I&N Dec. 216 (BIA 2025), holding that noncitizens who entered without inspection, like Petitioner, are subject to mandatory detention. 29 I&N Dec. 216, 220-21 (BIA 2025).")
    ),
    numberedPara(p(), normal("Requiring Petitioner to seek further administrative review would be futile because the Board of Immigration Appeals has already determined in "),
      italic("Matter of Yajure Hurtado"), normal(" that similarly situated noncitizens are subject to mandatory detention.")
    ),
    numberedPara(p(), normal("Accordingly, further administrative exhaustion would not provide Petitioner an adequate or meaningful remedy regarding the constitutional claims raised in this habeas proceeding.")),
    numberedPara(p(), normal("Thus, this Court should not require Petitioner to exhaust administrative remedies before granting habeas corpus relief.")),

    // V. PRAYER FOR RELIEF
    sectionTitle("V. PRAYER FOR RELIEF"),
    justified(bold("WHEREFORE"), normal(", Petitioner respectfully requests that this Court:")),
    subPara("a", normal("Declare that Petitioner\u2019s continued detention violates the Fifth Amendment to the United States Constitution;")),
    subPara("b", normal("Issue a Writ of Habeas Corpus ordering Petitioner\u2019s immediate release from custody, subject to reasonable conditions of supervision including GPS monitoring, regular ICE check-ins, surrender of travel documents, and/or reasonable bond;")),
    subPara("c", normal("Alternatively, order Respondents to provide Petitioner with an individualized hearing before a neutral decision-maker within seven (7) days;")),
    subPara("d", normal(`Enjoin Respondents from continuing to detain Petitioner in violation of ${pro.possessive} constitutional rights;`)),
    subPara("e", normal("Order a stay of removal proceedings pending resolution of this petition;")),
    subPara("f", normal("Award costs and attorney\u2019s fees pursuant to 28 U.S.C. \u00A72412 and other applicable law; and")),
    subPara("g", normal("Grant such other and further relief as the Court deems just and proper.")),

    // VI. VERIFICATION
    sectionTitle("VI. VERIFICATION"),
    centered(normal("I declare under penalty of perjury that the foregoing is true and correct.")),
    emptyLine(),
    ...okSignatureBlock(),

    // CERTIFICATES OF SERVICE
    ...okCertificate(
      formatDate(d.serviceDateWarden || d.serviceDateFieldOffice),
      `${warden.toUpperCase()}, in ${v(d.wardenTitle, "Warden")} Official Capacity as Warden of the ${facility}`,
      `the Immigration and Customs Enforcement (\u201CICE\u201D) ${facility}, located at ${v(d.facilityAddress, "[ADDRESS]")}`
    ),
    ...okCertificate(
      formatDate(d.serviceDateFieldOffice),
      `${fod}, in his Official Capacity as Field Office Director, of ICE Enforcement and Removal Operations ${ero}`,
      `the Office of the Field Office Director, Enforcement and Removal Operations, ${ero}, ${getEroFieldOfficeAddress(d.eroFieldOffice) || "8101 N. Stemmons Frwy, Dallas, TX 75247"}`
    ),
    ...okCertificate(
      formatDate(d.serviceDateDHS),
      "MARKWAYNE MULLIN, in his Official Capacity as Director of U.S. Department of Homeland Security",
      "the Office of General Counsel, U.S. Department of Homeland Security, 245 Murray Lane, SW, Mail Stop 0485, Washington, D.C. 20530"
    ),
    ...okCertificate(
      formatDate(d.serviceDateAG),
      "Todd Blanche, in his Official Capacity as Acting Attorney General of the United States",
      "Office of the Attorney General, 950 Pennsylvania Avenue, NW Washington, DC 20530",
      "mail"
    ),
  ];

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: CURRENT_SIZE - 4 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: ["-- ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES, " --"], font: "Times New Roman", size: CURRENT_SIZE - 4 })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}
