import React from 'react';
import { toast } from 'react-toastify';

import firebase from '../../services/firebaseConnection';
import stateRecipients from './statateRecipient';
import './email.css'

const EmailLink = ({ apr, id, logSistem }) => {
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
    await firebase.firestore().collection('aprs-producao')
      .doc(id)
      .update({
        status: 'Enviado',
        data_alteracao: new Date()
      })
      .then(() => {
        toast.success('Status apr atualizado com sucesso!');
        logSistem('APR enviada para a área responsável', id)
      })
      .catch((error) => {
        toast.error('Erro ao atualizar status da apr:', error);
        console.log('Erro ao atualizar status da apr:', error);
      });
  }

  return (
    <div className='emails'>
      <p>
        Clique no link abaixo para abrir seu cliente de e-mail:
      </p>
      <a href={mailtoLink}>Enviar E-mail</a>
      <a onClick={() => updateAPR(id)}>Atualizar Status</a>
    </div>
  );
};

export default EmailLink;
