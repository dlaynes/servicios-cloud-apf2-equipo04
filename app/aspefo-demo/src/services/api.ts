import type {
  Applicant,
  AuthResponse,
  ExamResult,
  LoginRequest,
  ApplicantRequest,
  ApplicantUpdateRequest,
  ApplicantStatusUpdateRequest,
  ResultUpdateRequest,
  ApplicantFullResponse
} from '../types/enao';
import type {
  ApplicantDocumentResponse,
  ComprobanteVerification,
  DocumentReviewRequest,
  ReportResponse,
  SummaryReport,
} from '../types/enao';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getToken(): string | null {
  return localStorage.getItem('enao_token');
}

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Error ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const authApi = {
  login: (data: LoginRequest) => http<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const applicantApi = {
  register: (data: ApplicantRequest) => http<Applicant>('/applicants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => http<Applicant>('/applicants/me'),
  updateMe: (data: ApplicantUpdateRequest) => http<Applicant>('/applicants/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const resultApi = {
  getMe: () => http<ExamResult>('/results/me'),
};

export const adminApi = {
  listApplicants: () => http<ApplicantFullResponse[]>('/admin/applicants'),
  getApplicant: (id: number) => http<ApplicantFullResponse>(`/admin/applicants/${id}`),
  updateApplicantStatus: (id: number, data: ApplicantStatusUpdateRequest) =>
    http<ApplicantFullResponse>(`/admin/applicants/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateResult: (id: number, data: ResultUpdateRequest) =>
    http<ExamResult>(`/admin/applicants/${id}/results`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ------------------------------------------------------- RF-03 / RF-04 / RF-08
async function httpError(response: Response): Promise<never> {
  let message = `Error ${response.status}: ${response.statusText}`;
  try {
    const body = await response.json();
    if (body.message) message = body.message;
  } catch {
    // ignore
  }
  throw new Error(message);
}

/**
 * Envía un formulario multipart. El header Content-Type NO se define a mano:
 * el navegador lo fija con el boundary del formulario.
 */
async function httpMultipart<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers, body: form });
  if (!response.ok) await httpError(response);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function fileNameFromDisposition(header: string | null): string {
  if (!header) return 'documento';
  const utf8 = header.match(/filename\*=(?:UTF-8''|utf-8'')([^;]+)/i);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].replace(/"/g, ''));
    } catch {
      return utf8[1].replace(/"/g, '');
    }
  }
  const simple = header.match(/filename="?([^";]+)"?/i);
  return simple ? simple[1] : 'documento';
}

/** Descarga un archivo (PDF, CSV) del backend y lo guarda con su nombre real. */
async function downloadBlob(path: string, fallbackName = 'documento'): Promise<void> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) await httpError(response);

  const blob = await response.blob();
  const name = fileNameFromDisposition(response.headers.get('content-disposition')) || fallbackName;
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

export const documentApi = {
  upload: (file: File, documentType: string, uploadComment?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    if (uploadComment) form.append('uploadComment', uploadComment);
    return httpMultipart<ApplicantDocumentResponse>('/me/documents', form, { method: 'POST' });
  },
  list: () => http<ApplicantDocumentResponse[]>('/me/documents'),
  download: (id: number) => downloadBlob(`/me/documents/${id}/download`, 'documento.pdf'),
  remove: (id: number) => http<void>(`/me/documents/${id}`, { method: 'DELETE' }),
  listForAdmin: (applicantId: number) =>
    http<ApplicantDocumentResponse[]>(`/admin/applicants/${applicantId}/documents`),
  listPending: () => http<ApplicantDocumentResponse[]>('/admin/documents/pending'),
  downloadAdmin: (id: number) => downloadBlob(`/admin/documents/${id}/download`, 'documento.pdf'),
  review: (id: number, data: DocumentReviewRequest) =>
    http<ApplicantDocumentResponse>(`/admin/documents/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const comprobanteApi = {
  downloadForMe: () => downloadBlob('/me/comprobante.pdf', 'comprobante.pdf'),
  downloadForAdmin: (serial: string) => downloadBlob(`/admin/comprobantes/${serial}.pdf`, 'comprobante.pdf'),
  verify: (serial: string) => http<ComprobanteVerification>(`/comprobantes/${serial}`),
  revoke: (serial: string) => http<void>(`/admin/comprobantes/${serial}/revoke`, { method: 'PUT' }),
};

interface ReportsParams {
  groupBy?: string;
  status?: string;
  university?: string;
  campus?: string;
  period?: string;
}

function reportsQuery(params: ReportsParams, format?: 'csv' | 'pdf'): string {
  const q = new URLSearchParams();
  if (params.groupBy) q.set('group-by', params.groupBy);
  if (params.status) q.set('status', params.status);
  if (params.university) q.set('university', params.university);
  if (params.campus) q.set('campus', params.campus);
  if (params.period) q.set('period', params.period);
  if (format) q.set('format', format);
  return q.toString();
}

export const reportsApi = {
  applicants: (params: ReportsParams = {}) =>
    http<ReportResponse>(`/admin/reports/applicants?${reportsQuery(params)}`),
  results: () => http<ReportResponse>('/admin/reports/results'),
  summary: () => http<SummaryReport>('/admin/reports/summary'),
  downloadApplicants: (params: ReportsParams = {}, format: 'csv' | 'pdf') =>
    downloadBlob(`/admin/reports/applicants?${reportsQuery(params, format)}`, `reporte-applicants.${format}`),
  downloadResults: (format: 'csv' | 'pdf') =>
    downloadBlob(`/admin/reports/results?format=${format}`, `reporte-resultados.${format}`),
};