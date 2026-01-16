const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configuração do transporter de email (ajuste conforme sua configuração)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

/**
 * Função que roda a cada 24 horas verificando SLAs
 * Para ativar: firebase functions:config:set email.user="seu@email.com" email.pass="suasenha"
 * Deploy: firebase deploy --only functions:monitorarSLAs
 */
exports.monitorarSLAs = functions.pubsub
  .schedule('0 9 * * *') // Roda todo dia às 9h da manhã
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('🔍 Iniciando monitoramento de SLAs...');
    
    try {
      const db = admin.firestore();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Buscar APRs em monitoramento
      const aprsSnapshot = await db.collection('aprs-producao')
        .where('status', '==', 'Monitoramento SLA')
        .get();
      
      if (aprsSnapshot.empty) {
        console.log('✅ Nenhuma APR em monitoramento.');
        return null;
      }
      
      console.log(`📋 Encontradas ${aprsSnapshot.size} APRs em monitoramento`);
      
      const alertasEnviados = [];
      
      for (const aprDoc of aprsSnapshot.docs) {
        const apr = aprDoc.data();
        const aprId = aprDoc.id;
        
        console.log(`\n📄 Verificando APR: ${aprId}`);
        console.log(`   Site: ${apr.site_id?.Nome || 'N/A'}`);
        
        // Buscar o ponto focal responsável
        let pontoFocalEmail = null;
        
        // Se tem revisor_logistica_id, buscar o email dele
        if (apr.revisor_logistica_id) {
          const revisorDoc = await db.collection('users').doc(apr.revisor_logistica_id).get();
          if (revisorDoc.exists) {
            pontoFocalEmail = revisorDoc.data().email;
          }
        }
        
        if (!pontoFocalEmail) {
          console.log(`   ⚠️ Sem ponto focal definido, pulando...`);
          continue;
        }
        
        // Verificar cada inconformidade
        const checklist = apr.checklist || [];
        let slasCriticos = [];
        let slasVencidos = [];
        
        checklist.forEach((area) => {
          area[1].forEach((question) => {
            const planoAcao = question.resp_pa_selectedOption;
            
            if (planoAcao && planoAcao.sla_logistica) {
              const slaDate = planoAcao.sla_logistica.toDate();
              slaDate.setHours(0, 0, 0, 0);
              
              const diffDias = Math.ceil((slaDate - hoje) / (1000 * 60 * 60 * 24));
              
              const slaInfo = {
                area: area[0],
                questao: question.question,
                sla: slaDate.toLocaleDateString('pt-BR'),
                diasRestantes: diffDias
              };
              
              // SLA vencido
              if (diffDias < 0) {
                slasVencidos.push({
                  ...slaInfo,
                  diasAtraso: Math.abs(diffDias)
                });
              }
              // SLA próximo do vencimento (3 dias ou menos)
              else if (diffDias <= 3 && diffDias >= 0) {
                slasCriticos.push(slaInfo);
              }
            }
          });
        });
        
        // Enviar alertas se necessário
        if (slasVencidos.length > 0 || slasCriticos.length > 0) {
          const resultado = await enviarEmailAlerta(
            pontoFocalEmail,
            apr,
            aprId,
            slasCriticos,
            slasVencidos
          );
          
          if (resultado.success) {
            alertasEnviados.push({
              aprId,
              site: apr.site_id?.Nome,
              pontoFocal: pontoFocalEmail,
              criticos: slasCriticos.length,
              vencidos: slasVencidos.length
            });
            
            // Registrar o envio do alerta no Firestore
            await db.collection('aprs-producao').doc(aprId).update({
              ultimo_alerta_sla: admin.firestore.FieldValue.serverTimestamp(),
              total_alertas_enviados: admin.firestore.FieldValue.increment(1)
            });
          }
        }
      }
      
      console.log(`\n✅ Monitoramento concluído!`);
      console.log(`📧 Total de alertas enviados: ${alertasEnviados.length}`);
      
      return { success: true, alertas: alertasEnviados.length };
      
    } catch (error) {
      console.error('❌ Erro no monitoramento de SLAs:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Envia email de alerta para o ponto focal
 */
async function enviarEmailAlerta(destinatario, apr, aprId, slasCriticos, slasVencidos) {
  try {
    let htmlCriticos = '';
    let htmlVencidos = '';
    
    if (slasCriticos.length > 0) {
      htmlCriticos = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ SLAs Próximos do Vencimento (≤ 3 dias)</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #ffc107;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Área</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Questão</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">SLA</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Dias Restantes</th>
              </tr>
            </thead>
            <tbody>
              ${slasCriticos.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.area}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.questao}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.sla}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${item.diasRestantes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    if (slasVencidos.length > 0) {
      htmlVencidos = `
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
          <h3 style="color: #721c24; margin-top: 0;">🔴 SLAs VENCIDOS</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #dc3545; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Área</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Questão</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">SLA</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Dias de Atraso</th>
              </tr>
            </thead>
            <tbody>
              ${slasVencidos.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.area}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.questao}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.sla}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: #dc3545;">${item.diasAtraso}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    const mailOptions = {
      from: functions.config().email.user,
      to: destinatario,
      subject: `🚨 Alerta de SLA - APR ${aprId} - ${apr.site_id?.Nome || 'N/A'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
            .info-box { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Alerta de Monitoramento de SLA</h1>
            </div>
            
            <div class="info-box">
              <h2>Informações da APR</h2>
              <p><strong>ID:</strong> ${aprId}</p>
              <p><strong>Site:</strong> ${apr.site_id?.Nome || 'N/A'}</p>
              <p><strong>Sigla:</strong> ${apr.site_id?.Sigla || 'N/A'}</p>
              <p><strong>Status:</strong> ${apr.status}</p>
              <p><strong>Data da APR:</strong> ${apr.date ? new Date(apr.date.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
            
            ${htmlVencidos}
            ${htmlCriticos}
            
            <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
              <h3 style="color: #004085; margin-top: 0;">📋 Ações Necessárias</h3>
              <ul>
                <li>Verifique o status das correções em andamento</li>
                <li>Entre em contato com as áreas responsáveis</li>
                <li>Atualize o progresso no sistema</li>
                <li>Se as correções foram concluídas, finalize a APR</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${functions.config().app?.url || 'https://seu-app.web.app'}/open/${aprId}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📱 Acessar APR no Sistema
              </a>
            </p>
            
            <div class="footer">
              <p>Este é um alerta automático do sistema APR Digital.</p>
              <p>Você receberá este alerta diariamente até que todas as correções sejam concluídas e a APR seja finalizada.</p>
              <p>Data do alerta: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`   ✅ Email enviado para ${destinatario}`);
    
    return { success: true };
    
  } catch (error) {
    console.error(`   ❌ Erro ao enviar email:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Função HTTP para teste manual do monitoramento
 * Acesse: https://REGION-PROJECT.cloudfunctions.net/testarMonitoramentoSLA
 */
exports.testarMonitoramentoSLA = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Teste manual do monitoramento de SLA iniciado...');
  
  const resultado = await exports.monitorarSLAs.run();
  
  res.json({
    mensagem: 'Teste de monitoramento concluído',
    resultado: resultado
  });
});
