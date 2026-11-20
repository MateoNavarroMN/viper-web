import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import { CATEGORIAS_TIENDA, OPCIONES_ORDEN } from '../tiendaJugador'

// Los filtros de la tienda (categoría, precio y orden). Se usa tal cual en la pantalla (escritorio) y en el panel del celular.
// `prefijo` evita ids repetidos cuando están los dos montados. `onPrecioListo` avisa que se terminó de escribir un precio
// (al salir del campo o con Enter): en el panel del celular no se pasa, porque ahí se aplica todo junto con el botón.
export default function CamposFiltro({ prefijo, categoria, orden, textoMin, textoMax, error, onCategoria, onOrden, onMin, onMax, onPrecioListo }) {
  const alTeclear = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onPrecioListo?.()
    }
  }
  return (
    <>
      <div role="group" aria-label="Filtrar por categoría" className="grid grid-cols-3 gap-1 bg-fondo border border-gray-800 rounded-lg p-1">
        {CATEGORIAS_TIENDA.map(({ valor, texto }) => (
          <button
            key={valor}
            type="button"
            aria-pressed={categoria === valor}
            onClick={() => onCategoria(valor)}
            className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${categoria === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Precio mínimo" id={`${prefijo}-min`} error={error?.campo === 'min' ? error.texto : undefined}>
          <Input id={`${prefijo}-min`} inputMode="decimal" placeholder="$ 0" maxLength={12} value={textoMin} error={error?.campo === 'min'} onChange={(e) => onMin(e.target.value)} onBlur={onPrecioListo} onKeyDown={alTeclear} />
        </FormField>
        <FormField label="Precio máximo" id={`${prefijo}-max`} error={error?.campo === 'max' ? error.texto : undefined}>
          <Input id={`${prefijo}-max`} inputMode="decimal" placeholder="Sin límite" maxLength={12} value={textoMax} error={error?.campo === 'max'} onChange={(e) => onMax(e.target.value)} onBlur={onPrecioListo} onKeyDown={alTeclear} />
        </FormField>
      </div>

      <FormField label="Ordenar por" id={`${prefijo}-orden`}>
        <Select id={`${prefijo}-orden`} opciones={OPCIONES_ORDEN} value={orden} onChange={(e) => onOrden(e.target.value)} />
      </FormField>
    </>
  )
}