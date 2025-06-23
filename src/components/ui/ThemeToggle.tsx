"use client";

import * as React from "react";
import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled={true}>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alterar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden"
      title="Alterar tema"
    >
      <span
        className="block transition-opacity duration-300 ease-in-out absolute inset-0 flex items-center justify-center"
        style={{ opacity: resolvedTheme === "dark" ? 0 : 1 }}
      >
        <Sun className="h-5 w-5" />
      </span>
      <span
        className="block transition-opacity duration-300 ease-in-out absolute inset-0 flex items-center justify-center"
        style={{ opacity: resolvedTheme === "dark" ? 1 : 0 }}
      >
        <MoonStar className="h-5 w-5" />
      </span>
      <span className="sr-only">Alterar tema</span>
    </Button>
  );
}
