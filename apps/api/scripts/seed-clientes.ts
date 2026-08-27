import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

/** Prefijo del campo `codigo` para identificar los registros de este seed (idempotencia). */
const SEED_PREFIX = 'SEED-CLI';

type Seed = {
  codigo: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  rfc: string;
  activo: boolean;
};

const seeds: Seed[] = [
  { codigo: 'SEED-CLI-001', nombre: 'Ing. Alberto Ruiz', empresa: 'Inmobiliaria ARCO', correo: 'aruiz@arco.mx', telefono: '55-1234-1001', rfc: 'ARCO010101001', activo: true },
  { codigo: 'SEED-CLI-002', nombre: 'Lic. Mariana Trejo', empresa: 'Gobierno CDMX', correo: 'mtrejo@cdmx.gob.mx', telefono: '55-1234-1002', rfc: 'TREL980808002', activo: true },
  { codigo: 'SEED-CLI-003', nombre: 'C. Roberto Salinas', empresa: 'Constructora Villalta', correo: 'rsalinas@villalta.mx', telefono: '55-1234-1003', rfc: 'SACR880505003', activo: true },
  { codigo: 'SEED-CLI-004', nombre: 'Arq. Lucía Fernández', empresa: 'Desarrollos del Bajío', correo: 'lfernandez@dbajio.mx', telefono: '55-1234-1004', rfc: 'FELU940202004', activo: true },
  { codigo: 'SEED-CLI-005', nombre: 'Ing. Jorge Camacho', empresa: 'Camacho Edificaciones', correo: 'jcamacho@camachoedi.mx', telefono: '55-1234-1005', rfc: 'CAAJ770313005', activo: true },
  { codigo: 'SEED-CLI-006', nombre: 'Mtra. Paula Delgado', empresa: 'Hospitales del Sur', correo: 'pdelgado@hdelsur.mx', telefono: '55-1234-1006', rfc: 'DEHP900101006', activo: true },
  { codigo: 'SEED-CLI-007', nombre: 'Lic. Hugo Montero', empresa: 'Montero y Asociados', correo: 'hmontero@monteroasa.mx', telefono: '55-1234-1007', rfc: 'MOLH820101007', activo: true },
  { codigo: 'SEED-CLI-008', nombre: 'Ing. Carmen Ochoa', empresa: 'Vías y Puentes Norte', correo: 'cochoa@vipunorte.mx', telefono: '55-1234-1008', rfc: 'OCHC790202008', activo: true },
  { codigo: 'SEED-CLI-009', nombre: 'C. Diego Ibarra', empresa: 'Ibarra Ingeniería', correo: 'dibarra@ibarrain.mx', telefono: '55-1234-1009', rfc: 'AAID850303009', activo: true },
  { codigo: 'SEED-CLI-010', nombre: 'Arq. Sofía Rangel', empresa: 'Rangel Urbanista', correo: 'srangel@rangelurb.mx', telefono: '55-1234-1010', rfc: 'RALS960101010', activo: true },
  { codigo: 'SEED-CLI-011', nombre: 'Ing. Tomás Heredia', empresa: 'Heredia Infraestructura', correo: 'theredia@heredia.mx', telefono: '55-1234-1011', rfc: 'HEAN910202011', activo: true },
  { codigo: 'SEED-CLI-012', nombre: 'Lic. Gabriela Núñez', empresa: 'Núñez Gestión Inmobiliaria', correo: 'gnunez@nunezg.mx', telefono: '55-1234-1012', rfc: 'NUEG880303012', activo: true },
  { codigo: 'SEED-CLI-013', nombre: 'C. Mauricio Cano', empresa: 'Parques Industriales MX', correo: 'mcano@parquesmx.mx', telefono: '55-1234-1013', rfc: 'CAOM870101013', activo: true },
  { codigo: 'SEED-CLI-014', nombre: 'Ing. Renata Aguilar', empresa: 'Aguilar Obras Civiles', correo: 'raguilar@aguilaroc.mx', telefono: '55-1234-1014', rfc: 'AGRR930202014', activo: true },
  { codigo: 'SEED-CLI-015', nombre: 'Arq. Emilio León', empresa: 'León Arquitectos', correo: 'eleon@leonarq.mx', telefono: '55-1234-1015', rfc: 'LEAE800101015', activo: true },
  { codigo: 'SEED-CLI-016', nombre: 'Lic. Valeria Ponce', empresa: 'Ponce Consultores', correo: 'vponce@poncecon.mx', telefono: '55-1234-1016', rfc: 'PAVV950202016', activo: true },
  { codigo: 'SEED-CLI-017', nombre: 'C. Fernando Blas', empresa: 'Blas Construcciones', correo: 'fblas@blasconst.mx', telefono: '55-1234-1017', rfc: 'BLFF860303017', activo: true },
  { codigo: 'SEED-CLI-018', nombre: 'Ing. Nadia Cuevas', empresa: 'Cuevas Estructural', correo: 'ncuevas@cuevasest.mx', telefono: '55-1234-1018', rfc: 'CUEN920101018', activo: true },
  { codigo: 'SEED-CLI-019', nombre: 'Arq. Iván Zamudio', empresa: 'Zamudio Desarrollos', correo: 'izamudio@zamudev.mx', telefono: '55-1234-1019', rfc: 'ZAII810202019', activo: true },
  { codigo: 'SEED-CLI-020', nombre: 'Lic. Elena Bautista', empresa: 'Bautista Bienes Raíces', correo: 'ebautista@bautistabr.mx', telefono: '55-1234-1020', rfc: 'BAHE970303020', activo: true },
  { codigo: 'SEED-CLI-021', nombre: 'C. Rodrigo Vela', empresa: 'Vela Pavimentos', correo: 'rvela@velapav.mx', telefono: '55-1234-1021', rfc: 'VERD890101021', activo: true },
  { codigo: 'SEED-CLI-022', nombre: 'Ing. Adriana Soto', empresa: 'Soto Topografía', correo: 'asoto@sototopo.mx', telefono: '55-1234-1022', rfc: 'SOAA940202022', activo: true },
  { codigo: 'SEED-CLI-023', nombre: 'Arq. Marcos Rendón', empresa: 'Rendón Vertical', correo: 'mrendon@rendonvert.mx', telefono: '55-1234-1023', rfc: 'REMA780303023', activo: false },
  { codigo: 'SEED-CLI-024', nombre: 'Lic. Julieta Padilla', empresa: 'Padilla Corporativo', correo: 'jpadilla@padillacorp.mx', telefono: '55-1234-1024', rfc: 'PASJ910101024', activo: true },
  { codigo: 'SEED-CLI-025', nombre: 'C. Esteban Quintero', empresa: 'Quintero Cimentaciones', correo: 'equintero@quintcim.mx', telefono: '55-1234-1025', rfc: 'QUDD870202025', activo: true },
  { codigo: 'SEED-CLI-026', nombre: 'Ing. Ximena Roldán', empresa: 'Roldán Hidráulica', correo: 'xroldan@roldanhid.mx', telefono: '55-1234-1026', rfc: 'ROXX930303026', activo: true },
  { codigo: 'SEED-CLI-027', nombre: 'Arq. Saúl Medina', empresa: 'Medina Mobiliario Urbano', correo: 'smedina@medinamu.mx', telefono: '55-1234-1027', rfc: 'MEAS820101027', activo: true },
  { codigo: 'SEED-CLI-028', nombre: 'Lic. Tamara Luna', empresa: 'Luna Asesoría Legal', correo: 'tluna@lunasal.mx', telefono: '55-1234-1028', rfc: 'LATT950202028', activo: true },
  { codigo: 'SEED-CLI-029', nombre: 'C. Gustavo Peña', empresa: 'Peña Demoliciones', correo: 'gpena@denapll.mx', telefono: '55-1234-1029', rfc: 'PEAG880303029', activo: true },
  { codigo: 'SEED-CLI-030', nombre: 'Ing. Daniela Muro', empresa: 'Muro Académico', correo: 'dmuro@muroaca.mx', telefono: '55-1234-1030', rfc: 'MUDA920101030', activo: true },
];

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:admin123@localhost:5432/svr_erp';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Limpia corridas previas del seed (mismo prefijo de codigo) para no duplicar
    const borrados = await prisma.clientes.deleteMany({
      where: { codigo: { startsWith: SEED_PREFIX } },
    });

    let creados = 0;
    for (const s of seeds) {
      await prisma.clientes.create({
        data: {
          id: randomUUID(),
          codigo: s.codigo,
          nombre: s.nombre,
          empresa: s.empresa,
          correo: s.correo,
          telefono: s.telefono,
          rfc: s.rfc,
          activo: s.activo,
          actualizado_en: new Date(),
        },
      });
      creados++;
    }

    const total = await prisma.clientes.count();
    console.log(
      `Clientes seed: ${borrados.count} borrados (previos), ${creados} creados. Total en tabla clientes: ${total}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
