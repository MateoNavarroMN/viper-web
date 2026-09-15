import heroImg from '../recursos/hero.svg'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
      
      {/* Textos y Call to Action */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="font-outfit text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          El siguiente nivel en <br />
          <span className="text-viper">Gestión Deportiva.</span>
        </h1>
        <p className="text-texto-suave text-lg lg:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
          Centraliza tus reservas, compite en el circuito oficial de La Rochelle Tennis Club y escala en el ranking automatizado. Toda tu experiencia deportiva en una sola plataforma.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
          <button className="font-outfit bg-viper hover:bg-viper-hover text-black w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            Reservar Cancha
          </button>
          <button className="font-outfit bg-panel border border-gray-700 hover:bg-gray-800 text-texto w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all">
            Ver Torneos
          </button>
        </div>
      </div>

      {/* Imagen Decorativa */}
      <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
        <div className="absolute inset-0 bg-viper opacity-20 blur-[100px] rounded-full"></div>
        <img 
          src={heroImg} 
          alt="Dashboard de Viper" 
          className="relative z-10 w-full object-contain drop-shadow-2xl"
        />
      </div>

    </section>
  )
}