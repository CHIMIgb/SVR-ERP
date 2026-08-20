export const datePickerClasses = {
  root: 'relative inline-block w-full',
  label: 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1',
  error: 'text-xs font-semibold text-red-500 mt-1 ml-1',
  inputWrapper:
    'relative flex items-center w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-within:border-primary/50 focus-within:bg-white transition-all cursor-pointer',
  inputWrapperError: 'border-red-300 focus-within:border-red-400 bg-red-50/30',
  inputWrapperDisabled: 'bg-slate-100 text-slate-400 cursor-not-allowed',
  input: 'w-full bg-transparent outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 cursor-pointer',
  inputDisabled: 'cursor-not-allowed',
  icon: 'shrink-0 text-slate-400 ml-2',
  clearButton:
    'shrink-0 ml-2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors',
  calendar:
    'absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 w-[280px] animate-[fadeScaleIn_0.15s_ease-out]',
  calendarHeader: 'flex items-center justify-between mb-3',
  calendarTitle: 'text-sm font-black text-slate-900',
  navButton:
    'w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors',
  daysHeader: 'grid grid-cols-7 mb-2',
  dayLabel: 'text-[10px] font-black text-slate-400 uppercase tracking-wider text-center',
  daysGrid: 'grid grid-cols-7 gap-1',
  dayButton:
    'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors',
  dayButtonToday: 'bg-slate-100 text-slate-900 font-black',
  dayButtonSelected: 'bg-primary text-white hover:bg-primary-dark',
  dayButtonDisabled: 'text-slate-300 cursor-not-allowed hover:bg-transparent',
  dayButtonOutside: 'text-slate-300',
};
