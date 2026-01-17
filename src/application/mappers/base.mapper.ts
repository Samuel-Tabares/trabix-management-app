/**
 * Interfaces y clases base para Mappers
 * 
 * Los mappers transforman entre diferentes representaciones de datos:
 * - Entity → DTO (para respuestas)
 * - DTO → Entity (para comandos)
 * - Entity → Prisma Model (para persistencia)
 * - Prisma Model → Entity (desde persistencia)
 */

/**
 * Interfaz base para mappers Entity → DTO
 */
export interface IEntityMapper<TEntity, TDto> {
  toDto(entity: TEntity): TDto;
  toDtoList(entities: TEntity[]): TDto[];
}

/**
 * Interfaz base para mappers DTO → Entity
 */
export interface IDtoMapper<TDto, TEntity> {
  toEntity(dto: TDto): TEntity;
  toEntityList(dtos: TDto[]): TEntity[];
}

/**
 * Interfaz base para mappers bidireccionales
 */
export interface IBidirectionalMapper<TEntity, TDto>
  extends IEntityMapper<TEntity, TDto>,
    IDtoMapper<TDto, TEntity> {}

/**
 * Interfaz para mappers de persistencia (Prisma)
 */
export interface IPersistenceMapper<TEntity, TPrismaModel> {
  toPersistence(entity: TEntity): TPrismaModel;
  toDomain(model: TPrismaModel): TEntity;
  toDomainList(models: TPrismaModel[]): TEntity[];
}

/**
 * Clase abstracta para mappers Entity → DTO
 * Implementa el mapeo de listas automáticamente
 */
export abstract class BaseEntityMapper<TEntity, TDto>
  implements IEntityMapper<TEntity, TDto>
{
  abstract toDto(entity: TEntity): TDto;

  toDtoList(entities: TEntity[]): TDto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

/**
 * Clase abstracta para mappers de persistencia
 * Implementa el mapeo de listas automáticamente
 */
export abstract class BasePersistenceMapper<TEntity, TPrismaModel>
  implements IPersistenceMapper<TEntity, TPrismaModel>
{
  abstract toPersistence(entity: TEntity): TPrismaModel;
  abstract toDomain(model: TPrismaModel): TEntity;

  toDomainList(models: TPrismaModel[]): TEntity[] {
    return models.map((model) => this.toDomain(model));
  }

  toPersistenceList(entities: TEntity[]): TPrismaModel[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}

/**
 * Helper para mapear campos opcionales (null/undefined)
 */
export function mapOptional<TInput, TOutput>(
  value: TInput | null | undefined,
  mapper: (input: TInput) => TOutput,
): TOutput | null {
  return value != null ? mapper(value) : null;
}

/**
 * Helper para mapear Decimal de Prisma a número
 */
export function decimalToNumber(decimal: any): number {
  if (decimal == null) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal.toNumber === 'function') return decimal.toNumber();
  return Number.parseFloat(decimal.toString());
}

/**
 * Helper para mapear Date a ISO string
 */
export function dateToIsoString(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}
