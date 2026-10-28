// Clases compartidas por Input y Select
export const CLASES_CAMPO =
  'w-full min-w-0 max-w-full bg-fondo text-texto placeholder:text-texto-suave border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export const claseBorde = (error) =>
  error ? 'border-error focus:border-error' : 'border-gray-800 focus:border-viper'

// Campos de fecha y hora: sin el aspecto nativo (que en iOS y Android les da un ancho propio y los saca del formulario), con la
// misma altura que los demás campos y el valor pegado a la izquierda
export const CLASES_FECHA =
  'appearance-none min-h-[2.875rem] block [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-w-0'