# 🔄 Fluxo Completo do Sistema de SLA

## 📊 Diagrama do Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INÍCIO: APR CRIADA                               │
│                         Status: "Em Aberto"                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   REVISOR analisa      │
                    │   Encontra problemas   │
                    └────────────┬───────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Status: "Aguardando Correção"                           │
│                  Notificação enviada para Ponto Focal                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  PONTO FOCAL define:   │
                    │  • Planos de Ação      │
                    │  • Datas de SLA        │
                    │  • Comentários         │
                    │  • Anexos              │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Clica em "Enviar para  │
                    │ Monitoramento de SLA"  │
                    └────────────┬───────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Status: "Monitoramento SLA"                           │
│              Sistema automático inicia monitoramento                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │    SISTEMA AUTOMÁTICO (Cloud Function)     │
        │    Roda TODOS OS DIAS às 9h da manhã       │
        │                                            │
        │    Para cada APR em "Monitoramento SLA":   │
        │    1. Verifica todas as datas de SLA       │
        │    2. Calcula dias restantes               │
        │    3. Identifica situações críticas        │
        └────────────────────────────────────────────┘
                                 │
                    ┌────────────┴───────────┐
                    │                        │
                    ▼                        ▼
        ┌───────────────────┐    ┌──────────────────┐
        │  SLA ≤ 3 dias?    │    │  SLA vencido?    │
        │  Status: AMARELO  │    │  Status: VERMELHO│
        │  ⚠️ CRÍTICO       │    │  🔴 URGENTE      │
        └─────────┬─────────┘    └────────┬─────────┘
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │   📧 EMAIL AUTOMÁTICO   │
                │   enviado para:         │
                │   • Ponto Focal         │
                │                         │
                │   Conteúdo:             │
                │   • Lista de SLAs       │
                │   • Dias restantes      │
                │   • Dias de atraso      │
                │   • Link para APR       │
                └─────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  REPETIÇÃO DIÁRIA até que:              │
        │  1. Todas correções sejam feitas OU     │
        │  2. Ponto Focal encerre a APR           │
        └─────────────────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  PONTO FOCAL verifica   │
                │  que tudo foi resolvido │
                │  e encerra a APR        │
                └─────────────┬───────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Status: "Concluido"                                 │
│                  Sistema PARA de enviar alertas                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Papéis e Permissões

### 🔍 REVISOR
- ✅ Analisa APRs
- ✅ Identifica inconformidades
- ✅ Muda status para "Aguardando Correção"
- ❌ NÃO define SLAs

### 📋 PONTO FOCAL
- ✅ Define planos de ação
- ✅ Define datas de SLA
- ✅ Adiciona comentários e anexos
- ✅ Envia para monitoramento
- ✅ Recebe alertas automáticos
- ✅ Acompanha resolução
- ✅ Pode encerrar APR quando tudo resolvido
- ❌ NÃO pode encerrar sem resolver

### 🤖 SISTEMA AUTOMÁTICO
- ✅ Monitora SLAs 24/7
- ✅ Envia alertas diários
- ✅ Registra histórico de alertas
- ✅ Calcula dias restantes/atrasados

---

## 📅 Timeline de Alertas

### Exemplo Prático

```
DIA 0 (Segunda): Ponto Focal define SLA para 10/01/2024
                 Envia para monitoramento
                 ✅ Status: "Monitoramento SLA"

DIA 1-5:        Sistema verifica diariamente
                Nenhum alerta (SLA está ok)
                📊 Dias restantes: >3

DIA 6 (07/01):  Sistema detecta: faltam 3 dias!
                📧 EMAIL ENVIADO
                ⚠️ "SLA próximo do vencimento"
                
DIA 7 (08/01):  📧 EMAIL ENVIADO (2º alerta)
                ⚠️ Faltam 2 dias
                
DIA 8 (09/01):  📧 EMAIL ENVIADO (3º alerta)
                ⚠️ Falta 1 dia
                
DIA 9 (10/01):  📧 EMAIL ENVIADO (4º alerta)
                ⚠️ VENCE HOJE!
                
DIA 10 (11/01): 📧 EMAIL ENVIADO (5º alerta)
                🔴 ATRASADO! 1 dia de atraso
                
DIA 11-X:       📧 EMAILS DIÁRIOS
                🔴 ATRASADO! X dias de atraso
                
                Continua até:
                - Correção ser feita E
                - Ponto Focal encerrar APR
```

---

## 🎨 Exemplo de Email Recebido

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 Alerta de Monitoramento de SLA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Informações da APR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: APR-2024-001
Site: CD São Paulo - Guarulhos
Sigla: CDSPGU
Status: Monitoramento SLA
Data da APR: 02/01/2024

🔴 SLAs VENCIDOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────┬─────────────────────┬─────────┬──────────────┐
│ Área        │ Questão             │ SLA     │ Dias Atraso  │
├─────────────┼─────────────────────┼─────────┼──────────────┤
│ Elétrica    │ Extintores vencidos │ 10/01   │ 2 dias       │
│ Mecânica    │ Vazamento óleo      │ 08/01   │ 4 dias       │
└─────────────┴─────────────────────┴─────────┴──────────────┘

⚠️ SLAs Próximos do Vencimento (≤ 3 dias)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────┬─────────────────────┬─────────┬──────────────┐
│ Área        │ Questão             │ SLA     │ Dias Restant.│
├─────────────┼─────────────────────┼─────────┼──────────────┤
│ Predial     │ Porta danificada    │ 14/01   │ 2 dias       │
└─────────────┴─────────────────────┴─────────┴──────────────┘

📋 Ações Necessárias
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Verifique o status das correções em andamento
• Entre em contato com as áreas responsáveis
• Atualize o progresso no sistema
• Se as correções foram concluídas, finalize a APR

          [ 📱 ACESSAR APR NO SISTEMA ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este é um alerta automático do sistema APR Digital.
Você receberá este alerta diariamente até que todas 
as correções sejam concluídas e a APR seja finalizada.

Data do alerta: 12/01/2024 às 09:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Critérios de Alerta

### 🟢 SEM ALERTA
- SLA > 3 dias no futuro
- Status diferente de "Monitoramento SLA"
- APR já concluída

### 🟡 ALERTA CRÍTICO (Amarelo)
- SLA entre 0 e 3 dias no futuro
- Email enviado diariamente
- Cor amarela no email

### 🔴 ALERTA URGENTE (Vermelho)
- SLA vencido (data passou)
- Email enviado diariamente
- Cor vermelha no email
- Mostra dias de atraso

---

## 📊 Métricas Registradas

O sistema registra automaticamente:

```javascript
{
  data_envio_monitoramento: "10/01/2024 14:30",
  ultimo_alerta_sla: "15/01/2024 09:00",
  total_alertas_enviados: 5
}
```

Útil para:
- Auditoria
- Relatórios gerenciais
- Análise de performance
- Identificar gargalos

---

## 🚀 Benefícios do Sistema

### Para o Ponto Focal
- ✅ Não precisa lembrar manualmente dos prazos
- ✅ Recebe lembretes automáticos
- ✅ Tem visão clara de prioridades
- ✅ Pode focar na resolução, não no controle

### Para a Empresa
- ✅ Garante cumprimento de SLAs
- ✅ Reduz riscos operacionais
- ✅ Melhora resposta a inconformidades
- ✅ Histórico completo de ações

### Para Gestores
- ✅ Visibilidade de prazos
- ✅ Métricas de performance
- ✅ Identificação de problemas recorrentes
- ✅ Dados para tomada de decisão

---

## 🔒 Segurança

- ✅ Emails enviados apenas para o ponto focal responsável
- ✅ Dados sensíveis protegidos no Firestore
- ✅ Logs auditáveis de todas as ações
- ✅ Permissões controladas por nível de usuário

---

## 📈 Próximos Passos

1. **Agora**: Configurar Cloud Function e testar
2. **Semana 1**: Monitorar logs e ajustar se necessário
3. **Semana 2**: Coletar feedback dos pontos focais
4. **Mês 1**: Analisar métricas e otimizar alertas
5. **Futuro**: Adicionar dashboard visual de SLAs
