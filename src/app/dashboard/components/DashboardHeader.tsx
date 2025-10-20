"use client";

import React, { useState } from "react";
import Image from "next/image";
import { LogOut, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import RiskCalculatorModal from "@/components/RiskCalculatorModal";

interface DashboardHeaderProps {
  logout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ logout }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isRiskCalculatorOpen, setIsRiskCalculatorOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Trade Journal"
            width={60}
            height={40}
            className="h-8 w-12 sm:h-9 sm:w-14"
            priority
          />
          <span className="text-base sm:text-lg font-semibold">
            Trade Journal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsRiskCalculatorOpen(true)} title="Calculadora de Risco">
            <Calculator size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} title="Sair">
            <LogOut size={16} />
          </Button>
        </div>
      </header>
      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Confirmar Logout"
        message="Você tem certeza que deseja sair?"
        loading={false}
      />
      <RiskCalculatorModal
        isOpen={isRiskCalculatorOpen}
        onClose={() => setIsRiskCalculatorOpen(false)}
      />
    </>
  );
};

export default DashboardHeader;
