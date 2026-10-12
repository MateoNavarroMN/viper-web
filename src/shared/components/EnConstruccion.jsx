// Pantalla provisoria para las rutas privadas que todavía no tienen su vista real.
// Cada tarea del plan reemplaza la suya por la pantalla definitiva.
export default function EnConstruccion({ titulo }) {
  return (
    <main className="min-h-screen bg-fondo flex items-center justify-center px-4">
      <div className="bg-panel rounded-2xl p-8 text-center max-w-md w-full">
        <h1 className="font-outfit text-2xl font-bold text-texto">{titulo}</h1>
        <p className="mt-2 text-texto-suave">Esta pantalla está en construcción.</p>
      </div>
    </main>
  )
}