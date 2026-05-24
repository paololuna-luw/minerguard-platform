# Levantamiento Local

## 1. Instalar Dependencias

```bash
npm install
```

## 2. Variables de Entorno

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 3. Levantar Infraestructura

```bash
npm run infra:up
```

Ver logs:

```bash
npm run infra:logs
```

Apagar:

```bash
npm run infra:down
```

## 4. Preparar Base de Datos

Cuando las dependencias esten instaladas:

```bash
npm run prisma:generate --workspace=@minerguard/backend
npm run prisma:migrate --workspace=@minerguard/backend
```

## 5. Ejecutar Backend

```bash
npm run dev:backend
```

Verificar:

```txt
http://localhost:4000/api/health
```

PostgreSQL queda expuesto por defecto en `localhost:55432` para evitar conflictos con otras bases locales.
MQTT WebSocket queda expuesto en `localhost:19001`.

## 6. Ejecutar Frontend

```bash
npm run dev:frontend
```

Abrir:

```txt
http://localhost:3000
```

## Acceso desde Celular en la Misma Red

El frontend y backend escuchan en `0.0.0.0` durante desarrollo.

1. Busca la IP local del computador.
2. Desde el celular abre:

```txt
http://IP_DEL_COMPUTADOR:3000/login
```

El frontend usara automaticamente `http://IP_DEL_COMPUTADOR:4000` para llamar al backend cuando no exista `NEXT_PUBLIC_API_URL`.
