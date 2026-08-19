export interface HitoProgreso {
  fecha: string;
  planificado: number;
  real: number;
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  presupuesto: number;
  gastado: number;
  progreso: number;
  estado: 'En Proceso' | 'Finalizado' | 'Pausado';
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  historicoProgreso?: HitoProgreso[];
  ingresoCobrado: number;
  gastoNomina: number;
  gastoCombustible: number;
  gastoMantenimiento: number;
  gastoMateriales: number;
  utilidadReal: number;
  margenUtilidadPorcentaje: number;
}

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
