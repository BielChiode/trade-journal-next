import React from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonLoaderProps {
  size?: number;
  className?: string;
  text?: string;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  size = 16,
  className,
  text = "Salvando...",
}) => {
  return (
    <div className="flex items-center justify-center">
      <TrendingUp
        size={size}
        className={cn("animate-pulse text-current", className)}
      />
      {text && <span className="ml-2">{text}</span>}
    </div>
  );
};

export default ButtonLoader;
