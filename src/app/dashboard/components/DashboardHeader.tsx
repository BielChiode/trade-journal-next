import React from "react";
import { LogOut } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
      <h1 className="text-base sm:text-lg font-semibold truncate">
        Trade Journal
      </h1>

      <div className="flex items-center gap-6">
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
        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
