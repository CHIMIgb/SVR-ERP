'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchInputClasses } from './SearchInput.styles';

export interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  placeholder = 'Buscar...',
  onChange,
  onSearch,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

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
  };

  return (
    <div className={cn(searchInputClasses.wrapper, className)}>
      <Search className={searchInputClasses.icon} size={18} />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className={searchInputClasses.input}
      />
      {value && (
        <button onClick={handleClear} className={searchInputClasses.clear}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
