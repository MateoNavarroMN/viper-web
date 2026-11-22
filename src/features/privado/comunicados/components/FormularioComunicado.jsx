import { useRef, useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Input from '../../../../shared/components/Input'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { CLASES_CAMPO, claseBorde } from '../../../../shared/utils/campo'
import { ALCANCES, LIMITES, TEXTO_PUBLICO } from '../comunicados'

const ETIQUETA = 'text-[13px] text-texto-suave'
const CAMPOS = ['titulo', 'mensaje', 'alcance']

// Etiqueta de un campo con su contador de caracteres a la derecha
function Etiqueta({ id, texto, usados, maximo }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={id} className={ETIQUETA}>
        {texto}
        <span className="text-viper ml-1" aria-hidden="true">*</span>
      </label>
      <span className={`text-xs tabular-nums ${usados > maximo ? 'text-error' : 'text-texto-suave'}`}>{usados} / {maximo}</span>
    </div>
  )
}

// Así se va a ver en la cartelera del jugador
function VistaPrevia({ titulo, mensaje, alcance }) {
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return (
    <section aria-label="Así lo verá el jugador" className="bg-panel border border-gray-800 rounded-2xl overflow-hidden">
      <h2 className="font-outfit text-base font-bold px-5 py-4 border-b border-gray-800">Así lo verá el jugador</h2>
      <div className="p-4">
        <div className="bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold break-words min-w-0">{titulo.trim() || 'Título del comunicado'}</p>
            <div className="shrink-0"><EstadoBadge tipo="alcanceComunicado" estado={alcance} /></div>
          </div>
          <p className="text-xs text-texto-suave">Hoy · {hora}</p>
          <p className="text-sm text-texto-suave break-words whitespace-pre-line">{mensaje.trim().slice(0, 160) || 'El mensaje va a aparecer acá.'}{mensaje.trim().length > 160 ? '…' : ''}</p>
        </div>
      </div>
    </section>
  )
}

// Formulario de un comunicado (alta y edición de un borrador). `inicial` = { titulo, mensaje, alcance }.
// `guardar({ titulo, mensaje, alcance, accion })` hace el pedido (accion: 'BORRADOR' | 'PUBLICAR') y devuelve la promesa; si la API rechaza,
// el error trae `campo` y `mensaje`. `onTerminar(accion, respuesta)` se llama al guardar bien; `onCancelar()` al volver al listado.
// - «Guardar borrador» solo pide el título. «Publicar» pide título y mensaje y antes confirma a quiénes se les va a mostrar.
// - Con datos sin guardar, «Cancelar» pide confirmación. Todo error se muestra sin perder lo escrito.
export default function FormularioComunicado({ inicial, guardar, onTerminar, onCancelar }) {
  const [valores, setValores] = useState({ titulo: inicial.titulo, mensaje: inicial.mensaje, alcance: inicial.alcance })
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { titulo, texto }
  const [enviando, setEnviando] = useState(null) // null | 'BORRADOR' | 'PUBLICAR'
  const [dialogo, setDialogo] = useState(null) // 'descartar' | 'publicar'
  const formulario = useRef(null)
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const posicion = esEscritorio ? 'centro' : 'abajo-movil'

  const hayCambios = valores.titulo.trim() !== inicial.titulo || valores.mensaje.trim() !== inicial.mensaje || valores.alcance !== inicial.alcance

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) formulario.current?.querySelector(`[name="${primero}"]`)?.focus()
  }

  // Devuelve los errores de los campos; para publicar también se exige el mensaje
  const validar = (accion) => {
    const conError = {}
    const titulo = valores.titulo.trim()
    const mensaje = valores.mensaje.trim()
    if (!titulo) conError.titulo = 'Completá este campo'
    else if (titulo.length > LIMITES.titulo) conError.titulo = `Hasta ${LIMITES.titulo} caracteres`
    if (accion === 'PUBLICAR' && !mensaje) conError.mensaje = 'Completá este campo'
    else if (mensaje.length > LIMITES.mensaje) conError.mensaje = `Hasta ${LIMITES.mensaje} caracteres`
    return conError
  }

  const intentar = (accion) => {
    setAlerta(null)
    const conError = validar(accion)
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      setAlerta({ titulo: 'Revisá los campos marcados antes de continuar' })
      enfocarPrimerError(conError)
      return
    }
    if (accion === 'PUBLICAR') setDialogo('publicar')
    else mandar('BORRADOR')
  }

  const mandar = async (accion) => {
    setDialogo(null)
    setErrores({})
    setAlerta(null)
    setEnviando(accion)
    try {
      const respuesta = await guardar({ titulo: valores.titulo.trim(), mensaje: valores.mensaje.trim(), alcance: valores.alcance, accion })
      onTerminar(accion, respuesta)
    } catch (error) {
      if (error.campo && CAMPOS.includes(error.campo)) {
        setErrores({ [error.campo]: 'Revisá este campo' })
        setAlerta({ titulo: 'Revisá los campos marcados antes de continuar', texto: error.mensaje })
        enfocarPrimerError({ [error.campo]: true })
      } else {
        setAlerta({ titulo: 'No pudimos guardar el comunicado', texto: error.mensaje })
      }
    } finally {
      setEnviando(null)
    }
  }

  const cancelar = () => (hayCambios ? setDialogo('descartar') : onCancelar())

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <form ref={formulario} onSubmit={(e) => e.preventDefault()} noValidate className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 min-w-0">
          {alerta && (
            <Alert variante="error" titulo={alerta.titulo}>
              {alerta.texto}
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Etiqueta id="titulo" texto="Título" usados={valores.titulo.length} maximo={LIMITES.titulo} />
            <Input id="titulo" name="titulo" placeholder="Por ejemplo: Cancelación por lluvia" autoComplete="off" value={valores.titulo} onChange={cambiar('titulo')} error={Boolean(errores.titulo)} disabled={Boolean(enviando)} />
            {errores.titulo && <p role="alert" className="text-error text-xs">{errores.titulo}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Etiqueta id="mensaje" texto="Mensaje" usados={valores.mensaje.length} maximo={LIMITES.mensaje} />
            <textarea
              id="mensaje"
              name="mensaje"
              rows={7}
              placeholder="Escribí el aviso que van a leer los jugadores"
              value={valores.mensaje}
              onChange={cambiar('mensaje')}
              disabled={Boolean(enviando)}
              aria-invalid={Boolean(errores.mensaje) || undefined}
              className={`${CLASES_CAMPO} ${claseBorde(Boolean(errores.mensaje))} resize-y min-h-32`}
            />
            {errores.mensaje && <p role="alert" className="text-error text-xs">{errores.mensaje}</p>}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-6">
            <span id="alcance-etiqueta" className={ETIQUETA}>
              Visible para<span className="text-viper ml-1" aria-hidden="true">*</span>
            </span>
            <div role="group" aria-labelledby="alcance-etiqueta" className="grid grid-cols-2 gap-1 bg-fondo border border-gray-800 rounded-lg p-1 sm:max-w-sm">
              {ALCANCES.map(({ valor, texto }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={valores.alcance === valor}
                  disabled={Boolean(enviando)}
                  onClick={() => setValores((previos) => ({ ...previos, alcance: valor }))}
                  className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${valores.alcance === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
                >
                  {texto}
                </button>
              ))}
            </div>
            <p className="text-texto-suave text-xs">{ALCANCES.find((a) => a.valor === valores.alcance).ayuda}</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2 border-t border-gray-800">
            <Button type="button" variante="neutro" onClick={cancelar} disabled={Boolean(enviando)} className="mt-3 sm:mt-0">
              Cancelar
            </Button>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-3 sm:mt-0">
              <Button type="button" variante="secundario" onClick={() => intentar('BORRADOR')} cargando={enviando === 'BORRADOR'} disabled={Boolean(enviando)}>
                Guardar borrador
              </Button>
              <Button type="button" onClick={() => intentar('PUBLICAR')} cargando={enviando === 'PUBLICAR'} disabled={Boolean(enviando)}>
                Publicar
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <VistaPrevia {...valores} />
          <Alert variante="info" titulo="Solo en la cartelera">
            El aviso se muestra en el Portal del Jugador. No se envían correos, WhatsApp ni notificaciones push.
          </Alert>
        </div>
      </div>

      <ConfirmDialog
        abierto={dialogo === 'descartar'}
        posicion={posicion}
        titulo="¿Descartar los datos?"
        mensaje="Si salís ahora, vas a perder lo que escribiste."
        textoCancelar="Seguir editando"
        textoConfirmar="Descartar"
        onCancelar={() => setDialogo(null)}
        onConfirmar={() => {
          setDialogo(null)
          onCancelar()
        }}
      />
      <ConfirmDialog
        abierto={dialogo === 'publicar'}
        posicion={posicion}
        titulo="¿Publicar el comunicado?"
        mensaje={`Se va a mostrar en la cartelera del Portal del Jugador. Visible para: ${TEXTO_PUBLICO[valores.alcance].toLowerCase()}.`}
        textoCancelar="Volver"
        textoConfirmar="Publicar"
        variante="primario"
        onCancelar={() => setDialogo(null)}
        onConfirmar={() => mandar('PUBLICAR')}
      />
    </>
  )
}