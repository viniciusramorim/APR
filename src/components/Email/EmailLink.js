import React from 'react';
import { toast } from 'react-toastify';

import firebase from '../../services/firebaseConnection';
import stateRecipients from './statateRecipient';
import './email.css'

const EmailLink = ({ apr, id, logSistem }) => {
  const base = 'aprs-producao'
  var emails = stateRecipients[apr.site_id.Estado][apr.site_id.Cidade.toUpperCase()]

  if (emails !== undefined && emails.length > 1) {
    emails = emails.toString().replace(',',';')
  }

  var cc = 'Pedro.Oliveira@telefonica.com; priscila.mirancos.ext@telefonica.com'

  const recipient = emails || "Destinatário padrão";

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
        status: 'Enviado',
        data_alteracao: new Date()
      })
      .then(() => {
        toast.success('Status apr atualizado com sucesso!');
        logSistem('APR Enviada', id)
      })
      .catch((error) => {
        toast.error('Erro ao atualizar status da apr:', error);
        console.log('Erro ao atualizar status da apr:', error);
      });
  }

  return (
    <div className='emails'>
      <p>
        Siga o seguintes passos: <br/><br/>
        1 - Clique em "Enviar E-mail" para enviar da sua caixa de e-mail aos destinatarios responsaveis. <br/>
        2 - Clique em confirmar Envio. <br/>
      </p>
      <a href={mailtoLink}>Enviar E-mail</a>
      <a onClick={() => updateAPR(id)}>Confirmar Envio</a>
    </div>
  )
};

export default EmailLink;
