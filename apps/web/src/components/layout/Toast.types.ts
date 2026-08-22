export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastTransition =
  | 'fadeIn'
  | 'bounceIn'
  | 'swingInverted'
  | 'popUp'
  | 'topBounce'
  | 'bounceInDown'
  | 'bounceInUp';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  position: ToastPosition;
  transition: ToastTransition;
  duration: number;
  progress: boolean;
}

export interface ToastOptions {
  position?: ToastPosition;
  transition?: ToastTransition;
  duration?: number;
  progress?: boolean;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
  dismissAll: () => void;
}
