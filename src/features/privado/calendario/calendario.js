import { sumarDias } from '../torneos/torneos'

// Lógica del calendario del club. Las fechas son texto 'AAAA-MM-DD' y los meses 'AAAA-MM', para no correr un día por la zona horaria.

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const dos = (n) => String(n).padStart(2, '0')

// La fecha de hoy según el reloj del navegador
export const hoy = () => {
  const f = new Date()
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`
}

export const esMes = (texto) => /^\d{4}-(0[1-9]|1[0-2])$/.test(texto ?? '')
export const esDia = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto ?? '') && !Number.isNaN(Date.parse(`${texto}T00:00:00Z`))

export const mesDe = (fecha) => fecha.slice(0, 7)

// ('2026-12', 1) → '2027-01'
export const sumarMeses = (mes, n) => {
  const [anio, numero] = mes.split('-').map(Number)
  const total = anio * 12 + (numero - 1) + n
  return `${Math.floor(total / 12)}-${dos((total % 12) + 1)}`
}

// '2026-11' → 'Noviembre 2026'
export const nombreMes = (mes) => `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`

// Las semanas (lunes a domingo) que cubren el mes: [[7 fechas], ...]. Siempre entre 4 y 6.
export const semanasDelMes = (mes) => {
  const primero = `${mes}-01`
  const ultimo = sumarDias(`${sumarMeses(mes, 1)}-01`, -1)
  const diaSemana = new Date(`${primero}T00:00:00Z`).getUTCDay() // 0 = domingo
  const semanas = []
  for (let lunes = sumarDias(primero, -((diaSemana + 6) % 7)); lunes <= ultimo; lunes = sumarDias(lunes, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)))
  }
  return semanas
}

// El período que hay que pedirle a la API para dibujar el mes completo
export const periodoDe = (mes) => {
  const semanas = semanasDelMes(mes)
  return { desde: semanas[0][0], hasta: semanas.at(-1)[6] }
}

// Color de cada torneo en el calendario, según el orden en que llegan (la clase completa para que Tailwind la incluya)
const COLORES = ['bg-viper', 'bg-info', 'bg-violeta', 'bg-advertencia', 'bg-pink-400', 'bg-cyan-400', 'bg-orange-500', 'bg-lime-300', 'bg-rose-300', 'bg-teal-600']
export const colorDeTorneo = (indice) => COLORES[indice % COLORES.length]

export const torneoEnElDia = (torneo, dia) => torneo.fechaInicio <= dia && dia <= torneo.fechaFin

// Los partidos de un día, por hora
export const partidosDelDia = (partidos, dia) =>
  partidos.filter((p) => p.fecha === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.cancha.localeCompare(b.cancha))

// 'Díaz vs Fernández' o 'A confirmar' mientras falta un rival
export const rivalesDe = (partido) =>
  partido.local && partido.visitante ? `${partido.local} vs ${partido.visitante}` : 'Rivales a confirmar'