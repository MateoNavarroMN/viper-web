// Colores de cada estado de una franja de cancha. Los comparten la grilla de «Programar partido» y la del calendario.
export const ESTILOS = {
  libre: 'border border-dashed border-gray-700 bg-fondo text-texto-suave hover:border-viper hover:text-viper cursor-pointer',
  noentra: 'border border-gray-800/60 bg-fondo/40 text-gray-600',
  alquiler: 'border border-info/40 bg-info/15 text-info',
  fija: 'border border-violeta/40 bg-violeta/15 text-violeta',
  torneo: 'border border-viper/40 bg-viper/10 text-viper',
  actual: 'border border-dashed border-viper bg-viper/10 text-viper cursor-pointer',
  participante: 'border border-error/40 bg-error/10 text-error',
  seleccionada: 'border border-advertencia bg-advertencia/20 text-advertencia',
}