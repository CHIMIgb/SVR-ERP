export const checkboxClasses = {
  root: 'inline-flex items-start gap-3 cursor-pointer group',
  rootDisabled: 'cursor-not-allowed opacity-60',
  inputWrapper:
    'relative shrink-0 w-5 h-5 rounded-md border-2 border-ui-300 bg-surface transition-colors duration-200 flex items-center justify-center',
  inputWrapperChecked: 'bg-primary border-primary',
  inputWrapperError: 'border-red-400 dark:border-red-500/60 bg-red-50 dark:bg-red-500/10',
  inputWrapperFocus: 'group-focus-within:border-primary',
  input: 'sr-only',
  checkIcon: 'text-white w-3.5 h-3.5 absolute',
  checkIconVisible: 'opacity-100',
  checkIconHidden: 'opacity-0',
  indeterminateIcon: 'text-white w-3 h-3 absolute',
  label: 'text-sm font-semibold text-ui-700 leading-5 select-none',
  labelDisabled: 'text-ui-400',
  error: 'text-xs font-semibold text-red-500 mt-1',
};
