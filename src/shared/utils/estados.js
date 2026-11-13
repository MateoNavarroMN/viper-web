// Texto y color de cada estado (Anexo B del plan). Si aparece un estado nuevo, se agrega acá.
export const ESTADOS = {
  usuario: {
    ACTIVO: { texto: 'Activo', variante: 'exito' },
    BLOQUEADO: { texto: 'Bloqueado', variante: 'error' },
  },
  socio: {
    ACTIVO: { texto: 'Activo', variante: 'exito' },
    BAJA: { texto: 'Baja', variante: 'neutro' },
  },
  cuotasSocio: {
    AL_DIA: { texto: 'Al día', variante: 'exito' },
    ADEUDADO: { texto: 'Adeudado', variante: 'error' },
  },
  cuota: {
    PAGADA: { texto: 'Pagada', variante: 'exito' },
    PENDIENTE: { texto: 'Pendiente', variante: 'advertencia' },
    VENCIDA: { texto: 'Vencida', variante: 'error' },
  },
  torneo: {
    PLANIFICADO: { texto: 'Planificado', variante: 'neutro' },
    INSCRIPCIONES_ABIERTAS: { texto: 'Inscripciones abiertas', variante: 'exito' },
    INSCRIPCIONES_CERRADAS: { texto: 'Inscripciones cerradas', variante: 'advertencia' },
    EN_CURSO: { texto: 'En curso', variante: 'info' },
    FINALIZADO: { texto: 'Finalizado', variante: 'violeta' },
    ARCHIVADO: { texto: 'Archivado', variante: 'neutro' },
    CANCELADO: { texto: 'Cancelado', variante: 'error' },
  },
  inscripcion: {
    ACTIVA: { texto: 'Activa', variante: 'exito' },
    ANULADA: { texto: 'Anulada', variante: 'error' },
  },
  pago: {
    PENDIENTE: { texto: 'Pago pendiente', variante: 'advertencia' },
    PAGADO: { texto: 'Pagado', variante: 'exito' },
  },
  reserva: {
    PENDIENTE: { texto: 'Pendiente', variante: 'advertencia' },
    CONFIRMADA: { texto: 'Confirmada', variante: 'exito' },
    CANCELADA: { texto: 'Cancelada', variante: 'error' },
    EXPIRADA: { texto: 'Expirada', variante: 'neutro' },
  },
  partido: {
    PENDIENTE: { texto: 'Pendiente', variante: 'neutro' },
    PROGRAMADO: { texto: 'Programado', variante: 'info' },
    FINALIZADO: { texto: 'Finalizado', variante: 'exito' },
    WO: { texto: 'W.O.', variante: 'advertencia' },
  },
}