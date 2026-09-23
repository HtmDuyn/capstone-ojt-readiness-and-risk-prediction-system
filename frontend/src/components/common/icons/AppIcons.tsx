import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Activity,
  Compass,
  ClipboardCheck,
  UserCheck,
  TrendingUp,
  Award,
  Bell,
  Sparkles,
  CircleHelp,
  Search,
  Globe,
  Info,
  Zap,
  Check,
  Briefcase,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Star,
  Hourglass,
  BookOpen,
  Lock,
  Download,
  Filter,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Building2,
  MapPin,
  Users,
  LucideProps,
  Calendar,
} from 'lucide-react';

export interface IconProps extends LucideProps {
  size?: number | string;
  className?: string;
}

/**
 * FPT University 3-petal brand flame logo (Custom SVG)
 */
export const FptLogoIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 32,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M14 36C14 36 10 32 10 24C10 16 16 10 20 8C19 13 21 16 23 18C20 18 16 22 16 28C16 31 18 34 20 36H14Z"
      fill="#005B9E"
    />
    <path
      d="M24 38C24 38 18 33 18 24C18 15 26 8 30 6C29 12 32 15 34 18C30 18 24 23 24 30C24 33 26 36 28 38H24Z"
      fill="#F26F21"
    />
    <path
      d="M34 38C34 38 29 34 29 27C29 20 34 14 38 12C37 16 39 18 41 20C38 21 34 25 34 30C34 33 36 36 37 38H34Z"
      fill="#00A859"
    />
  </svg>
);

// Lucide icon components with standard modern strokeWidth and sizing
export const DashboardGridIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <LayoutDashboard size={size} strokeWidth={strokeWidth} {...props} />
);

export const AcademicCapIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <GraduationCap size={size} strokeWidth={strokeWidth} {...props} />
);

export const RiskAnalyticsIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Activity size={size} strokeWidth={strokeWidth} {...props} />
);

export const RoadmapConsultingIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Compass size={size} strokeWidth={strokeWidth} {...props} />
);

export const OjtRegisterIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <ClipboardCheck size={size} strokeWidth={strokeWidth} {...props} />
);

export const OjtProfileIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <UserCheck size={size} strokeWidth={strokeWidth} {...props} />
);

export const InternshipProgressIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <TrendingUp size={size} strokeWidth={strokeWidth} {...props} />
);

export const EvaluationResultsIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Award size={size} strokeWidth={strokeWidth} {...props} />
);

export const NotificationBellIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Bell size={size} strokeWidth={strokeWidth} {...props} />
);

export const BotSparkleIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Sparkles size={size} strokeWidth={strokeWidth} {...props} />
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <CircleHelp size={size} strokeWidth={strokeWidth} {...props} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <Search size={size} strokeWidth={strokeWidth} {...props} />
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 1.8, ...props }) => (
  <Globe size={size} strokeWidth={strokeWidth} {...props} />
);

export const InfoIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 1.8, ...props }) => (
  <Info size={size} strokeWidth={strokeWidth} {...props} />
);

export const LightningIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Zap size={size} strokeWidth={strokeWidth} {...props} />
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2.5, ...props }) => (
  <Check size={size} strokeWidth={strokeWidth} {...props} />
);

export const BriefcaseIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 1.8, ...props }) => (
  <Briefcase size={size} strokeWidth={strokeWidth} {...props} />
);

export const TrendUpIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.5, ...props }) => (
  <TrendingUp size={size} strokeWidth={strokeWidth} {...props} />
);

export const ClockIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2, ...props }) => (
  <Clock size={size} strokeWidth={strokeWidth} {...props} />
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ChevronDown size={size} strokeWidth={strokeWidth} {...props} />
);

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ChevronUp size={size} strokeWidth={strokeWidth} {...props} />
);

export const MenuIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, ...props }) => (
  <Menu size={size} strokeWidth={strokeWidth} {...props} />
);

export const CloseIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, ...props }) => (
  <X size={size} strokeWidth={strokeWidth} {...props} />
);

export const SignOutIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <LogOut size={size} strokeWidth={strokeWidth} {...props} />
);

export const LogoutIcon = SignOutIcon;

export const StarIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Star size={size} strokeWidth={strokeWidth} {...props} />
);

export const HourglassIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Hourglass size={size} strokeWidth={strokeWidth} {...props} />
);

export const BookOpenIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <BookOpen size={size} strokeWidth={strokeWidth} {...props} />
);

export const LockIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 1.8, ...props }) => (
  <Lock size={size} strokeWidth={strokeWidth} {...props} />
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <Download size={size} strokeWidth={strokeWidth} {...props} />
);

export const FilterIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <Filter size={size} strokeWidth={strokeWidth} {...props} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ArrowRight size={size} strokeWidth={strokeWidth} {...props} />
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ExternalLink size={size} strokeWidth={strokeWidth} {...props} />
);

export const MoreVerticalIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <MoreVertical size={size} strokeWidth={strokeWidth} {...props} />
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, ...props }) => (
  <CheckCircle2 size={size} strokeWidth={strokeWidth} {...props} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ChevronRight size={size} strokeWidth={strokeWidth} {...props} />
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 16, strokeWidth = 2, ...props }) => (
  <ChevronLeft size={size} strokeWidth={strokeWidth} {...props} />
);

export const BuildingIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Building2 size={size} strokeWidth={strokeWidth} {...props} />
);

export const LocationIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <MapPin size={size} strokeWidth={strokeWidth} {...props} />
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Users size={size} strokeWidth={strokeWidth} {...props} />
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.8, ...props }) => (
  <Calendar size={size} strokeWidth={strokeWidth} {...props} />
);

