import mongoose from "mongoose";

const FormSubmissionSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    formType: { type: String, required: true },
    data: { type: Object, required: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

export const FormSubmission = mongoose.model(
  "FormSubmission",
  FormSubmissionSchema
);
