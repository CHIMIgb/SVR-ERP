"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input de PIN de 8 casillas (login móvil y cambio de PIN — plan §7b/§8.4).
 * Auto-avanza al escribir, retrocede con Backspace, pega el PIN completo.
 * Enmascarado (nadie ve el PIN — spec §6.7).
 * El valor real es SIEMPRE 8 caracteres sin guion; el guion después del 4º
 * dígito es solo visual (como en TRA-0142) y las casillas son fluidas:
 * nunca desbordan su contenedor (review 2026-11-11).
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
    while (chars.length < 8) chars.push("");
    chars[index] = char;
    onChange(chars.join("").trimEnd());
  };

  const manejarTecla = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    const chars = value.split("");
    while (chars.length < 8) chars.push("");
    if (chars[i]) {
      chars[i] = "";
      onChange(chars.join("").trimEnd());
      return; // borra la casilla actual sin retroceder
    }
    if (i > 0) {
      chars[i - 1] = "";
      onChange(chars.join("").trimEnd());
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full"
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="contents">
          {i === 4 && (
            <span
              aria-hidden
              className="text-xl font-black text-slate-500 select-none shrink-0 px-0.5"
            >
              -
            </span>
          )}
          <input
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
                // pegaron un PIN completo: lo distribuye desde esta casilla
                onChange(raw.slice(0, 8));
                refs.current[Math.min(8, raw.length) - 1]?.focus();
                return;
              }
              setChar(i, raw);
              refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => manejarTecla(e, i)}
            className={cn(
              "flex-1 min-w-0 h-12 sm:h-14 aspect-[4/5] text-center text-xl font-black text-white",
              "bg-white/5 border rounded-md focus:outline-none transition-all",
              "disabled:opacity-60",
              error
                ? "border-red-500/60 focus:border-red-400"
                : "border-white/10 focus:border-primary/50 focus:bg-white/10",
            )}
          />
        </div>
      ))}
    </div>
  );
}
