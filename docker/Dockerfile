# ===========================================
# TRABIX Backend - Dockerfile (Production)
# Multi-stage build optimizado
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Generar cliente de Prisma
RUN npx prisma generate

# ===========================================

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ===========================================

# Stage 3: Production
FROM node:20-alpine AS production

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copiar dependencias de producción desde stage 1
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copiar código compilado desde stage 2
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Cambiar propietario de archivos
RUN chown -R nestjs:nodejs /app

# Usar usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
