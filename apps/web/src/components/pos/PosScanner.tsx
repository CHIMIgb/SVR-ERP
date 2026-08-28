'use client';

import { useMemo, useState } from 'react';
import { ScanLine, Plus, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { findProductByBarcode, findProductsByQuery, simulateBarcodeScan } from '@/lib/pos';
import type { Product } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface PosScannerProps {
  products: Product[];
  onScan: (barcode: string) => void;
}

/**
 * Scanner de código de barras simulado (sin cámara): busca por nombre/SKU,
 * sugiere productos y permite simular una lectura para demo.
 */
export function PosScanner({ products, onScan }: PosScannerProps) {
  const [code, setCode] = useState('');

  const suggestions = useMemo(
    () => (code.trim().length >= 2 ? findProductsByQuery(products, code).slice(0, 5) : []),
    [code, products],
  );

  const handleAdd = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      onScan(simulateBarcodeScan());
      return;
    }
    if (suggestions.length === 1) {
      onScan(suggestions[0].barcode);
      return;
    }
    const byCode = findProductByBarcode(products, trimmed);
    if (byCode) {
      onScan(byCode.barcode);
      return;
    }
    if (suggestions.length === 0) {
      onScan(simulateBarcodeScan());
    }
    // Con varias sugerencias el usuario debe elegir (no hace nada).
  };

  const handlePick = (barcode: string) => {
    onScan(barcode);
    setCode('');
  };

  const startScan = () => {
    onScan(simulateBarcodeScan());
    setCode('');
  };

  return (
    <div className={posClasses.card}>
      <div className="flex items-center gap-2 mb-3">
        <Barcode className="w-4 h-4 text-primary" />
        <h3 className={posClasses.sectionTitle}>Scanner / Búsqueda de producto</h3>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Escanea código, escribe SKU o nombre…"
          />
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          Agregar
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 rounded-lg border border-slate-100 divide-y divide-slate-50 overflow-hidden">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handlePick(product.barcode)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-700 truncate">{product.name}</span>
                <span className="block text-[10px] text-slate-400">
                  {product.sku} · {product.barcode}
                </span>
              </span>
              <span className="shrink-0 text-xs font-black text-slate-800">
                {formatCurrency(product.priceMxn)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        icon={<ScanLine className="w-4 h-4" />}
        onClick={startScan}
      >
        Simular lectura
      </Button>
      <p className={posClasses.scannerHint}>
        Escribe al menos 2 caracteres para ver sugerencias, escanea un código o usa la simulación.
      </p>
    </div>
  );
}