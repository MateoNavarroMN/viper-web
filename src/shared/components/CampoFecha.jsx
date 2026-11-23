import { useState } from 'react'
import { CLASES_CAMPO, claseBorde } from '../utils/campo'

// Campo de fecha en formato argentino (día/mes/año). El campo nativo (`type="date"`) muestra la fecha según el idioma del navegador o
// del sistema (en muchos equipos sale mes/día/año), así que acá se escribe a mano como DD/MM/AAAA, con las barras puestas solas, y
// además tiene un calendario para elegirla. Hacia afuera siempre habla en ISO («2026-11-25»), igual que `type="date"`.
//   valor    = fecha ISO o '' · onChange(iso) recibe la fecha ISO, o '' mientras esté incompleta o no exista
//   error    = true para marcar el campo en rojo (por ejemplo, un rango inválido)

// '2026-11-25' → '25/11/2026'
const aTexto = (iso) => (iso ? iso.split('-').reverse().join('/') : '')

// '25/11/2026' → '2026-11-25', o null si está incompleta o la fecha no existe (31/02/2026)
const aISO = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!m) return null
  const [, dia, mes, anio] = m
  const f = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)))
  const existe = f.getUTCFullYear() === Number(anio) && f.getUTCMonth() === Number(mes) - 1 && f.getUTCDate() === Number(dia)
  return existe ? `${anio}-${mes}-${dia}` : null
}

// Deja solo los dígitos (hasta 8) y pone las barras: «2511» → «25/11», «25112026» → «25/11/2026»
const enmascarar = (crudo) => {
  const n = crudo.replace(/\D/g, '').slice(0, 8)
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/')
}

export default function CampoFecha({ id, valor, onChange, error = false, disabled = false, ...resto }) {
  const [texto, setTexto] = useState(aTexto(valor))
  // Último valor que este campo informó: si `valor` cambia por otro motivo (limpiar filtros, primera carga), se reescribe el texto
  const [informado, setInformado] = useState(valor)
  if (valor !== informado) {
    setInformado(valor)
    setTexto(aTexto(valor))
  }

  const informar = (iso) => {
    setInformado(iso)
    onChange(iso)
  }
  const escribir = (e) => {
    const nuevo = enmascarar(e.target.value)
    setTexto(nuevo)
    informar(aISO(nuevo) ?? '')
  }
  const elegirEnCalendario = (e) => {
    setTexto(aTexto(e.target.value))
    informar(e.target.value)
  }

  const noExiste = texto.length === 10 && !aISO(texto)
  const conError = error || noExiste

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={texto}
          disabled={disabled}
          aria-invalid={conError || undefined}
          onChange={escribir}
          className={`${CLASES_CAMPO} ${claseBorde(conError)} pr-12 tabular-nums`}
          {...resto}
        />
        {/* El calendario nativo va encima del ícono, invisible: tocar el ícono abre el selector del sistema */}
        <span className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-texto-suave pointer-events-none" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </span>
        <input
          type="date"
          tabIndex={-1}
          aria-label="Elegir la fecha en el calendario"
          value={valor}
          disabled={disabled}
          onChange={elegirEnCalendario}
          className="absolute right-0 top-0 h-full w-11 opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
      </div>
      {noExiste && <p role="alert" className="text-error text-xs">Esa fecha no existe</p>}
    </div>
  )
}