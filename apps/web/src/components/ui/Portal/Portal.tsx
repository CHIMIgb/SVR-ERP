'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

// En el servidor no hay document: se renderiza nada y React hidrata igual,
// luego useSyncExternalStore entrega el valor real del cliente.
const suscribir = () => () => {};
const cliente = () => true;
const servidor = () => false;

export function Portal({ children, container }: PortalProps) {
  const montado = useSyncExternalStore(suscribir, cliente, servidor);

  if (!montado) return null;

  const target = container || document.body;
  return createPortal(children, target);
}
