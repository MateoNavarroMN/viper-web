import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import FormularioComunicado from '../components/FormularioComunicado'

const LISTADO = '/gestion/comunicados'

// Editar un borrador (solo Administrador). Un comunicado publicado o retirado no se edita: si hay que corregirlo, se retira y se redacta uno nuevo.
export default function EditarComunicado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const [estado, setEstado] = useState({ cargando: true, comunicado: null, noExiste: false, error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/comunicados/${id}`)
      .then((r) => vigente && setEstado({ cargando: false, comunicado: r.comunicado, noExiste: false, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, comunicado: null, noExiste: e.status === 404, error: e.status === 404 ? null : e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const { cargando, comunicado, noExiste, error } = estado

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <Link to={LISTADO} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a comunicados
      </Link>

      {cargando ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando el comunicado" /></div>
      ) : noExiste ? (
        <Alert variante="error" titulo="Comunicado no encontrado">
          No existe un comunicado con ese enlace.{' '}
          <Button variante="neutro" onClick={() => navigate(LISTADO)} className="ml-2">Volver al listado</Button>
        </Alert>
      ) : error ? (
        <Alert variante="error" titulo="No pudimos cargar el comunicado">
          {error}{' '}
          <Button variante="neutro" onClick={() => { setEstado((p) => ({ ...p, cargando: true })); setIntento((n) => n + 1) }} className="ml-2">Reintentar</Button>
        </Alert>
      ) : comunicado.estado !== 'BORRADOR' ? (
        <Alert variante="advertencia" titulo="Este comunicado ya no se puede editar">
          Solo se puede editar un borrador. Retirá el comunicado y redactá uno nuevo.{' '}
          <Link to={`${LISTADO}/${id}`} className="underline font-semibold">Ver el comunicado</Link>
        </Alert>
      ) : (
        <>
          <div>
            <h1 className="font-outfit text-[28px] font-bold">Editar borrador</h1>
            <p className="text-texto-suave text-sm mt-1">Podés guardarlo de nuevo como borrador o publicarlo</p>
          </div>
          <FormularioComunicado
            inicial={{ titulo: comunicado.titulo, mensaje: comunicado.mensaje, alcance: comunicado.alcance }}
            guardar={(datos) => put(`/comunicados/${id}`, datos)}
            onTerminar={(accion, respuesta) => {
              mostrarToast(respuesta.mensaje)
              navigate(LISTADO, { replace: true })
            }}
            onCancelar={() => navigate(LISTADO)}
          />
        </>
      )}
    </div>
  )
}