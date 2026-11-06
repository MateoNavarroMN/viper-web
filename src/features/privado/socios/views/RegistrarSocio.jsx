import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import BuscarJugador from '../components/BuscarJugador'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'
const DISCIPLINAS = [
  { clave: 'TENIS', texto: 'Tenis' },
  { clave: 'PADEL', texto: 'Pádel' },
]
const CATEGORIAS_VACIAS = { TENIS: '', PADEL: '' }
const ERRORES_VACIOS = { jugador: '', TENIS: '', PADEL: '' }

// El campo que informa la API → el campo de este formulario
const CAMPO_DE_API = { jugadorId: 'jugador', 'categorias.TENIS': 'TENIS', 'categorias.PADEL': 'PADEL' }

// CU 4.1 · registrar socio (Recepcionista y Administrador)
export default function RegistrarSocio() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [jugador, setJugador] = useState(null)
  const [categorias, setCategorias] = useState(CATEGORIAS_VACIAS)
  const [errores, setErrores] = useState(ERRORES_VACIOS)
  const [alerta, setAlerta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false) // 8a
  const [pideReactivar, setPideReactivar] = useState(false) // 9c

  // Categorías de cada disciplina para los selectores
  const [catalogo, setCatalogo] = useState(null) // { TENIS: [...], PADEL: [...] }
  const [errorCatalogo, setErrorCatalogo] = useState('')
  const [reintento, setReintento] = useState(0)
  useEffect(() => {
    let vigente = true
    Promise.all(DISCIPLINAS.map(({ clave }) => get(`/categorias?disciplina=${clave}`)))
      .then(([tenis, padel]) => vigente && setCatalogo({ TENIS: tenis.categorias, PADEL: padel.categorias }))
      .catch((e) => vigente && setErrorCatalogo(e.mensaje))
    return () => {
      vigente = false
    }
  }, [reintento])

  // Al elegir al jugador, cada selector arranca en su categoría actual
  const elegirJugador = (elegido) => {
    setJugador(elegido)
    setCategorias(elegido ? { TENIS: elegido.categorias?.TENIS?.id ?? '', PADEL: elegido.categorias?.PADEL?.id ?? '' } : CATEGORIAS_VACIAS)
    setErrores(ERRORES_VACIOS)
    setAlerta('')
  }

  const cambiarCategoria = (disciplina) => (e) => {
    setCategorias((actuales) => ({ ...actuales, [disciplina]: e.target.value }))
    setErrores((actuales) => ({ ...actuales, [disciplina]: '' }))
  }

  const cancelar = () => (jugador ? setPideDescartar(true) : navigate('/gestion/socios'))

  const guardar = async ({ reactivar = false } = {}) => {
    // 9a · datos inválidos: se marcan en rojo y se conserva lo ingresado
    const nuevos = { ...ERRORES_VACIOS }
    if (!jugador) nuevos.jugador = 'Seleccioná un jugador'
    for (const { clave } of DISCIPLINAS) if (!categorias[clave]) nuevos[clave] = 'Seleccioná una categoría'
    if (Object.values(nuevos).some(Boolean)) {
      setErrores(nuevos)
      setAlerta('Revisá los campos marcados antes de continuar')
      return
    }

    setErrores(ERRORES_VACIOS)
    setAlerta('')
    setEnviando(true)
    try {
      await post('/socios', { jugadorId: jugador.id, categorias, ...(reactivar && { reactivar: true }) })
      mostrarToast(reactivar ? 'Socio reactivado correctamente' : 'Socio registrado correctamente')
      navigate('/gestion/socios', { replace: true })
    } catch (e) {
      setPideReactivar(false)
      if (e.datos?.codigo === 'SOCIO_EN_BAJA') {
        setPideReactivar(true) // 9c
      } else if (CAMPO_DE_API[e.campo]) {
        setErrores({ ...ERRORES_VACIOS, [CAMPO_DE_API[e.campo]]: e.mensaje })
        setAlerta('Revisá los campos marcados antes de continuar')
      } else if (e.status === 409) {
        setErrores({ ...ERRORES_VACIOS, jugador: e.mensaje }) // 9b
      } else {
        setAlerta(e.mensaje)
      }
    } finally {
      setEnviando(false)
    }
  }

  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/gestion/socios" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a socios
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Registrar socio</h1>
        <p className="text-texto-suave text-sm mt-1">Elegí al jugador y asignale su categoría técnica inicial</p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
        className={`${TARJETA} flex flex-col gap-6`}
      >
        {alerta && <Alert variante="error">{alerta}</Alert>}

        <fieldset className="flex flex-col gap-3" disabled={enviando}>
          <legend className={TITULO_SECCION}>Jugador</legend>
          <BuscarJugador valor={jugador} onElegir={elegirJugador} error={errores.jugador} disabled={enviando} />
        </fieldset>

        <hr className="border-gray-800" />

        <fieldset className="flex flex-col gap-5" disabled={enviando}>
          <legend className={TITULO_SECCION}>Categoría técnica inicial</legend>
          {errorCatalogo ? (
            <Alert variante="error" titulo="No pudimos cargar las categorías">
              {errorCatalogo}{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorCatalogo('')
                  setReintento((n) => n + 1)
                }}
                className="underline font-semibold cursor-pointer"
              >
                Reintentar
              </button>
            </Alert>
          ) : !catalogo ? (
            <div className="py-4 flex justify-center">
              <Spinner texto="Cargando categorías" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              {DISCIPLINAS.map(({ clave, texto }) => (
                <FormField key={clave} label={`Categoría en ${texto}`} id={`categoria-${clave}`} requerido error={errores[clave]}>
                  <Select
                    id={`categoria-${clave}`}
                    placeholder="Seleccionar categoría"
                    opciones={catalogo[clave].map((c) => ({ valor: c.id, texto: c.nombre }))}
                    value={categorias[clave]}
                    error={Boolean(errores[clave])}
                    onChange={cambiarCategoria(clave)}
                  />
                </FormField>
              ))}
            </div>
          )}
        </fieldset>

        <hr className="border-gray-800" />

        <fieldset className="flex flex-col gap-5">
          <legend className={TITULO_SECCION}>Membresía</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <FormField label="Fecha de alta" id="fecha-alta" ayuda="Es la de hoy">
              <Input id="fecha-alta" value={hoy} readOnly disabled />
            </FormField>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-texto-suave">Estado inicial</span>
              <div className="h-11 flex items-center">
                <Badge variante="exito">Activo</Badge>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
          <Button variante="neutro" onClick={cancelar} disabled={enviando} className="py-3">
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando} disabled={!catalogo} className="py-3">
            Guardar socio
          </Button>
        </div>
      </form>

      {/* 8a · con datos cargados, pide confirmar antes de descartar */}
      <ConfirmDialog
        abierto={pideDescartar}
        tipo="advertencia"
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder los datos cargados."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={() => navigate('/gestion/socios')}
        onCancelar={() => setPideDescartar(false)}
      />

      {/* 9c · el jugador figura como socio dado de baja: se ofrece reactivarlo */}
      <ConfirmDialog
        abierto={pideReactivar}
        tipo="advertencia"
        variante="primario"
        titulo="¿Reactivar socio?"
        mensaje={`${jugador?.nombre ?? ''} ${jugador?.apellido ?? ''} figura como socio dado de baja. Se activa de nuevo con las categorías elegidas y conserva su historial de cuotas.`}
        textoConfirmar="Reactivar socio"
        textoCancelar="Volver"
        cargando={enviando}
        onConfirmar={() => guardar({ reactivar: true })}
        onCancelar={() => setPideReactivar(false)}
      />
    </div>
  )
}