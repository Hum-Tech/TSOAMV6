import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`w-full mb-6 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <div className="text-muted-foreground mt-2 text-base leading-relaxed">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
