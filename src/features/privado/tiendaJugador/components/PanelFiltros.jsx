import { useState } from 'react'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import { FILTROS_VACIOS, precioParaCampo, revisarPrecios } from '../tiendaJugador'
import CamposFiltro from './CamposFiltro'

// Panel «Filtros y orden» del celular. Trabaja con una copia: nada cambia en la lista hasta tocar «Aplicar».
// Se monta solo mientras está abierto, así la copia siempre arranca con los filtros que están aplicados.
export default function PanelFiltros({ abierto, filtros, onAplicar, onCerrar }) {
  if (!abierto) return null
  return <Contenido filtros={filtros} onAplicar={onAplicar} onCerrar={onCerrar} />
}

function Contenido({ filtros, onAplicar, onCerrar }) {
  const [borrador, setBorrador] = useState({ categoria: filtros.categoria, orden: filtros.orden })
  const [textoMin, setTextoMin] = useState(precioParaCampo(filtros.precioMin))
  const [textoMax, setTextoMax] = useState(precioParaCampo(filtros.precioMax))
  const [error, setError] = useState(null)

  const aplicar = () => {
    const precios = revisarPrecios(textoMin, textoMax)
    if (precios.error) return setError(precios.error)
    onAplicar({ ...filtros, categoria: borrador.categoria, orden: borrador.orden, precioMin: precios.min, precioMax: precios.max })
  }
  const limpiar = () => {
    setBorrador({ categoria: FILTROS_VACIOS.categoria, orden: FILTROS_VACIOS.orden })
    setTextoMin('')
    setTextoMax('')
    setError(null)
  }

  return (
    <BottomSheet abierto titulo="Filtros y orden" onCerrar={onCerrar}>
      <div className="flex flex-col gap-5">
        <CamposFiltro
          prefijo="hoja"
          categoria={borrador.categoria}
          orden={borrador.orden}
          textoMin={textoMin}
          textoMax={textoMax}
          error={error}
          onCategoria={(categoria) => setBorrador((b) => ({ ...b, categoria }))}
          onOrden={(orden) => setBorrador((b) => ({ ...b, orden }))}
          onMin={(t) => { setTextoMin(t); setError(null) }}
          onMax={(t) => { setTextoMax(t); setError(null) }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variante="secundario" onClick={limpiar}>Limpiar</Button>
          <Button onClick={aplicar}>Aplicar</Button>
        </div>
      </div>
    </BottomSheet>
  )
}