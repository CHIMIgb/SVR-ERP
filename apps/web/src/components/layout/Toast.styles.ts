import type { ToastPosition, ToastType, ToastTransition } from './Toast.types';

/* ── Posiciones del contenedor ── */

export const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

/* ── Colores por tipo (consistente con Button/Badge) ── */

export const typeClasses: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-500/10',
    border: 'border-green-200 dark:border-green-500/25',
    icon: 'text-green-500',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/25',
    icon: 'text-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/25',
    icon: 'text-amber-500',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/25',
    icon: 'text-blue-500',
    progress: 'bg-blue-500',
  },
};

/* ── Mapeo de transiciones a clases de animacion ── */

export const transitionClasses: Record<ToastTransition, string> = {
  fadeIn: 'animate-[toastFadeIn_0.35s_ease-out]',
  bounceIn: 'animate-[toastBounceIn_0.5s_cubic-bezier(0.68,-0.55,0.27,1.55)]',
  swingInverted: 'animate-[toastSwingInverted_0.6s_cubic-bezier(0.68,-0.55,0.27,1.55)]',
  popUp: 'animate-[toastPopUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]',
  topBounce: 'animate-[toastTopBounce_0.5s_cubic-bezier(0.68,-0.55,0.27,1.55)]',
  bounceInDown: 'animate-[toastBounceInDown_0.6s_cubic-bezier(0.68,-0.55,0.27,1.55)]',
  bounceInUp: 'animate-[toastBounceInUp_0.6s_cubic-bezier(0.68,-0.55,0.27,1.55)]',
};

/* ── Clases del toast individual ── */

export const toastClasses = {
  base: 'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold max-w-sm w-full pointer-events-auto backdrop-blur-sm',
  message: 'flex-1 leading-snug text-ui-800',
  closeButton: 'shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-ui-400 hover:text-ui-600 hover:bg-ui-200/50 transition-colors cursor-pointer',
};
