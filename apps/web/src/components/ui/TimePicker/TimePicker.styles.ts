export const timePickerClasses = {
  wrapper: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
  inputWrapper: 'relative flex items-center',
  input:
    'w-full h-10 sm:h-11 px-3 sm:px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  inputError: 'border-red-300 focus:border-red-500 focus:ring-red-100',
  iconRight: 'absolute right-3 text-slate-400 pointer-events-none',
  error: 'text-xs font-medium text-red-500',
  dropdown:
    'z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-[280px]',
  columns: 'flex gap-3',
  column: 'flex-1',
  columnHeader: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2',
  list: 'max-h-[200px] overflow-y-auto overflow-x-hidden space-y-0.5 scrollbar-thin',
  option:
    'w-full text-center text-sm font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 text-slate-700',
  optionActive: 'bg-primary text-white hover:bg-primary-dark',
  separator: 'text-lg font-bold text-slate-300 self-center pt-5',
  footer: 'flex items-center justify-between mt-3 pt-3 border-t border-slate-100',
  nowButton:
    'text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer',
  clearButton:
    'text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer',
};
