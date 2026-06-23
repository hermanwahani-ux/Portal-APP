import {
  BookOpen,
  DollarSign,
  FileText,
  Library,
  CheckSquare,
  GraduationCap,
  Sparkles,
  Award,
  Calendar,
  Layers,
  LineChart,
  Grid,
  Users,
  Shield,
  Laptop,
  HelpCircle
} from 'lucide-react';

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function AppIcon({ name, className = "w-5 h-5", size }: AppIconProps) {
  const iconProps = { className, size };
  
  switch (name.toLowerCase()) {
    case 'bookopen':
    case 'book-open':
      return <BookOpen {...iconProps} />;
    case 'dollarsign':
    case 'dollar-sign':
      return <DollarSign {...iconProps} />;
    case 'filetext':
    case 'file-text':
      return <FileText {...iconProps} />;
    case 'library':
      return <Library {...iconProps} />;
    case 'checksquare':
    case 'check-square':
      return <CheckSquare {...iconProps} />;
    case 'graduationcap':
    case 'graduation-cap':
      return <GraduationCap {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    case 'linechart':
    case 'line-chart':
      return <LineChart {...iconProps} />;
    case 'grid':
    case 'grid-3x3':
      return <Grid {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'shield':
    case 'security':
      return <Shield {...iconProps} />;
    case 'laptop':
    case 'computer':
      return <Laptop {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
}
