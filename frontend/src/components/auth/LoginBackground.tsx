import { Award, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, GraduationCap, Network, Users } from 'lucide-react';

const decorations = [
  { Icon: GraduationCap, position: 'graduation' },
  { Icon: BriefcaseBusiness, position: 'briefcase' },
  { Icon: BookOpen, position: 'book' },
  { Icon: Network, position: 'network' },
  { Icon: ChartNoAxesCombined, position: 'chart' },
  { Icon: Users, position: 'users' },
  { Icon: Award, position: 'award' },
];

export function LoginBackground() {
  return <div className="login-background" aria-hidden="true">
    {decorations.map(({ Icon, position }) => (
      <div key={position} className={`login-background-icon login-background-icon--${position}`}>
        <Icon strokeWidth={1.4} />
      </div>
    ))}
  </div>;
}
