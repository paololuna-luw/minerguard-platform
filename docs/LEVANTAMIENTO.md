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

## 6. Ejecutar Frontend

```bash
npm run dev:frontend
```

Abrir:

```txt
http://localhost:3000
```
