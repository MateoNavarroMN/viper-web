// DNI con puntos de miles: 38221045 → 38.221.045
export const dniConPuntos = (dni) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')