import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { escribirPrecio, leerPrecio } from '../../torneos/torneos'
import { OPCIONES_MES, nombrePeriodo, opcionesAnio, periodoActual } from '../socios'

const OPCIONES_MES_FORMULARIO = OPCIONES_MES.slice(1) // sin «Mes: Todos»
const MONTO_MAXIMO = 9999999999
const ERRORES_VACIOS = { monto: '', fechaVencimiento: '' }

const dos = (n) => String(n).padStart(2, '0')
// Vencimiento sugerido: el día 10 del mes elegido
const vencimientoSugerido = (mes, anio) => `${anio}-${dos(mes)}-10`

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`

// Modal «Generar cuotas del mes» (CU 4.2 · pasos 3 a 10). Se monta al abrirlo, así cada vez empieza de cero.
// `onGenerado({ mes, anio })` avisa que se generaron cuotas, para que el listado se actualice.
export default function GenerarCuotas({ onCerrar, onGenerado }) {
  const { mostrarToast } = useToast()
  const inicio = periodoActual()

  const [mes, setMes] = useState(inicio.mes)
  const [anio, setAnio] = useState(inicio.anio)
  const [monto, setMonto] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState(vencimientoSugerido(inicio.mes, inicio.anio))
  const [vencimientoEditado, setVencimientoEditado] = useState(false)
  const [errores, setErrores] = useState(ERRORES_VACIOS)
  const [alerta, setAlerta] = useState(null) // { variante, texto }
  const [enviando, setEnviando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false) // 6a

  // Cuántos socios activos hay y cuántos ya tienen la cuota del período elegido (se vuelve a pedir si cambia el período)
  const [reintento, setReintento] = useState(0)
  const [respuesta, setRespuesta] = useState(null) // { clave, datos, error }
  const clave = `${mes}|${anio}|${reintento}`
  const cargandoPreview = respuesta?.clave !== clave
  const preview = respuesta?.clave === clave ? respuesta.datos : null
  const errorPreview = respuesta?.clave === clave ? respuesta.error : null
  useEffect(() => {
    let vigente = true
    get(`/cuotas/generar/preview?mes=${mes}&anio=${anio}`)
      .then((datos) => vigente && setRespuesta({ clave, datos }))
      .catch((e) => vigente && setRespuesta({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, mes, anio])

  const sinSocios = preview?.sociosActivos === 0 // 4a
  const todasGeneradas = preview != null && preview.sociosActivos > 0 && preview.aGenerar === 0 // 8a
  const parcial = preview != null && preview.conCuota > 0 && preview.aGenerar > 0 // 8a
  const periodo = nombrePeriodo(mes, anio)

  const cambiarPeriodo = (campo) => (e) => {
    const nuevo = { mes, anio, [campo]: e.target.value }
    if (campo === 'mes') setMes(nuevo.mes)
    else setAnio(nuevo.anio)
    // Mientras no lo toque, el vencimiento acompaña al mes elegido
    if (!vencimientoEditado) setFechaVencimiento(vencimientoSugerido(nuevo.mes, nuevo.anio))
    setErrores(ERRORES_VACIOS)
    setAlerta(null)
  }

  // 6a · cancelar: con datos cargados pide confirmar antes de descartar
  const hayDatos = monto.trim() !== '' || vencimientoEditado
  const cancelar = () => {
    if (enviando || pideDescartar) return
    if (hayDatos) setPideDescartar(true)
    else onCerrar()
  }
  // El Modal vuelve a enfocar el panel cada vez que cambia `onCerrar`; con una función estable no le roba el foco al campo
  const cancelarActual = useRef(cancelar)
  useEffect(() => {
    cancelarActual.current = cancelar
  })
  const alCerrar = useCallback(() => cancelarActual.current(), [])

  // 7a · validación
  const validar = () => {
    const nuevos = { ...ERRORES_VACIOS }
    const numero = leerPrecio(monto)
    if (monto.trim() === '') nuevos.monto = 'Campo obligatorio'
    else if (numero === null) nuevos.monto = 'Ingresá un monto válido, por ejemplo 25.000,00'
    else if (numero <= 0) nuevos.monto = 'El monto debe ser mayor a cero'
    else if (numero > MONTO_MAXIMO) nuevos.monto = 'El monto es demasiado alto'

    if (!fechaVencimiento) nuevos.fechaVencimiento = 'Campo obligatorio'
    else if (fechaVencimiento <= `${anio}-${dos(mes)}-01`) nuevos.fechaVencimiento = 'Debe ser posterior al inicio del mes'
    return nuevos
  }

  const generar = async (e) => {
    e.preventDefault()
    const nuevos = validar()
    if (Object.values(nuevos).some(Boolean)) {
      setErrores(nuevos)
      setAlerta({ variante: 'error', texto: 'Revisá los campos marcados antes de continuar' })
      return
    }

    setErrores(ERRORES_VACIOS)
    setAlerta(null)
    setEnviando(true)
    try {
      const r = await post('/cuotas/generar', { mes: Number(mes), anio: Number(anio), monto: leerPrecio(monto), fechaVencimiento })
      const ya = r.yaExistentes > 0 ? ` (${plural(r.yaExistentes, 'socio ya tenía', 'socios ya tenían')} la cuota)` : ''
      mostrarToast(`${r.generadas === 1 ? 'Se generó 1 cuota' : `Se generaron ${r.generadas} cuotas`} de ${periodo}${ya}`)
      onGenerado({ mes, anio })
    } catch (error) {
      if (error.campo === 'monto' || error.campo === 'fechaVencimiento') {
        setErrores({ ...ERRORES_VACIOS, [error.campo]: error.mensaje.replace(/^Datos inválidos: /, '') })
        setAlerta({ variante: 'error', texto: 'Revisá los campos marcados antes de continuar' })
      } else if (error.status === 409) {
        // 8a / 4a: alguien se adelantó. El modal sigue abierto y se vuelve a pedir el resumen del período.
        setAlerta({ variante: 'advertencia', texto: error.mensaje })
        setReintento((n) => n + 1)
      } else {
        setAlerta({ variante: 'error', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  const textoBoton = preview && preview.aGenerar > 0 ? `Generar ${plural(preview.aGenerar, 'cuota', 'cuotas')}` : 'Generar cuotas'
  const formularioDeshabilitado = cargandoPreview || sinSocios || Boolean(errorPreview)

  return (
    <>
      <Modal abierto titulo="Generar cuotas del mes" onCerrar={alCerrar}>
        <form noValidate onSubmit={generar} className="flex flex-col gap-5">
          <p className="text-sm text-texto-suave -mt-2">Se crea una cuota pendiente por cada socio activo.</p>

          {alerta && <Alert variante={alerta.variante}>{alerta.texto}</Alert>}

          {/* Qué va a pasar con el período elegido */}
          {errorPreview ? (
            <Alert variante="error" titulo="No pudimos consultar los socios">
              {errorPreview}{' '}
              <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
                Reintentar
              </button>
            </Alert>
          ) : cargandoPreview ? (
            <div className="py-2 flex justify-center">
              <Spinner texto="Consultando socios" />
            </div>
          ) : sinSocios ? (
            <Alert variante="advertencia" titulo="No hay socios con estado Activo">
              Registrá un socio para poder generar cuotas.
            </Alert>
          ) : todasGeneradas ? (
            <Alert variante="advertencia" titulo={`Las cuotas de ${periodo} ya fueron generadas`}>
              {preview.sociosActivos === 1 ? 'El socio activo ya tiene' : `Los ${preview.sociosActivos} socios activos ya tienen`} cuota para ese período.
            </Alert>
          ) : parcial ? (
            <Alert variante="info" titulo={`Ya existen cuotas de ${periodo} para ${plural(preview.conCuota, 'socio', 'socios')}`}>
              Se generarán únicamente {preview.aGenerar === 1 ? 'la cuota faltante' : `las ${preview.aGenerar} cuotas faltantes`}.
            </Alert>
          ) : (
            <Alert variante="info">
              Se generará una cuota para {preview.sociosActivos === 1 ? 'el socio activo' : `cada uno de los ${preview.sociosActivos} socios activos`}.
            </Alert>
          )}

          <fieldset className="flex flex-col gap-5" disabled={enviando || sinSocios}>
            <legend className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Período</legend>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Mes" id="cuota-mes" requerido>
                <Select id="cuota-mes" opciones={OPCIONES_MES_FORMULARIO} value={mes} onChange={cambiarPeriodo('mes')} />
              </FormField>
              <FormField label="Año" id="cuota-anio" requerido>
                <Select id="cuota-anio" opciones={opcionesAnio().slice(1)} value={anio} onChange={cambiarPeriodo('anio')} />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-5" disabled={enviando || sinSocios}>
            <legend className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Monto y vencimiento</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Monto de la cuota" id="cuota-monto" requerido error={errores.monto}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-texto-suave pointer-events-none" aria-hidden="true">$</span>
                  <Input
                    id="cuota-monto"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="25.000,00"
                    maxLength={16}
                    value={monto}
                    error={Boolean(errores.monto)}
                    className="pl-9"
                    onChange={(e) => {
                      setMonto(e.target.value)
                      setErrores((actuales) => ({ ...actuales, monto: '' }))
                    }}
                    onBlur={() => {
                      // Al salir del campo se escribe con puntos de miles y dos decimales: 25000 → 25.000,00
                      const numero = leerPrecio(monto)
                      if (numero !== null) setMonto(escribirPrecio(numero))
                    }}
                  />
                </div>
              </FormField>
              <FormField label="Fecha de vencimiento" id="cuota-vencimiento" requerido error={errores.fechaVencimiento}>
                <Input
                  id="cuota-vencimiento"
                  type="date"
                  value={fechaVencimiento}
                  error={Boolean(errores.fechaVencimiento)}
                  onChange={(e) => {
                    setFechaVencimiento(e.target.value)
                    setVencimientoEditado(true)
                    setErrores((actuales) => ({ ...actuales, fechaVencimiento: '' }))
                  }}
                />
              </FormField>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
            {sinSocios ? (
              <Link
                to="/gestion/socios/nuevo"
                className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-sobre-viper px-6 py-3 rounded-lg text-center transition-colors"
              >
                Registrar socio
              </Link>
            ) : (
              <Button variante="neutro" onClick={cancelar} disabled={enviando} className="py-3">
                Cancelar
              </Button>
            )}
            {sinSocios ? (
              <Button variante="neutro" onClick={onCerrar} className="py-3">
                Cerrar
              </Button>
            ) : (
              <Button type="submit" cargando={enviando} disabled={formularioDeshabilitado || todasGeneradas} className="py-3">
                {textoBoton}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* 6a · con datos cargados, pide confirmar antes de descartar */}
      <ConfirmDialog
        abierto={pideDescartar}
        tipo="advertencia"
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder los datos cargados."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={onCerrar}
        onCancelar={() => setPideDescartar(false)}
      />
    </>
  )
}