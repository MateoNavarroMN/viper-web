import { useConsulta } from '../useConsulta'
import { dinero } from '../dashboard'
import BloqueOperativo, { AvisoDeBloque, Dato } from './BloqueOperativo'

function Cifra({ valor, etiqueta, tono = 'text-texto' }) {
  return (
    <div>
      <p className={`font-outfit text-3xl font-bold tabular-nums ${tono}`}>{valor}</p>
      <p className="text-sm text-texto-suave">{etiqueta}</p>
    </div>
  )
}

// Situación de los socios activos: al día y adeudados, cuotas vencidas y monto adeudado.
export default function BloqueSocios() {
  const consulta = useConsulta('/dashboard/socios')
  return (
    <BloqueOperativo titulo="Socios y cuotas" ruta="/gestion/socios" consulta={consulta}>
      {(d) => (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Cifra valor={d.activos} etiqueta="Activos" />
            <Cifra valor={d.alDia} etiqueta="Al día" tono="text-exito" />
            <Cifra valor={d.adeudados} etiqueta="Adeudado" tono={d.adeudados > 0 ? 'text-error' : 'text-texto'} />
          </div>
          {/* 8a: sin socios activos, los indicadores en cero y un aviso */}
          {d.sinSociosActivos ? (
            <AvisoDeBloque>No hay socios activos</AvisoDeBloque>
          ) : (
            <>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex" role="presentation">
                <div className="h-full bg-exito" style={{ width: `${(d.alDia / d.activos) * 100}%` }} />
                <div className="h-full bg-error" style={{ width: `${(d.adeudados / d.activos) * 100}%` }} />
              </div>
              <div className="border-t border-gray-800 pt-4 flex flex-col gap-3">
                <Dato etiqueta="Cuotas vencidas" valor={d.cuotasVencidas} />
                <Dato etiqueta="Monto adeudado" valor={dinero(d.montoAdeudado)} tono={d.montoAdeudado > 0 ? 'text-error' : 'text-texto'} />
              </div>
            </>
          )}
        </>
      )}
    </BloqueOperativo>
  )
}