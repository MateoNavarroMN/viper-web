// Una tarjeta de total del balance (ingresos, egresos o saldo). `tono` = clase de color del importe.
export default function TarjetaTotal({ titulo, valor, ayuda, tono = 'text-texto' }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-2xl px-5 py-4 min-w-0">
      <p className="text-sm text-texto-suave">{titulo}</p>
      <p className={`font-outfit text-2xl sm:text-[28px] font-bold tabular-nums mt-1 break-words ${tono}`}>{valor}</p>
      <p className="text-xs text-texto-suave mt-1">{ayuda}</p>
    </div>
  )
}