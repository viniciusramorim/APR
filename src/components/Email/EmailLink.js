import React, { useState, useEffect, Fragment } from 'react';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel, Typography } from '@mui/material';
import './email.scss';
import { useHistory } from 'react-router-dom';

const EmailLink = ({ apr, id, logSistem, setApr }) => {
  const history = useHistory();
  const [emails, setEmails] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [hasEmailToSend, setHasEmailToSend] = useState(true);
  const [emailTypes, setEmailTypes] = useState([]); // Armazena quais tipos de e-mail carregar

  const docRef = `${apr.site_id.Estado}-${apr.site_id.Cidade.toUpperCase()}`;

  // Carregar contatos apenas se houver e-mails necessários
  useEffect(() => {
    if (emailTypes.length === 0) return;

    const loadContact = async () => {
      try {
        const doc = await firebase.firestore().collection('contact_email').doc(docRef).get();
        if (doc.exists) {
          const data = doc.data();

          // Filtra apenas os e-mails que foram solicitados por verifyQuestions
          const emailFields = [];
          if (emailTypes.includes('oem') && data.email_oem) emailFields.push(data.email_oem);
          if (emailTypes.includes('CMC') && data.email_patrimonial) emailFields.push(data.email_patrimonial);
          if (emailTypes.includes('Predial') && data.email_predial) emailFields.push(data.email_predial);

          // Unindo os e-mails em uma string única, removendo espaços extras e duplicatas
          const allEmails = [...new Set(emailFields.join(';').replace(/\s+/g, '').split(';'))].join(';');

          if (allEmails) {
            setEmails(allEmails);
          } else {
            console.warn(`Nenhum e-mail encontrado para ${docRef}`);
          }
        } else {
          console.warn(`Documento de e-mail não encontrado: ${docRef}`);
        }
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
      }
    };

    loadContact();
  }, [docRef, emailTypes]);


  // Verificar perguntas antes de abrir o modal
  const handleOpenDialog = () => {
    const foundEmailTypes = new Set();

    apr.checklist.forEach((area) => {
      area[1].forEach((question) => {
        if (question.resp !== "" && question.resp !== "N/A") {
          if (question.resp !== question.respGabarito && question.openPA === true) {
            if (question.areaResposavel.includes("oem")) foundEmailTypes.add("oem");
            if (question.areaResposavel.includes("CMC")) foundEmailTypes.add("CMC");
            if (question.areaResposavel.includes("Predial")) foundEmailTypes.add("Predial");
          }
        }
      });
    });

    const emailTypesArray = [...foundEmailTypes];
    setEmailTypes(emailTypesArray);
    setHasEmailToSend(emailTypesArray.length > 0);
    setOpenDialog(true);
  };

  const sendEmail = async () => {
    if (!agreeTerms) {
      toast.warning("Você precisa concordar com os termos antes de enviar o e-mail.");
      return;
    }

    setAgreeTerms(false);

    const emailContent = {
      remetente: "aprdigital.seg.br@telefonica.com",
      assunto: `APR_Digital - ${apr.site_id.Sigla} - ${apr.site_id.Cidade} - ${apr.site_id.Estado}`,
      destinatario: emails.split(','),
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

    try {
      const response = await fetch(
        "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContent),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      // Atualizar status da APR no Firestore
      await firebase.firestore().collection('aprs-producao').doc(id).update({
        status: "Enviado",
        data_envio_email: firebase.firestore.FieldValue.serverTimestamp(),
        terms: agreeTerms
      })

      logSistem('APR revisada e enviado por e-mail', id, emails)

      setApr({
        ...apr,
        status: "Enviado"
      })

      toast.success("E-mail enviado com sucesso e APR atualizada!");
      // history.push('/aprs')
      setOpenDialog(false);
    } catch (error) {
      toast.error(`Erro ao enviar o e-mail: ${error.message}`);
    }
  };

  const revisado = async () => {
    if (!agreeTerms) {
      toast.warning("Você precisa concordar com os termos antes de enviar o e-mail.");
      return;
    }

    setAgreeTerms(false);

    try {
      // Atualizar status da APR no Firestore
      await firebase.firestore().collection('aprs-producao').doc(id).update({
        status: "Revisado",
        terms: agreeTerms
      })

      logSistem('APR Revisada', id)

      setApr({
        ...apr,
        status: "Revisado"
      })

      toast.success("APR Revisada com sucesso!");
      setOpenDialog(false);
    } catch (error) {
      toast.error(`Erro ao revisar a APR: ${error.message}`);
    }
  };

  const concludeWithoutEmail = async () => {
    try {
      await firebase.firestore().collection('aprs-producao').doc(id).update({
        status: "Concluído",
        data_conclusao_sem_email: firebase.firestore.FieldValue.serverTimestamp(),
      });

      logSistem('APR revisada e concluída sem necessidade de e-mail', id);

      setApr({
        ...apr,
        status: "Concluído"
      });

      toast.success("APR concluída com sucesso, sem necessidade de envio de e-mail.");
      setOpenDialog(false);
    } catch (error) {
      toast.error(`Erro ao concluir a APR: ${error.message}`);
    }
  };

  return (
    <div className="emails">
      <Button variant="contained" color="primary" onClick={handleOpenDialog} fullWidth>
        Confirmar Revisão e Enviar E-mail
      </Button>

      {/* Dialog de confirmação */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {hasEmailToSend ? "Confirmar Revisão e Enviar E-mail" : "Confirmar Revisão"}
        </DialogTitle>

        <DialogContent>
          {hasEmailToSend ? (
            <>
              <Typography variant="body1"><strong>Destinatários:</strong></Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 1 }}>
                {emails}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label="Confirmo que os destinatários dos e-mails mencionados acima estão corretos e que a Análise Preventiva de Riscos (APR) já foi revisada e aprovada.."
                sx={{ mt: 2 }}
              />
            </>
          ) : (
            <Typography variant="body2">
              Nenhum e-mail precisa ser enviado para esta APR. Deseja apenas concluir o processo?
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancelar
          </Button>
          {hasEmailToSend ? (
            <Fragment>
              <Button onClick={revisado} color="primary" variant="contained" disabled={!agreeTerms}>
                Confirmar Revisão
              </Button>
              <Button onClick={sendEmail} color="primary" variant="contained" disabled={!agreeTerms}>
                Confirmar Revisão e Enviar E-mail
              </Button>
            </Fragment>
          ) : (
            <Button onClick={concludeWithoutEmail} color="primary" variant="contained">
              Concluir
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmailLink;
