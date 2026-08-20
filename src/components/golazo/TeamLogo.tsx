import { Avatar } from '@/components/ui';

interface TeamLogoProps {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  size?: number;
}

export function TeamLogo({ name, logoUrl, primaryColor, size = 40 }: TeamLogoProps) {
  return (
    <Avatar uri={logoUrl} name={name} size={size} backgroundColor={primaryColor ?? undefined} />
  );
}
