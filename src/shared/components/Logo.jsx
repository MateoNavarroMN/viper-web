import horizontal from '../../assets/logo/viper-logotipo-horizontal-verde.svg'
import vertical from '../../assets/logo/viper-logotipo-vertical-verde.svg'
import simbolo from '../../assets/logo/viper-simbolo-verde.svg'

const VERSIONES = { horizontal, vertical, simbolo }

export default function Logo({ variante = 'horizontal', className = 'h-12' }) {
  return <img src={VERSIONES[variante]} alt="Viper" draggable={false} className={`w-auto select-none ${className}`} />
}