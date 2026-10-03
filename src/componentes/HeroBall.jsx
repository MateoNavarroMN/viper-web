import { useLayoutEffect, useRef } from 'react'
import { animate, createTimeline, createScope, stagger, svg, utils } from 'animejs'

// Hace que scale/rotate usen el centro del propio elemento SVG
const origen = { transformBox: 'fill-box', transformOrigin: 'center' }

// ---------- Ajustes de la interacción ----------
const VEL_MAX = 900     // límite de velocidad al soltar (grados por segundo)
const INERCIA_MS = 1500 // cuánto tarda en frenar el impulso después de soltar
const ZONA_MUERTA = 15  // si el cursor está muy cerca del centro, el ángulo se vuelve inestable: se ignora

export default function HeroBall({ className = '' }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    // Respeta usuarios con "reducir movimiento" (se ve todo estático, sin interacción)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let limpiarEventos = () => {}

    const scope = createScope({ root }).add(() => {
      // Los nodos arrancan ocultos (antes del primer pintado)
      utils.set('.node', { scale: 0 })

      // ---------- Entrada ----------
      createTimeline({ defaults: { ease: 'outExpo' } })
        .add(svg.createDrawable('.ring-outer'), { draw: ['0 0', '0 1'], duration: 1400 }, 0)
        .add('.ring-dashed', { opacity: [0, 1], scale: [0.8, 1], duration: 1400 }, 200)
        .add('.ball', { scale: [0.85, 1], duration: 1600, ease: 'outElastic(1, .6)' }, 300)
        .add(svg.createDrawable('.ball-outline'), { draw: ['0 0', '0 1'], duration: 1200, ease: 'inOutQuart' }, 300)
        .add(svg.createDrawable('.ball-seam'), { draw: ['0 0', '0 1'], duration: 900, delay: stagger(150) }, 900)
        .add(svg.createDrawable('.link'), { draw: ['1 1', '0 1'], duration: 600, delay: stagger(120) }, 1400)
        .add('.node', { scale: [0, 1], duration: 900, ease: 'outElastic(1, .6)', delay: stagger(120) }, 2000)

      // ---------- Loop continuo (giro normal) ----------
      const giro = animate('.ball', { rotate: 360, duration: 18000, ease: 'linear', loop: true, delay: 2400 })
      animate('.ring-dashed', { rotate: -360, duration: 40000, ease: 'linear', loop: true, delay: 1600 })

      // ---------- Interacción: girar la pelota como un dial ----------
      // .ball-user guarda la rotación del usuario; .ball (adentro) sigue con su giro normal.
      // Mientras el usuario la tiene agarrada, el giro normal se pausa y manda el usuario.
      const el = root.current.querySelector('.ball-user')

      let angulo = 0          // rotación acumulada por el usuario (grados)
      let arrastrando = false
      let anguloPrevio = 0    // ángulo del cursor en el evento anterior
      let tPrevio = 0
      let velocidad = 0       // grados por segundo, suavizada
      let inercia = null

      const aplicar = () => {
        el.style.transform = `rotate(${angulo}deg)`
      }

      // Ángulo del cursor alrededor del centro de la pelota (200, 200). null si está en la zona muerta.
      const anguloDelCursor = (e) => {
        const r = root.current.getBoundingClientRect()
        const dx = ((e.clientX - r.left) / r.width) * 400 - 200
        const dy = ((e.clientY - r.top) / r.height) * 320 + 24 - 200
        if (Math.hypot(dx, dy) < ZONA_MUERTA) return null
        return (Math.atan2(dy, dx) * 180) / Math.PI
      }

      const alAgarrar = (e) => {
        const a = anguloDelCursor(e)
        arrastrando = true
        el.setPointerCapture(e.pointerId)
        el.style.cursor = 'grabbing'
        if (inercia) inercia.pause()
        giro.pause()
        velocidad = 0
        anguloPrevio = a ?? 0
        tPrevio = performance.now()
      }

      const alMover = (e) => {
        if (!arrastrando) return
        const a = anguloDelCursor(e)
        if (a === null) return

        // Diferencia de ángulo, normalizada a [-180, 180] para que no salte al cruzar ±180°
        let delta = a - anguloPrevio
        if (delta > 180) delta -= 360
        if (delta < -180) delta += 360

        const t = performance.now()
        const dt = Math.max((t - tPrevio) / 1000, 0.001)
        // Velocidad suavizada, para que el impulso al soltar no dependa de un solo evento
        velocidad = velocidad * 0.7 + (delta / dt) * 0.3

        angulo += delta
        anguloPrevio = a
        tPrevio = t
        aplicar()
      }

      const alSoltar = () => {
        if (!arrastrando) return
        arrastrando = false
        el.style.cursor = 'grab'

        // Si la dejó quieta un momento antes de soltar, no hay impulso
        if (performance.now() - tPrevio > 120) velocidad = 0
        const impulso = { w: Math.max(-VEL_MAX, Math.min(VEL_MAX, velocidad)) }

        // El giro normal se reanuda desde donde quedó, y el impulso del usuario se va frenando
        giro.play()
        let t0 = performance.now()
        inercia = animate(impulso, {
          w: 0,
          duration: INERCIA_MS,
          ease: 'outQuad',
          onUpdate: () => {
            const t = performance.now()
            angulo += (impulso.w * (t - t0)) / 1000
            t0 = t
            aplicar()
          },
        })
      }

      el.addEventListener('pointerdown', alAgarrar)
      el.addEventListener('pointermove', alMover)
      el.addEventListener('pointerup', alSoltar)
      el.addEventListener('pointercancel', alSoltar)

      limpiarEventos = () => {
        el.removeEventListener('pointerdown', alAgarrar)
        el.removeEventListener('pointermove', alMover)
        el.removeEventListener('pointerup', alSoltar)
        el.removeEventListener('pointercancel', alSoltar)
      }
    })

    return () => {
      limpiarEventos()
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
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Anillos tecnológicos de fondo */}
      <circle className="ring-dashed" style={origen} cx="200" cy="200" r="160" stroke="#18181B" strokeWidth="3" strokeDasharray="15 15" />
      <circle className="ring-outer" cx="200" cy="200" r="190" stroke="#18181B" strokeWidth="1" />

      {/* Todo lo que brilla */}
      <g filter="url(#glow)">
        {/* ball-user = rotación del usuario (pivota en el centro del SVG) · ball = giro normal y escala de entrada */}
        <g
          className="ball-user"
          style={{ cursor: 'grab', touchAction: 'none', transformBox: 'view-box', transformOrigin: '200px 200px' }}
        >
          {/* Área invisible para poder agarrar la pelota desde adentro */}
          <circle cx="200" cy="200" r="100" fill="none" pointerEvents="all" />
          <g className="ball" style={origen}>
            <circle className="ball-outline" cx="200" cy="200" r="100" stroke="#10B981" strokeWidth="8" />
            <path className="ball-seam" d="M 130 130 Q 200 200 130 270" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
            <path className="ball-seam" d="M 270 130 Q 200 200 270 270" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>
        {/* Nodos (el orden coincide con el de los conectores de abajo) */}
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