import { useRef, useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { DEPORTES, SUPERFICIE_INICIAL, leerPrecio, opcionesDeSuperficie, textoDePrecio } from '../canchas'

const CAMPOS = ['nombre', 'tipoSuperficie', 'precioHora']
const ETIQUETA_CAMPO = 'text-[13px] text-texto-suave'

// Formulario de una cancha (alta y edición). `inicial` = { nombre, deporte, tipoSuperficie, precioHora (número o '') }.
// `guardar(datos)` hace el pedido a la API y devuelve la promesa; si la API rechaza, el error trae `campo` y `mensaje`.
// `onTerminar()` se llama cuando se guardó bien; `onCancelar()` cuando se vuelve al listado sin guardar.
// - Con cambios sin guardar, «Cancelar» pide confirmación. Un precio en cero también la pide antes de guardar.
// - Todo error se muestra sin perder lo escrito: arriba el aviso y, en cada campo, su motivo.
export default function FormularioCancha({ modo = 'alta', inicial, guardar, onTerminar, onCancelar, textoGuardar = 'Guardar cancha' }) {
  const [valores, setValores] = useState(() => ({
    nombre: inicial.nombre,
    deporte: inicial.deporte,
    tipoSuperficie: inicial.tipoSuperficie,
    precio: inicial.precioHora === '' ? '' : textoDePrecio(inicial.precioHora),
  }))
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { titulo, texto }
  const [enviando, setEnviando] = useState(false)
  const [dialogo, setDialogo] = useState(null) // 'descartar' | 'cero'
  const [superficieElegida, setSuperficieElegida] = useState(modo === 'edicion')
  const formulario = useRef(null)
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const posicion = esEscritorio ? 'centro' : 'abajo-movil'

  const hayCambios =
    valores.nombre.trim() !== inicial.nombre ||
    valores.deporte !== inicial.deporte ||
    valores.tipoSuperficie !== inicial.tipoSuperficie ||
    leerPrecio(valores.precio) !== (inicial.precioHora === '' ? null : inicial.precioHora)

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value
    setValores((previos) => ({ ...previos, [campo === 'precioHora' ? 'precio' : campo]: valor }))
    if (campo === 'tipoSuperficie') setSuperficieElegida(true)
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  const elegirDeporte = (deporte) => {
    setValores((previos) => ({
      ...previos,
      deporte,
      // Mientras no se haya elegido una superficie a mano, acompaña al deporte
      tipoSuperficie: superficieElegida ? previos.tipoSuperficie : SUPERFICIE_INICIAL[deporte],
    }))
  }

  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) formulario.current?.querySelector(`[name="${primero}"]`)?.focus()
  }

  const validar = () => {
    const conError = {}
    if (!valores.nombre.trim()) conError.nombre = 'Completá este campo'
    if (!valores.tipoSuperficie) conError.tipoSuperficie = 'Completá este campo'
    if (!valores.precio.trim()) conError.precioHora = 'Completá este campo'
    else if (leerPrecio(valores.precio) === null) conError.precioHora = 'Ingresá un monto mayor o igual a cero'
    return conError
  }

  const enviar = async (evento) => {
    evento?.preventDefault()
    setAlerta(null)
    const conError = validar()
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      setAlerta({ titulo: 'Revisá los campos marcados antes de continuar' })
      enfocarPrimerError(conError)
      return
    }
    // Un precio en cero es válido, pero antes se confirma que no es un error de tipeo
    if (leerPrecio(valores.precio) === 0) {
      setDialogo('cero')
      return
    }
    await mandar()
  }

  const mandar = async () => {
    setDialogo(null)
    setErrores({})
    setEnviando(true)
    try {
      await guardar({
        nombre: valores.nombre.trim().replace(/\s+/g, ' '),
        deporte: valores.deporte,
        tipoSuperficie: valores.tipoSuperficie,
        precioHora: leerPrecio(valores.precio),
      })
      onTerminar()
    } catch (error) {
      if (error.status === 409 && error.campo === 'nombre') {
        setErrores({ nombre: 'Ya existe otra cancha con ese nombre' })
        setAlerta({ titulo: 'Ya existe otra cancha con ese nombre', texto: 'Elegí un nombre distinto para poder guardar.' })
        enfocarPrimerError({ nombre: true })
      } else if (error.campo && CAMPOS.includes(error.campo)) {
        setErrores({ [error.campo]: error.campo === 'precioHora' ? 'Ingresá un monto mayor o igual a cero' : 'Completá este campo' })
        setAlerta({ titulo: 'Revisá los campos marcados antes de continuar' })
        enfocarPrimerError({ [error.campo]: true })
      } else {
        setAlerta({ titulo: 'No pudimos guardar la cancha', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  const cancelar = () => (hayCambios ? setDialogo('descartar') : onCancelar())

  return (
    <>
      <form ref={formulario} onSubmit={enviar} noValidate className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 min-w-0">
        {alerta && (
          <Alert variante="error" titulo={alerta.titulo}>
            {alerta.texto}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
          <div className="flex flex-col gap-2">
            <span id="deporte-etiqueta" className={ETIQUETA_CAMPO}>
              Deporte<span className="text-viper ml-1" aria-hidden="true">*</span>
            </span>
            {modo === 'alta' ? (
              <div role="group" aria-labelledby="deporte-etiqueta" className="grid grid-cols-2 gap-1 bg-fondo border border-gray-800 rounded-lg p-1">
                {DEPORTES.map(({ valor, texto }) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={valores.deporte === valor}
                    disabled={enviando}
                    onClick={() => elegirDeporte(valor)}
                    className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${valores.deporte === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="bg-fondo border border-gray-800 rounded-lg px-4 py-3 text-sm">{DEPORTES.find((d) => d.valor === valores.deporte)?.texto}</p>
                <p className="text-texto-suave text-xs">El deporte no se modifica</p>
              </>
            )}
          </div>

          <FormField label="Tipo de superficie" id="tipoSuperficie" requerido error={errores.tipoSuperficie}>
            <Select
              id="tipoSuperficie"
              name="tipoSuperficie"
              opciones={opcionesDeSuperficie(valores.tipoSuperficie)}
              placeholder="Elegí una superficie"
              value={valores.tipoSuperficie}
              onChange={cambiar('tipoSuperficie')}
              error={Boolean(errores.tipoSuperficie)}
              disabled={enviando}
            />
          </FormField>
        </div>

        <FormField label="Nombre de la cancha" id="nombre" requerido error={errores.nombre}>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Nombre de la cancha"
            maxLength={60}
            autoComplete="off"
            value={valores.nombre}
            onChange={cambiar('nombre')}
            error={Boolean(errores.nombre)}
            disabled={enviando}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Precio por hora" id="precioHora" requerido error={errores.precioHora}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave text-sm" aria-hidden="true">$</span>
              <Input
                id="precioHora"
                name="precioHora"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                className="pl-8 tabular-nums"
                value={valores.precio}
                onChange={cambiar('precioHora')}
                onBlur={() => {
                  const numero = leerPrecio(valores.precio)
                  if (numero !== null) setValores((previos) => ({ ...previos, precio: textoDePrecio(numero) }))
                }}
                error={Boolean(errores.precioHora)}
                disabled={enviando}
              />
            </div>
          </FormField>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
          <Button type="button" variante="neutro" onClick={cancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando}>
            {textoGuardar}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        abierto={dialogo === 'descartar'}
        posicion={posicion}
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder los cambios sin guardar."
        textoCancelar="Seguir editando"
        textoConfirmar="Descartar"
        onCancelar={() => setDialogo(null)}
        onConfirmar={() => {
          setDialogo(null)
          onCancelar()
        }}
      />
      <ConfirmDialog
        abierto={dialogo === 'cero'}
        posicion={posicion}
        titulo="¿Guardar precio en $ 0,00?"
        mensaje="Las nuevas reservas de esta cancha no tendrán costo."
        textoCancelar="Volver"
        textoConfirmar="Guardar igual"
        onCancelar={() => setDialogo(null)}
        onConfirmar={mandar}
      />
    </>
  )
}