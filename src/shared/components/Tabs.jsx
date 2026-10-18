// pestanas: [{ clave, titulo, deshabilitada? }]. Controlado desde afuera:
//   <Tabs pestanas={[...]} activa={pestana} onCambiar={setPestana} />
export default function Tabs({ pestanas, activa, onCambiar }) {
  return (
    <div className="border-b border-gray-800">
      <div role="tablist" className="flex gap-6 -mb-px overflow-x-auto">
        {pestanas.map(({ clave, titulo, deshabilitada = false }) => {
          const seleccionada = clave === activa
          return (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              disabled={deshabilitada}
              title={deshabilitada ? 'Próximamente' : undefined}
              onClick={() => onCambiar(clave)}
              className={`font-outfit font-semibold whitespace-nowrap pb-3 border-b-2 transition-colors ${seleccionada
                  ? 'text-viper border-viper cursor-pointer'
                  : deshabilitada
                    ? 'text-gray-600 border-transparent cursor-not-allowed'
                    : 'text-texto-suave border-transparent hover:text-viper cursor-pointer'
                }`}
            >
              {titulo}
            </button>
          )
        })}
      </div>
    </div>
  )
}