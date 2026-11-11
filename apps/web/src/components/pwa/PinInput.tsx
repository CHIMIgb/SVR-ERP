"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input de PIN de 8 casillas (login móvil y cambio de PIN — plan §7b/§8.4).
 * Auto-avanza al escribir, retrocede con Backspace, pega el PIN completo.
 * Enmascarado (nadie ve el PIN — spec §6.7).
 */
interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  /** Marca visual de error (bordes rojos). */
  error?: boolean;
  /** Título accesible. */
  ariaLabel?: string;
}

export function PinInput({ value, onChange, disabled, error, ariaLabel = "PIN" }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setChar = (index: number, char: string) => {
    const chars = value.split("");
    chars[index] = char;
    onChange(chars.join("").trimEnd());
  };

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label={ariaLabel}>
      {Array.from({ length: 8 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          aria-label={`${ariaLabel} posición ${i + 1}`}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
            if (!raw) return;
            if (raw.length > 1) {
              // pegaron/pegaron con autocompletado: distribuye el resto
              onChange(raw.slice(0, 8));
              refs.current[Math.min(8, raw.length) - 1]?.focus();
              return;
            }
            setChar(i, raw);
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const chars = value.split("");
              while (chars.length < 8) chars.push("");
              if (chars[i]) {
                chars[i] = "";
                onChange(chars.join("").trimEnd());
                return; // no retrocede: solo borra la casilla actual
              }
              if (i > 0) {
                chars[i - 1] = "";
                onChange(chars.join("").trimEnd());
                refs.current[i - 1]?.focus();
              }
            }
          }}
          className={cn(
            "w-10 h-12 sm:w-11 sm:h-14 text-center text-xl font-black text-white",
            "bg-white/5 border rounded-xl focus:outline-none transition-all",
            "disabled:opacity-60",
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-white/10 focus:border-primary/50 focus:bg-white/10",
          )}
        />
      ))}
    </div>
  );
}
