import Navbar from '../componentes/Navbar'
import Hero from '../componentes/Hero'
import Footer from '../componentes/Footer'

export default function Landing() {
  
  // Array con los módulos del sistema según el informe de tesis
  const modulos = [
    {
      titulo: "Gestión de Reservas",
      desc: "Grilla interactiva en tiempo real con control de disponibilidad para evitar solapamientos en canchas de tenis y pádel."
    },
    {
      titulo: "Logística de Torneos",
      desc: "Generador automático de llaves de competencia (brackets) y asignación inteligente de horarios."
    },
    {
      titulo: "Ranking Dinámico",
      desc: "Motor de reglas que calcula y actualiza instantáneamente tus puntos y categoría tras cada partido."
    },
    {
      titulo: "Tienda y Caja (POS)",
      desc: "Punto de venta integrado para el Pro-Shop y el buffet, con conciliación directa vía Mercado Pago."
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
                  <div className="w-4 h-4 bg-viper rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
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