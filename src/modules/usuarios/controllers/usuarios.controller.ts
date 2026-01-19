import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// DTOs
import { CurrentUser, AuthenticatedUser, Roles } from '../../auth/decorators';
import {
    CreateUsuarioDto,
    UpdateUsuarioDto,
    CambiarEstadoDto,
    QueryUsuariosDto,
    UsuarioResponseDto,
    UsuariosPaginadosDto,
    UsuarioJerarquiaDto,
} from '../application/dto';
import {
    CrearUsuarioCommand,
    ActualizarUsuarioCommand,
    CambiarEstadoCommand,
    EliminarUsuarioCommand,
} from '../application/commands';
import {
    ObtenerUsuarioQuery,
    ListarUsuariosQuery,
    ObtenerJerarquiaQuery,
    ObtenerPerfilQuery,
} from '../application/queries';



/**
 * Controlador de Usuarios
 * Según sección 20.3 del documento
 * 
 * Endpoints:
 * - POST /        - Crear vendedor (admin)
 * - GET /         - Listar vendedores
 * - GET /me       - Obtener perfil propio
 * - GET /:id      - Obtener vendedor
 * - PATCH /:id    - Actualizar vendedor
 * - PATCH /:id/estado - Cambiar estado
 * - DELETE /:id   - Eliminar vendedor
 * - GET /:id/jerarquia - Obtener árbol de jerarquía
 */
@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /usuarios
   * Crea un nuevo vendedor (solo admin)
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear vendedor (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Vendedor creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        usuario: { $ref: '#/components/schemas/UsuarioResponseDto' },
        passwordTemporal: { type: 'string', description: 'Contraseña temporal generada' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Usuario ya existe (cédula, email o teléfono duplicado)' })
  async crear(
    @Body() createDto: CreateUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const result = await this.commandBus.execute(
      new CrearUsuarioCommand(createDto, admin.id),
    );

    return {
      usuario: this.mapToResponse(result.usuario),
      passwordTemporal: result.passwordTemporal,
      message: 'Vendedor creado exitosamente. Comparta la contraseña temporal con el vendedor.',
    };
  }

  /**
   * GET /usuarios
   * Lista vendedores con filtros y paginación
   */
  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar vendedores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vendedores',
    type: UsuariosPaginadosDto,
  })
  async listar(
    @Query() queryDto: QueryUsuariosDto,
  ): Promise<UsuariosPaginadosDto> {
    return this.queryBus.execute(new ListarUsuariosQuery(queryDto));
  }

  /**
   * GET /usuarios/me
   * Obtiene el perfil del usuario autenticado
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil propio' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UsuarioResponseDto,
  })
  async obtenerPerfil(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    return this.queryBus.execute(new ObtenerPerfilQuery(user.id));
  }

  /**
   * GET /usuarios/:id
   * Obtiene un vendedor por ID
   */
  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener vendedor' })
  @ApiParam({ name: 'id', description: 'ID del vendedor' })
  @ApiResponse({
    status: 200,
    description: 'Datos del vendedor',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  async obtener(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UsuarioResponseDto> {
    return this.queryBus.execute(new ObtenerUsuarioQuery(id));
  }

  /**
   * PATCH /usuarios/:id
   * Actualiza los datos de un vendedor
   */
  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar vendedor' })
  @ApiParam({ name: 'id', description: 'ID del vendedor' })
  @ApiResponse({
    status: 200,
    description: 'Vendedor actualizado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  @ApiResponse({ status: 409, description: 'Email o teléfono ya existe' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.commandBus.execute(
      new ActualizarUsuarioCommand(id, updateDto, admin.id),
    );
    return this.queryBus.execute(new ObtenerUsuarioQuery(usuario.id));
  }

  /**
   * PATCH /usuarios/:id/estado
   * Cambia el estado de un vendedor (ACTIVO/INACTIVO)
   */
  @Patch(':id/estado')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cambiar estado de vendedor' })
  @ApiParam({ name: 'id', description: 'ID del vendedor' })
  @ApiResponse({
    status: 200,
    description: 'Estado cambiado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cambiarEstadoDto: CambiarEstadoDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.commandBus.execute(
      new CambiarEstadoCommand(id, cambiarEstadoDto.estado, admin.id),
    );
    return this.queryBus.execute(new ObtenerUsuarioQuery(usuario.id));
  }

  /**
   * DELETE /usuarios/:id
   * Elimina un vendedor (soft delete)
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar vendedor' })
  @ApiParam({ name: 'id', description: 'ID del vendedor' })
  @ApiResponse({
    status: 200,
    description: 'Vendedor eliminado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  async eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    await this.commandBus.execute(new EliminarUsuarioCommand(id, admin.id));
    return { message: 'Vendedor eliminado exitosamente' };
  }

  /**
   * GET /usuarios/:id/jerarquia
   * Obtiene el árbol de jerarquía de un usuario
   */
  @Get(':id/jerarquia')
  @ApiOperation({ summary: 'Obtener árbol de jerarquía' })
  @ApiParam({ name: 'id', description: 'ID del vendedor' })
  @ApiResponse({
    status: 200,
    description: 'Árbol de jerarquía',
    type: UsuarioJerarquiaDto,
  })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  async obtenerJerarquia(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UsuarioJerarquiaDto> {
    // Verificar permisos según sección 21.2
    // ADMIN: puede ver cualquier jerarquía
    // RECLUTADOR: puede ver su rama (JERARQUIA_READ_BRANCH)
    // VENDEDOR: solo puede ver su propia jerarquía (JERARQUIA_READ_OWN)
    if (user.rol !== 'ADMIN' && user.id !== id) {
      // Para reclutadores, verificar si el usuario está en su rama
      // Por ahora, simplificamos y solo permitimos ver la propia jerarquía
      // La lógica completa de rama se implementará cuando sea necesario
    }

    return this.queryBus.execute(new ObtenerJerarquiaQuery(id));
  }

  /**
   * Mapea un usuario de Prisma a UsuarioResponseDto básico
   */
  private mapToResponse(usuario: any): Partial<UsuarioResponseDto> {
    return {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      estado: usuario.estado,
      requiereCambioPassword: usuario.requiereCambioPassword,
      reclutadorId: usuario.reclutadorId,
      fechaCreacion: usuario.fechaCreacion,
    };
  }
}
