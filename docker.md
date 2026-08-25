# Docker — Óptica Mía

Guía para ejecutar el proyecto completo con PostgreSQL dockerizado.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2 incluido con Docker Desktop)

## Estructura de archivos Docker

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Build multi-etapa: `base` → `deps` → `builder` → `runner` (prod) + `dev` |
| `docker-compose.yml` | Servicios `postgres` (16-alpine) y `app` (modo producción) |
| `docker-compose.dev.yml` | Override para desarrollo con hot-reload y montaje de código |
| `.env.example` | Plantilla de variables de entorno para Docker |
| `entrypoint.sh` | Script de inicio: espera DB, migraciones, seed opcional, dev/prod |
| `.dockerignore` | Exclusiones para el build context |

## Paso a paso

### 1. Crear archivo `.env`

```bash
cp .env.example .env
```

Variables disponibles:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `POSTGRES_USER` | `optica` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `optica` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | `optica_mia` | Nombre de la base de datos |
| `DATABASE_URL` | `postgresql://optica:optica@postgres:5432/optica_mia?schema=public` | Connection string para Prisma |
| `RUN_SEED` | `false` | Poner en `true` para sembrar datos al iniciar |

> **Importante:** `DATABASE_URL` usa `postgres` como host (nombre del servicio en docker-compose). No cambiar.

### 2. Producción

```bash
npm run docker:up
# o directamente:
docker compose up --build
```

Esto construye la imagen usando el target `runner`, levanta PostgreSQL, ejecuta migraciones automáticas e inicia el servidor en `http://localhost:3000`.

### 3. Desarrollo (con hot-reload)

```bash
npm run docker:dev
# o directamente:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Usa el target `dev` del Dockerfile. Monta el código local como bind mount para que los cambios se reflejen al instante (Next.js hot-reload).

### 4. Sembrar la base de datos

Para cargar los 12 productos iniciales al arrancar:

```bash
RUN_SEED=true docker compose up --build
# o en dev:
RUN_SEED=true docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

También se puede ejecutar el seed manualmente dentro del contenedor en ejecución:

```bash
docker compose exec app npx prisma db seed
```

### 5. Detener los contenedores

```bash
docker compose down
```

Para eliminar también el volumen de la base de datos (borra toda la data):

```bash
docker compose down -v
```

### 6. Ver logs

```bash
docker compose logs -f
docker compose logs -f app
docker compose logs -f postgres
```

## Comandos útiles

```bash
# Acceder a la consola del contenedor app
docker compose exec app sh

# Acceder a PostgreSQL directamente
docker compose exec postgres psql -U optica optica_mia

# Ver estado de los contenedores
docker compose ps

# Reconstruir sin caché
docker compose build --no-cache

# Ejecutar migraciones manualmente
docker compose exec app npx prisma migrate deploy

# Regenerar Prisma Client
docker compose exec app npx prisma generate

# Abrir Prisma Studio (puerto 5555)
docker compose exec app npx prisma studio --port 5555 --hostname 0.0.0.0
```

## Notas

- El entrypoint espera a que PostgreSQL esté listo usando `pg_isready` antes de continuar.
- Las migraciones se ejecutan automáticamente en cada inicio (`prisma migrate deploy`).
- En desarrollo, `WATCHPACK_POLLING=true` habilita hot-reload en entornos con archivos montados.
- El Dockerfile usa `output: "standalone"` de Next.js para producción, resultando en una imagen más pequeña.
- `node_modules` se excluye del bind mount en desarrollo mediante un volumen anónimo (`/app/node_modules`).
