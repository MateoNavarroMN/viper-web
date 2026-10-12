// Etiqueta + campo + mensaje de error en rojo. `id` tiene que coincidir con el `id` del Input/Select.
//   <FormField label="Correo" id="email" error={errores.email}>
//     <Input id="email" error={!!errores.email} ... />
//   </FormField>
export default function FormField({ label, id, error, ayuda, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-texto-suave text-sm">{ayuda}</p>
      )}
    </div>
  )
}