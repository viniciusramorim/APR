import firebase from '../services/firebaseConnection';

/**
 * Verifica e atualiza APRs com SLA do ponto focal vencido
 */

export const checkAndUpdateExpiredSLAs = async () => {
  try {
    const now = new Date();
    
    // Buscar APRs com status "Aguardando Ponto Focal" e SLA vencido
    const snapshot = await firebase.firestore()
      .collection('aprs-producao')
      .where('status', '==', 'Aguardando Ponto Focal')
      .where('sla_ponto_focal', '<=', firebase.firestore.Timestamp.fromDate(now))
      .get();

    const batch = firebase.firestore().batch();
    const expiredAPRs = [];

    snapshot.forEach((doc) => {
      const aprData = doc.data();
      
      // Atualizar status para SLA vencido
      const docRef = firebase.firestore().collection('aprs-producao').doc(doc.id);
      batch.update(docRef, {
        status: 'SLA Ponto Focal Vencido',
        data_sla_vencido: firebase.firestore.FieldValue.serverTimestamp()
      });

      expiredAPRs.push({
        id: doc.id,
        site: `${aprData.site_id?.Sigla || 'N/I'} - ${aprData.site_id?.Cidade || 'N/I'}/${aprData.site_id?.Estado || 'N/I'}`,
        sla_original: aprData.sla_ponto_focal?.toDate(),
        diasVencido: Math.ceil((now - aprData.sla_ponto_focal.toDate()) / (1000 * 60 * 60 * 24))
      });
    });

    // Executar o batch update
    if (expiredAPRs.length > 0) {
      await batch.commit();
      console.log(`${expiredAPRs.length} APR(s) com SLA vencido atualizadas:`, expiredAPRs);
      
      // Enviar alerta por email para administradores
      await sendSLAExpiredAlert(expiredAPRs);
    }

    return expiredAPRs;
  } catch (error) {
    console.error('Erro ao verificar SLAs vencidos:', error);
    throw error;
  }
};

/**
 * Envia alerta por email sobre SLAs vencidos
 */
const sendSLAExpiredAlert = async (expiredAPRs) => {
  try {
    const emailContent = {
      remetente: "aprdigital.seg.br@telefonica.com",
      assunto: `⚠️ APR Digital - SLA Ponto Focal Vencido - ${expiredAPRs.length} APR(s)`,
      destinatario: 'administracao.aprdigital@telefonica.com', // Configure o email do admin
      texto: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SLA Vencido - APR Digital</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
          .alert-list { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .apr-item { margin: 10px 0; padding: 15px; background-color: white; border-left: 4px solid #dc3545; border-radius: 4px; }
          .days-overdue { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ SLA Ponto Focal Vencido</h1>
            <p>APRs com prazo de resposta vencido</p>
          </div>

          <div class="alert-list">
            <h3>🚨 APRs com SLA Vencido (${expiredAPRs.length})</h3>
            ${expiredAPRs.map(apr => `
              <div class="apr-item">
                <p><strong>Site:</strong> ${apr.site}</p>
                <p><strong>ID APR:</strong> ${apr.id}</p>
                <p><strong>SLA Original:</strong> ${apr.sla_original?.toLocaleDateString('pt-BR')}</p>
                <p class="days-overdue">⏰ Vencido há ${apr.diasVencido} dia(s)</p>
                <p><a href="${window.location?.origin || 'https://aprdigital.com'}/Open/${apr.id}" style="color: #660099;">🔗 Acessar APR</a></p>
              </div>
            `).join('')}
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>📋 Ações Recomendadas</h4>
            <ul>
              <li>Contatar o ponto focal de logística</li>
              <li>Verificar possíveis bloqueios ou dificuldades</li>
              <li>Avaliar necessidade de escalação</li>
              <li>Definir novos prazos se necessário</li>
            </ul>
          </div>

          <div style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>Alerta gerado automaticamente pelo Sistema APR Digital</p>
            <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </body>
      </html>`
    };

    const response = await fetch("https://us-central1-aprdigital-b6fcf.cloudfunctions.net/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailContent)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP! status: ${response.status}`);
    }

    console.log('Alerta de SLA vencido enviado por email');
  } catch (error) {
    console.error('Erro ao enviar alerta de SLA vencido:', error);
  }
};

/**
 * Função para ser executada em intervalos regulares
 * Pode ser chamada por um cron job ou timer
 */
export const startSLAMonitoring = () => {
  // Verificar SLAs a cada 6 horas (21600000 ms)
  const interval = 6 * 60 * 60 * 1000;
  
  setInterval(async () => {
    try {
      await checkAndUpdateExpiredSLAs();
    } catch (error) {
      console.error('Erro no monitoramento de SLA:', error);
    }
  }, interval);

  // Executar uma verificação imediata
  setTimeout(() => checkAndUpdateExpiredSLAs(), 5000);
  
  console.log('Monitoramento de SLA iniciado - verificação a cada 6 horas');
};

/**
 * Função para verificação manual de SLAs (pode ser usada em botões da interface)
 */
export const manualSLACheck = async () => {
  try {
    const expiredAPRs = await checkAndUpdateExpiredSLAs();
    return {
      success: true,
      count: expiredAPRs.length,
      expiredAPRs
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};