'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { POSSale } from '@/lib/pos';

/** Retiro / gasto de caja chica de la sección "Retiros / Gastos". */
export interface Retiro {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  hora: string;
  autorizadoPor: string;
}

/** Turno de caja: estado compartido entre /ventas y /ventas/corte (fase 1 frontend). */
export interface CashRegisterState {
  /** Fondo inicial del turno (alimenta el arqueo). */
  openingAmount: string;
  /** true una vez que se registró el cierre del día. */
  closed: boolean;
  notes: string;
  nextTurnCash: string;
}

interface POSContextValue {
  sales: POSSale[];
  addSale: (sale: POSSale) => void;
  retiros: Retiro[];
  setRetiros: Dispatch<SetStateAction<Retiro[]>>;
  register: CashRegisterState;
  setRegister: Dispatch<SetStateAction<CashRegisterState>>;
}

const POSContext = createContext<POSContextValue | undefined>(undefined);

const initialRegister: CashRegisterState = {
  openingAmount: '',
  closed: false,
  notes: '',
  nextTurnCash: '',
};

export function POSProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<POSSale[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [register, setRegister] = useState<CashRegisterState>(initialRegister);

  const addSale = useCallback((sale: POSSale) => {
    setSales((prev) => [sale, ...prev]);
  }, []);

  const value: POSContextValue = {
    sales,
    addSale,
    retiros,
    setRetiros,
    register,
    setRegister,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS(): POSContextValue {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS debe usarse dentro de <POSProvider>.');
  }
  return context;
}