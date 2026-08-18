export interface Maquina {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'Encendida' | 'Apagada' | 'Mantenimiento' | 'Movimiento';
  combustible: number; // Porcentaje
  horometro: number;
  operador: string;
  lat: number;
  lng: number;
  dieselHoy: number;
  proximoMantenimiento: string;
  imagen?: string;
  // Campos de rendimiento y pre-operacional
  consumoEsperadoLtsHora?: number; // Ej. 14 L/h
  rendimientoActualLtsHora?: number; // Ej. 13.8 L/h
  alertaConsumoAnormal?: boolean;
  horasOperadasHoy?: number;
  checklistHoy?: {
    id: string;
    estado: 'Aprobado' | 'Con Falla' | 'Pendiente';
    hora: string;
    operador: string;
    observaciones?: string;
  };
}

export const maquinaria: Maquina[] = [
  {
    id: "M001",
    nombre: "Excavadora CAT 320",
    tipo: "Excavadora",
    estado: "Encendida",
    combustible: 65,
    horometro: 1245.5,
    operador: "Juan Pérez",
    lat: 19.4326,
    lng: -99.1332,
    dieselHoy: 85,
    proximoMantenimiento: "2026-05-20",
    consumoEsperadoLtsHora: 14.0,
    rendimientoActualLtsHora: 13.5,
    alertaConsumoAnormal: false,
    horasOperadasHoy: 6.3,
    checklistHoy: {
      id: "CHK-001",
      estado: "Aprobado",
      hora: "06:50 AM",
      operador: "Juan Pérez",
      observaciones: "Niveles de aceite e hidráulico en rango óptimo."
    }
  },
  {
    id: "M002",
    nombre: "Retroexcavadora JD 310L",
    tipo: "Retroexcavadora",
    estado: "Mantenimiento",
    combustible: 42,
    horometro: 890.2,
    operador: "Pedro Gómez",
    lat: 19.4284,
    lng: -99.1276,
    dieselHoy: 45,
    proximoMantenimiento: "2026-04-28",
    consumoEsperadoLtsHora: 9.5,
    rendimientoActualLtsHora: 9.2,
    alertaConsumoAnormal: false,
    horasOperadasHoy: 4.8,
    checklistHoy: {
      id: "CHK-002",
      estado: "Con Falla",
      hora: "07:10 AM",
      operador: "Pedro Gómez",
      observaciones: "Goteo leve en manguera de pistón de levante."
    }
  },
  {
    id: "M003",
    nombre: "Grúa Liebherr LTM",
    tipo: "Grúa",
    estado: "Apagada",
    combustible: 88,
    horometro: 456.8,
    operador: "Roberto Díaz",
    lat: 19.4350,
    lng: -99.1412,
    dieselHoy: 0,
    proximoMantenimiento: "2026-06-15",
    consumoEsperadoLtsHora: 16.0,
    rendimientoActualLtsHora: 15.8,
    alertaConsumoAnormal: false,
    horasOperadasHoy: 0,
    checklistHoy: {
      id: "CHK-003",
      estado: "Pendiente",
      hora: "—",
      operador: "Roberto Díaz",
      observaciones: "Sin inspección matutina registrada."
    }
  },
  {
    id: "M004",
    nombre: "Camión Volteo Kenworth",
    tipo: "Transporte",
    estado: "Movimiento",
    combustible: 15,
    horometro: 3421.1,
    operador: "Luis Torres",
    lat: 19.4190,
    lng: -99.1300,
    dieselHoy: 200,
    proximoMantenimiento: "2026-05-05",
    consumoEsperadoLtsHora: 12.0,
    rendimientoActualLtsHora: 23.5, // Anormal!
    alertaConsumoAnormal: true, // ALERTA DE ORDEÑA O FUGA
    horasOperadasHoy: 8.5,
    checklistHoy: {
      id: "CHK-004",
      estado: "Aprobado",
      hora: "06:45 AM",
      operador: "Luis Torres",
      observaciones: "Inspección pre-operacional en orden."
    }
  }
];

export type CategoriaPuesto = 'Operador' | 'Chofer' | 'Mecanico' | 'Ingeniero' | 'Administrativo';

export interface Permiso {
  id: string;
  tipo: 'Vacaciones' | 'Permiso' | 'Incapacidad';
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  motivo: string;
  diasSolicitados: number;
}

export interface Trabajador {
  id: string;
  nombre: string;
  puesto: string;
  categoriaPuesto: CategoriaPuesto;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  entrada: string;
  telefono: string;
  proyectos: string[];
  avatar: string;
  sueldoFiscal: number;    // Lo que se paga por tarjeta (IMSS)
  sueldoEfectivo: number;  // El "complemento" en efectivo
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  // Campos operativos y de renta
  maquinaAsignadaId?: string;
  maquinaAsignadaNombre?: string;
  estadoRenta?: 'Rentado a Cliente' | 'En Obra Propia' | 'Disponible en Patio';
  clienteRentaActual?: string;
  licenciaODC3?: {
    tipo: string; // Ej: "DC-3 Maquinaria Pesada CAT", "Licencia Federal Tipo E"
    vigencia: string;
    folio: string;
  };
  fechaContratacion?: string;
  contactoEmergencia?: { nombre: string; telefono: string; parentesco: string };
  vacacionesDias?: number;
  permisos?: Permiso[];
  horasExtraSemana?: number;
  tarifaHoraExtra?: number;
  descuentosSemana?: number;
  conceptoDescuento?: string;
}

export interface BitacoraRentaDiaria {
  id: string;
  folio: string; // Ej: "BIT-2025-084"
  trabajadorId: string;
  trabajadorNombre: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  cliente: string; // ¿Para quién trabajó?
  obraUbicacion: string; // ¿Dónde trabajó?
  horaInicio: string;
  horaFin: string;
  horasEfectivas: number;
  horasExtras: number;
  horometroInicial: number;
  horometroFinal: number;
  actividadRealizada: string; // Notas diarias del operador
  firmaCliente: {
    firmado: boolean;
    nombreResidente?: string;
    cargoResidente?: string;
    fechaFirma?: string;
  };
  estadoCobro: 'Listo para Facturar' | 'Facturado' | 'Pendiente Firma';
  tarifaHoraRenta: number;
  importeTotalRenta: number;
}

export const bitacorasRentaData: BitacoraRentaDiaria[] = [
  {
    id: "B001",
    folio: "BIT-2025-042",
    trabajadorId: "T001",
    trabajadorNombre: "Juan Pérez",
    maquinaId: "M001",
    maquinaNombre: "Excavadora CAT 320",
    fecha: "2025-04-27",
    cliente: "Inmobiliaria ARCO",
    obraUbicacion: "Fraccionamiento Valle Sur (Manzana 4)",
    horaInicio: "07:00 AM",
    horaFin: "05:30 PM",
    horasEfectivas: 8.0,
    horasExtras: 2.5,
    horometroInicial: 1238.5,
    horometroFinal: 1249.0,
    actividadRealizada: "Excavación de zanja pluvial 80m lineales, afine de talud y carga de material sobrante a camiones de volteo.",
    firmaCliente: {
      firmado: true,
      nombreResidente: "Ing. Roberto Garza",
      cargoResidente: "Residente de Obra · Inmobiliaria ARCO",
      fechaFirma: "2025-04-27 05:45 PM"
    },
    estadoCobro: "Listo para Facturar",
    tarifaHoraRenta: 1450,
    importeTotalRenta: 15225 // 10.5 hrs * $1,450
  },
  {
    id: "B002",
    folio: "BIT-2025-041",
    trabajadorId: "T002",
    trabajadorNombre: "Pedro Gómez",
    maquinaId: "M002",
    maquinaNombre: "Retroexcavadora JD 310L",
    fecha: "2025-04-27",
    cliente: "Gobierno CDMX - Obras Públicas",
    obraUbicacion: "Remodelación Centro Histórico (Calle 5 de Mayo)",
    horaInicio: "07:00 AM",
    horaFin: "03:00 PM",
    horasEfectivas: 8.0,
    horasExtras: 0,
    horometroInicial: 885.0,
    horometroFinal: 893.0,
    actividadRealizada: "Demolición de banquetas dañadas, retiro de escombro y apertura de cajas para tubería de gas natural.",
    firmaCliente: {
      firmado: true,
      nombreResidente: "Arq. Manuel Morales",
      cargoResidente: "Supervisor Obras CDMX",
      fechaFirma: "2025-04-27 03:15 PM"
    },
    estadoCobro: "Facturado",
    tarifaHoraRenta: 950,
    importeTotalRenta: 7600
  },
  {
    id: "B003",
    folio: "BIT-2025-040",
    trabajadorId: "T004",
    trabajadorNombre: "Luis Torres",
    maquinaId: "M004",
    maquinaNombre: "Camión Volteo Kenworth 14m³",
    fecha: "2025-04-26",
    cliente: "Constructora ABC / SCT",
    obraUbicacion: "Tramo Carretero Atizapán Km 14+200",
    horaInicio: "06:30 AM",
    horaFin: "06:00 PM",
    horasEfectivas: 8.0,
    horasExtras: 3.5,
    horometroInicial: 3410.0,
    horometroFinal: 3421.5,
    actividadRealizada: "12 viajes de acarreo de base hidráulica y tepetate desde banco de tiro a terraplén principal.",
    firmaCliente: {
      firmado: false,
    nombreResidente: "Ing. Fernando Silva",
      cargoResidente: "Jefe de Frente SCT",
    },
    estadoCobro: "Pendiente Firma",
    tarifaHoraRenta: 850,
    importeTotalRenta: 9775
  }
];

export const trabajadores: Trabajador[] = [
  {
    id: "T001",
    nombre: "Juan Pérez",
    puesto: "Operador de Excavadora",
    categoriaPuesto: "Operador",
    estado: "Activo",
    entrada: "07:00 AM",
    telefono: "55 1234 5678",
    proyectos: ["Fraccionamiento Valle Sur"],
    avatar: "JP",
    sueldoFiscal: 2500,
    sueldoEfectivo: 3500,
    metodoPago: "Mixto",
    maquinaAsignadaId: "M001",
    maquinaAsignadaNombre: "Excavadora CAT 320",
    estadoRenta: "Rentado a Cliente",
    clienteRentaActual: "Inmobiliaria ARCO",
    licenciaODC3: {
      tipo: "Certificación DC-3 Excavadora Hidráulica",
      vigencia: "2026-11-30",
      folio: "DC3-CAT-8921"
    },
    fechaContratacion: "2023-03-15",
    contactoEmergencia: { nombre: "María Gómez", telefono: "55 9876 5432", parentesco: "Esposa" },
    vacacionesDias: 8,
    horasExtraSemana: 6.5,
    tarifaHoraExtra: 80,
    descuentosSemana: 0,
    conceptoDescuento: ''
  },
  {
    id: "T002",
    nombre: "Pedro Gómez",
    puesto: "Operador de Retroexcavadora",
    categoriaPuesto: "Operador",
    estado: "Activo",
    entrada: "07:00 AM",
    telefono: "55 8765 4321",
    proyectos: ["Remodelación Centro Histórico"],
    avatar: "PG",
    sueldoFiscal: 2200,
    sueldoEfectivo: 3200,
    metodoPago: "Mixto",
    maquinaAsignadaId: "M002",
    maquinaAsignadaNombre: "Retroexcavadora JD 310L",
    estadoRenta: "Rentado a Cliente",
    clienteRentaActual: "Gobierno CDMX",
    licenciaODC3: {
      tipo: "Certificación DC-3 Retroexcavadora",
      vigencia: "2026-08-15",
      folio: "DC3-JD-4412"
    },
    fechaContratacion: "2023-07-01",
    contactoEmergencia: { nombre: "Rosa Pérez", telefono: "55 1122 3344", parentesco: "Madre" },
    vacacionesDias: 6,
    horasExtraSemana: 4.5,
    tarifaHoraExtra: 75,
    descuentosSemana: 0,
    conceptoDescuento: ''
  },
  {
    id: "T003",
    nombre: "Ana Martínez",
    puesto: "Administradora de Obra",
    categoriaPuesto: "Administrativo",
    estado: "Activo",
    entrada: "08:30 AM",
    telefono: "55 2345 6789",
    proyectos: ["Oficina Central SVR"],
    avatar: "AM",
    sueldoFiscal: 5000,
    sueldoEfectivo: 2000,
    metodoPago: "Mixto",
    estadoRenta: "En Obra Propia",
    fechaContratacion: "2022-01-10",
    contactoEmergencia: { nombre: "Carlos Martínez", telefono: "55 5566 7788", parentesco: "Hermano" },
    vacacionesDias: 12,
    horasExtraSemana: 0,
    tarifaHoraExtra: 0,
    descuentosSemana: 0,
    conceptoDescuento: ''
  },
  {
    id: "T004",
    nombre: "Luis Torres",
    puesto: "Chofer de Camión Volteo",
    categoriaPuesto: "Chofer",
    estado: "Activo",
    entrada: "06:30 AM",
    telefono: "55 3456 7890",
    proyectos: ["Puente Atizapán"],
    avatar: "LT",
    sueldoFiscal: 2000,
    sueldoEfectivo: 2800,
    metodoPago: "Mixto",
    maquinaAsignadaId: "M004",
    maquinaAsignadaNombre: "Camión Volteo Kenworth 14m³",
    estadoRenta: "Rentado a Cliente",
    clienteRentaActual: "Constructora ABC / SCT",
    licenciaODC3: {
      tipo: "Licencia Federal de Chofer Tipo E",
      vigencia: "2027-02-28",
      folio: "SCT-FED-99882"
    },
    fechaContratacion: "2023-11-20",
    contactoEmergencia: { nombre: "Lucía Torres", telefono: "55 9988 7766", parentesco: "Esposa" },
    vacacionesDias: 6,
    horasExtraSemana: 0,
    tarifaHoraExtra: 65,
    descuentosSemana: 0,
    conceptoDescuento: ''
  },
  {
    id: "T005",
    nombre: "Carlos Ruiz",
    puesto: "Mecánico Diésel Especialista",
    categoriaPuesto: "Mecanico",
    estado: "Activo",
    entrada: "07:30 AM",
    telefono: "55 4567 8901",
    proyectos: ["Taller Central SVR"],
    avatar: "CR",
    sueldoFiscal: 3000,
    sueldoEfectivo: 4000,
    metodoPago: "Mixto",
    estadoRenta: "En Obra Propia",
    licenciaODC3: {
      tipo: "Certificado Diagnóstico Hidráulico CAT/JD",
      vigencia: "2027-10-15",
      folio: "MEC-CAT-3321"
    },
    fechaContratacion: "2021-05-18",
    contactoEmergencia: { nombre: "Laura Soto", telefono: "55 4433 2211", parentesco: "Esposa" },
    vacacionesDias: 14,
    horasExtraSemana: 2.0,
    tarifaHoraExtra: 90,
    descuentosSemana: 0,
    conceptoDescuento: ''
  },
  {
    id: "T006",
    nombre: "Ing. Jorge Valenzuela",
    puesto: "Ingeniero Residente de Obra",
    categoriaPuesto: "Ingeniero",
    estado: "Activo",
    entrada: "07:00 AM",
    telefono: "55 5678 9012",
    proyectos: ["Fraccionamiento Valle Sur", "Puente Atizapán"],
    avatar: "JV",
    sueldoFiscal: 6500,
    sueldoEfectivo: 4500,
    metodoPago: "Mixto",
    estadoRenta: "En Obra Propia",
    licenciaODC3: {
      tipo: "Cédula Profesional Ing. Civil",
      vigencia: "Permanente",
      folio: "CED-CIV-8849102"
    },
    fechaContratacion: "2020-02-01",
    contactoEmergencia: { nombre: "Patricia Valenzuela", telefono: "55 7788 9900", parentesco: "Hermana" },
    vacacionesDias: 15,
    horasExtraSemana: 0,
    tarifaHoraExtra: 0,
    descuentosSemana: 0,
    conceptoDescuento: ''
  }
];

export interface HitoProgreso {
  fecha: string;
  planificado: number; // Porcentaje 0-100
  real: number;        // Porcentaje 0-100
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  presupuesto: number;
  gastado: number;
  progreso: number; // Porcentaje
  estado: 'En Proceso' | 'Finalizado' | 'Pausado';
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  historicoProgreso?: HitoProgreso[];
  // Desglose de Rentabilidad Real
  ingresoCobrado: number;
  gastoNomina: number;
  gastoCombustible: number;
  gastoMantenimiento: number;
  gastoMateriales: number;
  utilidadReal: number;
  margenUtilidadPorcentaje: number;
}

export const proyectos: Proyecto[] = [
  {
    id: "P001",
    nombre: "Fraccionamiento Valle Sur",
    cliente: "Inmobiliaria ARCO",
    presupuesto: 1200000,
    gastado: 950000,
    progreso: 85,
    estado: "En Proceso",
    ubicacion: "Querétaro, Qro.",
    fechaInicio: "2025-01-10",
    fechaFin: "2025-05-30",
    ingresoCobrado: 1020000,
    gastoNomina: 380000,
    gastoCombustible: 245000,
    gastoMantenimiento: 110000,
    gastoMateriales: 215000,
    utilidadReal: 70000,
    margenUtilidadPorcentaje: 6.8,
    historicoProgreso: [
      { fecha: "Ene", planificado: 10, real: 8 },
      { fecha: "Feb", planificado: 30, real: 25 },
      { fecha: "Mar", planificado: 50, real: 48 },
      { fecha: "Abr", planificado: 75, real: 72 },
      { fecha: "May", planificado: 90, real: 85 }
    ]
  },
  {
    id: "P002",
    nombre: "Remodelación Centro Histórico",
    cliente: "Gobierno CDMX",
    presupuesto: 4500000,
    gastado: 1200000,
    progreso: 32,
    estado: "En Proceso",
    ubicacion: "Centro, CDMX",
    fechaInicio: "2025-03-01",
    fechaFin: "2025-12-15",
    ingresoCobrado: 1800000,
    gastoNomina: 520000,
    gastoCombustible: 310000,
    gastoMantenimiento: 90000,
    gastoMateriales: 280000,
    utilidadReal: 600000,
    margenUtilidadPorcentaje: 33.3,
    historicoProgreso: [
      { fecha: "Mar", planificado: 15, real: 10 },
      { fecha: "Abr", planificado: 30, real: 28 },
      { fecha: "May", planificado: 45, real: 32 }
    ]
  },
  {
    id: "P003",
    nombre: "Puente Atizapán",
    cliente: "SCT",
    presupuesto: 8900000,
    gastado: 8900000,
    progreso: 100,
    estado: "Finalizado",
    ubicacion: "Atizapán, EdoMex",
    fechaInicio: "2024-06-15",
    fechaFin: "2025-04-20",
    ingresoCobrado: 8900000,
    gastoNomina: 3400000,
    gastoCombustible: 1850000,
    gastoMantenimiento: 780000,
    gastoMateriales: 1920000,
    utilidadReal: 950000,
    margenUtilidadPorcentaje: 10.7,
    historicoProgreso: [
      { fecha: "Nov", planificado: 20, real: 20 },
      { fecha: "Dic", planificado: 45, real: 40 },
      { fecha: "Ene", planificado: 70, real: 72 },
      { fecha: "Feb", planificado: 90, real: 88 },
      { fecha: "Mar", planificado: 100, real: 100 }
    ]
  }
];

export interface CargaCombustible {
  id: string;
  maquinaId: string;
  fecha: string;
  litros: number;
  costo: number;
  operador: string;
  lugar: string;
  // Métricas de rendimiento
  horometroActual: number;
  horasTrabajadasPeriodo: number;
  consumoEsperadoLtsHora: number;
  rendimientoLtsHora: number;
  alertaOrdena: boolean; // Alerta de sobreconsumo o posible ordeña
  desviacionPorcentaje: number;
}

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
    rendimientoLtsHora: 23.53, // 23.5 L/hr vs 12 L/hr esperado (+96%!)
    alertaOrdena: true, // ALERTA DE ORDEÑA/ROBO DE DIÉSEL
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

export interface ChecklistPreoperacional {
  id: string;
  maquinaId: string;
  fecha: string;
  hora: string;
  operador: string;
  horometroInicial: number;
  nivelAceiteMotor: 'Correcto' | 'Bajo' | 'Exceso';
  nivelHidraulico: 'Correcto' | 'Bajo';
  fugasVisibles: boolean;
  estadoLlantasOrugas: 'Correcto' | 'Desgaste Severo' | 'Daño';
  lucesYAlarmas: 'Correcto' | 'Falla';
  sistemaFrenos: 'Correcto' | 'Falla';
  estado: 'Aprobado' | 'Con Falla';
  observaciones: string;
}

export const checklistsPreoperacionales: ChecklistPreoperacional[] = [
  {
    id: "CHK-001",
    maquinaId: "M001",
    fecha: "2025-04-27",
    hora: "06:50 AM",
    operador: "Juan Pérez",
    horometroInicial: 1239.2,
    nivelAceiteMotor: "Correcto",
    nivelHidraulico: "Correcto",
    fugasVisibles: false,
    estadoLlantasOrugas: "Correcto",
    lucesYAlarmas: "Correcto",
    sistemaFrenos: "Correcto",
    estado: "Aprobado",
    observaciones: "Equipo en óptimas condiciones para inicio de jornada."
  },
  {
    id: "CHK-002",
    maquinaId: "M002",
    fecha: "2025-04-27",
    hora: "07:10 AM",
    operador: "Pedro Gómez",
    horometroInicial: 885.4,
    nivelAceiteMotor: "Correcto",
    nivelHidraulico: "Bajo",
    fugasVisibles: true,
    estadoLlantasOrugas: "Correcto",
    lucesYAlarmas: "Correcto",
    sistemaFrenos: "Correcto",
    estado: "Con Falla",
    observaciones: "Goteo visible en manguera de cilindro de elevación. Requiere reapriete de niple."
  },
  {
    id: "CHK-004",
    maquinaId: "M004",
    fecha: "2025-04-27",
    hora: "06:45 AM",
    operador: "Luis Torres",
    horometroInicial: 3412.6,
    nivelAceiteMotor: "Correcto",
    nivelHidraulico: "Correcto",
    fugasVisibles: false,
    estadoLlantasOrugas: "Correcto",
    lucesYAlarmas: "Correcto",
    sistemaFrenos: "Correcto",
    estado: "Aprobado",
    observaciones: "Inspección pre-operacional conforme."
  }
];

export interface HorasExtraDetalle {
  inicio: string; // Ej: "05:00 PM"
  fin?: string;   // Ej: "08:30 PM"
  horasCalculadas: number; // Ej: 3.5
  tarifaPorHora: number; // Ej: 80
  montoTotal: number; // Ej: 280
  estado: 'En Curso' | 'Aprobado' | 'Pendiente' | 'Rechazado';
  motivo?: string; // Ej: "Colado continuo de losa en Valle Sur"
  coordenadasInicio?: { lat: number; lng: number };
  coordenadasFin?: { lat: number; lng: number };
}

export interface RegistroAsistencia {
  id: string;
  trabajadorId: string;
  fecha: string;
  horaEntrada?: string; // Ej: "07:05 AM"
  horaSalida?: string;  // Ej: "04:30 PM"
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'No Presentado' | 'Salida Anticipada';
  ubicacion: string;
  coordenadas: { lat: number; lng: number };
  salidaCoordenadas?: { lat: number; lng: number };
  salidaUbicacion?: string;
  obraAsignada: string;
  obraCoordenadas: { lat: number; lng: number };
  distanciaMetros: number; // Distancia calculada a la obra (en metros)
  radioPermitidoMetros: number; // Radio de tolerancia de geocerca (2,000m = 2km para obras grandes)
  enSitio: boolean; // true si distanciaMetros <= radioPermitidoMetros
  precisionGpsMetros: number; // Precisión reportada por el teléfono
  dispositivo: string; // Modelo de teléfono reportado
  horaMarcajeExacta?: string; // Hora con segundos
  horaSalidaExacta?: string; // Hora salida con segundos
  horasTrabajadasOrdinarias?: number; // Ej: 8.5 hrs
  salidaAnticipada?: boolean; // true si se retiró antes de cumplir el turno
  motivoSalidaAnticipada?: string; // Ej: "Permiso médico IMSS por malestar estomacal"
  horasExtra?: HorasExtraDetalle;
  bateria?: number; // % de batería del celular
  notas?: string;
}

export interface DiaAsistenciaSemana {
  dia: 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie' | 'Sab';
  fecha: string;
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'Salida Anticipada' | 'Descanso';
  horaEntrada?: string;
  horaSalida?: string;
  horasTrabajadas: number;
  horasExtra?: number;
  enSitioGps: boolean;
  motivo?: string;
}

export interface AsistenciaSemanalTrabajador {
  trabajadorId: string;
  semana: string;
  dias: DiaAsistenciaSemana[];
  totalDiasAsistidos: number;
  totalFaltas: number;
  totalRetardos: number;
  totalHorasOrdinarias: number;
  totalHorasExtra: number;
}

export const registrosAsistencia: RegistroAsistencia[] = [
  { 
    id: "A001", 
    trabajadorId: "T001", 
    fecha: "2025-04-27", 
    horaEntrada: "07:05 AM", 
    horaMarcajeExacta: "07:04:48 AM",
    horaSalida: "05:00 PM",
    horaSalidaExacta: "05:00:15 PM",
    horasTrabajadasOrdinarias: 8.0,
    estado: "Puntual", 
    ubicacion: "Fracc. Valle Sur (Frente a Manzana 4)", 
    coordenadas: { lat: 19.3423, lng: -99.1841 },
    salidaCoordenadas: { lat: 19.3425, lng: -99.1840 },
    salidaUbicacion: "Fracc. Valle Sur (Caseta de Salida)",
    obraAsignada: "Fraccionamiento Valle Sur",
    obraCoordenadas: { lat: 19.3421, lng: -99.1843 },
    distanciaMetros: 28,
    radioPermitidoMetros: 2000, // 2km a la redonda
    enSitio: true,
    precisionGpsMetros: 6,
    dispositivo: "Samsung Galaxy A54 · GPS Activo",
    bateria: 92,
    horasExtra: {
      inicio: "05:00 PM",
      fin: "08:30 PM",
      horasCalculadas: 3.5,
      tarifaPorHora: 80,
      montoTotal: 280,
      estado: "Aprobado",
      motivo: "Colado continuo de cimentación y losa",
      coordenadasInicio: { lat: 19.3423, lng: -99.1841 },
      coordenadasFin: { lat: 19.3426, lng: -99.1842 }
    },
    notas: "Marcaje verificado dentro del polígono de obra (radio 2km)."
  },
  { 
    id: "A002", 
    trabajadorId: "T002", 
    fecha: "2025-04-27", 
    horaEntrada: "06:58 AM", 
    horaMarcajeExacta: "06:58:12 AM",
    horaSalida: "04:30 PM",
    horaSalidaExacta: "04:30:20 PM",
    horasTrabajadasOrdinarias: 8.5,
    estado: "Puntual", 
    ubicacion: "Centro Histórico (Acceso Calle Madero)", 
    coordenadas: { lat: 19.4328, lng: -99.1330 },
    salidaCoordenadas: { lat: 19.4327, lng: -99.1331 },
    salidaUbicacion: "Centro Histórico (Salida Madero)",
    obraAsignada: "Remodelación Centro Histórico",
    obraCoordenadas: { lat: 19.4326, lng: -99.1332 },
    distanciaMetros: 35,
    radioPermitidoMetros: 2000,
    enSitio: true,
    precisionGpsMetros: 8,
    dispositivo: "Xiaomi Redmi Note 12 · GPS Activo",
    bateria: 87,
    horasExtra: {
      inicio: "04:30 PM",
      fin: "07:00 PM",
      horasCalculadas: 2.5,
      tarifaPorHora: 75,
      montoTotal: 187.5,
      estado: "Aprobado",
      motivo: "Nivelación nocturna de terreno para pavimentación",
      coordenadasInicio: { lat: 19.4328, lng: -99.1330 }
    },
    notas: "Marcaje verificado en punto de control de acceso."
  },
  { 
    id: "A003", 
    trabajadorId: "T004", 
    fecha: "2025-04-27", 
    horaEntrada: "08:15 AM", 
    horaMarcajeExacta: "08:15:33 AM",
    horasTrabajadasOrdinarias: 7.0,
    estado: "Retardo", 
    ubicacion: "Av. Insurgentes Sur #1420 (Fuera de radio 2km)", 
    coordenadas: { lat: 19.3780, lng: -99.1720 },
    obraAsignada: "Fraccionamiento Valle Sur",
    obraCoordenadas: { lat: 19.3421, lng: -99.1843 },
    distanciaMetros: 4210, // A 4.21 km (> 2,000m)
    radioPermitidoMetros: 2000,
    enSitio: false, // Fuera porque > 2km
    precisionGpsMetros: 14,
    dispositivo: "Motorola Moto G84 · GPS Activo",
    bateria: 48,
    notas: "ALERTA DE GEOCERCA: El marcaje se realizó a 4.2 km de distancia, superando el radio de 2 km de la obra."
  },
  { 
    id: "A004", 
    trabajadorId: "T003", 
    fecha: "2025-04-27", 
    horaEntrada: "08:30 AM", 
    horaMarcajeExacta: "08:29:50 AM",
    horaSalida: "02:15 PM",
    horaSalidaExacta: "02:15:40 PM",
    horasTrabajadasOrdinarias: 5.75,
    salidaAnticipada: true,
    motivoSalidaAnticipada: "Cita médica programada en clínica IMSS.",
    estado: "Salida Anticipada", 
    ubicacion: "Oficina Central SVR (Recepción)", 
    coordenadas: { lat: 19.4106, lng: -99.1677 },
    obraAsignada: "Oficina Central SVR",
    obraCoordenadas: { lat: 19.4105, lng: -99.1678 },
    distanciaMetros: 15,
    radioPermitidoMetros: 500,
    enSitio: true,
    precisionGpsMetros: 4,
    dispositivo: "iPhone 13 · iOS 17.4",
    bateria: 95,
    notas: "ALERTA: Retiro anticipado registrado con motivo médico."
  },
];

export const asistenciaSemanalData: AsistenciaSemanalTrabajador[] = [
  {
    trabajadorId: "T001",
    semana: "Semana 17 (21 Abr - 26 Abr 2025)",
    totalDiasAsistidos: 6,
    totalFaltas: 0,
    totalRetardos: 1,
    totalHorasOrdinarias: 48,
    totalHorasExtra: 6.5,
    dias: [
      { dia: 'Lun', fecha: '21 Abr', estado: 'Puntual', horaEntrada: '06:55 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 2.0, enSitioGps: true },
      { dia: 'Mar', fecha: '22 Abr', estado: 'Puntual', horaEntrada: '07:00 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mie', fecha: '23 Abr', estado: 'Retardo', horaEntrada: '07:22 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 1.0, enSitioGps: true },
      { dia: 'Jue', fecha: '24 Abr', estado: 'Puntual', horaEntrada: '06:58 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Vie', fecha: '25 Abr', estado: 'Puntual', horaEntrada: '07:02 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 3.5, enSitioGps: true },
      { dia: 'Sab', fecha: '26 Abr', estado: 'Puntual', horaEntrada: '07:00 AM', horaSalida: '03:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true }
    ]
  },
  {
    trabajadorId: "T002",
    semana: "Semana 17 (21 Abr - 26 Abr 2025)",
    totalDiasAsistidos: 6,
    totalFaltas: 0,
    totalRetardos: 0,
    totalHorasOrdinarias: 48,
    totalHorasExtra: 4.5,
    dias: [
      { dia: 'Lun', fecha: '21 Abr', estado: 'Puntual', horaEntrada: '06:50 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 2.0, enSitioGps: true },
      { dia: 'Mar', fecha: '22 Abr', estado: 'Puntual', horaEntrada: '06:55 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mie', fecha: '23 Abr', estado: 'Puntual', horaEntrada: '06:58 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Jue', fecha: '24 Abr', estado: 'Puntual', horaEntrada: '06:52 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 2.5, enSitioGps: true },
      { dia: 'Vie', fecha: '25 Abr', estado: 'Puntual', horaEntrada: '06:58 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Sab', fecha: '26 Abr', estado: 'Puntual', horaEntrada: '07:00 AM', horaSalida: '03:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true }
    ]
  },
  {
    trabajadorId: "T004",
    semana: "Semana 17 (21 Abr - 26 Abr 2025)",
    totalDiasAsistidos: 5,
    totalFaltas: 1,
    totalRetardos: 2,
    totalHorasOrdinarias: 40,
    totalHorasExtra: 0,
    dias: [
      { dia: 'Lun', fecha: '21 Abr', estado: 'Retardo', horaEntrada: '07:45 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mar', fecha: '22 Abr', estado: 'Puntual', horaEntrada: '07:05 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mie', fecha: '23 Abr', estado: 'Falta', horasTrabajadas: 0, horasExtra: 0, enSitioGps: false, motivo: 'Inasistencia no justificada' },
      { dia: 'Jue', fecha: '24 Abr', estado: 'Puntual', horaEntrada: '07:00 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Vie', fecha: '25 Abr', estado: 'Retardo', horaEntrada: '08:15 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: false, motivo: 'Marcaje fuera de geocerca' },
      { dia: 'Sab', fecha: '26 Abr', estado: 'Puntual', horaEntrada: '07:00 AM', horaSalida: '03:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true }
    ]
  },
  {
    trabajadorId: "T003",
    semana: "Semana 17 (21 Abr - 26 Abr 2025)",
    totalDiasAsistidos: 6,
    totalFaltas: 0,
    totalRetardos: 0,
    totalHorasOrdinarias: 45.75,
    totalHorasExtra: 0,
    dias: [
      { dia: 'Lun', fecha: '21 Abr', estado: 'Puntual', horaEntrada: '08:30 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mar', fecha: '22 Abr', estado: 'Puntual', horaEntrada: '08:28 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Mie', fecha: '23 Abr', estado: 'Puntual', horaEntrada: '08:30 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Jue', fecha: '24 Abr', estado: 'Puntual', horaEntrada: '08:25 AM', horaSalida: '05:00 PM', horasTrabajadas: 8, horasExtra: 0, enSitioGps: true },
      { dia: 'Vie', fecha: '25 Abr', estado: 'Salida Anticipada', horaEntrada: '08:30 AM', horaSalida: '02:15 PM', horasTrabajadas: 5.75, horasExtra: 0, enSitioGps: true, motivo: 'Cita médica IMSS' },
      { dia: 'Sab', fecha: '26 Abr', estado: 'Puntual', horaEntrada: '08:30 AM', horaSalida: '02:30 PM', horasTrabajadas: 6, horasExtra: 0, enSitioGps: true }
    ]
  }
];

export interface ArticuloInventario {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
  precioUnitario: number;
  proveedor: string;
}

export const inventario: ArticuloInventario[] = [
  { id: "I001", nombre: "Filtro de Aceite CAT", categoria: "Refacciones", stock: 12, stockMinimo: 5, unidad: "Pza", precioUnitario: 450, proveedor: "CAT México" },
  { id: "I002", nombre: "Aceite Hidráulico SAE 10W", categoria: "Lubricantes", stock: 45, stockMinimo: 100, unidad: "Galones", precioUnitario: 1200, proveedor: "Lubricantes Especializados" },
  { id: "I003", nombre: "Llanta para Volteo 11R22.5", categoria: "Neumáticos", stock: 4, stockMinimo: 4, unidad: "Pza", precioUnitario: 8500, proveedor: "Michelin" },
];

export interface RegistroMantenimiento {
  id: string;
  maquinaId: string;
  tipo: 'Correctivo' | 'Preventivo';
  descripcion: string;
  fecha: string;
  horasServicio: number;
  costo: number;
  proximoServicioHoras: number;
}

export const mantenimiento: RegistroMantenimiento[] = [
  { id: "S001", maquinaId: "M001", tipo: "Preventivo", descripcion: "Cambio de aceite y filtros de motor", fecha: "2025-04-10", horasServicio: 1200, costo: 5500, proximoServicioHoras: 1450 },
  { id: "S002", maquinaId: "M002", tipo: "Correctivo", descripcion: "Reparación de manguera hidráulica", fecha: "2025-04-20", horasServicio: 880, costo: 2200, proximoServicioHoras: 1100 },
];

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  obrasActivas: number;
}

export const clientes: Cliente[] = [
  { id: "C001", nombre: "Ing. Alberto Ruiz", empresa: "Inmobiliaria ARCO", correo: "aruiz@arco.com", telefono: "555-9988", obrasActivas: 1 },
  { id: "C002", nombre: "Lic. Martha Silva", empresa: "Gobierno CDMX", correo: "msilva@gob.mx", telefono: "555-1122", obrasActivas: 1 },
];

export interface Cotizacion {
  id: string;
  clienteId: string;
  descripcion: string;
  monto: number;
  fecha: string;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
}

export const cotizaciones: Cotizacion[] = [
  { id: "Q001", clienteId: "C001", descripcion: "Renta de Excavadora 320 por 100 horas", monto: 125000, fecha: "2025-04-25", estado: "Aceptada" },
  { id: "Q002", clienteId: "C001", descripcion: "Movimiento de tierras Valle Sur - Fase 2", monto: 450000, fecha: "2025-04-27", estado: "Pendiente" },
];

export interface Transaccion {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  monto: number;
  fecha: string;
  descripcion: string;
}

export const finanzas: Transaccion[] = [
  { id: "TX001", tipo: "Egreso", categoria: "Combustible", monto: 4600, fecha: "2025-04-27", descripcion: "Carga diésel M004" },
  { id: "TX002", tipo: "Ingreso", categoria: "Pago Cliente", monto: 125000, fecha: "2025-04-26", descripcion: "Anticipo Renta Excavadora" },
  { id: "TX003", tipo: "Egreso", categoria: "Nómina", monto: 45000, fecha: "2025-04-25", descripcion: "Pago semana 16 - Operadores" },
];

export interface Documento {
  id: string;
  nombre: string;
  tipo: 'Contrato' | 'ID' | 'Factura' | 'Manual' | 'Permiso' | 'Póliza';
  categoria: 'Personal' | 'Proyectos' | 'Maquinaria' | 'Proveedores' | 'Contabilidad';
  fecha: string;
  tamano: string;
  propietario: string;
  trabajadorId?: string; // Para documentos de personal
}

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

export interface Incidente {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: 'Abierto' | 'En Revisión' | 'Resuelto';
  fecha: string;
  maquinaId?: string;
  obra: string;
}

export const incidentes: Incidente[] = [
  { id: "IN001", titulo: "Fuga de aceite hidráulico", descripcion: "Se detectó fuga en manguera principal", prioridad: "Alta", estado: "En Revisión", fecha: "2025-04-27", maquinaId: "M001", obra: "Valle Sur" },
  { id: "IN002", titulo: "Retraso por clima", descripcion: "Lluvia intensa impidió colado de losa", prioridad: "Baja", estado: "Abierto", fecha: "2025-04-26", obra: "Remodelación Centro" },
];

export interface Bitacora {
  id: string;
  maquinaId: string;
  actividad: string;
  horas: number;
  fecha: string;
  obra: string;
}

export const operaciones: Bitacora[] = [
  { id: "B001", maquinaId: "M001", actividad: "Excavación para cimentación profunda", horas: 8, fecha: "2025-04-27", obra: "Valle Sur" },
  { id: "B002", maquinaId: "M004", actividad: "Acarreo de escombro a tiro autorizado", horas: 6, fecha: "2025-04-27", obra: "Valle Sur" },
];

export interface LecturaHorometro {
  id: string;
  maquinaId: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  horasTrabajadas: number;
}

export const lecturasHorometro: LecturaHorometro[] = [
  { id: "H001", maquinaId: "M001", fecha: "2025-04-27", lecturaInicial: 1237.5, lecturaFinal: 1245.5, horasTrabajadas: 8 },
  { id: "H002", maquinaId: "M002", fecha: "2025-04-27", lecturaInicial: 885.2, lecturaFinal: 890.2, horasTrabajadas: 5 },
  { id: "H003", maquinaId: "M004", fecha: "2025-04-27", lecturaInicial: 3415.1, lecturaFinal: 3421.1, horasTrabajadas: 6 },
];

export interface ReporteCampo {
  id: string;
  tipo: 'Mecanico' | 'Operador' | 'Pipero' | 'Checador' | 'Incidente' | 'Ingeniero' | 'Trabajador';
  usuario: string;
  maquinaId?: string;
  obra: string;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: 'Pendiente' | 'Visto' | 'Atendido' | 'En Revisión' | 'Resuelto';
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  detalles?: any;
}

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

export interface APUItem {
  nombre: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
}

export interface APUTemplate {
  id: string;
  nombre: string;
  unidad: string;
  materiales: APUItem[];
  manoDeObra: APUItem[];
  maquinaria: APUItem[];
}

export const apuTemplates: APUTemplate[] = [
  {
    id: "APU001",
    nombre: "Colado de Losa de Concreto f'c=250 kg/cm²",
    unidad: "m²",
    materiales: [
      { nombre: "Concreto Premezclado f'c=250", unidad: "m³", cantidad: 0.12, costoUnitario: 2200 },
      { nombre: "Malla Electrosoldada 6-6/10-10", unidad: "m²", cantidad: 1.15, costoUnitario: 45 },
      { nombre: "Madera para Cimbra (Uso)", unidad: "pt", cantidad: 2.5, costoUnitario: 18 }
    ],
    manoDeObra: [
      { nombre: "Cuadrilla de Albañilería (1 Oficial + 2 Ayudantes)", unidad: "jor", cantidad: 0.05, costoUnitario: 1800 },
      { nombre: "Cabo de Oficios", unidad: "jor", cantidad: 0.005, costoUnitario: 2200 }
    ],
    maquinaria: [
      { nombre: "Vibrador para Concreto 4HP", unidad: "hr", cantidad: 0.2, costoUnitario: 150 },
      { nombre: "Herramienta Menor (3% Mano de Obra)", unidad: "%mo", cantidad: 1, costoUnitario: 3.5 }
    ]
  },
  {
    id: "APU002",
    nombre: "Excavación Mecánica en Terreno Tipo B",
    unidad: "m³",
    materiales: [],
    manoDeObra: [
      { nombre: "Cuadrilla de Operación (1 Operador + 1 Ayudante)", unidad: "jor", cantidad: 0.02, costoUnitario: 2000 },
      { nombre: "Ayudante general (limpieza)", unidad: "jor", cantidad: 0.04, costoUnitario: 700 }
    ],
    maquinaria: [
      { nombre: "Excavadora CAT 320 (incluye diésel)", unidad: "hr", cantidad: 0.15, costoUnitario: 850 },
      { nombre: "Herramienta Menor", unidad: "%mo", cantidad: 1, costoUnitario: 2.0 }
    ]
  },
  {
    id: "APU003",
    nombre: "Muro de Block de Concreto 15x20x40 cm",
    unidad: "m²",
    materiales: [
      { nombre: "Block de Concreto 15x20x40", unidad: "pza", cantidad: 12.5, costoUnitario: 14 },
      { nombre: "Mortero Cemento-Arena 1:5", unidad: "m³", cantidad: 0.015, costoUnitario: 1600 },
      { nombre: "Andamios (Renta)", unidad: "día", cantidad: 0.1, costoUnitario: 50 }
    ],
    manoDeObra: [
      { nombre: "Cuadrilla de Albañiles (1 Oficial + 1 Ayudante)", unidad: "jor", cantidad: 0.08, costoUnitario: 1400 }
    ],
    maquinaria: [
      { nombre: "Revolvedora de Concreto 1 saco", unidad: "hr", cantidad: 0.1, costoUnitario: 80 }
    ]
  }
];

export interface DespachoMaquina {
  id: string;
  maquinaId: string;
  proyectoId: string;
  fechaInicio: string;
  fechaFin: string;
}

export const despachosFlota: DespachoMaquina[] = [
  {
    id: "DSP001",
    maquinaId: "M001",
    proyectoId: "P001",
    fechaInicio: "2025-04-20",
    fechaFin: "2025-05-02"
  },
  {
    id: "DSP002",
    maquinaId: "M002",
    proyectoId: "P002",
    fechaInicio: "2025-04-25",
    fechaFin: "2025-04-29"
  },
  {
    id: "DSP004",
    maquinaId: "M004",
    proyectoId: "P001",
    fechaInicio: "2025-04-22",
    fechaFin: "2025-04-30"
  }
];

// ─── CRIBA ────────────────────────────────────────────────────────────────────
export interface RegistroCriba {
  id: string;
  fecha: string;
  turno: 'Matutino' | 'Vespertino';
  operador: string;
  tipoMaterial: string;
  materialProducido: number;    // m³
  horasTrabajadas: number;
  materialAlBanco: number;      // m³ enviados al banco/stock
  observaciones?: string;
}

export const registrosCriba: RegistroCriba[] = [
  { id: 'CR001', fecha: '2026-08-15', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 45, horasTrabajadas: 8, materialAlBanco: 38, observaciones: 'Operación normal' },
  { id: 'CR002', fecha: '2026-08-15', turno: 'Vespertino', operador: 'Juan Pérez', tipoMaterial: 'Criba gruesa', materialProducido: 30, horasTrabajadas: 7, materialAlBanco: 25, observaciones: '' },
  { id: 'CR003', fecha: '2026-08-14', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 50, horasTrabajadas: 8, materialAlBanco: 50, observaciones: 'Producción completa al banco' },
  { id: 'CR004', fecha: '2026-08-14', turno: 'Vespertino', operador: 'Pedro Gómez', tipoMaterial: 'Arena lavada', materialProducido: 20, horasTrabajadas: 6, materialAlBanco: 15, observaciones: 'Paro por 2h - falla en faja' },
  { id: 'CR005', fecha: '2026-08-13', turno: 'Matutino', operador: 'Luis Torres', tipoMaterial: 'Criba fina', materialProducido: 52, horasTrabajadas: 8, materialAlBanco: 52, observaciones: '' },
];
