/**
 * Obtiene la fecha y hora actual
 */
export function now(): Date {
  return new Date();
}

/**
 * Agrega horas a una fecha
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Agrega minutos a una fecha
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Agrega días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Verifica si una fecha ha pasado
 */
export function isPast(date: Date): boolean {
  return date.getTime() < now().getTime();
}

/**
 * Verifica si una fecha es futura
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > now().getTime();
}

/**
 * Calcula la diferencia en horas entre dos fechas
 */
export function diffInHours(dateA: Date, dateB: Date): number {
  const diffMs = Math.abs(dateA.getTime() - dateB.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Calcula la diferencia en minutos entre dos fechas
 */
export function diffInMinutes(dateA: Date, dateB: Date): number {
  const diffMs = Math.abs(dateA.getTime() - dateB.getTime());
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function diffInDays(dateA: Date, dateB: Date): number {
  const diffMs = Math.abs(dateA.getTime() - dateB.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si han pasado X horas desde una fecha
 */
export function hasPassedHours(date: Date, hours: number): boolean {
  const targetDate = addHours(date, hours);
  return isPast(targetDate);
}

/**
 * Obtiene el inicio del día de una fecha
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtiene el fin del día de una fecha
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Formatea una fecha a ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parsea una fecha desde string ISO
 */
export function fromISOString(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Verifica si dos fechas son el mismo día
 */
export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Obtiene el timestamp en milisegundos
 */
export function getTimestamp(date: Date = new Date()): number {
  return date.getTime();
}

/**
 * Convierte milisegundos a una fecha
 */
export function fromTimestamp(timestamp: number): Date {
  return new Date(timestamp);
}
