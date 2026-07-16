import "./documentation.scss";
import Header from "../../components/Header";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { useEffect } from "react";

function TypePill({ type, children }) {
  return <span className={`doc-type-pill doc-type-${type}`}>{children}</span>;
}

function DataTable({ head, rows, fieldCol = 0, descCol, originCol }) {
  const resolvedDescCol = descCol === undefined ? head.length - 1 : descCol;

  return (
    <div className="doc-table-wrap">
      <table className="doc-data">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {
                let className = "";
                if (j === fieldCol) className = "doc-field";
                else if (j === resolvedDescCol) className = "doc-desc";
                else if (j === originCol) className = "doc-origin";
                return (
                  <td key={j} className={className}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleChip({ role, label }) {
  return <span className={`doc-sm-role doc-${role}`}>{label}</span>;
}

const STATUS_CHIPS = [
  { label: "Em Aberto" },
  { label: "Com Exceção" },
  { label: "Aguardando Correção", variant: "warn" },
  { label: "Revisado" },
  { label: "Enviado", variant: "dead" },
  { label: "Enviado para Área Responsável" },
  { label: "Respondido pela Area" },
  { label: "Aguardando Revisão Plano de Ação" },
  { label: "Monitoramento SLA", variant: "warn" },
  { label: "Aguardando Revisão" },
  { label: "Concluido", variant: "done" },
  { label: "Finalizado", variant: "done" },
  { label: "Cancelado" },
];

const FLAT_FIELDS = [
  ["apr_id", <TypePill type="number">number</TypePill>, "ID sequencial da APR (pode vir como string em documentos legados)"],
  ["user_id", <TypePill type="object">object</TypePill>, "Objeto completo do usuário que criou a APR (uid, nome, email, area, nivel, uf, status, regional)"],
  ["checklist_aplicado", <TypePill type="string">string</TypePill>, "Nome do checklist/tipo de site aplicado"],
  ["motivo_apr", <TypePill type="string">string</TypePill>, "Motivo/categoria da APR"],
  ["status", <TypePill type="string">string (enum)</TypePill>, "Etapa atual do workflow — ver enum de status"],
  ["peso", <TypePill type="number">number</TypePill>, "Pontuação de risco somando o peso das respostas fora do gabarito"],
  ["created", <TypePill type="timestamp">timestamp</TypePill>, "Data/hora de criação (gravada client-side)"],
  ["valor_armazenamento", <TypePill type="string">string</TypePill>, "Valor de armazenamento em centavos (checklist PGR)"],
  ["valor_transporte", <TypePill type="string">string</TypePill>, "Valor de transporte em centavos (checklist PGR)"],
  ["valor_sinistro", <TypePill type="string">string</TypePill>, "Valor de sinistro em centavos (checklist PGR)"],
  ["valor_estoque", <TypePill type="string">string</TypePill>, "Valor de estoque em centavos (checklist LOJA)"],
  ["tipo_loja", <TypePill type="string">string</TypePill>, "Tipo de loja selecionado (checklist LOJA)"],
  ["checklist", <TypePill type="array">array</TypePill>, <>Array de perguntas por área — ver campos <code>checklist[].*</code> abaixo</>],
  ["terms", <TypePill type="boolean">boolean</TypePill>, "Aceite dos termos ao revisar/enviar e-mail"],
  ["motivo_reprovacao", <TypePill type="string">string</TypePill>, "Motivo de reprovação do plano de ação pelo revisor"],
  ["data_alteracao", <TypePill type="timestamp">Date (client)</TypePill>, "Última alteração — reescrito em quase toda transição de status"],
  ["data_envio_email", <TypePill type="timestamp">serverTimestamp</TypePill>, "Envio do e-mail de revisão"],
  ["data_revisao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Revisor marcou \"Revisado\" sem enviar e-mail"],
  ["data_conclusao_sem_email", <TypePill type="timestamp">serverTimestamp</TypePill>, "Conclusão sem necessidade de e-mail"],
  ["data_envio_monitoramento", <TypePill type="timestamp">serverTimestamp</TypePill>, "Envio para \"Monitoramento SLA\""],
  ["data_envio_revisao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Ponto focal envia PAs definidos para revisão"],
  ["data_devolucao_ponto_focal", <TypePill type="timestamp">serverTimestamp</TypePill>, "Ponto focal devolve ao revisor"],
  ["data_ponto_focal_resposta", <TypePill type="timestamp">serverTimestamp</TypePill>, "Revisor finaliza plano de ação de logística"],
  ["data_finalizacao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Órfão — não é mais gravado por nenhum código (função removida)"],
  ["data_correcoes_completas", <TypePill type="timestamp">serverTimestamp</TypePill>, "Todas as correções concluídas"],
  ["data_correcao_aplicador", <TypePill type="timestamp">serverTimestamp</TypePill>, "Aplicador finaliza todas as correções"],
  ["sla_ponto_focal", <TypePill type="timestamp">timestamp</TypePill>, "Somente leitura neste repositório — usado para alerta visual, nunca gravado aqui"],
  ["justificativa", <TypePill type="object">object | ""</TypePill>, "Motivo de exceção de execução da APR — ver subcampos abaixo"],
  ["justificativa.motivo", <TypePill type="string">string (enum)</TypePill>, "Site Desativado / Impedimento de Acesso / Falta de mão-de-obra momentânea / Raio de atuação até 300km / Raio de atuação superior a 700km / Falta de recursos"],
  ["justificativa.desc", <TypePill type="string">string</TypePill>, "Descrição textual livre da justificativa"],
  ["justificativa.data_inativo", <TypePill type="string">string (data)</TypePill>, "Só preenchido quando motivo = \"Site Desativado\""],
  ["site_id", <TypePill type="object">object</TypePill>, <>Cópia completa do documento <code>sites/{"{id}"}</code> no momento da criação — substituído por inteiro em edições</>],
  ["site_id.Nome", <TypePill type="string">string</TypePill>, "Nome do site/unidade"],
  ["site_id.Sigla", <TypePill type="string">string</TypePill>, "Sigla do site"],
  ["site_id.Sigla_GVT", <TypePill type="string">string</TypePill>, "Sigla GVT do site"],
  ["site_id.Endereco", <TypePill type="string">string</TypePill>, "Endereço do site"],
  ["site_id.Bairro", <TypePill type="string">string</TypePill>, "Bairro do site"],
  ["site_id.Complemento", <TypePill type="string">string</TypePill>, "Complemento do endereço"],
  ["site_id.CEP", <TypePill type="string">string</TypePill>, "CEP do site"],
  ["site_id.Estado", <TypePill type="string">string (UF)</TypePill>, "UF do site"],
  ["site_id.Cidade", <TypePill type="string">string</TypePill>, "Município do site"],
  ["site_id.Situacao", <TypePill type="string">string</TypePill>, "Situação cadastral do site"],
  ["site_id.critical", <TypePill type="string">string</TypePill>, "Criticidade do site (ex: \"BAIXO\"/\"ALTO\")"],
  ["site_id.tipoSite", <TypePill type="string">string</TypePill>, "Tipo do site — sempre sobrescrito na criação com o checklist selecionado"],
  ["site_id.tipoContrato", <TypePill type="string">string</TypePill>, "Tipo de contrato do site"],
  ["site_id.Detentora", <TypePill type="string">string</TypePill>, "Detentora do site"],
  ["site_id.Latitude", <TypePill type="string">string</TypePill>, "Latitude cadastrada do site"],
  ["site_id.Longitude", <TypePill type="string">string</TypePill>, "Longitude cadastrada do site"],
  ["site_id.geohash", <TypePill type="string">string</TypePill>, <>Geohash calculado via <code>geofire-common</code></>],
  ["site_id.NonStop", <TypePill type="string">string/bool</TypePill>, "Flag de classificação NonStop usada no cálculo de risco"],
  ["site_id.CtCritica", <TypePill type="string">string/bool</TypePill>, "Flag de rota crítica CT"],
  ["site_id.ErbCritica", <TypePill type="string">string/bool</TypePill>, "Flag de rota crítica ERB"],
  ["site_id.MapaCalor", <TypePill type="string">string/bool</TypePill>, "Flag de mapa de calor"],
  ["site_id.operador_logistico", <TypePill type="string">string</TypePill>, <>Operador logístico do site (também existe como chave <code>'Operador Logistico'</code>)</>],
  ["site_id.Cobertura_Seguro", <TypePill type="string">string</TypePill>, <>Cobertura de seguro do site (também existe como chave <code>'Cobertura Seguro'</code>)</>],
  ["site_id.last_apr", <TypePill type="timestamp">timestamp</TypePill>, "Data da última APR aplicada nesse site"],
  ["site_id.last_motivo", <TypePill type="string">string</TypePill>, "Motivo da última APR aplicada"],
  ["site_id.lastUpdate", <TypePill type="timestamp">timestamp</TypePill>, "Última atualização do cadastro do site"],
  ["site_id.userLastUpdate", <TypePill type="string">string</TypePill>, "Quem fez a última atualização do cadastro"],
  ["locationCreated", <TypePill type="object">object</TypePill>, "Geolocalização capturada no momento da conclusão da APR"],
  ["locationCreated.latitude", <TypePill type="number">number|null</TypePill>, <>Latitude via <code>navigator.geolocation</code></>],
  ["locationCreated.longitude", <TypePill type="number">number|null</TypePill>, <>Longitude — em docs antigos gravada com typo <code>logitude</code></>],
  ["locationCreated.perimetro", <TypePill type="string">string</TypePill>, "Status textual do perímetro/geolocalização"],
  ["geolocation_info", <TypePill type="object">object</TypePill>, "Controle de habilitação da geolocalização"],
  ["geolocation_info.enabled", <TypePill type="boolean">boolean</TypePill>, "Se a geolocalização foi obtida com sucesso"],
  ["geolocation_info.justification", <TypePill type="string">string</TypePill>, "Justificativa quando não habilitada"],
  ["geolocation_info.error", <TypePill type="string">string|null</TypePill>, "Mensagem de erro de geolocalização"],
  ["tempoConclusao", <TypePill type="object">object</TypePill>, "Timestamps de início/fim do preenchimento"],
  ["tempoConclusao.inicio", <TypePill type="timestamp">timestamp</TypePill>, "Momento em que o formulário foi carregado"],
  ["tempoConclusao.conclusao", <TypePill type="timestamp">timestamp</TypePill>, "Momento do submit final"],
  ["suplementacao", <TypePill type="object">object</TypePill>, "Suplementação do Projeto Veneza, quando aplicável"],
  ["suplementacao.id", <TypePill type="string">string</TypePill>, "ID da suplementação"],
  ["suplementacao.checklist_id", <TypePill type="string">string</TypePill>, "Sempre a constante \"LOJA PROJ VENEZA\""],
  ["suplementacao.created", <TypePill type="timestamp">Date</TypePill>, "Data de criação da suplementação"],
  ["suplementacao.adabas", <TypePill type="string">string</TypePill>, "Código ADABAS do site"],
  ["suplementacao.gerente", <TypePill type="object">object {"{nome,email}"}</TypePill>, "Gerente responsável pela suplementação"],
  ["suplementacao.site_id", <TypePill type="object">object</TypePill>, <>Site vinculado (mesmo shape de <code>site_id</code>)</>],
  ["suplementacao.verify_manager", <TypePill type="string">string/imagem</TypePill>, "Selfie/comprovação do gerente"],
  ["suplementacao.tipo_loja", <TypePill type="string">string</TypePill>, "Copiado da APR de origem"],
  ["suplementacao.valor_estoque", <TypePill type="string">string/number</TypePill>, "Copiado da APR de origem"],
  ["suplementacao.peso", <TypePill type="number">number</TypePill>, "Pontuação calculada da suplementação"],
  ["suplementacao.checklist", <TypePill type="array">array</TypePill>, "Checklist da suplementação (mesmo shape do checklist principal)"],
  ["checklist[].questionId", <TypePill type="string">string</TypePill>, "ID único da pergunta"],
  ["checklist[].question", <TypePill type="string">string</TypePill>, "Texto da pergunta"],
  ["checklist[].resp", <TypePill type="string">string</TypePill>, "Resposta dada pelo aplicador"],
  ["checklist[].respGabarito", <TypePill type="string">string</TypePill>, <>Resposta esperada — comparada com <code>resp</code> pra achar inconformidade</>],
  ["checklist[].respTextArea", <TypePill type="string">string</TypePill>, "Observação em texto livre"],
  ["checklist[].respInputNumber", <TypePill type="string">string/number</TypePill>, "Resposta numérica da pergunta"],
  ["checklist[].answers", <TypePill type="array">{"array<string>"}</TypePill>, "Opções de resposta disponíveis"],
  ["checklist[].optionList", <TypePill type="array">{"array<string>"}</TypePill>, "Lista de opções (perguntas tipo checkbox)"],
  ["checklist[].optionListResp", <TypePill type="array">{"array<string>"}</TypePill>, "Opções selecionadas pelo aplicador"],
  ["checklist[].isRequired", <TypePill type="boolean">boolean</TypePill>, "Se a pergunta é obrigatória"],
  ["checklist[].selectOptions", <TypePill type="boolean">boolean</TypePill>, "Se usa opções de rádio Sim/Não/N-A"],
  ["checklist[].listCheck", <TypePill type="string">string/bool</TypePill>, "Flag de pergunta tipo lista de checkbox"],
  ["checklist[].inputNumber", <TypePill type="boolean">boolean</TypePill>, "Se a pergunta tem campo numérico"],
  ["checklist[].areaResposavel", <TypePill type="array">array/string</TypePill>, "Área(s) responsável(is): oem, patrimonio, CMC, comercial, logistica"],
  ["checklist[].imagesURL", <TypePill type="array">array {"{url, ref}"}</TypePill>, "Fotos anexadas à pergunta"],
  ["checklist[].openPA", <TypePill type="boolean">boolean</TypePill>, "Se a pergunta abriu um plano de ação"],
  ["checklist[].plano_acao", <TypePill type="object">object</TypePill>, <>Sub-objeto do plano de ação — ver <code>checklist[].plano_acao.*</code> abaixo</>],
  ["checklist[].valorArmazenado", <TypePill type="object">object/array</TypePill>, "Faixa de valor de armazenamento associada à pergunta (PGR)"],
  ["checklist[].valorEstoque", <TypePill type="object">object/array</TypePill>, "Faixa de valor de estoque associada à pergunta (LOJA)"],
  ["checklist[].valorTransporte", <TypePill type="object">object/array</TypePill>, "Faixa de valor de transporte associada à pergunta (PGR)"],
  ["checklist[].ValorSinistro", <TypePill type="object">object/array</TypePill>, "Faixa de valor de sinistro associada à pergunta (PGR) — nota o \"V\" maiúsculo, inconsistente com os demais"],
  ["checklist[].tipoLoja", <TypePill type="array">{"array<string>"}</TypePill>, "Tipos de loja para os quais a pergunta é exibida"],
  ["checklist[].peso", <TypePill type="number">number</TypePill>, "Peso da pergunta usado no cálculo de risco"],
  ["checklist[].peso_rct / peso_daef / peso_fmc / peso_icd", <TypePill type="number">number</TypePill>, "Pesos alternativos por tipo de checklist (join com coleção question)"],
  ["checklist[].resp_pa_selectedOption", <TypePill type="string">string (enum)</TypePill>, "Sim / Não / Detentora / Patrimonio / Logistica"],
  ["checklist[].resp_pa_data", <TypePill type="timestamp">Date</TypePill>, "Data/hora de definição do plano de ação"],
  ["checklist[].resp_pa_user_name", <TypePill type="string">string</TypePill>, "Nome de quem definiu o plano"],
  ["checklist[].resp_pa_user_id", <TypePill type="string">string (uid)</TypePill>, "UID de quem definiu o plano"],
  ["checklist[].resp_pa_status", <TypePill type="string">string (enum)</TypePill>, "Concluido / Reprovado — resultado da validação do revisor"],
  ["checklist[].resp_pa_resolucao", <TypePill type="string">string (enum)</TypePill>, "'sim' / 'nao' / null"],
  ["checklist[].resp_pa_status_alterado", <TypePill type="string">string</TypePill>, "Nome de quem validou/alterou o status do PA"],
  ["checklist[].resp_pa_status_alterado_data", <TypePill type="timestamp">Date</TypePill>, "Data da validação"],
  ["checklist[].resp_pa_status_parecer", <TypePill type="string">string</TypePill>, "Parecer/comentário da validação"],
  ["checklist[].resp_pa_validacao_imagens", <TypePill type="array">{"array<url>"}</TypePill>, "Evidências fotográficas da validação"],
  ["checklist[].resp_pa_sla", <TypePill type="timestamp">timestamp</TypePill>, "Somente leitura neste repositório — nunca gravado"],
  ["checklist[].images_correcao", <TypePill type="array">{"array<url>"}</TypePill>, "Fotos de correção do aplicador"],
  ["checklist[].nota_parecer", <TypePill type="string">string</TypePill>, <>Legado — só lido como fallback, valor atual vive em <code>resp_pa_status_parecer</code></>],
  ["checklist[].plano_acao.comentario", <TypePill type="string">string</TypePill>, "Comentário/justificativa da tratativa (comum a todas as opções)"],
  ["checklist[].plano_acao.tempo", <TypePill type="string">string (data)</TypePill>, "Prazo da tratativa — opção \"Sim\""],
  ["checklist[].plano_acao.justificativa", <TypePill type="string">string (enum)</TypePill>, "Instalada solução similar / Sem orçamento / Solução em desacordo / Discordância de necessidade — opção \"Não\""],
  ["checklist[].plano_acao.nome_detentora", <TypePill type="string">string</TypePill>, "Nome da detentora — opção \"Detentora\""],
  ["checklist[].plano_acao.numero_chamado", <TypePill type="string">string</TypePill>, "Número de chamado — opções \"Detentora\"/\"Patrimonio\""],
  ["checklist[].plano_acao.sla_logistica", <TypePill type="timestamp">timestamp</TypePill>, "SLA de 2 semanas — opção \"Logistica\""],
  ["checklist[].plano_acao.historico_logistica", <TypePill type="array">array {"{data, usuario, sla, comentario}"}</TypePill>, "Histórico de redefinições do SLA de logística"],
  ["checklist[].plano_acao.anexo_url / anexo_nome", <TypePill type="string">string</TypePill>, "Anexo único — formato legado"],
  ["checklist[].plano_acao.anexos", <TypePill type="array">array {"{url, nome, data}"}</TypePill>, "Lista de múltiplos anexos — formato atual"],
  ["checklist[].plano_acao.evidencia_url / evidencia_nome", <TypePill type="string">string</TypePill>, "Evidência única enviada pelo aplicador"],
  ["checklist[].plano_acao.resolvido", <TypePill type="boolean">boolean</TypePill>, "Se o aplicador confirmou a resolução da inconformidade"],
  ["checklist[].plano_acao.resolvido_por / resolvido_por_id", <TypePill type="string">string</TypePill>, "Nome/UID de quem confirmou a resolução"],
  ["checklist[].plano_acao.resolvido_data", <TypePill type="timestamp">Date</TypePill>, "Data da confirmação de resolução"],
  ["checklist[].plano_acao.nova_resposta", <TypePill type="string">string</TypePill>, "Nova resposta dada na correção"],
  ["checklist[].plano_acao.imagens_correcao", <TypePill type="array">{"array<url>"}</TypePill>, "Fotos de evidência da correção"],
  ["checklist[].plano_acao.comentario_correcao", <TypePill type="string">string</TypePill>, "Comentário do aplicador sobre a correção"],
];

const ROLES = [
  {
    name: "aplicador",
    tag: "op",
    tagLabel: "Operação",
    desc: "Cria a APR e executa as correções quando o revisor encontra inconformidade.",
    perms: [
      { can: true, text: "Cria a APR (New/index.js:859,894)" },
      { can: true, text: "Corrige inconformidades pelo Modal_PA (Modal_PA/index.js:2334)" },
      { can: true, text: "Finaliza as próprias correções (Open/index.js:1414-1470)" },
      { can: true, text: "Encerra a própria APR quando em \"Aguardando Revisão\" (Open/index.js:3037-3061)" },
      { can: false, text: "Não edita a própria resposta pelo ModalEdit (explicitamente excluído, Open/index.js:2416-2417)" },
    ],
    transitions: ["Aguardando Correção → Aguardando Revisão", "Aguardando Revisão → Concluido"],
  },
  {
    name: "revisor",
    tag: "rev",
    tagLabel: "Revisão",
    desc: "Revisa o checklist, decide se há inconformidade, define e valida planos de ação (incluindo logística) e encerra a APR. Absorveu o antigo papel revisor_logistica, removido do sistema.",
    perms: [
      { can: true, text: "Edita site/motivo/perguntas enquanto \"Em Aberto\" (Open/index.js:1940-1962,2394-2429)" },
      { can: true, text: "Define/reedita plano de ação, inclusive opção Logística (Modal_PA/index.js:200-203)" },
      { can: true, text: "Usa o EmailLink: revisar, enviar e-mail, ou concluir direto" },
      { can: true, text: "Encerra APR em \"Respondido pela Area\" e \"Aguardando Revisão\" (Open/index.js:2794-2811,3037-3061)" },
      { can: true, text: "Devolve ao ponto focal ou finaliza no Drawer de validação (Open/index.js:3162-3195)" },
      { can: true, text: "Único que valida/reprova plano de ação item a item — podeValidarPlano() (Modal_PA/index.js:259)" },
      { can: true, text: "Ao salvar um plano tipo \"Logistica\", avança sozinho o status da APR para \"Aguardando Revisão\" (Modal_PA/index.js:379-380)" },
      { can: true, text: "Envia para operação após validar todos os planos, \"Aguardando Correção\" → \"Em Aberto\" (Open/index.js:677-702)" },
    ],
    transitions: [
      "Em Aberto/Revisado → Revisado",
      "Em Aberto/Revisado → Enviado / Enviado p/ Área",
      "Em Aberto/Revisado → Concluido",
      "Respondido pela Area → Concluido",
      "Aguardando Revisão → Concluido",
      "Aguardando Rev. PA → Enviado p/ Área",
      "Aguardando Rev. PA → Finalizado",
      "Aguardando Rev. PA → Enviado p/ Área (se reprova)",
      "(plano Logística) → Aguardando Revisão",
      "Aguardando Correção → Em Aberto",
    ],
  },
  {
    name: "administrador",
    tag: "admin",
    tagLabel: "Admin",
    desc: "Tudo que o revisor faz, mais acesso às rotas administrativas e o único que pode reverter status.",
    perms: [
      { can: true, text: "Todas as ações do revisor (aparece nas mesmas condições, sempre em conjunto)" },
      { can: true, text: "Único nível liberado nas rotas isAdm (Route.js:74-78): /profileadm, /new_site, /analytics-map, /manager-users, /manager-logs, /questions" },
      { can: true, text: "Único que executa rollback de status (updateStatusRollBack, tableDashboard.js:388-402)" },
    ],
    transitions: ["idênticas às do revisor", "qualquer → Em Aberto (rollback)"],
  },
  {
    name: "ponto_focal",
    tag: "log",
    tagLabel: "Logística",
    desc: "Recebe a APR com inconformidade e decide o tipo de tratativa. Não encerra a APR.",
    perms: [
      { can: true, text: "Define plano de ação, com foco na opção \"Logistica\" (SLA + comentário + anexos)" },
      { can: true, text: "Envia para monitoramento de SLA, revisão, ou devolve ao revisor (3 botões dedicados)" },
      { can: true, text: "Só enxerga, na listagem, APRs com status \"Enviado para Área Responsável\" (APRs/index.js:288-289)" },
      { can: false, text: "Não altera status ao salvar o plano de ação (Modal_PA/index.js:468-478 pula o update de status para este nível)" },
      { can: false, text: "Explicitamente bloqueado de encerrar a APR — comentário no próprio código confirma (Open/index.js:3036-3041)" },
    ],
    transitions: [
      "Aguardando Correção → Monitoramento SLA",
      "Enviado → Aguardando Revisão",
      "Enviado p/ Área → Aguardando Rev. PA",
    ],
  },
  {
    name: "supervisor",
    tag: "view",
    tagLabel: "Visualização",
    desc: "Papel apenas de leitura/filtro no dashboard — nenhuma ação de workflow encontrada.",
    perms: [
      { can: true, text: "Filtro de listagem por estado da regional (APRs/index.js:282-283)" },
      { can: false, text: "Nenhuma ocorrência de user.nivel === \"supervisor\" em Open/index.js, Modal_PA/index.js ou EmailLink.js" },
    ],
    transitions: ["nenhuma"],
  },
  {
    name: "auditor",
    tag: "view",
    tagLabel: "Visualização",
    desc: "Papel apenas de leitura/filtro, restrito a sites de auditoria — nenhuma ação de workflow encontrada.",
    perms: [
      { can: true, text: "Vê só APRs com site_id.tipoSite em \"AUDIT PGR FIXA\"/\"AUDIT PGR MOVEL\" (APRs/index.js:276-278)" },
      { can: false, text: "Nenhuma ocorrência de user.nivel === \"auditor\" nos 3 arquivos centrais do fluxo" },
    ],
    transitions: ["nenhuma"],
  },
];

const STATE_MACHINE_ROWS = [
  ["Em Aberto / Revisado", "Revisado", [["rev", "revisor"], ["admin", "admin"]], "revisado()", "EmailLink.js:845-879"],
  ["Em Aberto / Revisado", "Enviado / Enviado p/ Área", [["rev", "revisor"], ["admin", "admin"]], "sendEmail()", "EmailLink.js:478-626"],
  ["Em Aberto / Revisado", "Concluido", [["rev", "revisor"], ["admin", "admin"]], "concludeWithoutEmail()", "EmailLink.js:881-903"],
  ["Enviado para Área", "Respondido pela Area", [["rev", "revisor"], ["admin", "admin"]], "alterarPA() → updateAPR()", "Modal_PA/index.js:373-478"],
  ["(plano Logística)", "Aguardando Revisão", [["rev", "revisor"]], "updateAPRStatusLogistics()", "Modal_PA/index.js:379-380,873-885"],
  ["Enviado", "Aguardando Revisão", [["log", "ponto_focal"]], "enviarParaRevisao()", "Open/index.js:801-862"],
  ["Enviado para Área", "Aguardando Rev. Plano de Ação", [["log", "ponto_focal"]], "devolverParaRevisor()", "Open/index.js:865-925"],
  ["Aguardando Rev. Plano de Ação", "Enviado para Área (se reprova)", [["rev", "revisor"]], "UpdatePA()", "Modal_PA/index.js:411-466"],
  ["Aguardando Rev. Plano de Ação", "Enviado para Área", [["rev", "revisor"], ["admin", "admin"]], "devolverAprAoPontoFocal()", "Open/index.js:1125-1162"],
  ["Aguardando Rev. Plano de Ação", "Finalizado", [["rev", "revisor"], ["admin", "admin"]], "finalizarAPR()", "Open/index.js:1283-1341"],
  ["Aguardando Correção", "Monitoramento SLA", [["log", "ponto_focal"]], "enviarParaMonitoramento()", "Open/index.js:748-798"],
  ["Aguardando Correção", "Em Aberto", [["rev", "revisor"]], "enviarParaOperacao()", "Open/index.js:677-702"],
  ["Respondido pela Area", "Concluido", [["rev", "revisor"], ["admin", "admin"]], "updateStatusAPR()", "Open/index.js:623-645"],
  ["Aguardando Revisão", "Concluido", [["rev", "revisor"], ["admin", "admin"], ["op", "aplicador"]], "updateStatusAPR()", "Open/index.js:623-645"],
  ["Aguardando Correção (PA pendente)", "Aguardando Revisão", [["op", "aplicador"]], "confirmarResolucao() / finalizarCorrecoes()", "Modal_PA/index.js:1041-1125; Open/index.js:1414-1470"],
  ["qualquer", "Cancelado", [["rev", "revisor"], ["admin", "admin"]], "updateStatus()", "APRs/index.js:552-570"],
  ["qualquer", "Em Aberto (rollback)", [["admin", "admin (único)"]], "updateStatusRollBack()", "APRs/index.js:572-590"],
];

const ROOT_FIELDS_ROWS = [
  ["apr_id", <TypePill type="number">number</TypePill>, "ID sequencial via contador atômico em incrementID/currentID. Documentos legados podem ter esse valor como string — o código tem fallback para os dois tipos.", "New/index.js:836-845"],
  ["user_id", <TypePill type="object">object</TypePill>, "Objeto completo do usuário logado ({uid, nome, email, area, nivel, uf, status, regional, ...}) — não é uma referência, duplica o perfil inteiro em cada APR.", "New/index.js:883"],
  ["checklist_aplicado", <TypePill type="string">string</TypePill>, "Nome do checklist/tipo de site aplicado.", "New/index.js:886"],
  ["motivo_apr", <TypePill type="string">string</TypePill>, "Motivo/categoria da APR.", "New/index.js:888"],
  ["status", <TypePill type="string">string</TypePill>, "Etapa do workflow — ver enum e tabela de transições.", "múltiplos"],
  ["peso", <TypePill type="number">number</TypePill>, "Pontuação de risco somando question.peso das respostas fora do gabarito.", "New/index.js:895, 1134-1145"],
  ["created", <TypePill type="timestamp">timestamp</TypePill>, "Data/hora de criação, gravada como new Date() client-side (não serverTimestamp()).", "New/index.js:887"],
  ["valor_armazenamento / valor_transporte / valor_sinistro", <TypePill type="string">string</TypePill>, "Valores em centavos, checklist PGR.", "New/index.js:889-891"],
  ["valor_estoque / tipo_loja", <TypePill type="string">string</TypePill>, "Valor de estoque e tipo de loja, checklist LOJA.", "New/index.js:892-893"],
  ["checklist", <TypePill type="array">array</TypePill>, "Array [[nomeArea,[perguntas]], ...] — gravado num segundo update() logo após o add() inicial.", "New/index.js:1024-1053"],
];

const ROOT_DATES_ROWS = [
  ["data_alteracao", <TypePill type="timestamp">Date (client)</TypePill>, "Reescrito em quase toda transição — o mais confiável para \"última modificação\".", "Open/index.js, Modal_PA/index.js (9+ locais)"],
  ["data_envio_email", <TypePill type="timestamp">serverTimestamp</TypePill>, "Envio do e-mail de revisão.", "EmailLink.js:602"],
  ["data_revisao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Revisor marcou \"Revisado\" sem enviar e-mail.", "EmailLink.js:861"],
  ["data_conclusao_sem_email", <TypePill type="timestamp">serverTimestamp</TypePill>, "Conclusão sem necessidade de e-mail.", "EmailLink.js:887"],
  ["data_envio_monitoramento", <TypePill type="timestamp">serverTimestamp</TypePill>, "Envio para \"Monitoramento SLA\".", "Open/index.js:785"],
  ["data_envio_revisao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Ponto focal envia PAs definidos para revisão.", "Open/index.js:839"],
  ["data_devolucao_ponto_focal", <TypePill type="timestamp">serverTimestamp</TypePill>, "Ponto focal devolve ao revisor.", "Open/index.js:903"],
  ["data_ponto_focal_resposta", <TypePill type="timestamp">serverTimestamp</TypePill>, "Revisor finaliza PA de logística.", "Modal_PA/index.js:876"],
  ["data_finalizacao", <TypePill type="timestamp">serverTimestamp</TypePill>, "Órfão — só era gravado pela função exclusiva de revisor_logistica, removida junto com o papel. Pode existir em documentos antigos, mas nada grava esse campo hoje.", "removido de Open/index.js"],
  ["data_correcoes_completas", <TypePill type="timestamp">serverTimestamp</TypePill>, "Todas as correções concluídas.", "Modal_PA/index.js:1121"],
  ["data_correcao_aplicador", <TypePill type="timestamp">serverTimestamp</TypePill>, "Aplicador finaliza todas as correções.", "Open/index.js:1454"],
  ["terms", <TypePill type="boolean">boolean</TypePill>, "Aceite dos termos ao revisar/enviar e-mail.", "EmailLink.js:603, 860"],
  ["motivo_reprovacao", <TypePill type="string">string</TypePill>, "Parecer de reprovação do plano de ação.", "Modal_PA/index.js:455-456"],
  ["sla_ponto_focal", <TypePill type="timestamp">timestamp</TypePill>, "Somente leitura neste repositório — usado em Open/index.js:2891-2915 para alertas visuais (\"sla-active\"/\"sla-expired\"), mas nenhuma escrita encontrada. Provável origem: Cloud Function externa.", "Open/index.js:2891-2915"],
];

const SITE_ID_ROWS = [
  ["Nome", <TypePill type="string">string</TypePill>, "Nome do site/unidade"],
  ["Sigla / Sigla_GVT", <TypePill type="string">string</TypePill>, "Siglas de identificação do site"],
  ["Endereco / Bairro / Complemento / CEP", <TypePill type="string">string</TypePill>, "Endereço completo"],
  ["Estado / Cidade", <TypePill type="string">string</TypePill>, "UF e município"],
  ["Situacao", <TypePill type="string">string</TypePill>, "Situação cadastral do site"],
  ["critical", <TypePill type="string">string</TypePill>, "Criticidade do site"],
  ["tipoSite", <TypePill type="string">string</TypePill>, "Sempre sobrescrito na criação com o checklist selecionado."],
  ["tipoContrato / Detentora", <TypePill type="string">string</TypePill>, "Contrato e detentora do site"],
  ["Latitude / Longitude", <TypePill type="string">string</TypePill>, "Coordenadas cadastradas (PascalCase)"],
  ["geohash", <TypePill type="string">string</TypePill>, <>Geohash via <code>geofire-common</code></>],
  ["NonStop / CtCritica / ErbCritica / MapaCalor", <TypePill type="string">string/bool</TypePill>, "Flags de classificação usadas no cálculo de risco"],
  ["operador_logistico / 'Operador Logistico'", <TypePill type="string">string</TypePill>, "Duas grafias de chave coexistem em produção"],
  ["Cobertura_Seguro / 'Cobertura Seguro'", <TypePill type="string">string</TypePill>, "Duas grafias de chave coexistem em produção"],
  ["last_apr / last_motivo", <TypePill type="timestamp">timestamp / string</TypePill>, "Data e motivo da última APR aplicada nesse site"],
  ["lastUpdate / userLastUpdate", <TypePill type="timestamp">timestamp / string</TypePill>, "Auditoria da última atualização do cadastro"],
];

const LOCATION_CREATED_ROWS = [
  ["latitude", <TypePill type="number">number|null</TypePill>, <>Capturada via <code>navigator.geolocation</code></>],
  ["longitude", <TypePill type="number">number|null</TypePill>, "Em docs antigos gravada como logitude (typo)"],
  ["perimetro", <TypePill type="string">string</TypePill>, "Status textual do perímetro/geolocalização"],
];

const GEOLOCATION_INFO_ROWS = [
  ["enabled", <TypePill type="boolean">boolean</TypePill>, "Se a geolocalização foi obtida com sucesso"],
  ["justification", <TypePill type="string">string</TypePill>, "Justificativa quando não habilitada"],
  ["error", <TypePill type="string">string|null</TypePill>, "Mensagem de erro"],
];

const TEMPO_CONCLUSAO_ROWS = [
  ["inicio", <TypePill type="timestamp">timestamp</TypePill>, "Momento em que o formulário foi carregado"],
  ["conclusao", <TypePill type="timestamp">timestamp</TypePill>, "Momento do submit final"],
];

const JUSTIFICATIVA_ROWS = [
  ["motivo", <TypePill type="string">enum</TypePill>, "Ver valores abaixo"],
  ["desc", <TypePill type="string">string</TypePill>, "Descrição textual livre"],
  ["data_inativo", <TypePill type="string">string (data)</TypePill>, "Só quando motivo = \"Site Desativado\""],
];

const JUSTIFICATIVA_ENUM = [
  "Site Desativado",
  "Impedimento de Acesso",
  "Falta de mão-de-obra momentânea",
  "Raio de atuação até 300km",
  "Raio de atuação superior a 700km",
  "Falta de recursos",
];

const SUPLEMENTACAO_ROWS = [
  ["id / checklist_id", <TypePill type="string">string</TypePill>, "checklist_id sempre \"LOJA PROJ VENEZA\""],
  ["created", <TypePill type="timestamp">Date</TypePill>, "Data de criação"],
  ["adabas", <TypePill type="string">string</TypePill>, "Código ADABAS do site"],
  ["gerente", <TypePill type="object">{"{nome, email}"}</TypePill>, "Gerente responsável"],
  ["site_id", <TypePill type="object">object</TypePill>, "Site vinculado (mesmo shape da seção site_id)"],
  ["verify_manager", <TypePill type="string">string/imagem</TypePill>, "Selfie/comprovação do gerente"],
  ["tipo_loja / valor_estoque / peso", <TypePill type="string">misto</TypePill>, "Copiados da APR de origem"],
  ["checklist", <TypePill type="array">array</TypePill>, "Mesmo shape do checklist principal"],
];

const CHECKLIST_FIELDS_ROWS = [
  ["questionId / question", <TypePill type="string">string</TypePill>, "Identificação e texto da pergunta"],
  ["resp / respGabarito", <TypePill type="string">string</TypePill>, "Resposta dada / esperada — comparadas para achar inconformidade"],
  ["respTextArea / respInputNumber", <TypePill type="string">string</TypePill>, "Observação em texto / resposta numérica"],
  ["answers / optionList / optionListResp", <TypePill type="array">array</TypePill>, "Opções disponíveis / selecionadas"],
  ["isRequired / selectOptions / listCheck / inputNumber", <TypePill type="boolean">boolean</TypePill>, "Flags de configuração da pergunta"],
  ["areaResposavel", <TypePill type="array">array/string</TypePill>, "Área(s) responsável(is): oem, patrimonio, CMC, comercial, logistica"],
  ["imagesURL", <TypePill type="array">array {"{url, ref}"}</TypePill>, "Fotos anexadas"],
  ["openPA", <TypePill type="boolean">boolean</TypePill>, "Se abriu plano de ação"],
  ["plano_acao", <TypePill type="object">object</TypePill>, "Ver seção plano_acao"],
  ["valorArmazenado / valorEstoque / valorTransporte / ValorSinistro", <TypePill type="object">array/object</TypePill>, "Faixas de valor associadas à pergunta — capitalização inconsistente no último"],
  ["tipoLoja", <TypePill type="array">{"array<string>"}</TypePill>, "Tipos de loja para exibição condicional"],
  ["peso / peso_rct / peso_daef / peso_fmc / peso_icd", <TypePill type="number">number</TypePill>, "Pesos por tipo de checklist, join com coleção question"],
  ["resp_pa_selectedOption", <TypePill type="string">enum</TypePill>, "Sim / Não / Detentora / Patrimonio / Logistica"],
  ["resp_pa_data / resp_pa_user_name / resp_pa_user_id", <TypePill type="timestamp">misto</TypePill>, "Quem/quando definiu o plano"],
  ["resp_pa_status", <TypePill type="string">enum</TypePill>, "Concluido / Reprovado"],
  ["resp_pa_resolucao", <TypePill type="string">enum</TypePill>, "'sim' / 'nao' / null"],
  ["resp_pa_status_alterado / _data / _parecer", <TypePill type="string">misto</TypePill>, "Auditoria da validação do revisor"],
  ["resp_pa_validacao_imagens", <TypePill type="array">{"array<url>"}</TypePill>, "Evidências da validação final"],
  ["resp_pa_sla", <TypePill type="timestamp">timestamp</TypePill>, <>Somente leitura neste repositório (<code>Open/index.js:1806-1809</code>) — nunca gravado no código revisado.</>],
  ["images_correcao", <TypePill type="array">{"array<url>"}</TypePill>, "Fotos de correção do aplicador"],
  ["nota_parecer", <TypePill type="string">string</TypePill>, <>Legado — só lido como fallback; valor atual vive em <code>resp_pa_status_parecer</code></>],
];

const PLANO_ACAO_OPTION_ROWS = [
  ["Sim", <><code>tempo</code> (data), <code>comentario</code></>],
  ["Não", <><code>justificativa</code> (enum: Instalada solução similar / Sem orçamento / Solução em desacordo / Discordância de necessidade), <code>comentario</code></>],
  ["Detentora", <><code>nome_detentora</code>, <code>numero_chamado</code>, <code>comentario</code></>],
  ["Patrimonio", <><code>numero_chamado</code>, <code>comentario</code></>],
  ["Logistica", <><code>sla_logistica</code> (timestamp, SLA de 2 semanas), <code>comentario</code>, <code>historico_logistica</code> (array)</>],
];

const PLANO_ACAO_COMMON_ROWS = [
  ["historico_logistica[]", <TypePill type="array">array {"{data, usuario, sla, comentario}"}</TypePill>, "Cada redefinição de SLA empurra o valor anterior pra cá"],
  ["anexo_url / anexo_nome", <TypePill type="string">string</TypePill>, "Anexo único — formato legado"],
  ["anexos[]", <TypePill type="array">array {"{url, nome, data}"}</TypePill>, "Lista de múltiplos anexos — formato atual"],
  ["evidencia_url / evidencia_nome", <TypePill type="string">string</TypePill>, "Evidência do aplicador"],
  ["resolvido / resolvido_por / resolvido_por_id / resolvido_data", <TypePill type="boolean">misto</TypePill>, "Confirmação de resolução pelo aplicador"],
  ["nova_resposta / imagens_correcao / comentario_correcao", <TypePill type="string">misto</TypePill>, "Dados da correção"],
];

const LOG_ROWS = [
  ["event", <TypePill type="string">string</TypePill>, "Descrição textual do evento (ex: \"APR revisada e enviado por e-mail\")"],
  ["user", <TypePill type="string">string</TypePill>, "Nome do usuário que gerou o evento"],
  ["chamado", <TypePill type="string">string</TypePill>, <>ID/referência relacionada (geralmente o ID da APR); <code>""</code> se não informado</>],
  ["destinatario", <TypePill type="string">string</TypePill>, <>Destinatário relacionado (ex: e-mails); <code>""</code> se não informado</>],
  ["ip", <TypePill type="string">string</TypePill>, <>IP do usuário, obtido via <code>api.ipify.org</code> no momento do evento</>],
  ["data", <TypePill type="timestamp">Date (client)</TypePill>, "Data/hora do evento"],
  ["rota", <TypePill type="string">string</TypePill>, "URL completa da página onde o evento ocorreu"],
];

const OFFLINE_ROWS = [
  ["id / timestamp", <TypePill type="string">string/number</TypePill>, "Local apenas"],
  ["user", <TypePill type="object">object</TypePill>, <code>user_id</code>],
  ["siteInfo", <TypePill type="object">object</TypePill>, <code>site_id</code>],
  ["selectedChecklist", <TypePill type="string">string</TypePill>, <code>checklist_aplicado</code>],
  ["motivoAPR", <TypePill type="string">string</TypePill>, <code>motivo_apr</code>],
  ["valorArmazenamento / valorTransporte / valorSinistro / valorEstoque / tipoLoja", <TypePill type="string">misto</TypePill>, "equivalentes snake_case"],
  ["geolocationEnabled / geolocationJustification / geolocationError", <TypePill type="boolean">misto</TypePill>, <code>geolocation_info.{"{enabled,justification,error}"}</code>],
  ["location", <TypePill type="object">object</TypePill>, <code>locationCreated.{"{latitude,longitude}"}</code>],
  ["inicio", <TypePill type="timestamp">Date</TypePill>, <code>tempoConclusao.inicio</code>],
  ["questions[]", <TypePill type="array">array</TypePill>, <>
    <code>checklist</code> — imagens serializadas como dataURL base64
  </>],
];

const USERS_ROWS = [
  ["nivel", <TypePill type="string">enum</TypePill>, "Ver seção Papéis de usuário"],
  ["status", <TypePill type="boolean">boolean</TypePill>, "Usuário ativo"],
  ["area / regional", <TypePill type="string">string</TypePill>, "Área e restrição de UF na visualização"],
];

const ATRIBUICOES_ROWS = [
  ["status", <TypePill type="string">string</TypePill>, "Ex: \"Solicitado\", \"APR Criada\""],
  ["atribuido_id", <TypePill type="string">string (uid)</TypePill>, "Usuário atribuído"],
  ["created / link", <TypePill type="timestamp">misto</TypePill>, "Data de criação e rota de destino"],
];

export default function Documentation() {
  useEffect(() => {
    addBodyClass("page-documentation");
  }, []);

  return (
    <div>
      <Header name="Documentação" subtitle="Dicionário de dados e workflow da APR" />

      <div className="content">
        <div className="documentation-page">
          <div className="doc-layout">
            <nav className="doc-toc">
              <div className="doc-group-label">Visão geral</div>
              <a href="#status-enum">Todos os status atuais</a>
              <a href="#flat-list">Lista consolidada de campos</a>

              <div className="doc-group-label">Papéis &amp; fluxo</div>
              <a href="#roles">Papéis de usuário</a>
              <a href="#flow">Fluxo ponta a ponta</a>
              <a href="#state-machine">Tabela de transições</a>

              <div className="doc-group-label">aprs-producao — raiz</div>
              <a href="#root-fields">Campos de identificação</a>
              <a href="#root-dates">Datas de workflow</a>
              <a href="#site-id">site_id</a>
              <a href="#geo">Geolocalização &amp; tempo</a>
              <a href="#justificativa">justificativa</a>
              <a href="#suplementacao">suplementacao</a>

              <div className="doc-group-label">checklist[] — por pergunta</div>
              <a href="#checklist-fields">Campos da pergunta</a>
              <a href="#plano-acao">plano_acao</a>

              <div className="doc-group-label">Outras coleções</div>
              <a href="#log">Coleção log</a>
              <a href="#offline">Armazenamento offline</a>
              <a href="#related">Coleções relacionadas</a>
            </nav>

            <main className="doc-main">
              <header className="doc-hero" id="overview">
                <div className="doc-eyebrow">Levantamento direto do código-fonte</div>
                <h1>Dicionário de dados e workflow da APR</h1>
                <p className="doc-lede">
                  Todos os campos gravados na coleção <code>aprs-producao</code> (e coleções de apoio), todos os
                  valores de <code>status</code> em uso hoje, os 6 papéis de usuário e exatamente o que cada um pode
                  fazer, e o fluxo completo ponta a ponta da APR — da criação até o encerramento.
                </p>
                <div className="doc-meta">
                  <span>Coleção principal <code>aprs-producao</code></span>
                  <span>React + Firestore</span>
                  <span>Papéis (<code>users.nivel</code>): 6</span>
                </div>
                <div className="doc-stat-row">
                  <div className="doc-stat"><div className="doc-num">6</div><div className="doc-lbl">papéis de usuário</div></div>
                  <div className="doc-stat"><div className="doc-num">13</div><div className="doc-lbl">status ativos</div></div>
                  <div className="doc-stat"><div className="doc-num">2</div><div className="doc-lbl">fluxos principais</div></div>
                </div>
              </header>

              <section className="doc-section" id="status-enum">
                <h2>Todos os status atuais <span className="doc-collection-tag">aprs-producao.status</span></h2>
                <p className="doc-section-note">Valor canônico de cada etapa, como o código grava hoje.</p>
                <div className="doc-status-flow">
                  {STATUS_CHIPS.map((s) => (
                    <span key={s.label} className={`doc-status-chip ${s.variant ? `doc-${s.variant}` : ""}`}>{s.label}</span>
                  ))}
                </div>
                <p className="doc-section-note" style={{ marginTop: 14 }}>
                  <span className="doc-status-chip doc-warn" style={{ padding: "2px 8px" }}>borda laranja</span> = status lido/checado no código mas sem nenhuma escrita (.update) correspondente encontrada em todo o repositório.{" "}
                  <span className="doc-status-chip doc-dead" style={{ padding: "2px 8px" }}>tracejado</span> = estado de trânsito sem ação genérica de saída dentro do escopo revisado.{" "}
                  <span className="doc-status-chip doc-done" style={{ padding: "2px 8px" }}>verde</span> = estado final.
                </p>
              </section>

              <section className="doc-section" id="flat-list">
                <h2>Lista consolidada de campos <span className="doc-collection-tag">todos os campos, um só lugar</span></h2>
                <p className="doc-section-note">
                  Todo campo gravado em <code>aprs-producao</code>, achatado numa lista única com notação de ponto
                  para aninhamento. <code>checklist[].</code> = campo por pergunta; <code>checklist[].plano_acao.</code>{" "}
                  = sub-objeto do plano de ação daquela pergunta. Detalhes e origem de cada campo estão nas seções
                  abaixo, organizadas por objeto.
                </p>
                <DataTable head={["Campo", "Tipo", "O que é / faz"]} rows={FLAT_FIELDS} />
              </section>

              <section className="doc-section" id="roles">
                <h2>Papéis de usuário <span className="doc-collection-tag">users.nivel</span></h2>
                <p className="doc-section-note">
                  Cada card lista exatamente o que o código libera e bloqueia para esse papel, com arquivo:linha. Onde
                  não há nenhuma ação de workflow, isso é dito diretamente em vez de presumir.
                </p>

                <div className="doc-role-grid">
                  {ROLES.map((role) => (
                    <div className="doc-role-card" key={role.name}>
                      <div className="doc-role-head">
                        <span className="doc-role-name">{role.name}</span>
                        <span className={`doc-role-tag doc-${role.tag}`}>{role.tagLabel}</span>
                      </div>
                      <p className="doc-role-desc">{role.desc}</p>
                      <ul className="doc-perm">
                        {role.perms.map((p, i) => (
                          <li key={i} className={p.can ? "doc-can" : "doc-cannot"}>{p.text}</li>
                        ))}
                      </ul>
                      <div className="doc-role-transitions">
                        <div className="doc-t-label">Transições que dispara</div>
                        {role.transitions.map((t, i) => (
                          <span className="doc-transition-chip" key={i}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="doc-callout doc-neutral" style={{ marginTop: 20 }}>
                  <div className="doc-callout-head">Papel revisor_logistica removido</div>
                  <p>
                    O nível <code>revisor_logistica</code> foi eliminado do sistema — o <code>revisor</code> absorveu
                    todas as suas capacidades (validar/reprovar plano de ação item a item, avançar status ao definir
                    plano de Logística, enviar para operação). A restrição que limitava esse papel a sites "PGR" e a
                    interface simplificada exclusiva foram removidas, não migradas — o revisor mantém a visibilidade
                    e a tela cheia que já tinha.
                  </p>
                </div>

                <div className="doc-callout" style={{ marginTop: 12 }}>
                  <div className="doc-callout-head">Duas particularidades de permissão que valem atenção</div>
                  <p>
                    <strong>Menu vs. rota:</strong> o menu mostra "Mapa Analytics" para <code>auditor</code> e{" "}
                    <code>revisor</code>, mas a rota é <code>isAdm</code> — só <code>administrador</code> entra de
                    fato. Esses papéis veem o link e são redirecionados ao clicar.
                  </p>
                  <p>
                    <strong>Aplicador encerrando a própria APR:</strong> o botão "Encerrar APR" em{" "}
                    <code>Open/index.js:3037-3041</code> inclui <code>aplicador</code> junto com{" "}
                    <code>revisor</code>/<code>administrador</code> quando o status é "Aguardando Revisão" — ou seja,
                    o próprio aplicador pode aprovar o encerramento do seu trabalho.
                  </p>
                </div>
              </section>

              <section className="doc-section" id="flow">
                <h2>Fluxo ponta a ponta</h2>
                <p className="doc-section-note">Dois caminhos reais no código, mais um ramo de SLA incompleto no repositório.</p>

                <h3>Caminho curto — sem inconformidade</h3>
                <div className="doc-flow">
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Em Aberto</div>
                    <div className="doc-fn-action">Aplicador cria a APR e preenche o checklist — New/index.js:859,894</div>
                    <div className="doc-fn-actor"><RoleChip role="op" label="aplicador" /></div>
                  </div>
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Em Aberto / Revisado</div>
                    <div className="doc-fn-action">Revisor abre o checklist no EmailLink: zero inconformidades detectadas → botão único "Concluir" — EmailLink.js:881-903</div>
                    <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                  </div>
                  <div className="doc-flow-node doc-end">
                    <div className="doc-fn-status">Concluido</div>
                    <div className="doc-fn-action">Fim do caminho curto.</div>
                  </div>
                </div>
                <div className="doc-callout doc-neutral">
                  <div className="doc-callout-head">Variante sem saída mapeada</div>
                  <p>
                    Se o revisor enviar e-mail mesmo sem inconformidade, o status vai para "Enviado"
                    (EmailLink.js:597,600) — dentro do código revisado, nenhuma ação genérica avança esse status
                    adiante (só o botão específico do ponto_focal para APRs com inconformidade, que não é o caso aqui).
                  </p>
                </div>

                <h3>Caminho longo — com inconformidade</h3>
                <div className="doc-flow">
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Em Aberto</div>
                    <div className="doc-fn-action">Aplicador cria a APR</div>
                    <div className="doc-fn-actor"><RoleChip role="op" label="aplicador" /></div>
                  </div>
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Revisado (opcional)</div>
                    <div className="doc-fn-action">Revisor detecta inconformidade e pode marcar "Revisado" antes de enviar e-mail — EmailLink.js:845-879</div>
                    <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                  </div>
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Enviado para Área Responsável</div>
                    <div className="doc-fn-action">E-mail enviado às áreas responsáveis pelas inconformidades — EmailLink.js:580-604</div>
                    <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                  </div>
                  <div className="doc-flow-node">
                    <div className="doc-fn-status">Definição do plano de ação</div>
                    <div className="doc-fn-action">
                      ponto_focal define tratativa "Logistica" (sem mudar status) · revisor/administrador definem as
                      demais opções → status vira "Respondido pela Area" · revisor define "Logistica" e avança
                      sozinho para "Aguardando Revisão"
                    </div>
                    <div className="doc-fn-actor"><RoleChip role="log" label="ponto_focal" /><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                  </div>

                  <div className="doc-flow-branch-label">Ramo A — tratativa comum (não logística)</div>
                  <div className="doc-flow">
                    <div className="doc-flow-node">
                      <div className="doc-fn-status">Respondido pela Area</div>
                      <div className="doc-fn-action">revisor/administrador encerram (updateStatusAPR)</div>
                      <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                    </div>
                    <div className="doc-flow-node doc-end">
                      <div className="doc-fn-status">Concluido</div>
                      <div className="doc-fn-action">Fim do ramo A.</div>
                    </div>
                  </div>

                  <div className="doc-flow-branch-label">Ramo B — tratativa via ponto focal</div>
                  <div className="doc-flow">
                    <div className="doc-flow-node">
                      <div className="doc-fn-status">Aguardando Revisão Plano de Ação</div>
                      <div className="doc-fn-action">Ponto focal devolve ao revisor (devolverParaRevisor) — Open/index.js:865-925</div>
                      <div className="doc-fn-actor"><RoleChip role="log" label="ponto_focal" /></div>
                    </div>
                    <div className="doc-flow-node">
                      <div className="doc-fn-status">Validação item a item</div>
                      <div className="doc-fn-action">revisor aprova ou reprova cada pergunta (UpdatePA) — se reprova, volta sozinho para "Enviado para Área Responsável" e repete o Ramo B</div>
                      <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /></div>
                    </div>
                    <div className="doc-flow-node">
                      <div className="doc-fn-status">Decisão final do revisor</div>
                      <div className="doc-fn-action">Devolve ao ponto focal de novo (repete o ciclo) ou finaliza — Open/index.js:1125-1341</div>
                      <div className="doc-fn-actor"><RoleChip role="rev" label="revisor" /><RoleChip role="admin" label="administrador" /></div>
                    </div>
                    <div className="doc-flow-node doc-end">
                      <div className="doc-fn-status">Finalizado</div>
                      <div className="doc-fn-action">Fim do ramo B — exige SLA de logística preenchido em todos os planos.</div>
                    </div>
                  </div>
                </div>

                <h3>Ramo de SLA / Monitoramento — incompleto neste repositório</h3>
                <div className="doc-callout">
                  <div className="doc-callout-head">Transições sem escrita correspondente encontrada</div>
                  <p>
                    "Aguardando Correção" é lido e checado em vários pontos do código, mas nenhuma instrução{" "}
                    <code>.update(&#123;status:"Aguardando Correção"&#125;)</code> existe em todo o repositório.{" "}
                    ponto_focal pode avançar dessa etapa para "Monitoramento SLA" (enviarParaMonitoramento,
                    Open/index.js:748-798), mas nenhum botão reage de volta a "Monitoramento SLA" dentro dos arquivos
                    revisados.
                  </p>
                  <p>
                    <code>WORKFLOW_SLA_MONITORING.md</code> descreve um sistema de alertas automáticos e
                    encerramento pelo ponto focal — mas essa parte não tem correspondência de código neste repo (não
                    há pasta <code>functions/</code>). Provável que uma Cloud Function externa complete esse ciclo.
                    Também explica os campos órfãos <code>sla_ponto_focal</code> e <code>resp_pa_sla</code>, lidos na
                    tela mas nunca gravados aqui.
                  </p>
                </div>
              </section>

              <section className="doc-section" id="state-machine">
                <h2>Tabela de transições <span className="doc-collection-tag">referência da máquina de estados</span></h2>
                <DataTable
                  head={["De", "Para", "Quem", "Função", "Origem"]}
                  fieldCol={0}
                  descCol={-1}
                  originCol={4}
                  rows={STATE_MACHINE_ROWS.map(([from, to, who, fn, origin]) => [
                    from,
                    to,
                    <>
                      {who.map(([role, label], i) => (
                        <RoleChip role={role} label={label} key={i} />
                      ))}
                    </>,
                    fn,
                    origin,
                  ])}
                />
              </section>

              <section className="doc-section" id="root-fields">
                <h2>Campos de identificação <span className="doc-collection-tag">raiz do documento</span></h2>
                <DataTable head={["Campo", "Tipo", "Descrição", "Origem"]} descCol={2} originCol={3} rows={ROOT_FIELDS_ROWS} />
                <p className="doc-section-note" style={{ marginTop: 12 }}>
                  <code>cleanFirebaseData()</code> remove recursivamente toda chave undefined/null antes de gravar —
                  campos opcionais vazios não existem no documento, em vez de existirem como null (strings vazias{" "}
                  <code>""</code> são preservadas).
                </p>
              </section>

              <section className="doc-section" id="root-dates">
                <h2>Datas de workflow <span className="doc-collection-tag">raiz do documento</span></h2>
                <p className="doc-section-note">Cada transição de etapa grava seu próprio timestamp — não há um log de histórico único.</p>
                <DataTable head={["Campo", "Tipo", "Quando é gravado", "Origem"]} descCol={2} originCol={3} rows={ROOT_DATES_ROWS} />
              </section>

              <section className="doc-section" id="site-id">
                <h2>site_id <span className="doc-collection-tag">objeto aninhado</span></h2>
                <p className="doc-section-note">
                  Cópia completa do documento <code>sites/{"{id}"}</code> no momento da criação, mais o campo{" "}
                  <code>tipoSite</code> sobrescrito com o checklist selecionado. Editar o site (ModalEditSite.js)
                  substitui o objeto inteiro, não mescla parcialmente.
                </p>
                <DataTable head={["Subcampo", "Tipo", "Descrição"]} rows={SITE_ID_ROWS} />
              </section>

              <section className="doc-section" id="geo">
                <h2>Geolocalização &amp; tempo <span className="doc-collection-tag">objetos aninhados</span></h2>
                <div className="doc-two-col">
                  <div>
                    <h3>locationCreated</h3>
                    <DataTable head={["Campo", "Tipo", "Descrição"]} rows={LOCATION_CREATED_ROWS} />
                    <h3>geolocation_info</h3>
                    <DataTable head={["Campo", "Tipo", "Descrição"]} rows={GEOLOCATION_INFO_ROWS} />
                  </div>
                  <div>
                    <h3>tempoConclusao</h3>
                    <DataTable head={["Campo", "Tipo", "Descrição"]} rows={TEMPO_CONCLUSAO_ROWS} />
                  </div>
                </div>
              </section>

              <section className="doc-section" id="justificativa">
                <h2>justificativa <span className="doc-collection-tag">objeto | string vazia</span></h2>
                <p className="doc-section-note">
                  Preenchido na criação quando a APR é aberta com exceção. Quando ausente, gravado como{" "}
                  <code>""</code>, não <code>null</code>.
                </p>
                <DataTable head={["Subcampo", "Tipo", "Descrição"]} rows={JUSTIFICATIVA_ROWS} />
                <ul className="doc-enum-list">
                  {JUSTIFICATIVA_ENUM.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </section>

              <section className="doc-section" id="suplementacao">
                <h2>suplementacao <span className="doc-collection-tag">objeto — Projeto Veneza</span></h2>
                <p className="doc-section-note">Gravado via transação, substitui o objeto inteiro.</p>
                <DataTable head={["Subcampo", "Tipo", "Descrição"]} rows={SUPLEMENTACAO_ROWS} />
              </section>

              <section className="doc-section" id="checklist-fields">
                <h2>Campos por pergunta <span className="doc-collection-tag">checklist[i][1][j]</span></h2>
                <DataTable head={["Campo", "Tipo", "Descrição"]} rows={CHECKLIST_FIELDS_ROWS} />
              </section>

              <section className="doc-section" id="plano-acao">
                <h2>plano_acao <span className="doc-collection-tag">sub-objeto por pergunta</span></h2>
                <DataTable head={["Opção", "Campos específicos"]} descCol={1} rows={PLANO_ACAO_OPTION_ROWS} />
                <h3>Campos comuns adicionais</h3>
                <DataTable head={["Campo", "Tipo", "Descrição"]} rows={PLANO_ACAO_COMMON_ROWS} />
              </section>

              <section className="doc-section" id="log">
                <h2>Coleção log <span className="doc-collection-tag">auditoria — fora de aprs-producao</span></h2>
                <p className="doc-section-note">
                  Toda ação relevante do sistema (revisão, envio de e-mail, exportação de relatório, cancelamento,
                  edição de contato) chama <code>logSistem()</code>, que grava um documento aqui.
                </p>
                <DataTable head={["Campo", "Tipo", "Descrição"]} rows={LOG_ROWS} />
                <p className="doc-section-note" style={{ marginTop: 12 }}>
                  Origem: <code>src/contexts/auth.js:565-596</code>. Lido/filtrado em{" "}
                  <code>src/pages/LogManager/index.js</code> (busca por usuário ou por data) e{" "}
                  <code>src/components/Modal_Logs/index.js</code>.
                </p>
              </section>

              <section className="doc-section" id="offline">
                <h2>Armazenamento offline <span className="doc-collection-tag">localStorage — fora do Firestore</span></h2>
                <p className="doc-section-note">
                  Chave <code>localStorage["offline_aprs"]</code> (rascunhos) e{" "}
                  <code>sessionStorage["edit_offline_apr"]</code> (sessão ativa). Os nomes de campo aqui não são os
                  mesmos do Firestore — o remapeamento acontece só na gravação definitiva. Não existe campo de
                  "sincronizado": o pendente é inferido pela presença no array.
                </p>
                <DataTable head={["Campo offline", "Tipo", "Equivalente no Firestore"]} rows={OFFLINE_ROWS} />
              </section>

              <section className="doc-section" id="related">
                <h2>Coleções relacionadas</h2>
                <h3>users</h3>
                <DataTable head={["Campo", "Tipo", "Descrição"]} rows={USERS_ROWS} />

                <h3>atribuicoes</h3>
                <DataTable head={["Campo", "Tipo", "Descrição"]} rows={ATRIBUICOES_ROWS} />
                <p className="doc-section-note">
                  Nenhuma tela deste repositório cria novas atribuições — só há <code>.update()</code> em{" "}
                  <code>New/index.js:624-632</code>. A criação provavelmente é manual ou via outro serviço não
                  incluído aqui.
                </p>

                <h3>contact_email (pontoFocalConfig)</h3>
                <p className="doc-section-note">
                  Doc ID = <code>&#123;ESTADO&#125;-&#123;MUNICIPIO&#125;</code> ou <code>revisor_logistica</code>{" "}
                  (esse último é só um endereço de e-mail de notificação de logística — não tem relação com o papel
                  de usuário removido). Campos: <code>nome</code>, <code>descricao</code>, <code>ativo</code>,{" "}
                  <code>created_at</code>, <code>updated_at</code>, e até 9 variantes de e-mail por área (
                  <code>email_ponto_focal</code>, <code>email_logistica</code>, <code>email_armazenamento</code>,{" "}
                  <code>email_transporte</code>, <code>email_oem</code>, <code>email_patrimonial</code>,{" "}
                  <code>email_predial</code>, entre outras).
                </p>

                <h3>incrementID/currentID</h3>
                <p className="doc-section-note">
                  Documento único com campo <code>ID</code> (number), incrementado atomicamente para gerar cada{" "}
                  <code>apr_id</code>.
                </p>
              </section>

              <footer className="doc-footer">
                Copyright @2026 - APR Digital - Segurança empresarial - Vivo
              </footer>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
