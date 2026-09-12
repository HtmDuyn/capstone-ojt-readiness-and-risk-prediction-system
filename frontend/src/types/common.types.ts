import React from 'react';

export interface BannerPreset {
  title: string | ((displayName: string) => string);
  description: React.ReactNode;
  badge?: string;
  primaryActionLabel?: string;
  defaultAiPrompt?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
  badgeDot?: boolean;
  badgeText?: string;
  banner?: BannerPreset;
}

export interface ActionButtonConfig {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface UserProfileSummary {
  id: string;
  code?: string;
  fullName: string;
  email: string;
  avatar: string;
  roleName?: string;
  department?: string;
}
