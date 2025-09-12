
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

// Minimal payload required when creating a new referral from the client
export type NewReferralInput = Pick<
  Referral,
  'ward' | 'bed' | 'referringDepartment' | 'targetDepartment' | 'notes'
>;
