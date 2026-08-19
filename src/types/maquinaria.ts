export interface Maquina {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'Encendida' | 'Apagada' | 'Mantenimiento' | 'Movimiento';
  combustible: number;
  horometro: number;
  operador: string;
  lat: number;
  lng: number;
  dieselHoy: number;
  proximoMantenimiento: string;
  imagen?: string;
  consumoEsperadoLtsHora?: number;
  rendimientoActualLtsHora?: number;
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

export interface DespachoMaquina {
  id: string;
  maquinaId: string;
  proyectoId: string;
  fechaInicio: string;
  fechaFin: string;
}
