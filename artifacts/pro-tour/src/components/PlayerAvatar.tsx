import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PlayerAvatar({ name, avatarUrl, size = "md", className }: PlayerAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold border border-primary/20">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
