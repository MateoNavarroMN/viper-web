import Navbar from '../componentes/Navbar'
import Hero from '../componentes/Hero'
import Footer from '../componentes/Footer'

export default function Landing() {
  
  // Array con los módulos, ahora incluyendo el SVG de cada ícono
  const modulos = [
    {
      titulo: "Gestión de Reservas",
      desc: "Grilla interactiva en tiempo real con control de disponibilidad para evitar solapamientos en canchas de tenis y pádel.",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-viper group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      titulo: "Logística de Torneos",
      desc: "Generador automático de llaves de competencia (brackets) y asignación inteligente de horarios.",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-viper group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
      )
    },
    {
      titulo: "Ranking Dinámico",
      desc: "Motor de reglas que calcula y actualiza instantáneamente tus puntos y categoría tras cada partido.",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-viper group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
          <polyline points="2 6 8 2 14 8 22 4"></polyline>
        </svg>
      )
    },
    {
      titulo: "Tienda y Caja (POS)",
      desc: "Punto de venta integrado para el Pro-Shop y el buffet, con conciliación directa vía Mercado Pago.",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-viper group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />

        {/* Sección de Módulos (Características) */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-bold mb-4">Potenciado por Viper</h2>
            <p className="text-texto-suave">Automatización y control total para la administración del club.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {modulos.map((mod, index) => (
              <div key={index} className="bg-panel border border-gray-800 p-8 rounded-2xl hover:border-viper transition-colors group">
                <div className="w-12 h-12 bg-fondo rounded-lg border border-gray-700 flex items-center justify-center mb-6 group-hover:bg-viper/10 group-hover:border-viper/50 transition-colors">
                  {/* Acá inyectamos el ícono SVG dinámicamente */}
                  {mod.icono}
                </div>
                <h3 className="font-outfit text-xl font-bold mb-3">{mod.titulo}</h3>
                <p className="text-texto-suave leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}