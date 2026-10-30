import React from "react";
import { Info, ShieldAlert } from "lucide-react";

export const NoticeBanner: React.FC = () => {
  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-b border-border/80 text-muted-foreground px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
        <div className="flex items-center gap-1.5">
          <Info className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            <strong>Neighbourhood Network:</strong> An independent community safety & service platform. Not an emergency service or official government portal.
          </span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="size-3.5" /> For immediate life danger: Dial 112
          </span>
        </div>
      </div>
    </div>
  );
};

