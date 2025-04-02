import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import './email.scss';

const EmailLink = ({ apr, id, logSistem }) => {
  const [emails, setEmails] = useState('');
  const docRef = `${apr.site_id.Estado}-${apr.site_id.Cidade.toUpperCase()}`;
  const base = 'aprs-producao';

  useEffect(() => {
    const loadContact = async () => {
      try {
        const doc = await firebase.firestore().collection('contact_email').doc(docRef).get();
        if (doc.exists) {
          const emailList = doc.data().email_patrimonial?.toString().replace(',', ';') || '';
          setEmails(emailList);
        } else {
          console.warn('Documento de e-mail não encontrado:', docRef);
        }
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
      }
    };

    loadContact();
  }, [docRef]);


  const sendEmail = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const emailContent = {
      remetente: "gestao.qualid.seg.br@telefonica.com",
      assunto: `APR Digital - ${apr.site_id.Sigla} - ${apr.site_id.Cidade} - ${apr.site_id.Estado}`,
      destinatario: emails,
      texto: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      <style>
        body {
          font-family: Vivo Type;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          border-radius:8px;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius:9px;
          box-shadow: rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;
        }
        .header {
          background-color: #1976d2;
          font-family: Vivo Type!important;
          color: #ffffff;
          padding: 10px 0;
          text-align: center;
          border-radius:8px;
        }
        .header h2 {
          font-size:16px;
        }
        .content {
          margin: 20px 0;
          padding:10px;
          box-shadow:none;
        }
        .content p {
          line-height: 15px;
        }
        .button {
          font-family: Vivo Type;
          padding:8px 30px;
          background:#1976d2;
          border-radius:7px;
          color:#fff;
          width:100%;
        }
        .footer {
          padding:20px;
          text-align: center;
          font-size: 12px;
          color: #000;
          background-color:#c3c3c3;
          margin-top: 20px;
        }
      </style>
      </head>
      <body>
      <div class="container">
        <div class="header">
        <span>APR Digital</span>
          <h2>
          Olá,<br/>​
          👨‍💻 Identificamos inconformidade(s) em um site da sua região ​👨‍💻
          </h2>
        </div>
        <div class="content">
        <p><strong>ID APR:</strong> ${apr.apr_id}</p>
        <p><strong>Nome do Site:</strong> ${apr.site_id.Nome}</p>
        <p><strong>Sigla do Site:</strong> ${apr.site_id.Sigla}</p>
        <p><strong>Municipio:</strong> ${apr.site_id.Cidade}</p>
        <p><strong>UF:</strong> ${apr.site_id.Estado}</p>
        <p>Favor acessar o link abaixo para verificar as inconformidades identificadas pelo time da Segurança Patrimonial. 
        Será necessário apontar as ações a serem tomadas conforme recomendado para a efetiva proteção do patrimônio.</p>
        <p>
        Link para APR: <br/>​
        <a href="${'https://seguranca-patrimonial-385514.web.app/open/' + id}">${'https://seguranca-patrimonial-385514.web.app/open/' + id}</a>
        </p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.<br> © Todos os Direitos Reservados</p>
        </div>
      </div>
      </body>
      </html>
      `,
    };

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(emailContent),
    };

    try {
      console.log("Tentando enviar o e-mail...");
      const response = await fetch(
        "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail",
        requestOptions
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP! status: ${response.status}, mensagem: ${errorText}`
        );
      }

      const result = await response.text();
      console.log("E-mail enviado com sucesso. Resposta:", result);
    } catch (error) {
      console.error("Detalhes do erro:", error);
      alert(`Erro ao enviar o e-mail: ${error.message}`);
    }
  };


  return (
    <div className="emails">
      <p>
        Siga os seguintes passos: <br /><br />
        1 - Clique em <strong>"Enviar E-mail"</strong> para abrir sua caixa de e-mail com os destinatários.<br />
        2 - Após o envio, clique em <strong>"Confirmar Envio"</strong>.<br />
      </p>

      <button onClick={sendEmail} className="confirm-button">Confirmar Envio</button>
    </div>
  );
};

export default EmailLink;
