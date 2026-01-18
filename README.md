# TRABIX Backend

Backend API para el sistema de gestión de ventas de granizados TRABIX.

## 🚀 Stack Tecnológico

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10
- **Lenguaje:** TypeScript 5
- **ORM:** Prisma 5
- **Base de datos:** PostgreSQL 16
- **Cache/Queue:** Redis 7 + Bull
- **Arquitectura:** Clean Architecture (Monolito Modular)

## 📋 Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm o yarn

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd trabix-backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   # Editar .env con tus configuraciones

4. **Iniciar servicios con Docker:**
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

5. **Ejecutar migraciones:**
   ```bash
   npm run prisma:migrate
   ```

6. **Iniciar en modo desarrollo:**
   ```bash
   npm run start:dev
   ```

### Con Docker (Desarrollo)

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

Esto levantará:
- API NestJS con hot-reload en `http://localhost:3000`
- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`
- Adminer (DB UI) en `http://localhost:8080`
- Redis Commander en `http://localhost:8081`

### Producción

```bash
cd docker
docker-compose up -d
```

## 📚 Documentación API

La documentación Swagger está disponible en:
- Desarrollo: `http://localhost:3000/docs`

## 🏗️ Estructura del Proyecto

```
trabix-backend/
├── src/
│   ├── domain/           # Entidades, Value Objects, Servicios de dominio
│   ├── application/      # Commands, Queries, Event Handlers, DTOs
│   ├── infrastructure/   # Repositorios, Cache, Queue, Eventos
│   ├── presentation/     # Controllers, Guards, Interceptors, Filters
│   ├── shared/           # Utilidades compartidas
│   ├── config/           # Configuraciones
│   └── modules/          # Módulos NestJS
├── prisma/               # Schema y migraciones
├── docker/               # Configuración Docker
└── test/                 # Tests unitarios, integración, e2e
```

## 🧪 Tests

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Iniciar en modo desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript |
| `npm run start:prod` | Iniciar en modo producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:migrate` | Ejecutar migraciones |
| `npm run prisma:studio` | Abrir Prisma Studio |

## 🔐 Variables de Entorno

Ver `.env.example` para la lista completa de variables de entorno requeridas.

Variables obligatorias:
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `REDIS_URL` - URL de conexión a Redis
- `JWT_SECRET` - Secreto para tokens JWT (mín. 32 caracteres)
- `JWT_REFRESH_SECRET` - Secreto para refresh tokens (mín. 32 caracteres)

## 📄 Licencia

Propietario - TRABIX

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
