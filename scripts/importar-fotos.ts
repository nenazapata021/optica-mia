import "dotenv/config";
import { Client } from "pg";
import { readdirSync, existsSync } from "fs";
import { join, extname } from "path";

const DATABASE_URL = process.env.IMPORT_DB_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: Set IMPORT_DB_URL or DATABASE_URL environment variable");
  process.exit(1);
}
console.log(`DB: ${DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);

const client = new Client({ connectionString: DATABASE_URL });

const BASE_ASSETS = join(process.cwd(), "src", "app", "assets");
const FOTOS_PRINCIPALES = join(BASE_ASSETS, "fotosPrincipales");
const FOTOS = join(BASE_ASSETS, "fotos");
const GAFAS_DE_SOL = join(BASE_ASSETS, "gafasDeSol");

interface MonturaInput {
  referencia: string;
  forma: string;
  color: string;
  precio: number;
  nombre: string;
}

const MAPPING_LENTES: Record<number, MonturaInput> = {
  1:  { referencia: "8306",    forma: "Agatada",     color: "Vino",                  precio: 120000, nombre: "Montura Agatada 8306" },
  2:  { referencia: "24028",   forma: "Agatada",     color: "Marron rosado",         precio: 120000, nombre: "Montura Agatada 24028" },
  3:  { referencia: "6019",    forma: "Vintage",     color: "Dorado",                precio: 120000, nombre: "Montura Vintage 6019" },
  4:  { referencia: "Volt",    forma: "Ovalada",     color: "Dorado claro",          precio: 135000, nombre: "Montura Ovalada Volt" },
  5:  { referencia: "Retro",   forma: "Agatada",     color: "Rosa palo translucido", precio: 95000,  nombre: "Montura Agatada Retro Rosa" },
  6:  { referencia: "Retro-2", forma: "Agatada",     color: "Rojo vino translucido", precio: 150000, nombre: "Montura Agatada Retro Rojo" },
  7:  { referencia: "Retro-3", forma: "Agatada",     color: "Carey/habana",          precio: 140000, nombre: "Montura Agatada Retro Carey" },
  8:  { referencia: "SER27",   forma: "Ovalada",     color: "Negro",                 precio: 140000, nombre: "Montura Ovalada SER27" },
  9:  { referencia: "CTR8808", forma: "Tres piezas", color: "Plateado",              precio: 130000, nombre: "Montura Tres Piezas CTR8808" },
  10: { referencia: "AC086",   forma: "Cuadrada",    color: "Azul translucido",      precio: 85000,  nombre: "Montura Cuadrada AC086" },
  11: { referencia: "MIR3206", forma: "Cuadrada",    color: "Cafe",                  precio: 155000, nombre: "Montura Cuadrada MIR3206" },
  12: { referencia: "6516",    forma: "Cuadrada",    color: "Negro mate",            precio: 170000, nombre: "Montura Cuadrada 6516" },
  13: { referencia: "6019P",   forma: "Ovalado",     color: "Plateado",              precio: 160000, nombre: "Montura Ovalado 6019 Plateado" },
  14: { referencia: "DAV5103", forma: "Cuadrada",    color: "Gris translucido",      precio: 120000, nombre: "Montura Cuadrada DAV5103" },
  15: { referencia: "82253",   forma: "Aviador",     color: "Dorado",                precio: 180000, nombre: "Montura Aviador 82253" },
  16: { referencia: "6340",    forma: "Al aire",     color: "Plateado",              precio: 145000, nombre: "Montura Al Aire 6340" },
  17: { referencia: "Retro-4", forma: "Agatada",     color: "Dorado rosado",         precio: 110000, nombre: "Montura Agatada Retro Dorado" },
  18: { referencia: "DAV5107", forma: "Cuadrada",    color: "Negro brillante",       precio: 165000, nombre: "Montura Cuadrada DAV5107" },
  19: { referencia: "Boen",    forma: "Cuadrada",    color: "Negro",                 precio: 150000, nombre: "Montura Cuadrada Boen" },
  20: { referencia: "81001",   forma: "Agatada",     color: "Dorado",                precio: 175000, nombre: "Montura Agatada 81001" },
  21: { referencia: "Mia01",   forma: "Clubmaster",  color: "Negro",                 precio: 135000, nombre: "Montura Clubmaster Mia01" },
};

const MAPPING_GAFAS_SOL: Record<string, MonturaInput> = {
  "gafas de sol1-sin-fondo.png": { referencia: "SOL-82253",   forma: "Aviador",   color: "Negro",  precio: 210000, nombre: "Gafas de Sol Aviador" },
  "gafas de sol2-sin-fondo.png": { referencia: "SOL-Retro",   forma: "Retro",     color: "Carey",  precio: 135000, nombre: "Gafas de Sol Retro" },
  "gafas de sol3-sin-fondo.png": { referencia: "SOL-Cateye",  forma: "Cateye",    color: "Negro",  precio: 160000, nombre: "Gafas de Sol Cateye Slim" },
  "gafas de sol4-sin-fondo.png": { referencia: "SOL-Deport",  forma: "Deportiva", color: "Azul",   precio: 145000, nombre: "Gafas de Sol Deportivas" },
  "gafas de sol5-sin-fondo.png": { referencia: "SOL-Urban",   forma: "Urbana",    color: "Plata",  precio: 120000, nombre: "Gafas de Sol Urbanas" },
  "gafas de sol6-sin-fondo.png": { referencia: "SOL-Classic", forma: "Classic",   color: "Dorado", precio: 130000, nombre: "Gafas de Sol Classic" },
  "Gafas Redondas Negras.jpg":   { referencia: "SOL-Mia01",   forma: "Redonda",   color: "Dorado", precio: 155000, nombre: "Gafas Redondas Negras" },
};

const RE_FOTO = /^FOTO(\d+)[\s\-]+(.+?)\.\s*(?:Referencia\s+)?(.+?)\.png$/i;

function parsearFotosPrincipales() {
  const archivos = readdirSync(FOTOS_PRINCIPALES);
  const resultado = new Map<number, { filename: string; forma: string; referenciaRaw: string }>();

  for (const archivo of archivos) {
    if (extname(archivo).toLowerCase() !== ".png") continue;
    const match = archivo.match(RE_FOTO);
    if (!match) {
      console.log(`  WARN No se pudo parsear: ${archivo}`);
      continue;
    }
    const fotoNum = parseInt(match[1], 10);
    resultado.set(fotoNum, {
      filename: archivo,
      forma: match[2].trim(),
      referenciaRaw: match[3].trim(),
    });
  }
  return resultado;
}

function normalizarRuta(ruta: string): string {
  return ruta.replace(/\\/g, "/");
}

async function upsertMontura(data: {
  referencia: string;
  nombre: string;
  forma: string;
  color: string;
  precio: number;
  imagenPrincipal: string;
  imagenes: string[];
  categoria: "FORMULA" | "SOL";
  tags: string[];
}) {
  const res = await client.query(
    `SELECT id FROM "Montura" WHERE referencia = $1`,
    [data.referencia]
  );

  if (res.rows.length > 0) {
    await client.query(
      `UPDATE "Montura" SET nombre=$1, forma=$2, color=$3, precio=$4,
       "imagenPrincipal"=$5, imagenes=$6, categoria=$7, tags=$8, "updatedAt"=NOW()
       WHERE referencia=$9`,
      [data.nombre, data.forma, data.color, data.precio, data.imagenPrincipal,
       data.imagenes, data.categoria, data.tags, data.referencia]
    );
    return "updated";
  }

  await client.query(
    `INSERT INTO "Montura" (id, referencia, nombre, forma, color, precio,
     "imagenPrincipal", imagenes, categoria, tags, stock, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())`,
    [data.referencia, data.nombre, data.forma, data.color, data.precio,
     data.imagenPrincipal, data.imagenes, data.categoria, data.tags]
  );
  return "created";
}

async function main() {
  await client.connect();
  console.log("Conectado a PostgreSQL\n");
  console.log("Importando fotos de monturas...\n");

  const fotosPrincipales = parsearFotosPrincipales();
  console.log(`Fotos principales encontradas: ${fotosPrincipales.size}\n`);

  let creadas = 0;
  let actualizadas = 0;

  for (const [fotoNum, info] of fotosPrincipales) {
    const mapping = MAPPING_LENTES[fotoNum];
    if (!mapping) {
      console.log(`  WARN FOTO${fotoNum} sin mapping`);
      continue;
    }

    const imagenPrincipal = normalizarRuta(`/assets/fotosPrincipales/${info.filename}`);

    const imagenes: string[] = [];
    const dirFotos = join(FOTOS, `foto${fotoNum}`);
    if (existsSync(dirFotos)) {
      for (const arch of readdirSync(dirFotos)) {
        const ext = extname(arch).toLowerCase();
        if (ext === ".png" || ext === ".jpg") {
          imagenes.push(normalizarRuta(`/assets/fotos/foto${fotoNum}/${arch}`));
        }
      }
    }

    const esSol = fotoNum === 21;
    const result = await upsertMontura({
      referencia: mapping.referencia,
      nombre: mapping.nombre,
      forma: mapping.forma,
      color: mapping.color,
      precio: mapping.precio,
      imagenPrincipal,
      imagenes,
      categoria: esSol ? "SOL" : "FORMULA",
      tags: [mapping.forma.toLowerCase()],
    });

    if (result === "created") { creadas++; } else { actualizadas++; }
    console.log(`  ${result === "created" ? "CREADA" : "ACTUALIZADA"}: ${mapping.referencia} - ${mapping.nombre}`);
  }

  console.log("\nProcesando gafas de sol...\n");

  for (const [archivo, mapping] of Object.entries(MAPPING_GAFAS_SOL)) {
    const rutaCompleta = join(GAFAS_DE_SOL, archivo);
    if (!existsSync(rutaCompleta)) {
      console.log(`  WARN Archivo no encontrado: ${archivo}`);
      continue;
    }

    const imagenPrincipal = normalizarRuta(`/assets/gafasDeSol/${archivo}`);

    const result = await upsertMontura({
      referencia: mapping.referencia,
      nombre: mapping.nombre,
      forma: mapping.forma,
      color: mapping.color,
      precio: mapping.precio,
      imagenPrincipal,
      imagenes: [],
      categoria: "SOL",
      tags: [mapping.forma.toLowerCase(), "sol"],
    });

    if (result === "created") { creadas++; } else { actualizadas++; }
    console.log(`  ${result === "created" ? "CREADA" : "ACTUALIZADA"}: ${mapping.referencia} - ${mapping.nombre}`);
  }

  console.log(`\nResumen: ${creadas} creadas, ${actualizadas} actualizadas`);
  await client.end();
}

main().catch((e) => {
  console.error("Error:", e);
  client.end();
  process.exit(1);
});
