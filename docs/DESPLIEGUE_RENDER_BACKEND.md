# Despliegue Backend en Render

Esta guia deja el backend listo para Render sin cambiar el levantamiento local.

## Servicio

Crear un **Web Service** en Render conectado al repositorio.

```txt
Name: minerguard-backend
Runtime: Node
Region: la misma region de la base de datos
Branch: main
Root Directory: dejar vacio
```

## Comandos

```txt
Build Command:
npm install && npm run render:backend:build

Start Command:
npm run render:backend:start
```

## Variables de Entorno

Usar la URL interna de Render Postgres:

```txt
DATABASE_URL=<Internal Database URL>
NODE_ENV=production
FRONTEND_ORIGIN=<URL del frontend desplegado>
MQTT_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
```

Render define `PORT` automaticamente. Localmente se sigue usando `BACKEND_PORT=4000`.

## Verificacion

Cuando Render termine el deploy:

```txt
https://TU_BACKEND.onrender.com/api/health
```

Debe responder:

```json
{
  "status": "ok",
  "service": "minerguard-backend"
}
```

## Notas

- `render:backend:start` ejecuta `prisma migrate deploy` antes de iniciar el servidor.
- No guardar `DATABASE_URL` real en archivos del repositorio.
- El usuario inicial se crea con el seed, no con el start command.
