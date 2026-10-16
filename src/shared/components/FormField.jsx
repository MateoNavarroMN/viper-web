export default function FormField({ label, id, error, ayuda, requerido = false, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] text-texto-suave">
        {label}
        {requerido && (
          <span className="text-viper ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-error text-xs">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-texto-suave text-xs">{ayuda}</p>
      )}
    </div>
  )
}