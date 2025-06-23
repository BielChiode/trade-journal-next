"use client";

import React from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface DashboardHeaderProps {
  initialCapital: number;
  currentCapital: number;
  logout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  initialCapital,
  currentCapital,
  logout,
}) => {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
      <h1 className="text-base sm:text-lg font-semibold truncate">
        Trade Journal
      </h1>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-xs md:flex-row md:items-center md:gap-4 md:text-sm">
          <div className="text-right">
            <span className="text-muted-foreground">Capital Inicial: </span>
            <span className="font-semibold">
              {formatCurrency(initialCapital)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Capital Atual: </span>
            <span className="font-semibold">
              {formatCurrency(currentCapital)}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Alterar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
