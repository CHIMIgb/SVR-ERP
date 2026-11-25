/**
 * Integration tests de GET /maquinas/campo (PWA del Técnico, "Flota y obras") — BD real, sin mocks.
 *
 * Verifica contra Postgres lo que los mocks no ven: el despacho vigente "hoy" con columnas @db.Date, la obra
 * 1:1 del proyecto, el DISTINCT ON del último ping, y que las máquinas inactivas o eliminadas no salgan.
 * Solo lectura del servicio: no audita, así que no deja filas en registro_auditoria.
 *
 * Run with: npm run test:integration -- --testPathPattern="flota-campo"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FlotaCampoService } from './flota-campo.service';
import { hoyEnZona, sumarDiasFecha } from '../common/validacion';

const TEST_ID = randomUUID().slice(0, 8);
/** @db.Date se guarda y se compara como medianoche UTC del día. */
const dia = (offset: number) => new Date(`${sumarDiasFecha(hoyEnZona(), offset)}T00:00:00Z`);

describe('Flota en campo (Real DB)', () => {
  let prisma: PrismaService;
  let service: FlotaCampoService;

  const ids = {
    cliente: randomUUID(),
    proyectoConObra: randomUUID(),
    proyectoSinObra: randomUUID(),
    obra: randomUUID(),
    tipo: randomUUID(),
    categoria: randomUUID(),
    chofer: randomUUID(),
    operando: randomUUID(), // despacho vigente en el proyecto con obra, chofer y 2 pings
    taller: randomUUID(), // solo despachos vencido y futuro, sin pings
    sinObra: randomUUID(), // despacho vigente en un proyecto sin obra (+ uno inactivo que no cuenta)
    inactiva: randomUUID(),
    eliminada: randomUUID(),
  };
  const maquinaIds = [ids.operando, ids.taller, ids.sinObra, ids.inactiva, ids.eliminada];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    service = new FlotaCampoService(prisma);
    const ahora = new Date();

    await prisma.clientes.create({
      data: {
        id: ids.cliente, codigo: `IT-FC-${TEST_ID}`, nombre: `Cliente IT FlotaCampo ${TEST_ID}`, empresa: `Empresa IT ${TEST_ID}`,
        correo: `flotacampo-${TEST_ID}@integration.mx`, telefono: '55-0000-0000', activo: true, actualizado_en: ahora,
      },
    });
    for (const [id, nombre] of [
      [ids.proyectoConObra, `Proyecto IT FC con obra ${TEST_ID}`],
      [ids.proyectoSinObra, `Proyecto IT FC sin obra ${TEST_ID}`],
    ]) {
      await prisma.proyectos.create({
        data: {
          id, codigo: `IT-FC-${id.slice(0, 6)}`, nombre, cliente_id: ids.cliente, presupuesto: 100000,
          fecha_inicio: new Date('2026-01-01'), fecha_fin: new Date('2026-12-31'), activo: true, actualizado_en: ahora,
        },
      });
    }
    await prisma.obras.create({
      data: {
        id: ids.obra, nombre: `Obra IT FC Norte ${TEST_ID}`, proyecto_id: ids.proyectoConObra, ubicacion: 'Km 12 carretera',
        lat: 20.65, lng: -105.22, actualizado_en: ahora,
      },
    });
    await prisma.tipos_maquina.create({ data: { id: ids.tipo, nombre: `TFC-${TEST_ID}`, actualizado_en: ahora } });
    await prisma.categorias_puesto.create({ data: { id: ids.categoria, nombre: `TestCategoriaFlotaCampo-${TEST_ID}`, actualizado_en: ahora } });
    await prisma.trabajadores.create({
      data: {
        id: ids.chofer, nombre: `Chofer IT FC ${TEST_ID}`, puesto: 'Chofer', categoria_puesto_id: ids.categoria,
        telefono: '55 1111 2222', avatar: 'CF', sueldo_fiscal: 2500, sueldo_efectivo: 3500, metodo_pago: 'MIXTO',
        entrada: new Date(Date.UTC(1970, 0, 1, 7, 0, 0)), actualizado_en: ahora,
      },
    });

    const crearMaquina = (id: string, sufijo: string, extra: Record<string, unknown> = {}) =>
      prisma.maquinas.create({
        data: {
          id, codigo: `ZC${TEST_ID}${sufijo}`, nombre: `Máquina IT FC ${sufijo} ${TEST_ID}`, tipo_id: ids.tipo,
          lat: 19.4326, lng: -99.1332, actualizado_en: ahora, ...extra,
        },
      });
    await crearMaquina(ids.operando, 'A', { estado: 'ENCENDIDA', operador_id: ids.chofer });
    await crearMaquina(ids.taller, 'B', { estado: 'MANTENIMIENTO' });
    await crearMaquina(ids.sinObra, 'C', { estado: 'APAGADA' });
    await crearMaquina(ids.inactiva, 'D', { estado: 'ENCENDIDA', activo: false });
    await crearMaquina(ids.eliminada, 'E', { estado: 'ENCENDIDA', eliminado_en: ahora });

    const despacho = (maquina: string, proyecto: string, desde: number, hasta: number, activo = true) =>
      prisma.despachos_maquina.create({
        data: { id: randomUUID(), maquina_id: maquina, proyecto_id: proyecto, fecha_inicio: dia(desde), fecha_fin: dia(hasta), activo, actualizado_en: ahora },
      });
    await despacho(ids.operando, ids.proyectoConObra, -1, 1); // vigente hoy
    await despacho(ids.taller, ids.proyectoConObra, -5, -1); // terminó ayer
    await despacho(ids.taller, ids.proyectoConObra, 1, 3); // empieza mañana
    await despacho(ids.sinObra, ids.proyectoSinObra, 0, 0); // solo hoy
    await despacho(ids.sinObra, ids.proyectoConObra, -2, 2, false); // inactivo: no cuenta

    const hace = (min: number) => new Date(Date.now() - min * 60_000);
    await prisma.rastreo_gps.createMany({
      data: [
        { id: randomUUID(), maquina_id: ids.operando, fecha_hora: hace(30), lat: 20.6, lng: -105.2 },
        { id: randomUUID(), maquina_id: ids.operando, fecha_hora: hace(2), lat: 20.6512, lng: -105.2234 },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.rastreo_gps.deleteMany({ where: { maquina_id: { in: maquinaIds } } });
    await prisma.despachos_maquina.deleteMany({ where: { maquina_id: { in: maquinaIds } } });
    await prisma.maquinas.deleteMany({ where: { id: { in: maquinaIds } } });
    await prisma.trabajadores.deleteMany({ where: { id: ids.chofer } });
    await prisma.categorias_puesto.deleteMany({ where: { id: ids.categoria } });
    await prisma.tipos_maquina.deleteMany({ where: { id: ids.tipo } });
    await prisma.obras.deleteMany({ where: { id: ids.obra } });
    await prisma.proyectos.deleteMany({ where: { id: { in: [ids.proyectoConObra, ids.proyectoSinObra] } } });
    await prisma.clientes.deleteMany({ where: { id: ids.cliente } });
    await prisma.$disconnect();
  });

  const buscar = async (id: string) => (await service.findCampo()).maquinas.find((m) => m.id === id);

  it('la fecha es el día de la empresa', async () => {
    expect((await service.findCampo()).fecha).toBe(hoyEnZona());
  });

  it('máquina en obra hoy: obra 1:1 del proyecto, chofer y el ping MÁS RECIENTE', async () => {
    const m = await buscar(ids.operando);
    expect(m).toMatchObject({
      codigo: `ZC${TEST_ID}A`,
      tipo: `TFC-${TEST_ID}`,
      estado: 'operando',
      obraHoy: { proyectoId: ids.proyectoConObra, nombre: `Obra IT FC Norte ${TEST_ID}`, ubicacion: 'Km 12 carretera', lat: 20.65, lng: -105.22 },
      encargado: { nombre: `Chofer IT FC ${TEST_ID}`, rol: 'Chofer' },
    });
    expect(m?.posicion).toMatchObject({ lat: 20.6512, lng: -105.2234, sinSenal: false });
  });

  it('un despacho que terminó ayer o empieza mañana no es la obra de hoy; sin pings no hay posición', async () => {
    const m = await buscar(ids.taller);
    expect(m).toMatchObject({ estado: 'en_taller', obraHoy: null, encargado: null, posicion: null });
  });

  it('proyecto sin obra: el nombre del proyecto; el despacho inactivo no cuenta', async () => {
    const m = await buscar(ids.sinObra);
    expect(m?.estado).toBe('detenida');
    expect(m?.obraHoy).toEqual({ proyectoId: ids.proyectoSinObra, nombre: `Proyecto IT FC sin obra ${TEST_ID}`, ubicacion: null, lat: null, lng: null });
  });

  it('no salen las máquinas inactivas ni las eliminadas', async () => {
    expect(await buscar(ids.inactiva)).toBeUndefined();
    expect(await buscar(ids.eliminada)).toBeUndefined();
  });

  it('no devuelve costos, horómetro, combustible ni sueldos', async () => {
    const m = await buscar(ids.operando);
    // Se revisan las claves, no los montos: el JSON lleva UUID aleatorios que podrían contener "2500" por azar.
    expect(Object.keys(m ?? {}).sort()).toEqual(['codigo', 'encargado', 'estado', 'id', 'nombre', 'obraHoy', 'posicion', 'tipo']);
    expect(Object.keys(m?.encargado ?? {}).sort()).toEqual(['nombre', 'rol']);
    const texto = JSON.stringify(m).toLowerCase();
    for (const campo of ['costo', 'horometro', 'combustible', 'sueldo']) {
      expect(texto).not.toContain(campo);
    }
  });
});
