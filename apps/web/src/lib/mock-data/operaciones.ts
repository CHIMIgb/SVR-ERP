import type {
  CargaCombustible,
  ArticuloInventario,
  RegistroMantenimiento,
  Cliente,
  Cotizacion,
  Transaccion,
  Documento,
  Incidente,
  Bitacora,
  LecturaHorometro,
  ReporteCampo,
  RegistroCriba,
} from '@svr-erp/shared/types';

export const cargasCombustible: CargaCombustible[] = [
  { 
    id: "F001", 
    maquinaId: "M001", 
    fecha: "2025-04-27", 
    litros: 110, 
    costo: 2530, 
    operador: "Juan Pérez", 
    lugar: "Gasolinera Norte",
    horometroActual: 1245.5,
    horasTrabajadasPeriodo: 8.0,
    consumoEsperadoLtsHora: 14.0,
    rendimientoLtsHora: 13.75,
    alertaOrdena: false,
    desviacionPorcentaje: -1.8
  },
  { 
    id: "F002", 
    maquinaId: "M004", 
    fecha: "2025-04-27", 
    litros: 200, 
    costo: 4600, 
    operador: "Luis Torres", 
    lugar: "Autoconsumo Obra Valle Sur",
    horometroActual: 3421.1,
    horasTrabajadasPeriodo: 8.5,
    consumoEsperadoLtsHora: 12.0,
    rendimientoLtsHora: 23.53,
    alertaOrdena: true,
    desviacionPorcentaje: 96.1
  },
  { 
    id: "F003", 
    maquinaId: "M002", 
    fecha: "2025-04-26", 
    litros: 45, 
    costo: 1035, 
    operador: "Pedro Gómez", 
    lugar: "Gasolinera Centro",
    horometroActual: 890.2,
    horasTrabajadasPeriodo: 4.8,
    consumoEsperadoLtsHora: 9.5,
    rendimientoLtsHora: 9.38,
    alertaOrdena: false,
    desviacionPorcentaje: -1.2
  },
];

export const inventario: ArticuloInventario[] = [
  { id: "I001", nombre: "Filtro de Aceite CAT", categoria: "Refacciones", stock: 12, stockMinimo: 5, unidad: "Pza", precioUnitario: 450, proveedor: "CAT México" },
  { id: "I002", nombre: "Aceite Hidráulico SAE 10W", categoria: "Lubricantes", stock: 45, stockMinimo: 100, unidad: "Galones", precioUnitario: 1200, proveedor: "Lubricantes Especializados" },
  { id: "I003", nombre: "Llanta para Volteo 11R22.5", categoria: "Neumáticos", stock: 4, stockMinimo: 4, unidad: "Pza", precioUnitario: 8500, proveedor: "Michelin" },
];

export const mantenimiento: RegistroMantenimiento[] = [
  { id: "S001", maquinaId: "M001", tipo: "Preventivo", descripcion: "Cambio de aceite y filtros de motor", fecha: "2025-04-10", horasServicio: 1200, costo: 5500, proximoServicioHoras: 1450 },
  { id: "S002", maquinaId: "M002", tipo: "Correctivo", descripcion: "Reparación de manguera hidráulica", fecha: "2025-04-20", horasServicio: 880, costo: 2200, proximoServicioHoras: 1100 },
];

export const clientes: Cliente[] = [
  { id: "C001", nombre: "Ing. Alberto Ruiz", empresa: "Inmobiliaria ARCO", correo: "aruiz@arco.com", telefono: "555-9988", obrasActivas: 1 },
  { id: "C002", nombre: "Lic. Martha Silva", empresa: "Gobierno CDMX", correo: "msilva@gob.mx", telefono: "555-1122", obrasActivas: 1 },
];

export const cotizaciones: Cotizacion[] = [
  { id: "Q001", clienteId: "C001", descripcion: "Renta de Excavadora 320 por 100 horas", monto: 125000, fecha: "2025-04-25", estado: "Aceptada" },
  { id: "Q002", clienteId: "C001", descripcion: "Movimiento de tierras Valle Sur - Fase 2", monto: 450000, fecha: "2025-04-27", estado: "Pendiente" },
];

export const finanzas: Transaccion[] = [
  { id: "TX001", tipo: "Egreso", categoria: "Combustible", monto: 4600, fecha: "2025-04-27", descripcion: "Carga diésel M004" },
  { id: "TX002", tipo: "Ingreso", categoria: "Pago Cliente", monto: 125000, fecha: "2025-04-26", descripcion: "Anticipo Renta Excavadora" },
  { id: "TX003", tipo: "Egreso", categoria: "Nómina", monto: 45000, fecha: "2025-04-25", descripcion: "Pago semana 16 - Operadores" },
];

export const documentos: Documento[] = [
  // ── Personal ──
  { id: "D001", nombre: "Contrato_Laboral_Juan_Perez.pdf",    tipo: "Contrato", categoria: "Personal",      fecha: "2022-03-15", tamano: "1.8 MB", propietario: "Juan Pérez",          trabajadorId: "T001" },
  { id: "D002", nombre: "INE_Juan_Perez.jpg",                 tipo: "ID",       categoria: "Personal",      fecha: "2022-03-15", tamano: "1.2 MB", propietario: "Juan Pérez",          trabajadorId: "T001" },
  { id: "D003", nombre: "Contrato_Laboral_Pedro_Gomez.pdf",   tipo: "Contrato", categoria: "Personal",      fecha: "2021-08-01", tamano: "1.7 MB", propietario: "Pedro Gómez",         trabajadorId: "T002" },
  { id: "D004", nombre: "INE_Ana_Martinez.jpg",               tipo: "ID",       categoria: "Personal",      fecha: "2020-01-10", tamano: "0.9 MB", propietario: "Ana Martínez",        trabajadorId: "T003" },
  { id: "D005", nombre: "Contrato_Laboral_Luis_Torres.pdf",   tipo: "Contrato", categoria: "Personal",      fecha: "2023-06-20", tamano: "1.6 MB", propietario: "Luis Torres",          trabajadorId: "T004" },
  // ── Proyectos ──
  { id: "D006", nombre: "Contrato_Valle_Sur_Fase1.pdf",       tipo: "Contrato", categoria: "Proyectos",     fecha: "2025-01-10", tamano: "2.4 MB", propietario: "Inmobiliaria ARCO" },
  { id: "D007", nombre: "Permiso_Obra_Valle_Sur.pdf",         tipo: "Permiso",  categoria: "Proyectos",     fecha: "2025-01-05", tamano: "0.7 MB", propietario: "Inmobiliaria ARCO" },
  { id: "D008", nombre: "Contrato_Centro_Historico.pdf",      tipo: "Contrato", categoria: "Proyectos",     fecha: "2025-03-01", tamano: "3.1 MB", propietario: "Gobierno CDMX" },
  // ── Maquinaria ──
  { id: "D009", nombre: "Factura_Excavadora_CAT320.pdf",      tipo: "Factura",  categoria: "Maquinaria",    fecha: "2023-05-10", tamano: "1.1 MB", propietario: "SVR Constructora" },
  { id: "D010", nombre: "Poliza_Seguro_Flota_2025.pdf",       tipo: "Póliza",  categoria: "Maquinaria",    fecha: "2025-01-01", tamano: "2.0 MB", propietario: "SVR Constructora" },
  { id: "D011", nombre: "Manual_Liebherr_LTM.pdf",            tipo: "Manual",   categoria: "Maquinaria",    fecha: "2022-11-20", tamano: "14 MB",  propietario: "SVR Constructora" },
  // ── Contabilidad ──
  { id: "D012", nombre: "Factura_Diesel_Abril_2025.pdf",      tipo: "Factura",  categoria: "Contabilidad",  fecha: "2025-04-27", tamano: "0.5 MB", propietario: "SVR Constructora" },
  { id: "D013", nombre: "Estado_Cuenta_Abril_2025.pdf",       tipo: "Factura",  categoria: "Contabilidad",  fecha: "2025-04-30", tamano: "0.8 MB", propietario: "SVR Constructora" },
];

export const incidentes: Incidente[] = [
  { id: "IN001", titulo: "Fuga de aceite hidráulico", descripcion: "Se detectó fuga en manguera principal", prioridad: "Alta", estado: "En Revisión", fecha: "2025-04-27", maquinaId: "M001", obra: "Valle Sur" },
  { id: "IN002", titulo: "Retraso por clima", descripcion: "Lluvia intensa impidió colado de losa", prioridad: "Baja", estado: "Abierto", fecha: "2025-04-26", obra: "Remodelación Centro" },
];

export const operaciones: Bitacora[] = [
  { id: "B001", maquinaId: "M001", actividad: "Excavación para cimentación profunda", horas: 8, fecha: "2025-04-27", obra: "Valle Sur" },
  { id: "B002", maquinaId: "M004", actividad: "Acarreo de escombro a tiro autorizado", horas: 6, fecha: "2025-04-27", obra: "Valle Sur" },
];

export const lecturasHorometro: LecturaHorometro[] = [
  { id: "H001", maquinaId: "M001", fecha: "2025-04-27", lecturaInicial: 1237.5, lecturaFinal: 1245.5, horasTrabajadas: 8 },
  { id: "H002", maquinaId: "M002", fecha: "2025-04-27", lecturaInicial: 885.2, lecturaFinal: 890.2, horasTrabajadas: 5 },
  { id: "H003", maquinaId: "M004", fecha: "2025-04-27", lecturaInicial: 3415.1, lecturaFinal: 3421.1, horasTrabajadas: 6 },
];

export const reportesCampo: ReporteCampo[] = [
  { 
    id: "RC001", 
    tipo: "Mecanico", 
    usuario: "Ricardo M.", 
    maquinaId: "M001", 
    obra: "Valle Sur", 
    fecha: "2025-04-27", 
    hora: "10:30 AM", 
    descripcion: "Se completó reparación de cadena izquierda. Tensor ajustado.",
    estado: "Pendiente"
  },
  { 
    id: "RC002", 
    tipo: "Pipero", 
    usuario: "Marcos G.", 
    maquinaId: "M004", 
    obra: "Valle Sur", 
    fecha: "2025-04-27", 
    hora: "02:15 PM", 
    descripcion: "Suministro de 200L de diésel. Tanque lleno.",
    estado: "Visto",
    detalles: { litros: 200, costo: 4600 }
  },
  { 
    id: "RC003", 
    tipo: "Operador", 
    usuario: "Juan P.", 
    maquinaId: "M001", 
    obra: "Valle Sur", 
    fecha: "2025-04-27", 
    hora: "07:15 AM", 
    descripcion: "Reporte matutino: Aceite OK, Agua OK, Diésel 65%. Listo para trabajar.",
    estado: "Atendido"
  },
  {
    id: "RC004",
    tipo: "Incidente",
    usuario: "Ricardo M.",
    maquinaId: "M001",
    obra: "Valle Sur",
    fecha: "2025-04-27",
    hora: "11:00 AM",
    descripcion: "Se detectó fuga en manguera hidráulica principal. Equipo detenido hasta reparación.",
    estado: "En Revisión",
    prioridad: "Alta"
  },
  {
    id: "RC005",
    tipo: "Incidente",
    usuario: "Ing. López",
    obra: "Remodelación Centro",
    fecha: "2025-04-26",
    hora: "03:00 PM",
    descripcion: "Lluvia intensa impidió colado de losa. Se reprograma para mañana.",
    estado: "Resuelto",
    prioridad: "Baja"
  }
];

export const registrosCriba: RegistroCriba[] = [
  { id: 'CR001', fecha: '2026-08-15', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 45, horasTrabajadas: 8, materialAlBanco: 38, observaciones: 'Operación normal' },
  { id: 'CR002', fecha: '2026-08-15', turno: 'Vespertino', operador: 'Juan Pérez', tipoMaterial: 'Criba gruesa', materialProducido: 30, horasTrabajadas: 7, materialAlBanco: 25, observaciones: '' },
  { id: 'CR003', fecha: '2026-08-14', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 50, horasTrabajadas: 8, materialAlBanco: 50, observaciones: 'Producción completa al banco' },
  { id: 'CR004', fecha: '2026-08-14', turno: 'Vespertino', operador: 'Pedro Gómez', tipoMaterial: 'Arena lavada', materialProducido: 20, horasTrabajadas: 6, materialAlBanco: 15, observaciones: 'Paro por 2h - falla en faja' },
  { id: 'CR005', fecha: '2026-08-13', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 52, horasTrabajadas: 8, materialAlBanco: 52, observaciones: '' },
];
