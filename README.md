# MinerGuard Platform

MinerGuard es una plataforma de monitoreo para operaciones mineras subterraneas. Su objetivo es recibir telemetria de dispositivos instalados en mineros, nodos y gateways, estimar la ultima zona conocida de cada persona, generar alertas y mostrar el estado operativo en un dashboard web.

## Que Incluye

- Frontend con Next.js para dashboard en tiempo real.
- Backend con NestJS para API, WebSocket y consumo MQTT.
- PostgreSQL como base de datos principal.
- Prisma como ORM, programación orientada a objetos.
- Docker Compose para infraestructura de desarrollo.
- Paquetes compartidos para tipos y contratos de telemetria.
- Documentacion inicial en `docs/`.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker Desktop o Docker Engine con Docker Compose.

## Instalacion

```bash
npm install
```

Copia las variables de entorno:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Levantar Infraestructura

```bash
npm run infra:up
```

Esto levanta:

- PostgreSQL en `localhost:55432`.
- MQTT en `localhost:1883`.
- MQTT WebSocket en `localhost:19001`.

## Levantar Aplicaciones

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

URLs esperadas:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`

## Estructura Definida

```txt
apps/
  frontend/      Dashboard Next.js
  backend/       API NestJS, MQTT, WebSocket, Prisma
packages/
  shared/        Tipos y contratos compartidos
  config/        Constantes compartidas
database/        Migraciones, seeds y documentacion de esquema
infra/           Configuracion de servicios locales
docs/            Documentacion funcional y tecnica
```

## Colaboracion

1. Crear una rama descriptiva.
2. Mantener cambios pequenos y enfocados.
3. Actualizar `docs/PROGRESO.md` cuando se cierre una tarea importante.
4. Documentar cambios de arquitectura en `docs/ARQUITECTURA.md`.
5. Agregar o actualizar contratos compartidos en `packages/shared`.

## Estado Inicial

El proyecto queda listo para iniciar desarrollo. La primera version debe enfocarse en telemetria simulada, registro de minas, zonas, mineros, dispositivos, gateways y alertas basicas.
 
 CMD