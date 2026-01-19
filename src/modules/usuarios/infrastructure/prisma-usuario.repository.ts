import { Injectable } from '@nestjs/common';
import { Usuario, EstadoUsuario, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure';
import {
    IUsuarioRepository,
    FindAllUsuariosOptions,
    PaginatedUsuarios,
    CreateUsuarioData,
    UpdateUsuarioData,
    CountUsuariosOptions,
    UsuarioJerarquia,
} from '../domain/usuario.repository.interface';


/**
 * Implementación del repositorio de usuarios con Prisma
 * Según Clean Architecture: infraestructura implementa interfaces de dominio
 */
@Injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByCedula(cedula: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { cedula },
    });
  }

  async findByTelefono(telefono: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { telefono },
    });
  }

  async findAll(options: FindAllUsuariosOptions): Promise<PaginatedUsuarios> {
    const {
      skip = 0,
      take = 20,
      cursor,
      where = {},
      orderBy,
      includeReclutador = false,
    } = options;

    // Construir condiciones de búsqueda
    const whereCondition: Prisma.UsuarioWhereInput = {
      eliminado: where.eliminado ?? false,
    };

    if (where.rol) {
      whereCondition.rol = where.rol;
    }

    if (where.estado) {
      whereCondition.estado = where.estado;
    }

    if (where.reclutadorId !== undefined) {
      whereCondition.reclutadorId = where.reclutadorId;
    }

    // Búsqueda por texto
    if (where.search) {
      whereCondition.OR = [
        { nombre: { contains: where.search, mode: 'insensitive' } },
        { apellidos: { contains: where.search, mode: 'insensitive' } },
        { email: { contains: where.search, mode: 'insensitive' } },
        { cedula: { contains: where.search } },
      ];
    }

    // Ordenamiento
    const orderByCondition: Prisma.UsuarioOrderByWithRelationInput = orderBy
      ? { [orderBy.field]: orderBy.direction }
      : { fechaCreacion: 'desc' };

    // Configuración de cursor pagination
    const queryOptions: Prisma.UsuarioFindManyArgs = {
      where: whereCondition,
      orderBy: orderByCondition,
      take: take + 1, // +1 para saber si hay más
      include: includeReclutador ? { reclutador: true } : undefined,
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor
    } else {
      queryOptions.skip = skip;
    }

    // Ejecutar queries en paralelo
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany(queryOptions),
      this.prisma.usuario.count({ where: whereCondition }),
    ]);

    // Determinar si hay más resultados
    const hasMore = usuarios.length > take;
    if (hasMore) {
      usuarios.pop(); // Remover el elemento extra
    }

    return {
      data: usuarios,
      total,
      hasMore,
      nextCursor: hasMore ? usuarios.at(-1)?.id : undefined,
    };
  }

  async findReclutados(reclutadorId: string): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      where: {
        reclutadorId,
        eliminado: false,
      },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async findJerarquia(usuarioId: string): Promise<UsuarioJerarquia> {
    const buildJerarquia = async (
      id: string,
      nivel: number = 0,
    ): Promise<UsuarioJerarquia> => {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
      });

      if (!usuario) {
        throw new Error(`Usuario ${id} no encontrado`);
      }

      const reclutadosDirectos = await this.prisma.usuario.findMany({
        where: {
          reclutadorId: id,
          eliminado: false,
        },
        orderBy: { fechaCreacion: 'desc' },
      });

      const reclutadosJerarquia = await Promise.all(
        reclutadosDirectos.map((r) => buildJerarquia(r.id, nivel + 1)),
      );

      const totalReclutados = reclutadosDirectos.length +
        reclutadosJerarquia.reduce((sum, r) => sum + r.totalReclutados, 0);

      return {
        usuario,
        reclutados: reclutadosJerarquia,
        totalReclutados,
        nivel,
      };
    };

    return buildJerarquia(usuarioId);
  }

  async findCadenaReclutadores(usuarioId: string): Promise<Usuario[]> {
    const cadena: Usuario[] = [];
    let currentId: string | null = usuarioId;

    while (currentId) {
      const usuario: any = await this.prisma.usuario.findUnique({
        where: { id: currentId },
      });

      if (!usuario) break;

      // No incluir el usuario inicial en la cadena
      if (usuario.id !== usuarioId) {
        cadena.push(usuario);
      }

      currentId = usuario.reclutadorId;
    }

    return cadena;
  }

  async create(data: CreateUsuarioData): Promise<Usuario> {
    return this.prisma.usuario.create({
      data: {
        cedula: data.cedula,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email.toLowerCase(),
        telefono: data.telefono,
        passwordHash: data.passwordHash,
        requiereCambioPassword: true, // Siempre true al crear
        rol: data.rol ?? 'VENDEDOR',
        estado: 'ACTIVO',
        reclutadorId: data.reclutadorId ?? null,
      },
    });
  }

  async update(id: string, data: UpdateUsuarioData): Promise<Usuario> {
    const updateData: Prisma.UsuarioUpdateInput = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellidos !== undefined) updateData.apellidos = data.apellidos;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.requiereCambioPassword !== undefined) {
      updateData.requiereCambioPassword = data.requiereCambioPassword;
    }
    if (data.refreshTokenHash !== undefined) {
      updateData.refreshTokenHash = data.refreshTokenHash;
    }
    if (data.intentosFallidos !== undefined) {
      updateData.intentosFallidos = data.intentosFallidos;
    }
    if (data.bloqueadoHasta !== undefined) {
      updateData.bloqueadoHasta = data.bloqueadoHasta;
    }
    if (data.ultimoLogin !== undefined) {
      updateData.ultimoLogin = data.ultimoLogin;
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });
  }

  async cambiarEstado(id: string, estado: EstadoUsuario): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado,
        fechaCambioEstado: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        eliminado: true,
        fechaEliminacion: new Date(),
        estado: 'INACTIVO',
        fechaCambioEstado: new Date(),
      },
    });
  }

  async count(options?: CountUsuariosOptions): Promise<number> {
    const where: Prisma.UsuarioWhereInput = {
      eliminado: options?.eliminado ?? false,
    };

    if (options?.rol) where.rol = options.rol;
    if (options?.estado) where.estado = options.estado;
    if (options?.reclutadorId) where.reclutadorId = options.reclutadorId;

    return this.prisma.usuario.count({ where });
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UsuarioWhereInput = {
      email: email.toLowerCase(),
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.usuario.count({ where });
    return count > 0;
  }

  async existsByCedula(cedula: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UsuarioWhereInput = { cedula };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.usuario.count({ where });
    return count > 0;
  }

  async existsByTelefono(telefono: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UsuarioWhereInput = { telefono };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.usuario.count({ where });
    return count > 0;
  }
}
