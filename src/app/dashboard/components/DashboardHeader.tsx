"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface DashboardHeaderProps {
  logout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ logout }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
        <h1 className="text-base sm:text-lg font-semibold truncate">
          Trade Journal
        </h1>

        <div className="flex items-center gap-2">
            <ThemeToggle />
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
    </>
  );
};

export default DashboardHeader;
