import React from 'react';
import { toast } from 'react-toastify';

import firebase from '../../services/firebaseConnection';
import stateRecipients from './statateRecipient';
import './email.css'

const EmailLink = ({ apr, id, logSistem }) => {
  const base = 'aprs-producao'

  var cc = 'Pedro.Oliveira@telefonica.com; priscila.mirancos.ext@telefonica.com'

  const recipient = stateRecipients[apr.site_id.Estado] || "Destinatário padrão";

  const subject = `APR Vivo Digital - ${apr.site_id.Sigla} - ${apr.site_id.Cidade} - ${apr.site_id.Estado}`;

  const body = `
Identificamos inconformidade(s) em um site da sua região.

Nome do Site: ${apr.site_id.Nome}
Sigla do Site: ${apr.site_id.Sigla}
Municipio: ${apr.site_id.Cidade}
UF: ${apr.site_id.Estado}
  
Favor acessar o link abaixo, onde será direcionado para a APR, a fim de conhecer as inconformidade(s) identificadas pelo time da Segurança Patrimonial, bem como será necessário que aponte as ações a serem tomadas dentro do que foi recomendado para a efetiva proteção do referido patrimônio.

${'https://seguranca-patrimonial-385514.web.app/open/' + id}

Grato pela parceria!!

APR Vivo Digital`;

  const encodedBody = encodeURIComponent(body);

  const mailtoLink = `mailto:${recipient}?cc=${cc}&subject=${encodeURIComponent(
    subject
  )}&body=${encodedBody}`;

  async function updateAPR(id) {
    await firebase.firestore().collection(base)
      .doc(id)
      .update({
        status: 'Revisado',
        data_alteracao: new Date()
      })
      .then(() => {
        toast.success('Status apr atualizado com sucesso!');
        logSistem('APR Revisada', id)
      })
      .catch((error) => {
        toast.error('Erro ao atualizar status da apr:', error);
        console.log('Erro ao atualizar status da apr:', error);
      });
  }

  return apr.status === 'Em Aberto' && (
    <div className='emails'>
      <p>
        Clique no botão abaixo para confirmar que APR esta corretamente preechida:
      </p>
      <a onClick={() => updateAPR(id)}>Confirmar Revisão</a>
    </div>
  )
};

export default EmailLink;
