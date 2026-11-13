import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { useAuth } from '../../auth/useAuth'
import { esDia, hoy } from '../../calendario/calendario'
import { ETIQUETA_DISCIPLINA, fechaLarga, sumarDias } from '../../torneos/torneos'
import { ESTILOS } from '../../torneos/estilosFranja'
import { DEPORTES, TIPOS_OCUPACION, horaDe } from '../reservas'
import { useGrilla } from '../useGrilla'
import PanelTurno from './PanelTurno'

const CHIP = 'px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'
const BOTON_FLECHA = 'grid place-items-center size-10 rounded-lg bg-fondo border border-gray-800 text-texto-suave hover:text-viper hover:border-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'
const OCUPADA_JUGADOR = 'border border-error/50 bg-error/15 text-error'
const CELDA = 'h-10 rounded-md px-2 text-xs flex items-center gap-1 min-w-0 w-full'

function Flecha({ derecha }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={derecha ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
    </svg>
  )
}

// Un turno de una cancha. Solo los libres se pueden elegir; los pasados y los ocupados informan.
function Turno({ cancha, franja, personal, elegido, onElegir }) {
  const nombre = `${cancha.nombre}, de ${franja.horaInicio} a ${franja.horaFin}`

  if (franja.estado === 'PASADA') {
    return (
      <div role="img" aria-label={`${nombre}, pasado`} className={`${CELDA} ${ESTILOS.noentra}`}>
        Pasado
      </div>
    )
  }
  if (franja.estado === 'OCUPADA') {
    const tipo = personal ? TIPOS_OCUPACION[franja.ocupaciones?.[0]?.tipo] : null
    const texto = tipo ? tipo.texto : 'Ocupada'
    const estilo = tipo ? ESTILOS[tipo.estilo] : OCUPADA_JUGADOR
    // El personal toca una ocupada para ver su reserva; al Jugador solo se le informa que está ocupada, sin datos de terceros
    if (personal) {
      return (
        <button
          type="button"
          aria-pressed={elegido}
          aria-label={`${nombre}, ${texto.toLowerCase()}`}
          onClick={() => onElegir(cancha, franja)}
          className={`${CELDA} cursor-pointer focus-visible:outline-2 focus-visible:outline-viper ${elegido ? ESTILOS.seleccionada : estilo}`}
        >
          <span className="truncate font-semibold">{texto}</span>
        </button>
      )
    }
    return (
      <div role="img" aria-label={`${nombre}, ${texto.toLowerCase()}`} title={texto} className={`${CELDA} ${estilo}`}>
        <span className="truncate font-semibold">{texto}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={elegido}
      aria-label={`${nombre}, libre`}
      onClick={() => onElegir(cancha, franja)}
      className={`${CELDA} focus-visible:outline-2 focus-visible:outline-viper ${elegido ? ESTILOS.seleccionada : ESTILOS.libre}`}
    >
      {elegido ? 'Elegido' : 'Libre'}
    </button>
  )
}

// Referencias de colores, según lo que ve cada rol
function Referencias({ personal }) {
  const items = [
    [ESTILOS.libre, 'Libre'],
    ...(personal
      ? Object.values(TIPOS_OCUPACION).map((t) => [ESTILOS[t.estilo], t.texto])
      : [[OCUPADA_JUGADOR, 'Ocupada']]),
    [ESTILOS.noentra, 'Pasado'],
  ]
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-texto-suave" aria-label="Referencias">
      {items.map(([clases, texto]) => (
        <li key={texto} className="flex items-center gap-2">
          <span className={`w-3.5 h-3.5 rounded ${clases.replace(/hover:\S+|cursor-pointer/g, '')}`} aria-hidden="true" />
          {texto}
        </li>
      ))}
    </ul>
  )
}

// Grilla de turnos de las canchas del club: una columna por cancha (en el celular, una cancha por vez con pestañas) y un turno de
// 60 minutos por fila, de 08:00 a 23:00. La usan el Jugador (solo ve «Ocupada») y el personal (ve el tipo de cada ocupación).
// La fecha y el deporte viven en la URL (?fecha=AAAA-MM-DD&deporte=TENIS) para poder compartir o recargar la misma vista.
export default function GrillaReservas() {
  const { rol } = useAuth()
  const personal = rol !== 'JUGADOR'
  const [params, setParams] = useSearchParams()
  const fecha = esDia(params.get('fecha')) ? params.get('fecha') : hoy()
  const deporte = DEPORTES.some((d) => d.clave && d.clave === params.get('deporte')) ? params.get('deporte') : ''
  const esEscritorio = useMediaQuery('(min-width: 768px)')

  const { cargando, error, datos, actualizadaEn, desactualizada, reintentar, refrescar } = useGrilla(fecha, deporte)
  const [elegida, setElegida] = useState(null) // { canchaId, horaInicio, eraLibre }
  const [canchaMovil, setCanchaMovil] = useState(null)

  const cambiarParametro = (clave, valor) => {
    setElegida(null)
    setParams((previo) => {
      const nuevos = new URLSearchParams(previo)
      if (valor) nuevos.set(clave, valor)
      else nuevos.delete(clave)
      return nuevos
    }, { replace: true })
  }
  const irA = (dia) => cambiarParametro('fecha', dia === hoy() ? '' : dia)

  const canchas = datos?.canchas ?? []
  // En el celular se ve una cancha por vez; si la que estaba elegida ya no está (cambió el deporte), se muestra la primera
  const idMovil = canchas.some((c) => c.id === canchaMovil) ? canchaMovil : canchas[0]?.id
  const visibles = esEscritorio ? canchas : canchas.filter((c) => c.id === idMovil)
  const fechaPasada = Boolean(datos?.fechaPasada)
  const sinLibres = datos && !fechaPasada && canchas.length > 0 && canchas.every((c) => c.franjas.every((f) => f.estado !== 'LIBRE'))

  // El turno elegido, en la última grilla. Si era libre y ya no lo está (otro lo tomó), se avisa y se pide elegir otro (7c);
  // si era una reserva que se canceló, el panel pasa a mostrarlo libre.
  const cancha = elegida && canchas.find((c) => c.id === elegida.canchaId)
  const franja = cancha?.franjas.find((f) => f.horaInicio === elegida.horaInicio)
  const elegido = franja && franja.estado !== 'PASADA' && !(elegida.eraLibre && franja.estado !== 'LIBRE') ? { cancha, franja } : null
  const perdido = Boolean(datos && elegida && elegida.eraLibre && franja && franja.estado !== 'LIBRE')

  const elegir = (c, f) => {
    setElegida({ canchaId: c.id, horaInicio: f.horaInicio, eraLibre: f.estado === 'LIBRE' })
    // Al elegir un turno libre se vuelve a pedir la grilla: si justo lo tomaron, se entera enseguida
    if (f.estado === 'LIBRE') refrescar()
  }
  const panel = elegido && (
    <PanelTurno key={`${elegido.cancha.id}|${elegido.franja.horaInicio}`} fecha={fecha} cancha={elegido.cancha} franja={elegido.franja} personal={personal} enHoja={!esEscritorio} onCerrar={() => setElegida(null)} />
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Día anterior" onClick={() => irA(sumarDias(fecha, -1))} className={BOTON_FLECHA}><Flecha /></button>
          <input
            type="date"
            aria-label="Elegir fecha"
            value={fecha}
            onChange={(e) => esDia(e.target.value) && irA(e.target.value)}
            className="bg-fondo text-texto border border-gray-800 focus:border-viper rounded-lg px-3 h-10 text-sm focus:outline-none transition-colors"
          />
          <button type="button" aria-label="Día siguiente" onClick={() => irA(sumarDias(fecha, 1))} className={BOTON_FLECHA}><Flecha derecha /></button>
        </div>
        {fecha !== hoy() && (
          <Button variante="secundario" onClick={() => irA(hoy())}>Hoy</Button>
        )}
        <div role="group" aria-label="Filtrar por deporte" className="sin-barra flex gap-2 overflow-x-auto sm:ml-auto">
          {DEPORTES.map(({ clave, texto }) => (
            <button
              key={clave || 'todos'}
              type="button"
              aria-pressed={clave === deporte}
              onClick={() => cambiarParametro('deporte', clave)}
              className={`${CHIP} ${clave === deporte ? 'bg-viper/15 border-viper text-viper' : 'bg-panel border-gray-800 text-texto-suave hover:text-viper hover:border-viper'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>
      <h2 className="font-outfit text-lg font-bold -mb-2">{fechaLarga(fecha)}</h2>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar la grilla">
          {error}{' '}
          <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      ) : cargando ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando la grilla" /></div>
      ) : canchas.length === 0 ? (
        <EmptyState titulo="No hay canchas disponibles" descripcion="El club no tiene canchas activas para este deporte." />
      ) : (
        <>
          {fechaPasada && <Alert variante="info">Es una fecha pasada: la grilla es solo de consulta y no se pueden elegir turnos.</Alert>}
          {sinLibres && (
            <Alert variante="info" titulo="No quedan turnos libres este día">
              Probá con otra fecha.{' '}
              <button type="button" onClick={() => irA(sumarDias(fecha, 1))} className="underline font-semibold cursor-pointer">Ver el día siguiente</button>
            </Alert>
          )}
          {desactualizada && <Alert variante="advertencia">No pudimos actualizar la grilla; lo que ves puede no estar al día.</Alert>}
          {perdido && <Alert variante="advertencia" titulo="Ese turno ya no está disponible">Elegí otro de la grilla.</Alert>}

          {!esEscritorio && canchas.length > 1 && (
            <Tabs
              pestanas={canchas.map((c) => ({ clave: c.id, titulo: c.nombre }))}
              activa={visibles[0].id}
              onCambiar={(id) => { setCanchaMovil(id); setElegida(null) }}
            />
          )}

          <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1 flex flex-col gap-5">
              <div className="sin-barra overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `3.25rem repeat(${visibles.length}, minmax(${esEscritorio ? '7rem' : '0'}, 1fr))` }}>
                  <div />
                  {visibles.map((c) => (
                    <div key={c.id} className="text-center pb-2 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.nombre}</p>
                      <p className="text-xs text-texto-suave truncate">{ETIQUETA_DISCIPLINA[c.deporte]} · {c.tipoSuperficie}</p>
                    </div>
                  ))}
                  {visibles[0].franjas.map((f, i) => (
                    <FilaTurnos key={f.horaInicio} hora={f.horaInicio}>
                      {visibles.map((c) => (
                        <Turno
                          key={c.id}
                          cancha={c}
                          franja={c.franjas[i]}
                          personal={personal}
                          elegido={elegida?.canchaId === c.id && elegida.horaInicio === f.horaInicio && Boolean(elegido)}
                          onElegir={elegir}
                        />
                      ))}
                    </FilaTurnos>
                  ))}
                </div>
              </div>

              <Referencias personal={personal} />
              {actualizadaEn && <p className="text-xs text-texto-suave">Actualizada a las {horaDe(actualizadaEn)}. Se actualiza sola cada 30 segundos.</p>}
            </div>
            {esEscritorio && panel && <aside aria-label="Detalle del turno" className="w-80 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto sin-barra">{panel}</aside>}
          </div>
          {!esEscritorio && (
            <BottomSheet abierto={Boolean(panel)} titulo={elegido?.franja.estado === 'LIBRE' ? 'Turno libre' : 'Reserva'} cabecera={false} onCerrar={() => setElegida(null)}>
              {panel}
            </BottomSheet>
          )}
        </>
      )}
    </div>
  )
}

function FilaTurnos({ hora, children }) {
  return (
    <>
      <p className="h-10 flex items-center text-xs text-texto-suave tabular-nums">{hora}</p>
      {children}
    </>
  )
}

