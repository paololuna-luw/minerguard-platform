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
- `User`: usuario interno del sistema.
- `Role`: rol operativo o administrativo.
- `UserRole`: asignacion entre usuario y rol.
- `AuthSession`: sesion activa de autenticacion.
- `VitalSignEvent`: eventos de signos vitales del wearable.
- `LocationEvent`: coordenadas 2D/3D simuladas o estimadas.
- `NodeSignalEvent`: senal reportada contra nodos LoRa.

## Autenticacion Inicial

El sistema crea por seed un usuario inicial para desarrollo:

```txt
usuario: admin
contrasena: admin
rol: admin
```

Este usuario queda marcado con `mustChangePassword = true`, porque en produccion debe forzarse el cambio de contrasena antes de operar.

Roles iniciales:

- `admin`: acceso total a configuracion, usuarios, roles, dispositivos y monitoreo.
- `editor`: gestion operativa de minas, mineros, dispositivos, gateways y alertas.
- `operator`: atiende alertas, revisa estado en tiempo real y registra seguimiento operativo.
- `viewer`: acceso de solo lectura al dashboard, telemetria, ubicaciones y alertas.

La autenticacion usa sesiones internas en base de datos mediante `AuthSession`. El token entregado al frontend no se guarda en claro; se almacena como hash SHA-256.

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
