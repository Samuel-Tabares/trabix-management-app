# 🧪 GUÍA COMPLETA DE TESTING - TRABIX BACKEND

## 📋 ÍNDICE
1. [Configuración del Entorno](#1-configuración-del-entorno)
2. [Tests Unitarios](#2-tests-unitarios)
3. [Tests de Integración](#3-tests-de-integración)
4. [Tests E2E](#4-tests-e2e)
5. [Escenarios de Prueba Completos](#5-escenarios-de-prueba-completos)
6. [Métricas y Cobertura](#6-métricas-y-cobertura)
7. [Checklist de Verificación](#7-checklist-de-verificación)

---

## 1. CONFIGURACIÓN DEL ENTORNO

### 1.1 Requisitos Previos
```bash
# Versiones requeridas
Node.js >= 18.x
PostgreSQL >= 14
Redis >= 6
Docker (opcional pero recomendado)
```

### 1.2 Configurar Base de Datos de Testing
```bash
# Crear archivo .env.test
cp .env.example .env.test

# Editar .env.test con:
DATABASE_URL="postgresql://postgres:password@localhost:5432/trabix_test"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="test-secret-key-very-long-and-secure"
JWT_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"
NODE_ENV="test"
```

### 1.3 Iniciar Servicios con Docker
```bash
# Crear docker-compose.test.yml
docker-compose -f docker-compose.test.yml up -d

# O iniciar servicios manualmente:
# PostgreSQL
docker run -d --name trabix-postgres-test \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=trabix_test \
  -p 5432:5432 postgres:14

# Redis
docker run -d --name trabix-redis-test \
  -p 6379:6379 redis:6-alpine
```

### 1.4 Preparar Base de Datos
```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones en DB de test
DATABASE_URL="postgresql://postgres:password@localhost:5432/trabix_test" npx prisma migrate deploy

# Ejecutar seeds
DATABASE_URL="postgresql://postgres:password@localhost:5432/trabix_test" npx ts-node prisma/seeds/admin.seed.ts
```

### 1.5 Comandos de Testing
```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en modo watch
npm run test:watch

# Test específico
npm run test -- --testPathPattern="lotes"
```

---

## 2. TESTS UNITARIOS

### 2.1 Domain Services a Testear

#### LoteService (src/modules/lotes/domain)
```typescript
// Tests requeridos:
describe('LoteEntity', () => {
  // Creación
  it('debe crear lote con 2 tandas (6-10 TRABIX)')
  it('debe crear lote con 3 tandas (11-20 TRABIX)')
  it('debe rechazar cantidad < 6 TRABIX')
  it('debe rechazar cantidad > 20 TRABIX')
  
  // Distribución de tandas
  it('debe distribuir 6 TRABIX en 2 tandas: T1=3, T2=3')
  it('debe distribuir 10 TRABIX en 2 tandas: T1=5, T2=5')
  it('debe distribuir 11 TRABIX en 3 tandas: T1=4, T2=4, T3=3')
  it('debe distribuir 15 TRABIX en 3 tandas: T1=5, T2=5, T3=5')
  it('debe distribuir 20 TRABIX en 3 tandas: T1=7, T2=7, T3=6')
  
  // Cálculos de inversión
  it('debe calcular inversión total correctamente')
  it('debe calcular inversión vendedor (50%)')
  it('debe calcular inversión admin (50%)')
  
  // Estados
  it('debe transicionar PENDIENTE -> ACTIVO al activar')
  it('no debe permitir activar lote ya activo')
});
```

#### TandaEntity (src/modules/lotes/domain)
```typescript
describe('TandaEntity', () => {
  // Estados
  it('debe transicionar INACTIVA -> LIBERADA')
  it('debe transicionar LIBERADA -> EN_TRANSITO')
  it('debe transicionar EN_TRANSITO -> EN_CASA')
  it('debe transicionar EN_CASA -> FINALIZADA')
  it('no debe permitir transiciones inválidas')
  
  // Stock
  it('debe decrementar stock correctamente')
  it('no debe permitir stock negativo')
  it('debe calcular porcentaje de stock')
});
```

#### VentaService (src/modules/ventas/domain)
```typescript
describe('VentaEntity', () => {
  // Validaciones
  it('debe rechazar venta si tanda no está EN_CASA')
  it('debe rechazar venta si stock insuficiente')
  it('debe rechazar regalo si excede 8% de tanda')
  
  // Cálculos de precio
  it('debe calcular precio PROMO ($12,000 por 2)')
  it('debe calcular precio UNIDAD con licor ($8,000)')
  it('debe calcular precio UNIDAD sin licor ($7,000)')
  it('debe calcular correctamente venta mixta')
  
  // Ganancia
  it('debe calcular ganancia vendedor (60%)')
  it('debe calcular ganancia admin (40%)')
  
  // Estados
  it('debe transicionar PENDIENTE -> APROBADA')
  it('debe transicionar PENDIENTE -> RECHAZADA')
});
```

#### CuadreService (src/modules/cuadres/domain)
```typescript
describe('CuadreEntity', () => {
  // Trigger de cuadre (3 tandas)
  it('debe activar cuadre T2 al 10% de stock')
  it('debe activar cuadre T3 al 20% de stock')
  
  // Trigger de cuadre (2 tandas)
  it('debe activar cuadre T1 al 10% de stock')
  it('debe activar cuadre T2 al 20% de stock')
  
  // Cálculos
  it('debe calcular monto esperado correctamente')
  it('debe validar monto recibido vs esperado')
  
  // Estados
  it('debe transicionar INACTIVO -> PENDIENTE')
  it('debe transicionar PENDIENTE -> EXITOSO')
});
```

### 2.2 Strategies a Testear

#### DistribucionTandasStrategy
```typescript
describe('DistribucionTandasStrategy', () => {
  // 2 tandas
  it('6 TRABIX -> [3, 3]')
  it('7 TRABIX -> [4, 3]')
  it('8 TRABIX -> [4, 4]')
  it('9 TRABIX -> [5, 4]')
  it('10 TRABIX -> [5, 5]')
  
  // 3 tandas
  it('11 TRABIX -> [4, 4, 3]')
  it('12 TRABIX -> [4, 4, 4]')
  it('15 TRABIX -> [5, 5, 5]')
  it('17 TRABIX -> [6, 6, 5]')
  it('20 TRABIX -> [7, 7, 6]')
});
```

#### TriggerCuadreStrategy
```typescript
describe('TriggerCuadreStrategy', () => {
  // 3 tandas - T1 no tiene trigger, T2 al 10%, T3 al 20%
  it('T1 con 3 tandas: sin trigger automático')
  it('T2 con 3 tandas: trigger al 10% de stock')
  it('T3 con 3 tandas: trigger al 20% de stock')
  
  // 2 tandas - T1 al 10%, T2 al 20%
  it('T1 con 2 tandas: trigger al 10% de stock')
  it('T2 con 2 tandas: trigger al 20% de stock')
});
```

#### CalculoPrecioStrategy
```typescript
describe('CalculoPrecioStrategy', () => {
  // Venta normal
  it('1 PROMO = $12,000')
  it('2 PROMO = $24,000')
  it('1 UNIDAD con licor = $8,000')
  it('1 UNIDAD sin licor = $7,000')
  it('1 PROMO + 1 UNIDAD con licor = $20,000')
  
  // Venta al mayor
  it('>20 con licor = $4,900 c/u')
  it('>50 con licor = $4,700 c/u')
  it('>100 con licor = $4,500 c/u')
  it('>20 sin licor = $4,800 c/u')
  it('>50 sin licor = $4,500 c/u')
  it('>100 sin licor = $4,200 c/u')
});
```

---

## 3. TESTS DE INTEGRACIÓN

### 3.1 Repository Tests

```typescript
describe('LoteRepository', () => {
  it('debe crear lote con tandas')
  it('debe buscar lote por ID con relaciones')
  it('debe listar lotes por vendedor')
  it('debe actualizar estado de lote')
});

describe('VentaRepository', () => {
  it('debe crear venta')
  it('debe buscar ventas por tanda')
  it('debe actualizar estado de venta')
  it('debe calcular totales por período')
});

describe('CuadreRepository', () => {
  it('debe crear cuadre para tanda')
  it('debe buscar cuadres pendientes')
  it('debe actualizar estado de cuadre')
});

describe('ConfiguracionRepository', () => {
  it('debe obtener configuración por clave')
  it('debe actualizar configuración')
  it('debe registrar historial de cambios')
});
```

---

## 4. TESTS E2E

### 4.1 Flujo de Autenticación
```bash
# POST /auth/login - Credenciales válidas
# POST /auth/login - Credenciales inválidas
# POST /auth/refresh - Token válido
# POST /auth/refresh - Token expirado
# POST /auth/logout - Cerrar sesión
# POST /auth/cambiar-password - Cambio exitoso
```

### 4.2 Flujo Completo de Lote (CRÍTICO)
```
1. Admin crea vendedor
2. Admin crea lote para vendedor (10 TRABIX)
3. Admin activa lote (pago de inversión)
4. Sistema libera T1 automáticamente
5. Sistema crea cuadres para cada tanda
6. Sistema crea mini-cuadre
7. Admin confirma entrega de T1 (EN_CASA)
8. Vendedor registra ventas
9. Admin aprueba ventas
10. Sistema activa cuadre T2 (trigger 10%)
11. Admin confirma cuadre T1
12. Sistema libera T2
... continúa hasta finalizar lote
```

### 4.3 Flujo de Venta al Mayor (CRÍTICO)
```
1. Admin crea lote forzado
2. Vendedor registra venta al mayor (>20 unidades)
3. Sistema afecta múltiples tandas
4. Admin completa venta al mayor
5. Sistema crea cuadre al mayor
6. Admin confirma cuadre al mayor
7. Sistema cierra cuadres normales afectados
8. Sistema alimenta fondo de recompensas
```

---

## 5. ESCENARIOS DE PRUEBA COMPLETOS

### 5.1 ESCENARIO: Ciclo Completo de Lote 10 TRABIX

| Paso | Acción | Endpoint | Datos | Resultado Esperado |
|------|--------|----------|-------|-------------------|
| 1 | Login Admin | POST /auth/login | cedula, password | token JWT |
| 2 | Crear Vendedor | POST /usuarios | nombre, cedula, email, telefono | vendedor creado |
| 3 | Crear Lote | POST /lotes | vendedorId, cantidadTrabix: 10, modeloNegocio: 60_40 | lote PENDIENTE |
| 4 | Activar Lote | POST /lotes/:id/activar | {} | lote ACTIVO, T1 LIBERADA |
| 5 | Verificar Tandas | GET /tandas/lote/:loteId | | 2 tandas: T1=5, T2=5 |
| 6 | Verificar Cuadres | GET /cuadres?loteId=:id | | 2 cuadres INACTIVO |
| 7 | Esperar 2h o forzar | - | | T1 EN_TRANSITO |
| 8 | Confirmar Entrega | POST /tandas/:id/confirmar-entrega | {} | T1 EN_CASA |
| 9 | Registrar Venta | POST /ventas | tandaId, cantidadPromo: 2, cantidadUnidad: 1 | venta PENDIENTE |
| 10 | Aprobar Venta | POST /ventas/:id/aprobar | {} | venta APROBADA |
| 11 | Verificar Stock | GET /tandas/:id | | stock decrementado |
| 12 | Registrar más ventas | POST /ventas | hasta stock ≤ 10% | cuadre T2 PENDIENTE |
| 13 | Confirmar Cuadre T1 | POST /cuadres/:id/confirmar | montoRecibido | cuadre EXITOSO |
| 14 | Verificar T2 | GET /tandas/:id | | T2 LIBERADA |
| ... | Continuar | ... | ... | ... |

### 5.2 ESCENARIO: Distribución de Tandas

| TRABIX | Tandas | Distribución | Inversión Total | Inversión Vendedor |
|--------|--------|--------------|-----------------|-------------------|
| 6 | 2 | [3, 3] | $14,400 | $7,200 |
| 7 | 2 | [4, 3] | $16,800 | $8,400 |
| 8 | 2 | [4, 4] | $19,200 | $9,600 |
| 9 | 2 | [5, 4] | $21,600 | $10,800 |
| 10 | 2 | [5, 5] | $24,000 | $12,000 |
| 11 | 3 | [4, 4, 3] | $26,400 | $13,200 |
| 12 | 3 | [4, 4, 4] | $28,800 | $14,400 |
| 13 | 3 | [5, 4, 4] | $31,200 | $15,600 |
| 14 | 3 | [5, 5, 4] | $33,600 | $16,800 |
| 15 | 3 | [5, 5, 5] | $36,000 | $18,000 |
| 16 | 3 | [6, 5, 5] | $38,400 | $19,200 |
| 17 | 3 | [6, 6, 5] | $40,800 | $20,400 |
| 18 | 3 | [6, 6, 6] | $43,200 | $21,600 |
| 19 | 3 | [7, 6, 6] | $45,600 | $22,800 |
| 20 | 3 | [7, 7, 6] | $48,000 | $24,000 |

### 5.3 ESCENARIO: Cálculo de Precios

| Tipo Venta | Cantidad | Con Licor | Precio Unit | Total |
|------------|----------|-----------|-------------|-------|
| PROMO | 1 | Sí | $12,000 | $12,000 |
| PROMO | 2 | Sí | $12,000 | $24,000 |
| UNIDAD | 1 | Sí | $8,000 | $8,000 |
| UNIDAD | 1 | No | $7,000 | $7,000 |
| MAYOR >20 | 25 | Sí | $4,900 | $122,500 |
| MAYOR >50 | 60 | Sí | $4,700 | $282,000 |
| MAYOR >100 | 120 | Sí | $4,500 | $540,000 |
| MAYOR >20 | 25 | No | $4,800 | $120,000 |
| MAYOR >50 | 60 | No | $4,500 | $270,000 |
| MAYOR >100 | 120 | No | $4,200 | $504,000 |

### 5.4 ESCENARIO: Triggers de Cuadre

#### Lote de 10 TRABIX (2 tandas: T1=5, T2=5)
| Tanda | Stock Inicial | Trigger % | Stock Trigger | Cuadre |
|-------|---------------|-----------|---------------|--------|
| T1 | 5 | 10% | ≤ 0.5 (1) | T2 |
| T2 | 5 | 20% | ≤ 1 | Mini-cuadre |

#### Lote de 15 TRABIX (3 tandas: T1=5, T2=5, T3=5)
| Tanda | Stock Inicial | Trigger % | Stock Trigger | Cuadre |
|-------|---------------|-----------|---------------|--------|
| T1 | 5 | - | - | Manual |
| T2 | 5 | 10% | ≤ 0.5 (1) | T3 |
| T3 | 5 | 20% | ≤ 1 | Mini-cuadre |

### 5.5 ESCENARIO: Venta al Mayor Multi-Tanda

```
Situación: Venta de 50 unidades afectando 3 tandas
- T1: 20 disponibles -> consume 20
- T2: 20 disponibles -> consume 20
- T3: 20 disponibles -> consume 10

Resultado:
- Se crea 1 VentaMayor
- Se crean 3 DetalleVentaMayor
- Se crea 1 CuadreMayor
- Precio: 50 x $4,700 = $235,000
```

### 5.6 ESCENARIO: Equipamiento

| Estado | Acción | Siguiente Estado | Cobro |
|--------|--------|------------------|-------|
| - | Solicitar | SOLICITADO | - |
| SOLICITADO | Activar con depósito | ACTIVO | $49,990 + $9,990/mes |
| SOLICITADO | Activar sin depósito | ACTIVO | $19,990/mes |
| ACTIVO | Pagar mensualidad | ACTIVO | Variable |
| ACTIVO | Reportar daño nevera | ACTIVO | $30,000 |
| ACTIVO | Reportar daño pijama | ACTIVO | $60,000 |
| ACTIVO | Reportar pérdida total | PERDIDO | $90,000 |
| ACTIVO | Devolver | DEVUELTO | -$49,990 (si hay depósito) |

### 5.7 ESCENARIO: Fondo de Recompensas

| Evento | Entrada | Monto por TRABIX | Ejemplo 10 TRABIX |
|--------|---------|------------------|-------------------|
| Lote Activado | Sí | $200 | $2,000 |
| Cuadre Mayor (lote forzado) | Sí | $200 | Variable |
| Salida Admin | No | Manual | Manual |

---

## 6. MÉTRICAS Y COBERTURA

### 6.1 Métricas Objetivo
```
Cobertura de código:
- Statements: >= 80%
- Branches: >= 75%
- Functions: >= 80%
- Lines: >= 80%

Métricas de calidad:
- Tests unitarios: 100% de domain services
- Tests integración: 100% de repositories
- Tests e2e: 100% de flujos críticos
```

### 6.2 Comando de Cobertura
```bash
npm run test:cov

# Salida esperada:
# -------------------------|---------|----------|---------|---------|
# File                     | % Stmts | % Branch | % Funcs | % Lines |
# -------------------------|---------|----------|---------|---------|
# All files                |   85.23 |    78.45 |   82.11 |   84.89 |
# -------------------------|---------|----------|---------|---------|
```

---

## 7. CHECKLIST DE VERIFICACIÓN

### 7.1 Health Check
- [ ] GET /health retorna 200 y status OK
- [ ] GET /health/db retorna estado de PostgreSQL
- [ ] GET /health/redis retorna estado de Redis

### 7.2 Autenticación
- [ ] POST /auth/login - credenciales válidas retorna tokens
- [ ] POST /auth/login - credenciales inválidas retorna 401
- [ ] POST /auth/refresh - renueva access token
- [ ] POST /auth/logout - invalida tokens
- [ ] POST /auth/cambiar-password - cambia contraseña

### 7.3 Usuarios
- [ ] POST /usuarios - admin puede crear vendedor
- [ ] POST /usuarios - vendedor NO puede crear vendedor
- [ ] GET /usuarios - lista vendedores
- [ ] GET /usuarios/me - obtiene perfil propio
- [ ] PATCH /usuarios/:id - actualiza vendedor
- [ ] PATCH /usuarios/:id/estado - cambia estado
- [ ] DELETE /usuarios/:id - elimina vendedor (soft delete)
- [ ] GET /usuarios/:id/jerarquia - obtiene árbol

### 7.4 Lotes
- [ ] POST /lotes - crea lote con tandas correctas
- [ ] POST /lotes - rechaza < 6 o > 20 TRABIX
- [ ] POST /lotes/:id/activar - activa y libera T1
- [ ] POST /lotes/:id/activar - crea cuadres
- [ ] POST /lotes/:id/activar - crea mini-cuadre
- [ ] POST /lotes/:id/activar - registra entrada en fondo
- [ ] GET /lotes/:id/resumen-financiero - calcula correctamente

### 7.5 Tandas
- [ ] Transición automática LIBERADA -> EN_TRANSITO (2h)
- [ ] POST /tandas/:id/confirmar-entrega -> EN_CASA
- [ ] Stock se decrementa correctamente
- [ ] No permite stock negativo

### 7.6 Ventas
- [ ] POST /ventas - valida tanda EN_CASA
- [ ] POST /ventas - valida stock suficiente
- [ ] POST /ventas - valida límite regalos (8%)
- [ ] POST /ventas/:id/aprobar - actualiza stock
- [ ] POST /ventas/:id/aprobar - actualiza recaudado
- [ ] POST /ventas/:id/aprobar - dispara trigger cuadre
- [ ] Cálculo de precios correcto

### 7.7 Ventas al Mayor
- [ ] POST /ventas-mayor - consume de múltiples tandas
- [ ] POST /ventas-mayor - crea lote forzado si necesario
- [ ] POST /ventas-mayor/:id/completar - crea cuadre mayor
- [ ] Precios escalonados correctos

### 7.8 Cuadres
- [ ] Trigger automático al % correcto
- [ ] POST /cuadres/:id/confirmar - libera siguiente tanda
- [ ] POST /cuadres/:id/confirmar - actualiza dinero transferido

### 7.9 Mini-Cuadres
- [ ] POST /mini-cuadres/:id/confirmar - finaliza lote
- [ ] Cálculo de monto final correcto

### 7.10 Equipamiento
- [ ] Flujo completo de solicitud a devolución
- [ ] Cobros correctos por daños
- [ ] Devolución de depósito

### 7.11 Fondo de Recompensas
- [ ] Entrada automática al activar lote
- [ ] Entrada automática en lotes forzados
- [ ] Salida manual por admin
- [ ] No permite saldo negativo

### 7.12 Notificaciones
- [ ] Se envían en todos los eventos especificados
- [ ] WebSocket funciona correctamente

### 7.13 Admin
- [ ] CRUD Pedidos de Stock
- [ ] Cálculo de costo real por TRABIX
- [ ] CRUD Configuraciones con historial
- [ ] CRUD Tipos de Insumo
- [ ] Dashboard con métricas correctas

### 7.14 Jobs Programados
- [ ] TandaAutoTransitJob cada 5 minutos
- [ ] CleanupExpiredTokensJob cada 1 hora
- [ ] CleanupProcessedOutboxJob cada 24 horas
- [ ] CleanupExpiredIdempotencyKeysJob cada 1 hora

---

## 📌 COMANDOS RÁPIDOS

```bash
# Levantar entorno de test
docker-compose -f docker-compose.test.yml up -d

# Ejecutar migraciones
npm run prisma:migrate:test

# Ejecutar seeds
npm run seed:test

# Correr todos los tests
npm test

# Correr tests con cobertura
npm run test:cov

# Correr tests e2e
npm run test:e2e

# Correr test específico
npm test -- --grep "LoteEntity"

# Ver reporte de cobertura
open coverage/lcov-report/index.html
```

---

## 🚨 CASOS EDGE A VERIFICAR

1. **Venta que agota exactamente el stock** - debe activar trigger
2. **Regalo que excede 8%** - debe rechazar
3. **Venta mayor que excede stock total disponible** - debe rechazar
4. **Cuadre con monto diferente al esperado** - verificar tolerancia
5. **Transición de tanda en paralelo** - verificar optimistic locking
6. **Múltiples instancias procesando mismo job** - verificar idempotencia
7. **Token expirado durante operación larga** - verificar refresh
8. **Configuración modificada durante operación** - usa valor al momento de crear

