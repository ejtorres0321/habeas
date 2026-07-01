import { eroFieldOffices } from "./eroFieldOffices";

export interface CaseFormData {
  civilNo: string;
  status: "draft" | "filed" | "resolved";
  template: "texas" | "oklahoma";
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
  removalOrderDate: string;
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

export const defaultCaseData: CaseFormData = {
  civilNo: "",
  status: "draft",
  template: "texas",
  petitionerName: "",
  petitionerAge: "",
  petitionerAddress: "",
  yearsInUS: "",
  yearOfEntry: "",
  monthsDetained: "",
  detentionDate: "",
  apprehensionCircumstance: "",
  facilityName: "",
  facilityAddress: "",
  wardenName: "",
  wardenTitle: "",
  fieldOfficeDirector: "",
  eroFieldOffice: "",

  immigrationCourtLocation: "",
  nextHearingDate: "",
  reliefType: "",
  removalOrderDate: "",
  familyDetails: "",
  spouseInfo: "",
  childrenInfo: "",
  usCitizenFamilyMembers: "",
  economicHarm: "",
  familialHarm: "",
  petitionerGender: "male",
  hasCriminalHistory: "no",
  criminalHistoryDetails: "",
  employmentDetails: "",
  yearsAtResidence: "",
  serviceDateWarden: "",
  serviceDateFieldOffice: "",
  serviceDateDHS: "",
  serviceDateAG: "",

};

export interface FieldConfig {
  key: keyof CaseFormData;
  label: string;
  type: "text" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  readOnly?: boolean;
  visibleWhen?: { field: keyof CaseFormData; value: string };
}

export const formSections: { title: string; fields: FieldConfig[] }[] = [
  {
    title: "Case Information",
    fields: [
      { key: "civilNo", label: "Civil No.", type: "text", placeholder: "e.g., 4:26-cv-00000" },
      {
        key: "status",
        label: "Case Status",
        type: "select",
        options: ["draft", "filed", "resolved"],
      },
    ],
  },
  {
    title: "Petitioner Information",
    fields: [
      { key: "petitionerName", label: "Petitioner Full Name", type: "text" },
      {
        key: "petitionerGender",
        label: "Petitioner Gender",
        type: "select",
        options: ["male", "female"],
      },
      { key: "petitionerAge", label: "Age", type: "text" },
      { key: "petitionerAddress", label: "Address", type: "text" },
      { key: "yearsInUS", label: "Years in the United States", type: "text" },
      { key: "yearOfEntry", label: "Year of Entry", type: "text", placeholder: "e.g., 2010" },
      { key: "employmentDetails", label: "Employment Details", type: "textarea", placeholder: "Describe employment history..." },
      { key: "yearsAtResidence", label: "Years at Current Residence", type: "text" },
    ],
  },
  {
    title: "Detention Details",
    fields: [
      { key: "detentionDate", label: "Date of Detention", type: "date" },
      { key: "monthsDetained", label: "Months Detained", type: "text", readOnly: true },
      {
        key: "apprehensionCircumstance",
        label: "Apprehension Circumstance",
        type: "select",
        options: ["a workplace raid", "a traffic stop", "a home raid", "other"],
      },
      { key: "facilityName", label: "Detention Facility Name", type: "text", placeholder: "e.g., Montgomery Processing Center" },
      { key: "facilityAddress", label: "Facility Address", type: "text" },
    ],
  },
  {
    title: "Respondents",
    fields: [
      { key: "wardenName", label: "Warden Name", type: "text" },
      { key: "wardenTitle", label: "Warden Title", type: "text", placeholder: "e.g., Warden" },
      { key: "fieldOfficeDirector", label: "Field Office Director", type: "text", placeholder: "e.g., Bret Bradford" },
      { key: "eroFieldOffice", label: "ERO Field Office", type: "select", options: eroFieldOffices.map((o) => o.name) },
    ],
  },
  {
    title: "Court & Proceedings",
    fields: [
      { key: "immigrationCourtLocation", label: "Immigration Court Location", type: "text" },
      { key: "nextHearingDate", label: "Next Hearing Date", type: "date" },
      {
        key: "reliefType",
        label: "Type of Relief Sought",
        type: "select",
        options: ["asylum", "cancellation of removal under 8 U.S.C. \u00A71229b(b)", "both"],
      },
      {
        key: "removalOrderDate",
        label: "Removal Order Date (Oklahoma — IJ order, BIA appeal pending)",
        type: "date",
        visibleWhen: { field: "template", value: "oklahoma" },
      },
    ],
  },
  {
    title: "Family Information",
    fields: [
      { key: "familyDetails", label: "Family Details", type: "textarea", placeholder: "General family background..." },
      { key: "spouseInfo", label: "Spouse Information", type: "textarea", placeholder: "Spouse name, status, details..." },
      { key: "childrenInfo", label: "Children Information", type: "textarea", placeholder: "Names, ages, conditions..." },
      { key: "usCitizenFamilyMembers", label: "U.S. Citizen/LPR Family Members", type: "textarea" },
    ],
  },
  {
    title: "Harm from Detention",
    fields: [
      { key: "economicHarm", label: "Economic Harm", type: "textarea", placeholder: "Loss of employment, financial consequences..." },
      { key: "familialHarm", label: "Familial Harm", type: "textarea", placeholder: "Separation from family, childcare issues..." },
    ],
  },
  {
    title: "Criminal History",
    fields: [
      {
        key: "hasCriminalHistory",
        label: "Does the petitioner have criminal history?",
        type: "select",
        options: ["no", "yes"],
      },
      {
        key: "criminalHistoryDetails",
        label: "Criminal History Details",
        type: "textarea",
        placeholder: "Describe criminal history, charges, convictions, sentences served...",
        visibleWhen: { field: "hasCriminalHistory", value: "yes" },
      },
    ],
  },
  {
    title: "Certificate of Service",
    fields: [
      { key: "serviceDateWarden", label: "Service Date (Warden)", type: "date" },
      { key: "serviceDateFieldOffice", label: "Service Date (Field Office)", type: "date" },
      { key: "serviceDateDHS", label: "Service Date (DHS)", type: "date" },
      { key: "serviceDateAG", label: "Service Date (Attorney General)", type: "date" },
    ],
  },
];
