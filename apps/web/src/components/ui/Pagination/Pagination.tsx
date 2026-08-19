'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { paginationClasses } from './Pagination.styles';

export interface PaginationProps {
  /** Pagina actual (1-based) */
  currentPage: number;
  /** Total de paginas */
  totalPages: number;
  /** Total de registros */
  totalRecords: number;
  /** Registros por pagina */
  pageSize: number;
  /** Callback al cambiar de pagina */
  onPageChange: (page: number) => void;
  /** Clases adicionales */
  className?: string;
  /** Mostrar botones de salto al inicio/fin */
  showJumpButtons?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  className,
  showJumpButtons = true,
}: PaginationProps) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);

  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <div className={cn(paginationClasses.container, className)}>
      {/* ── Info ── */}
      <span className={paginationClasses.info}>
        Pagina <span className={paginationClasses.infoHighlight}>{currentPage}</span> de{' '}
        <span className={paginationClasses.infoHighlight}>{totalPages}</span>
        {' '}&mdash;{' '}
        Mostrando <span className={paginationClasses.infoHighlight}>{from}-{to}</span> de{' '}
        <span className={paginationClasses.infoHighlight}>{totalRecords.toLocaleString('es-MX')}</span> registros
      </span>

      {/* ── Controls ── */}
      <div className={paginationClasses.controls}>
        {/* Saltar al inicio */}
        {showJumpButtons && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              paginationClasses.btn,
              paginationClasses.btnDefault,
              currentPage === 1 && paginationClasses.btnDisabled
            )}
            title="Primera pagina"
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        {/* Pagina anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            paginationClasses.btn,
            paginationClasses.btnDefault,
            currentPage === 1 && paginationClasses.btnDisabled
          )}
          title="Pagina anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numeros de pagina */}
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`gap-${index}`} className={paginationClasses.pageGap}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                paginationClasses.btn,
                page === currentPage
                  ? paginationClasses.btnActive
                  : paginationClasses.btnDefault
              )}
            >
              {page}
            </button>
          )
        )}

        {/* Pagina siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            paginationClasses.btn,
            paginationClasses.btnDefault,
            currentPage === totalPages && paginationClasses.btnDisabled
          )}
          title="Pagina siguiente"
        >
          <ChevronRight size={16} />
        </button>

        {/* Saltar al final */}
        {showJumpButtons && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              paginationClasses.btn,
              paginationClasses.btnDefault,
              currentPage === totalPages && paginationClasses.btnDisabled
            )}
            title="Ultima pagina"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Genera numeros de pagina con ellipsis ── */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}
