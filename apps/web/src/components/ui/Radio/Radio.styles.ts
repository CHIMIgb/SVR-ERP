export const radioClasses = {
  root: 'inline-flex items-start gap-3 cursor-pointer group',
  rootDisabled: 'cursor-not-allowed opacity-60',
  inputWrapper:
    'relative shrink-0 w-5 h-5 rounded-full border-2 border-ui-300 bg-surface transition-colors duration-200 flex items-center justify-center',
  inputWrapperChecked: 'border-primary',
  inputWrapperError: 'border-red-400 dark:border-red-500/60 bg-red-50 dark:bg-red-500/10',
  inputWrapperFocus: 'group-focus-within:border-primary',
  input: 'sr-only',
  dot: 'w-2.5 h-2.5 rounded-full bg-primary absolute transition-opacity duration-200',
  dotVisible: 'opacity-100',
  dotHidden: 'opacity-0',
  label: 'text-sm font-semibold text-ui-700 leading-5 select-none',
  labelDisabled: 'text-ui-400',
  error: 'text-xs font-semibold text-red-500 mt-1',
};
