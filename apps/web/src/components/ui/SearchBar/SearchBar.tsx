'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchBarClasses } from './SearchBar.styles';

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface SearchBarProps {
  /** Valor de busqueda controlado */
  value?: string;
  /** Placeholder del input de busqueda */
  placeholder?: string;
  /** Callback al cambiar el valor de busqueda */
  onChange?: (value: string) => void;
  /** Callback al enviar la busqueda (Enter) */
  onSearch?: (value: string) => void;
  /** Tiempo de debounce en ms */
  debounceMs?: number;
  /** Campos de filtro disponibles */
  filters?: FilterField[];
  /** Filtros activos */
  activeFilters?: ActiveFilter[];
  /** Callback al cambiar un filtro */
  onFilterChange?: (key: string, value: string) => void;
  /** Callback al limpiar todos los filtros */
  onClearFilters?: () => void;
  /** Callback al eliminar un filtro individual */
  onRemoveFilter?: (key: string) => void;
  /** Clase CSS adicional */
  className?: string;
}

/* ────────────────────────────────────────────────────────────────
   SearchBar Component
   ──────────────────────────────────────────────────────────────── */

export function SearchBar({
  value: controlledValue,
  placeholder = 'Buscar...',
  onChange,
  onSearch,
  debounceMs = 300,
  filters = [],
  activeFilters = [],
  onFilterChange,
  onClearFilters,
  onRemoveFilter,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debounceRef = useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (val: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => onSearch?.(val), debounceMs);
    };
  }, [debounceMs, onSearch])();

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
    debounceRef(val);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn(searchBarClasses.container, className)}>
      {/* Search Input */}
      <div className={searchBarClasses.searchWrapper}>
        <Search className={searchBarClasses.searchIcon} size={18} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          className={searchBarClasses.searchInput}
        />
        {value && (
          <button onClick={handleClear} className={searchBarClasses.searchClear} aria-label="Limpiar busqueda">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Toggle Button */}
      {filters.length > 0 && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            searchBarClasses.filterBtn,
            (showFilters || hasActiveFilters) && searchBarClasses.filterBtnActive
          )}
        >
          <SlidersHorizontal size={16} />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FilterPanel Component
   ──────────────────────────────────────────────────────────────── */

export interface FilterPanelProps {
  /** Campos de filtro */
  filters: FilterField[];
  /** Valores actuales de los filtros */
  values?: Record<string, string>;
  /** Callback al cambiar un filtro */
  onChange?: (key: string, value: string) => void;
  /** Callback al limpiar todos los filtros */
  onClear?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export function FilterPanel({
  filters,
  values = {},
  onChange,
  onClear,
  className,
}: FilterPanelProps) {
  const hasValues = Object.values(values).some((v) => v !== '');

  return (
    <div className={cn(searchBarClasses.filterPanel, className)}>
      <div className={searchBarClasses.filterRow}>
        {filters.map((filter) => (
          <div key={filter.key} className={searchBarClasses.filterGroup}>
            <label className={searchBarClasses.filterLabel}>{filter.label}</label>
            {filter.type === 'select' && (
              <select
                value={values[filter.key] || ''}
                onChange={(e) => onChange?.(filter.key, e.target.value)}
                className={searchBarClasses.filterSelect}
              >
                <option value="">{filter.placeholder || 'Todos'}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === 'date' && (
              <input
                type="date"
                value={values[filter.key] || ''}
                onChange={(e) => onChange?.(filter.key, e.target.value)}
                className={searchBarClasses.filterDate}
              />
            )}
            {filter.type === 'text' && (
              <input
                type="text"
                value={values[filter.key] || ''}
                placeholder={filter.placeholder}
                onChange={(e) => onChange?.(filter.key, e.target.value)}
                className={searchBarClasses.filterDate}
              />
            )}
          </div>
        ))}

        {hasValues && (
          <div className="flex items-end sm:items-center">
            <button
              onClick={onClear}
              className="h-9 sm:h-10 px-3 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   ActiveFilters Component
   ──────────────────────────────────────────────────────────────── */

export interface ActiveFiltersProps {
  /** Filtros activos */
  filters: ActiveFilter[];
  /** Callback al eliminar un filtro */
  onRemove?: (key: string) => void;
  /** Callback al limpiar todos */
  onClearAll?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn(searchBarClasses.chipContainer, className)}>
      {filters.map((filter) => (
        <span key={filter.key} className={searchBarClasses.chip}>
          <span className="font-normal text-primary/70">{filter.label}:</span>
          <span>{filter.value}</span>
          {onRemove && (
            <button
              onClick={() => onRemove(filter.key)}
              className={searchBarClasses.chipRemove}
              aria-label={`Eliminar filtro ${filter.label}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors ml-1"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
