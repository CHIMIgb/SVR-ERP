// Re-export all types for backward compatibility
export type {
  Maquina,
  ChecklistPreoperacional,
  DespachoMaquina,
  CategoriaPuesto,
  Permiso,
  Trabajador,
  BitacoraRentaDiaria,
  HorasExtraDetalle,
  RegistroAsistencia,
  DiaAsistenciaSemana,
  AsistenciaSemanalTrabajador,
  HitoProgreso,
  Proyecto,
  APUItem,
  APUTemplate,
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
