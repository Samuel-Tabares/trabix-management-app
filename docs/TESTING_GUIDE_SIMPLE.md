# Guía de Testing - TRABIX Backend

## Requisitos Previos

Antes de empezar, asegúrate de tener:

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 16 corriendo
- [ ] Redis 7 corriendo
- [ ] El proyecto con `npm install` ejecutado
- [ ] Archivo `.env` configurado
- [ ] Prisma generado (`npx prisma generate`)
- [ ] Migraciones aplicadas (`npx prisma migrate dev`)

---

## PARTE 1: Preparación de Base de Datos

### Paso 1.1 - Ejecutar Seeds Base

```bash
npx prisma db seed
```

**✅ Deberías ver:**
```
🌱 Seeding database...
✅ Seed completed successfully
```

**❌ Si ves errores:**
- "Database does not exist" → Ejecuta `npx prisma migrate dev`
- "Connection refused" → Verifica que PostgreSQL esté corriendo

### Paso 1.2 - Ejecutar Seed de Escenarios de Prueba

```bash
npx ts-node prisma/seeds/test-scenarios.seed.ts
```

**✅ Deberías ver:**
```
🧪 Iniciando seed de escenarios de prueba...

✅ Admin encontrado: [nombre]

📦 Creando vendedor modelo 60/40...
   ✅ Vendedor 60/40: Carlos (1234567890)

📦 Creando reclutador...
   ✅ Reclutador: María (1111111111)

📦 Creando vendedores modelo 50/50...
   ✅ Vendedor 50/50: Juan (2222222222)
   ✅ Vendedor 50/50: Pedro (3333333333)
   ✅ Vendedor 50/50: Ana (4444444444)

[... más usuarios ...]

============================================================
✅ SEED DE PRUEBAS COMPLETADO
============================================================

🚀 Listo para ejecutar pruebas!
```

**❌ Si ves errores:**
- "Admin no encontrado" → Ejecuta primero `npx prisma db seed`
- "Unique constraint" → Los datos ya existen (está bien, continúa)

---

## PARTE 2: Iniciar la Aplicación

### Paso 2.1 - Iniciar en Modo Desarrollo

```bash
npm run start:dev
```

**✅ Deberías ver:**
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] LOG [InstanceLoader] AuthModule dependencies initialized
[... más módulos ...]
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://localhost:3000
```

**❌ Si ves errores:**
- "Port 3000 already in use" → Mata el proceso anterior o cambia el puerto
- "Cannot find module" → Ejecuta `npm install` de nuevo
- "ECONNREFUSED Redis" → Verifica que Redis esté corriendo

### Paso 2.2 - Verificar Health Check

En otra terminal:

```bash
curl http://localhost:3000/api/v1/health
```

**✅ Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T...",
  "uptime": 5.123
}
```

---

## PARTE 3: Pruebas Manuales con HTTP

### Opción A: Usando curl

#### 3A.1 - Login Admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"ADMIN001","password":"Admin123!"}'
```

**✅ Deberías ver:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "cedula": "ADMIN001",
    "nombre": "...",
    "rol": "ADMIN"
  }
}
```

**❌ Si ves:**
- `401 Unauthorized` → Password incorrecto o usuario no existe
- `500 Internal Server Error` → Revisa logs de la aplicación

#### 3A.2 - Guardar Token y Probar Endpoint Protegido

```bash
# Guarda el token (reemplaza con el tuyo)
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Probar endpoint protegido
curl http://localhost:3000/api/v1/usuarios \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Deberías ver:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

### Opción B: Usando REST Client (VS Code)

1. Instala la extensión "REST Client" en VS Code
2. Abre el archivo `docs/HTTP_TEST_COLLECTION.http`
3. Haz clic en "Send Request" sobre cada request
4. Copia el token del login y reemplaza `{{adminToken}}`

---

## PARTE 4: Pruebas Unitarias

### Paso 4.1 - Ejecutar Todos los Tests Unitarios

```bash
npm run test
```

**✅ Deberías ver:**
```
 PASS  test/unit/domain/lote.entity.spec.ts
 PASS  test/unit/domain/tanda-venta.entity.spec.ts
 PASS  test/unit/domain/cuadre-equipamiento.entity.spec.ts

Test Suites: 3 passed, 3 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXXs
```

**❌ Si ves FAIL:**
- Lee el mensaje de error específico
- Verifica que el código coincida con las reglas de negocio

### Paso 4.2 - Ejecutar Tests con Coverage

```bash
npm run test:cov
```

**✅ Deberías ver:**
```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
----------|---------|----------|---------|---------|

Test Suites: 3 passed, 3 total
Tests:       XX passed, XX total
```

### Paso 4.3 - Ejecutar Tests en Modo Watch

```bash
npm run test:watch
```

Esto mantiene los tests corriendo y los re-ejecuta cuando cambias código.

Presiona `q` para salir.

---

## PARTE 5: Pruebas E2E (End-to-End)

### Paso 5.1 - Preparar Base de Datos de Test

```bash
# Crear base de datos de test (si no existe)
DATABASE_URL="postgresql://user:pass@localhost:5432/trabix_test" npx prisma migrate deploy
```

### Paso 5.2 - Ejecutar Tests E2E

```bash
npm run test:e2e
```

**✅ Deberías ver:**
```
 PASS  test/e2e/auth.e2e-spec.ts (X.XXXs)
  Auth Module
    POST /auth/login
      ✓ should login successfully with valid credentials
      ✓ should fail with invalid credentials
    POST /auth/refresh
      ✓ should refresh token successfully

 PASS  test/e2e/lote-flow.e2e-spec.ts (X.XXXs)
  Lote Flow E2E
    Complete lote lifecycle
      ✓ should create and activate lote
      ✓ should handle tanda transitions

Test Suites: 2 passed, 2 total
Tests:       X passed, X total
```

**❌ Si ves errores de conexión:**
- Asegúrate de que la base de datos de test existe
- Verifica las variables de entorno para test

---

## PARTE 6: Flujo de Prueba Manual Completo

Sigue este flujo para probar la app de principio a fin:

### 6.1 - Login como Admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"ADMIN001","password":"Admin123!"}'
```

Guarda el `accessToken` como `$ADMIN_TOKEN`

### 6.2 - Crear un Lote para el Vendedor Carlos

```bash
# Primero obtén el ID de Carlos
curl http://localhost:3000/api/v1/usuarios?cedula=1234567890 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Guarda el ID como $VENDEDOR_ID

# Crear lote de 50 TRABIX
curl -X POST http://localhost:3000/api/v1/lotes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vendedorId\":\"$VENDEDOR_ID\",\"cantidadTrabix\":50}"
```

**✅ Deberías ver:**
```json
{
  "id": "...",
  "vendedorId": "...",
  "cantidadTrabix": 50,
  "estado": "CREADO",
  "tandas": [
    { "numero": 1, "stockInicial": 25, "estado": "INACTIVA" },
    { "numero": 2, "stockInicial": 25, "estado": "INACTIVA" }
  ]
}
```

### 6.3 - Activar el Lote

```bash
curl -X POST http://localhost:3000/api/v1/lotes/$LOTE_ID/activar \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**✅ Deberías ver:**
- Lote estado: `ACTIVO`
- Tanda 1 estado: `LIBERADA`
- Fondo de recompensas incrementado

### 6.4 - Login como Vendedor

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"1234567890","password":"Temporal123!"}'
```

Guarda el `accessToken` como `$VENDEDOR_TOKEN`

### 6.5 - Registrar una Venta

```bash
curl -X POST http://localhost:3000/api/v1/ventas \
  -H "Authorization: Bearer $VENDEDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: venta-test-001" \
  -d '{"detalle":[{"tipo":"UNIDAD","cantidad":5}]}'
```

**✅ Deberías ver:**
```json
{
  "id": "...",
  "estado": "PENDIENTE",
  "montoTotal": 40000,
  "detalle": [{"tipo":"UNIDAD","cantidad":5}]
}
```

### 6.6 - Aprobar Venta (como Admin)

```bash
curl -X POST http://localhost:3000/api/v1/ventas/$VENTA_ID/aprobar \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**✅ Deberías ver:**
- Venta estado: `APROBADA`
- Stock de tanda reducido

---

## PARTE 7: Verificaciones Finales

### 7.1 - Verificar Stock Admin

```bash
curl http://localhost:3000/api/v1/admin/stock \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.2 - Verificar Fondo de Recompensas

```bash
curl http://localhost:3000/api/v1/fondo-recompensas/saldo \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.3 - Verificar Dashboard

```bash
curl http://localhost:3000/api/v1/admin/dashboard/resumen \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Iniciar app en desarrollo |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con coverage |
| `npm run test:e2e` | Tests end-to-end |
| `npx prisma studio` | Abrir UI de base de datos |
| `npx prisma db seed` | Ejecutar seeds |

---

## Checklist Final

- [ ] PostgreSQL corriendo
- [ ] Redis corriendo
- [ ] Seeds ejecutados (base + test-scenarios)
- [ ] App iniciada sin errores
- [ ] Health check responde OK
- [ ] Login admin funciona
- [ ] Tests unitarios pasan
- [ ] Tests E2E pasan
- [ ] Flujo manual completo funciona

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Verificar conexión
psql -h localhost -U tu_usuario -d trabix_db -c "SELECT 1"
```

### "Redis connection refused"
```bash
# Verificar Redis
redis-cli ping
# Debe responder: PONG
```

### "Module not found"
```bash
npm install
npx prisma generate
```

### "Tests timeout"
```bash
# Aumentar timeout en jest.config.js
testTimeout: 30000
```

### "Port already in use"
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>
```
