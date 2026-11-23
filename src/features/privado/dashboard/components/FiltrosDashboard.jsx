import CampoFecha from '../../../../shared/components/CampoFecha'
import FormField from '../../../../shared/components/FormField'
import Select from '../../../../shared/components/Select'
import { OPCIONES_RUBRO } from '../dashboard'

// Filtros del Dashboard: rango de fechas y rubro. Cada cambio se aplica al instante (el padre decide si el rango es válido).
// Las fechas se escriben en formato argentino (DD/MM/AAAA) con un calendario para elegirlas.
// `error` marca en rojo las dos fechas cuando el rango no sirve (12a). `prefijo` evita ids repetidos si el formulario se muestra dos veces.
export default function FiltrosDashboard({ campos, onCambiar, error, prefijo = 'dash' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FormField label="Desde" id={`${prefijo}-desde`}>
        <CampoFecha id={`${prefijo}-desde`} valor={campos.desde} error={Boolean(error)} onChange={(desde) => onCambiar({ desde })} />
      </FormField>
      <FormField label="Hasta" id={`${prefijo}-hasta`}>
        <CampoFecha id={`${prefijo}-hasta`} valor={campos.hasta} error={Boolean(error)} onChange={(hasta) => onCambiar({ hasta })} />
      </FormField>
      <FormField label="Rubro" id={`${prefijo}-rubro`}>
        <Select id={`${prefijo}-rubro`} opciones={OPCIONES_RUBRO} value={campos.rubro} onChange={(e) => onCambiar({ rubro: e.target.value })} />
      </FormField>
    </div>
  )
}