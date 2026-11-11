"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input de PIN de 8 casillas (login móvil y cambio de PIN — plan §7b/§8.4).
 * NUNCA se ve un carácter: las casillas permanecen vacías (solo el foco las
 * marca) y el caracter se captura con el evento de teclado (e.key) — el valor
 * real vive solo en el estado del formulario (spec §6.7: nadie ve PINs).
 * El valor real es SIEMPRE 8 caracteres sin guion; el guion después del 4º
 * dígito es solo visual (como en TRA-0142) y las casillas son fluidas:
 * nunca desbordan su contenedor.
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

  const borrarCasilla = (i: number) => {
    const chars = value.split("");
    while (chars.length < 8) chars.push("");
    chars[i] = "";
    onChange(chars.join("").trimEnd());
  };

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full"
      role="group"
      aria-label={`${ariaLabel} (se oculta al escribir)`}
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
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            // La casilla SIEMPRE vacía: el caracter va al estado por e.key
            value=""
            onChange={() => undefined}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Backspace") {
                e.preventDefault();
                borrarCasilla(i);
                if (!value[i] && i > 0) refs.current[i - 1]?.focus();
                return;
              }
              if (/^[a-zA-Z0-9]$/.test(e.key)) {
                e.preventDefault();
                setChar(i, e.key.toUpperCase());
                refs.current[i + 1]?.focus();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              if (disabled) return;
              const texto = e.clipboardData
                .getData("text")
                .replace(/[^A-Za-z0-9]/g, "")
                .toUpperCase();
              if (!texto) return;
              // pega desde esta casilla hasta llenar las 8
              const chars = texto.split("");
              let idx = i;
              for (const c of chars) {
                if (idx >= 8) break;
                setChar(idx, c);
                idx++;
              }
              refs.current[Math.min(8, idx)]?.focus();
            }}
            disabled={disabled}
            aria-label={`${ariaLabel} posición ${i + 1}`}
            className={cn(
              "flex-1 min-w-0 h-12 sm:h-14 aspect-[4/5] text-center text-xl font-black",
              "bg-white/5 border rounded-md focus:outline-none transition-all",
              "caret-transparent select-none",
              "disabled:opacity-60",
              value[i] && "border-primary/50",
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
