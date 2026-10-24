import { formatNumber } from '@/utils/educationDashboard';
import { AlertTriangle, Database, Loader2 } from 'lucide-react';
import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  loading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  loading = false,
}) => (
  <div className="flex min-h-[170px] flex-col items-center justify-center px-5 py-8 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Database size={20} />
      )}
    </div>

    <p className="mt-3 text-sm font-semibold text-slate-700">
      {loading ? "Đang tải dữ liệu..." : title}
    </p>

    {!loading && description && (
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {description}
      </p>
    )}
  </div>
);

export const ErrorNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
    <span>{message}</span>
  </div>
);

export interface MetricCardProps {
  label: string;
  value: number | null;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  loading: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  icon,
  iconClass,
  loading,
}) => (
  <div className="min-w-0 p-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
    </div>

    <p className="mt-4 text-2xl font-extrabold text-slate-900">
      {loading ? (
        <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
      ) : (
        formatNumber(value)
      )}
    </p>

    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      {!loading && value === null ? "Chưa có số liệu từ API" : description}
    </p>
  </div>
);

export interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconClass: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  description,
  iconClass,
}) => (
  <div className="flex items-start gap-3">
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      {icon}
    </div>

    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      )}
    </div>
  </div>
);
