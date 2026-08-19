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
  sueldoFiscal: number;
  sueldoEfectivo: number;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  maquinaAsignadaId?: string;
  maquinaAsignadaNombre?: string;
  estadoRenta?: 'Rentado a Cliente' | 'En Obra Propia' | 'Disponible en Patio';
  clienteRentaActual?: string;
  licenciaODC3?: {
    tipo: string;
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
  folio: string;
  trabajadorId: string;
  trabajadorNombre: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  cliente: string;
  obraUbicacion: string;
  horaInicio: string;
  horaFin: string;
  horasEfectivas: number;
  horasExtras: number;
  horometroInicial: number;
  horometroFinal: number;
  actividadRealizada: string;
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

export interface HorasExtraDetalle {
  inicio: string;
  fin?: string;
  horasCalculadas: number;
  tarifaPorHora: number;
  montoTotal: number;
  estado: 'En Curso' | 'Aprobado' | 'Pendiente' | 'Rechazado';
  motivo?: string;
  coordenadasInicio?: { lat: number; lng: number };
  coordenadasFin?: { lat: number; lng: number };
}

export interface RegistroAsistencia {
  id: string;
  trabajadorId: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'No Presentado' | 'Salida Anticipada';
  ubicacion: string;
  coordenadas: { lat: number; lng: number };
  salidaCoordenadas?: { lat: number; lng: number };
  salidaUbicacion?: string;
  obraAsignada: string;
  obraCoordenadas: { lat: number; lng: number };
  distanciaMetros: number;
  radioPermitidoMetros: number;
  enSitio: boolean;
  precisionGpsMetros: number;
  dispositivo: string;
  horaMarcajeExacta?: string;
  horaSalidaExacta?: string;
  horasTrabajadasOrdinarias?: number;
  salidaAnticipada?: boolean;
  motivoSalidaAnticipada?: string;
  horasExtra?: HorasExtraDetalle;
  bateria?: number;
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
