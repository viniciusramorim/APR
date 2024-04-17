
import './loading.css';

import loading from '../../assets/loading.gif'

export default function ModalLoading({ carregamento, close }) {

  return (
    <div id='modalLoading' className="modalLoad">
      <div className="loading">
        <img src={loading} alt="Loading..." />
        <i>Carregando...</i>
        <i>{carregamento}</i>
      </div>
    </div>
  )
}