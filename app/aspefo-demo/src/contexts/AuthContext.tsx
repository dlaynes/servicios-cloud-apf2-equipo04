import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Applicant } from '../types/enao';

type Role = 'APPLICANT' | 'MAINTAINER' | 'ADMIN';

interface AuthContextValue {
  token: string | null;
  applicant: Applicant | null;
  role: Role | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMaintainer: boolean;
  isStaff: boolean;
  login: (token: string, role: Role, applicant?: Applicant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('enao_token');
    const savedApplicant = localStorage.getItem('enao_applicant');
    const savedRole = localStorage.getItem('enao_role') as Role | null;
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
      if (savedApplicant) {
        setApplicant(JSON.parse(savedApplicant));
      }
    }
  }, []);

  const login = useCallback((newToken: string, newRole: Role, newApplicant?: Applicant) => {
    localStorage.setItem('enao_token', newToken);
    localStorage.setItem('enao_role', newRole);
    setToken(newToken);
    setRole(newRole);
    if (newApplicant) {
      localStorage.setItem('enao_applicant', JSON.stringify(newApplicant));
      setApplicant(newApplicant);
    } else {
      localStorage.removeItem('enao_applicant');
      setApplicant(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('enao_token');
    localStorage.removeItem('enao_applicant');
    localStorage.removeItem('enao_role');
    setToken(null);
    setApplicant(null);
    setRole(null);
  }, []);

  const isAdmin = role === 'ADMIN';
  const isMaintainer = role === 'MAINTAINER';
  const isStaff = isAdmin || isMaintainer;

  return (
    <AuthContext.Provider
      value={{
        token,
        applicant,
        role,
        isAuthenticated: !!token,
        isAdmin,
        isMaintainer,
        isStaff,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
