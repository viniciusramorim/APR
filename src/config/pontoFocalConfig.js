/**
 * Configuração de Email para Ponto Focal de Logística
 * 
 * Este documento deve ser criado no Firebase Firestore na collection 'contact_email'
 * com o ID 'ponto_focal_logistica'
 * 
 * Estrutura do documento:
 */

const pontoFocalLogisticaConfig = {
  email: "ponto.focal.logistica@telefonica.com", // Substituir pelo email real
  nome: "Ponto Focal Logística",
  descricao: "Responsável pela definição de planos de ação relacionados à logística",
  ativo: true,
  created_at: new Date(),
  updated_at: new Date()
};

/**
 * Comando para criar no console do Firebase:
 * 
 * firebase.firestore().collection('contact_email').doc('ponto_focal_logistica').set({
 *   email: "ponto.focal.logistica@telefonica.com",
 *   nome: "Ponto Focal Logística", 
 *   descricao: "Responsável pela definição de planos de ação relacionados à logística",
 *   ativo: true,
 *   created_at: firebase.firestore.FieldValue.serverTimestamp(),
 *   updated_at: firebase.firestore.FieldValue.serverTimestamp()
 * });
 * 
 * OU criar através da interface do Firebase Console:
 * 1. Acesse o Firestore Database
 * 2. Navegue até a collection 'contact_email'
 * 3. Clique em "Add document"
 * 4. Use 'ponto_focal_logistica' como Document ID
 * 5. Adicione os campos conforme o objeto acima
 */

module.exports = pontoFocalLogisticaConfig;