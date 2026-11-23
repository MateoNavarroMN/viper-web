import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import { OPCIONES_RUBRO } from '../dashboard'

// Filtros del Dashboard: rango de fechas y rubro. Cada cambio se aplica al instante (el padre decide si el rango es válido).
// `error` marca en rojo las dos fechas cuando el rango no sirve (12a). `prefijo` evita ids repetidos si el formulario se muestra dos veces.
export default function FiltrosDashboard({ campos, onCambiar, error, prefijo = 'dash' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FormField label="Desde" id={`${prefijo}-desde`}>
        <Input id={`${prefijo}-desde`} type="date" value={campos.desde} error={Boolean(error)} onChange={(e) => onCambiar({ desde: e.target.value })} />
      </FormField>
      <FormField label="Hasta" id={`${prefijo}-hasta`}>
        <Input id={`${prefijo}-hasta`} type="date" value={campos.hasta} error={Boolean(error)} onChange={(e) => onCambiar({ hasta: e.target.value })} />
      </FormField>
      <FormField label="Rubro" id={`${prefijo}-rubro`}>
        <Select id={`${prefijo}-rubro`} opciones={OPCIONES_RUBRO} value={campos.rubro} onChange={(e) => onCambiar({ rubro: e.target.value })} />
      </FormField>
    </div>
  )
}