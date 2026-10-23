// Casilla de verificación con el estilo de la app. Se usa dentro de un <label> (por ejemplo, toda la fila de una lista)
// para que se pueda tocar la fila entera; `aria-label` o el texto del label le dan nombre accesible.
//   <label><Checkbox checked={marcada} onChange={alternar} /> ...</label>
export default function Checkbox({ checked, onChange, disabled = false, className = '', ...resto }) {
  return (
    <span className={`relative inline-flex w-6 h-6 shrink-0 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        {...resto}
      />
      <span className="w-6 h-6 rounded-md border border-gray-700 bg-fondo transition-colors peer-checked:bg-viper peer-checked:border-viper peer-hover:border-viper peer-focus-visible:ring-2 peer-focus-visible:ring-viper/50 peer-disabled:opacity-50" />
      <svg
        className="absolute inset-0 m-auto text-black opacity-0 peer-checked:opacity-100 pointer-events-none"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 5 5L20 7" />
      </svg>
    </span>
  )
}