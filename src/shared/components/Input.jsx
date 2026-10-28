import { CLASES_CAMPO, CLASES_FECHA, claseBorde } from '../utils/campo'

const TIPOS_DE_FECHA = ['date', 'time', 'datetime-local', 'month', 'week']

// Campo de texto. `error` (true/false) lo resalta en rojo; el mensaje lo muestra FormField.
// Los campos de fecha y hora llevan CLASES_FECHA: en el celular el navegador los dibuja con un ancho propio y se salen del formulario.
export default function Input({ error = false, className = '', ...resto }) {
  const esFecha = TIPOS_DE_FECHA.includes(resto.type)
  return (
    <input
      aria-invalid={error || undefined}
      className={`${CLASES_CAMPO} ${esFecha ? CLASES_FECHA : ''} ${claseBorde(error)} ${className}`}
      {...resto}
    />
  )
}