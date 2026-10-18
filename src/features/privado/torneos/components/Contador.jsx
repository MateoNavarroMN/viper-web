// `valor` es texto para permitir borrar y escribir; `onCambiar` recibe el texto nuevo.
export default function Contador({ id, name, valor, onCambiar, minimo, maximo, error = false, disabled = false, etiqueta }) {
  const numero = Number(valor)
  const sumar = (delta) => {
    const base = Number.isInteger(numero) ? numero : minimo
    onCambiar(String(Math.min(maximo, Math.max(minimo, base + delta))))
  }
  const boton = 'w-12 shrink-0 flex items-center justify-center text-texto-suave hover:text-viper hover:bg-panel transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-texto-suave disabled:hover:bg-transparent'

  return (
    <div className={`flex h-12 bg-fondo border rounded-lg overflow-hidden transition-colors focus-within:border-viper ${error ? 'border-error focus-within:border-error' : 'border-gray-800'} ${disabled ? 'opacity-50' : ''}`}>
      <button type="button" aria-label={`Restar ${etiqueta}`} onClick={() => sumar(-1)} disabled={disabled || numero <= minimo} className={`${boton} border-r ${error ? 'border-error' : 'border-gray-800'}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
      </button>
      <input
        id={id}
        name={name}
        inputMode="numeric"
        aria-invalid={error || undefined}
        value={valor}
        disabled={disabled}
        onChange={(e) => onCambiar(e.target.value.replace(/\D/g, '').slice(0, 3))}
        className="flex-1 min-w-0 bg-transparent text-center text-sm tabular-nums focus:outline-none disabled:cursor-not-allowed"
      />
      <button type="button" aria-label={`Sumar ${etiqueta}`} onClick={() => sumar(1)} disabled={disabled || numero >= maximo} className={`${boton} border-l ${error ? 'border-error' : 'border-gray-800'}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  )
}