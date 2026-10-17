// Nota con ícono de información al pie de una tarjeta.
export default function Nota({ children }) {
  return (
    <p className="flex items-start gap-2 text-texto-suave text-xs">
      <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      </svg>
      {children}
    </p>
  )
}