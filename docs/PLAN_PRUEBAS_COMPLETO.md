# Plan de Pruebas Completo - TRABIX Backend

## Índice
1. [Módulo: Autenticación](#1-módulo-autenticación)
2. [Módulo: Usuarios](#2-módulo-usuarios)
3. [Módulo: Lotes](#3-módulo-lotes)
4. [Módulo: Tandas](#4-módulo-tandas)
5. [Módulo: Ventas al Detal](#5-módulo-ventas-al-detal)
6. [Módulo: Cuadres Normales](#6-módulo-cuadres-normales)
7. [Módulo: Mini-Cuadres](#7-módulo-mini-cuadres)
8. [Módulo: Ventas al Mayor](#8-módulo-ventas-al-mayor)
9. [Módulo: Cuadres al Mayor](#9-módulo-cuadres-al-mayor)
10. [Módulo: Equipamiento](#10-módulo-equipamiento)
11. [Módulo: Fondo de Recompensas](#11-módulo-fondo-de-recompensas)
12. [Módulo: Admin (Stock/Config)](#12-módulo-admin)
13. [Escenarios Complejos de Integración](#13-escenarios-complejos)

---

## 1. Módulo: Autenticación

### 1.1 Login
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| A1.1 | Login exitoso Admin | cedula: admin, password: Admin123! | Token JWT + Refresh Token |
| A1.2 | Login exitoso Vendedor | cedula válida, password correcto | Token JWT + Refresh Token |
| A1.3 | Login con credenciales inválidas | cedula incorrecta | 401 AUTH_001 |
| A1.4 | Login con password incorrecto | cedula correcta, password malo | 401 AUTH_001 |
| A1.5 | Login vendedor INACTIVO | usuario estado=INACTIVO | 401 AUTH_006 |
| A1.6 | Login vendedor debe cambiar password | passwordCambiado=false | 200 + flag requirePasswordChange |
| A1.7 | Login con bloqueo temporal | 5 intentos fallidos | 429 AUTH_005 |

### 1.2 Refresh Token
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| A2.1 | Refresh exitoso | refreshToken válido | Nuevo access token |
| A2.2 | Refresh con token expirado | refreshToken expirado | 401 AUTH_004 |
| A2.3 | Refresh con token inválido | token malformado | 401 AUTH_004 |
| A2.4 | Refresh con token en blacklist | token ya usado para logout | 401 AUTH_004 |

### 1.3 Logout
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| A3.1 | Logout exitoso | Token válido | 200 + token en blacklist |
| A3.2 | Logout sin token | Sin header Authorization | 401 |

### 1.4 Cambio de Password
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| A4.1 | Cambio exitoso primer login | password temporal → nuevo | 200 + passwordCambiado=true |
| A4.2 | Cambio con password actual incorrecto | passwordActual malo | 400 |
| A4.3 | Nuevo password no cumple requisitos | "123" (muy corto) | 400 validación |

---

## 2. Módulo: Usuarios

### 2.1 Crear Vendedor (Admin)
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| U1.1 | Crear vendedor modelo 60/40 | reclutadorId=ADMIN | Usuario con modelo=60_40 |
| U1.2 | Crear vendedor modelo 50/50 | reclutadorId=vendedor existente | Usuario con modelo=50_50 |
| U1.3 | Crear vendedor con cédula duplicada | cedula existente | 400 USR_002 |
| U1.4 | Crear vendedor con email duplicado | email existente | 400 USR_003 |
| U1.5 | Crear vendedor con teléfono duplicado | telefono existente | 400 USR_004 |
| U1.6 | Crear con reclutador inválido | reclutadorId no existe | 400 USR_005 |
| U1.7 | Crear con reclutador inactivo | reclutador estado=INACTIVO | 400 USR_005 |

### 2.2 Listar/Obtener Usuarios
| #     | Escenario | Datos de Entrada  | Resultado Esperado |
|-------|-----------|-------------------|--------------------|
| U2.1  | Listar todos (admin) | -                 | Lista paginada     |
| U2.2  | Listar por rol | rol=VENDEDOR      | Solo vendedores    |
| U2.21 | Listar por rol | rol=RECLUTADOR    | Solo reclutadores  |
| U2.3  | Listar por estado | estado=ACTIVO     | Solo activos       |
| U2.4  | Obtener perfil propio | Token de vendedor | Datos del vendedor |
| U2.5  | Obtener usuario específico (admin) | userId válido     | Datos completos    |
| U2.6  | Obtener usuario inexistente | userId inválido   | 404 USR_001        |

### 2.3 Modificar Usuario
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| U3.1 | Actualizar datos básicos | nombre, apellidos, etc. | 200 usuario actualizado |
| U3.2 | Cambiar estado a INACTIVO | estado=INACTIVO | Usuario inactivo |
| U3.3 | Cambiar email a duplicado | email de otro usuario | 400 USR_003 |

### 2.4 Jerarquía de Reclutamiento
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| U4.1 | Ver cadena de reclutamiento | vendedor nivel N3 | [vendedor, reclutador, admin] |
| U4.2 | Ver reclutados directos | reclutador con 3 reclutados | Lista de 3 usuarios |
| U4.3 | Obtener árbol completo | - | Estructura jerárquica |

---

## 3. Módulo: Lotes

### 3.1 Crear Lote
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| L1.1 | Crear lote ≤50 TRABIX | cantidadTrabix=50 | Lote con 2 tandas (25+25) |
| L1.2 | Crear lote >50 TRABIX | cantidadTrabix=100 | Lote con 3 tandas (~33 cada una) |
| L1.3 | Crear lote con redondeo | cantidadTrabix=100 | Tandas: 34+33+33 = 100 |
| L1.4 | Crear lote vendedor inactivo | vendedor estado=INACTIVO | 400 LOTE_002 |
| L1.5 | Crear lote vendedor sin cambiar password | passwordCambiado=false | 400 LOTE_002 |
| L1.6 | Crear lote sin stock admin suficiente | cantidadTrabix > stockAdmin | 400 LOTE_001 |

### 3.2 Activar Lote
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| L2.1 | Activar lote exitoso | loteId, confirmar inversión | Lote ACTIVO, Tanda 1 LIBERADA |
| L2.2 | Activar lote ya activo | lote estado=ACTIVO | 400 LOTE_004 |
| L2.3 | Activar lote inexistente | loteId inválido | 404 LOTE_003 |
| L2.4 | Verificar aporte fondo recompensas | Activar lote 100 TRABIX | +$20,000 al fondo |

### 3.3 Listar/Obtener Lotes
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| L3.1 | Listar mis lotes (vendedor) | Token vendedor | Solo lotes propios |
| L3.2 | Listar todos los lotes (admin) | - | Todos los lotes |
| L3.3 | Filtrar por estado | estado=ACTIVO | Solo lotes activos |
| L3.4 | Obtener detalle con tandas | loteId | Lote + array tandas |
| L3.5 | Ver resumen financiero | loteId | inversión, recaudado, ganancias |

### 3.4 Lote Forzado (vía venta al mayor)
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| L4.1 | Crear lote forzado | Venta mayor sin stock suficiente | es_lote_forzado=true |
| L4.2 | Verificar tandas lote forzado | - | Todas las tandas pasan a FINALIZADA al confirmar cuadre mayor |
| L4.3 | Verificar que no genera cuadres normales | - | Sin cuadres por tanda |

---

## 4. Módulo: Tandas

### 4.1 Transiciones de Estado
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| T1.1 | INACTIVA → LIBERADA | Cuadre exitoso de tanda anterior | Tanda cambia a LIBERADA |
| T1.2 | LIBERADA → EN_TRÁNSITO (automático) | Esperar 2 horas | Transición automática |
| T1.3 | EN_TRÁNSITO → EN_CASA (admin) | Admin confirma entrega | Tanda EN_CASA |
| T1.4 | EN_CASA → FINALIZADA | Stock llega a 0 | Tanda FINALIZADA |
| T1.5 | Intentar retroceder estado | EN_CASA → LIBERADA | 400 error transición inválida |

### 4.2 Reglas de Tandas
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| T2.1 | Solo una tanda LIBERADA por lote | Intentar liberar segunda tanda | No permitido hasta cuadre exitoso |
| T2.2 | Verificar stock inicial vs actual | Después de ventas | stockActual < stockInicial |

---

## 5. Módulo: Ventas al Detal

### 5.1 Registrar Venta
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| V1.1 | Venta simple (unidades) | [{tipo: UNIDAD, cantidad: 5}] | Venta PENDIENTE, stock - 5 |
| V1.2 | Venta promo | [{tipo: PROMO, cantidad: 2}] | Venta PENDIENTE |
| V1.3 | Venta con regalo | [{tipo: REGALO, cantidad: 1}] | Venta PENDIENTE |
| V1.4 | Venta sin licor | [{tipo: SIN_LICOR, cantidad: 3}] | Venta PENDIENTE |
| V1.5 | Venta mixta | [PROMO:2, UNIDAD:3, REGALO:1] | Venta con total correcto |
| V1.6 | Venta sin tanda EN_CASA | Vendedor sin tanda disponible | 400 VNT_002 |
| V1.7 | Venta stock insuficiente | cantidad > stockActual | 400 VNT_001 |
| V1.8 | Exceder límite de regalos | >8% del lote | 400 VNT_003 |

### 5.2 Aprobar/Rechazar Venta (Admin)
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| V2.1 | Aprobar venta | ventaId, estado=APROBADA | Stock reducido definitivamente, recaudo sumado |
| V2.2 | Rechazar venta | ventaId, estado=RECHAZADA | Stock revertido, venta eliminada |
| V2.3 | Aprobar venta inexistente | ventaId inválido | 404 VNT_004 |
| V2.4 | Aprobar venta ya procesada | venta ya APROBADA | 400 VNT_005 |

### 5.3 Cálculo de Precios
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| V3.1 | Precio UNIDAD | 1 unidad | $8,000 |
| V3.2 | Precio PROMO | 1 promo (2 unidades) | $15,000 |
| V3.3 | Precio REGALO | 1 regalo | $0 (ganancia no obtenida: $8,000) |
| V3.4 | Precio SIN_LICOR | 1 sin licor | $7,000 |
| V3.5 | Venta mixta completa | 3 promos + 5 unidades + 1 regalo | $85,000 |

---

## 6. Módulo: Cuadres Normales

### 6.1 Triggers de Cuadre
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| C1.1 | Trigger cuadre tanda 1 | dineroRecaudado >= inversiónAdmin | Cuadre pasa a PENDIENTE |
| C1.2 | Trigger cuadre tanda 2 (3 tandas) | Stock en casa llega a 10% | Cuadre pasa a PENDIENTE |
| C1.3 | Trigger cuadre tanda 3 | Stock en casa llega a 20% | Cuadre pasa a PENDIENTE |
| C1.4 | Trigger cuadre tanda 2 (2 tandas) | Stock en casa llega a 20% | Cuadre pasa a PENDIENTE |

### 6.2 Confirmar Cuadre (Admin)
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| C2.1 | Confirmar cuadre tanda 1 | montoRecibido = montoEsperado | EXITOSO, libera tanda 2 |
| C2.2 | Confirmar cuadre parcial | montoRecibido < montoEsperado | Permanece PENDIENTE |
| C2.3 | Confirmar cuadre con equipamiento | Tiene mensualidad pendiente | Incluir en montoEsperado |
| C2.4 | Confirmar cuadre con daño equipo | Tiene deuda por daño | Incluir costo daño |

### 6.3 Conceptos de Cuadre
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| C3.1 | Cuadre concepto INVERSION_ADMIN | Tanda 1 | Monto = inversión admin |
| C3.2 | Cuadre concepto GANANCIAS | Tanda 2+ | Monto = ganancias admin |
| C3.3 | Cuadre concepto MIXTO | Cuadre al mayor | Ambos conceptos |

### 6.4 Modelo 60/40
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| C4.1 | Calcular ganancias 60/40 | Lote 100 TRABIX, todo vendido | 60% vendedor, 40% admin |
| C4.2 | Verificar sin cascada | Vendedor directo de admin | Sin distribución a reclutadores |

### 6.5 Modelo 50/50 con Cascada
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| C5.1 | Calcular ganancias 3 niveles | N vendedor, N-1 reclutador, Admin | 50% vendedor, 25% reclutador, 25% admin |
| C5.2 | Calcular ganancias 4 niveles | N, N-1, N-2, Admin | 50%, 25%, 12.5%, 12.5% |
| C5.3 | Verificar cascada | Cadena de 3 reclutadores | Cada nivel recibe 50% del inferior |

---

## 7. Módulo: Mini-Cuadres

### 7.1 Trigger Mini-Cuadre
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| M1.1 | Trigger por stock 0 | Última tanda llega a 0 | Mini-cuadre PENDIENTE |
| M1.2 | Verificar monto final | Ganancias restantes | monto_final correcto |

### 7.2 Confirmar Mini-Cuadre
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| M2.1 | Confirmar mini-cuadre | Admin confirma | EXITOSO, lote FINALIZADO |
| M2.2 | Mini-cuadre con monto 0 | Todo cubierto previamente | Confirmar sin transferencia |
| M2.3 | Mini-cuadre con ganancias restantes | Hay excedente | Transferir monto_final |

### 7.3 Restricciones
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| M3.1 | Mini-cuadre no libera tandas | Confirmar mini-cuadre | Solo finaliza lote |
| M3.2 | Lote no finaliza sin mini-cuadre | Stock 0 sin confirmar | Lote permanece ACTIVO |

---

## 8. Módulo: Ventas al Mayor

### 8.1 Registrar Venta al Mayor
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| VM1.1 | Venta mayor mínimo | cantidad=21 | Venta PENDIENTE |
| VM1.2 | Venta mayor < 21 unidades | cantidad=20 | 400 VTM_001 |
| VM1.3 | Venta mayor modalidad ANTICIPADO | modalidad=ANTICIPADO | Venta con flujo anticipado |
| VM1.4 | Venta mayor modalidad CONTRAENTREGA | modalidad=CONTRAENTREGA | Venta con flujo contraentrega |

### 8.2 Consumo de Stock
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| VM2.1 | Consumir stock reservado | Stock reservado suficiente | Consumir de tandas INACTIVAS |
| VM2.2 | Consumir stock en casa | Reservado no alcanza | Consumir de tanda EN_CASA |
| VM2.3 | Crear lote forzado | Stock total no alcanza | Crear lote forzado |
| VM2.4 | Orden de consumo | Múltiples lotes | Lote más antiguo primero |
| VM2.5 | Consumo de tandas | Stock reservado | Tanda 2 primero, luego tanda 3 |

### 8.3 Lote Forzado
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| VM3.1 | Calcular cantidad forzada | Falta 30 TRABIX | Lote de exactamente 30 |
| VM3.2 | Inversión lote forzado | Crear lote forzado | 50% vendedor, 50% admin |
| VM3.3 | Estados tandas forzadas | Al confirmar cuadre mayor | Todas FINALIZADA directamente |
| VM3.4 | Sin cuadres normales | Lote forzado | No genera cuadres por tanda |

---

## 9. Módulo: Cuadres al Mayor

### 9.1 Generación de Cuadre Mayor
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| CM1.1 | Generar cuadre mayor | Venta al mayor registrada | Cuadre PENDIENTE |
| CM1.2 | Evaluación financiera | - | Cálculo completo de inversiones y ganancias |

### 9.2 Componentes del Cuadre Mayor
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| CM2.1 | Incluir dinero detal | Ventas previas | dinero_recaudado_detal correcto |
| CM2.2 | Incluir dinero venta mayor | - | dinero_venta_mayor = cantidad × precio |
| CM2.3 | Calcular inversión admin total | Lotes involucrados | Suma de inversiones admin |
| CM2.4 | Calcular ganancias reclutadores | Modelo 50/50 | Array con montos por nivel |
| CM2.5 | Incluir deudas pendientes | Equipamiento, cuadres | deudas_saldadas calculado |

### 9.3 Confirmar Cuadre Mayor
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| CM3.1 | Confirmar cuadre mayor anticipado | modalidad=ANTICIPADO | Vendedor transfiere, admin entrega stock |
| CM3.2 | Confirmar cuadre mayor contraentrega | modalidad=CONTRAENTREGA | Admin entrega, recauda, transfiere |
| CM3.3 | Cerrar cuadres normales | Cuadres cubiertos | Cuadres pasan a EXITOSO |
| CM3.4 | Liberar tandas en cadena | Cuadres cerrados | Tandas siguientes LIBERADAS |
| CM3.5 | Finalizar lote forzado | Lote forzado confirmado | Lote pasa a FINALIZADO |

### 9.4 Escenario Complejo: Cuadre Mayor con Equipamiento
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| CM4.1 | Mensualidad pendiente | Vendedor con equipamiento | Incluir $9,990 o $19,990 |
| CM4.2 | Daño de nevera | Equipamiento dañado | Incluir $30,000 |
| CM4.3 | Daño de pijama | Equipamiento dañado | Incluir $60,000 |
| CM4.4 | Pérdida total | Equipamiento perdido | Incluir $90,000 |

---

## 10. Módulo: Equipamiento

### 10.1 Solicitar Equipamiento
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E1.1 | Solicitar con depósito | tieneDeposito=true | mensualidad=$9,990 |
| E1.2 | Solicitar sin depósito | tieneDeposito=false | mensualidad=$19,990 |
| E1.3 | Solicitar ya teniendo activo | Equipamiento ACTIVO | 400 EQP_001 |

### 10.2 Activar Equipamiento
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E2.1 | Activar (admin confirma) | equipamientoId | Estado ACTIVO |
| E2.2 | Activar inexistente | id inválido | 404 EQP_002 |

### 10.3 Pagar Mensualidad
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E3.1 | Pagar mensualidad | equipamientoId | ultimaMensualidadPagada actualizada |
| E3.2 | Verificar mensualidad al día | Después de pagar | mensualidadAlDia=true |
| E3.3 | Mensualidad atrasada | Sin pagar este mes | mensualidadAlDia=false |

### 10.4 Reportar Daño
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E4.1 | Reportar daño nevera | tipoDano=NEVERA | Estado DAÑADO, deudaDano=$30,000 |
| E4.2 | Reportar daño pijama | tipoDano=PIJAMA | Estado DAÑADO, deudaDano=$60,000 |
| E4.3 | Pagar daño | pagarDano | deudaDano=0, estado puede volver a ACTIVO |

### 10.5 Reportar Pérdida
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E5.1 | Reportar pérdida | equipamientoId | Estado PERDIDO, deudaPerdida=$90,000 |
| E5.2 | Pagar pérdida | pagarPerdida | deudaPerdida=0 |

### 10.6 Devolver Equipamiento
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E6.1 | Devolver en buen estado | Sin deudas | Estado DEVUELTO |
| E6.2 | Devolver con depósito | Tenía depósito | depositoDevuelto=true, $49,990 devuelto |
| E6.3 | Intentar devolver con deuda | Mensualidad pendiente | 400 EQP_003 |
| E6.4 | Intentar devolver con daño pendiente | deudaDano > 0 | 400 EQP_004 |

### 10.7 Impacto en Cuadres
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| E7.1 | Cuadre con mensualidad | Equipamiento activo, no pagó | Cuadre NO puede ser EXITOSO |
| E7.2 | Cuadre después de pagar | Mensualidad pagada | Cuadre puede ser EXITOSO |
| E7.3 | Cuadre con daño | Daño no pagado | Cuadre NO puede ser EXITOSO |

---

## 11. Módulo: Fondo de Recompensas

### 11.1 Entradas al Fondo
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| F1.1 | Entrada por activar lote | Lote de 100 TRABIX activado | +$20,000 (100 × $200) |
| F1.2 | Entrada por lote forzado | Cuadre mayor confirmado | +$200 × cantidad TRABIX |
| F1.3 | Verificar concepto | - | Concepto indica origen |

### 11.2 Salidas del Fondo
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| F2.1 | Registrar salida | monto, concepto | Salida registrada, saldo reducido |
| F2.2 | Salida > saldo | Monto mayor a saldo | 400 FND_001 |
| F2.3 | Verificar saldo nunca negativo | Múltiples salidas | saldo >= 0 siempre |

### 11.3 Consultas
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| F3.1 | Obtener saldo actual | - | Entradas - Salidas |
| F3.2 | Listar transacciones | - | Historial ordenado |
| F3.3 | Filtrar por tipo | tipo=ENTRADA | Solo entradas |

---

## 12. Módulo: Admin

### 12.1 Stock Admin
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| AD1.1 | Ver stock físico | - | Cantidad actual |
| AD1.2 | Ver stock reservado | - | Stock comprometido en tandas inactivas |
| AD1.3 | Calcular déficit | Reservado > Físico | deficit = reservado - físico |
| AD1.4 | Sin déficit | Físico >= Reservado | deficit = 0 |

### 12.2 Pedidos de Stock
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| AD2.1 | Crear pedido (borrador) | cantidadTrabix=1000 | Pedido estado BORRADOR |
| AD2.2 | Agregar costo obligatorio | TRABIX (insumo obligatorio) | Costo agregado |
| AD2.3 | Agregar costo opcional | Stickers, envío | Costo agregado |
| AD2.4 | Confirmar pedido sin obligatorios | Falta insumo obligatorio | 400 PED_003 |
| AD2.5 | Confirmar pedido completo | Todos obligatorios | CONFIRMADO, costoReal calculado |
| AD2.6 | Recibir pedido | - | RECIBIDO, stock incrementado |

### 12.3 Configuraciones
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| AD3.1 | Listar configuraciones | - | Todas las configuraciones |
| AD3.2 | Modificar configurable | PRECIO_UNIDAD | Valor actualizado, historial |
| AD3.3 | Modificar no configurable | Config con modificable=false | 400 CFG_002 |
| AD3.4 | Ver historial cambios | clave específica | Cambios con fechas y usuarios |

### 12.4 Tipos de Insumo
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| AD4.1 | Crear tipo insumo | nombre, esObligatorio | Tipo creado |
| AD4.2 | Crear duplicado | nombre existente | 400 INS_002 |
| AD4.3 | Desactivar obligatorio | Insumo obligatorio | 400 INS_003 |
| AD4.4 | Desactivar opcional | Insumo opcional | activo=false |

### 12.5 Dashboard
| # | Escenario | Datos de Entrada | Resultado Esperado |
|---|-----------|------------------|-------------------|
| AD5.1 | Resumen dashboard | - | Ventas hoy, stock, cuadres pendientes |
| AD5.2 | Ventas por período | período=dia/semana/mes | Totales correctos |
| AD5.3 | Cuadres pendientes | - | Lista con montos esperados |

---

## 13. Escenarios Complejos de Integración

### 13.1 Flujo Completo: Vendedor Nuevo hasta Cuadre Exitoso
```
1. Admin crea vendedor (modelo 60/40)
2. Vendedor hace login y cambia password
3. Admin crea lote de 50 TRABIX (2 tandas de 25)
4. Admin activa lote (confirma inversión vendedor)
5. Verificar: Tanda 1 LIBERADA, Fondo +$10,000
6. Admin marca EN_TRÁNSITO (o esperar 2 horas)
7. Admin confirma EN_CASA
8. Vendedor registra ventas hasta recaudar inversión admin
9. Verificar: Cuadre tanda 1 pasa a PENDIENTE
10. Admin confirma cuadre → EXITOSO
11. Verificar: Tanda 2 LIBERADA
12. Repetir ventas hasta trigger cuadre tanda 2
13. Confirmar cuadre → mini-cuadre
14. Completar stock → mini-cuadre PENDIENTE
15. Confirmar mini-cuadre → Lote FINALIZADO
```

### 13.2 Flujo: Reclutador con 3 Reclutados (Cascada 50/50)
```
1. Admin crea Reclutador R (modelo 60/40)
2. Reclutador R recluta Vendedores V1, V2, V3 (modelo 50/50 cada uno)
3. Cada vendedor tiene lote de 100 TRABIX
4. V1 vende todo:
   - Ganancias: 50% V1, 25% R, 25% Admin
5. V2 vende todo:
   - Ganancias: 50% V2, 25% R, 25% Admin
6. V3 vende todo:
   - Ganancias: 50% V3, 25% R, 25% Admin
7. Verificar acumulado de R
8. R hace su propio lote y vende (60/40)
9. Verificar que R recibe tanto de sus ventas como de cascada
```

### 13.3 Flujo: Venta al Mayor con Lote Forzado + Equipamiento con Daño
```
1. Vendedor tiene:
   - Lote activo con 30 TRABIX (10 en casa, 20 reservados)
   - Equipamiento DAÑADO (nevera, deuda $30,000)
   - Mensualidad pendiente ($9,990)
2. Vendedor solicita venta al mayor de 50 unidades
3. Sistema evalúa:
   - Stock disponible: 30 (10 en casa + 20 reservados)
   - Faltante: 20 TRABIX
   - Crear lote forzado de 20 TRABIX
4. Generar cuadre al mayor que incluye:
   - Inversión admin lote existente
   - Inversión admin lote forzado (50% de 20×$2,400)
   - Deuda equipamiento: $30,000 + $9,990
   - Ganancias según modelo
5. Admin confirma cuadre mayor
6. Verificar:
   - Lote original: tandas afectadas con stock reducido
   - Lote forzado: FINALIZADO
   - Cuadres normales pendientes: EXITOSOS
   - Equipamiento: deuda pagada
   - Fondo recompensas: +$4,000 (20×$200)
```

### 13.4 Flujo: Múltiples Lotes Activos + Venta al Mayor
```
1. Vendedor tiene:
   - Lote A (antiguo): 50 TRABIX, 40 vendidos, 10 en tanda 2
   - Lote B (reciente): 100 TRABIX, tanda 1 con 34 en casa
2. Venta al mayor de 80 unidades
3. Orden de consumo:
   - Lote A primero (más antiguo)
   - Lote B si Lote A no alcanza
4. Verificar cuadres individuales y mayor
```

### 13.5 Flujo: Cuadre Bloqueado por Equipamiento
```
1. Vendedor con equipamiento activo
2. No paga mensualidad de este mes
3. Vende todo y llega a trigger de cuadre
4. Admin intenta confirmar cuadre
5. Sistema debe exigir pago de mensualidad
6. Vendedor paga mensualidad
7. Ahora sí puede confirmar cuadre
```

### 13.6 Flujo: Transición Automática LIBERADA → EN_TRÁNSITO
```
1. Activar lote → Tanda 1 LIBERADA
2. Verificar estado inmediatamente: LIBERADA
3. Esperar 2 horas (simular con job scheduler)
4. Verificar estado: EN_TRÁNSITO automáticamente
```

### 13.7 Flujo: Regalos al Límite
```
1. Lote de 100 TRABIX
2. Límite de regalos: 8% = 8 unidades
3. Registrar ventas con 8 regalos → OK
4. Intentar registrar venta con 1 regalo más → 400 VNT_003
```

### 13.8 Flujo: Déficit de Stock Admin
```
1. Admin tiene 100 TRABIX físicos
2. Crea lotes para vendedores por 150 TRABIX total
3. Verificar: déficit = 50 TRABIX
4. Admin no puede vender libremente los 100 sin crear más déficit
```

---

## Matriz de Cobertura

| Módulo | Casos Positivos | Casos Negativos | Casos Borde | Total |
|--------|-----------------|-----------------|-------------|-------|
| Auth | 7 | 7 | 2 | 16 |
| Usuarios | 10 | 5 | 3 | 18 |
| Lotes | 8 | 4 | 4 | 16 |
| Tandas | 6 | 2 | 2 | 10 |
| Ventas Detal | 10 | 4 | 3 | 17 |
| Cuadres Normal | 12 | 3 | 5 | 20 |
| Mini-Cuadres | 5 | 1 | 2 | 8 |
| Ventas Mayor | 8 | 2 | 5 | 15 |
| Cuadres Mayor | 10 | 2 | 5 | 17 |
| Equipamiento | 15 | 5 | 4 | 24 |
| Fondo | 5 | 1 | 2 | 8 |
| Admin | 15 | 4 | 3 | 22 |
| **TOTAL** | **111** | **40** | **40** | **191** |

---

## Orden Sugerido de Ejecución

### Fase 1: Configuración Base
1. Verificar seeds ejecutados
2. Probar login admin
3. Verificar configuraciones cargadas

### Fase 2: Usuarios y Jerarquía
4. Crear vendedor modelo 60/40
5. Crear reclutador
6. Crear 3 vendedores bajo el reclutador (50/50)
7. Verificar jerarquía

### Fase 3: Lotes y Tandas
8. Crear lotes para cada vendedor
9. Activar lotes
10. Verificar fondo de recompensas
11. Probar transiciones de tandas

### Fase 4: Ventas y Cuadres
12. Registrar ventas al detal
13. Aprobar ventas
14. Verificar triggers de cuadre
15. Confirmar cuadres
16. Completar ciclos hasta mini-cuadre

### Fase 5: Equipamiento
17. Solicitar equipamiento
18. Activar equipamiento
19. Probar mensualidades
20. Probar daños y pérdidas
21. Verificar bloqueo de cuadres

### Fase 6: Ventas al Mayor
22. Venta mayor consumiendo stock reservado
23. Venta mayor con lote forzado
24. Verificar cuadres al mayor
25. Probar modalidades anticipado/contraentrega

### Fase 7: Escenarios Complejos
26. Ejecutar los 8 escenarios de integración

---

## Datos de Prueba Sugeridos

### Usuarios Base
```json
{
  "admin": { "cedula": "ADMIN001", "password": "Admin123!" },
  "vendedor_60_40": { "cedula": "1234567890", "nombre": "Vendedor Directo" },
  "reclutador": { "cedula": "1111111111", "nombre": "Reclutador Principal" },
  "vendedor_50_50_1": { "cedula": "2222222222", "nombre": "Vendedor Reclutado 1" },
  "vendedor_50_50_2": { "cedula": "3333333333", "nombre": "Vendedor Reclutado 2" },
  "vendedor_50_50_3": { "cedula": "4444444444", "nombre": "Vendedor Reclutado 3" }
}
```

### Lotes de Prueba
```json
{
  "lote_pequeno": { "cantidadTrabix": 50 },
  "lote_mediano": { "cantidadTrabix": 100 },
  "lote_grande": { "cantidadTrabix": 200 }
}
```

### Ventas de Prueba
```json
{
  "venta_simple": { "detalle": [{ "tipo": "UNIDAD", "cantidad": 5 }] },
  "venta_promo": { "detalle": [{ "tipo": "PROMO", "cantidad": 3 }] },
  "venta_mixta": { 
    "detalle": [
      { "tipo": "PROMO", "cantidad": 2 },
      { "tipo": "UNIDAD", "cantidad": 3 },
      { "tipo": "REGALO", "cantidad": 1 }
    ]
  }
}
```
