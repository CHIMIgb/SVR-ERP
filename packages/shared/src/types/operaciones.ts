export interface CargaCombustible {
  id: string;
  maquinaId: string;
  fecha: string;
  litros: number;
  costo: number;
  operador: string;
  lugar: string;
  horometroActual: number;
  horasTrabajadasPeriodo: number;
  consumoEsperadoLtsHora: number;
  rendimientoLtsHora: number;
  alertaOrdena: boolean;
  desviacionPorcentaje: number;
}

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

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  obrasActivas: number;
}

export interface Cotizacion {
  id: string;
  clienteId: string;
  descripcion: string;
  monto: number;
  fecha: string;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
}

export interface Transaccion {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  monto: number;
  fecha: string;
  descripcion: string;
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: 'Contrato' | 'ID' | 'Factura' | 'Manual' | 'Permiso' | 'Póliza';
  categoria: 'Personal' | 'Proyectos' | 'Maquinaria' | 'Proveedores' | 'Contabilidad';
  fecha: string;
  tamano: string;
  propietario: string;
  trabajadorId?: string;
}

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

export interface Bitacora {
  id: string;
  maquinaId: string;
  maquina: string;
  actividad: string;
  horas: number;
  fecha: string;
  obra: string;
  obraId: string | null;
}

export interface LecturaHorometro {
  id: string;
  maquinaId: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  horasTrabajadas: number;
}

export interface ReporteCampo {
  id: string;
  tipo: 'Mecanico' | 'Operador' | 'Pipero' | 'Checador' | 'Incidente' | 'Ingeniero' | 'Trabajador';
  usuario: string;
  maquinaId?: string;
  obraId?: string;
  obra: string;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: 'Pendiente' | 'Visto' | 'Atendido' | 'En Revisión' | 'Resuelto';
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  detalles?: any;
}

export interface RegistroCriba {
  id: string;
  fecha: string;
  turno: 'Matutino' | 'Vespertino';
  operador: string;
  tipoMaterial: string;
  materialProducido: number;
  horasTrabajadas: number;
  materialAlBanco: number;
  observaciones?: string;
}
