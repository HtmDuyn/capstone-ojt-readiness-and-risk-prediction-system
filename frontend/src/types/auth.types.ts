import React from 'react';

// ─── 5 Roles across the system ───────────────────────────────────────────────
export type UserRole = 'student' | 'education' | 'qhdn' | 'enterprise' | 'admin';

// Backward compatibility alias if needed
export type Role = UserRole;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export interface RoleOption {
  id: UserRole;
  label: string;
  icon: React.ReactNode;
}

export interface FloatingParticleProps {
  delay: number;
  duration: number;
  x: number;
  size: number;
  opacity: number;
}

export const PARTICLES: FloatingParticleProps[] = Array.from({ length: 10 }, (_, i) => ({
  delay: i * 1.5,
  duration: 6 + (i % 4),
  x: 5 + i * 9,
  size: 4 + (i % 3) * 3,
  opacity: 0.15 + (i % 3) * 0.08,
}));
