export type Role = "student" | "education" | "qh" | "enterprise";

export interface RoleOption {
  id: Role;
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

export const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  delay: i * 1.5,
  duration: 6 + (i % 4),
  x: 5 + i * 9,
  size: 4 + (i % 3) * 3,
  opacity: 0.15 + (i % 3) * 0.08,
}));
