import { User, Shield, Code, Cog, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

interface RoleIconProps extends React.SVGProps<SVGSVGElement> {
  role: UserRole;
}

export function RoleIcon({ role, className, ...props }: RoleIconProps) {
  const iconProps = {
    className: cn('h-5 w-5', className),
    ...props,
  };

  switch (role) {
    case 'moderator':
      return <Shield {...iconProps} className={cn(iconProps.className, 'text-blue-500')} />;
    case 'developer':
      return <Crown {...iconProps} className={cn(iconProps.className, 'text-green-500')} />;
    case 'system':
      return <Cog {...iconProps} className={cn(iconProps.className, 'text-purple-500')} />;
    default:
      return <User {...iconProps} className={cn(iconProps.className, 'text-muted-foreground')} />;
  }
}
