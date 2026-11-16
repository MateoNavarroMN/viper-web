import BuscarJugadorBase from '../../../../shared/components/BuscarJugador'

// La búsqueda de jugadores es compartida (shared); acá solo se le dice qué mostrar cuando no existe el jugador
export default function BuscarJugador(props) {
  return <BuscarJugadorBase {...props} sinResultados={{ detalle: 'Para ser socio, primero tiene que crear su cuenta.' }} />
}