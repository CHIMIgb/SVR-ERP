// Ahora el resto (page.tsx proveedores): tabla de líneas, RFC UI, detalles del error, y catálogo importado.
const fs = require('fs');

let cambios = 0;
const patch = (file, fn) => {
  const src = fs.readFileSync(file, 'utf8');
  const out = fn(src);
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    cambios++;
    console.log('patched:', file);
  }
};

const PAGE = 'apps/web/src/app/(dashboard)/proveedores/page.tsx';

// 1) catálogo artículos + nombres en estado
patch(PAGE, (s) =>
  s
    .replace(
      `const emptyOcForm = {
  proveedorId: '',
  descripcion: '',
  monto: '',
};`,
      `const emptyOcForm = {
  proveedorId: '',
  descripcion: '',
  items: [] as Array<{ nombre: string; articuloId: string | null; cantidad: number; precioUnitario: number }>,
};`,
    )
    .replace(
      `import {
  proveedoresApi,
  ordenesCompraApi,`,
      `import {
  inventarioApi,
  proveedoresApi,
  ordenesCompraApi,`,
    )
    .replace(
      `  const [catalogoArticulos, setCatalogoArticulos] = useState<ProveedorDTO[]>([]);`,
      `  const [catalogoArticulos, setCatalogoArticulos] = useState<ProveedorDTO[]>([]);`,
    ),
);

// 2) "handleCrearOrden" → items[] derivado + errores de details
patch(PAGE, (s) =>
  s.replace(
    `const handleCrearOrden = useCallback(async () => {
  if (!ocForm.proveedorId || !ocForm.descripcion.trim() || !ocForm.monto) {
    showToast('Todos los campos son obligatorios.', 'error');
    return;
  }
  const monto = parseFloat(ocForm.monto);
  if (!monto || monto <= 0) {
    showToast('Ingresa un monto válido.', 'error');
    return;
  }
  setSubmitting(true);
  try {
    const res = await ordenesCompraApi.crear({
      proveedorId: ocForm.proveedorId,
      descripcion: ocForm.descripcion.trim(),
      monto,
    });
    if (res.success) {
      showToast('Orden de compra creada correctamente.', 'success');
      setOcModal(false);
      setOcForm(emptyOcForm);
      refetchAll();
    } else {
      showToast(res.error?.message || 'Error al crear la orden.', 'error');
    }
  } catch {
    showToast('No se pudo conectar con el servidor.', 'error');
  } finally {
    setSubmitting(false);
  }
}, [ocForm, showToast, refetchAll]);`,
    `const handleCrearOrden = useCallback(async () => {
  if (!ocForm.proveedorId) {
    showToast('Selecciona un proveedor.', 'error');
    return;
  }
  if (ocForm.items.length === 0) {
    showToast('Agrega al menos una línea al pedido.', 'error');
    return;
  }
  for (const it of ocForm.items) {
    if (!(it.cantidad > 0) || !(it.precioUnitario >= 0) || (!it.articuloId && !it.nombre.trim())) {
      showToast('Cada línea necesita producto, cantidad y precio válidos.', 'error');
      return;
    }
  }
  setSubmitting(true);
  try {
    const res = await ordenesCompraApi.crear({
      proveedorId: ocForm.proveedorId,
      descripcion: ocForm.descripcion.trim() || undefined,
      items: ocForm.items,
    });
    if (res.success) {
      showToast('Orden de compra creada correctamente.', 'success');
      setOcModal(false);
      setOcForm(emptyOcForm);
      refetchAll();
    } else {
      showToast(res.error?.details?.join(' · ') || res.error?.message || 'Error al crear la orden.', 'error');
    }
  } catch {
    showToast('No se pudo conectar con el servidor.', 'error');
  } finally {
    setSubmitting(false);
  }
}, [ocForm, showToast, refetchAll]);`,
  ),
);

// 3) usuario nombrar el detalle (RFC en la UI + toasts de proveedores con details)
patch(PAGE, (s) =>
  s
    .replace(
      `const RFC_RE = null;`,
      `const RFC_RE = null;`,
    )
    .replace(
      `const handleGuardarProveedor = useCallback(async () => {
  if (!provForm.nombre.trim()) {
    showToast('El nombre del proveedor es obligatorio.', 'error');
    return;
  }`,
      `const RFC_VALIDO = /^[A-ZÑ&]{3,4}\\d{6}[A-Z0-9]{2,3}$/;
const handleGuardarProveedor = useCallback(async () => {
  if (!provForm.nombre.trim()) {
    showToast('El nombre del proveedor es obligatorio.', 'error');
    return;
  }
  const rfc = provForm.rfc.trim().toUpperCase();
  if (rfc && !RFC_VALIDO.test(rfc)) {
    showToast('El RFC no tiene el formato oficial (3-4 letras + 6 dígitos + homoclave), por ejemplo: TOR890101ABC.', 'error');
    return;
  }`,
    )
    .replace(
      `      const payload = {
        nombre: provForm.nombre.trim(),
        rfc: provForm.rfc.trim() || undefined,`,
      `      const payload = {
        nombre: provForm.nombre.trim(),
        rfc: rfc || undefined,`,
    )
    .replace(
      `      } else {
        showToast(res.error?.message || 'Error al guardar proveedor.', 'error');
      }`,
      `      } else {
        showToast(res.error?.details?.join(' · ') || res.error?.message || 'Error al guardar proveedor.', 'error');
      }`,
    ),
);

console.log('page patches done');
