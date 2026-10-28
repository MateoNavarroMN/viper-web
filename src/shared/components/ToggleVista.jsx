const ICONOS = {
  cards: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  filas: 'M3 6h18M3 12h18M3 18h18',
}

// Interruptor «Cards / Filas» para listados: solo íconos (el nombre queda para lectores de pantalla y como tooltip). Controlado desde afuera:
//   <ToggleVista valor={vista} onCambiar={setVista} />
export default function ToggleVista({ valor, onCambiar, etiqueta = 'Cambiar la forma de ver la lista' }) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex shrink-0 rounded-lg border border-gray-800 bg-panel p-0.5">
      {[['cards', 'Cards'], ['filas', 'Filas']].map(([clave, texto]) => {
        const activa = valor === clave
        return (
          <button
            key={clave}
            type="button"
            aria-pressed={activa}
            title={texto}
            onClick={() => onCambiar(clave)}
            className={`inline-flex items-center justify-center rounded-md w-9 h-8 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper ${
              activa ? 'bg-viper text-black' : 'text-texto-suave hover:text-texto'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={ICONOS[clave]} />
            </svg>
            <span className="sr-only">{texto}</span>
          </button>
        )
      })}
    </div>
  )
}