import { useState } from 'react'

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      {/* 1. Navbar con z-[60] para que SIEMPRE esté arriba de todo */}
      <nav className="fixed w-full top-0 z-[60] bg-fondo/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="font-outfit text-2xl font-bold tracking-wide">
              VIPER <span className="text-viper">|</span>
            </span>
            <span className="font-outfit text-lg text-texto-suave hidden sm:block">
              La Rochelle
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-texto-suave">
            <a href="" className="hover:text-viper transition-colors">Reservas</a>
            <a href="" className="hover:text-viper transition-colors">Torneos</a>
            <a href="" className="hover:text-viper transition-colors">Ranking</a>
            <a href="" className="hover:text-viper transition-colors">Tienda</a>
            <button className="font-outfit bg-panel border border-gray-700 hover:border-viper text-texto px-6 py-2 rounded-lg font-semibold transition-all">
              Iniciar Sesión
            </button>
          </div>

          {/* Botón Morphicon que ahora nunca se va a tapar */}
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 focus:outline-none"
            aria-label="Menú principal"
          >
            <span className={`block w-6 h-[2px] bg-texto rounded-full transition-transform duration-300 ease-in-out origin-center ${menuAbierto ? 'rotate-45 translate-y-[8px]' : ''}`}></span>
            <span className={`block w-6 h-[2px] bg-texto rounded-full transition-opacity duration-200 ease-in-out ${menuAbierto ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-6 h-[2px] bg-texto rounded-full transition-transform duration-300 ease-in-out origin-center ${menuAbierto ? '-rotate-45 -translate-y-[8px]' : ''}`}></span>
          </button>

        </div>
      </nav>

      {/* 2. Fondo oscuro (Overlay) con z-40 */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          menuAbierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuAbierto(false)}
      ></div>

      {/* 3. Menú Lateral con z-50 y efecto transparencia recuperado (bg-panel/85) */}
      <div 
        className={`md:hidden fixed top-0 right-0 w-3/4 max-w-sm h-screen bg-panel/85 backdrop-blur-2xl border-l border-gray-800 z-50 transition-transform duration-300 ease-in-out flex flex-col pt-28 px-8 shadow-2xl ${
          menuAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          <a href="" className="text-texto hover:text-viper text-xl font-medium transition-colors border-b border-gray-800 pb-4">Reservas</a>
          <a href="" className="text-texto hover:text-viper text-xl font-medium transition-colors border-b border-gray-800 pb-4">Torneos</a>
          <a href="" className="text-texto hover:text-viper text-xl font-medium transition-colors border-b border-gray-800 pb-4">Ranking</a>
          <a href="" className="text-texto hover:text-viper text-xl font-medium transition-colors border-b border-gray-800 pb-4">Tienda</a>
          
          <button className="mt-8 font-outfit bg-viper hover:bg-viper-hover text-black w-full py-4 rounded-xl font-bold transition-all text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            Iniciar Sesión
          </button>
        </div>
      </div>
    </>
  )
}