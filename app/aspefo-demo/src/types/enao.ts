export interface Applicant {
  id: number;
  fullName: string;
  docType: string;
  docNumber: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  university?: string;
  country?: string;
  otherUniversity?: string;
  organization: string;
  bank: string;
  receiptCode: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  applicant?: Applicant;
  role: 'APPLICANT' | 'MAINTAINER' | 'ADMIN';
}

export interface ApplicantFullResponse extends Applicant {}

export interface ExamResult {
  available: boolean;
  score?: number;
  maximumScore?: number;
  status: string;
  message: string;
  publishedAt?: string;
}

export interface LoginRequest {
  docNumber: string;
  password: string;
}

export interface ApplicantRequest {
  fullName: string;
  docType: string;
  docNumber: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  password: string;
  internationalUniversity?: boolean;
  university?: string;
  country?: string;
  otherUniversity?: string;
  organization: string;
  bank: string;
  receiptCode: string;
}

export interface ApplicantUpdateRequest {
  organization: string;
  bank: string;
  receiptCode: string;
}

export interface ApplicantStatusUpdateRequest {
  status: string;
}

export interface ResultUpdateRequest {
  score: number;
  maximumScore: number;
  status: string;
}
