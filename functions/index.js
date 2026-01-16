const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();

// Importar módulo de monitoramento de SLA
const slaMonitoring = require('./slaMonitoring');

// ============================================================================
// FUNÇÕES DE MONITORAMENTO DE SLA
// ============================================================================

/**
 * Função agendada que roda diariamente às 9h verificando SLAs
 * e enviando alertas para os pontos focais
 */
exports.monitorarSLAs = slaMonitoring.monitorarSLAs;

/**
 * Função HTTP para teste manual do monitoramento de SLA
 * URL: https://REGION-PROJECT.cloudfunctions.net/testarMonitoramentoSLA
 */
exports.testarMonitoramentoSLA = slaMonitoring.testarMonitoramentoSLA;

// ============================================================================
// OUTRAS FUNÇÕES (adicione aqui suas outras Cloud Functions)
// ============================================================================

// Exemplo de função adicional (comentada)
/*
exports.minhaOutraFuncao = functions.https.onRequest((req, res) => {
  res.send("Olá!");
});
*/
