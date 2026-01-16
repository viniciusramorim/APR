# 📧 Sistema de Monitoramento Automático de SLA

## 🎯 Objetivo

Este sistema monitora automaticamente os SLAs (Service Level Agreements) definidos pelos pontos focais nas APRs e envia alertas por email quando:
- **SLA está próximo do vencimento** (3 dias ou menos)
- **SLA está vencido**

Os alertas são enviados **diariamente às 9h da manhã** até que todas as correções sejam concluídas.

---

## 🔧 Configuração Inicial

### 1. Instalar dependências

```bash
cd functions
npm install nodemailer
```

### 2. Configurar credenciais de email

Você precisa configurar as credenciais do email que enviará os alertas:

```bash
firebase functions:config:set email.user="seu-email@telefonica.com"
firebase functions:config:set email.pass="sua-senha-ou-app-password"
```

⚠️ **IMPORTANTE**: Se estiver usando Gmail, você precisa criar uma "Senha de App":
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Email" e "Outro (nome personalizado)"
3. Digite "APR Digital" e gere a senha
4. Use essa senha gerada no comando acima

### 3. Configurar URL do app (opcional)

Para que o botão "Acessar APR" funcione corretamente no email:

```bash
firebase functions:config:set app.url="https://seu-projeto.web.app"
```

### 4. Adicionar função ao index.js

Edite o arquivo `functions/index.js` e adicione:

```javascript
const slaMonitoring = require('./slaMonitoring');

// Exportar as funções de monitoramento
exports.monitorarSLAs = slaMonitoring.monitorarSLAs;
exports.testarMonitoramentoSLA = slaMonitoring.testarMonitoramentoSLA;
```

### 5. Deploy

```bash
firebase deploy --only functions
```

---

## 🚀 Como Funciona

### Fluxo do Sistema

1. **Ponto Focal define os SLAs**
   - Abre a APR em "Aguardando Correção"
   - Define data de SLA para cada inconformidade
   - Adiciona comentários e anexos

2. **Ponto Focal envia para monitoramento**
   - Clica no botão "📤 Enviar para Monitoramento de SLA"
   - APR muda para status "Monitoramento SLA"
   - Sistema começa a monitorar automaticamente

3. **Sistema monitora diariamente**
   - Todo dia às 9h da manhã, a Cloud Function é executada
   - Verifica todas as APRs em "Monitoramento SLA"
   - Calcula dias restantes para cada SLA
   - Envia emails de alerta quando necessário

4. **Alertas enviados**
   - **Amarelo** ⚠️: SLA vence em 3 dias ou menos
   - **Vermelho** 🔴: SLA já venceu
   - Email contém tabela com todas as inconformidades pendentes

5. **Ponto Focal resolve**
   - Acompanha as correções através dos emails
   - Quando tudo estiver resolvido, encerra a APR
   - Sistema para de enviar alertas

---

## 📋 Novos Campos no Firestore

O sistema adiciona automaticamente estes campos nas APRs:

```javascript
{
  status: "Monitoramento SLA",  // Novo status
  data_envio_monitoramento: Timestamp,  // Quando foi enviado para monitoramento
  ultimo_alerta_sla: Timestamp,  // Último alerta enviado
  total_alertas_enviados: Number  // Contador de alertas
}
```

---

## 🧪 Testando o Sistema

### Teste Manual

Você pode testar o sistema acessando a URL da função HTTP:

```
https://southamerica-east1-SEU-PROJETO.cloudfunctions.net/testarMonitoramentoSLA
```

Isso executará o monitoramento imediatamente sem esperar o agendamento.

### Verificar Logs

```bash
firebase functions:log --only monitorarSLAs
```

### Simular uma APR com SLA vencido

1. Crie uma APR de teste
2. Defina um SLA para amanhã
3. No Firestore, altere manualmente a data do SLA para ontem
4. Execute o teste manual
5. Verifique se recebeu o email

---

## 📧 Formato do Email

O email enviado contém:

- **Cabeçalho**: Logo e título do alerta
- **Informações da APR**: ID, Site, Sigla, Status, Data
- **Tabela de SLAs Vencidos**: Em vermelho, com dias de atraso
- **Tabela de SLAs Críticos**: Em amarelo, com dias restantes
- **Ações Necessárias**: Lista de próximos passos
- **Botão**: Link direto para abrir a APR no sistema
- **Rodapé**: Informações sobre frequência do alerta

---

## ⏰ Alterando a Frequência dos Alertas

Por padrão, os alertas são enviados **diariamente às 9h**. Para alterar:

Edite `slaMonitoring.js` linha 14:

```javascript
// Diariamente às 9h
.schedule('0 9 * * *')

// Exemplos de outros agendamentos:
.schedule('0 9,15 * * *')     // Duas vezes ao dia (9h e 15h)
.schedule('0 9 * * 1-5')      // Apenas dias úteis às 9h
.schedule('0 */6 * * *')      // A cada 6 horas
.schedule('*/30 * * * *')     // A cada 30 minutos (teste)
```

Formato do Cron: `minuto hora dia mês dia-semana`

---

## 🔐 Permissões Necessárias

A Cloud Function precisa de:

- ✅ Leitura/Escrita no Firestore (já tem por padrão)
- ✅ Envio de emails via SMTP
- ✅ Cloud Scheduler (habilitado automaticamente)

---

## 💰 Custos

- **Cloud Scheduler**: Gratuito até 3 jobs/mês (estamos usando 1)
- **Cloud Function**: Gratuito até 2 milhões de invocações/mês
- **Emails**: Depende do provedor SMTP (Gmail tem limite de 500/dia)

Para produção, considere usar:
- **SendGrid** (40.000 emails grátis/30 dias)
- **Mailgun** (5.000 emails grátis/mês)
- **AWS SES** ($0.10 por 1.000 emails)

---

## 🐛 Troubleshooting

### Emails não estão sendo enviados

1. Verifique as credenciais:
```bash
firebase functions:config:get
```

2. Verifique os logs:
```bash
firebase functions:log
```

3. Teste manualmente a função HTTP

### Função não está executando no horário

1. Verifique se Cloud Scheduler está habilitado no Console do Firebase
2. Vá em Console > Cloud Scheduler e verifique o job
3. Execute manualmente pelo console para testar

### Erro de autenticação SMTP

- Gmail: Use senha de app, não a senha normal
- Ative "Acesso a apps menos seguros" se necessário
- Verifique se 2FA está configurado corretamente

---

## 🔄 Próximas Melhorias

Possíveis melhorias futuras:

- [ ] Configurar frequência de alertas por prioridade
- [ ] Dashboard de SLAs vencidos
- [ ] Escalonamento automático (enviar para gestor após X dias)
- [ ] Notificações push no app
- [ ] Relatório semanal consolidado
- [ ] Integração com WhatsApp Business API

---

## 📞 Suporte

Em caso de dúvidas ou problemas, contate o time de desenvolvimento.

---

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Monitoramento automático diário
- ✅ Alertas de SLA próximo do vencimento (≤ 3 dias)
- ✅ Alertas de SLA vencido
- ✅ Emails formatados em HTML
- ✅ Link direto para APR
- ✅ Contador de alertas enviados
- ✅ Função de teste manual
