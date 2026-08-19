import type { Proyecto, APUTemplate } from '@svr-erp/shared/types';

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
