# Integración del Módulo 1 (M1-INT-01)

Prueba manual de punta a punta de los CU 1.1 a 1.4 con `viper-web` contra esta API y la base real.
Cada fila dice qué se hace, qué tiene que pasar y si pasó.

**Fecha:** 18/10/2026 · **API:** `main` (M1-BE-01 a 13) · **Web:** `main` (M1-FE-01 a 11)

## CU 1.1 · Registro

| # | Qué hago | Qué tiene que pasar | Resultado |
|---|---|---|---|
| 1 | En `/registro` toco **Crear cuenta** sin llenar nada | «Revisá los campos marcados» y los campos obligatorios en rojo (5a) | OK |
| 2 | Lleno todo con contraseña `corta` | «La contraseña no es válida» y se ven los requisitos (5d) | OK |
| 3 | Corrijo la contraseña (`Clave1234`), DNI `46.000.001` | Va al login; en la base el DNI queda `46000001` | OK |
| 4 | Me registro de nuevo con el mismo correo en mayúsculas | «Ya existe una cuenta con ese correo» (5b) | OK |
| 5 | Otro correo con el mismo DNI | «Ya existe una cuenta con ese DNI» (5c) | OK |

## CU 1.2 · Login, logout y cuenta en espera

| # | Qué hago | Qué tiene que pasar | Resultado |
|---|---|---|---|
| 6 | Entro con un correo que no existe | «Credenciales inválidas» (6a) | OK |
| 7 | Entro con contraseña incorrecta | «Credenciales inválidas» (6b) | OK |
| 8 | Entro bien como jugador | Va a `/portal/torneos`; `intentos_fallidos` vuelve a 0 | OK |
| 9 | **Cerrar sesión** y abro `/perfil` | Me manda al login; la sesión queda `CERRADA` en la base (A2) | OK |
| 10 | Abro `/perfil` sin sesión y después entro | Vuelve a `/perfil`, la pantalla que había pedido | OK |
| 11 | 5 intentos con contraseña incorrecta | «Cuenta en espera, reintentá más tarde» | OK |
| 12 | En espera, con la contraseña correcta | Sigue en espera | OK |
| 13 | Vencida la espera, con la contraseña correcta | Entra a su panel | OK |

## CU 1.3 · Perfil y contraseña

| # | Qué hago | Qué tiene que pasar | Resultado |
|---|---|---|---|
| 14 | Abro **Mi perfil** | Veo mis datos con el DNI | OK |
| 15 | **Editar datos** con el nombre vacío | «Campo obligatorio» en el nombre | OK |
| 16 | Cambio nombre y teléfono | «Perfil actualizado» y vuelve a Mi perfil | OK |
| 17 | Pestaña **Mi actividad** | «Aún no hay actividad» (A2) | OK |
| 18 | **Cambiar contraseña** con la actual incorrecta | «La contraseña actual es incorrecta» (A1a) | OK |
| 19 | Nueva contraseña `corta` | Campo en rojo (A1b) | OK |
| 20 | Cambio bien la contraseña con otra sesión abierta | «Contraseña actualizada»; la otra sesión se cierra y la actual sigue | OK |
| 21 | Entro con la vieja y después con la nueva | La vieja da «Credenciales inválidas»; la nueva entra | OK |

## CU 1.1 A1 y CU 1.4 · Administrador

| # | Qué hago | Qué tiene que pasar | Resultado |
|---|---|---|---|
| 22 | Entro como administrador | Va a `/admin/usuarios` | OK |
| 23 | **Crear cuenta de personal** con un correo ya usado | «Ya existe una cuenta con ese correo» | OK |
| 24 | Creo un recepcionista | Aparece en el listado | OK |
| 25 | El recepcionista entra y abre `/admin/usuarios` | Entra a `/gestion/inscripciones`; Usuarios dice «Sin permiso» | OK |
| 26 | **Cambiar rol** y guardo sin cambiar nada | «No hay cambios para guardar» (7b) | OK |
| 27 | Lo paso a Jugador (no tiene DNI) | «No se pudo cambiar el rol» | OK |
| 28 | Lo paso a Organizador | «Rol actualizado correctamente»; su sesión se cierra | OK |
| 29 | Vuelve a entrar | Rige el rol nuevo (Organizador) | OK |
| 30 | **Bloquear usuario** | «Usuario bloqueado correctamente»; su sesión se cierra | OK |
| 31 | El bloqueado intenta entrar | «Credenciales inválidas» (A1) | OK |
| 32 | **Activar usuario** y vuelve a entrar | «Usuario activado correctamente»; entra (A2) | OK |
| 33 | **Editar correo / DNI** de la jugadora con un correo de otro | «Ya existe una cuenta con ese correo» y conserva lo escrito (A3a) | OK |
| 34 | Cambio correo y DNI | «Datos actualizados»; la jugadora entra con el correo nuevo (A3) | OK |
| 35 | Abro una cuenta de Administrador | «Estas cuentas se gestionan fuera del sistema» y botones deshabilitados (7a) | OK |

## Responsive (360 px)

| # | Pantalla | Resultado |
|---|---|---|
| 36 | `/registro`, `/login`, `/admin/usuarios`, `/admin/usuarios/nuevo`, `/perfil`, `/perfil/editar` sin scroll horizontal | OK |

## Diferencias encontradas

- **Anexo A:** las rutas del Módulo 1 coinciden con la API. El plan de planificación todavía decía `/api/v1`; la API usa `/api` (igual que `docs/Modulo 1 y 3.md` de `viper-web` y `VITE_API_URL`). Se corrigió el texto del plan, no el código.
- **Ruta no listada:** `POST /api/ejemplo` (de INF-01) sigue montada. No toca la base; se deja como ejemplo del patrón de controladores.
- No hubo diferencias de mensajes ni de códigos HTTP entre pantallas y API.