
// src/types.ts
export type Referral = {
  id: string;
  ward: string;
  bed: string;
  referringDepartment: string;
  referringClinician: string;
  targetDepartment: string;
  notes: string;
  status: string;
  feedback: string;
  feedbackClinician: string;
  createdAt: string;
  updatedAt: string;
};
