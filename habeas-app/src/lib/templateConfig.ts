export type TemplateId = "texas" | "oklahoma";

export interface LocalCounsel {
  name: string;
  bar: string;
  firm: string;
  addressLines: string[];
  phone: string;
  email: string;
}

export interface TemplateConfig {
  id: TemplateId;
  label: string;
  fontSizeHalfPoints: number;
  fontSizeCSS: string;
  captionLines: string[];
  circuitName: string;
  habeasSecondaryCase: string;
  habeasSecondaryCite: string;
  troCase: string;
  troCite: string;
  defaultEroFieldOffice: string;
  defaultFieldOfficeDirector: string;
  localCounsel?: LocalCounsel;
}

export const templates: Record<TemplateId, TemplateConfig> = {
  texas: {
    id: "texas",
    label: "Texas (S.D. Texas — Houston)",
    fontSizeHalfPoints: 24,
    fontSizeCSS: "12pt",
    captionLines: [
      "FOR THE SOUTHERN DISTRICT OF TEXAS",
      "HOUSTON DIVISION",
    ],
    circuitName: "Fifth",
    habeasSecondaryCase: "Pierre v. United States",
    habeasSecondaryCite: "525 F.2d 933 (5th Cir. 1976)",
    troCase: "Opulent Life Church v. City of Holly Springs",
    troCite: "697 F.3d 279, 295 (5th Cir. 2012)",
    defaultEroFieldOffice: "Houston Field Office",
    defaultFieldOfficeDirector: "BRET BRADFORD",
  },
  oklahoma: {
    id: "oklahoma",
    label: "Oklahoma (W.D. Oklahoma)",
    fontSizeHalfPoints: 26,
    fontSizeCSS: "13pt",
    captionLines: ["FOR THE WESTERN DISTRICT OF OKLAHOMA"],
    circuitName: "Tenth",
    habeasSecondaryCase: "Jennings v. Rodriguez",
    habeasSecondaryCite: "583 U.S. 281 (2018)",
    troCase: "Schier v. Regents of Univ. of Colo.",
    troCite: "884 F.2d 1387, 1390 (10th Cir. 1989)",
    defaultEroFieldOffice: "Dallas Field Office",
    defaultFieldOfficeDirector: "ROBERT CERNA",
    localCounsel: {
      name: "Michelle L. Edstrom",
      bar: "OBA #22555",
      firm: "Edstrom Law Center",
      addressLines: ["1708 N. Broadway Ave.", "Oklahoma City, OK 73103"],
      phone: "T: 405.401.1213",
      email: "medstrom@edstromlaw.com",
    },
  },
};

export const templateOptions = Object.values(templates).map((t) => ({
  value: t.id,
  label: t.label,
}));

export function getTemplateConfig(template?: string | null): TemplateConfig {
  if (template === "oklahoma") return templates.oklahoma;
  return templates.texas;
}
