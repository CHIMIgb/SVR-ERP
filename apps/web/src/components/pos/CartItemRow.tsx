'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import { itemSubtotal, itemUnitName, itemUnitPrice } from '@/lib/pos';
import type { CartItem } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/** Fila del carrito: nombre, precio unitario, steppers de cantidad, subtotal y eliminar. */
export function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const unitPrice = itemUnitPrice(item);
  const subtotal = itemSubtotal(item);
  const atMin = item.quantity <= 1;

  return (
    <div className={posClasses.cartRow}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
        <p className={posClasses.muted}>
          {formatCurrency(unitPrice)} por {itemUnitName(item)} · stock {item.product.stock}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrement}
          disabled={atMin}
          className={cn(posClasses.stepBtn, atMin && 'opacity-40')}
          aria-label="Disminuir cantidad"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className={posClasses.qtyText}>{item.quantity}</span>
        <button
          onClick={onIncrement}
          disabled={item.quantity >= item.product.stock}
          className={cn(posClasses.stepBtn, item.quantity >= item.product.stock && 'opacity-40')}
          aria-label="Aumentar cantidad"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <span className="text-sm font-black text-slate-900 whitespace-nowrap shrink-0 w-20 text-right">
        {formatCurrency(subtotal)}
      </span>

      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
        aria-label="Eliminar producto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}