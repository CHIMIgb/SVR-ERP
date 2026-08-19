import type { Maquina, ChecklistPreoperacional, DespachoMaquina } from '@/types/maquinaria';

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
    rendimientoActualLtsHora: 23.5,
    alertaConsumoAnormal: true,
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
