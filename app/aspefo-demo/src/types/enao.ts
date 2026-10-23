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

// --------------------------------------------------------------- RF-03
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApplicantDocumentResponse {
  id: number;
  applicantId?: number;
  applicantName?: string;
  documentType: string;
  originalName: string;
  storageKey: string;
  declaredContentType: string;
  detectedContentType: string;
  sizeBytes: number;
  sha256: string;
  status: DocumentStatus;
  uploadComment?: string | null;
  reviewedBy?: string | null;
  reviewComment?: string | null;
  uploadedAt: string;
  reviewedAt?: string | null;
  downloadCount: number;
  lastDownloadAt?: string | null;
}

export interface DocumentReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

// --------------------------------------------------------------- RF-04
export interface ComprobanteVerification {
  serial: string;
  valid: boolean;
  state: string;
  period: string;
  campus: string;
  institution: string;
  generatedAt: string;
  sha256Prefix: string;
}

// --------------------------------------------------------------- RF-08
export interface ReportAggregationRow {
  label: string;
  count: number;
  extra?: number | null;
}

export interface ReportFilter {
  name: string;
  value: string;
}

export interface ReportResponse {
  dimension: string;
  filters: ReportFilter[];
  rows: ReportAggregationRow[];
  totalCount: number;
  averageScore?: number | null;
}

export interface SummaryReport {
  totalApplicants: number;
  totalVerified: number;
  totalRejected: number;
  totalPending: number;
  totalDocuments: number;
  totalComprobantes: number;
  totalActive: number;
  totalAnnulled: number;
  averageScore?: number | null;
  maximumScore?: number | null;
  minimumScore?: number | null;
  byStatus: ReportAggregationRow[];
  byPeriod: ReportAggregationRow[];
  byCampus: ReportAggregationRow[];
  byInstitution: ReportAggregationRow[];
}