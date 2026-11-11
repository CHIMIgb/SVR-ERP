"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Input de PIN de 8 casillas en grupos 4-4 (plan §7b/§8.4 — review del
 * teléfono 2026-11-11).
 * Patrón OTP robusto: UN input password invisible (opacity-0) captura todo
 * nativamente (teclado, backspace, paste — el password JAMÁS muestra letras
 * en ningún navegador) y las 8 casillas son DECORATIVAS: dibujan un punto
 * blanco por dígito capturado. El valor real es SIEMPRE 8 caracteres sin
 * guion; el guion del centro es decorativo.
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [foco, setFoco] = useState(false);

  const limpio = value.replace(/[^A-Za-z0-9]/g, "");

  /** Casilla decorativa: punto blanco si tiene dígito, vacía si no. */
  const casilla = (i: number) => (
    <div
      key={i}
      className={cn(
        "relative flex-1 min-w-0 h-12 sm:h-14 rounded-md border transition-all",
        "bg-surface",
        foco ? "border-primary/60" : "border-ui-200",
        error
          ? "border-red-500/60"
          : limpio[i]
            ? "border-primary/50"
            : "",
      )}
    >
      {limpio[i] && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none text-2xl font-black text-ui-900"
        >
          •
        </span>
      )}
    </div>
  );

  return (
    <div
      className="relative flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full cursor-text"
      role="group"
      aria-label={`${ariaLabel} (se oculta al escribir)`}
    >
      {/* El input REAL: password (nunca muestra letras), invisible pero
          tapable — cubre todo el grupo de casillas. */}
      <input
        ref={inputRef}
        type="password"
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        maxLength={8}
        value={limpio}
        disabled={disabled}
        aria-label={ariaLabel}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        onChange={(e) => {
          onChange(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8));
        }}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
      />
      {/* Casillas decorativas (pointer-events-none: los toques van al input) */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full pointer-events-none" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => casilla(i))}
        <span className="text-xl font-black text-ui-400 select-none shrink-0 px-0.5">-</span>
        {Array.from({ length: 4 }).map((_, k) => casilla(k + 4))}
      </div>
    </div>
  );
}
