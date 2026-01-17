/**
 * Interface base para casos de uso
 * Patrón Command/Query Segregation
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Interface para comandos (operaciones de escritura)
 */
export interface ICommand<TInput, TOutput> extends IUseCase<TInput, TOutput> {}

/**
 * Interface para queries (operaciones de lectura)
 */
export interface IQuery<TInput, TOutput> extends IUseCase<TInput, TOutput> {}
