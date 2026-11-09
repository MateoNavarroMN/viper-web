import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { DISCIPLINAS } from '../ranking'
import { RUTA_REGLAS, fechaCorta, hoyEnCordoba, nombreInstancia, puntosLargo, validarPuntos } from '../reglas'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'
const PASO = 'w-11 h-11 shrink-0 bg-fondo border border-gray-800 text-texto text-lg flex items-center justify-center transition-colors hover:border-viper disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

// Modificar una regla de puntuación (/gestion/reglas-puntuacion/:disciplina/:instancia/modificar, Organizador y Administrador).
// Muestra la regla vigente y pide los puntos nuevos. Al guardar, la API agrega una regla con vigencia desde hoy y conserva la
// anterior; si la instancia ya tenía una regla de hoy, reemplaza su valor.
export default function ModificarRegla() {
  const { disciplina: claveDisciplina, instancia } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const disciplina = DISCIPLINAS.find((d) => d.clave === claveDisciplina)
  const volver = `${RUTA_REGLAS}?disciplina=${disciplina?.clave ?? ''}`

  const [regla, setRegla] = useState(null) // la regla vigente de esa instancia
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)

  const [puntos, setPuntos] = useState('') // lo que se escribe en el campo
  const [errorCampo, setErrorCampo] = useState('')
  const [alerta, setAlerta] = useState('')
  const [sinCambios, setSinCambios] = useState('') // 7b
  const [enviando, setEnviando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false) // 6a

  useEffect(() => {
    if (!disciplina) return
    let vigente = true
    get(`/reglas-puntuacion?disciplina=${disciplina.api}`)
      .then((respuesta) => {
        if (!vigente) return
        const encontrada = respuesta.reglas.find((r) => r.instancia === instancia) ?? null
        setRegla(encontrada)
        setErrorCarga(encontrada ? '' : 'Esa instancia no existe.')
        // El campo arranca con el valor actual, salvo que ya se haya escrito algo (por ejemplo, al recargar tras un 409)
        setPuntos((escrito) => (escrito === '' && encontrada?.puntos != null ? String(encontrada.puntos) : escrito))
      })
      .catch((e) => vigente && setErrorCarga(e.mensaje))
    return () => {
      vigente = false
    }
  }, [disciplina, instancia, intento])

  if (!disciplina) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Alert variante="error">La disciplina no es válida.</Alert>
        <Link to={RUTA_REGLAS} className="text-sm text-viper hover:underline w-fit">
          Volver a las reglas
        </Link>
      </div>
    )
  }

  const valorInicial = regla?.puntos != null ? String(regla.puntos) : ''
  const hoy = hoyEnCordoba()
  const nombre = nombreInstancia(instancia)
  const cambiaHoy = regla?.vigenteDesde === hoy // 8a: ya tiene una regla con vigencia de hoy

  const escribir = (valor) => {
    setPuntos(valor)
    setErrorCampo('')
    setAlerta('')
    setSinCambios('')
  }

  // Los botones − y + parten del valor escrito (o del vigente si no es un número)
  const mover = (paso) => {
    const actual = /^\d+$/.test(puntos.trim()) ? Number(puntos.trim()) : Number(valorInicial) || 0
    escribir(String(Math.max(0, actual + paso)))
  }

  // 6a · con un valor distinto del actual, pide confirmar antes de descartar
  const cancelar = () => (puntos.trim() !== valorInicial ? setPideDescartar(true) : navigate(volver))

  const guardar = async () => {
    // 7a · vacío, no entero o negativo: se marca en rojo y se conserva lo escrito
    const mensaje = validarPuntos(puntos)
    if (mensaje) {
      setErrorCampo(mensaje)
      setAlerta('Revisá el campo marcado antes de continuar')
      return
    }
    // 7b · igual al vigente: no hay nada que guardar
    if (regla?.puntos != null && Number(puntos) === regla.puntos) {
      setSinCambios(`El valor ingresado es igual al vigente (${puntosLargo(regla.puntos)}).`)
      return
    }

    setEnviando(true)
    try {
      const { reemplazada } = await put(`/reglas-puntuacion/${disciplina.api}/${instancia}`, { puntos: Number(puntos) })
      mostrarToast(
        reemplazada
          ? 'Se reemplazó la regla de hoy: rige para los resultados que se carguen desde ahora'
          : 'Regla actualizada: rige para los resultados que se carguen desde ahora'
      )
      navigate(volver, { replace: true, state: { actualizada: instancia } })
    } catch (e) {
      if (e.campo === 'puntos') {
        setErrorCampo(e.mensaje)
        setAlerta('Revisá el campo marcado antes de continuar')
      } else if (e.status === 409) {
        // Otra persona dejó la regla en ese mismo valor: se avisa y se vuelve a consultar la vigente
        setSinCambios(e.mensaje)
        setIntento((n) => n + 1)
      } else {
        setAlerta(e.mensaje)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to={volver} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a las reglas
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Modificar regla</h1>
        <p className="text-texto-suave text-sm mt-1">Definí los nuevos puntos de la instancia; rigen desde hoy</p>
      </div>

      {errorCarga && !regla ? (
        <Alert variante="error" titulo="No pudimos cargar la regla">
          {errorCarga}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !regla ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando regla" />
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            guardar()
          }}
          className={`${TARJETA} flex flex-col gap-6`}
        >
          {alerta && <Alert variante="error">{alerta}</Alert>}

          <fieldset className="flex flex-col gap-5">
            <legend className={TITULO_SECCION}>Regla actual</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <FormField label="Disciplina" id="disciplina">
                <Input id="disciplina" value={disciplina.titulo} readOnly disabled />
              </FormField>
              <FormField label="Instancia" id="instancia">
                <Input id="instancia" value={nombre} readOnly disabled />
              </FormField>
              <FormField label="Valor vigente" id="valor-vigente">
                <Input id="valor-vigente" value={regla.puntos === null ? 'Sin regla' : puntosLargo(regla.puntos)} readOnly disabled />
              </FormField>
              <FormField label="Vigente desde" id="vigente-desde">
                <Input id="vigente-desde" value={regla.vigenteDesde ? fechaCorta(regla.vigenteDesde) : '—'} readOnly disabled />
              </FormField>
            </div>
          </fieldset>

          <hr className="border-gray-800" />

          <fieldset className="flex flex-col gap-5" disabled={enviando}>
            <legend className={TITULO_SECCION}>Nuevo valor</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <FormField label="Nuevos puntos otorgados" id="puntos" requerido error={errorCampo}>
                <div className="flex">
                  <button type="button" aria-label="Restar un punto" onClick={() => mover(-1)} className={`${PASO} rounded-l-lg`}>
                    −
                  </button>
                  <Input
                    id="puntos"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={9}
                    value={puntos}
                    error={Boolean(errorCampo)}
                    onChange={(e) => escribir(e.target.value)}
                    className="rounded-none text-center tabular-nums"
                  />
                  <button type="button" aria-label="Sumar un punto" onClick={() => mover(1)} className={`${PASO} rounded-r-lg`}>
                    +
                  </button>
                </div>
              </FormField>
              <FormField label="Vigente desde" id="nueva-vigencia" ayuda="Es la de hoy">
                <Input id="nueva-vigencia" value={fechaCorta(hoy)} readOnly disabled />
              </FormField>
            </div>
          </fieldset>

          {sinCambios && (
            <Alert variante="info" titulo="No hay cambios para guardar">
              {sinCambios}
            </Alert>
          )}

          {/* 8a · ya hay una regla de hoy: se reemplaza su valor */}
          {cambiaHoy && regla.puntos !== null && (
            <Alert variante="advertencia" titulo={`${nombre} ya tiene un cambio con vigencia de hoy`}>
              Al guardar se reemplaza su valor ({puntosLargo(regla.puntos)}) por el nuevo.
            </Alert>
          )}

          <Alert variante="info">El cambio se aplica a los resultados que se carguen desde ahora; los puntos ya otorgados no cambian. La regla anterior se conserva en el historial.</Alert>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
            <Button variante="neutro" onClick={cancelar} disabled={enviando} className="py-3">
              Cancelar
            </Button>
            <Button type="submit" cargando={enviando} className="py-3">
              Guardar regla
            </Button>
          </div>
        </form>
      )}

      {/* 6a · con un valor cargado, pide confirmar antes de descartar */}
      <ConfirmDialog
        abierto={pideDescartar}
        tipo="advertencia"
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder el valor ingresado."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={() => navigate(volver)}
        onCancelar={() => setPideDescartar(false)}
      />
    </div>
  )
}