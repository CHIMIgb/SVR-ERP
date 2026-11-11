"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input de PIN de 8 casillas en grupos 4-4 (plan §7b/§8.4 — review del
 * teléfono 2026-11-11).
 * Enmascarado con `pin-disc` (globals.css, -webkit-text-security): al
 * escribir SOLO se ven puntos — el caracter nunca se renderiza como texto.
 * Captura por `onChange` estándar (fiable en teclados virtuales; el e.key
 * NO lo es en móviles). Pegar un PIN completo lo distribuye. El valor real
 * es SIEMPRE 8 caracteres sin guion.
 */
interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  ariaLabel?: string;
}

/** Una casilla del PIN (8 en total). */
function Casilla({
  valor,
  onChange,
  disabled,
  error,
  ariaLabel,
  refCb,
}: {
  valor: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  ariaLabel: string;
  refCb: (el: HTMLInputElement | null) => void;
}) {
  return (
    <input
      ref={refCb}
      type="text"
      inputMode="text"
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      autoComplete="off"
      maxLength={8}
      value={valor}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (!raw) {
          onChange("");
          return;
        }
        // pegaron/escribieron más de 1: lo que entra va al valor completo
        onChange(raw);
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "pin-disc w-full h-12 sm:h-14 text-center text-xl font-black text-white",
        "bg-white/5 border rounded-md focus:outline-none transition-all",
        "caret-transparent select-none",
        "disabled:opacity-60",
        valor && "border-primary/50",
        error
          ? "border-red-500/60 focus:border-red-400"
          : "border-white/10 focus:border-primary/50 focus:bg-white/10",
      )}
    />
  );
}

export function PinInput({ value, onChange, disabled, error, ariaLabel = "PIN" }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  /** Maneja un cambio en la casilla `i`: distribuye el texto entrado. */
  const cambio = (i: number, texto: string) => {
    const limpio = texto.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!limpio) {
      // borró el contenido de la casilla
      const chars = value.split("");
      while (chars.length < 8) chars.push("");
      chars[i] = "";
      onChange(chars.join("").trimEnd());
      return;
    }
    if (limpio.length === 1) {
      const chars = value.split("");
      while (chars.length < 8) chars.push("");
      chars[i] = limpio;
      onChange(chars.join("").trimEnd());
      return;
    }
    // entraron varios caracteres (paste en la casilla): se rellenan desde aquí
    const chars = value.split("");
    while (chars.length < 8) chars.push("");
    for (let k = 0; k < limpio.length && i + k < 8; k++) {
      chars[i + k] = limpio[k];
    }
    onChange(chars.join("").trimEnd());
  };

  const casilla = (i: number) => (
    <Casilla
      key={i}
      valor={value[i] ?? ""}
      onChange={(t) => {
        cambio(i, t);
        const limpio = t.replace(/[^A-Za-z0-9]/g, "");
        if (limpio.length === 1 && i < 7) refs.current[i + 1]?.focus();
      }}
      disabled={disabled}
      error={error}
      ariaLabel={`${ariaLabel} posición ${i + 1}`}
      refCb={(el) => { refs.current[i] = el; }}
    />
  );

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full"
      role="group"
      aria-label={`${ariaLabel} (se oculta al escribir)`}
    >
      {Array.from({ length: 4 }).map((_, i) => casilla(i))}
      <span
        aria-hidden
        className="text-xl font-black text-slate-500 select-none shrink-0 px-0.5"
      >
        -
      </span>
      {Array.from({ length: 4 }).map((_, k) => casilla(k + 4))}
    </div>
  );
}
