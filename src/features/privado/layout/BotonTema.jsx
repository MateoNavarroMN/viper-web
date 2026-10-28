const SOL = 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
const LUNA = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'

// Botón del header para pasar de modo oscuro a claro y al revés. Muestra el ícono del modo al que se pasa.
export default function BotonTema({ tema, onAlternar }) {
  const aClaro = tema === 'oscuro'
  const texto = aClaro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-label={texto}
      title={texto}
      className="p-2 rounded-lg text-texto-suave hover:text-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={aClaro ? SOL : LUNA} />
      </svg>
    </button>
  )
}