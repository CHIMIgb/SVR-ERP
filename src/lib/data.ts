// Re-export all types for backward compatibility
export type {
  Maquina,
  ChecklistPreoperacional,
  DespachoMaquina,
} from '@/types/maquinaria';

export type {
  CategoriaPuesto,
  Permiso,
  Trabajador,
  BitacoraRentaDiaria,
  HorasExtraDetalle,
  RegistroAsistencia,
  DiaAsistenciaSemana,
  AsistenciaSemanalTrabajador,
} from '@/types/trabajadores';

export type {
  HitoProgreso,
  Proyecto,
  APUItem,
  APUTemplate,
} from '@/types/proyectos';

export type {
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
} from '@/types/operaciones';

// Re-export all mock data arrays
export { maquinaria, checklistsPreoperacionales, despachosFlota } from './mock-data/maquinaria';
export { trabajadores, bitacorasRentaData, registrosAsistencia, asistenciaSemanalData } from './mock-data/trabajadores';
export { proyectos, apuTemplates } from './mock-data/proyectos';
export {
  cargasCombustible,
  inventario,
  mantenimiento,
  clientes,
  cotizaciones,
  finanzas,
  documentos,
  incidentes,
  operaciones,
  lecturasHorometro,
  reportesCampo,
  registrosCriba,
} from './mock-data/operaciones';
