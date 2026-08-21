export type {
  Maquina,
  ChecklistPreoperacional,
  DespachoMaquina,
} from './maquinaria';

export type {
  CategoriaPuesto,
  Permiso,
  Trabajador,
  BitacoraRentaDiaria,
  HorasExtraDetalle,
  RegistroAsistencia,
  DiaAsistenciaSemana,
  AsistenciaSemanalTrabajador,
} from './trabajadores';

export type {
  HitoProgreso,
  Proyecto,
  APUItem,
  APUTemplate,
} from './proyectos';

export type {
  PersonaAuth,
  RolAuth,
  VistaAuth,
  PermisoAuth,
  UserAuth,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  RefreshCredentials,
  ApiError,
  ApiSuccess,
  ApiResponse,
} from './auth';

export { STORAGE_KEYS } from './auth';

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
} from './operaciones';
