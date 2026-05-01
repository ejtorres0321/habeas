import mongoose, { Schema, Document } from "mongoose";

export interface ICase extends Document {
  // Case Info
  civilNo: string;
  status: "draft" | "filed" | "resolved";

  // Petitioner
  petitionerName: string;
  petitionerAge: string;
  petitionerAddress: string;
  yearsInUS: string;
  yearOfEntry: string;
  monthsDetained: string;

  // Detention Details
  detentionDate: string;
  apprehensionCircumstance: string; // "a workplace raid" / "a traffic stop" / custom
  facilityName: string;
  facilityAddress: string;

  // Respondents
  wardenName: string;
  wardenTitle: string;
  detentionCenterName: string;
  fieldOfficeDirector: string;
  eroFieldOffice: string;

  // Court / Proceedings
  immigrationCourtLocation: string;
  nextHearingDate: string;
  reliefType: string; // asylum / cancellation of removal

  // Family
  familyDetails: string;
  spouseInfo: string;
  childrenInfo: string;
  usCitizenFamilyMembers: string;

  // Harm Details
  economicHarm: string;
  familialHarm: string;

  // Employment
  employmentDetails: string;
  yearsAtResidence: string;

  // Service Dates & Info
  serviceDateWarden: string;
  serviceDateFieldOffice: string;
  serviceDateDHS: string;
  serviceDateAG: string;

  // Warden service info
  wardenServiceName: string;
  wardenServiceTitle: string;
  wardenServiceFacility: string;
  wardenServiceAddress: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    civilNo: { type: String, default: "" },
    status: { type: String, enum: ["draft", "filed", "resolved"], default: "draft" },

    petitionerName: { type: String, default: "" },
    petitionerAge: { type: String, default: "" },
    petitionerAddress: { type: String, default: "" },
    yearsInUS: { type: String, default: "" },
    yearOfEntry: { type: String, default: "" },
    monthsDetained: { type: String, default: "" },

    detentionDate: { type: String, default: "" },
    apprehensionCircumstance: { type: String, default: "" },
    facilityName: { type: String, default: "" },
    facilityAddress: { type: String, default: "" },

    wardenName: { type: String, default: "" },
    wardenTitle: { type: String, default: "" },
    detentionCenterName: { type: String, default: "" },
    fieldOfficeDirector: { type: String, default: "" },
    eroFieldOffice: { type: String, default: "" },

    immigrationCourtLocation: { type: String, default: "" },
    nextHearingDate: { type: String, default: "" },
    reliefType: { type: String, default: "" },

    familyDetails: { type: String, default: "" },
    spouseInfo: { type: String, default: "" },
    childrenInfo: { type: String, default: "" },
    usCitizenFamilyMembers: { type: String, default: "" },

    economicHarm: { type: String, default: "" },
    familialHarm: { type: String, default: "" },

    employmentDetails: { type: String, default: "" },
    yearsAtResidence: { type: String, default: "" },

    serviceDateWarden: { type: String, default: "" },
    serviceDateFieldOffice: { type: String, default: "" },
    serviceDateDHS: { type: String, default: "" },
    serviceDateAG: { type: String, default: "" },

    wardenServiceName: { type: String, default: "" },
    wardenServiceTitle: { type: String, default: "" },
    wardenServiceFacility: { type: String, default: "" },
    wardenServiceAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Case || mongoose.model<ICase>("Case", CaseSchema);
