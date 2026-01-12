import { useState, useEffect, Fragment } from 'react';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel, Typography } from '@mui/material';
import './email.scss';

const EmailLink = ({ apr, id, logSistem, setApr }) => {
  const [emails, setEmails] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [hasEmailToSend, setHasEmailToSend] = useState(true);
  const [emailTypes, setEmailTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const docRef = `${apr.site_id.Estado}-${apr.site_id.Cidade.toUpperCase()}`;

  // Carregar contatos apenas se houver e-mails necessários
  useEffect(() => {
    if (emailTypes.length === 0) return;

    const loadContact = async () => {
      try {
        const doc = await firebase.firestore().collection('contact_email').doc(docRef).get();
        if (doc.exists) {
          const data = doc.data();
          const emailFields = [];

          // Filtra apenas os e-mails que foram solicitados
          if (emailTypes.includes('oem') && data.email_oem) emailFields.push(data.email_oem);
          if (emailTypes.includes('CMC') && data.email_patrimonial) emailFields.push(data.email_patrimonial);
          if (emailTypes.includes('Predial') && data.email_predial) emailFields.push(data.email_predial);
          if (emailTypes.includes('Logistica') && data.email_logistica) emailFields.push(data.email_logistica);

          // Unindo os e-mails em uma string única, removendo espaços extras e duplicatas
          const allEmails = [...new Set(emailFields.join(';').replace(/\s+/g, '').split(';'))].join(';');

          if (allEmails) {
            setEmails(allEmails);
          } else {
            console.warn(`Nenhum e-mail encontrado para ${docRef}`);
            setEmails('');
          }
        } else {
          console.warn(`Documento de e-mail não encontrado: ${docRef}`);
          setEmails('');
        }
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        setEmails('');
      }
    };

    loadContact();
  }, [docRef, emailTypes]);

  // Verificar perguntas antes de abrir o modal
  const handleOpenDialog = () => {
    const foundEmailTypes = new Set();
    let totalInconformidades = 0;

    console.log('=== INICIANDO VERIFICAÇÃO DE INCONFORMIDADES ===');
    
    apr.checklist.forEach((area, areaIndex) => {
      area[1].forEach((question, qIndex) => {
        // Verifica se existe resposta e se é diferente do gabarito
        const hasInconformity = question.resp && 
                               question.resp !== "N/A" && 
                               question.resp !== question.respGabarito;

        if (hasInconformity) {
          totalInconformidades++;
          console.log(`Inconformidade encontrada [Área ${areaIndex}, Questão ${qIndex}]:`, {
            pergunta: question.question || question.pergunta,
            resposta: question.resp,
            gabarito: question.respGabarito,
            areaResposavel: question.areaResposavel
          });

          // Se existe inconformidade, verifica se tem área responsável
          if (question.areaResposavel) {
            // Verifica se areaResposavel é array ou string
            const areas = Array.isArray(question.areaResposavel) 
              ? question.areaResposavel 
              : [question.areaResposavel];

            areas.forEach(area => {
              const areaLower = area.toLowerCase();
              if (areaLower.includes("oem")) foundEmailTypes.add("oem");
              if (areaLower.includes("cmc")) foundEmailTypes.add("CMC");
              if (areaLower.includes("predial")) foundEmailTypes.add("Predial");
              if (areaLower.includes("logistica")) foundEmailTypes.add("Logistica");
            });
          } else {
            // Se não tem área responsável definida, assume que precisa enviar email genérico
            console.warn('Inconformidade sem área responsável definida - adicionando CMC como padrão');
            foundEmailTypes.add("CMC");
          }
        }
      });
    });

    const emailTypesArray = [...foundEmailTypes];
    setEmailTypes(emailTypesArray);
    
    // Se tem pelo menos uma inconformidade, deve enviar email
    const shouldSendEmail = totalInconformidades > 0;
    setHasEmailToSend(shouldSendEmail);
    
    console.log('Total de inconformidades:', totalInconformidades);
    console.log('Tipos de email encontrados:', emailTypesArray);
    console.log('Deve enviar email?', shouldSendEmail);
    console.log('=== FIM DA VERIFICAÇÃO ===');
    
    setOpenDialog(true);
  };

  // const sendEmail = async () => {
  //   if (!agreeTerms) {
  //     toast.warning("Você precisa concordar com os termos antes de enviar o e-mail.");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     const emailContent = {
  //       remetente: "aprdigital.seg.br@telefonica.com",
  //       assunto: `APR_Digital - ${apr.site_id.Sigla} - ${apr.site_id.Cidade} - ${apr.site_id.Estado}`,
  //       destinatario: ['victor.blasques@telefonica.com'].join(","),
  //       texto: `
  //       <!DOCTYPE html>
  //       <html lang="pt-BR">
  //       <head>
  //       <meta charset="UTF-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title></title>
  //       <style>
  //         body {
  //           font-family: Vivo Type;
  //           margin: 0;
  //           padding: 0;
  //           background-color: #f4f4f4;
  //           border-radius:8px;
  //         }
  //         .container {
  //           width: 100%;
  //           max-width: 600px;
  //           margin: 0 auto;
  //           background-color: #fff;
  //           padding: 20px;
  //           border-radius:9px;
  //           box-shadow: rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;
  //         }
  //         .header {
  //           background-color: #1976d2;
  //           font-family: Vivo Type!important;
  //           color: #ffffff;
  //           padding: 10px 0;
  //           text-align: center;
  //           border-radius:8px;
  //         }
  //         .header h2 {
  //           font-size:16px;
  //         }
  //         .content {
  //           margin: 20px 0;
  //           padding:10px;
  //           box-shadow:none;
  //         }
  //         .content p {
  //           line-height: 15px;
  //         }
  //         .button {
  //           font-family: Vivo Type;
  //           padding:8px 30px;
  //           background:#1976d2;
  //           border-radius:7px;
  //           color:#fff;
  //           width:100%;
  //         }
  //         .footer {
  //           padding:20px;
  //           text-align: center;
  //           font-size: 12px;
  //           color: #000;
  //           background-color:#c3c3c3;
  //           margin-top: 20px;
  //         }
  //       </style>
  //       </head>
  //       <body>
  //       <div class="container">
  //         <div class="header">
  //         <span>APR Digital</span>
  //           <h2>
  //           Olá,<br/>​
  //           👨‍💻 Identificamos inconformidade(s) em um site da sua região ​👨‍💻
  //           </h2>
  //         </div>
  //         <div class="content">
  //         <p><strong>ID APR:</strong> ${apr.apr_id}</p>
  //         <p><strong>Nome do Site:</strong> ${apr.site_id.Nome}</p>
  //         <p><strong>Sigla do Site:</strong> ${apr.site_id.Sigla}</p>
  //         <p><strong>Municipio:</strong> ${apr.site_id.Cidade}</p>
  //         <p><strong>UF:</strong> ${apr.site_id.Estado}</p>
  //         <p>Favor acessar o link abaixo para verificar as inconformidades identificadas pelo time da Segurança Patrimonial. 
  //         Será necessário apontar as ações a serem tomadas conforme recomendado para a efetiva proteção do patrimônio.</p>
  //         </div>
  //         <div class="footer">
  //           <p>Este é um e-mail automático. Por favor, não responda.<br> © Todos os Direitos Reservados</p>
  //         </div>
  //       </div>
  //       </body>
  //       </html>
  //       `,
  //     };

  //     console.log(emailContent)

  //     const response = await fetch(
  //       "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail_APRDigital",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(emailContent),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Erro HTTP! status: ${response.status}`);
  //     }

  //     // Atualizar status da APR no Firestore
  //     await firebase.firestore().collection('aprs-producao').doc(id).update({
  //       status: "Em Aberto",
  //       data_envio_email: firebase.firestore.FieldValue.serverTimestamp(),
  //       terms: agreeTerms
  //     });

  //     logSistem('APR revisada e enviado por e-mail', id, emails);

  //     setApr({
  //       ...apr,
  //       status: "Em Aberto"
  //     });

  //     toast.success("E-mail enviado com sucesso e APR atualizada!");
  //     setOpenDialog(false);
  //     setAgreeTerms(false);
  //   } catch (error) {
  //     if (error.message === 'Erro HTTP! status: 500'){
  //       toast.error(`Limite de e-mail excedido, aguarde até próximo dia para realizar o envio!`);
  //     } else {
  //       toast.error(`Erro ao enviar o e-mail: ${error.message}`);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const sendEmail = async () => {
    if (!agreeTerms) {
      toast.warning("Você precisa concordar com os termos antes de enviar o e-mail.");
      return;
    }

    setIsLoading(true);

    try {
      const emailContent = {
        remetente: "aprdigital.seg.br@telefonica.com",
        assunto: `APR_Digital - ${apr.site_id.Sigla} - ${apr.site_id.Cidade} - ${apr.site_id.Estado}`,
        destinatario: emails, // Enviar como string, não array
        texto: `
        <div style='display: flex; text-align: center; justify-content: center; flex-direction: column; max-width: 600px; margin: 0 auto;'>
          <img src='https://i.postimg.cc/xCsFXPWb/image.png' />
          
          <div style='display: flex; padding: 20px 0px; flex-direction: column; background: #f9f9f9; border-radius: 8px;'>
            <h2 style='color: #1976d2; margin-bottom: 15px;'>Relatório de Inconformidades</h2>
            
            <div style='text-align: left; padding: 0 20px;'>
              <p><strong>ID APR:</strong> ${apr.apr_id}</p>
              <p><strong>Site:</strong> ${apr.site_id.Nome} (${apr.site_id.Sigla})</p>
              <p><strong>Localização:</strong> ${apr.site_id.Cidade} - ${apr.site_id.Estado}</p>
              
              <p style='margin-top: 20px;'><strong>Instruções de acesso:</strong></p>
              <p>Favor acessar o link abaixo para verificar as inconformidades identificadas pelo time da Segurança Patrimonial. 
              Será necessário apontar as ações a serem tomadas conforme recomendado para a efetiva proteção do patrimônio.</p>
              
              <p>Para visualizar as inconformidades, acesse pelo link ou copie e cole o link abaixo em seu navegador:</p>
              <strong>URL:</strong> aprdigital.web.app/open/${id}<br>
            </div>
          </div>
          
          <div style='font-size: 12px; color: #666; margin-top: 15px; padding: 10px; background: #eee; border-radius: 4px;'>
            Este é um e-mail automático. Por favor, não responda.<br>
            © Todos os Direitos Reservados - APR Digital
          </div>
        </div>
        `,
      };

      console.log('=== ENVIANDO EMAIL ===');
      console.log('Conteúdo do email:', emailContent);

      const response = await fetch(
        "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail_APRDigital",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContent),
        }
      );

      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro do servidor:', errorText);
        throw new Error(`Erro HTTP! status: ${response.status} - ${errorText}`);
      }

      const responseData = await response.text();
      console.log('Resposta do servidor:', responseData);

      // Atualizar status da APR no Firestore
      await firebase.firestore().collection('aprs-producao').doc(id).update({
        status: "Enviado",
        data_envio_email: firebase.firestore.FieldValue.serverTimestamp(),
        terms: agreeTerms
      });

      logSistem('APR revisada e enviado por e-mail', id, emails);

      setApr({
        ...apr,
        status: "Enviado"
      });

      toast.success("E-mail enviado com sucesso e APR atualizada!");
      setOpenDialog(false);
      setAgreeTerms(false);
    } catch (error) {
      console.error('Erro completo:', error);
      if (error.message.includes('500')) {
        toast.error(`Erro no servidor ao enviar email. Verifique os logs no console.`);
      } else {
        toast.error(`Erro ao enviar o e-mail: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se APR precisa ir para ponto focal de logística
  const needsLogisticsFocalPoint = () => {
    const logisticsAreas = ["logistica"];
    let hasLogisticsIssues = false;

    apr.checklist.forEach((area) => {
      area[1].forEach((question) => {
        // Verifica se existe resposta e se é diferente do gabarito
        const hasInconformity = question.resp && 
                               question.resp !== "N/A" && 
                               question.resp !== question.respGabarito;
          
        // Verifica se há questões relacionadas à logística
        if (hasInconformity && question.areaResposavel && 
            question.areaResposavel.some(area => logisticsAreas.includes(area.toLowerCase()))) {
          hasLogisticsIssues = true;
        }
      });
    });

    return hasLogisticsIssues;
  };

  // Enviar email para ponto focal de logística
  const sendEmailToLogisticsFocalPoint = async () => {
    try {
      // Buscar email do ponto focal de logística
      const logisticsDoc = await firebase.firestore().collection('contact_email')
        .doc('ponto_focal_logistica').get();
      
      let logisticsEmail = '';
      if (logisticsDoc.exists) {
        logisticsEmail = logisticsDoc.data().email || '';
      }

      // Se não encontrou email específico, usar um padrão
      if (!logisticsEmail) {
        logisticsEmail = 'ponto.focal.logistica@telefonica.com';
      }

      // Gerar lista de inconformidades relacionadas à logística
      const logisticsIssues = [];
      apr.checklist.forEach((area) => {
        area[1].forEach((question, index) => {
          // Verifica se existe resposta e se é diferente do gabarito
          const hasInconformity = question.resp && 
                                 question.resp !== "N/A" && 
                                 question.resp !== question.respGabarito;
          
          if (hasInconformity && question.areaResposavel && 
              question.areaResposavel.some(area => area.toLowerCase().includes('logistica'))) {
            
            logisticsIssues.push({
              pergunta: question.pergunta,
              resposta: question.resp,
              area: area[0],
              index: index + 1
            });
          }
        });
      });

      const emailContent = {
        remetente: "aprdigital.seg.br@telefonica.com",
        assunto: `APR Digital - Ação Requerida Logística - ${apr.site_id.Sigla} - ${apr.site_id.Cidade}/${apr.site_id.Estado}`,
        destinatario: logisticsEmail,
        texto: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>APR Digital - Ponto Focal Logística</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #660099; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
            .site-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
            .issues-list { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .issue-item { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid #ff7675; }
            .action-button { display: inline-block; background-color: #660099; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .sla-warning { background-color: #ffe5e5; border: 1px solid #ff9999; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>APR Digital - Ponto Focal Logística</h1>
              <p>Análise Preventiva de Riscos requer sua atenção</p>
            </div>

            <div class="site-info">
              <h3>Informações do Site</h3>
              <p><strong>Site:</strong> ${apr.site_id.Sigla}</p>
              <p><strong>Localização:</strong> ${apr.site_id.Cidade}/${apr.site_id.Estado}</p>
              <p><strong>Tipo:</strong> ${apr.site_id.tipoSite || 'N/I'}</p>
              <p><strong>CD/Base Cross:</strong> ${apr.site_id.CD || apr.site_id.Cidade}</p>
            </div>

            <div class="sla-warning">
              <h3>⏰ SLA - Prazo para Resposta</h3>
              <p><strong>Prazo:</strong> 14 dias corridos a partir do recebimento</p>
              <p><strong>Data Limite:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
            </div>

            <div class="issues-list">
              <h3>🔍 Inconformidades Identificadas (Logística)</h3>
              ${logisticsIssues.map(issue => `
                <div class="issue-item">
                  <p><strong>Área:</strong> ${issue.area}</p>
                  <p><strong>Pergunta:</strong> ${issue.pergunta}</p>
                  <p><strong>Resposta:</strong> ${issue.resposta}</p>
                </div>
              `).join('')}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/Open/${id}" class="action-button">
                🔗 Acessar APR para Definir Plano de Ação
              </a>
            </div>

            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4>📋 Próximos Passos</h4>
              <ol>
                <li>Acesse a APR através do link acima</li>
                <li>Analise as inconformidades relacionadas à logística</li>
                <li>Defina o plano de ação para cada item</li>
                <li>Informe prazos e responsáveis</li>
                <li>Finalize o processo dentro do prazo de 14 dias</li>
              </ol>
            </div>

            <div style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
              <p>Este e-mail foi gerado automaticamente pelo Sistema APR Digital</p>
              <p>ID da APR: ${id}</p>
            </div>
          </div>
        </body>
        </html>`
      };

      // Enviar email
      const response = await fetch("https://us-central1-aprdigital-b6fcf.cloudfunctions.net/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailContent)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar email para ponto focal:', error);
      throw error;
    }
  };

  const revisado = async () => {
    if (!agreeTerms) {
      toast.warning("Você precisa concordar com os termos antes de revisar.");
      return;
    }

    setIsLoading(true);

    try {
      const needsLogistics = needsLogisticsFocalPoint();
      let newStatus = "Revisado";
      let updateData = {
        status: newStatus,
        terms: agreeTerms,
        data_revisao: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Se precisa ir para ponto focal de logística
      if (needsLogistics) {
        newStatus = "Aguardando Ponto Focal";
        updateData = {
          ...updateData,
          status: newStatus,
          data_envio_ponto_focal: firebase.firestore.FieldValue.serverTimestamp(),
          sla_ponto_focal: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 14 dias
        };

        // Enviar email para ponto focal
        await sendEmailToLogisticsFocalPoint();
        logSistem('APR revisada e enviada para ponto focal de logística', id);
      } else {
        logSistem('APR Revisada', id);
      }

      // Atualizar status da APR no Firestore
      await firebase.firestore().collection('aprs-producao').doc(id).update(updateData);

      setApr({
        ...apr,
        status: newStatus
      });

      const message = needsLogistics 
        ? "APR revisada e enviada para ponto focal de logística!" 
        : "APR revisada com sucesso!";
      
      toast.success(message);
      setOpenDialog(false);
      setAgreeTerms(false);
    } catch (error) {
      toast.error(`Erro ao revisar a APR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const concludeWithoutEmail = async () => {
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="emails">
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenDialog}
        fullWidth
        disabled={isLoading}
      >
        {isLoading ? "Processando..." : "Confirmar Revisão e Enviar E-mail"}
      </Button>

      {/* Dialog de confirmação */}
      <Dialog open={openDialog} onClose={() => !isLoading && setOpenDialog(false)}>
        <DialogTitle>
          {hasEmailToSend ? "Confirmar Revisão e Enviar E-mail" : "Confirmar Revisão"}
        </DialogTitle>

        <DialogContent>
          {hasEmailToSend ? (
            <>
              <Typography variant="body1"><strong>Destinatários:</strong></Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 1 }}>
                {emails || "Carregando e-mails..."}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    color="primary"
                    disabled={isLoading}
                  />
                }
                label="Confirmo que os destinatários dos e-mails mencionados acima estão corretos e que a Análise Preventiva de Riscos (APR) já foi revisada e aprovada."
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
          <Button onClick={() => setOpenDialog(false)} color="secondary" disabled={isLoading}>
            Cancelar
          </Button>
          {hasEmailToSend ? (
            <Fragment>
              <Button onClick={revisado} color="primary" variant="contained" disabled={!agreeTerms || isLoading}>
                {isLoading ? "Processando..." : "Confirmar Revisão"}
              </Button>
              <Button onClick={sendEmail} color="primary" variant="contained" disabled={!agreeTerms || isLoading}>
                {isLoading ? "Processando..." : "Confirmar e Enviar E-mail"}
              </Button>
            </Fragment>
          ) : (
            <Button onClick={concludeWithoutEmail} color="primary" variant="contained" disabled={isLoading}>
              {isLoading ? "Processando..." : "Concluir"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmailLink;