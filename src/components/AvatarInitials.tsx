export default function AvatarInitials({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
  }[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-paper-muted font-medium text-graphite ${sizeClasses}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
