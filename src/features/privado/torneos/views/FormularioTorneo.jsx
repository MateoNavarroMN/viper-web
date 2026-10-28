import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post, put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { ESTADOS } from '../../../../shared/utils/estados'
import Contador from '../components/Contador'
import { ETIQUETA_DISCIPLINA, LIMITES, escribirPrecio, leerPrecio } from '../torneos'

const RUTA = '/gestion/torneos'
const PRECIO_MAXIMO = 9999999999

const FORMATOS = [
  { valor: 'ELIMINACION_DIRECTA', titulo: 'Eliminación Directa', detalle: 'Cuadro de llaves: quien pierde queda eliminado.' },
  { valor: 'ZONAS_Y_ELIMINACION', titulo: 'Zonas + Eliminación', detalle: 'Fase de grupos y llave final con los clasificados.' },
]

// Todos los valores van como texto mientras se editan; se convierten al enviar
const VACIO = {
  nombre: '',
  disciplina: 'TENIS',
  categoriaId: '',
  formato: 'ELIMINACION_DIRECTA',
  clasificanPorZona: '2',
  cupoMaximo: '16',
  fechaInicio: '',
  fechaFin: '',
  precio: '',
}

const desdeTorneo = (t) => ({
  nombre: t.nombre,
  disciplina: t.disciplina,
  categoriaId: t.categoriaId,
  formato: t.formato,
  clasificanPorZona: String(t.clasificanPorZona ?? 2),
  cupoMaximo: String(t.cupoMaximo),
  fechaInicio: t.fechaInicio,
  fechaFin: t.fechaFin,
  precio: escribirPrecio(t.precioInscripcion),
})

// Orden en que se revisa y se enfoca el primer campo con error
const CAMPOS = ['nombre', 'categoriaId', 'clasificanPorZona', 'cupoMaximo', 'fechaInicio', 'fechaFin', 'precio']
const COMPLETAR = 'Completá este campo'

// Las mismas reglas que la API (M3-BE-02)
const validar = (v) => {
  const e = {}
  const conZonas = v.formato === 'ZONAS_Y_ELIMINACION'

  if (!v.nombre.trim()) e.nombre = COMPLETAR
  else if (v.nombre.trim().length > LIMITES.nombre) e.nombre = `Máximo ${LIMITES.nombre} caracteres`

  if (!v.categoriaId) e.categoriaId = 'Elegí una categoría'

  if (conZonas) {
    const clasifican = Number(v.clasificanPorZona)
    if (v.clasificanPorZona === '') e.clasificanPorZona = COMPLETAR
    else if (clasifican < LIMITES.clasificanMinimo) e.clasificanPorZona = 'Debe haber al menos 1 clasificado por zona'
    else if (clasifican > LIMITES.clasificanMaximo) e.clasificanPorZona = 'Pueden clasificar como máximo 2 por zona'
  }

  const cupo = Number(v.cupoMaximo)
  if (v.cupoMaximo === '') e.cupoMaximo = COMPLETAR
  else if (conZonas && cupo < LIMITES.cupoMinimoZonas) e.cupoMaximo = 'Con zonas, el cupo mínimo es 6 (dos zonas de 3)'
  else if (cupo < LIMITES.cupoMinimo) e.cupoMaximo = 'El cupo mínimo es 2'
  else if (cupo > LIMITES.cupoMaximo) e.cupoMaximo = `El cupo máximo es ${LIMITES.cupoMaximo}`

  if (!v.fechaInicio) e.fechaInicio = COMPLETAR
  if (!v.fechaFin) e.fechaFin = COMPLETAR
  else if (v.fechaInicio && v.fechaFin < v.fechaInicio) e.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio'

  const precio = leerPrecio(v.precio)
  if (v.precio.trim() === '') e.precio = 'Completá este campo (0 si es sin cargo)'
  else if (precio === null) e.precio = 'Ingresá un precio válido, por ejemplo 8.000,00'
  else if (precio > PRECIO_MAXIMO) e.precio = 'El precio es demasiado alto'

  return e
}

const aCuerpo = (v) => ({
  nombre: v.nombre.trim(),
  disciplina: v.disciplina,
  categoriaId: v.categoriaId,
  formato: v.formato,
  clasificanPorZona: v.formato === 'ZONAS_Y_ELIMINACION' ? Number(v.clasificanPorZona) : undefined,
  cupoMaximo: Number(v.cupoMaximo),
  fechaInicio: v.fechaInicio,
  fechaFin: v.fechaFin,
  precioInscripcion: leerPrecio(v.precio),
})

// La API nombra `precioInscripcion` al campo que acá es `precio`
const CAMPO_DE_API = { precioInscripcion: 'precio' }

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-10'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'

// Tarjeta de opción con radio real oculto (mismo estilo que el selector de rol, design.md 4.11)
function TarjetaOpcion({ name, valor, actual, titulo, detalle, onElegir }) {
  const activo = actual === valor
  return (
    <label
      className={`relative flex flex-col gap-2 rounded-xl border p-5 cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-viper has-[:disabled]:cursor-not-allowed ${
        activo ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo hover:border-viper'
      }`}
    >
      <input type="radio" name={name} value={valor} checked={activo} onChange={() => onElegir(valor)} className="sr-only" />
      <span className={`pr-7 font-bold ${activo ? 'text-viper' : ''}`}>{titulo}</span>
      <span className="text-sm text-texto-suave">{detalle}</span>
      <span aria-hidden="true" className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${activo ? 'border-viper' : 'border-gray-600'}`}>
        {activo && <span className="w-2.5 h-2.5 rounded-full bg-viper" />}
      </span>
    </label>
  )
}

// Una sola pantalla para crear (/gestion/torneos/nuevo) y editar (/gestion/torneos/:id/editar).
// Editar solo se permite mientras el torneo está PLANIFICADO; en otro estado el formulario se muestra bloqueado.
export default function FormularioTorneo() {
  const { id } = useParams()
  const edicion = Boolean(id)
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const formulario = useRef(null)

  const [valores, setValores] = useState(VACIO)
  const [iniciales, setIniciales] = useState(VACIO) // para saber si hay cambios sin guardar (4a)
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // texto del Alert de error
  const [enviando, setEnviando] = useState(false)
  const [descartando, setDescartando] = useState(false)

  // --- Edición: carga del torneo (patrón clave/resultado, como en los listados) ---
  const [reintento, setReintento] = useState(0)
  const [cargaTorneo, setCargaTorneo] = useState(null) // { clave, torneo, error, status }
  const claveTorneo = `${id}|${reintento}`
  const torneo = cargaTorneo?.clave === claveTorneo ? (cargaTorneo.torneo ?? null) : null
  const errorTorneo = cargaTorneo?.clave === claveTorneo ? cargaTorneo.error : null

  useEffect(() => {
    if (!edicion) return undefined
    let vigente = true
    get(`/torneos/${id}`)
      .then((r) => vigente && setCargaTorneo({ clave: claveTorneo, torneo: r.torneo }))
      .catch((e) => vigente && setCargaTorneo({ clave: claveTorneo, error: e.mensaje, status: e.status }))
    return () => {
      vigente = false
    }
  }, [edicion, id, claveTorneo])

  // Cuando llega el torneo se cargan sus datos en el formulario (una vez por carga)
  const [claveCargada, setClaveCargada] = useState(null)
  if (torneo && claveCargada !== claveTorneo) {
    setClaveCargada(claveTorneo)
    setValores(desdeTorneo(torneo))
    setIniciales(desdeTorneo(torneo))
  }

  const bloqueado = edicion && torneo !== null && !torneo.accionesPermitidas.includes('EDITAR')

  // --- Categorías de la disciplina elegida ---
  const [categorias, setCategorias] = useState(null) // { disciplina, lista, error }
  const listaCategorias = categorias?.disciplina === valores.disciplina ? categorias.lista : null
  const errorCategorias = categorias?.disciplina === valores.disciplina ? categorias.error : null

  useEffect(() => {
    let vigente = true
    const disciplina = valores.disciplina
    get(`/categorias?disciplina=${disciplina}`)
      .then((r) => vigente && setCategorias({ disciplina, lista: r.categorias }))
      .catch((e) => vigente && setCategorias({ disciplina, lista: [], error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [valores.disciplina])

  const cambiarValor = (campo, valor) => {
    setValores((anteriores) => {
      const nuevos = { ...anteriores, [campo]: valor }
      // La categoría depende de la disciplina: al cambiarla hay que elegir otra
      if (campo === 'disciplina' && valor !== anteriores.disciplina) nuevos.categoriaId = ''
      return nuevos
    })
    if (errores[campo] || (campo === 'formato' && (errores.cupoMaximo || errores.clasificanPorZona))) {
      setErrores((anteriores) => ({ ...anteriores, [campo]: undefined, ...(campo === 'formato' && { cupoMaximo: undefined, clasificanPorZona: undefined }) }))
    }
  }
  const cambiar = (campo) => (evento) => cambiarValor(campo, evento.target.value)

  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) formulario.current?.querySelector(`[name="${primero}"]`)?.focus()
  }

  const hayCambios = JSON.stringify(valores) !== JSON.stringify(iniciales)

  // Si hay datos cargados se pide confirmar antes de descartarlos
  const salir = () => (hayCambios && !bloqueado ? setDescartando(true) : navigate(RUTA))
  const seguirEditando = useCallback(() => setDescartando(false), [])

  const enviar = async (evento) => {
    evento.preventDefault()
    if (bloqueado) return
    setAlerta(null)

    const conError = validar(valores)
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      setAlerta('Revisá los campos marcados antes de continuar')
      enfocarPrimerError(conError)
      return
    }

    setErrores({})
    setEnviando(true)
    try {
      if (edicion) await put(`/torneos/${id}`, aCuerpo(valores))
      else await post('/torneos', aCuerpo(valores))
      mostrarToast(edicion ? 'Evento actualizado correctamente' : 'Evento creado correctamente')
      // Paso 8: vuelve a la lista de eventos activos
      navigate(RUTA, { replace: true })
    } catch (error) {
      setEnviando(false)
      if (error.status === 409) {
        // A1: mientras se editaba, alguien abrió las inscripciones. Se recarga para mostrarlo bloqueado.
        mostrarToast(error.mensaje, 'error')
        setReintento((n) => n + 1)
        return
      }
      const campo = CAMPO_DE_API[error.campo] ?? error.campo
      if (error.status === 400 && CAMPOS.includes(campo)) {
        // 6a del lado de la API: un dato que el cliente dio por bueno (por ejemplo, una categoría que ya no existe)
        setErrores({ [campo]: campo === 'categoriaId' ? 'Elegí una categoría de la disciplina' : 'Revisá este dato' })
        setAlerta('Revisá los campos marcados antes de continuar')
        enfocarPrimerError({ [campo]: true })
      } else {
        setAlerta(error.mensaje)
      }
    }
  }

  const titulo = edicion ? 'Editar evento' : 'Crear nuevo evento'
  const encabezado = (
    <>
      <button type="button" onClick={salir} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit cursor-pointer">
        <span aria-hidden="true">‹</span> Volver a torneos
      </button>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">{titulo}</h1>
        <p className="text-texto-suave text-sm mt-1">
          {edicion ? 'Modificá los datos del torneo mientras esté Planificado' : 'Completá los datos para crear el torneo'}
        </p>
      </div>
    </>
  )

  // Edición: cargando o con error
  if (edicion && !torneo) {
    return (
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {encabezado}
        {errorTorneo ? (
          <Alert variante="error" titulo={cargaTorneo.status === 404 ? 'No encontramos el torneo' : 'No pudimos cargar el torneo'}>
            {cargaTorneo.status === 404 ? (
              <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
            ) : (
              <>
                {errorTorneo}{' '}
                <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
                  Reintentar
                </button>
              </>
            )}
          </Alert>
        ) : (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando torneo" />
          </div>
        )}
      </div>
    )
  }

  const conZonas = valores.formato === 'ZONAS_Y_ELIMINACION'
  const opcionesCategoria = (listaCategorias ?? []).map((c) => ({ valor: c.id, texto: c.nombre }))

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      {encabezado}

      <form ref={formulario} onSubmit={enviar} noValidate className={`${TARJETA} flex flex-col gap-8`}>
        {bloqueado && (
          <Alert variante="info">
            Este evento ya no se puede editar: está en {ESTADOS.torneo[torneo.estado].texto}
          </Alert>
        )}
        {alerta && <Alert variante="error">{alerta}</Alert>}

        {/* Bloqueado: fieldset disabled deshabilita todos los campos y botones de adentro */}
        <fieldset disabled={bloqueado} className={`flex flex-col gap-8 min-w-0 ${bloqueado ? 'opacity-60' : ''}`}>
          <section className="flex flex-col gap-5">
            <h2 className={TITULO_SECCION}>Datos generales</h2>
            <FormField label="Nombre del torneo" id="nombre" requerido error={errores.nombre}>
              <Input id="nombre" name="nombre" autoComplete="off" placeholder="Nombre del evento" maxLength={LIMITES.nombre}
                value={valores.nombre} onChange={cambiar('nombre')} error={!!errores.nombre} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div className="flex flex-col gap-2">
                <span id="etiqueta-disciplina" className="text-[13px] text-texto-suave">
                  Disciplina<span className="text-viper ml-1" aria-hidden="true">*</span>
                </span>
                <div role="radiogroup" aria-labelledby="etiqueta-disciplina" className="grid grid-cols-2 gap-1 p-1 bg-fondo border border-gray-800 rounded-lg">
                  {Object.entries(ETIQUETA_DISCIPLINA).map(([valor, texto]) => {
                    const activa = valores.disciplina === valor
                    return (
                      <label key={valor} className={`text-center text-sm py-2.5 rounded-md border cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-viper ${activa ? 'border-viper bg-viper/10 text-viper' : 'border-transparent text-texto-suave hover:text-texto'}`}>
                        <input type="radio" name="disciplina" value={valor} checked={activa} onChange={() => cambiarValor('disciplina', valor)} className="sr-only" />
                        {texto}
                      </label>
                    )
                  })}
                </div>
              </div>
              <FormField label="Categoría técnica" id="categoriaId" requerido error={errores.categoriaId ?? errorCategorias}>
                <Select id="categoriaId" name="categoriaId" value={valores.categoriaId} onChange={cambiar('categoriaId')} error={!!errores.categoriaId}
                  disabled={!listaCategorias} opciones={opcionesCategoria}
                  placeholder={listaCategorias ? 'Elegí una categoría' : 'Cargando categorías…'} />
              </FormField>
            </div>
          </section>

          <hr className="border-gray-800" />

          <section className="flex flex-col gap-5">
            <h2 className={TITULO_SECCION}>Formato de competencia</h2>
            <fieldset className="flex flex-col gap-2 min-w-0">
              <legend className="text-[13px] text-texto-suave mb-2">
                Formato<span className="text-viper ml-1" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORMATOS.map((f) => (
                  <TarjetaOpcion key={f.valor} name="formato" valor={f.valor} actual={valores.formato} titulo={f.titulo} detalle={f.detalle} onElegir={(v) => cambiarValor('formato', v)} />
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {conZonas && (
                <FormField label="Clasificados por zona" id="clasificanPorZona" requerido error={errores.clasificanPorZona} ayuda="Zonas de 3 jugadores: clasifican 1 o 2.">
                  <Contador id="clasificanPorZona" name="clasificanPorZona" etiqueta="clasificados por zona" valor={valores.clasificanPorZona}
                    onCambiar={(v) => cambiarValor('clasificanPorZona', v)} minimo={LIMITES.clasificanMinimo} maximo={LIMITES.clasificanMaximo} error={!!errores.clasificanPorZona} />
                </FormField>
              )}
              <FormField label="Cupo máximo" id="cupoMaximo" requerido error={errores.cupoMaximo} ayuda={conZonas ? 'Mínimo 6, para armar al menos dos zonas.' : undefined}>
                <Contador id="cupoMaximo" name="cupoMaximo" etiqueta="cupo máximo" valor={valores.cupoMaximo}
                  onCambiar={(v) => cambiarValor('cupoMaximo', v)} minimo={conZonas ? LIMITES.cupoMinimoZonas : LIMITES.cupoMinimo} maximo={LIMITES.cupoMaximo} error={!!errores.cupoMaximo} />
              </FormField>
            </div>
          </section>

          <hr className="border-gray-800" />

          <section className="flex flex-col gap-5">
            <h2 className={TITULO_SECCION}>Fechas y precio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <FormField label="Fecha de inicio" id="fechaInicio" requerido error={errores.fechaInicio}>
                <Input id="fechaInicio" name="fechaInicio" type="date" value={valores.fechaInicio} onChange={cambiar('fechaInicio')} error={!!errores.fechaInicio} />
              </FormField>
              <FormField label="Fecha de fin" id="fechaFin" requerido error={errores.fechaFin}>
                <Input id="fechaFin" name="fechaFin" type="date" min={valores.fechaInicio || undefined} value={valores.fechaFin} onChange={cambiar('fechaFin')} error={!!errores.fechaFin} />
              </FormField>
              <FormField label="Precio de inscripción" id="precio" requerido error={errores.precio}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-texto-suave pointer-events-none" aria-hidden="true">$</span>
                  <Input id="precio" name="precio" inputMode="decimal" autoComplete="off" placeholder="0,00" maxLength={16}
                    value={valores.precio} onChange={cambiar('precio')} error={!!errores.precio} className="pl-9"
                    onBlur={() => {
                      // Al salir del campo se escribe con puntos de miles y dos decimales: 8000 → 8.000,00
                      const numero = leerPrecio(valores.precio)
                      if (numero !== null) cambiarValor('precio', escribirPrecio(numero))
                    }} />
                </div>
              </FormField>
            </div>
          </section>
        </fieldset>

        {/* Escritorio: Cancelar y Guardar abajo de la tarjeta. Celular: Guardar fijo abajo (vista móvil) */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:static sm:p-0 sm:pt-6 sm:bg-transparent sm:backdrop-blur-none flex sm:justify-between gap-3">
          {/* En el celular se sale con «‹ Volver a torneos» de arriba */}
          <div className="hidden sm:block">
            <Button variante="neutro" onClick={salir} disabled={enviando} className="py-3 px-10">
              {bloqueado ? 'Volver' : 'Cancelar'}
            </Button>
          </div>
          {!bloqueado && (
            <Button type="submit" cargando={enviando} className="w-full sm:w-auto py-3 px-12 whitespace-nowrap">
              Guardar Evento
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        abierto={descartando}
        posicion="abajo-movil"
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder los datos cargados."
        textoCancelar="Seguir editando"
        textoConfirmar="Descartar"
        onCancelar={seguirEditando}
        onConfirmar={() => navigate(RUTA)}
      />
    </div>
  )
}