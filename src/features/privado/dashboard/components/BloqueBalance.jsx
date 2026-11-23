// Marco de un bloque del balance: título arriba y el contenido. `derecha` es un texto o control opcional a la derecha del título.
export default function BloqueBalance({ titulo, derecha, children, className = '' }) {
  return (
    <section aria-label={titulo} className={`bg-panel border border-gray-800 rounded-2xl overflow-hidden min-w-0 ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4 border-b border-gray-800">
        <h2 className="font-outfit text-base font-bold">{titulo}</h2>
        {derecha}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}