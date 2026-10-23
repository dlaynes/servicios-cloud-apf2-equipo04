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
