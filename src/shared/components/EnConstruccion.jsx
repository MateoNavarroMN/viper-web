// Pantalla provisoria para las rutas privadas que todavía no tienen su vista real.
// Va dentro del AppLayout (M1-FE-04); cada tarea del plan reemplaza la suya por la pantalla definitiva.
export default function EnConstruccion({ titulo }) {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Glow ambiental */}
      <div className="absolute w-72 h-72 bg-viper opacity-20 blur-[60px] lg:blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 bg-panel border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center">
        <div className="w-12 h-12 bg-fondo rounded-lg border border-gray-700 flex items-center justify-center mx-auto mb-6">
          <svg
            className="text-viper drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <h1 className="font-outfit text-3xl font-bold mb-3 text-balance">{titulo}</h1>
        <p className="text-texto-suave leading-relaxed">
          Estamos armando esta pantalla. <span className="text-viper">Pronto</span> la vas a poder usar.
        </p>
      </div>
    </div>
  )
}