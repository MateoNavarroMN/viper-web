# Viper — Guía de Estilos (design.md)

Única fuente de verdad para las clases de Tailwind del proyecto.
**Regla:** si un token, color o patrón no está en este documento, no se usa. Primero se agrega acá, después al código.

Extraído de: `src/index.css`, `index.html`, `Navbar.jsx`, `Hero.jsx`, `Footer.jsx`, `Landing.jsx`, `HeroBall3D.jsx` y los componentes de `src/shared/components`.
Stack: Tailwind CSS v4 (`@theme` en `src/index.css`, sin `tailwind.config.js`), React 19, animejs v4.

---

## 1. Colores

### 1.1 Tokens semánticos (OBLIGATORIOS)

Definidos en `@theme` y alimentados por variables CSS en `:root` (modo oscuro por defecto) y `.tema-claro`.

| Clase Tailwind | Variable | Oscuro | Claro | Uso |
|---|---|---|---|---|
| `bg-fondo` | `--bg-color` | `#09090B` | `#F3F4F6` | Fondo de página, fondo de contenedores de icono |
| `bg-panel` | `--surface-color` | `#18181B` | `#FFFFFF` | Tarjetas, footer, menú móvil, modales |
| `text-viper` / `bg-viper` / `border-viper` | `--primary-color` | `#10B981` | `#10B981` | Color de marca, acentos, CTA |
| `bg-viper-hover` | `--primary-hover` | `#059669` | `#059669` | Hover del botón primario |
| `text-texto` | `--text-main` | `#F8FAFC` | `#0F172A` | Texto principal |
| `text-texto-suave` | `--text-muted` | `#94A3B8` | `#64748B` | Texto secundario, descripciones, links de nav |
| `text-error` / `border-error` / `bg-error` / `bg-error/10` | `--error-color` | `#EF4444` | `#DC2626` | Errores de formulario, botón de peligro, estados negativos (cancelado, anulado) |
| `text-exito` / `border-exito` / `bg-exito/15` | `--success-color` | `#10B981` | `#059669` | Confirmaciones y estados positivos (activa, pagado, inscripciones abiertas). Es el mismo verde de marca |
| `text-advertencia` / `bg-advertencia` / `bg-advertencia/15` | `--warning-color` | `#F59E0B` | `#D97706` | Avisos y estados que piden atención (pago pendiente, inscripciones cerradas, W.O.), botón de advertencia |
| `text-info` / `border-info` / `bg-info/10` | `--info-color` | `#3B82F6` | `#2563EB` | Mensajes informativos y estado "En curso" |
| `text-violeta` / `bg-violeta/15` | `--violet-color` | `#8B5CF6` | `#7C3AED` | Estado "Finalizado" y rol Organizador |

Los tokens generan todas las utilidades de Tailwind (`bg-`, `text-`, `border-`, `ring-`, etc.) y admiten opacidad: `bg-fondo/90`, `bg-viper/20`, `bg-panel/85`.

### 1.2 Colores de la paleta Tailwind por defecto permitidos

Solo estos, solo para los usos indicados:

| Clase | Uso permitido |
|---|---|
| `border-gray-800` | Bordes de navbar, footer, tarjetas, divisores del menú móvil |
| `border-gray-700` | Borde del contenedor de icono dentro de tarjeta |
| `text-white` | Texto sobre el botón de peligro sólido (`bg-error`) |
| `text-black` | Texto sobre el botón primario sólido (`bg-viper`) y sobre el de advertencia (`bg-advertencia`) |
| `bg-black/60` | Overlay del menú móvil y de los modales |

> Deuda técnica: `border-gray-800/700` no cambian con `.tema-claro`. Si se activa el modo claro, crear tokens `--color-borde` y reemplazarlos primero acá.

### 1.3 Valores literales permitidos (no son clases de color)

| Valor | Dónde |
|---|---|
| `rgba(16,185,129,0.3)` | Sombra de glow del botón primario |
| `rgba(16,185,129,0.5)` | `drop-shadow` de iconos de tarjeta |
| `#10B981` / `#18181B` | Solo dentro de SVG (`HeroBall3D`), porque el atributo SVG no resuelve tokens |
| `#09090B` | `<meta name="theme-color">` |

### 1.4 Reglas

- Texto principal: `text-texto` (o heredado de `body`). Secundario: `text-texto-suave`. Acento: `text-viper`.
- Nunca usar `text-white` (salvo sobre `bg-error`, ver 1.2), `bg-black`, `bg-green-*`, `bg-emerald-*`, `text-gray-*` ni hex sueltos en JSX.
- El acento verde se usa con moderación: palabra clave de un título, CTA, bordes en hover, iconos.

---

## 2. Tipografía

Fuentes cargadas por Google Fonts en `index.html`: **Inter** (400, 500, 600) y **Outfit** (500, 600, 700, 800).

| Clase | Fuente | Uso |
|---|---|---|
| (por defecto, `font-sans`) | Inter | Todo el texto de cuerpo, links, descripciones |
| `font-outfit` | Outfit | Títulos (`h1`–`h3`), logo, botones, texto de marca |

### 2.1 Escala en uso

| Rol | Clases |
|---|---|
| Hero `h1` | `font-outfit text-5xl lg:text-7xl font-bold leading-tight text-balance` |
| Título de sección `h2` | `font-outfit text-3xl md:text-4xl font-bold` |
| Título de tarjeta `h3` | `font-outfit text-xl font-bold` |
| Logo | `font-outfit text-2xl font-bold tracking-wide` |
| Logo secundario ("Gestión Deportiva", apilado en dos líneas) | `font-outfit text-lg text-texto-suave` |
| Footer marca | `font-outfit text-xl font-bold` |
| Párrafo hero | `text-texto-suave text-lg lg:text-xl leading-relaxed` |
| Párrafo de tarjeta | `text-texto-suave leading-relaxed` |
| Subtítulo de sección | `text-texto-suave` |
| Link de navbar desktop | `font-medium text-texto-suave` |
| Link de menú móvil | `text-xl font-medium` |
| Texto de footer | `text-texto-suave text-sm` |
| Botón grande | `font-outfit font-bold text-lg` |
| Botón compacto (navbar) | `font-outfit font-semibold` |
| Título de modal y de confirmación | `font-outfit text-xl font-bold` |
| Etiqueta de campo | `font-medium` |
| Error o ayuda de campo, detalle de alerta | `text-sm` (error `text-error`, ayuda `text-texto-suave`) |
| Insignia de estado (Badge) | `text-sm font-medium` |
| Encabezado de tabla | `text-xs font-semibold uppercase tracking-wide` (color heredado: `text-texto-suave` en el contenedor) |

### 2.2 Reglas

- Títulos y botones → `font-outfit`. Todo lo demás → Inter (no se escribe clase).
- Pesos permitidos: `font-medium`, `font-semibold`, `font-bold` (los cargados en Google Fonts).
- Palabra destacada dentro de un título: `<span className="text-viper">…</span>`.

---

## 3. Layout y espaciado

### 3.1 Contenedor

- Ancho máximo: `max-w-7xl mx-auto px-6` (siempre, en navbar, hero, secciones y footer).
- Página: `min-h-screen bg-fondo flex flex-col`; `<main className="flex-grow">`.

### 3.2 Breakpoints (Tailwind por defecto, enfoque mobile-first)

`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. Navegación desktop desde `md`; hero en dos columnas desde `lg`; grilla de 4 columnas desde `xl`.

### 3.3 Patrones de sección

| Patrón | Clases |
|---|---|
| Hero | `relative pt-24 pb-0 sm:pt-28 lg:pt-32 lg:pb-12 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12` |
| Sección de contenido | `max-w-7xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-12` |
| Cabecera de sección | `text-center mb-10 md:mb-16` (título `mb-4`) |
| Grilla de tarjetas | `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6` |
| Footer | `border-t border-gray-800 bg-panel py-8 mt-12` |

### 3.4 Alineación responsive del hero

Texto centrado en móvil, a la izquierda en desktop: `text-center lg:text-left`; párrafo con `max-w-2xl mx-auto lg:mx-0`; botones `justify-center lg:justify-start`.

---

## 4. Componentes base

### 4.1 Botón primario (sólido)

```
font-outfit bg-viper hover:bg-viper-hover text-black w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer
```

### 4.2 Botón secundario (outline)

Grande (hero, menú móvil):
```
font-outfit bg-transparent border border-viper text-viper hover:bg-viper/20 w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300 transition-transform hover:scale-105
```
Compacto (navbar desktop):
```
font-outfit bg-transparent border border-viper text-viper hover:bg-viper/20 px-6 py-2 rounded-lg font-semibold transition-colors duration-300 transition-transform hover:scale-105 cursor-pointer
```
Menú móvil: `mt-8 w-full py-4 rounded-xl font-bold text-lg` (sin `hover:scale-105`).

### 4.3 Navbar

- Barra: `fixed w-full top-0 z-[60] bg-fondo/90 backdrop-blur-md border-b border-gray-800`; interior `h-20 flex items-center justify-between`.
- Logo: `flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer`; texto "VIPER" + `<span className="text-viper">|</span>`; subtítulo `hidden sm:block`.
- Links desktop: `hidden md:flex items-center gap-8 font-medium text-texto-suave`, cada uno `hover:text-viper transition-colors`.
- Hamburguesa: `md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 focus:outline-none`; barras `block w-6 h-[2px] bg-texto rounded-full` con `transition-transform duration-300 ease-in-out origin-center` (abierta: `rotate-45 translate-y-[8px]`, `-rotate-45 -translate-y-[8px]`, la del medio `opacity-0`).
- Overlay: `md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300` (+ `opacity-100 pointer-events-auto` / `opacity-0 pointer-events-none`).
- Panel lateral: `md:hidden fixed top-0 right-0 w-3/4 max-w-sm h-screen bg-panel/85 backdrop-blur-2xl border-l border-gray-800 z-50 transition-transform duration-300 ease-in-out flex flex-col pt-28 px-8 shadow-2xl` (+ `translate-x-0` / `translate-x-full`).
- Link del panel: `text-texto hover:text-viper text-xl font-medium transition-colors border-b border-gray-800 pb-4`.

- Link activo (ruta actual): mismo link con `text-viper` en lugar de `text-texto-suave` (desktop) o de `text-texto` (panel móvil).

### 4.3.1 Páginas informativas de módulo (vidriera pública)

- Contenedor: `max-w-7xl mx-auto px-6 pt-28 pb-12 lg:pt-36`.
- Cabecera: `text-center mb-10 md:mb-16`; `h1` = `font-outfit text-4xl lg:text-6xl font-bold mb-6 leading-tight text-balance` con la palabra clave en `text-viper`; bajada = `text-texto-suave text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed`.
- Pasos: grilla `grid grid-cols-1 md:grid-cols-3 gap-6` de tarjetas (sección 4.4); número en contenedor `w-12 h-12 bg-fondo rounded-lg border border-gray-700 flex items-center justify-center mb-6` con `font-outfit text-xl font-bold text-viper`.
- Cierre: botón secundario grande (4.2) centrado: `flex justify-center mt-12`.

### 4.4 Tarjeta de módulo

```
bg-panel border border-gray-800 p-8 rounded-2xl hover:border-viper pointer-coarse:data-[activa=true]:border-viper transition-colors group [-webkit-tap-highlight-color:transparent]
```
- Contenedor de icono: `w-12 h-12 bg-fondo rounded-lg border border-gray-700 flex items-center justify-center mb-6 group-hover:bg-viper/10 group-hover:border-viper/50 pointer-coarse:group-data-[activa=true]:bg-viper/10 pointer-coarse:group-data-[activa=true]:border-viper/50 transition-colors`
- Icono (SVG 24×24, `stroke="currentColor"` `strokeWidth="2"`, redondeado): `text-viper group-hover:scale-110 pointer-coarse:group-data-[activa=true]:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`
- Título `mb-3`, descripción debajo.

### 4.5 Footer

`border-t border-gray-800 bg-panel py-8 mt-12`; interior `flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left`.

### 4.6 Componentes compartidos (`src/shared/components`)

Se importan desde `shared/components`; las pantallas no repiten estas clases. Todos usan solo tokens de la sección 1. Colores y patrones tomados de los diseños de Figma de los Módulos 1 y 3.

| Componente | Uso y props principales |
|---|---|
| `Button` | `variante`: `primario` (4.1), `secundario` (4.2), `neutro` (`bg-panel border border-gray-800`, para "Volver" / "Seguir editando"), `peligro` (`bg-error text-white`, sólido), `peligro-borde` (`bg-error/10 border border-error/60 text-error`, para «Bloquear usuario»), `advertencia` (`bg-advertencia text-black`, sólido). `tamano`: `grande` / `compacto`. `cargando` muestra un spinner y deshabilita.  |
| `Input` / `Select` | `w-full bg-fondo border rounded-lg px-4 py-3`; borde `border-gray-800`, en foco `border-viper`, con `error` `border-error`. `Select` recibe `opciones: [{ valor, texto }]`. |
| `FormField` | Etiqueta arriba (`font-medium`; con `requerido` suma un asterisco `text-viper`), campo, y debajo el error (`text-error text-sm`, `role="alert"`) o la ayuda (`text-texto-suave text-sm`). |
| `PasswordInput` | `Input` de contraseña con botón de ojo (`text-texto-suave hover:text-texto`) para mostrarla u ocultarla. Mismas props que `Input`. |
| `Alert` | Mensaje en recuadro: `border rounded-xl px-4 py-3` con fondo `/10` y borde `/50` del color. `variante`: `error`, `exito`, `advertencia`, `info`; `titulo` opcional. |
| `Modal` | Overlay `bg-black/60 backdrop-blur-sm z-[70]`, panel `bg-panel border border-gray-800 rounded-2xl`; se cierra con Escape, tocando afuera o con la X. |
| `ConfirmDialog` | `Modal` con círculo de ícono (`bg-advertencia/20` o `bg-error/20`), título, texto y botones: Cancelar (`neutro`) y Confirmar (`advertencia` o `peligro` según `tipo`; `variante` lo cambia, por ejemplo a `primario`). Con `posicion="abajo-movil"` sube desde abajo en el celular. |
| `BottomSheet` | `Modal` que sube desde abajo en móvil (`rounded-t-2xl`) y se ve centrado desde `md`. |
| `Toast` (`ToastProvider` + `useToast`) | `mostrarToast(mensaje, 'exito' \| 'error' \| 'advertencia')`. Tarjeta `bg-panel` con borde `/50` del color e ícono, arriba a la derecha (`z-[80]`), desaparece a los 4 s. |
| `Table` | Tabla en `md+` (`bg-panel border border-gray-800 rounded-2xl`, encabezado `text-xs uppercase`); en móvil cada fila es una tarjeta (4.4). |
| `Badge` / `EstadoBadge` | Píldora sin borde `rounded-full px-3 py-0.5 text-sm font-medium` con fondo `/15` del color (`neutro`: `bg-texto-suave/20 text-texto-suave`). Variantes: `neutro`, `exito`, `advertencia`, `error`, `info`, `violeta`. `EstadoBadge` traduce los estados del sistema (`shared/utils/estados.js`): Planificado neutro, Inscripciones abiertas éxito, Inscripciones cerradas advertencia, En curso info, Finalizado violeta, Cancelado error. |
| `Checkbox` | Casilla de verificación propia (24 px, `rounded-md`; tildada `bg-viper border-viper`). Se usa dentro de un `<label>` para marcar tocando toda la fila (4.21). |
| `EmptyState` | Tarjeta con icono (patrón 4.4), título, descripción y acción opcional. |
| `Spinner` | Círculo con borde `border-current border-t-transparent animate-spin`; verde por defecto, `chico` hereda el color del botón. |
| `Tabs` | Pestañas con subrayado: activa `text-viper border-viper`, inactiva `text-texto-suave hover:text-viper`; scroll horizontal en móvil. La línea gris va en un contenedor de afuera y la fila baja 1 px (`-mb-px`) para que el subrayado la tape sin generar scroll vertical. Una pestaña `deshabilitada` (sección que todavía no existe) va `text-gray-600 cursor-not-allowed` con el título «Próximamente». |

### 4.7 Pantallas de acceso (registro, inicio de sesión)

Componentes propios de `features/privado/auth/components`, tomados de los diseños de Figma de los CU 1.1 y 1.2.

- `Logo` (`shared/components`): "VIPER" `font-outfit text-2xl font-bold tracking-wide` con la barra `|` en `text-viper` (el cuadrado con la V del Figma era de ejemplo). Lo usan `AuthLayout` y el menú lateral.
- `AuthLayout`: fondo `bg-fondo` con glow `bg-viper opacity-15 blur-[100px]`; barra superior `border-b border-gray-800` con `Logo` y "Gestión Deportiva" (`text-texto-suave`), y una acción a la derecha (botón secundario compacto, 4.2; en el login y el registro es «Iniciar sesión», como en Figma); contenido en `max-w-7xl mx-auto px-6 pt-10 pb-12 md:pt-14`.
- Cabecera: `h1` `font-outfit text-[40px] font-bold` con la palabra clave en `text-viper`; bajada `text-texto-suave` (16 px).
- Tarjeta del formulario: `bg-panel border border-gray-800 rounded-2xl p-6 md:p-10`, ancho `max-w-[720px]` (registro) o `max-w-[480px]` (login), con secciones separadas por `border-gray-800`. Título de sección: `text-xs font-semibold uppercase tracking-wide text-texto-suave`. Campos en grilla `grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5`.
- Campos (`FormField` + `Input`): etiqueta `text-[13px] text-texto-suave` con asterisco verde si es obligatorio; campo `text-sm px-4 py-3` (44 px de alto); ayuda y error `text-xs`.
- Botones del formulario: «Cancelar» (`neutro`, vuelve a la landing) y la acción principal (`primario`, `flex-1`); en móvil la principal va arriba (`flex-col-reverse`).
- `RequisitosPassword`: lista dentro de `bg-fondo border border-gray-800 rounded-xl px-4 py-3`; cada requisito `text-sm`, `text-exito` si se cumple y `text-error` si no.
- Errores de formulario: `Alert` `error` arriba de la tarjeta con el motivo, más el mensaje bajo cada campo con problema.
- Inicio de sesión: durante la espera por intentos fallidos se muestra un `Alert` `advertencia` con cuenta regresiva `tabular-nums` y el botón queda deshabilitado con el tiempo restante.

### 4.8 Layout privado (`features/privado/layout`)

Tomado del Figma del CU 1.2 («Panel según rol») y del CU 1.3.

- `AppLayout`: menú lateral fijo desde `lg` (`w-60 bg-panel border-r border-gray-800 px-3 py-6`, contenido con `lg:pl-60`): `Logo` arriba, `Navegacion` en el medio y `MenuUsuario` al pie (`border-t border-gray-800`). En pantallas menores, drawer desde la izquierda (`w-72 max-w-[85vw]`, overlay `bg-black/60 backdrop-blur-sm z-[60]`) con la misma estructura.
- Header `sticky top-0 h-16 px-4 sm:px-8 bg-fondo/90 backdrop-blur border-b border-gray-800`: breadcrumb a la izquierda (`text-sm text-texto-suave`, el último en `text-texto` y sin enlace, separador `›`; cada miga anterior es un `Link` con `hover:text-viper` que vuelve a esa pantalla; en móvil se ve solo el último, con un `‹` a la izquierda que vuelve a la miga anterior) y a la derecha la campana (`text-texto-suave`) y el `Avatar` de 32 px que lleva a Mi perfil. Las migas salen de `migasDe()` en `layout/navegacion.js`, que devuelve `{ texto, ruta, estado }` por miga (`estado` abre la pestaña de la ficha: «Cabezas de serie» → `pestana: 'cabezas'`, «Generar cuadro» y «Programar partido» → `pestana: 'cuadro'`). Las pantallas hijas de un torneo muestran tres niveles: «Torneos y Ligas › Detalle del torneo › Programar partido». Contenido `px-4 sm:px-8 py-8`.
- `Navegacion`: cada enlace `px-4 py-3 rounded-lg text-sm` con ícono; activo `bg-viper/10 text-viper` con barra izquierda de 3 px `bg-viper`; inactivo `text-texto-suave hover:text-texto hover:bg-fondo`. Las secciones y sus roles salen de `layout/navegacion.js` (única fuente, también usada por `App.jsx`). La sección de la cuenta se llama «Mi cuenta».
- `MenuUsuario` (pie del menú lateral): `Avatar` de Blobatar (36 px, semilla `usuario.id`), nombre `text-sm` y rol `text-xs text-texto-suave`, más un botón de salir. Al tocarlo se abre hacia arriba un menú `bg-panel border border-gray-800 rounded-xl` con «Mi perfil» y «Cerrar sesión» (`text-error`).
- `SinPermiso`: tarjeta centrada `max-w-md` con ícono `bg-error/15 text-error` y botón "Ir a mi panel" (secundario).
- Foco visible en todo el menú (`focus-visible:outline-2 focus-visible:outline-viper`) y enlace "Saltar al contenido".

### 4.9 Mi perfil (`features/privado/perfil`)

Tomado del Figma del CU 1.3 («Mi Perfil» y «Editar Datos»).

- Pantallas: `/perfil` (vista) y `/perfil/editar` (edición). Contenedor `max-w-6xl mx-auto flex flex-col gap-8`; título `h1 font-outfit text-[28px] font-bold` con bajada `text-sm text-texto-suave`. Grilla `lg:grid-cols-[minmax(0,1fr)_22rem] gap-6`: tarjeta principal a la izquierda y una tarjeta lateral.
- Tarjetas: `bg-panel border border-gray-800 rounded-2xl p-6 md:p-8` (lateral `p-6`); títulos `text-xs font-bold uppercase tracking-wide text-texto-suave`; separadores `border-gray-800`.
- Vista: cabecera de la tarjeta con `Avatar` de 56 px, nombre `font-outfit text-lg font-bold`, correo `text-[13px] text-texto-suave` y botón «Editar datos» (primario). Debajo, «Datos personales» con `CampoBloqueado` (aspecto de campo `bg-fondo border border-gray-800 rounded-lg text-sm text-texto-suave` con candado) para nombre, apellido, correo, teléfono, DNI (solo jugadores) y rol, y una `Nota` (`text-xs` con ícono de información). Tarjeta lateral «Seguridad» con «Cambiar contraseña» (secundario, `w-full`; se habilita en M1-FE-06).
- Edición: «Datos editables» (nombre, apellido, teléfono), «Solo lectura» (correo y DNI con `CampoBloqueado`) y pie con «Cancelar» (`neutro`, izquierda) y «Guardar cambios» (`primario`, derecha); en móvil el principal va arriba. Tarjeta lateral «Qué podés editar»: ✓ en círculo `bg-viper/15 text-viper` con «Editable», o candado en `bg-gray-800 text-texto-suave` con «Administrador». Cancelar con cambios abre `ConfirmDialog` («Seguir editando» / «Descartar»). Al guardar vuelve a `/perfil` con el toast «Perfil actualizado».
- Cambiar contraseña (A1): `Modal` «Cambiar contraseña» con `PasswordInput` para la actual, la nueva (ayuda «Mínimo 8 caracteres») y la confirmación. Al escribir la nueva aparece la lista de requisitos (`bg-fondo border border-gray-800 rounded-xl`): círculo `bg-viper/15 text-viper` con ✓ si se cumple, o `bg-error/15 text-error` con ✕ y texto `text-error` si no. Pie con «Cancelar» (`neutro`) y «Cambiar contraseña» (`primario`). Al guardar se cierra y muestra el toast «Contraseña actualizada. Se cerraron tus sesiones en otros dispositivos.».
- Mi actividad (A2, solo JUGADOR): `Tabs` «Datos personales» / «Mi actividad» sobre la columna principal (la pestaña queda en `?seccion=actividad`). Tarjeta `bg-panel border border-gray-800 rounded-2xl` con secciones («Reservas e inscripciones», «Pagos», «Cuotas» solo si es socio) separadas por `border-gray-800`; título de sección `text-xs font-bold uppercase text-texto-suave`; cada fila con título `text-sm`, detalle `text-xs text-texto-suave` y `Badge` a la derecha (en móvil, debajo). Inscripción: «Inscripto» `info`, «Anulada» `error`, «Pago pendiente» `advertencia`. Sección sin datos: texto `text-sm text-texto-suave`. Sin ninguna actividad: tarjeta centrada con ícono de calendario y «Aún no hay actividad».

### 4.10 Usuarios (`features/privado/usuarios`)

Tomado del Figma del CU 1.4 («CU 1.4», «Estados y flujos alternativos» y «Vista móvil»).

- Pantalla `/admin/usuarios` (solo Administrador). Contenedor `max-w-6xl mx-auto flex flex-col gap-6`; título `h1 font-outfit text-[28px] font-bold` y bajada `text-sm text-texto-suave`.
- Barra de filtros: buscador `max-w-md` con lupa (`bg-fondo border border-gray-800 rounded-lg pl-11 py-3 text-sm`), `Select` de rol («Rol: Todos») y de estado («Estado: Todos») y, a la derecha, «Crear cuenta de personal» (primario). En móvil los selects van en dos columnas y el botón queda fijo abajo (`fixed bottom-0 inset-x-0 bg-fondo/90 backdrop-blur border-t`).
- Lista: encabezado `text-xs font-bold uppercase text-texto-suave` (Usuario · Rol · Estado) y una tarjeta por usuario (`bg-panel border border-gray-800 rounded-xl px-6 py-3 hover:border-viper`) con `Avatar` de 36 px, nombre `text-sm`, correo `text-xs text-texto-suave`, `Badge` del rol (Administrador `advertencia`, Recepcionista `info`, Organizador `violeta`, Jugador `neutro`) y `EstadoBadge` de usuario (Activo `exito`, Bloqueado `error`). A la derecha: flecha `›` si se puede gestionar o candado si es Administrador (sin acciones). En móvil los badges bajan debajo del nombre y no se muestra el correo.
- Pie: «Mostrando N de M usuarios» y, si hay más de una página, Anterior / «Página X de Y» / Siguiente (`neutro`).
- Sin resultados (2a): tarjeta centrada con ícono de lupa, «No se encontraron resultados», «Probá con otro nombre, correo o DNI, o quitá los filtros.» y «Limpiar filtros» (secundario).
- Búsqueda, rol, estado y página viven en la URL (`?q=&rol=&estado=&pagina=`); buscar espera 350 ms sin tipear (debounce) y cualquier cambio de filtro vuelve a la página 1. Mientras llega una respuesta nueva la lista se ve atenuada (`opacity-60`).

### 4.11 Detalle de usuario y cambio de rol (`features/privado/usuarios`)

Tomado del Figma del CU 1.4 («CU 1.4» y «Estados y flujos alternativos»).

- Pantalla `/admin/usuarios/:id` (solo Administrador). Enlace «‹ Volver a usuarios» (conserva la búsqueda y los filtros del listado), cabecera con `Avatar` de 56 px, nombre `font-outfit text-[28px] font-bold`, `Badge` de rol y `EstadoBadge`, y el correo `text-sm text-texto-suave`.
- Grilla `lg:grid-cols-[minmax(0,1fr)_22rem] gap-6`. Tarjeta «Datos de la cuenta» (`bg-panel border border-gray-800 rounded-2xl p-6 md:p-8`) con `CampoBloqueado` para nombre, apellido, correo, DNI («—» si no es jugador), fecha de registro y último acceso («Hoy 09:12» si fue hoy). Tarjeta lateral «Estado y acciones» con el estado y los botones (Cambiar rol `secundario`, `w-full`).
- Cuenta de Administrador (7a): `Alert` de error «Cuenta de Administrador · Estas cuentas se gestionan fuera del sistema.» y las tres acciones deshabilitadas con la nota «Las cuentas de Administrador no se gestionan acá.».
- Cambiar rol: en escritorio aparece una tarjeta «Cambiar rol» bajo los datos; en celular (`< lg`) sube como `BottomSheet`. Tres tarjetas de opción (Jugador, Recepcionista, Organizador) con `radio` real oculto (`sr-only`): elegida `border-viper bg-viper/10` con el título en `text-viper`, y círculo de radio arriba a la derecha. Debajo, el aviso «Al guardar, se cierran todas sus sesiones activas.», y el pie con «Cancelar» (`neutro`, izquierda) y «Guardar cambios» (`primario`, derecha).
- 7b: elegir el rol actual muestra `Alert` de advertencia «No hay cambios para guardar». Éxito (paso 10): toast «Rol actualizado correctamente», el selector se cierra y un `Alert` de éxito informa cuántas sesiones se cerraron. Errores de la API (por ejemplo, un usuario sin DNI no puede pasar a Jugador) en un `Alert` de error dentro del selector.

### 4.12 Bloquear, activar y editar correo / DNI (`features/privado/usuarios`)

Tomado del Figma del CU 1.4 («Estados y flujos alternativos»: A1, A2, A3, A3a y «Acciones según el estado de la cuenta»).

- Tarjeta «Estado y acciones»: Cambiar rol (`secundario`), la acción de estado que corresponde y «Editar correo / DNI» (`neutro`), todas `w-full py-3`. Activo → «Bloquear usuario» (`peligro-borde`); Bloqueado → «Activar usuario» (`secundario`). Administrador → las tres deshabilitadas.
- A1 Bloquear: `ConfirmDialog` `tipo="peligro"` «Bloquear usuario», «Nombre Apellido no podrá iniciar sesión y se cerrarán todas sus sesiones activas.», botones «Cancelar» / «Bloquear». A2 Activar: `ConfirmDialog` `variante="primario"` «Activar usuario», «Nombre Apellido podrá volver a iniciar sesión. Se reinician sus intentos fallidos y la espera.», «Cancelar» / «Activar». Al confirmar: toast con el mensaje de la API y los badges se actualizan.
- A3 Editar correo / DNI: `Modal` con «Correo electrónico *» y, solo si el usuario es jugador, «DNI *»; `Nota` «El DNI solo aplica a usuarios con perfil de Jugador.»; pie «Cancelar» (`neutro`, izquierda) y «Guardar cambios» (`primario`, derecha). Solo se envían los campos que cambiaron; sin cambios, `Alert` de advertencia «No hay cambios para guardar». Éxito: toast «Datos actualizados».
- A3a: `Alert` de error «Revisá los campos marcados · El valor pertenece a otro usuario o el formato es incorrecto.», el campo con borde `border-error` y su mensaje debajo (`text-error text-xs`), conservando lo ingresado.

### 4.13 Alta de cuenta de personal (`features/privado/usuarios`)

CU 1.1 · A1. Sigue el formulario del registro (4.7) dentro del layout privado, sin DNI.

- Pantalla `/admin/usuarios/nuevo` (solo Administrador), con «‹ Volver a usuarios», título `font-outfit text-[28px] font-bold` y bajada «Alta de recepcionistas y organizadores del club.».
- Grilla `lg:grid-cols-[minmax(0,1fr)_22rem] gap-6`. Formulario en tarjeta `bg-panel border border-gray-800 rounded-2xl p-6 md:p-8` con tres bloques separados por `border-gray-800`: «Datos personales» (nombre, apellido, teléfono opcional), «Rol *» (dos tarjetas de opción, Recepcionista y Organizador, con el mismo estilo que el selector de rol de 4.11; sin elegir y con error, borde `border-error` y «Elegí un rol») y «Acceso a la cuenta» (correo, contraseña inicial y confirmación, con `RequisitosPassword` cuando la contraseña falla). Pie «Cancelar» (`neutro`, izquierda) y «Crear cuenta» (`primario`, derecha).
- Tarjeta lateral «Antes de crear la cuenta» con tres `Nota`: solo Recepcionista u Organizador, el personal no lleva DNI y la contraseña inicial se cambia desde Mi perfil.
- Errores como en el registro: `Alert` «Revisá los campos marcados» / «La contraseña no es válida» / «Ya existe una cuenta con ese correo» y el campo marcado, conservando lo ingresado. Éxito: toast «Cuenta de personal creada correctamente» y vuelta al listado filtrado por el correo nuevo.

### 4.14 Torneos y Ligas · listado de gestión (`features/privado/torneos`)

Tomado del Figma del CU 3.1 («CU 3.1», «Estados y flujos alternativos» y «Vista móvil»).

- Pantalla `/gestion/torneos` (Organizador y Administrador). Contenedor `max-w-7xl mx-auto flex flex-col gap-6`; título «Torneos y Ligas» (`font-outfit text-[28px] font-bold`), bajada «Gestioná los eventos competitivos del club» y, a la derecha, «+ Crear nuevo evento» (primario). En el celular el botón pasa a ser flotante: círculo `w-14 h-14 bg-viper` con «+», abajo a la derecha.
- `Tabs` Activos / Históricos (Activos: Planificado, Inscripciones abiertas, Inscripciones cerradas, En curso; Históricos: Finalizado, Cancelado, Archivado). Debajo, buscador «Buscar por nombre» y los `Select` «Estado: Todos» (solo los estados de la pestaña) y «Disciplina: Todas». En el celular los dos selects van en un `BottomSheet` «Filtros» que se abre con un botón cuadrado con ícono; si hay filtros activos, el botón muestra un punto `bg-viper`.
- Tabla (desde `lg`) dentro de una tarjeta `bg-panel border border-gray-800 rounded-2xl`: encabezado `text-xs font-semibold uppercase text-texto-suave`; columnas Evento (nombre y «Categoría · Disciplina» en `text-sm text-texto-suave`), Formato y Precio (desde `xl`), Fechas («05/11 – 20/11», con año si no es el actual), Inscriptos («12 / 32» con barra `h-1 bg-gray-800` y relleno `bg-viper`), Estado (`EstadoBadge`) y menú ⋮. Filas separadas por `border-gray-800`, `hover:bg-fondo/50`. En el celular cada torneo es una tarjeta con nombre y ⋮, subtítulo, badge, fechas con ícono de calendario e inscriptos.
- Orden: por estado (en el orden en que avanza un torneo) y, dentro de cada estado, la fecha de inicio más próxima primero. Pie «1–10 de 24» con flechas ‹ › (`w-10 h-10 bg-panel border rounded-lg`). Precio «$ 8.000»; si es 0, «Sin cargo».
- Menú ⋮ (`MenuAcciones`): panel `bg-panel border border-gray-800 rounded-xl w-56`, opciones `text-sm px-4 py-3`, y «Cancelar torneo» al final en `text-error` con separador. Las opciones salen de `accionesPermitidas`: Planificado → Editar, Abrir inscripciones, Cancelar torneo; Inscripciones abiertas → Ver detalle, Cerrar inscripciones, Cancelar torneo; Inscripciones cerradas y En curso → Ver detalle, Cancelar torneo; el resto → Ver detalle.
- Confirmaciones (`ConfirmarAccionTorneo`, `ConfirmDialog` con `posicion="abajo-movil"`, botón «Volver»): A2 «¿Abrir inscripciones?» (primario); A3 «¿Cerrar inscripciones?» (primario) con «N inscripciones con pago pendiente van a quedar fuera del cuadro.», que se consulta al abrir el diálogo; A4 «¿Cancelar torneo?» (`peligro`) con «Se van a anular todas las inscripciones y cancelar las reservas de cancha del torneo. Los reembolsos se gestionan fuera del sistema.». Al confirmar: toast con el mensaje de la API y la lista se vuelve a cargar.
- Vacío por pestaña: «Todavía no hay torneos activos» (con «+ Crear nuevo evento») o «Todavía no hay torneos históricos»; con filtros, «No encontramos torneos» y «Limpiar filtros» (secundario).

### 4.15 Crear / editar torneo (`features/privado/torneos`)

Tomado del Figma del CU 3.1 («CU 3.1 Form Evento», «Estados y flujos alternativos» y «Vista móvil»).

- Pantallas `/gestion/torneos/nuevo` y `/gestion/torneos/:id/editar` (misma vista). «‹ Volver a torneos», título «Crear nuevo evento» / «Editar evento» y bajada. Contenido centrado (`max-w-4xl mx-auto w-full`), igual que el resto de las pantallas de gestión. Tarjeta `bg-panel border border-gray-800 rounded-2xl p-6 md:p-10` con tres bloques separados por `border-gray-800`, cada uno con título `text-xs font-bold uppercase text-texto-suave`: «Datos generales», «Formato de competencia» y «Fechas y precio».
- Disciplina: control segmentado (`bg-fondo border rounded-lg p-1`, opción elegida `border-viper bg-viper/10 text-viper`). La categoría es un `Select` con las categorías de esa disciplina; al cambiar de disciplina se vacía.
- Formato: dos tarjetas de opción (patrón de 4.11) con título y descripción. «Clasificados por zona» solo aparece con Zonas + Eliminación.
- `Contador` (clasificados y cupo): campo `h-12` con botones − y + a los costados separados por borde; se puede escribir; con error, borde `border-error`. Los botones no salen del rango válido.
- Precio con prefijo «$» y puntos de miles al salir del campo («8.000»). Fechas con `input type="date"` (`[color-scheme:dark]`).
- Pie: «Cancelar» (`neutro`, izquierda) y «Guardar Evento» (`primario`, derecha). En el celular solo queda «Guardar Evento», fijo abajo y a todo el ancho.
- 6a: `Alert` de error «Revisá los campos marcados antes de continuar», campos en rojo con su mensaje («Completá este campo», «La fecha de fin no puede ser anterior a la de inicio», «Debe haber al menos 1 clasificado por zona», «Con zonas, el cupo mínimo es 6 (dos zonas de 3)») y foco en el primero. 4a: con cambios sin guardar, `ConfirmDialog` «¿Descartar cambios?» con «Seguir editando» / «Descartar». A1 fuera de Planificado: `Alert` info «Este evento ya no se puede editar: está en …», campos deshabilitados (`opacity-60`) y solo «Volver». Éxito: toast «Evento creado correctamente» / «Evento actualizado correctamente» y vuelta a la lista.

### 4.16 Ficha del torneo · gestión (`features/privado/torneos`)

Sin pantalla propia en el Figma del CU 3.1: usa los mismos patrones que el formulario (4.15) y los modales de «Estados y flujos alternativos».

- Pantalla `/gestion/torneos/:id` (breadcrumb «Detalle del torneo»). Se llega desde el nombre del torneo en la lista o desde «Ver detalle» del menú ⋮. Contenido centrado (`max-w-5xl mx-auto w-full`).
- Encabezado: «‹ Volver a torneos», nombre `text-[28px] font-bold` con el `EstadoBadge` al lado y bajada «Categoría · Disciplina». A la derecha (debajo en móvil, a todo el ancho) los botones que permite `accionesPermitidas`: «Editar» (`neutro`, solo Planificado), «Abrir inscripciones» / «Cerrar inscripciones» (`primario`), «Generar cuadro» (`primario`, con inscripciones cerradas y solo para Organizador y Administrador; lleva a 4.22) y «Cancelar torneo» (`peligro-borde`). Cada uno, salvo «Generar cuadro», abre el mismo `ConfirmarAccionTorneo` del listado (A2, A3 con la cantidad de pendientes, A4 con la advertencia de reembolsos) y al confirmar la ficha se vuelve a pedir sin recargar la página.
- `Tabs` «Datos» · «Inscriptos» · «Cabezas de serie» · «Cuadro / Zonas» · «Cronograma»; (4.20, 4.21, 4.22, 4.23, 4.24, 4.25, 4.26 y 4.27 describen «Inscriptos», «Cabezas de serie», «Cuadro / Zonas» y «Cronograma»).
- Datos: tarjeta «Inscriptos» con tres contadores (`bg-fondo border rounded-xl`, número `font-outfit text-2xl sm:text-3xl`, inscriptos en `text-viper`) en tres columnas también en el celular, y barra de cupo `h-2 bg-gray-800` con relleno `bg-viper`. Tarjeta «Datos del torneo» con lista de dos columnas (etiqueta 13px gris, valor debajo): disciplina, categoría, formato, clasificados por zona (solo con zonas), fechas completas `dd/mm/aaaa` y precio.
- Cancelado: `Alert` info «Este torneo fue cancelado: sus inscripciones se anularon y los reembolsos se gestionan fuera del sistema.». Torneo inexistente: `Alert` de error «No encontramos el torneo» con link a la lista.

### 4.17 Torneos del jugador · lista y ficha pública (`features/privado/torneos`)

Figma CU 3.2 («Torneos disponibles» y «Ficha del torneo»).

- Lista `/portal/torneos` (`max-w-5xl mx-auto w-full`): título «Torneos», `Tabs` «Disponibles» · «Mis inscripciones» (la segunda deshabilitada hasta M3-FE-06). Tarjetas `bg-panel border rounded-2xl p-5` en una columna (celular) o dos (md+): nombre, «Disciplina · Categoría · Formato», `EstadoBadge` y tres datos (fechas, cupo, precio). Muestra los torneos con inscripciones abiertas primero y los en curso después. Con cupo lleno el cupo dice «Completo» en rojo.
- Ficha `/portal/torneos/:id` (breadcrumb «Detalle del torneo»): encabezado como la ficha de gestión; en escritorio tarjeta «Detalles del torneo» (dos columnas) a la izquierda y tarjeta «Inscripción» a la derecha (`22rem`); en celular la tarjeta «Inscripción» va primero.
- Tarjeta «Inscripción» (`PanelInscripcion`): «Cupo disponible» con el número en `font-outfit text-5xl` (`text-viper`, rojo si es 0), barra de cupo y «N de M lugares ocupados»; precio `text-3xl`; nota «En Pádel te inscribís junto a un compañero.»; botón primario grande «Inscribirme» (enlace a `/portal/torneos/:id/inscripcion`, M3-FE-05). Sin cupo el botón queda deshabilitado con «Cupo completo». Si el jugador ya está inscripto, un recuadro «Ya estás inscripto» (pareja y estado del pago/plazo) reemplaza al botón. Fuera de inscripciones abiertas muestra «Inscriptos» y un aviso en vez del botón.
- En curso: debajo de las dos tarjetas, `Tabs` «Cuadro / Zonas» (el cuadro o las zonas de 4.22 y 4.23, sin las acciones del Organizador) y «Cronograma» (4.27), que abre primero.

### 4.18 Formulario de inscripción · jugador (`features/privado/torneos`)

Figma CU 3.2 («Form Inscripcion», «Estados y flujos alternativos» 4a, 5a, 6a y 7a).

- Pantalla `/portal/torneos/:id/inscripcion` (breadcrumb «Torneos › Inscripción»), contenido `max-w-5xl mx-auto w-full`. Título «Inscripción» con bajada «Torneo · Disciplina · Categoría X». Dos columnas desde `lg`: formulario a la izquierda y tarjeta «Resumen» (`22rem`) a la derecha; en celular el resumen va primero.
- Formulario (tarjeta `bg-panel border rounded-2xl`): «Compañero» (solo Pádel) con `Input` de DNI, botón neutro «Buscar» y, al encontrarlo, tarjeta `bg-fondo border-viper/50` con iniciales, nombre, «DNI 12.345.678 · Categoría X» y «Quitar»; «Verificación de requisitos» con tres renglones (✓ verde, ✕ rojo o reloj gris «se verifica al confirmar»); «Medio de pago» con dos tarjetas seleccionables (`role="radio"`): «Pagar en línea» deshabilitada con la etiqueta «Próximamente» y «Pagar en recepción» elegida por defecto; pie con «Cancelar» (neutro) y «Confirmar inscripción» (primario, deshabilitado hasta tener compañero en Pádel).
- Errores de la API en un `Alert` de error sobre la tarjeta, con el título de Figma: «Cupo completo» (4a), «Ya hay una inscripción activa» (5a) y «Categoría incompatible» (6a). Con cupo lleno o ya inscripto el botón queda deshabilitado.
- Resultado (7a): tarjeta con `Alert` éxito «Inscripción registrada» («Tu cupo queda reservado hasta el dd/mm a las HH:MM; pagá en recepción.»), datos de la inscripción con `EstadoBadge` de pago, aviso de anulación por vencimiento y botones «Ver mis inscripciones» y «Volver al torneo».

### 4.19 Mis inscripciones · jugador (`features/privado/torneos`)

Figma CU 3.2 («Mobile/Mis inscripciones», pestaña «Mis inscripciones» de Torneos). Reemplaza el «deshabilitada» de la pestaña descripto en 4.17.

- Es la segunda pestaña de `/portal/torneos`; la elegida vive en la URL (`?vista=mias`), así que se puede recargar, volver desde la ficha o llegar con «Ver mis inscripciones» del resultado de una inscripción.
- Tarjetas `bg-panel border rounded-2xl p-5` (una columna en celular, dos desde `md`), cada una enlaza a la ficha del torneo: nombre `font-outfit text-lg`, línea «Pádel · con Nombre Apellido · Vence 03/11 · 20:00» (el compañero solo en Pádel; el vencimiento solo mientras el pago está pendiente), badges, «Categoría · fechas» en `text-xs` y un aviso.
- Badges: `EstadoBadge` de inscripción («Activa» verde, «Anulada» rojo) y de pago («Pagado» verde, «Pago pendiente» amarillo). En una anulada se reemplaza el de pago por «Pagado» o «Sin pago» en gris.
- Avisos: pendiente → «Tu cupo queda reservado hasta el dd/mm a las HH:MM; pagá en recepción.» en `text-xs text-advertencia`. Anulada → «Se anuló porque no se pagó a tiempo.» o, si el torneo se canceló, «El torneo se canceló; el reembolso, si corresponde, se gestiona con el club.»
- Las vigentes van primero y las anuladas al final con `opacity-70`. Vacío: `EmptyState` «Todavía no te inscribiste a ningún torneo» con el botón «Ver torneos disponibles».

### 4.20 Inscriptos y registro de pago · gestión (`features/privado/torneos`)

CU 3.2 · 7a. Sin pantalla propia en Figma: reutiliza el patrón de tabla/tarjetas de «Torneos y Ligas» (4.15) y la ficha de gestión (4.16). Reemplaza la pestaña «Inscriptos» deshabilitada de 4.16.

- **Entradas:** (1) pestaña «Inscriptos» de la ficha del torneo (Organizador y Administrador); (2) `/gestion/inscripciones` (Recepcionista, Organizador y Administrador): tarjetas `bg-panel border rounded-2xl p-5` en una, dos (`md`) o tres (`xl`) columnas, una por torneo con inscripciones (nombre `font-outfit text-lg`, «Categoría · Disciplina», `EstadoBadge` del torneo, fechas y «inscriptos / cupo» con barra); los abiertos primero. Cada una lleva a `/gestion/inscripciones/:id`, que muestra el mismo panel con el nombre del torneo arriba.
- **Panel:** tres cifras (Pagadas, Pago pendiente, Anuladas; `bg-panel border rounded-xl`, número `font-outfit text-2xl sm:text-3xl`), buscador «Buscar por nombre o DNI», filtro de estado (`Select`: Todas, Pago pendiente, Pagadas, Anuladas) y la lista.
- **Lista:** desde `lg`, tabla en un contenedor `bg-panel border rounded-2xl` con columnas Jugador (nombre, DNI y, en Pádel, «con Compañero»), Inscripción (desde `xl`), Estado (badges de inscripción y de pago), Pago («Vence el dd/mm · HH:MM» en `text-advertencia`, «Pagó el dd/mm a las HH:MM» en `text-texto-suave`, «—» si está anulada) y la acción. En el celular, una tarjeta por inscripción con lo mismo y el botón a todo el ancho. Las anuladas van al final con `opacity-70`.
- **Registrar pago en efectivo:** botón primario compacto `text-sm` en cada inscripción con pago pendiente («Registrar pago» hasta `xl`, «Registrar pago en efectivo» desde `xl`), solo para Recepcionista y Administrador; el Organizador solo ve la lista. Abre `ConfirmDialog` (`advertencia`, botón primario, `abajo-movil`): «¿Registrar pago en efectivo?» con el jugador (y su compañero) y el precio. Al confirmar, la fila pasa a Pagado sin recargar y aparece el toast «Pago registrado»; si la API responde 409 (venció o ya estaba pagada) se muestra su mensaje y la lista se actualiza.
- **Vacíos:** sin inscriptos, `EmptyState` «Todavía no hay inscriptos»; sin resultados, «No encontramos inscripciones» con «Limpiar filtros»; torneo planificado, «Todavía no hay inscripciones».

### 4.21 Cabezas de serie · gestión (`features/privado/torneos`)

Figma CU 3.3 («Config Cabeza de Serie», «Estados y flujos alternativos» 2a, 4a, 5a y 7, y la vista móvil). Solo Organizador y Administrador.

- **Pestaña «Cabezas de serie»** de la ficha del torneo (4.16), entre «Inscriptos» y «Cuadro / Zonas». Cuatro cifras (`bg-panel border rounded-xl`, dos columnas en celular y cuatro desde `lg`): Inscripciones activas, Con pago confirmado (número en `text-viper`), Pago pendiente (número en `text-advertencia`) y Cabezas de serie «0 / 5». Debajo, una tarjeta `bg-panel border rounded-2xl` con el título «CABEZAS DE SERIE» (`text-xs uppercase`): sin cabezas, círculo `bg-viper/15` con una estrella, «Todavía no configuraste cabezas de serie» y el botón primario «Configurar Cabezas de Serie»; con cabezas, «Hasta N (una por zona / un cuarto del cuadro)», el botón neutro «Editar cabezas de serie» y una fila por cabeza (`bg-fondo border rounded-xl`: «1°», pareja, puntos y la insignia). Planificado: «Todavía no hay inscripciones»; en curso o posterior: `Alert` info «Las cabezas de serie se configuran con las inscripciones abiertas o cerradas.».
- **Insignia «Cabeza de serie»:** `Badge` `violeta` con una estrella (`BadgeCabeza`, en `PanelCabezas`). Se mantiene violeta (decisión del equipo) para distinguirla del verde de «Pagado».
- **Pantalla `/gestion/torneos/:id/cabezas-de-serie`** (breadcrumb «Torneos y Ligas › Cabezas de serie», `max-w-5xl`): «‹ Volver a la ficha del torneo», título «Configurar Cabezas de Serie», bajada «Torneo · Disciplina · Formato» y `Alert` info «Podés elegir hasta N cabezas de serie (…). Se distribuyen en zonas distintas / Se ubican separadas en el cuadro al generar la competencia.». En el celular, arriba de la lista, una tarjeta contador («Cabezas de serie seleccionadas» y «3 / 5» en `font-outfit text-2xl text-viper`, rojo con borde `border-error/50` si se pasa; al guardar dice «Cabezas de serie guardadas»).
- **Lista:** las pagadas de mayor a menor puntaje. Cada inscripción es un `<label>` con una sola casilla (`Checkbox`, 24 px, tildada `bg-viper`), así se marca tocando cualquier parte. Desde `lg`, tabla con columnas casilla · Pos. · Pareja (o Jugador) con «Inscripción activa» · Categoría (desde `xl`; en `lg` va junto a «Inscripción activa») · Puntos («Puntos (suma)» en Pádel) · Pago («Pagado» y, si ya está guardada, «Cabeza de serie»); la fila marcada va con `bg-viper/5`. En el celular, una tarjeta por inscripción (casilla, nombre, puntos y «N° · Categoría»; marcada con `border-viper/50`; la insignia solo aparece en las ya guardadas). La categoría sale de la ficha del torneo (`GET /torneos/:id`): todas las inscripciones son de la misma.
- **Pie (desde `sm`):** a la izquierda el contador («Seleccionadas», o «Guardadas» si no hay cambios, con «2 / 5» y una barra `h-2 w-28`, roja si se pasa) y debajo «Mostrando 5 inscripciones pagadas, de mayor a menor puntaje»; a la derecha «Volver» / «Cancelar» (`neutro`) y «Guardar Cabezas de Serie» (`primario`). En el celular, barra fija abajo (`fixed bottom-0`, mismo patrón que 4.15) solo con «Guardar Cabezas de Serie».
- **Flujos:** «Guardar» está deshabilitado sin cambios o pasado el máximo. 5a: `Alert` de error «Superaste el máximo de cabezas de serie» («El máximo es 5 (una por zona). Quitá 1 para poder guardar.»); la API también lo valida (`400`). 4a: «Cancelar» o «‹ Volver» con cambios abren `ConfirmDialog` «¿Descartar la selección?» («Si salís ahora, se pierden los cambios sin guardar.») con «Seguir editando» / «Descartar». 7: toast «Cabezas de serie guardadas», se queda en la pantalla y las guardadas muestran la insignia; «Volver» lleva a la ficha, ya en la pestaña «Cabezas de serie» (llega `state.pestana`).
- **2a (inscriptos insuficientes) y estado no válido** (`409`): `AvisoEtapa` con `Alert` advertencia «Aún no es posible configurar esta etapa» («Hay 2 inscripciones pagadas y Eliminación Directa requiere al menos 4.»), tarjeta «Inscripciones con pago confirmado» con «2 / 4» y barra `h-2` en `text-advertencia` / `bg-advertencia` y, en la pantalla (no en la pestaña), «Volver a la ficha del torneo» (a la derecha desde `sm`, a todo el ancho en celular). Torneo inexistente: `Alert` de error «No encontramos el torneo».
- **Componente nuevo:** `Checkbox` (`shared/components`), casilla propia (`rounded-md border-gray-700`, tildada `bg-viper border-viper` con tilde `text-black`, foco `ring-viper/50`); el `input` real queda encima, invisible, así funciona con teclado y lectores. Va dentro de un `<label>`. El cliente de la API ahora deja el cuerpo del error en `error.datos`.

### 4.22 Generar cuadro de competencia · gestión (`features/privado/torneos`)

Figma CU 3.4 («Generar cuadro», «Estados y flujos alternativos» 2a y la vista móvil). Solo Organizador y Administrador. Cubre los pasos 1 y 2 del CU (resumen y confirmación); el cuadro generado y la regeneración llegan con sus propias tareas.

- **Entradas:** botón primario «Generar cuadro» en el encabezado de la ficha (4.16), solo con el torneo en Inscripciones cerradas, y la pestaña «Cuadro / Zonas», que en ese estado muestra `EmptyState` «Todavía no generaste el cuadro» con «Generar Cuadro de Competencia». Con inscripciones abiertas o planificado, la pestaña dice «Todavía no hay cuadro»; cancelado, `Alert` info; ya generado, el cuadro de eliminación (4.23) o, con zonas, las zonas (4.24).
- **Pantalla `/gestion/torneos/:id/generar-cuadro`** (breadcrumb «Torneos y Ligas › Generar cuadro», `max-w-5xl`): «‹ Volver a la ficha del torneo», título «Generar Cuadro de Competencia» y bajada «Torneo · Disciplina · Formato». Desde `lg`, dos columnas (`grid-cols-[minmax(0,1fr)_18rem]`): a la izquierda el resumen y a la derecha «Qué se va a generar»; debajo de `lg`, una sola columna.
- **Resumen previo** (`bg-panel border rounded-2xl`, etiqueta 13px gris y valor debajo, dos columnas desde `sm`): Formato, Categoría técnica, «N con pago confirmado», Cabezas de serie («5 (una por zona)» o «Ninguna»), Período de programación («01/02/2030 – 15/02/2030», las fechas del torneo) y, con zonas, Clasificados por zona. La categoría y las fechas salen de `GET /torneos/:id`; el resto, de `GET /torneos/:id/generar-cuadro/preview`.
- **Requisitos:** lista en `bg-fondo border rounded-xl` con un círculo de 24 px por ítem: tilde `bg-viper/15 text-viper` (cumplido), cruz `bg-error/15 text-error` (sin cumplir) y guion `bg-advertencia/15 text-advertencia` (opcional). Ítems: «Torneo en Inscripciones cerradas», «Mínimo de inscripciones pagadas (20 / 6)» y «Cabezas de serie configuradas» (sin cabezas es opcional: «Sin cabezas de serie (opcional): los lugares se sortean. Configurar», con link a 4.21). En el celular se resume en un botón «Requisitos cumplidos (3 de 3)» / «Requisitos (2 de 3)» que despliega la lista.
- **Pendientes:** `Alert` advertencia «N inscripciones con pago pendiente quedan fuera del cuadro» con «Solo participan las inscripciones activas y con pago confirmado.».
- **2a y otros bloqueos** (`puedeGenerar: false`): `Alert` advertencia «No se puede generar la competencia» con el motivo («Hay 4 inscripciones pagadas y Zonas + Eliminación requiere al menos 6. Ajustá las inscripciones para continuar.», el máximo del cuadro de eliminación directa o las cabezas de serie de más), tarjeta «Inscripciones con pago confirmado» con «4 / 6» en `text-advertencia` y barra `h-2` `bg-advertencia` (solo en el mínimo), y «Editar cabezas de serie» (`neutro`, link) cuando sobran cabezas. «Generar Cuadro de Competencia» queda deshabilitado y «Cancelar» pasa a decir «Volver a la ficha del torneo».
- **Botones:** desde `sm`, al pie: «Cancelar» (`neutro`, izquierda) y «Generar Cuadro de Competencia» (`primario`, derecha). En el celular, barra fija abajo (`fixed bottom-0`, mismo patrón que 4.15) con el botón primario.
- **Qué se va a generar** (`QueSeGenera`, solo desde `lg`): tarjeta con cuatro pasos numerados (círculo `bg-viper/15 text-viper`) según el formato (zonas de 3 o 4 parejas / cuadro con byes, cabezas separadas, fixture o byes, cancha y horario) y una nota al pie.
- **Confirmación:** `ConfirmDialog` `advertencia` con botón `primario` y `abajo-movil`: «¿Generar el cuadro de competencia?» («Se arma el sorteo de zonas y se programan los partidos. El torneo pasa a En curso y las inscripciones y las cabezas de serie ya no se pueden modificar. Mientras no haya resultados, se puede regenerar.») con «Volver» / «Generar cuadro». Mientras genera, el botón muestra el spinner y el texto pasa a «Armando el cuadro y asignando cancha y horario a los partidos…».
- **Al terminar:** toast «Cuadro generado correctamente» y vuelve a la ficha en la pestaña «Cuadro / Zonas» (llega `state.pestana`). Si quedaron partidos sin cancha ni horario (5a), el toast es de advertencia con el mensaje de la API y la pestaña muestra el aviso de partidos sin franja (4.25). Si la API rechaza la generación (409: cambió el estado, los pagos o las cabezas), toast de error y se vuelve a pedir el resumen.
- **Estados no válidos:** con el cuadro ya generado, `Alert` info «Este torneo ya tiene el cuadro generado.»; con otro estado, el mensaje de la API («El cuadro se genera con las inscripciones cerradas»); torneo inexistente, `Alert` de error «No encontramos el torneo».

### 4.23 Cuadro de eliminación · `Bracket` (`features/privado/torneos`)

Figma CU 3.4 («Cuadro Generado», «Estados y flujos alternativos» con la leyenda, y la vista móvil) y CU 3.9. Componente reutilizable: `<Bracket rondas acciones />` en `components/Bracket.jsx`, con `PartidoCard.jsx` (el partido) y `DetallePartido.jsx` (el detalle). Lo usa la pestaña «Cuadro / Zonas» de la ficha (4.16) para los torneos de eliminación directa generados (En curso, Finalizado, Archivado); la fase eliminatoria de las zonas (4.24) y las vistas del jugador lo reutilizan.

- **Datos:** `rondas` de `GET /torneos/:id/cuadro` (de la primera ronda a la final); cada partido trae `estado`, `esBye`, `local` y `visitante` (o `null`), `ganadorInscripcionId` y `programacion` (fecha, horas y cancha). `sets` (`[{ local, visitante }]`) es opcional: sin él no se muestra marcador. `acciones` son las que tiene quien gestiona el torneo (`ACCIONES_PARTIDO` de `torneos.js` con su `onClick`); los jugadores no las pasan y el detalle solo se mira.
- **Escritorio y tablet (desde `md`, 768 px):** una columna por ronda de 200 px con 56 px entre columnas (`gap-14`). Arriba de cada columna, el nombre de la instancia en `text-[13px] font-semibold uppercase tracking-wide text-texto-suave` («CUARTOS DE FINAL»). Cada partido de la primera ronda ocupa 76 px y los de las rondas siguientes, el doble, centrados entre los dos que los alimentan. Conectores de 1 px `border-gray-700`: un tramo de 28 px sale de cada partido, una línea vertical une al par y otro tramo de 28 px entra al partido siguiente. Si no entra en el ancho, la grilla se desplaza dentro de su recuadro (`overflow-x-auto`); la página no se desplaza.
- **Celular (menos de `md`):** selector de ronda con botones redondeados (`rounded-full border px-4 py-1.5`; elegido `bg-viper/15 border-viper text-viper`, el resto `bg-panel border-gray-800 text-texto-suave`), que se desplaza sin romper la página, y debajo los partidos de esa ronda uno debajo del otro, a todo el ancho y con filas de 44 px. La ronda inicial es la primera.
- **Partido** (`bg-panel border border-gray-800 rounded-lg`, dos filas de 26 px en la grilla y de 44 px en el celular, separadas por una línea `border-gray-800`; `hover:border-viper`): es un botón que abre el detalle. Cada fila lleva el nombre abreviado («M. Pérez» o «M. Pérez / L. Ríos» en Pádel) y, antes, una estrella `text-violeta` si es cabeza de serie. Con ganador, su fila va con `bg-viper/10` y el nombre en `font-semibold text-texto`, y el perdedor en `text-texto-suave`. Un rival que falta dice «Por definir» (`text-texto-suave`); el hueco de un bye dice «BYE» (`font-semibold tracking-wide text-texto-suave`) y el bye no resalta a nadie. Con marcador, los games de cada set a la derecha (`tabular-nums`; el del ganador del set en negrita). En W.O., el partido lleva el borde `border-advertencia/60`, el ganador dice «W.O.» (`text-advertencia font-semibold`) y el otro «Baja» (`text-error`).
- **Programación:** bajo el partido, en `text-xs text-texto-suave` y una sola línea: «Jue 12/11 · 10:00 · Tenis 1». Con los dos rivales y sin cancha ni horario, «Sin programar» en `text-advertencia`. En la grilla va flotando debajo (`absolute`), así los conectores salen del centro del partido.
- **Detalle** (`Modal` `abajo-movil`: panel inferior en el celular): título «Cuartos de final · Partido 2», `EstadoBadge` del partido («BYE» si lo es), los dos participantes en tarjetas (`bg-fondo border rounded-xl`; el ganador con `border-viper/50 bg-viper/10` y el badge `exito` «Ganador»; con la insignia `violeta` «Cabeza de serie» y el marcador a la derecha en `font-outfit text-lg font-bold`), Fecha y hora («Jue 12/11 · 10:00 a 11:30») y Cancha, o «Sin programar». Un bye dice «Sin rival: avanza a la ronda siguiente sin jugar.».
- **Acciones del partido** (solo Organizador y Administrador; sin `acciones` no aparecen): bajo una línea `border-gray-800`, «Cargar resultado» (`primario`, partido Programado con los dos rivales), «Reprogramar» (`neutro`; «Programar» si el partido todavía no tiene franja) y «Registrar W.O.» (`peligro-borde`) (los dos últimos, con los rivales y sin jugar). «Reprogramar» y «Programar» llevan a la pantalla de programar (4.26). Una acción sin `onClick` queda deshabilitada y el detalle avisa «Estas acciones se habilitan con las próximas tareas del plan.» (cada pantalla que las implementa les agrega su `onClick`).
- **Leyenda** (bajo el cuadro, `text-sm text-texto-suave`): la estrella «Cabeza de serie», «BYE: avanza a la ronda siguiente sin jugar» y «Tocá un partido para ver el detalle».
- **Estados de la pestaña:** cargando, `Spinner` «Cargando cuadro»; con error, `Alert` de error «No pudimos cargar el cuadro» con «Reintentar». Un torneo con zonas muestra sus zonas (4.24).

### 4.24 Zonas · `Zonas` (`features/privado/torneos`)

Figma CU 3.4 («Cuadro Generado» con las zonas A a E, y la vista móvil «Zonas generadas»). Componente reutilizable: `<Zonas zonas disciplina acciones />` en `components/Zonas.jsx`, con `ZonaCard.jsx` (una zona) y el mismo `DetallePartido` del cuadro (4.23). Lo usa la pestaña «Cuadro / Zonas» de la ficha (4.16) para los torneos con zonas generados (En curso, Finalizado, Archivado). Si el torneo ya tiene la fase eliminatoria (CU 3.9), la pestaña suma `Tabs` «Zonas» · «Eliminatoria» y la segunda muestra el `Bracket`.

- **Datos:** `zonas` de `GET /torneos/:id/cuadro`; cada zona trae `nombre`, `cerrada`, `posiciones` (posición, partidos ganados y perdidos, sets y games a favor y en contra, `clasificado`, `participante`) y `partidos` (los mismos que los del cuadro; `sets` es opcional). `disciplina` define si se habla de «parejas» o de «jugadores». `acciones` son las de quien gestiona el torneo (`ACCIONES_PARTIDO`); sin ellas el detalle solo se mira.
- **Grilla:** una columna en celular y tablet y dos desde `lg` (`grid-cols-1 lg:grid-cols-2 gap-4 items-start`). Sobre la grilla, a la derecha, el botón de texto «Expandir todas» / «Contraer todas» (`text-sm font-semibold text-viper`) cuando hay más de una zona. Al abrir, quedan abiertas las primeras 6 zonas en pantallas desde `md` y solo la primera en el celular.
- **Tarjeta de zona** (`bg-panel border border-gray-800 rounded-2xl overflow-hidden`): el encabezado es un botón a todo el ancho (`px-5 py-4`, chevron que gira al abrir y `aria-expanded`) con «Zona A» en `font-outfit text-lg font-bold`, el `Badge` `exito` «Zona cerrada» si corresponde y debajo «4 parejas · 6 partidos · 3 jugados» en `text-sm text-texto-suave`. Plegada solo se ve el encabezado, como en el Figma.
- **Tabla de posiciones** (`role="table"`, filas `bg-fondo rounded-lg px-3 py-2` con 4 px entre ellas): columnas Pos. · Pareja (o Jugador) · PJ · PG · PP · Sets · Games, con la cabecera en `text-xs font-semibold uppercase tracking-wide text-texto-suave`. Sets y Games se muestran «a favor-en contra» («4-1», «26-14»). En el celular se ocultan PJ y Games y el nombre puede ocupar dos líneas; desde `sm` aparecen todas y el nombre se corta con puntos suspensivos. Los ceros van en `text-texto-suave`. Antes de jugar no hay posición: la primera columna muestra el lugar de la zona («A1», «A2»…); con resultados, «1°», «2°»…
- **Clasificados:** la fila va con `bg-viper/10`, la posición en `text-viper` y, bajo el nombre, «Clasifica» en `text-[11px] font-semibold text-viper`. La API los marca solo con la zona completa.
- **Partidos de la zona:** «Primeros partidos (3 de 6)» (o «Partidos (N)» si son 3 o menos o se abrieron todos) en `text-xs font-bold uppercase`, una fila por partido (botón `bg-fondo border border-gray-800 rounded-lg px-3 py-2`, `hover:border-viper`) con los dos rivales uno encima del otro (el ganador en `font-semibold text-texto`, el perdedor en `text-texto-suave`) y a la derecha: el marcador por sets («6-3 6-4»), «Jue 05/11 · 08:00» con la cancha debajo, «Sin programar» en `text-advertencia` o el W.O. El link «Ver los 6 partidos» / «Ver menos» (`text-sm font-semibold text-viper`) los muestra todos.
- **W.O.:** la fila va con `border-advertencia/60 bg-advertencia/5`, el `Badge` `advertencia` «W.O.» y debajo «Baja del rival» en `text-error` (en el cuadro, el partido lleva el borde `border-advertencia/60`). Cuenta como 6-0 6-0 para el rival, como calcula la API.
- **Detalle:** el mismo modal del cuadro (4.23), con el título «Zona A · Fecha 1» (la fecha es la ronda del todos contra todos) y las acciones del Organizador.
- **Leyenda** (bajo las zonas, `text-sm text-texto-suave`): cuadrado `bg-viper/30` «Clasifica a la eliminatoria», «W.O.: se resolvió por baja y cuenta como 6-0 6-0 para el rival» y «PG ganados · PP perdidos · Sets y Games a favor-en contra».

### 4.25 Partidos sin franja y regenerar cuadro (`features/privado/torneos`)

Figma CU 3.4 («Estados y flujos alternativos» 5a y 6a) y CU 3.9 (6a y 8a). Solo lo ve quien gestiona el torneo (Organizador y Administrador); el jugador ve el cuadro sin estos avisos. Vive en la pestaña «Cuadro / Zonas» de la ficha (4.16), sobre las zonas o el cuadro: `PartidosSinFranja.jsx`, `AmpliarFechaFin.jsx` y `RegenerarCuadro.jsx`, armados por `PanelCuadro.jsx`.

- **Qué es un partido sin franja:** el que tiene los dos rivales, no es bye, está `PENDIENTE` y no tiene `programacion`. Sale de los datos de `GET /torneos/:id/cuadro` (zonas y eliminatoria), así que el aviso sigue ahí al recargar la página, no solo al terminar de generar.
- **Aviso 5a:** `Alert` de error «Faltan franjas para programar todos los partidos» («Hay 3 partidos sin cancha ni horario dentro del período del torneo.»; en singular, «Hay 1 partido…»). Debajo, la lista (`bg-panel border border-gray-800 rounded-xl divide-y divide-gray-800`, con scroll desde `max-h-80`, sin barra visible): por fila, los rivales («A. Pérez vs L. Ríos», que pueden ocupar dos líneas), el lugar en `text-xs text-texto-suave` («Zona A» o «Cuartos de final»), el `Badge` `error` «Sin franja» y el botón `neutro` «Programar». Al final, «Reprogramar manualmente» (`neutro`) y «Ampliar fecha de fin» (`primario`), en fila a la derecha desde `sm` y apilados en el celular con el principal arriba.
- **Programar:** «Programar» y «Reprogramar manualmente» (que arranca por el primer partido de la lista) llevan a la pantalla de programar el partido (4.26).
- **Ampliar fecha de fin:** `Modal` «Ampliar fecha de fin» con el texto «El torneo termina el 07/11/2026. Con una fecha posterior, programamos los partidos que quedaron sin franja.», un campo de fecha «Nueva fecha de fin» (`type="date"`, `min` el día siguiente al fin actual, `[color-scheme:dark]`) y «Cancelar» / «Ampliar fecha de fin». Sin fecha o con una que no es posterior, el error va bajo el campo («Elegí una fecha posterior al 07/11/2026»). Llama a `PUT /torneos/:id/fecha-fin`: la API alarga el período y programa los partidos que entren. Toast de éxito «Fecha de fin ampliada: se programaron 3 partidos»; si algunos siguen sin lugar, toast de advertencia que dice cuántos. La ficha y el cuadro se vuelven a pedir. Si la API responde otra cosa que un error de la fecha (por ejemplo, el torneo ya no está en curso), toast de error y se recarga.
- **Regenerar cuadro (6a):** botón `neutro` «Regenerar cuadro» arriba a la derecha de la pestaña (a todo el ancho en el celular), solo con el torneo En curso. Abre `ConfirmDialog` de tipo `peligro` «¿Regenerar la competencia?» («Se eliminan las zonas y los partidos, y se cancelan las reservas de tipo Torneo. El torneo vuelve a Inscripciones cerradas.»; en eliminación directa, «el cuadro y los partidos») con «Volver» / «Regenerar cuadro». Al confirmar llama a `POST /torneos/:id/regenerar-cuadro`, avisa con el mensaje de la API y la ficha vuelve a pedir el torneo: queda en Inscripciones cerradas y la pestaña ofrece «Generar Cuadro de Competencia». Si algún partido tiene resultado o W.O. (`FINALIZADO` o `WO` que no sea bye), el botón queda deshabilitado y debajo dice «Ya hay resultados cargados: el cuadro no se puede regenerar.» en `text-xs text-texto-suave`. Si igual la API responde 409 (alguien cargó un resultado mientras tanto), toast de error con su mensaje y el cuadro se vuelve a pedir.

### 4.26 Programar o reprogramar un partido · grilla de canchas (`features/privado/torneos`)

Figma CU 3.5 («Programar partido» en escritorio y celular, «Estados y flujos alternativos» 3a, 3b y 4a, y «Partido programado»). Solo Organizador y Administrador. Ruta `/gestion/torneos/:id/partidos/:partidoId/programar`, con el breadcrumb «Torneos y Ligas › Detalle del torneo › Programar partido». Se llega desde «Programar» (partidos sin franja, 4.25) y desde «Reprogramar» / «Programar» del detalle del partido (4.23). Archivos: `views/ProgramarPartido.jsx`, `components/GrillaFranjas.jsx`, `components/ConflictoFranja.jsx` y `programacion.js` (la lógica de la grilla).

- **Datos:** el torneo (`GET /torneos/:id`), el cuadro (`GET /torneos/:id/cuadro`, de ahí salen el partido y los otros partidos de sus participantes) y, por cada día que se ve, `GET /canchas/disponibilidad?disciplina=&fecha=`. Solo se programa un partido pendiente o programado, con los dos rivales, en un torneo En curso; si no, `Alert` info «Este partido no se puede programar».
- **Estructura:** título «Programar partido» («Reprogramar partido» si ya tiene franja) y bajada «Torneo · Zona A · rivales». Contenedor `max-w-7xl`. Desde 1400 px, dos columnas (`min-[1400px]:grid-cols-[19rem_minmax(0,1fr)] gap-6 items-start`): a la izquierda, fijas al hacer scroll (`sticky top-24`), las tarjetas «Partido» y «Franja seleccionada» (con «Cancelar» y «Reservar franja»), a la derecha la grilla. Debajo de 1400 px es una sola columna en este orden: Partido, grilla, Franja seleccionada, con el botón «Reservar franja» fijo abajo (`fixed bottom-0 inset-x-0 lg:left-60 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30`, `lg:left-60` para no tapar el menú lateral) y `pb-24` en la pantalla. Así la grilla siempre tiene ancho para los 5 días (~120 px por día a 1024 px, ~145 px a 1469 px).
- **Grilla** (`bg-panel border border-gray-800 rounded-2xl p-5 md:p-6`): título «Disponibilidad de la cancha de pádel» (con varias canchas, «Disponibilidad de la cancha» y debajo `Tabs` con una pestaña por cancha, una cancha por vez), «Solo se ofrecen franjas dentro del período del torneo» y dos botones `‹ ›` que mueven la ventana de a 5 días (deshabilitados en los extremos del período). Desde `md` (768 px) se ven los 5 días como columnas; en el celular, cinco pastillas con los días (`role="tab"`, la activa `border-viper text-viper bg-viper/10`) y una sola columna. Una fila cada 30 minutos (hora de inicio posible: el partido dura 90) de 08:00 a 22:30, con la hora a la izquierda (`text-xs text-texto-suave tabular-nums`) y cada franja en `h-8 rounded-md px-2 text-xs` (con 5 días el texto largo se recorta con «…»; el `title` de la franja muestra el texto entero al pasar el mouse). Mientras un día carga, sus franjas son bloques con `animate-pulse`.
- **Tarjeta «Partido»:** zona o instancia con el `EstadoBadge` del partido, los dos rivales (el segundo con «vs» y en `text-texto-suave`) y, con una línea arriba, «Cancha», «Horario actual» («Sin programar» si no tiene) y «Período del torneo».
- **Estados de una franja** (como la leyenda del Figma): «Libre» (`border-dashed border-gray-700 bg-fondo`, elegible, `hover:border-viper`; solo si el partido entero entra desde ahí, dentro del horario y del período), «Alquiler» (`bg-info/15 border-info/40 text-info`), «Reserva fija» (`bg-violeta/15 border-violeta/40 text-violeta`), «Torneo» más los rivales del partido (`bg-viper/10 border-viper/40 text-viper`; en un partido de otro torneo, el nombre del torneo), «Participante ocupado» (`bg-error/10 border-error/40 text-error`, con el otro partido de ese participante en este torneo), «Horario actual» (el partido que se reprograma: borde `border-dashed border-viper`, elegible) y «Seleccionada» (`bg-advertencia/20 border-advertencia text-advertencia`, las tres franjas que ocupa el partido). Una franja libre que no deja lugar para 90 minutos va apagada (`bg-fondo/40 text-gray-600`), igual que las que quedan fuera del horario. El texto de una reserva va solo en su primera franja; las demás son continuación. Debajo, la leyenda con un cuadradito por estado (`text-xs text-texto-suave`).
- **Tarjeta «Franja seleccionada»:** sin elegir, «Elegí una franja libre de la grilla. Cada partido dura 90 minutos.»; con una elegida, «Sáb 02/02 · 11:30» en `font-outfit text-lg font-bold text-advertencia`, «Pádel 1 · hasta las 13:00» y la lista de tres requisitos con tilde (`bg-fondo border border-gray-800 rounded-xl p-4`): «Cancha libre en la franja», «Sin alquiler ni otro partido» y «Ningún participante ocupado». Desde `lg`, abajo, «Cancelar» (`neutro`, vuelve a la ficha) y «Reservar franja» (`primario`, deshabilitado sin franja).
- **Al reservar** (`PUT /partidos/:id/programacion`): el torneo no se recarga; la pantalla pasa a «Partido programado» (`max-w-2xl`): `Alert` de éxito «Franja reservada correctamente» (más el toast), tarjeta «Reserva creada» con el `Badge` `exito` «Confirmada» y Tipo «Torneo», Cancha, Fecha («Sáb 02/02/2030»), Horario («11:30 – 13:00») y Partido, y «Volver al fixture», que lleva a la ficha en la pestaña «Cuadro / Zonas».
- **Conflictos** (`ConflictoFranja`, `Modal` `abajo-movil` como `ConfirmDialog`, con ícono en círculo): 3a «Franja no disponible» («Sáb 02/02 · 11:30 no está disponible.») y 3b «Participante con partido simultáneo» («Alguno de los participantes ya juega el Sáb 02/02 · 11:30.») muestran la tarjeta «Siguiente franja disponible» con la `sugerencia` de la API (día, hora y cancha) y los botones «Elegir otra» (`neutro`) y «Usar esta franja» (`primario`, reserva la sugerencia); sin sugerencia dicen «No hay otra franja libre dentro del período del torneo.» y solo queda «Elegir otra». 4a «Otra reserva tomó la franja primero» (ícono rojo, «Rechazamos tu solicitud. Elegí otro horario.») muestra la franja con «Primera solicitud · Confirmada» y «Tu solicitud · Rechazada» y el botón «Elegir otro horario». En los tres casos se descarta la franja elegida y se vuelve a pedir la disponibilidad, así la grilla muestra lo que ocupó el otro. Cualquier otro error de la API va en un `Alert` de error sobre la pantalla.

### 4.27 Cronograma de partidos (`features/privado/torneos`)

Pestaña «Cronograma» de la ficha de gestión (`/gestion/torneos/:id`, 4.16) y de la ficha del jugador (`/portal/torneos/:id`, 4.17). Sin Figma propio: se armó con las tarjetas de partido del cuadro (4.22). Archivos: `components/PanelCronograma.jsx`, `components/PanelSeguimiento.jsx` (las dos pestañas del jugador) y `cronograma.js` (`esDelJugador`, `agruparPorDia`, `hoy`).

- **Datos:** `GET /torneos/:id/cuadro` (no hay endpoint de cronograma): todos los partidos de zonas y eliminatoria, sin los byes.
- **Resumen:** arriba, en `text-sm text-texto-suave`, «4 partidos programados · 2 sin programar». A la derecha (debajo en el celular), solo para el jugador, «Solo mis partidos (N)» con `Checkbox`; sin partidos propios queda deshabilitado.
- **Un grupo por día con partidos** (`bg-panel border border-gray-800 rounded-2xl p-5 md:p-6`), de más cercano a más lejano, con el título «Vie 01/02/2030» en `font-outfit text-lg font-bold`, la cantidad de partidos en `text-sm text-texto-suave` y el `Badge` `info` «Hoy» si es hoy. Dentro, ordenados por hora y cancha, una fila por partido.
- **Fila de partido** (botón `rounded-xl border p-4`, `border-gray-800 bg-fondo`, `hover:border-viper`): a la izquierda la hora de inicio en `font-outfit text-lg font-bold` y «a 12:30» debajo (`text-xs text-texto-suave`); en el medio los dos rivales (el segundo con «vs», `text-texto-suave`) y «Zona A · Pádel 1» (`text-sm text-texto-suave`); a la derecha el `EstadoBadge` del partido y, si es del jugador, el `Badge` `violeta` «Tu partido». En el celular los badges bajan debajo del texto. Un partido del jugador va con `border-viper/50 bg-viper/10`.
- **Grupo «Sin programar»** al final, con el `Badge` `advertencia` «Sin franja»: los partidos sin cancha ni horario (el lugar de la hora es «—»; si falta un rival dice «Por definir»).
- **Detalle:** tocar un partido abre el `DetallePartido` (4.23); el Organizador y el Administrador tienen ahí «Programar» / «Reprogramar» (4.26).
- **Estados:** sin cuadro generado, `EmptyState` «Todavía no hay cronograma»; torneo cancelado, `Alert` info; carga con `Spinner`; error de carga con `Alert` y «Reintentar»; «Solo mis partidos» sin resultados, `EmptyState` «No tenés partidos en este torneo».

---

## 5. Efectos y patrones visuales

- **Barras de desplazamiento:** `:root { color-scheme: dark }` (y `light` en `.tema-claro`) para que las barras y los controles nativos salgan oscuros, nunca blancos. Todo recuadro que se desplaza por dentro (pestañas, pastillas de ronda y de día, grilla de franjas, cuadro, lista de partidos sin franja, `Modal`, listas del menú lateral) lleva la utilidad `sin-barra` de `index.css` (`scrollbar-width: none` y `::-webkit-scrollbar { display: none }`): se sigue moviendo con la rueda, el trackpad o el dedo, pero no se dibuja la barra. El cuadro de eliminatoria usa `overflow-x-auto overflow-y-hidden pb-6` para que las fechas debajo del último partido no generen una barra vertical.

| Patrón | Clases / valor |
|---|---|
| Glow ambiental detrás del hero | `absolute inset-0 bg-viper opacity-20 blur-[60px] lg:blur-[100px] rounded-full` |
| Glow de botón | `shadow-[0_0_20px_rgba(16,185,129,0.3)]` |
| Glow de icono | `drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]` |
| Vidrio (glassmorphism) | `backdrop-blur-md` (navbar), `backdrop-blur-sm` (overlay), `backdrop-blur-2xl` (panel) con fondo translúcido (`/90`, `/60`, `/85`) |
| Radios | `rounded-lg` (botón compacto, icono, campos), `rounded-xl` (botón grande, alertas, toasts), `rounded-2xl` (tarjeta, modal, tabla), `rounded-full` (glow, barras, badges, círculo de ícono) |
| Hover de acción | `hover:scale-105` (botones), `group-hover:scale-110` (iconos) |
| Hover de link | `hover:text-viper transition-colors` |
| Hover de tarjeta | `hover:border-viper` |
| Transiciones | `transition-colors`, `transition-transform`, `transition-opacity`; `duration-300` estándar; `duration-200` solo en la barra central del hamburguesa |
| Z-index | overlay `z-40`, panel `z-50`, navbar `z-[60]`, modal y panel inferior `z-[70]`, toast `z-[80]`, contenido sobre glow `z-10` |
| Táctil | Variante `pointer-coarse:` + `data-[activa=true]` para emular hover en móvil (tap en tarjeta) |

### 5.1 Reglas globales (en `src/index.css`, no repetir en componentes)

- `body`: fondo `--bg-color`, color `--text-main`, `font-family: var(--font-sans)`, `overflow-x: hidden`, `-webkit-tap-highlight-color: transparent`.
- `button, a`: `user-select: none`, `touch-action: manipulation`.

### 5.2 Animaciones (animejs v4, no Tailwind)

- Entrada de tarjetas (`.tarjeta-modulo`, parten con `opacity-0`): `y [50→0]`, `opacity [0→1]`, `stagger(150, { start: 400 })`, `duration 1000`, `ease 'outBack'`.
- Pelota hero (`HeroBall3D`): línea/nodos/anillos en `#10B981` y `#18181B`; entrada con `outExpo` / `outElastic(1, .6)`; giro 2D de 18 s por vuelta, anillo punteado 40 s.

---

## 6. Identidad de marca

- Marca: **VIPER** — subtítulo "Gestión Deportiva". Plataforma SaaS B2B2C (clubes de tenis y pádel + jugadores independientes), Córdoba, Argentina.
- Tono visual: oscuro, deportivo-tecnológico, un solo acento verde esmeralda.
- Idioma de la UI: español. Atributo `lang="es"`.
- Iconografía: SVG en línea, estilo outline (estilo Lucide/Feather), 24×24, `strokeWidth="2"`.
- Favicon: `/favicon.svg`. Meta PWA: `theme-color #09090B`.

---

## 7. Checklist antes de agregar clases

1. ¿El color es un token de la sección 1.1 (o un uso permitido de 1.2)?
2. ¿La fuente es Inter por defecto o `font-outfit` para título/botón?
3. ¿El contenedor usa `max-w-7xl mx-auto px-6`?
4. ¿Existe ya un patrón en la sección 4 o 5 que cubra el caso?
5. Si nada cubre el caso: agregarlo primero a este archivo, después usarlo.
