export default function Navbar() {
  return (
    <nav className="fixed w-full top-0 z-50 bg-fondo/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-outfit text-2xl font-bold tracking-wide">
            VIPER <span className="text-viper">|</span>
          </span>
          <span className="font-outfit text-lg text-texto-suave hidden sm:block">
            La Rochelle
          </span>
        </div>

        {/* Links de navegación (Ocultos en móvil por ahora) */}
        <div className="hidden md:flex items-center gap-8 font-medium text-texto-suave">
          <a href="#" className="hover:text-viper transition-colors">Reservas</a>
          <a href="#" className="hover:text-viper transition-colors">Torneos</a>
          <a href="#" className="hover:text-viper transition-colors">Ranking</a>
          <a href="#" className="hover:text-viper transition-colors">Tienda</a>
        </div>

        {/* Botón de Acción */}
        <button className="font-outfit bg-panel border border-gray-700 hover:border-viper text-texto px-6 py-2 rounded-lg font-semibold transition-all">
          Iniciar Sesión
        </button>

      </div>
    </nav>
  )
}