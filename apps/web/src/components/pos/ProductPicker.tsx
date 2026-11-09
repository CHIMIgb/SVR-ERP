'use client';

import { useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { productUnitPrice } from '@/lib/pos';
import type { Product } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface ProductPickerProps {
  products: Product[];
  onAdd: (product: Product, unit: string, quantity: number) => void;
}

/**
 * Selector de producto + medida (sin scanner): elige material, unidad de
 * venta (m³, tonelada, viaje, pieza...) y cantidad.
 */
export function ProductPicker({ products, onAdd }: ProductPickerProps) {
  // Arranca vacío como cualquier formulario — el vendedor elige material y medida.
  const [productId, setProductId] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );
  const units = useMemo(() => product?.units ?? (product ? [product.unit] : []), [product]);
  const pricePerUnit = product ? productUnitPrice(product, unit) : 0;

  const handleProductChange = (id: string) => {
    const next = products.find((p) => p.id === id);
    if (!next) return;
    setProductId(id);
    setUnit(next.units?.[0] ?? next.unit);
  };

  const handleAdd = () => {
    if (!product) return;
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    onAdd(product, unit, qty);
  };

  if (products.length === 0) {
    return (
      <div className={posClasses.card}>
        <p className="text-sm text-ui-400 text-center py-4">No hay productos en el catálogo.</p>
      </div>
    );
  }

  return (
    <div className={posClasses.card}>
      <div className="flex items-center gap-2 mb-3">
        <PackagePlus className="w-4 h-4 text-primary" />
        <h3 className={posClasses.sectionTitle}>Producto a vender</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select
          label="Material"
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          placeholder="Seleccionar material..."
          options={products.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />
        <Select
          label="Medida"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Seleccionar medida..."
          disabled={!product}
          options={units.map((u) => ({
            value: u,
            label: `${u} — ${formatCurrency(productUnitPrice(product!, u))}`,
          }))}
        />
        <Input
          label="Cantidad"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <div className="flex items-end">
          <Button
            variant="primary"
            fullWidth
            disabled={!product || !unit}
            icon={<PackagePlus className="w-4 h-4" />}
            onClick={handleAdd}
          >
            Agregar
          </Button>
        </div>
      </div>
      {product && (
        <p className={posClasses.hint}>
          {formatCurrency(pricePerUnit)} por {unit} · stock {product.stock}
        </p>
      )}
    </div>
  );
}