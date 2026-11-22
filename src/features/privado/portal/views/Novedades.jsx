import { useState } from 'react'
import { Link } from 'react-router-dom'
import BloquePortal from '../components/BloquePortal'
import DetalleNovedad from '../components/DetalleNovedad'
import { ListaNovedades } from '../components/Cartelera'
import { usePortal } from '../usePortal'

// Todas las novedades de la cartelera (hasta las 50 más recientes), del comunicado más nuevo al más viejo.
export default function Novedades() {
  const portal = usePortal('/portal/comunicados?limite=50')
  const [abierto, setAbierto] = useState(null)
  const { datos } = portal

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/portal/inicio" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver al inicio
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Novedades del club</h1>
        <p className="text-texto-suave text-sm mt-1">Los avisos oficiales, del más reciente al más antiguo</p>
      </div>
      <BloquePortal titulo="Cartelera" estado={portal} vacio={datos?.comunicados.length === 0 ? 'Por ahora no hay novedades del club.' : null}>
        {datos && <ListaNovedades comunicados={datos.comunicados} onAbrir={setAbierto} />}
      </BloquePortal>
      {abierto && <DetalleNovedad id={abierto} onCerrar={() => setAbierto(null)} />}
    </div>
  )
}