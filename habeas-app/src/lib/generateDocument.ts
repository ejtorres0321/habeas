import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  Header,
  PageNumber,
  NumberFormat,
  UnderlineType,
  BorderStyle,
} from "docx";

interface CaseData {
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

  immigrationCourtLocation: string;
  nextHearingDate: string;
  reliefType: string;
  familyDetails: string;
  spouseInfo: string;
  childrenInfo: string;
  usCitizenFamilyMembers: string;
  economicHarm: string;
  familialHarm: string;
  employmentDetails: string;
  yearsAtResidence: string;
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;

}

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
  return new TextRun({ text, bold: true, font: "Times New Roman", size: 24 });
}

function normal(text: string): TextRun {
  return new TextRun({ text, font: "Times New Roman", size: 24 });
}

function italic(text: string): TextRun {
  return new TextRun({ text, italics: true, font: "Times New Roman", size: 24 });
}

function underline(text: string): TextRun {
  return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, font: "Times New Roman", size: 24 });
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
  return new TextRun({ text, bold: true, underline: { type: UnderlineType.SINGLE }, font: "Times New Roman", size: 24 });
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

const captionTabStop = { type: TabStopType.LEFT, position: 4680 };
const bottomBorder = { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" };

function captionLine(left: string, right: string, leftRuns?: TextRun[]): Paragraph {
  return new Paragraph({
    spacing: { after: 0, line: 240 },
    tabStops: [captionTabStop],
    children: [
      ...(leftRuns || [normal(left)]),
      normal("\t"),
      normal(right),
    ],
  });
}

export function generateHabeasDocument(data: CaseData): Document {
  const d = data;
  const reliefText = d.reliefType === "both"
    ? "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)"
    : v(d.reliefType, "asylum / cancellation of removal under 8 U.S.C. \u00A71229b(b)");

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
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // CAPTION
          centered(bold("UNITED STATES DISTRICT COURT")),
          centered(bold("FOR THE SOUTHERN DISTRICT OF TEXAS")),
          centered(bold("HOUSTON DIVISION")),
          centered(bold(`CIVIL No. ${v(d.civilNo, "__________")}`)),

          // Horizontal line + caption with § dividers
          new Paragraph({
            spacing: { after: 0, line: 240 },
            border: { bottom: bottomBorder },
            tabStops: [captionTabStop],
            children: [normal(""), normal("\t"), normal("\u00A7")],
          }),
          captionLine(`${v(d.petitionerName).toUpperCase()},`, "\u00A7"),
          captionLine("", "\u00A7"),
          captionLine("", "\u00A7", [italic("     Petitioner")]),
          captionLine("", "\u00A7"),
          new Paragraph({
            spacing: { after: 0, line: 240 },
            tabStops: [captionTabStop],
            children: [normal(""), normal("\t"), normal("\u00A7   "), bold("PETITION FOR")],
          }),
          new Paragraph({
            spacing: { after: 0, line: 240 },
            tabStops: [captionTabStop],
            children: [normal("v."), normal("\t"), normal("\u00A7   "), bold("WRIT OF HABEAS CORPUS")],
          }),
          new Paragraph({
            spacing: { after: 0, line: 240 },
            tabStops: [captionTabStop],
            children: [normal(""), normal("\t"), normal("\u00A7   "), bold("PURSUANT TO 28 U.S.C \u00A72241")],
          }),

          // Respondents — every line has §
          captionLine(`${v(d.wardenName).toUpperCase()}, in ${v(d.wardenTitle, "his")} official capacity`, "\u00A7"),
          captionLine(`as ${v(d.wardenTitle, "Warden")} of the ${v(d.facilityName)}`, "\u00A7"),
          captionLine("Detention Center;", "\u00A7"),
          captionLine("", "\u00A7"),
          captionLine("BRET BRADFORD, in his official capacity as", "\u00A7"),
          captionLine("Field Office Director of ICE Enforcement and", "\u00A7"),
          captionLine("Removal Operations Houston Field Office;", "\u00A7"),
          captionLine("", "\u00A7"),
          captionLine("MARKWAYNE MULLIN, in his official capacity", "\u00A7"),
          captionLine("as Secretary of the Department of Homeland", "\u00A7"),
          captionLine("Security;", "\u00A7"),
          captionLine("", "\u00A7"),
          captionLine("TODD BLANCHE, in his official capacity as", "\u00A7"),
          captionLine("Acting Attorney General of the United States,", "\u00A7"),
          captionLine("", "\u00A7"),
          captionLine("", "\u00A7", [italic("     Respondents.")]),

          // Horizontal line at bottom of caption
          new Paragraph({
            spacing: { after: 200, line: 240 },
            border: { bottom: bottomBorder },
            tabStops: [captionTabStop],
            children: [normal(""), normal("\t"), normal("\u00A7")],
          }),

          // Title
          centered(bold("PETITION FOR WRIT OF HABEAS CORPUS PURSUANT TO 28 U.S.C. \u00A72241")),
          centered(bold("AND COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF")),
          emptyLine(),

          // I. INTRODUCTION
          sectionTitle("I. INTRODUCTION"),

          justified(
            normal(`Petitioner has been detained by Immigration and Customs Enforcement (ICE) for ${v(d.monthsDetained)} months without any individualized determination that he presents a flight risk or danger to the community. He seeks immediate release or, at minimum, a hearing before a neutral decision-maker. Petitioner lived in the United States for ${v(d.yearsInUS)} years without ever being apprehended, detained, or placed in removal proceedings. During that time, he maintained stable employment and residence, built deep family ties in the United States, and had zero criminal arrests, charges, or convictions. He was detained solely due to a change in government policy, with no change in his individual circumstances.`)
          ),

          justified(
            normal(`This case does not challenge the Fifth Circuit\u2019s recent decision in `),
            italic("Buenrostro-Mendez v. Bondi"),
            normal(`, No. 25-20496 (5th Cir. Feb. 6, 2026), which held that certain noncitizens are subject to mandatory detention under 8 U.S.C. \u00A71225(b)(2)(A). Rather, it challenges the constitutional application of that statute to Petitioner\u2019s specific circumstances.`)
          ),

          justified(
            normal(`The Fifth Circuit recognized that constitutional questions about prolonged detention under \u00A71225(b)(2)(A) were \u201Cwholly speculative\u201D at the time of its decision. `),
            italic("Buenrostro-Mendez"),
            normal(`, slip op. at 21. Petitioner\u2019s ${v(d.monthsDetained)}-month detention, following ${v(d.yearsInUS)} years of law-abiding residence in the United States without a single criminal violation or immigration infraction, makes these concerns concrete. The Constitution does not permit indefinite detention without individualized review, regardless of statutory classification.`)
          ),

          // II. JURISDICTION
          sectionTitle("II. JURISDICTION AND AUTHORITY"),

          numberedPara("1", normal("Jurisdiction lies under 28 U.S.C. \u00A72241 and 28 U.S.C. \u00A71331.")),

          numberedPara("2", normal("The Fifth Circuit recognizes habeas jurisdiction over challenges to the fact and legality of immigration detention, including constitutional claims. See "),
            italic("Zadvydas v. Davis"),
            normal(", 533 U.S. 678 (2001); "),
            italic("Pierre v. United States"),
            normal(", 525 F.2d 933 (5th Cir. 1976).")
          ),

          numberedPara("3", normal("This Court has authority to issue a TRO to halt ongoing constitutional violations. See "),
            italic("Opulent Life Church v. City of Holly Springs"),
            normal(", 697 F.3d 279, 295 (5th Cir. 2012).")
          ),

          // III. STATEMENT OF FACTS
          sectionTitle("III. STATEMENT OF FACTS"),
          subSectionTitle("1. Background and Family Ties"),

          numberedPara("4", normal(`Petitioner is ${v(d.petitionerAge)} years old and has resided in the United States for ${v(d.yearsInUS)} years, since ${v(d.yearOfEntry)}. See attached Exhibit A.`)),

          numberedPara("5", normal(`Petitioner and his family live at ${v(d.petitionerAddress)}.`)),

          numberedPara("6", normal(`Petitioner has no criminal record and no history of immigration violations other than unlawful entry in ${v(d.yearOfEntry)}.`)),

          numberedPara("9", normal(`Prior to his detention on ${formatDate(d.detentionDate)}, Petitioner had never been apprehended, detained, or placed in removal proceedings by any immigration authority. He lived openly in the United States and had no prior ICE contact of any kind.`)),

          subSectionTitle("2. Detention Under \u00A71225(b)(2)(A)"),

          numberedPara("10", normal(`On ${formatDate(d.detentionDate)}, ICE apprehended Petitioner during ${v(d.apprehensionCircumstance)} and took him into custody.`)),

          numberedPara("11", normal(`ICE asserts authority to detain Petitioner under 8 U.S.C. \u00A71225(b)(2)(A), claiming he is an \u201Capplicant for admission\u201D subject to mandatory detention based on his manner of entry ${v(d.yearsInUS)} years ago.`)),

          numberedPara("12", normal("ICE has provided no explanation for its decision to detain Petitioner, other than changed \u201Cpolicy\u201D following the Fifth Circuit\u2019s decision in "),
            italic("Buenrostro-Mendez v. Bondi"),
            normal(", No. 25-20496 (5th Cir. Feb. 6, 2026).")
          ),

          numberedPara("13", normal(`Petitioner has been continuously detained at ${v(d.facilityName)} since ${formatDate(d.detentionDate)}\u2014a total of ${v(d.monthsDetained)} months to date. See attached Exhibit B: Detainee Locator.`)),

          subSectionTitle("3. Current Removal Proceedings and Likelihood of Relief"),

          numberedPara("14", normal(`Petitioner is in removal proceedings before the ${v(d.immigrationCourtLocation)} Immigration Court.`)),

          numberedPara("15", normal(`His next master calendar hearing is scheduled for ${formatDate(d.nextHearingDate)}. See attached Exhibit C: Automated Case Information. ICE has provided no timeline for completion of proceedings.`)),

          numberedPara("16", normal(`Petitioner has applied for ${reliefText}.`)),

          subSectionTitle("4. Harm from Continued Detention"),

          numberedPara("17", normal("Petitioner\u2019s continued detention causes severe and irreparable harm.")),

          numberedPara("18", bold("Economic Harm: "), normal(v(d.economicHarm, "Loss of employment and income; family unable to pay rent or mortgage and facing eviction/foreclosure."))),

          numberedPara("19", bold("Familial Harm: "), normal(v(d.familialHarm, "Separation from spouse and children; spouse unable to work due to childcare responsibilities."))),

          numberedPara("20", bold("Inability to Defend Against Removal: "), normal("Petitioner is unable to gather documentary evidence for his relief application while in custody; he has limited access to his attorney while in ICE custody; he cannot locate witnesses or obtain declarations needed to defend his case.")),

          numberedPara("21", normal("Each day of continued detention exacerbates these harms.")),

          // IV. CLAIM FOR RELIEF
          sectionTitle("IV. CLAIM FOR RELIEF"),
          centered(underline("VIOLATION OF FIFTH AMENDMENT DUE PROCESS")),

          numberedPara("34", normal("Petitioner incorporates all preceding paragraphs.")),

          numberedPara("35", normal("The Fifth Amendment to the United States Constitution guarantees that no person shall be deprived of life, liberty, or property without due process of law.")),

          numberedPara("36", normal("This guarantee extends to all persons within the United States, including noncitizens in removal proceedings. "),
            italic("Zadvydas v. Davis"),
            normal(", 533 U.S. 678, 693 (2001); "),
            italic("Reno v. Flores"),
            normal(", 507 U.S. 292, 306 (1993).")
          ),

          numberedPara("37", normal("Petitioner\u2019s detention violates both substantive and procedural due process in multiple, reinforcing ways.")),

          // A. Substantive Due Process
          subSectionTitle("A. Substantive Due Process: Indefinite Detention Without Individualized Determination"),

          numberedPara("38", normal("The Supreme Court has held that indefinite or prolonged civil detention raises \u201Cserious constitutional concerns.\u201D "),
            italic("Zadvydas"),
            normal(", 533 U.S. at 690.")
          ),

          numberedPara("39", normal("To avoid these concerns, the Supreme Court has \u201Cread an implicit limitation\u201D into immigration detention statutes requiring individualized determinations and temporal limits. "),
            italic("Id."),
            normal(" at 689.")
          ),

          numberedPara("40", normal("The Supreme Court identified six months as a \u201Cpresumptively reasonable period\u201D for immigration detention. "),
            italic("Id."),
            normal(" at 701.")
          ),

          numberedPara("41", normal(`While Petitioner has been detained for ${v(d.monthsDetained)} months, he faces indefinite detention with no end in sight:`)),

          subPara("a", normal("Section 1225(b)(2)(A) contains no temporal limitation whatsoever;")),
          subPara("b", normal("The statute provides for detention \u201Cpending a proceeding under section 1229a,\u201D which could last months or years;")),
          subPara("c", normal("Petitioner\u2019s removal proceedings have no definite conclusion date and could last months or over a year for the adjudication and appellate process to conclude;")),
          subPara("d", normal("Cases involving applications for relief and appeal to the Board of Immigration Appeals routinely take 9\u201324+ months to resolve;")),
          subPara("e", normal("ICE has provided no timeline for completion of proceedings or release from detention.")),

          numberedPara("42", normal(`Even though Petitioner has been detained for \u201Conly\u201D ${v(d.monthsDetained)} months, the trajectory of his case makes clear he will be detained far beyond the six-month presumptively reasonable period absent intervention by this Court.`)),

          numberedPara("43", normal("Unlike the post-deportation/removal order detention at issue in "),
            italic("Zadvydas"),
            normal(", Petitioner\u2019s detention is even more troubling because:")
          ),

          subPara("a", normal("He is detained during, not after, removal proceedings, when he is actively pursuing relief;")),
          subPara("b", normal("The proceedings themselves could last indefinitely;")),
          subPara("c", normal("He has had no hearing whatsoever to determine the necessity of detention; and")),
          subPara("d", normal("He faces categorical detention based on a recently-changed legal classification, not individualized facts.")),

          numberedPara("44", normal("Respondents have made no individualized determination that Petitioner\u2019s continued detention is necessary to prevent flight or danger to the community, which are the only constitutionally permissible bases for preventive civil detention. "),
            italic("United States v. Salerno"),
            normal(", 481 U.S. 739, 748 (1987).")
          ),

          numberedPara("45", normal("To the contrary, all evidence demonstrates Petitioner poses neither risk:")),

          subPara("a", normal(`Petitioner has resided in the United States for ${v(d.yearsInUS)} years without a single criminal arrest, charge, or conviction;`)),
          subPara("b", normal("Petitioner maintained stable employment and residence throughout his time in the United States;")),
          subPara("c", normal("Petitioner had zero violations of any law or immigration condition;")),
          subPara("d", normal(`Petitioner has deep family ties to the United States, including ${v(d.usCitizenFamilyMembers, "U.S. citizen/LPR family members")};`)),
          subPara("e", normal("No individualized assessment has ever identified Petitioner as a flight risk or danger.")),

          numberedPara("46", normal("Petitioner\u2019s detention is purely categorical, based solely on his legal classification as an \u201Capplicant for admission\u201D\u2014not on any individualized finding that he personally requires detention.")),

          numberedPara("47", normal("This categorical, indefinite detention without individualized determination violates substantive due process.")),

          // B. Procedural Due Process
          subSectionTitle("B. Procedural Due Process: Complete Deprivation of Hearing"),

          numberedPara("48", normal("The Fifth Amendment requires meaningful procedural protections before deprivation of physical liberty\u2014one of the most fundamental interests protected by the Constitution.")),

          numberedPara("49", normal("Under "),
            italic("Mathews v. Eldridge"),
            normal(", 424 U.S. 319, 335 (1976), courts apply a three-part balancing test to determine what process is due: (1) the private interest affected by government action; (2) the risk of erroneous deprivation through procedures used and the probable value of additional safeguards; and (3) the government\u2019s interest, including the fiscal and administrative burdens of additional procedures.")
          ),

          numberedPara("50", normal("Applying the "),
            italic("Mathews"),
            normal(" balancing test here, the constitutional scales tip overwhelmingly in favor of providing Petitioner a hearing.")
          ),

          numberedPara("51", bold("First Factor: Private Interest. "), normal("Petitioner\u2019s private interest is among the most fundamental protected by the Constitution\u2014physical liberty and the ability to remain with his family.")),

          numberedPara("52", bold("Second Factor: Risk of Erroneous Deprivation. "), normal("The risk of erroneous deprivation here is not merely substantial\u2014it is 100%.")),

          numberedPara("53", bold("Third Factor: Government Interest. "), normal("The government\u2019s interests are preventing flight and protecting public safety. However, these interests are not served by detaining someone who has proven through years of law-abiding conduct that he will appear and poses no danger.")),

          numberedPara("54", normal("The "),
            italic("Mathews"),
            normal(" balancing test overwhelmingly favors providing Petitioner a hearing before a neutral decision-maker with authority to order release upon a showing that he is not a flight risk or danger.")
          ),

          numberedPara("55", normal("At minimum, due process requires:")),
          subPara("a", normal("Notice of the reasons for continued detention;")),
          subPara("b", normal("An opportunity to present evidence that Petitioner is neither a flight risk nor a danger to the community;")),
          subPara("c", normal("A hearing before a neutral decision-maker (not ICE, which is the prosecuting/detaining authority); and")),
          subPara("d", normal("Authority in that decision-maker to order release on bond or conditions if Petitioner meets his burden.")),

          numberedPara("56", normal("Respondents have provided none of these procedural protections. Petitioner has received no hearing, no opportunity to present evidence of his ties and compliance, and no review by any neutral arbiter.")),

          numberedPara("57", normal("This complete deprivation of process violates the Fifth Amendment.")),

          // C. Equal Protection
          subSectionTitle("C. Equal Protection: Arbitrary Classification"),

          numberedPara("58", normal("The Fifth Amendment\u2019s due process clause incorporates equal protection principles applicable to federal government action. "),
            italic("Bolling v. Sharpe"),
            normal(", 347 U.S. 497, 499 (1954).")
          ),

          numberedPara("59", normal("Equal protection requires that the government treat similarly situated individuals alike, absent a rational basis for differential treatment.")),

          numberedPara("60", normal(`Respondents treat Petitioner\u2014who entered the United States without inspection ${v(d.yearsInUS)} years ago\u2014fundamentally differently from a noncitizen who entered lawfully but overstayed a visa for many years.`)),

          numberedPara("61", normal("These two individuals are identically situated in all relevant respects.")),

          numberedPara("62", normal("Yet the government treats them completely differently.")),

          numberedPara("63", normal(`This differential treatment is based solely on the manner of entry many years ago\u2014a factor that bears no rational relationship to the government\u2019s stated interests in preventing flight and protecting public safety.`)),

          numberedPara("64", normal(`Indeed, the manner of entry ${v(d.yearsInUS)} years ago tells us nothing about current flight risk or danger.`)),

          numberedPara("65", normal("The government\u2019s asserted interest in \u201Cequal treatment\u201D of noncitizens at the border and in the interior cannot justify this arbitrary classification.")),

          numberedPara("66", normal("This classification violates equal protection because it treats identically situated individuals differently based on an arbitrary factor unrelated to any legitimate government interest.")),

          // D. Arbitrary and Capricious
          subSectionTitle("D. Arbitrary and Capricious Government Action: Detention After Prolonged Non-Enforcement"),

          numberedPara("67", normal("The Due Process Clause prohibits arbitrary government action. "),
            italic("County of Sacramento v. Lewis"),
            normal(", 523 U.S. 833, 845\u201346 (1998).")
          ),

          numberedPara("68", normal(`The government\u2019s sudden decision to detain Petitioner after ${v(d.yearsInUS)} years of non-enforcement, with no change whatsoever in his individual circumstances, constitutes arbitrary government action.`)),

          numberedPara("69", normal(`During ${v(d.yearsInUS)} years of physical presence in the United States, Petitioner built an established life in reasonable reliance on his circumstances.`)),

          numberedPara("70", normal(`The government\u2019s prolonged non-enforcement over ${v(d.yearsInUS)} years, combined with Petitioner\u2019s complete compliance with all applicable laws during that period, demonstrates that Petitioner presents no flight risk or danger. `),
            italic("Salerno"),
            normal(", 481 U.S. at 748.")
          ),

          numberedPara("71", normal("Now, with no change in Petitioner\u2019s individual circumstances, the government has detained him based solely on a policy change following "),
            italic("Buenrostro-Mendez"),
            normal(". This is the paradigm of arbitrary action.")
          ),

          numberedPara("72", normal("While the Fifth Circuit has not recognized a formal doctrine of \u201Cnon-enforcement acquiescence\u201D in the immigration detention context, the due process prohibition on arbitrary government action provides an independent basis for relief. See "),
            italic("Lewis"),
            normal(", 523 U.S. at 845\u201346.")
          ),

          numberedPara("73", normal(`This arbitrary detention, premised solely on a policy change and Petitioner\u2019s manner of entry ${v(d.yearsInUS)} years ago rather than any current, individualized assessment, violates the Fifth Amendment\u2019s due process guarantee.`)),

          // E. As-Applied
          subSectionTitle("E. As-Applied Constitutional Challenge"),

          numberedPara("74", normal("Even if \u00A71225(b)(2)(A) could be constitutionally applied to some individuals in some circumstances, its application to Petitioner violates the Constitution.")),

          numberedPara("75", normal("Petitioner presents the precise scenario where mandatory detention without a hearing cannot be constitutionally sustained:")),

          subPara("a", normal(`Long-term U.S. resident (${v(d.yearsInUS)} years) with deep community and family ties;`)),
          subPara("b", normal(`Government engaged in ${v(d.yearsInUS)} years of non-enforcement, during which Petitioner demonstrated zero flight risk or danger;`)),
          subPara("c", normal("Proven track record of compliance with all applicable laws, eliminating any individualized flight risk or danger concern;")),
          subPara("d", normal("Indefinite detention with no timeline for completion of proceedings;")),
          subPara("e", normal(`Strong case for relief from removal (${reliefText});`)),
          subPara("f", normal("Severe, irreparable harm from continued detention; and")),
          subPara("g", normal("Detention based solely on a policy change, not individual facts.")),

          numberedPara("76", normal("The Fifth Circuit in "),
            italic("Buenrostro-Mendez"),
            normal(" acknowledged that constitutional concerns about \u00A71225(b)(2)(A) were \u201Cwholly speculative\u201D at the time. Slip op. at 21.")
          ),

          numberedPara("77", normal("Petitioner\u2019s case makes these concerns concrete, not speculative. This is precisely the type of as-applied challenge the Fifth Circuit did not address and could not foreclose.")),

          numberedPara("78", normal("For all these reasons, Petitioner\u2019s continued detention violates the Fifth Amendment\u2019s guarantee of due process and equal protection.")),

          // V. PRAYER FOR RELIEF
          sectionTitle("V. PRAYER FOR RELIEF"),

          justified(bold("WHEREFORE"), normal(", Petitioner respectfully requests that this Court:")),

          subPara("a", normal("Declare that Petitioner\u2019s continued detention violates the Fifth Amendment to the United States Constitution;")),
          subPara("b", normal("Issue a Writ of Habeas Corpus ordering Petitioner\u2019s immediate release from custody, subject to reasonable conditions of supervision including GPS monitoring, regular ICE check-ins, surrender of travel documents, and/or reasonable bond;")),
          subPara("c", normal("Alternatively, order Respondents to provide Petitioner with an individualized hearing before a neutral decision-maker within seven (7) days;")),
          subPara("d", normal("Enjoin Respondents from continuing to detain Petitioner in violation of his constitutional rights;")),
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
            children: [normal("Respectfully submitted,")],
          }),
          emptyLine(),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("/s/ Manuel E. Solis")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [bold("Manuel E. Solis")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("Attorney for Petitioner")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("State Bar No. 18826790")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("P.O. Box 230593")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("Houston TX 77223")],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [normal("Houston Office: 713-481-1030")],
          }),
          new Paragraph({
            spacing: { after: 200 },
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
            "Bret Bradford, in his Official Capacity as Field Office Director, of ICE Enforcement and Removal Operations Houston Field Office",
            "(1) Office of the Field Office Director, Enforcement and Removal Operations, Houston Field Office, 126 Northpoint Drive, Houston, Texas 77060"
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
        ],
      },
    ],
  });
}

function generateCertificateOfService(date: string, respondent: string, address: string): Paragraph[] {
  return [
    centered(bold("CERTIFICATE OF SERVICE")),
    justified(
      normal(`On ${date}, Counsel for Plaintiff served a copy of the attached Petition via USPS Mail, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, ${respondent}, at the ${address}.`)
    ),
    emptyLine(),
    new Paragraph({
      spacing: { after: 60 },
      children: [normal(`/s/ Manuel Solis\t\t\t${date}`)],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [normal("Manuel Solis\t\t\t\tDate")],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [normal("Attorney for Petitioner")],
    }),
  ];
}

function generateCertificateOfServiceEmail(date: string, respondent: string, address: string): Paragraph[] {
  return [
    centered(bold("CERTIFICATE OF SERVICE")),
    justified(
      normal(`On ${date}, Counsel for Plaintiff served a copy of the attached Petition via email, in compliance with Rule 4 of Federal Rules of Civil Procedure, upon the Respondent, ${respondent}, at ${address}.`)
    ),
    emptyLine(),
    new Paragraph({
      spacing: { after: 60 },
      children: [normal(`/s/ Manuel Solis\t\t\t${date}`)],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [normal("Manuel Solis\t\t\t\tDate")],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [normal("Attorney for Petitioner")],
    }),
  ];
}
