# Configuración Local del Proyecto TRABIX Backend

## Requisitos Previos

- Node.js >= 18.x
- PostgreSQL 16
- Redis 7
- npm o yarn

## Pasos de Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Generar cliente de Prisma

```bash
npx prisma generate
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/trabix_db"
JWT_SECRET="tu-jwt-secret-seguro"
JWT_REFRESH_SECRET="tu-refresh-secret-seguro"
REDIS_URL="redis://localhost:6379"
```

### 4. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 5. Ejecutar seed (opcional)

```bash
npx prisma db seed
```

### 6. Iniciar en modo desarrollo

```bash
npm run start:dev
```

## Solución de Problemas Comunes

### Error: "Property has no initializer"

Esto es normal con DTOs de NestJS que usan class-validator. Si necesitas suprimir estos errores temporalmente, puedes:

1. Agregar `!` después de las propiedades en los DTOs:
   ```typescript
   @ApiProperty()
   id!: string;
   ```

2. O en `tsconfig.json`, agregar:
   ```json
   {
     "compilerOptions": {
       "strictPropertyInitialization": false
     }
   }
   ```

### Error: Cannot find module '@prisma/client'

Ejecutar:
```bash
npx prisma generate
```

### Error con bcrypt nativo

El proyecto usa `bcryptjs` (implementación JavaScript pura) en lugar de `bcrypt` nativo para evitar problemas de compilación.

## Estructura del Proyecto

```
src/
├── modules/         # 13 módulos de negocio (toda la lógica aquí)
│   ├── auth/
│   ├── usuarios/
│   ├── lotes/
│   ├── ventas/
│   ├── cuadres/
│   ├── ventas-mayor/
│   ├── cuadres-mayor/
│   ├── mini-cuadres/
│   ├── equipamiento/
│   ├── fondo-recompensas/
│   ├── notificaciones/
│   ├── admin/
│   └── health/
├── domain/          # Clases base compartidas, value objects, excepciones
├── application/     # Clases base para CQRS
├── infrastructure/  # Database, cache, events, queues
├── presentation/    # HTTP filters, guards, interceptors
├── config/          # Configuración de la aplicación
└── shared/          # Utilidades compartidas
```

## Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
npm run test:cov

# Prisma
npx prisma studio    # UI para ver/editar datos
npx prisma migrate   # Crear migración
npx prisma generate  # Regenerar cliente
```
