import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useAuth } from '../../auth/useAuth'
import GrillaCanchas from '../components/GrillaCanchas'
import { ETIQUETA_DISCIPLINA, fechaLarga, rangoFechas } from '../../torneos/torneos'
import {
  DIAS_SEMANA, colorDeTorneo, esDia, esMes, hoy, mesDe, nombreMes, partidosDelDia, periodoDe, rivalesDe, semanasDelMes, sumarMeses, torneoEnElDia,
} from '../calendario'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const DISCIPLINAS = [
  { clave: 'TENIS', titulo: 'Tenis' },
  { clave: 'PADEL', titulo: 'Pádel' },
]
// Referencias de la grilla de canchas: los mismos colores de «Programar partido»
const REFERENCIAS = [
  ['border border-dashed border-gray-700 bg-fondo', 'Libre'],
  ['border border-info/40 bg-info/15', 'Alquiler'],
  ['border border-violeta/40 bg-violeta/15', 'Reserva fija'],
  ['border border-viper/40 bg-viper/10', 'Torneo'],
]

// Los torneos llevan a su ficha: el Recepcionista a los inscriptos, quien gestiona torneos a la ficha completa
const rutaDelTorneo = (rol, id) => (rol === 'RECEPCIONISTA' ? `/gestion/inscripciones/${id}` : `/gestion/torneos/${id}`)

function Flecha({ derecha }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={derecha ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
    </svg>
  )
}

function BotonMes({ derecha, etiqueta, onClick }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className="grid place-items-center size-9 rounded-lg bg-fondo border border-gray-800 text-texto-suave hover:text-viper hover:border-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
    >
      <Flecha derecha={derecha} />
    </button>
  )
}

// Un día de la grilla: el número, una barrita de color por torneo en juego y cuántos partidos hay
function Dia({ dia, mes, elegido, torneos, partidos, colores, onElegir }) {
  const fueraDelMes = mesDe(dia) !== mes
  const esHoy = dia === hoy()
  const resumen = [
    `${Number(dia.slice(8))}`,
    torneos.length > 0 && `${torneos.length} ${torneos.length === 1 ? 'torneo' : 'torneos'}`,
    partidos.length > 0 && `${partidos.length} ${partidos.length === 1 ? 'partido' : 'partidos'}`,
  ].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={() => onElegir(dia)}
      aria-label={resumen}
      aria-pressed={elegido}
      className={`min-w-0 flex flex-col items-stretch gap-1 text-left p-1 sm:p-2 min-h-16 sm:min-h-24 border-b border-r border-gray-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-viper ${
        elegido ? 'bg-viper/10' : 'hover:bg-fondo/60'
      } ${fueraDelMes ? 'opacity-45' : ''}`}
    >
      <span
        className={`self-start grid place-items-center min-w-6 h-6 px-1 rounded-full text-xs sm:text-sm font-semibold tabular-nums ${
          esHoy ? 'bg-viper text-black' : ''
        }`}
      >
        {Number(dia.slice(8))}
      </span>
      {torneos.length > 0 && (
        <span className="flex flex-col gap-0.5" aria-hidden="true">
          {torneos.map((t) => (
            <span key={t.id} className={`h-1 rounded-full ${t.estado === 'CANCELADO' ? 'bg-gray-600' : colores.get(t.id)}`} />
          ))}
        </span>
      )}
      {partidos.length > 0 && (
        <span aria-hidden="true" className="self-start rounded-full bg-fondo px-1.5 text-[11px] tabular-nums text-viper">
          {partidos.length}<span className="max-xl:hidden"> {partidos.length === 1 ? 'partido' : 'partidos'}</span>
        </span>
      )}
    </button>
  )
}

// Los torneos y los partidos del día elegido, al costado del mes
function AgendaDelDia({ dia, torneos, partidos, colores, rol }) {
  return (
    <aside className={`${TARJETA} min-w-0`} aria-label={`Agenda del ${fechaLarga(dia)}`}>
      <h2 className="font-outfit text-lg font-bold">{fechaLarga(dia)}</h2>
      <p className="text-sm text-texto-suave mt-1">
        {torneos.length} {torneos.length === 1 ? 'torneo' : 'torneos'} · {partidos.length} {partidos.length === 1 ? 'partido' : 'partidos'}
      </p>

      <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave mt-5 mb-3">Torneos en juego</h3>
      {torneos.length === 0 ? (
        <p className="text-sm text-texto-suave">Ningún torneo se juega este día.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {torneos.map((t) => (
            <li key={t.id} className="flex items-start gap-3">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${t.estado === 'CANCELADO' ? 'bg-gray-600' : colores.get(t.id)}`} aria-hidden="true" />
              <div className="min-w-0">
                <Link to={rutaDelTorneo(rol, t.id)} className="font-semibold break-words hover:text-viper transition-colors">{t.nombre}</Link>
                <p className="text-sm text-texto-suave">{t.categoria} · {ETIQUETA_DISCIPLINA[t.disciplina]} · {rangoFechas(t.fechaInicio, t.fechaFin)}</p>
                <div className="mt-1"><EstadoBadge tipo="torneo" estado={t.estado} /></div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave mt-6 mb-3">Partidos</h3>
      {partidos.length === 0 ? (
        <p className="text-sm text-texto-suave">No hay partidos programados este día.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-800 border border-gray-800 rounded-xl">
          {partidos.map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-semibold tabular-nums">{p.horaInicio} – {p.horaFin}</span>
                <span className="text-texto-suave">{p.cancha}</span>
              </div>
              <p className="mt-1 break-words">{rivalesDe(p)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Link to={rutaDelTorneo(rol, p.torneoId)} className="text-texto-suave hover:text-viper transition-colors break-words">{p.torneo}</Link>
                <EstadoBadge tipo="partido" estado={p.estado} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

// Disponibilidad de las canchas del día elegido, debajo del calendario y con la grilla de «Programar partido» (4.26).
// Las canchas se piden de a una disciplina (Tenis o Pádel).
function CanchasDelDia({ dia, partidos }) {
  const [disciplina, setDisciplina] = useState('TENIS')
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${dia}|${disciplina}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    get(`/canchas/disponibilidad?disciplina=${disciplina}&fecha=${dia}`)
      .then((datos) => vigente && setResultado({ clave, datos }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, dia, disciplina])

  const etiquetas = Object.fromEntries(partidos.map((p) => [p.id, rivalesDe(p)]))

  return (
    <section className={`${TARJETA} min-w-0 lg:col-start-1 lg:row-start-2`} aria-label={`Canchas del ${fechaLarga(dia)}`}>
      <h2 className="font-outfit text-lg font-bold">Canchas</h2>
      <p className="text-sm text-texto-suave mt-1">{fechaLarga(dia)}</p>
      <div className="mt-4">
        <Tabs pestanas={DISCIPLINAS} activa={disciplina} onCambiar={setDisciplina} />
      </div>
      <div className="mt-4">
        {actual?.error ? (
          <Alert variante="error" titulo="No pudimos cargar las canchas">
            {actual.error}{' '}
            <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
          </Alert>
        ) : actual ? (
          <GrillaCanchas disponibilidad={actual.datos} etiquetas={etiquetas} />
        ) : (
          <div className="py-16 flex justify-center"><Spinner texto="Cargando las canchas" /></div>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-texto-suave" aria-label="Referencias">
        {REFERENCIAS.map(([clases, texto]) => (
          <li key={texto} className="flex items-center gap-2"><span className={`w-3.5 h-3.5 rounded ${clases}`} aria-hidden="true" />{texto}</li>
        ))}
      </ul>
    </section>
  )
}

// Calendario del club (Recepcionista, Organizador y Administrador): los torneos que se juegan cada día del mes, los partidos
// que ya tienen cancha y horario y, del día elegido, sus torneos y partidos al costado y la grilla de canchas de «Programar partido»
// debajo. El mes y el día elegido viven
// en la URL (?mes=AAAA-MM&dia=AAAA-MM-DD) para poder compartirlo.
export default function Calendario() {
  const { rol } = useAuth()
  const [parametros, setParametros] = useSearchParams()
  const hoyTexto = hoy()
  const mes = esMes(parametros.get('mes')) ? parametros.get('mes') : mesDe(hoyTexto)
  const semanas = semanasDelMes(mes)
  const { desde, hasta } = periodoDe(mes)
  const diaPedido = parametros.get('dia')
  const dia = esDia(diaPedido) && diaPedido >= desde && diaPedido <= hasta ? diaPedido : mesDe(hoyTexto) === mes ? hoyTexto : `${mes}-01`

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneos, partidos, error }
  const clave = `${desde}|${hasta}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    get(`/calendario?desde=${desde}&hasta=${hasta}`)
      .then((r) => vigente && setResultado({ clave, torneos: r.torneos, partidos: r.partidos }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, desde, hasta])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])
  const irAlMes = (nuevo, nuevoDia) => setParametros(nuevoDia ? { mes: nuevo, dia: nuevoDia } : { mes: nuevo })
  const elegirDia = (nuevo) => setParametros({ mes, dia: nuevo })

  const torneos = actual?.torneos ?? []
  const partidos = actual?.partidos ?? []
  // Un color por torneo, según el orden en que llegan
  const colores = new Map(torneos.map((t, i) => [t.id, colorDeTorneo(i)]))

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Calendario</h1>
        <p className="text-texto-suave text-sm mt-1">Los torneos y los partidos del club, día por día</p>
      </div>

      {actual?.error ? (
        <Alert variante="error" titulo="No pudimos cargar el calendario">
          {actual.error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
          <section className={`${TARJETA} min-w-0 lg:col-start-1 lg:row-start-1`} aria-label={`Calendario de ${nombreMes(mes)}`} aria-busy={!actual}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-outfit text-lg font-bold" aria-live="polite">{nombreMes(mes)}</h2>
                <p className="text-sm text-texto-suave mt-1">Elegí un día para ver sus torneos, partidos y canchas</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BotonMes etiqueta="Mes anterior" onClick={() => irAlMes(sumarMeses(mes, -1))} />
                <button
                  type="button"
                  onClick={() => irAlMes(mesDe(hoyTexto), hoyTexto)}
                  className="h-9 px-3 rounded-lg bg-fondo border border-gray-800 text-sm font-semibold hover:text-viper hover:border-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
                >
                  Hoy
                </button>
                <BotonMes derecha etiqueta="Mes siguiente" onClick={() => irAlMes(sumarMeses(mes, 1))} />
              </div>
            </div>

            <div className="mt-5 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-800 bg-fondo/40" aria-hidden="true">
                {DIAS_SEMANA.map((d) => (
                  <span key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-texto-suave">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 [&>button:nth-child(7n)]:border-r-0 [&>button:nth-last-child(-n+7)]:border-b-0">
                {semanas.flat().map((d) => (
                  <Dia
                    key={d}
                    dia={d}
                    mes={mes}
                    elegido={d === dia}
                    torneos={torneos.filter((t) => torneoEnElDia(t, d))}
                    partidos={partidosDelDia(partidos, d)}
                    colores={colores}
                    onElegir={elegirDia}
                  />
                ))}
              </div>
            </div>

            {!actual ? (
              <div className="pt-5 flex justify-center"><Spinner texto="Cargando el calendario" /></div>
            ) : (
              torneos.length > 0 && (
                <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-sm" aria-label="Torneos del período">
                  {torneos.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 min-w-0">
                      <span className={`size-2.5 shrink-0 rounded-full ${t.estado === 'CANCELADO' ? 'bg-gray-600' : colores.get(t.id)}`} aria-hidden="true" />
                      <Link to={rutaDelTorneo(rol, t.id)} className="truncate hover:text-viper transition-colors">{t.nombre}</Link>
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>

          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 min-w-0">
            <AgendaDelDia
              dia={dia}
              torneos={torneos.filter((t) => torneoEnElDia(t, dia))}
              partidos={partidosDelDia(partidos, dia)}
              colores={colores}
              rol={rol}
            />
          </div>

          <CanchasDelDia dia={dia} partidos={partidosDelDia(partidos, dia)} />
        </div>
      )}
    </div>
  )
}