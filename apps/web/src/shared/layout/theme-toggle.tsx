"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/src/shared/components/action-button";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <IconButton
      variant="secondary"
      onClick={toggleTheme}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      icon={
        dark ? (
          <Sun className="size-4" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )
      }
    >
      {dark ? "Modo claro" : "Modo escuro"}
    </IconButton>
  );
}
