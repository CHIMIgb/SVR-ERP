"use client";

import { useContext } from "react";
import { ThemeContext } from "@/providers/ThemeProvider";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme debe usarse dentro de un <ThemeProvider>",
    );
  }

  return context;
}
