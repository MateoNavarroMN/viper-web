import { useState } from 'react'

// Foto del producto. Si no tiene imagen (o no se puede cargar) muestra una imagen genérica.
// Como el nombre ya está escrito al lado, la imagen es decorativa.
export default function ImagenProducto({ url, className = 'w-12 h-12' }) {
  const [fallo, setFallo] = useState(false)

  if (!url || fallo) {
    return (
      <div aria-hidden="true" className={`${className} shrink-0 rounded-lg bg-fondo border border-gray-800 flex items-center justify-center text-texto-suave`}>
        <svg width="45%" height="45%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
    )
  }
  return <img src={url} alt="" loading="lazy" onError={() => setFallo(true)} className={`${className} shrink-0 rounded-lg object-cover bg-fondo border border-gray-800`} />
}