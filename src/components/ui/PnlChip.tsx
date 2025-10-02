import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface PnlChipProps {
  value: number;
  title?: string;
  className?: string;
  size?: "sm" | "md";
  type?: "realized" | "unrealized";
}

const sizeToClasses: Record<NonNullable<PnlChipProps["size"]>, { container: string; icon: number }> = {
  sm: { container: "px-2 py-0.5 text-sm", icon: 14 },
  md: { container: "px-3 py-1 text-sm", icon: 16 },
};

const PnlChip: React.FC<PnlChipProps> = ({ value, title, className, size = "sm", type = "realized" }) => {
  const positive = value >= 0;
  const sizing = sizeToClasses[size];

  const colorClasses = positive
    ? type === "realized"
      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
      : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
    : type === "realized"
    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
    : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

  const weightClasses = type === "realized" ? "font-semibold" : "font-medium";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full shrink-0",
        sizing.container,
        colorClasses,
        weightClasses,
        type === "unrealized" ? "" : "",
        className
      )}
      title={title}
    >
      {positive ? (
        <TrendingUp size={sizing.icon} />
      ) : (
        <TrendingDown size={sizing.icon} />
      )}
      <span>{formatCurrency(value)}</span>
    </div>
  );
};

export default PnlChip;


