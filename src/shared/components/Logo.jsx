// Logo de Viper: "VIPER |" con la barra en verde (pantallas de acceso y menú lateral).
export default function Logo({ className = '' }) {
  return (
    <span className={`font-outfit text-2xl font-bold tracking-wide ${className}`}>
      VIPER <span className="text-viper">|</span>
    </span>
  )
}