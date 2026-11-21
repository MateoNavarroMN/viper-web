import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { cancelarPago } from '../pagos'
import { usePago } from '../usePago'

// Cobro en línea desde recepción: en vez de abrir Mercado Pago en la compu del club, se muestra el enlace de pago (para copiar y
// mandar) y un código QR, y el socio paga desde su propio celular. Mientras tanto la pantalla consulta el estado del pago y avisa
// cuando se acredita. El pago queda pendiente hasta una hora; si se cierra sin cancelar, sigue activo.
//  · pago           { transaccionId, urlPago } que devolvió la API al iniciar el cobro
//  · detalle        texto de lo que se cobra («Juan Jugador · Noviembre 2026»)
//  · onAcreditado   el pago se acreditó y la persona toca «Listo»
//  · onCancelado    se canceló el cobro
//  · onCerrar       se cierra sin cancelar
export default function CobroConEnlace({ pago, detalle, monto, onAcreditado, onCancelado, onCerrar }) {
  const { pago: estado, sinConexion, agotado, actualizar } = usePago(pago.transaccionId, { cada: 4000, maximo: 225 })
  const [qr, setQr] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [problema, setProblema] = useState('')

  useEffect(() => {
    let vigente = true
    QRCode.toDataURL(pago.urlPago, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then((url) => vigente && setQr(url))
      .catch(() => vigente && setQr(''))
    return () => {
      vigente = false
    }
  }, [pago.urlPago])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pago.urlPago)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Sin permiso para el portapapeles: se deja el enlace seleccionado para copiarlo a mano
      document.getElementById('enlace-de-pago')?.select()
      setProblema('No pudimos copiarlo solo: el enlace quedó seleccionado, copialo con Ctrl+C.')
    }
  }

  const cancelar = async () => {
    setCancelando(true)
    setProblema('')
    try {
      await cancelarPago(pago.transaccionId)
      onCancelado()
    } catch (e) {
      // 409: se acreditó justo ahora; se vuelve a consultar para mostrarlo
      setProblema(e.mensaje ?? 'No pudimos cancelar el cobro')
      actualizar()
      setCancelando(false)
    }
  }

  const situacion = estado?.estado ?? 'PENDIENTE'

  if (situacion === 'PAGADO') {
    return (
      <div className="flex flex-col gap-5">
        <Alert variante="exito" titulo="Pago acreditado">{detalle}: el socio ya pagó {monto}. La cuota quedó pagada.</Alert>
        <div className="flex justify-end pt-5 border-t border-gray-800"><Button onClick={onAcreditado} className="py-3">Listo</Button></div>
      </div>
    )
  }

  if (situacion !== 'PENDIENTE') {
    return (
      <div className="flex flex-col gap-5">
        <Alert variante="advertencia" titulo={estado.mensaje}>{estado.motivo ?? 'El cobro no se completó. La cuota sigue pendiente: podés generar un cobro nuevo.'}</Alert>
        <div className="flex justify-end pt-5 border-t border-gray-800"><Button onClick={onCerrar} className="py-3">Cerrar</Button></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="-mt-2">
        <p className="text-sm text-texto-suave">{detalle}</p>
        <p className="text-sm font-semibold mt-1">Monto: {monto}</p>
      </div>

      <p className="text-sm">Pedile al socio que <span className="font-semibold">escanee el código</span> con su celular o <span className="font-semibold">mandale el enlace</span>. Paga en Mercado Pago, desde su dispositivo.</p>

      <div className="flex justify-center">
        <div className="bg-white rounded-xl p-2 size-[256px] flex items-center justify-center">
          {qr ? <img src={qr} alt="Código QR para pagar la cuota en Mercado Pago" width="240" height="240" /> : qr === '' ? <span className="text-sm text-gray-700 text-center px-4">No pudimos generar el código: usá el enlace.</span> : <Spinner texto="Generando el código" />}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="enlace-de-pago"
          readOnly
          value={pago.urlPago}
          aria-label="Enlace de pago"
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 bg-fondo border border-gray-800 rounded-lg px-3 py-2 text-sm text-texto-suave"
        />
        <Button variante="secundario" onClick={copiar} className="shrink-0">{copiado ? 'Enlace copiado' : 'Copiar enlace'}</Button>
      </div>

      {problema && <Alert variante="advertencia">{problema}</Alert>}
      {sinConexion && <Alert variante="advertencia">No pudimos actualizar el estado. Seguimos intentando.</Alert>}

      <p className="text-sm text-texto-suave inline-flex items-center gap-2">
        {agotado ? (
          <>Dejamos de actualizar solos. <button type="button" onClick={actualizar} className="underline font-semibold cursor-pointer">Actualizar</button></>
        ) : (
          <><Spinner tamano="chico" texto="Esperando el pago" /> Esperando que el socio pague. Se actualiza solo.</>
        )}
      </p>
      <p className="text-xs text-texto-suave -mt-3">El enlace sigue activo durante 1 hora. Si lo cerrás sin cancelar, el cobro queda pendiente hasta que se pague o venza.</p>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-gray-800">
        <Button variante="neutro" onClick={onCerrar} disabled={cancelando} className="py-3">Cerrar</Button>
        <Button variante="peligro-borde" onClick={cancelar} cargando={cancelando} className="py-3">Cancelar cobro</Button>
      </div>
    </div>
  )
}