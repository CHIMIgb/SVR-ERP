export const radioClasses = {
  root: 'inline-flex items-start gap-3 cursor-pointer group',
  rootDisabled: 'cursor-not-allowed opacity-60',
  inputWrapper:
    'relative shrink-0 w-5 h-5 rounded-full border-2 border-slate-300 bg-white transition-all flex items-center justify-center',
  inputWrapperChecked: 'border-primary',
  inputWrapperError: 'border-red-400 bg-red-50',
  inputWrapperFocus: 'group-focus-within:border-primary',
  input: 'sr-only',
  dot: 'w-2.5 h-2.5 rounded-full bg-primary',
  label: 'text-sm font-semibold text-slate-700 leading-5 select-none',
  labelDisabled: 'text-slate-400',
  error: 'text-xs font-semibold text-red-500 mt-1',
};
