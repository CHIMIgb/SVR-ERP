import { cn } from '@/lib/utils';
import { formFieldClasses } from './FormField.styles';

export interface FormFieldProps {
  /** Etiqueta del campo */
  label?: string;
  /** Texto de ayuda */
  hint?: string;
  /** Texto de error */
  error?: string;
  /** Marcar el campo como requerido */
  required?: boolean;
  /** ID del campo asociado al label */
  htmlFor?: string;
  /** Contenido del campo (input, select, etc.) */
  children: React.ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

export function FormField({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn(formFieldClasses.root, className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            formFieldClasses.label,
            required && formFieldClasses.labelRequired
          )}
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className={formFieldClasses.error}>{error}</p>
      ) : hint ? (
        <p className={formFieldClasses.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
