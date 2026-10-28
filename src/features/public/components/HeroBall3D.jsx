import { useLayoutEffect, useRef } from 'react'
import { animate, createTimeline, createScope, stagger, svg, utils } from 'animejs'

// Hace que scale use el centro del propio elemento SVG
const origen = { transformBox: 'fill-box', transformOrigin: 'center' }

// ---------- Modo de giro automático (cambiá esta línea para alternar) ----------
//  '2d' → la pelota gira sola como un disco plano (no se recalcula nada por cuadro: liviano)
//         y pasa a 3D recién cuando el usuario la toca. Al soltarla vuelve a su posición y
//         retoma el giro 2D.
//  '3d' → la pelota gira sola en 3D todo el tiempo (la costura se recalcula en cada cuadro).
const GIRO_AUTOMATICO = '2d'

// ---------- Brillo difuminado (cambiá estas dos líneas para probar variantes) ----------
//  GLOW:    'fuerte' → halo grande e intenso · 'suave' → halo corto y tenue · 'sin' → sin brillo
//  GLOW_EN: 'todo'   → brillan la pelota y los nodos · 'nodos' → brillan solo los nodos
const GLOW = 'suave'
const GLOW_EN = 'todo'

// Cuándo empieza a armarse el logo dentro de la entrada (ms)
const LOGO_T0 = 1700

// Ajuste fino de cada variante: desenfoque (tamaño del halo) e intensidad (0 a 1)
const GLOWS = {
  fuerte: { desenfoque: 18, intensidad: 1 },
  suave: { desenfoque: 5, intensidad: 0.5 },
}
const glowCfg = GLOWS[GLOW] // undefined cuando GLOW = 'sin'
const FILTRO = glowCfg ? 'url(#glow)' : undefined

// ---------- Ajustes ----------
const VEL_MAX = 14          // límite de velocidad al soltar (radianes por segundo)
const INERCIA_MS = 1800     // cuánto tarda en frenar el impulso después de soltar
const RETORNO_MS = 1400     // cuánto tarda en volver a la posición inicial (costuras centradas)
const GIRO_NORMAL = (2 * Math.PI) / 16 // giro automático: una vuelta cada 16 s
const EJE_NORMAL = [0.34, 0.94, 0]     // eje del giro automático (casi vertical, un poco inclinado)

// ---------- Geometría de la pelota ----------
const R = 100                 // radio en unidades del SVG
const CX = 200                // centro
const CY = 200
const K = 0.32                // 0 a 0.5: cuánto se curvan las costuras hacia el centro
const N = 180                 // puntos de la costura (más = más suave, más costoso)

// La costura de una pelota de tenis es una sola curva cerrada sobre la esfera:
//   x = (1-k)cos t + k cos 3t · y = (1-k)sin t - k sin 3t · z = 2√(k(1-k)) sin 2t
// Se calcula una sola vez y se rota 135° para que, de frente, se vean dos arcos enfrentados.
const COSTURA = (() => {
  const pts = new Float32Array((N + 1) * 3)
  const c = 2 * Math.sqrt(K * (1 - K))
  const rz = (135 * Math.PI) / 180
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2
    const x = (1 - K) * Math.cos(t) + K * Math.cos(3 * t)
    const y = (1 - K) * Math.sin(t) - K * Math.sin(3 * t)
    const z = c * Math.sin(2 * t)
    pts[i * 3] = x * cz - y * sz
    pts[i * 3 + 1] = x * sz + y * cz
    pts[i * 3 + 2] = z
  }
  return pts
})()

// ---------- Logo de Viper estampado en la pelota ----------
// Las formas del símbolo (archivo viper-simbolo-verde.svg, viewBox 256): cuatro escamas, la pelotita y la línea de cancha.
// Se pegan sobre la esfera, centradas en el punto de frente, y giran con ella: en 2D con el disco y en 3D siguen la curvatura.
// Al entrar se arman como en el logo: la pelotita cae desde arriba a la izquierda y va dejando la estela (las escamas), rebota en
// la línea de cancha, que cede un poco con el golpe, y sube hasta su lugar arriba a la derecha.
const LOGO_ALTO = 0.4 // alto del logo como fracción del radio de la pelota (más chico = más discreto)
const ESCALA_LOGO = LOGO_ALTO / 216 // el dibujo del símbolo mide 216 unidades de alto
const circulo = (cx, cy, rad, n) => Array.from({ length: n }, (_, i) => [cx + rad * Math.cos((i / n) * 2 * Math.PI), cy + rad * Math.sin((i / n) * 2 * Math.PI)])
// Línea de cancha: rectángulo de 105.5 × 20.1 con las puntas redondas
const LINEA = (() => {
  const pts = []
  const rad = 10.05, x0 = 75.2 + rad, x1 = 75.2 + 105.5 - rad, yc = 215.9 + rad
  for (let i = 0; i <= 8; i++) pts.push([x1 + rad * Math.sin((i / 8) * Math.PI), yc - rad * Math.cos((i / 8) * Math.PI)])
  for (let i = 0; i <= 8; i++) pts.push([x0 - rad * Math.sin((i / 8) * Math.PI), yc + rad * Math.cos((i / 8) * Math.PI)])
  return pts
})()
const BOLA_FIN = [195.9, 61.4]
const BOLA_R = 23.1
// Orden: escamas 0 a 3 (de arriba a la izquierda hasta la de la derecha), pelotita (4) y línea (5)
const FORMAS = [
  [[55.2, 20.0], [73.4, 46.5], [55.2, 73.0], [37.0, 46.5]],
  [[90.0, 72.1], [110.7, 102.7], [90.0, 133.3], [69.3, 102.7]],
  [[124.7, 128.4], [148.7, 164.0], [124.7, 199.6], [100.7, 164.0]],
  [[159.5, 80.4], [180.2, 111.0], [159.5, 141.6], [138.8, 111.0]],
  circulo(BOLA_FIN[0], BOLA_FIN[1], BOLA_R, 28),
  LINEA,
]
const CENTROS = FORMAS.map((pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length])

// Recorrido de la pelotita (coordenadas del símbolo): cae de A a B (apoyada en la línea) y sube hasta BOLA_FIN pasando cerca de la última escama
const PUNTO_A = [50, 20]
const PUNTO_B = [128, 192.8]
const PUNTO_C = [156, 95] // punto de control de la subida (curva)
const GOLPE_SQUASH = 0.4  // cuánto se aplasta la pelotita al pegar
const GOLPE_LINEA = 6     // cuánto baja la línea de cancha con el golpe

// Estado de la animación de armado. Todo va de 0 a 1; "golpe" sube y baja en el rebote.
//   linea / bola / e0..e3: aparición de cada pieza · caida: la pelotita de A a B · rebote: de B a su lugar
const LOGO_FINAL = { linea: 1, bola: 1, e0: 1, e1: 1, e2: 1, e3: 1, caida: 1, rebote: 1, golpe: 0 }
const logoInicial = () => ({ linea: 0, bola: 0, e0: 0, e1: 0, e2: 0, e3: 0, caida: 0, rebote: 0, golpe: 0 })

// Forma i del símbolo (plana) según el estado de la animación; null si todavía no apareció
function formaAnimada(i, est) {
  const base = FORMAS[i]
  const [cx, cy] = CENTROS[i]
  if (i < 4) {
    const v = est['e' + i]
    if (v <= 0.01) return null
    return base.map(([x, y]) => [cx + (x - cx) * v, cy + (y - cy) * v])
  }
  if (i === 4) {
    const v = est.bola
    if (v <= 0.01) return null
    let px, py
    if (est.rebote > 0) {
      const t = est.rebote, u = 1 - t
      px = u * u * PUNTO_B[0] + 2 * u * t * PUNTO_C[0] + t * t * BOLA_FIN[0]
      py = u * u * PUNTO_B[1] + 2 * u * t * PUNTO_C[1] + t * t * BOLA_FIN[1]
    } else {
      px = PUNTO_A[0] + (PUNTO_B[0] - PUNTO_A[0]) * est.caida
      py = PUNTO_A[1] + (PUNTO_B[1] - PUNTO_A[1]) * est.caida
    }
    // Al pegar se aplasta contra la línea (la base queda apoyada)
    const sq = est.golpe * GOLPE_SQUASH
    const sx = 1 + sq, sy = 1 - sq
    py += BOLA_R * v * (1 - sy)
    return base.map(([x, y]) => [px + (x - BOLA_FIN[0]) * v * sx, py + (y - BOLA_FIN[1]) * v * sy])
  }
  const v = est.linea
  if (v <= 0.01) return null
  return base.map(([x, y]) => [cx + (x - cx) * v, y + GOLPE_LINEA * est.golpe])
}

// ---------- Cuaterniones (la orientación se guarda así para que no se deforme con el tiempo) ----------
const qMul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
]
const qEje = (x, y, z, ang) => {
  const l = Math.hypot(x, y, z)
  if (!l) return [1, 0, 0, 0]
  const s = Math.sin(ang / 2) / l
  return [Math.cos(ang / 2), x * s, y * s, z * s]
}
const qNorm = (q) => {
  const l = Math.hypot(q[0], q[1], q[2], q[3])
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]
}

// Posición inicial: la pelota de frente, con las dos costuras centradas (como en el diseño original)
const ORIGEN = [1, 0, 0, 0]

// Interpolación entre dos orientaciones por el camino más corto (t de 0 a 1)
const qSlerp = (a, b, t) => {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  if (dot < 0) {
    b = [-b[0], -b[1], -b[2], -b[3]]
    dot = -dot
  }
  if (dot > 0.9995) {
    return qNorm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t])
  }
  const th = Math.acos(dot)
  const sn = Math.sin(th)
  const wa = Math.sin((1 - t) * th) / sn
  const wb = Math.sin(t * th) / sn
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb, a[3] * wa + b[3] * wb]
}

const f = (n) => n.toFixed(1)

// Proyecta la costura con la orientación q y devuelve solo el tramo que se ve de frente
// (lo que queda detrás de la esfera no se dibuja: la pelota es opaca).
// "progreso" (0 a 1) dibuja solo el primer tramo de la curva: sirve para la animación de entrada.
function trazoFrontal(q, progreso) {
  const [w, x, y, z] = q
  const m0 = 1 - 2 * (y * y + z * z), m1 = 2 * (x * y - z * w), m2 = 2 * (x * z + y * w)
  const m3 = 2 * (x * y + z * w), m4 = 1 - 2 * (x * x + z * z), m5 = 2 * (y * z - x * w)
  const m6 = 2 * (x * z - y * w), m7 = 2 * (y * z + x * w), m8 = 1 - 2 * (x * x + y * y)

  const iMax = Math.min(N, Math.floor(N * progreso))
  let d = ''
  let px = 0, py = 0, pz = 0
  let lado = false // true = el punto anterior estaba del lado de adelante (z >= 0)

  for (let i = 0; i <= iMax; i++) {
    const a = COSTURA[i * 3], b = COSTURA[i * 3 + 1], c = COSTURA[i * 3 + 2]
    const X = CX + R * (m0 * a + m1 * b + m2 * c)
    const Y = CY - R * (m3 * a + m4 * b + m5 * c)
    const Z = m6 * a + m7 * b + m8 * c
    const frente = Z >= 0

    if (i === 0) {
      if (frente) d += `M${f(X)} ${f(Y)}`
    } else if (frente && lado) {
      d += `L${f(X)} ${f(Y)}`
    } else if (frente !== lado) {
      // La curva cruza el borde de la esfera: se corta justo ahí para que el cambio sea limpio
      const s = pz / (pz - Z)
      const cx = px + (X - px) * s
      const cy = py + (Y - py) * s
      if (lado) d += `L${f(cx)} ${f(cy)}` // sale hacia atrás: se termina el trazo
      else d += `M${f(cx)} ${f(cy)}L${f(X)} ${f(Y)}` // vuelve a aparecer: empieza un trazo nuevo
    }
    lado = frente
    px = X; py = Y; pz = Z
  }
  return d
}

// Proyecta el logo con la orientación q. Cada forma pasa a puntos sobre la esfera unitaria ([x, y, z] con z = √(1 - x² - y²)) y se
// recorta en el borde (z = 0): lo que pasa para atrás no se ve. "est" es el estado de la animación de armado.
function trazoLogo(q, est = LOGO_FINAL) {
  const [w, x, y, z] = q
  const m0 = 1 - 2 * (y * y + z * z), m1 = 2 * (x * y - z * w), m2 = 2 * (x * z + y * w)
  const m3 = 2 * (x * y + z * w), m4 = 1 - 2 * (x * x + z * z), m5 = 2 * (y * z - x * w)
  const m6 = 2 * (x * z - y * w), m7 = 2 * (y * z + x * w), m8 = 1 - 2 * (x * x + y * y)
  let d = ''
  for (let i = 0; i < FORMAS.length; i++) {
    const plana = formaAnimada(i, est)
    if (!plana) continue
    const pts = plana.map(([px, py]) => {
      const a = (px - 128) * ESCALA_LOGO
      const b = -(py - 128) * ESCALA_LOGO
      const c = Math.sqrt(Math.max(0, 1 - a * a - b * b))
      return [m0 * a + m1 * b + m2 * c, m3 * a + m4 * b + m5 * c, m6 * a + m7 * b + m8 * c]
    })
    // Recorte contra el plano z = 0 (se queda con la parte de adelante)
    const dentro = []
    for (let j = 0; j < pts.length; j++) {
      const A = pts[j], B = pts[(j + 1) % pts.length]
      if (A[2] >= 0) dentro.push(A)
      if ((A[2] >= 0) !== (B[2] >= 0)) {
        const t = A[2] / (A[2] - B[2])
        dentro.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 0])
      }
    }
    if (dentro.length < 3) continue
    d += dentro.map((p, k) => `${k ? 'L' : 'M'}${f(CX + R * p[0])} ${f(CY - R * p[1])}`).join('') + 'Z'
  }
  return d
}

export default function HeroBall3D({ className = '' }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const svgEl = root.current
    const elCostura = svgEl.querySelector('.seam-front')
    const elLogo = svgEl.querySelector('.logo-front')
    const elGiro = svgEl.querySelector('.ball-spin')
    const modo2D = GIRO_AUTOMATICO === '2d'

    // La pelota nace de frente y con las costuras centradas
    let q = ORIGEN

    // Cuánto de la costura está dibujada (la animación de entrada lo lleva de 0 a 1)
    const intro = { seam: 0 }
    // Armado del logo (la pelotita que rebota); mientras dura, se redibuja en cada cuadro
    const logoEst = logoInicial()
    let logoAnimando = true

    const dibujar = () => {
      elCostura.setAttribute('d', trazoFrontal(q, intro.seam))
      elLogo.setAttribute('d', trazoLogo(q, logoEst))
    }

    dibujar() // estado inicial (costura vacía) antes del primer pintado

    let limpiar = () => { }

    const scope = createScope({ root }).add(() => {
      // Los nodos arrancan ocultos (antes del primer pintado)
      utils.set('.node', { scale: 0 })

      // ---------- Estado ----------
      const idle = { f: 0 }     // giro automático 3D activo (0 a 1). Solo se usa en modo '3d'
      const usr = { k: 0 }      // cuánto queda del impulso del usuario (1 a 0)
      const retorno = { t: 0 }  // progreso de la vuelta a la posición inicial (0 a 1)
      const rampa2D = { s: 1 }  // arranque suave del giro 2D después de la vuelta
      let velUsr = [0, 0, 0]    // velocidad angular del impulso (rad/s, ejes de pantalla)
      let idleAnim = null
      let inercia = null
      let retornoAnim = null
      let volviendo = false
      let qInicio = ORIGEN
      let arrastrando = false
      let interactuando = false // desde que el usuario la agarra hasta que termina de volver
      let giro2d = null
      let visible = true
      let activo3D = true       // true = la costura se recalcula en cada cuadro
      let raf = 0
      let tPrev = 0

      // ---------- Bucle de dibujo 3D ----------
      const cuadro = (ahora) => {
        const dt = Math.min((ahora - tPrev) / 1000, 0.05) // topado: evita saltos al volver a la pestaña
        tPrev = ahora

        if (volviendo) {
          q = qSlerp(qInicio, ORIGEN, retorno.t)
        } else if (!arrastrando) {
          const wx = EJE_NORMAL[0] * GIRO_NORMAL * idle.f + velUsr[0] * usr.k
          const wy = EJE_NORMAL[1] * GIRO_NORMAL * idle.f + velUsr[1] * usr.k
          const wz = EJE_NORMAL[2] * GIRO_NORMAL * idle.f + velUsr[2] * usr.k
          const ang = Math.hypot(wx, wy, wz) * dt
          if (ang > 1e-6) q = qNorm(qMul(qEje(wx, wy, wz, ang), q))
        }
        dibujar()
        raf = requestAnimationFrame(cuadro)
      }

      // El bucle solo corre si la pelota está en pantalla Y hay algo en 3D que recalcular
      const actualizarLoop = () => {
        const debeCorrer = visible && (activo3D || logoAnimando)
        if (debeCorrer && !raf) {
          tPrev = performance.now()
          raf = requestAnimationFrame(cuadro)
        } else if (!debeCorrer && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      }

      // ---------- Giro 2D (modo '2d'): un disco plano que gira, sin recalcular nada ----------
      const iniciarGiro2D = (delay = 0, suave = false) => {
        if (giro2d) giro2d.cancel()
        elGiro.style.transform = 'none'
        giro2d = animate(elGiro, { rotate: [0, 360], duration: 18000, ease: 'linear', loop: true, delay })
        if (suave) {
          // Arranca despacio y acelera hasta la velocidad normal
          rampa2D.s = 0
          giro2d.speed = 0.02
          animate(rampa2D, {
            s: 1,
            duration: 1400,
            ease: 'inOutQuad',
            onUpdate: () => { giro2d.speed = Math.max(0.02, rampa2D.s) },
          })
        }
        if (!visible) giro2d.pause()
      }

      // Ángulo actual del giro 2D (radianes, sentido horario en pantalla)
      const anguloGiro2D = () => {
        const t = getComputedStyle(elGiro).transform
        if (!t || t === 'none') return 0
        const m = new DOMMatrixReadOnly(t)
        return Math.atan2(m.b, m.a)
      }

      // Pasa de 2D a 3D en el mismo instante en que el usuario la agarra, sin ningún salto visual
      const pasarA3D = () => {
        if (activo3D) return
        const ang = anguloGiro2D()
        if (giro2d) giro2d.pause()
        elGiro.style.transform = 'none'
        // Girar en el plano 'ang' en sentido horario equivale a girar -ang alrededor del eje que sale de la pantalla
        q = qNorm(qEje(0, 0, 1, -ang))
        activo3D = true
        dibujar()
        actualizarLoop()
      }

      // Terminada la entrada completa (costura y logo): en modo 2D la pelota queda fija y empieza a girar como disco plano.
      // El giro espera al logo para que se arme derecho y no mientras gira.
      const terminarEntrada = () => {
        Object.assign(logoEst, LOGO_FINAL)
        logoAnimando = false
        dibujar()
        if (modo2D && !interactuando && intro.seam >= 1) {
          activo3D = false
          iniciarGiro2D(300)
        }
        actualizarLoop()
      }

      // ---------- Entrada ----------
      createTimeline({ defaults: { ease: 'outExpo' } })
        .add('.ball', { scale: [0.85, 1], duration: 1600, ease: 'outElastic(1, .6)' }, 300)
        .add(svg.createDrawable('.ball-outline'), { draw: ['0 0', '0 1'], duration: 1200, ease: 'inOutQuart' }, 300)
        // La costura se dibuja sola mientras la pelota ya está en 3D
        .add(intro, {
          seam: [0, 1],
          duration: 1300,
          ease: 'inOutQuart',
          onComplete: () => {
            intro.seam = 1
            dibujar()
          },
        }, 800)
        .add(svg.createDrawable('.link'), { draw: ['1 1', '0 1'], duration: 600, delay: stagger(120) }, 1400)
        .add('.node', { scale: [0, 1], duration: 900, ease: 'outElastic(1, .6)', delay: stagger(120) }, 2000)
        // El logo se arma cuando la costura ya está casi dibujada: aparece la línea y la pelotita, cae dejando la estela
        // (escamas 0, 1 y 2), pega en la línea, rebota y sube a su lugar dejando la última escama
        .add(logoEst, { linea: [0, 1], duration: 450, ease: 'outExpo' }, LOGO_T0)
        .add(logoEst, { bola: [0, 1], duration: 300, ease: 'outBack' }, LOGO_T0 + 150)
        .add(logoEst, { caida: [0, 1], duration: 700, ease: 'inQuad' }, LOGO_T0 + 450)
        .add(logoEst, { e0: [0, 1], duration: 420, ease: 'outBack' }, LOGO_T0 + 600)
        .add(logoEst, { e1: [0, 1], duration: 420, ease: 'outBack' }, LOGO_T0 + 850)
        .add(logoEst, { e2: [0, 1], duration: 420, ease: 'outBack' }, LOGO_T0 + 1030)
        .add(logoEst, { golpe: [{ to: 1, duration: 140, ease: 'outQuad' }, { to: 0, duration: 420, ease: 'outElastic(1, .5)' }] }, LOGO_T0 + 1150)
        .add(logoEst, { rebote: [0, 1], duration: 750, ease: 'outQuad', onComplete: terminarEntrada }, LOGO_T0 + 1250)
        .add(logoEst, { e3: [0, 1], duration: 420, ease: 'outBack' }, LOGO_T0 + 1510)

      // Modo 3D: el giro automático 3D arranca después de la entrada
      if (!modo2D) {
        idleAnim = animate(idle, { f: 1, duration: 1800, delay: 2400, ease: 'inOutQuad' })
      }

      // Solo se gasta batería mientras la pelota está en pantalla
      const observador = new IntersectionObserver(([entrada]) => {
        visible = entrada.isIntersecting
        actualizarLoop()
        if (giro2d && !activo3D) {
          if (visible) giro2d.play()
          else giro2d.pause()
        }
      })
      observador.observe(svgEl)

      // ---------- Interacción: arrastrar para girar la esfera en cualquier dirección ----------
      const el = svgEl.querySelector('.ball-user')
      let prevX = 0
      let prevY = 0
      let tMov = 0
      let escala = 1          // unidades del SVG por píxel de pantalla
      let vel = [0, 0, 0]     // velocidad angular medida (suavizada)

      const prevenirScroll = (e) => e.preventDefault()

      const alAgarrar = (e) => {
        interactuando = true
        arrastrando = true
        pasarA3D() // en modo 2D: desde acá se calcula en 3D
        el.setPointerCapture(e.pointerId)
        el.style.cursor = 'grabbing'

        // Bloquea el scroll de la página al tocar la pelota
        document.addEventListener('touchmove', prevenirScroll, { passive: false })

        if (idleAnim) idleAnim.pause()
        if (inercia) inercia.pause()
        if (retornoAnim) retornoAnim.pause()
        volviendo = false
        idle.f = 0
        usr.k = 0
        vel = [0, 0, 0]
        prevX = e.clientX
        prevY = e.clientY
        tMov = performance.now()
        escala = 400 / svgEl.getBoundingClientRect().width
      }

      const alMover = (e) => {
        if (!arrastrando) return
        const dx = (e.clientX - prevX) * escala
        const dy = (e.clientY - prevY) * escala
        prevX = e.clientX
        prevY = e.clientY
        const dist = Math.hypot(dx, dy)
        if (dist < 0.01) return

        // Como una bola rodando bajo el dedo: gira alrededor del eje perpendicular al movimiento
        // y el ángulo es la distancia recorrida dividida por el radio.
        q = qNorm(qMul(qEje(dy, dx, 0, dist / R), q))

        const t = performance.now()
        const dt = Math.max((t - tMov) / 1000, 0.004)
        tMov = t
        vel = [vel[0] * 0.7 + (dy / R / dt) * 0.3, vel[1] * 0.7 + (dx / R / dt) * 0.3, 0]
      }

      // Lleva la pelota suavemente a la posición inicial y recién ahí retoma el giro automático
      const volverAlOrigen = () => {
        usr.k = 0
        qInicio = q
        retorno.t = 0
        volviendo = true
        retornoAnim = animate(retorno, {
          t: 1,
          duration: RETORNO_MS,
          ease: 'inOutQuad',
          onComplete: () => {
            volviendo = false
            interactuando = false
            q = ORIGEN
            dibujar()
            if (modo2D) {
              // Vuelve a ser un disco plano: se deja de recalcular y retoma el giro 2D
              if (intro.seam >= 1) {
                activo3D = false
                actualizarLoop()
                iniciarGiro2D(0, true)
              }
            } else {
              idle.f = 0
              idleAnim = animate(idle, { f: 1, duration: 1500, ease: 'inOutQuad' })
            }
          },
        })
      }

      const alSoltar = () => {
        if (!arrastrando) return
        arrastrando = false
        el.style.cursor = 'grab'

        // Reactiva el scroll de la página
        document.removeEventListener('touchmove', prevenirScroll)

        // Si la dejó quieta un momento antes de soltar, no hay impulso
        if (performance.now() - tMov > 120) vel = [0, 0, 0]
        const mag = Math.hypot(vel[0], vel[1], vel[2])
        const lim = Math.min(1, VEL_MAX / (mag || 1))
        velUsr = [vel[0] * lim, vel[1] * lim, vel[2] * lim]

        // 1) El impulso se va frenando. 2) La pelota vuelve a su posición inicial (costuras centradas).
        // 3) Recién ahí vuelve el giro automático.
        if (mag > 0.3) {
          usr.k = 1
          inercia = animate(usr, { k: 0, duration: INERCIA_MS, ease: 'outQuad', onComplete: volverAlOrigen })
        } else {
          volverAlOrigen()
        }
      }

      el.addEventListener('pointerdown', alAgarrar)
      el.addEventListener('pointermove', alMover)
      el.addEventListener('pointerup', alSoltar)
      el.addEventListener('pointercancel', alSoltar)

      limpiar = () => {
        observador.disconnect()
        cancelAnimationFrame(raf)
        el.removeEventListener('pointerdown', alAgarrar)
        el.removeEventListener('pointermove', alMover)
        el.removeEventListener('pointerup', alSoltar)
        el.removeEventListener('pointercancel', alSoltar)

        // Limpieza del listener global
        document.removeEventListener('touchmove', prevenirScroll)
      }

      // Estado inicial del bucle: corre durante la entrada (la costura se dibuja en 3D)
      actualizarLoop()
    })

    return () => {
      limpiar()
      scope.revert()
    }
  }, [])

  return (
    <svg
      ref={root}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 24 400 320"
      fill="none"
      className={className}
      role="img"
      aria-label="Pelota de tenis Viper"
    >
      {glowCfg && (
        <defs>
          {/* Región amplia para que el halo no se corte en los bordes */}
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={glowCfg.desenfoque} result="blur" />
            <feComponentTransfer in="blur" result="blurIntensidad">
              <feFuncA type="linear" slope={glowCfg.intensidad} />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="blurIntensidad" operator="over" />
          </filter>
        </defs>
      )}

      {/* Pelota (brilla si GLOW_EN = 'todo') */}
      <g filter={GLOW_EN === 'todo' ? FILTRO : undefined}>
        <g className="ball-user" style={{ cursor: 'grab', touchAction: 'none' }}>
          {/* Área invisible para poder agarrar la pelota desde adentro */}
          <circle cx="200" cy="200" r="100" fill="none" pointerEvents="all" />
          {/* ball = escala de la entrada · ball-spin = giro 2D (modo '2d'), pivota en el centro del contorno */}
          <g className="ball" style={origen}>
            <g className="ball-spin" style={origen}>
              <circle className="ball-outline" cx="200" cy="200" r="100" stroke="#10B981" strokeWidth="8" />
              {/* Costura visible: el atributo d se calcula solo cuando hace falta (entrada, arrastre, vuelta) */}
              <path className="seam-front" d="" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              {/* Marca de Viper estampada en la pelota (se calcula igual que la costura, siempre sobre la esfera) */}
              <path className="logo-front" d="" fill="#10B981" />
            </g>
          </g>
        </g>
      </g>

      {/* Nodos con brillo (el orden coincide con el de los conectores de abajo) */}
      <g filter={FILTRO}>
        <circle className="node" style={origen} cx="200" cy="70" r="6" fill="#10B981" />
        <circle className="node" style={origen} cx="80" cy="260" r="7" fill="#10B981" />
      </g>

      {/* Nodo derecho (sin brillo) */}
      <circle className="node" style={origen} cx="330" cy="200" r="5" fill="#10B981" />

      {/* Líneas conectoras (mismo orden que los nodos: arriba, abajo-izquierda, derecha) */}
      <path className="link" d="M 200 70 L 200 100" stroke="#10B981" strokeWidth="2" opacity="0.5" />
      <path className="link" d="M 80 260 L 110.5 244.7" stroke="#10B981" strokeWidth="2" opacity="0.5" />
      <path className="link" d="M 330 200 L 300 200" stroke="#10B981" strokeWidth="2" opacity="0.5" />
    </svg>
  )
}