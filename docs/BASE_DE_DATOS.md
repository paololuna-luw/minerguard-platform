# Base de Datos

## Motor

PostgreSQL es la base de datos principal. Prisma se usa como ORM desde el backend.

## Entidades Iniciales

- `Mine`: unidad minera.
- `Zone`: zonas internas del socavon.
- `Miner`: persona monitoreada.
- `Device`: dispositivo asignable a un minero.
- `Gateway`: receptor o nodo de comunicacion.
- `TelemetryEvent`: evento de telemetria recibido.
- `Alert`: alerta operacional.

## Esquema

El archivo fuente es:

```txt
apps/backend/prisma/schema.prisma
```

## Migraciones

Las migraciones se generaran desde Prisma:

```bash
npm run prisma:migrate --workspace=@minerguard/backend
```

## Futuro

Si el volumen de telemetria es alto, evaluar TimescaleDB para series de tiempo.
