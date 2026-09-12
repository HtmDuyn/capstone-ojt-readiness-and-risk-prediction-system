import React from "react";
import type { RoleOption } from "../../types/loginTypes";

export const roles: RoleOption[] = [
  {
    id: "student",
    label: "Sinh viên",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor" opacity="0.9" />
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "education",
    label: "Phòng đào tạo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
        <path d="M10 4h4v4h-4z" fill="currentColor" opacity="0.9" />
        <rect x="14" y="10" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.7" />
        <rect x="4" y="10" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.7" />
        <path d="M12 2a2 2 0 100 4 2 2 0 000-4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "qh",
    label: "Phòng QH doanh nghiệp",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <circle cx="9" cy="7" r="3" fill="currentColor" opacity="0.9" />
        <circle cx="15" cy="7" r="3" fill="currentColor" opacity="0.6" />
        <path d="M3 19c0-3.31 2.69-6 6-6s6 2.69 6 6H3z" fill="currentColor" opacity="0.9" />
        <path d="M15 13c1.66 0 3 1.34 3 3s-1.34 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "enterprise",
    label: "Doanh nghiệp",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="2" y="7" width="20" height="14" rx="1" fill="currentColor" opacity="0.4" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9" />
        <rect x="10" y="11" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.9" />
        <rect x="2" y="11" width="20" height="3" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
];
