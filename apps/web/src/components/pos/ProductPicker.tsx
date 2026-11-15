'use client';

import { useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { useToast } from '@/components/layout/Toast';
import { productUnitPrice } from '@/lib/pos';
import type { Product } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface ProductPickerProps {
  products: Product[];
  /** Devuelve false si supera el stock (la vista ya muestra el toast). */
  onAdd: (product: Product, unit: string, quantity: number) => boolean;
  /** Cantidad de ese material+medida ya en el carrito (para validar al teclear). */
  enCarritoDe: (materialId: string, unit: string) => number;
}

/**
 * Selector de producto + medida (sin scanner): elige material, unidad de
 * venta (m³, tonelada, viaje, pieza...) y cantidad.
 */
export function ProductPicker({ products, onAdd, enCarritoDe }: ProductPickerProps) {
  const { showToast } = useToast();
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
    const ok = onAdd(product, unit, qty);
    if (!ok) setQuantity('');
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
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={quantity}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, '');
            // Validación al teclear: si supera el stock disponible (stock
            // menos lo ya en carrito de esa medida), avisa y borra el input.
            if (product && digitos && Number(digitos) > product.stock - enCarritoDe(product.id, unit)) {
              showToast(`Stock máximo (${product.stock} ${unit}).`, 'error');
              setQuantity('');
              return;
            }
            setQuantity(digitos);
          }}
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