import React, { useState } from 'react';
import Modal from 'react-modal';

import './justify.css'
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const JustificativaComponent = (item) => {
  const [motivo, setMotivo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInativo, setDataInativo] = useState('');

  const closeModal = () => {
    item.setModal(false);
  };

  function concluir() {
    if (motivo === '' || motivo === null) return toast.error("Selecione o motivo da justificativa.")
    if (descricao === '' || descricao === null) return toast.error("Descreva o motivo da justificativa.")
    if (motivo === 'Site Desativado' && (dataInativo === '' || dataInativo === null)) return toast.error("Coloque a data de desativação.")
      

    let justificativa = {
      motivo: motivo,
      desc: descricao,
      data_inativo: motivo === 'Site Desativado' ? dataInativo : ''
    }

    item.setJustificativa(justificativa)
    closeModal()
  }

  return (
    <Modal isOpen={item.openModal} onRequestClose={closeModal} ariaHideApp={false} className={'modalJustify'}>
      <div>
        <a onClick={closeModal}>
          <FiX size={10} />
        </a>
        <label>Exceção de execução da APR</label>
        <label>Motivo:
          <select defaultValue={''} onChange={(e) => setMotivo(e.target.value)}>
            <option value={''} disabled>Selecione o motivo...</option>
            <option value={'Site Desativado'}>Site Desativado</option>
            <option value={'Impedimento de Acesso'}>Impedimento de Acesso</option>
            <option value={'Falta de mão-de-obra momentânea'}>Falta de mão-de-obra momentânea</option>
            <option value={'Raio de atuação até 300km'}>Raio de atuação até 300km</option>
            <option value={'Raio de atuação superior a 700km'}>Raio de atuação superior a 700km</option>
            <option value={'Falta de recursos'}>Falta de recursos</option>
          </select>
        </label>
        <label style={{display: motivo === 'Site Desativado' ? 'block' : 'none'}}>
          Data Desativação:
          <input type='date' onChange={(e) => setDataInativo(e.target.value)}></input>
        </label>
        <label>Descrição:
          <textarea onChange={(e) => setDescricao(e.target.value)}></textarea>
        </label>
        <button onClick={() => concluir()}>Concluir</button>
      </div>
    </Modal>
  );
};

export default JustificativaComponent;
