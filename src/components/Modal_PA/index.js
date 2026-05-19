import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";
import Webcam from "react-webcam";
import { FiCheck, FiX, FiCamera } from "react-icons/fi";

// MUI
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  MenuItem,
  Link,
  Typography,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { Download, CloudUpload, Description, Image, PictureAsPdf, AudioFile, VideoLibrary, ArchiveOutlined, InsertDriveFile } from "@mui/icons-material";

export default function Modal_PA({
  checklist,
  firebase,
  conteudo,
  close,
  area,
  tipoSite,
  loadApr,
  apr,
}) {
  const base = "aprs-producao";

  const [tempo, setTempo] = useState("");
  const [comentario, setComentario] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0: Plano de ação, 1: OEM (para revisor)
  // Estados para OEM (aba separada)
  const [selectedOptionOEM, setSelectedOptionOEM] = useState("");
  const [comentarioOEM, setComentarioOEM] = useState("");
  const [justificativaOEM, setJustificativaOEM] = useState("");
  const [nomeDetentoraOEM, setNomeDetentoraOEM] = useState("");
  const [numeroChamadoOEM, setNumeroChamadoOEM] = useState("");
  // Fim estados OEM
  const [nomeDetentora, setNomeDetentora] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [slaLogistica, setSlaLogistica] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notaParecer, setNotaParecer] = useState("");
  const [resolucaoInconformidade, setResolucaoInconformidade] = useState(null); // 'sim', 'nao' ou null
  const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
  const [novaResposta, setNovaResposta] = useState("");
  const [novasImagens, setNovasImagens] = useState([]);
  const [comentarioCorrecao, setComentarioCorrecao] = useState("");
  const [historicoLocal, setHistoricoLocal] = useState(conteudo?.plano_acao?.historico_logistica || []);
  const [showCamera, setShowCamera] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [anexosLocal, setAnexosLocal] = useState(conteudo?.plano_acao?.anexos || []);
  const [planoAcaoLocal, setPlanoAcaoLocal] = useState(conteudo?.plano_acao || {});
  const [respPASelectedOptionLocal, setRespPASelectedOptionLocal] = useState(
    conteudo?.resp_pa_selectedOption || ""
  );
  const [arquivosSelecionados, setArquivosSelecionados] = useState([]);
  const webcamRef = useRef(null);
  const inputFileRef = useRef(null);

  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const index = checklist[area][1].findIndex(
    (object) => object?.question === conteudo.question
  );

  // Função para retornar ícone baseado na extensão do arquivo
  function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
      // Documentos
      'pdf': <PictureAsPdf sx={{ color: '#d32f2f', fontSize: '1.5rem' }} />,
      'doc': <Description sx={{ color: '#1976d2', fontSize: '1.5rem' }} />,
      'docx': <Description sx={{ color: '#1976d2', fontSize: '1.5rem' }} />,
      'txt': <Description sx={{ color: '#666', fontSize: '1.5rem' }} />,
      'xls': <Description sx={{ color: '#388e3c', fontSize: '1.5rem' }} />,
      'xlsx': <Description sx={{ color: '#388e3c', fontSize: '1.5rem' }} />,
      'ppt': <Description sx={{ color: '#f57c00', fontSize: '1.5rem' }} />,
      'pptx': <Description sx={{ color: '#f57c00', fontSize: '1.5rem' }} />,
      // Imagens
      'jpg': <Image sx={{ color: '#9c27b0', fontSize: '1.5rem' }} />,
      'jpeg': <Image sx={{ color: '#9c27b0', fontSize: '1.5rem' }} />,
      'png': <Image sx={{ color: '#9c27b0', fontSize: '1.5rem' }} />,
      'gif': <Image sx={{ color: '#9c27b0', fontSize: '1.5rem' }} />,
      'bmp': <Image sx={{ color: '#9c27b0', fontSize: '1.5rem' }} />,
      // Áudio
      'mp3': <AudioFile sx={{ color: '#e91e63', fontSize: '1.5rem' }} />,
      'wav': <AudioFile sx={{ color: '#e91e63', fontSize: '1.5rem' }} />,
      'm4a': <AudioFile sx={{ color: '#e91e63', fontSize: '1.5rem' }} />,
      // Vídeo
      'mp4': <VideoLibrary sx={{ color: '#ff6f00', fontSize: '1.5rem' }} />,
      'avi': <VideoLibrary sx={{ color: '#ff6f00', fontSize: '1.5rem' }} />,
      'mkv': <VideoLibrary sx={{ color: '#ff6f00', fontSize: '1.5rem' }} />,
      'mov': <VideoLibrary sx={{ color: '#ff6f00', fontSize: '1.5rem' }} />,
      // Comprimidos
      'zip': <ArchiveOutlined sx={{ color: '#ff9800', fontSize: '1.5rem' }} />,
      'rar': <ArchiveOutlined sx={{ color: '#ff9800', fontSize: '1.5rem' }} />,
      '7z': <ArchiveOutlined sx={{ color: '#ff9800', fontSize: '1.5rem' }} />,
    };
    
    return iconMap[ext] || <InsertDriveFile sx={{ color: '#757575', fontSize: '1.5rem' }} />;
  }

  useEffect(() => {
    function loadConstants() {
      // Se for revisor_logistica, ativar aba de Plano de Ação (0) automaticamente
      if (user.nivel === "revisor_logistica") {
        setActiveTab(0);
      }

      setTempo(conteudo?.plano_acao?.tempo || "");
      // Ponto focal deve sempre deixar em branco para redefinir
      if (user.nivel === "ponto_focal") {
        setComentario("");
        setSlaLogistica("");
      } else {
        // Todos os outros (revisor, revisor_logistica, administrador) carregam e podem editar
        setComentario(conteudo?.plano_acao?.comentario || "");
        if (conteudo?.plano_acao?.sla_logistica) {
          setSlaLogistica(new Date(conteudo.plano_acao.sla_logistica.toDate()).toISOString().split('T')[0]);
        } else {
          setSlaLogistica("");
        }
      }

      const defaultOption =
        user.nivel === "revisor_logistica" || user.nivel === "ponto_focal"
          ? "Logistica"
          : "";
      setSelectedOption(
        conteudo?.resp_pa_selectedOption || conteudo?.plano_acao?.selectedOption || defaultOption
      );
      setJustificativa(conteudo?.plano_acao?.justificativa || "");
      setNomeDetentora(conteudo?.plano_acao?.nome_detentora || "");
      setNumeroChamado(conteudo?.plano_acao?.numero_chamado || "");
      setNotaParecer(conteudo?.nota_parecer || "");
      setResolucaoInconformidade(conteudo?.resp_pa_resolucao || null);
      setHistoricoLocal(conteudo?.plano_acao?.historico_logistica || []);
      setPlanoAcaoLocal(conteudo?.plano_acao || {});
      setRespPASelectedOptionLocal(
        conteudo?.resp_pa_selectedOption || conteudo?.plano_acao?.selectedOption || defaultOption
      );
      const anexosCarregados = conteudo?.plano_acao?.anexos || [];
      console.log("📎 Anexos carregados do conteudo:", anexosCarregados);
      setAnexosLocal(anexosCarregados);
    }

    loadConstants();
  }, [conteudo, user.nivel]);

  // Debug: Log dos estados importantes
  useEffect(() => {
    console.log(
      "🔍 State Modal_PA - slaLogistica:",
      slaLogistica,
      "| comentario:",
      comentario,
      "| selectedOption:",
      selectedOption,
      "| user.nivel:",
      user.nivel
    );
  }, [slaLogistica, comentario, selectedOption]);

  // Debug: Log quando arquivos selecionados mudam
  useEffect(() => {
    console.log("📋 Estado arquivosSelecionados atualizado:", arquivosSelecionados);
  }, [arquivosSelecionados]);

  // Variável para bloquear edição baseada no usuário e status
  // Revisor, revisor_logistica e administrador podem sempre editar o SLA e comentário da opção Logística
  // Ponto focal também pode editar para adicionar/alterar SLAs
  // Para revisor_logistica, isReadOnly só é true se a pergunta já tem um plano de ação definido (para mostrar o botão Validar)
  const isReadOnly = conteudo?.resp_pa_selectedOption && 
    user.nivel !== "revisor_logistica" && 
    user.nivel !== "ponto_focal" &&
    !((user.nivel === "revisor" || user.nivel === "administrador") && conteudo?.resp_pa_selectedOption === "Logistica");

  // Modo visualização: mostrar histórico completo quando APR está em status final
  // Revisor_logistica e ponto_focal não entram em modo visualização pois precisam continuar definindo SLAs
  const statusVisualizacao = ["Revisado", "Enviado", "Concluido", "Respondido pela Area"];
  const isModoVisualizacao = statusVisualizacao.includes(apr.status) && conteudo?.resp_pa_selectedOption && 
    user.nivel !== "revisor_logistica" && user.nivel !== "ponto_focal";

  // Função para verificar se todos os planos de ação foram definidos
  function todosOsPlanosForamDefinidos() {
    const checklist = apr.checklist;
    let todosDefinidos = true;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.resp !== question.respGabarito;

        // Se tem inconformidade mas não tem plano de ação definido
        if (hasInconformity && !question.resp_pa_selectedOption) {
          todosDefinidos = false;
        }
      });
    });

    return todosDefinidos;
  }

  // Função para verificar se todos os planos de SLA foram preenchidos (para ponto_focal)
  function todosPlanosComSLAPreenchido() {
    const checklist = apr.checklist;
    let todosPlanosComSLA = true;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.resp !== question.respGabarito;

        // Se tem inconformidade e é do tipo Logistica, deve ter SLA preenchido
        if (hasInconformity && question.resp_pa_selectedOption === "Logistica") {
          if (!question.conteudo?.plano_acao?.sla_logistica) {
            todosPlanosComSLA = false;
          }
        }
      });
    });

    return todosPlanosComSLA;
  }

  // Função para verificar se o revisor pode validar (quando status for Aguardando Revisão Plano de Ação)
  function podeValidarPlano() {
    return apr.status === "Aguardando Revisão Plano de Ação" && user.nivel === "revisor_logistica";
  };

  async function alterarPA() {
    console.log("🔹 alterarPA chamado - selectedOption:", selectedOption);
    if (isReadOnly) {
      console.log("🔴 isReadOnly = true, retornando");
      return;
    }

    // ✅ Validação de "todos os planos" é só na finalização, não aqui!
    // Aqui cada pergunta é individual

    const docRef = firebase.firestore().collection(base).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];
    console.log("🔹 Plano atual:", plano);

    // Se revisor_logistica e selectedOption vazio, definir como Logistica automaticamente
    let optionToSave = selectedOption;
    if ((user.nivel === "revisor_logistica" || user.nivel === "ponto_focal") && !selectedOption) {
      optionToSave = "Logistica";
    }

    // Validações básicas
    if (optionToSave === "Sim") {
      if (!tempo) return toast("Selecione um SLA (data)");
      if (!comentario) return toast("Preencha um comentário");
    } else if (optionToSave === "Não") {
      if (!justificativa) return toast("Selecione uma justificativa");
      if (!comentario) return toast("Preencha um comentário");
    } else if (optionToSave === "Detentora") {
      if (!nomeDetentora) return toast("Preencha a detentora");
      if (!numeroChamado) return toast("Preencha o número de chamado");
      if (!comentario) return toast("Preencha um comentário");
    } else if (optionToSave === "Patrimonio") {
      if (!numeroChamado) return toast("Preencha o número de chamado");
      if (!comentario) return toast("Preencha um comentário");
    } else if (optionToSave === "Logistica") {
      console.log("🔹 Opção Logistica selecionada");
      console.log("slaLogistica:", slaLogistica, "comentario:", comentario);
      if (!slaLogistica) {
        console.log("🔴 SLA vazio");
        return toast("Preencha o SLA (data)");
      }
      if (!comentario) {
        console.log("🔴 Comentário vazio");
        return toast("Preencha um comentário");
      }
    } else {
      console.log("🔴 Opção não reconhecida:", optionToSave);
      return toast("Selecione uma opção");
    }

    // Monta o objeto plano_acao para salvar
    let planoAcaoToSave = {};
    if (optionToSave === "Sim") {
      planoAcaoToSave = {
        tempo,
        comentario,
      };
    } else if (optionToSave === "Não") {
      planoAcaoToSave = { justificativa, comentario };
    } else if (optionToSave === "Detentora") {
      planoAcaoToSave = {
        nome_detentora: nomeDetentora,
        numero_chamado: numeroChamado,
        comentario,
      };
    } else if (optionToSave === "Patrimonio") {
      planoAcaoToSave = {
        numero_chamado: numeroChamado,
        comentario,
      };
    } else if (optionToSave === "Logistica") {
      // Inicializar histórico se não existir
      const historicoAtual = plano.plano_acao?.historico_logistica || [];
      
      // Adicionar a SLA atual ao histórico APENAS SE for uma edição (SLA anterior existe)
      if (plano.plano_acao?.sla_logistica) {
        historicoAtual.push({
          data: plano.resp_pa_data || new Date(),
          usuario: plano.resp_pa_user_name || user.nome,
          sla: plano.plano_acao.sla_logistica,
          comentario: plano.plano_acao.comentario || '',
        });
      }

      planoAcaoToSave = {
        sla_logistica: new Date(slaLogistica),
        comentario,
        historico_logistica: historicoAtual,
      };
    }

    // Preserva o anexo atual caso exista (não alterado aqui)
    if (plano.plano_acao?.anexo_url) {
      planoAcaoToSave.anexo_url = plano.plano_acao.anexo_url;
      planoAcaoToSave.anexo_nome = plano.plano_acao.anexo_nome;
    }

    plano.plano_acao = planoAcaoToSave;
    plano.resp_pa_selectedOption = optionToSave;
    plano.resp_pa_data = new Date();
    plano.resp_pa_user_name = user.nome;
    plano.resp_pa_user_id = user.uid;

    setPlanoAcaoLocal(planoAcaoToSave);
    setRespPASelectedOptionLocal(optionToSave);

    console.log("🔹 Salvando plano com novos valores:", planoAcaoToSave);
    
    await docRef.update(dados);
    
    console.log("✅ Documento atualizado no Firebase");

    // Se for revisor de logística finalizando plano de ação, atualizar status da APR
    if (user.nivel === "revisor_logistica") {
      await updateAPRStatusLogistics(id);
    } else {
      await updateAPR(id);
    }
    
    // Se for opção Logistica, não fecha o modal - só adiciona ao histórico e limpa
    if (optionToSave === "Logistica") {
      console.log("✅ SLA Logistica adicionado com sucesso!");
      toast.success("✅ SLA adicionado ao histórico!");
      
      // Atualizar o histórico local imediatamente para aparecer na lista
      if (plano.plano_acao?.sla_logistica) {
        const novoHistoricoLocal = [
          ...(historicoLocal || []),
          {
            data: plano.resp_pa_data || new Date(),
            usuario: plano.resp_pa_user_name || user.nome,
            sla: plano.plano_acao.sla_logistica,
            comentario: plano.plano_acao.comentario || '',
          }
        ];
        setHistoricoLocal(novoHistoricoLocal);
      }
      
      // Limpar campos para adicionar próximo SLA
      setSlaLogistica("");
      setComentario("");
      // Recarregar a APR para atualizar o histórico no modal
      loadApr();
      // NÃO fecha o modal
      console.log("🔹 Modal permanece aberto para adicionar mais SLAs");
      return;
    }
    
    // Para outras opções, fecha normalmente
    console.log("✅ Plano de ação atualizado (não é Logistica)");
    toast.success("Plano de ação atualizado");
    loadApr();
    setResolucaoInconformidade(null);
    close();
  }

  async function UpdatePA() {
    if (!resolucaoInconformidade) return toast.error("Selecione se a inconformidade foi resolvida");
    if (!notaParecer?.trim()) return toast.error("Preencha um comentário da validação");
    
    const docRef = firebase.firestore().collection(base).doc(id);

    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];

    let imagensValidacao = plano?.resp_pa_validacao_imagens || [];

    if (novasImagens.length > 0) {
      imagensValidacao = [];
      for (const img of novasImagens) {
        const storageRef = firebase.storage().ref();
        const imagemRef = storageRef.child(
          `validacao_pa/${id}/${area}_q${index}_${Date.now()}_${img.name}`
        );
        await imagemRef.put(img);
        const url = await imagemRef.getDownloadURL();
        imagensValidacao.push(url);
      }
    }

    plano.resp_pa_status_alterado_data = new Date();
    plano.resp_pa_status_alterado = user.nome;
    plano.resp_pa_status_parecer = notaParecer.trim();
    plano.resp_pa_status = resolucaoInconformidade === 'sim' ? "Concluido" : "Reprovado";
    plano.resp_pa_resolucao = resolucaoInconformidade;
    plano.resp_pa_validacao_imagens = imagensValidacao;

    await docRef.update(dados);

    if (resolucaoInconformidade === 'sim') {
      toast.success("✅ Plano de ação validado!");
      // Email consolidado será enviado ao final da revisão em Open/index.js
    } else {
      // Se foi reprovado, mudar status da APR para retornar ao ponto focal
      await docRef.update({
        status: "Enviado para Área Responsável",
        data_alteracao: new Date(),
        motivo_reprovacao: notaParecer,
      });
      toast.success("❌ Plano de ação reprovado e retornado ao ponto focal");
      // Email consolidado será enviado ao final da revisão em Open/index.js
    }
    loadApr();
    setResolucaoInconformidade(null);
    setNotaParecer("");
    setNovasImagens([]);
    setShowCamera(false);
    close();
  }

  async function updateAPR(id) {
    const updateData = {
      data_alteracao: new Date(),
    };

    if (user.nivel !== "ponto_focal") {
      updateData.status = "Respondido pela Area";
    }

    await firebase.firestore().collection(base).doc(id).update(updateData);
  }

  async function fetchRevisorEmails() {
    const snapshot = await firebase
      .firestore()
      .collection("users")
      .where("nivel", "==", "revisor")
      .where("status", "==", true)
      .get();

    const emails = [];
    snapshot.forEach((doc) => {
      const email = doc.data().email;
      if (email && email.trim()) {
        emails.push(email.trim());
      }
    });

    return Array.from(new Set(emails));
  }

  async function sendEmailToRevisor(aprData, aprId) {
    const revisorEmails = await fetchRevisorEmails();

    if (!revisorEmails.length) {
      throw new Error("Nenhum e-mail de revisor encontrado");
    }

    const destinatario = revisorEmails.join(";");
    const siteNome = aprData?.site_id?.Nome || "N/I";
    const siteSigla = aprData?.site_id?.Sigla || "N/I";
    const siteCidade = aprData?.site_id?.Cidade || "N/I";
    const siteEstado = aprData?.site_id?.Estado || "N/I";
    const aprRef = aprData?.apr_id || aprId;

    const emailContent = {
      remetente: "aprdigital.seg.br@telefonica.com",
      assunto: `APR Digital - Planos de acao definidos - ${siteSigla}`,
      destinatario,
      texto: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
          <h2 style="color: #1976d2;">APR Digital - Revisao Necessaria</h2>
          <p>O ponto focal inseriu os SLAs e retornou a APR para revisao.</p>
          <p>Por favor, realize a revisao e aprove os planos de acao.</p>
          <p><strong>APR:</strong> ${aprRef}</p>
          <p><strong>Site:</strong> ${siteNome} (${siteSigla})</p>
          <p><strong>Localizacao:</strong> ${siteCidade}/${siteEstado}</p>
          <p>Para revisar, acesse o link:</p>
          <p><a href="${window.location.origin}/Open/${aprId}">${window.location.origin}/Open/${aprId}</a></p>
          <hr />
          <small>Mensagem automatica - APR Digital</small>
        </div>
      `,
    };

    const response = await fetch(
      "https://us-central1-aprdigital-b6fcf.cloudfunctions.net/sendEmail",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailContent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP! status: ${response.status} - ${errorText}`);
    }

    return destinatario;
  }

  // Buscar email do ponto focal na contact_email baseado no estado e município
  async function fetchPontoFocalEmail() {
    try {
      const siteEstado = apr?.site_id?.Estado || "";
      const siteCidade = apr?.site_id?.Cidade || "";

      if (!siteEstado || !siteCidade) {
        console.warn("Estado ou cidade não encontrados no APR");
        return null;
      }

      console.log(`🔍 Procurando email do ponto focal para: ${siteEstado} - ${siteCidade}`);

      // Primeiro, tentar buscar na contact_email com a chave {ESTADO}-{MUNICIPIO}
      const docKey = `${siteEstado.toUpperCase()}-${siteCidade.toUpperCase()}`;
      console.log(`📄 Tentando buscar documento com chave: ${docKey}`);

      const contactEmailDoc = await firebase
        .firestore()
        .collection("contact_email")
        .doc(docKey)
        .get();

      if (contactEmailDoc.exists) {
        const data = contactEmailDoc.data();
        console.log(`✓ Documento encontrado para ${docKey}`, data);

        // Procurar por campos de email do ponto focal em ordem de preferência
        const fieldPriority = [
          "email_ponto_focal",
          "email_logistica_ponto_focal", 
          "ponto_focal_email",
          "email_logistica",
          "email_armazenamento",
          "email_transporte",
        ];

        for (const field of fieldPriority) {
          if (data[field]) {
            const email = Array.isArray(data[field]) ? data[field][0] : data[field];
            if (email && typeof email === "string" && email.trim()) {
              console.log(`✓ Email encontrado no campo '${field}': ${email.trim()}`);
              return email.trim();
            }
          }
        }

        console.warn(`⚠️ Nenhum campo de email encontrado no documento ${docKey}`);
      } else {
        console.warn(`⚠️ Documento contact_email não encontrado para: ${docKey}`);
      }

      // Se não encontrou, buscar um email padrão de ponto focal em qualquer documento
      console.log("🔄 Tentando buscar email de ponto focal padrão...");
      const allContactsSnapshot = await firebase
        .firestore()
        .collection("contact_email")
        .limit(1)
        .get();

      if (!allContactsSnapshot.empty) {
        const firstDoc = allContactsSnapshot.docs[0];
        const data = firstDoc.data();

        for (const field of ["email_ponto_focal", "email_logistica", "email_armazenamento"]) {
          if (data[field]) {
            const email = Array.isArray(data[field]) ? data[field][0] : data[field];
            if (email && typeof email === "string" && email.trim()) {
              console.log(`⚠️ Usando email de fallback: ${email.trim()}`);
              return email.trim();
            }
          }
        }
      }

      console.error("❌ Nenhum email de ponto focal foi encontrado");
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar email do ponto focal:", error);
      return null;
    }
  }

  // Enviar email ao ponto focal informando aprovação do plano de ação
  async function sendEmailToPontoFocal(aprData, aprId, question, motivo = "") {
    try {
      const pontoFocalEmail = await fetchPontoFocalEmail();

      if (!pontoFocalEmail) {
        console.warn("Email do ponto focal não encontrado");
        return;
      }

      const siteNome = aprData?.site_id?.Nome || "N/I";
      const siteSigla = aprData?.site_id?.Sigla || "N/I";
      const siteCidade = aprData?.site_id?.Cidade || "N/I";
      const siteEstado = aprData?.site_id?.Estado || "N/I";
      const aprRef = aprData?.apr_id || aprId;

      // Garantir que destinatario é array
      const destinatarioArray = Array.isArray(pontoFocalEmail) 
        ? pontoFocalEmail 
        : [pontoFocalEmail];

      const emailContent = {
        remetente: "aprdigital.seg.br@telefonica.com",
        assunto: `APR Digital - Plano de Ação Aprovado - ${siteSigla}`,
        destinatario: destinatarioArray,
        texto: `
          <html>
            <head>
              <meta charset="utf-8">
              <title>APR Digital - Plano de Ação Aprovado</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background-color: #660099; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                .site-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
                .site-info p { margin: 8px 0; }
                .approval-box { background-color: #e8f5e9; border: 2px solid #4caf50; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .question-box { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4caf50; margin: 15px 0; }
                .action-button { display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>APR Digital</h1>
                  <p>✅ Plano de Ação Aprovado</p>
                </div>

                <p>Olá,</p>
                
                <p>O revisor <strong>aprovou</strong> o plano de ação para a seguinte inconformidade:</p>
                
                <div class="question-box">
                  <p><strong>❓ Pergunta/Inconformidade:</strong></p>
                  <p>${question || "N/I"}</p>
                </div>
                
                <div class="site-info">
                  <h3 style="margin-top: 0;">Informações da APR</h3>
                  <p><strong>APR:</strong> ${aprRef}</p>
                  <p><strong>Site:</strong> ${siteNome} (${siteSigla})</p>
                  <p><strong>Localização:</strong> ${siteCidade}/${siteEstado}</p>
                </div>
                
                <div class="approval-box">
                  <p><strong>✓ Status:</strong> Aprovado para implementação</p>
                  <p>O plano de ação foi validado e aprovado. Agora é necessário implementar a solução na área responsável.</p>
                </div>
                
                <p style="margin: 20px 0; line-height: 1.6;">
                  <strong>Ação necessária:</strong> Por favor, verifique se o plano de ação foi implementado e se a inconformidade foi resolvida na área.
                </p>
                
                <p style="text-align: center;">
                  <a href="${window.location.origin}/Open/${aprId}" class="action-button">Acessar APR para Verificar</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <small style="color: #999;">Mensagem automática gerada pelo Sistema APR Digital</small>
              </div>
            </body>
          </html>
        `,
      };

      console.log('=== ENVIANDO EMAIL APROVAÇÃO PA ===');
      console.log('Destinatário final (array):', destinatarioArray);
      console.log('Assunto:', emailContent.assunto);
      console.log('URL destino:', "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail_APRDigital");

      const response = await fetch(
        "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail_APRDigital",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContent),
        }
      );

      console.log('Status da resposta:', response.status);
      console.log('Status OK?:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ao enviar email ao ponto focal: ${response.status} - ${errorText}`);
        return;
      }

      console.log("Email de aprovação enviado ao ponto focal com sucesso");
    } catch (error) {
      console.error("Erro ao enviar email ao ponto focal:", error);
    }
  }

  // Enviar email ao ponto focal informando rejeição do plano de ação
  async function sendEmailRejeitadoToPontoFocal(aprData, aprId, question, motivo = "") {
    try {
      const pontoFocalEmail = await fetchPontoFocalEmail();

      if (!pontoFocalEmail) {
        console.warn("Email do ponto focal não encontrado");
        return;
      }

      const siteNome = aprData?.site_id?.Nome || "N/I";
      const siteSigla = aprData?.site_id?.Sigla || "N/I";
      const siteCidade = aprData?.site_id?.Cidade || "N/I";
      const siteEstado = aprData?.site_id?.Estado || "N/I";
      const aprRef = aprData?.apr_id || aprId;

      // Garantir que destinatario é array
      const destinatarioArray = Array.isArray(pontoFocalEmail) 
        ? pontoFocalEmail 
        : [pontoFocalEmail];

      const motivoTexto = motivo && motivo.trim() 
        ? `<p style="background-color: #fff3cd; padding: 12px; border-left: 4px solid #ff9800; margin: 16px 0;"><strong>Motivo da rejeição:</strong><br/>${motivo}</p>`
        : "";

      const emailContent = {
        remetente: "aprdigital.seg.br@telefonica.com",
        assunto: `APR Digital - Plano de Ação Rejeitado - ${siteSigla}`,
        destinatario: destinatarioArray,
        texto: `
          <html>
            <head>
              <meta charset="utf-8">
              <title>APR Digital - Plano de Ação Rejeitado</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background-color: #660099; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                .site-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
                .site-info p { margin: 8px 0; }
                .rejection-box { background-color: #ffebee; border: 2px solid #f44336; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
                .question-box { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
                .action-button { display: inline-block; background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>APR Digital</h1>
                  <p>❌ Plano de Ação Rejeitado</p>
                </div>

                <p>Olá,</p>
                
                <p>Infelizmente, o revisor <strong>rejeitou o plano de ação</strong> para a seguinte inconformidade. Há problemas que precisam ser corrigidos:</p>
                
                <div class="question-box">
                  <p><strong>❓ Pergunta/Inconformidade:</strong></p>
                  <p>${question || "N/I"}</p>
                </div>
                
                ${motivoTexto}
                
                <div class="site-info">
                  <h3 style="margin-top: 0;">Informações da APR</h3>
                  <p><strong>APR:</strong> ${aprRef}</p>
                  <p><strong>Site:</strong> ${siteNome} (${siteSigla})</p>
                  <p><strong>Localização:</strong> ${siteCidade}/${siteEstado}</p>
                </div>
                
                <div class="rejection-box">
                  <p><strong>⚠️ Status:</strong> Pendente de Correção</p>
                  <p>O plano de ação não foi aprovado e requer ajustes conforme os comentários do revisor.</p>
                </div>
                
                <p style="margin: 20px 0; line-height: 1.6;">
                  <strong>O que fazer:</strong> Por favor, revise o plano de ação e atualize-o de acordo com os comentários do revisor. Assim que corrigir, envie novamente para validação.
                </p>
                
                <p style="text-align: center;">
                  <a href="${window.location.origin}/Open/${aprId}" class="action-button">Acessar APR e Corrigir</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <small style="color: #999;">Mensagem automática gerada pelo Sistema APR Digital</small>
              </div>
            </body>
          </html>
        `,
      };

      console.log('=== ENVIANDO EMAIL REJEIÇÃO PA ===');
      console.log('Destinatário final (array):', destinatarioArray);
      console.log('Assunto:', emailContent.assunto);
      console.log('Motivo:', motivo);

      const response = await fetch(
        "https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/sendMail_APRDigital",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContent),
        }
      );

      console.log('Status da resposta:', response.status);
      console.log('Status OK?:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ao enviar email de rejeição: ${response.status} - ${errorText}`);
        return;
      }

      console.log("Email de rejeição enviado ao ponto focal com sucesso");
    } catch (error) {
      console.error("Erro ao enviar email de rejeição:", error);
    }
  }

  // Nova função para atualizar status quando ponto focal finaliza
  async function updateAPRStatusLogistics(id) {
    await firebase.firestore().collection(base).doc(id).update({
      status: "Aguardando Revisão",
      data_ponto_focal_resposta: firebase.firestore.FieldValue.serverTimestamp(),
      data_alteracao: new Date(),
    });

    try {
      await sendEmailToRevisor(apr, id);
    } catch (error) {
      console.error("Erro ao enviar e-mail para revisor:", error);
    }
  }

  // Upload do arquivo para Storage Firebase
  async function handleArquivoChange(e) {
    console.log("🎯 handleArquivoChange chamado. isReadOnly:", isReadOnly);
    console.log("👤 Nível do usuário:", user.nivel);
    
    // Permitir upload para revisor_logistica e ponto_focal mesmo com isReadOnly = true
    const podeUpload = !isReadOnly || user.nivel === "revisor_logistica" || user.nivel === "ponto_focal";
    
    if (!podeUpload) {
      console.log("❌ Bloqueado: Usuário não tem permissão");
      return;
    }
    if (!e.target.files || e.target.files.length === 0) {
      console.log("❌ Sem arquivos selecionados");
      return;
    }
    
    const files = Array.from(e.target.files);
    console.log("📁 Arquivos selecionados:", files);
    
    // Mostrar preview dos arquivos selecionados
    const preview = files.map(f => ({
      nome: f.name,
      tamanho: (f.size / 1024 / 1024).toFixed(2),
    }));
    console.log("📋 Preview criado:", preview);
    setArquivosSelecionados(preview);
    
    setUploading(true);

    try {
      const docRef = firebase.firestore().collection(base).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        toast.error("Documento não encontrado");
        setUploading(false);
        return;
      }
      
      const dados = doc.data();
      const plano = dados.checklist[area][1][index];
      const anexosAtual = plano.plano_acao?.anexos || [];
      
      // Processar cada arquivo
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.warning(`Arquivo ${file.name} excede 10MB e foi ignorado`);
          continue;
        }

        try {
          const storageRef = firebase.storage().ref();
          const timestamp = Date.now();
          const arquivoRef = storageRef.child(
            `anexos_pa/${id}/${area}_q${index}_${timestamp}_${file.name}`
          );

          // Faz upload
          await arquivoRef.put(file);

          // Pega URL do arquivo
          const url = await arquivoRef.getDownloadURL();
          
          const novoAnexo = {
            url: url,
            nome: file.name,
            data: new Date(),
          };
          anexosAtual.push(novoAnexo);
          
          console.log("✅ Arquivo enviado:", file.name, "URL:", url);
          console.log("📂 Array de anexos atualizado:", anexosAtual);
          
          // Atualizar estado local imediatamente
          setAnexosLocal(prev => [...prev, novoAnexo]);
          toast.success(`${file.name} anexado com sucesso!`);
        } catch (fileError) {
          toast.error(`Erro ao enviar ${file.name}: ` + fileError.message);
        }
      }

      // Atualiza anexos no plano_acao
      plano.plano_acao = {
        ...plano.plano_acao,
        anexos: anexosAtual,
      };

      console.log("💾 Salvando no Firestore - plano_acao:", plano.plano_acao);
      await docRef.update(dados);
      console.log("✓ Salvo com sucesso no Firestore");
      
      // Limpar input file
      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
      
      // Limpar arquivos selecionados
      setArquivosSelecionados([]);
      
      // Recarregar após pequeno delay para sincronizar com Firestore
      setTimeout(() => {
        loadApr();
      }, 800);
    } catch (error) {
      toast.error("Erro ao processar arquivos: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  // Upload de evidência pelo aplicador
  async function handleEvidenciaChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Arquivo deve ter até 10MB");
    }

    setUploadingEvidencia(true);

    try {
      const storageRef = firebase.storage().ref();
      const arquivoRef = storageRef.child(
        `evidencias_pa/${id}/${area}_q${index}_${file.name}`
      );

      await arquivoRef.put(file);
      const url = await arquivoRef.getDownloadURL();

      const docRef = firebase.firestore().collection(base).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return toast.error("Documento não encontrado");
      const dados = doc.data();
      const plano = dados.checklist[area][1][index];

      plano.plano_acao = {
        ...plano.plano_acao,
        evidencia_url: url,
        evidencia_nome: file.name,
      };

      await docRef.update(dados);

      toast.success("Evidência anexada com sucesso!");
      loadApr();
    } catch (error) {
      toast.error("Erro ao enviar evidência: " + error.message);
    } finally {
      setUploadingEvidencia(false);
    }
  }

  // Confirmar resolução pelo aplicador
  async function confirmarResolucao() {
    const docRef = firebase.firestore().collection(base).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];

    // Validar se preencheu a nova resposta
    if (!novaResposta) {
      return toast.error("Por favor, selecione uma resposta para a correção");
    }

    // Validar se anexou pelo menos uma imagem
    if (novasImagens.length === 0) {
      return toast.error("Por favor, anexe pelo menos uma foto de evidência");
    }

    // Upload das imagens para o Storage
    try {
      const imageUrls = [];
      for (const img of novasImagens) {
        const storageRef = firebase.storage().ref();
        const imagemRef = storageRef.child(
          `correcoes_pa/${id}/${area}_q${index}_${Date.now()}_${img.name}`
        );
        await imagemRef.put(img);
        const url = await imagemRef.getDownloadURL();
        imageUrls.push(url);
      }

      // Atualizar a questão com a nova resposta
      plano.resp = novaResposta;
      plano.images_correcao = imageUrls;
      
      plano.plano_acao = {
        ...plano.plano_acao,
        resolvido: true,
        resolvido_por: user.nome,
        resolvido_por_id: user.uid,
        resolvido_data: new Date(),
        nova_resposta: novaResposta,
        imagens_correcao: imageUrls,
        comentario_correcao: comentarioCorrecao,
      };

      await docRef.update(dados);

      // Verificar se todas as correções foram feitas para mudar o status
      await verificarTodasCorrecoes(docRef, dados);

      toast.success("Correção confirmada com sucesso!");
      loadApr();
      close();
    } catch (error) {
      console.error("Erro ao enviar correção:", error);
      toast.error("Erro ao salvar correção: " + error.message);
    }
  }

  // Função para verificar se todas as correções foram feitas
  async function verificarTodasCorrecoes(docRef, dados) {
    let totalCorrecoes = 0;
    let correcoesFeitas = 0;

    dados.checklist.forEach((area) => {
      area[1].forEach((question) => {
        if (question.openPA === true && question.resp_pa_selectedOption) {
          totalCorrecoes++;
          if (question.plano_acao?.resolvido) {
            correcoesFeitas++;
          }
        }
      });
    });

    // Se todas as correções foram feitas, mudar status para "Aguardando Revisão"
    if (totalCorrecoes > 0 && correcoesFeitas === totalCorrecoes) {
      await docRef.update({
        status: "Aguardando Revisão",
        data_correcoes_completas: firebase.firestore.FieldValue.serverTimestamp(),
        data_alteracao: new Date(),
      });
    }
  }

  // Capturar foto da webcam
  const capturarFoto = () => {
    if (!webcamRef.current) {
      toast.error("Câmera não disponível");
      return;
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Não foi possível capturar a imagem");
      return;
    }
    
    // Converter base64 para blob e criar arquivo
    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" });
    
    setNovasImagens([...novasImagens, file]);
    setShowCamera(false);
    toast.success("Foto capturada!");
  };

  // Remover imagem da lista
  const removerImagem = (index) => {
    const novaLista = novasImagens.filter((_, i) => i !== index);
    setNovasImagens(novaLista);
  };

  // Função para ponto_focal fazer upload de arquivos
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limitar a 5 arquivos
    if (arquivosSelecionados.length + files.length > 5) {
      toast.warning("Máximo de 5 arquivos permitidos");
      return;
    }

    // Validar tamanho (máximo 10MB por arquivo)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede 10MB`);
        return;
      }
    }

    setArquivosSelecionados([...arquivosSelecionados, ...files]);
    toast.success(`${files.length} arquivo(s) selecionado(s)`);
  };

  function renderResolucaoInconformidade(showSubmitButton = false) {
    const anexosValidacaoSalvos = Array.isArray(conteudo?.resp_pa_validacao_imagens)
      ? conteudo.resp_pa_validacao_imagens
      : [];

    return (
      <Box sx={{ mb: 3, p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '3px solid #1976d2' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2.5, color: '#0d47a1', fontSize: '1.1rem' }}>
          ❓ A inconformidade foi resolvida?
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Button
            variant={resolucaoInconformidade === 'sim' ? 'contained' : 'outlined'}
            color="success"
            size="large"
            onClick={() => setResolucaoInconformidade('sim')}
            sx={{ flex: 1, fontWeight: 'bold' }}
          >
            ✅ Sim
          </Button>
          <Button
            variant={resolucaoInconformidade === 'nao' ? 'contained' : 'outlined'}
            color="error"
            size="large"
            onClick={() => setResolucaoInconformidade('nao')}
            sx={{ flex: 1, fontWeight: 'bold' }}
          >
            ❌ Não
          </Button>
        </Box>

        <TextField
          label="Comentário do Revisor"
          value={notaParecer}
          onChange={(e) => setNotaParecer(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder={resolucaoInconformidade === 'nao' ? 'Descreva o motivo da reprovação...' : 'Descreva o parecer da validação...'}
          sx={{ mb: 2 }}
        />

        <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#2e7d32' }}>
            📸 Evidências da validação (opcional)
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FiCamera />}
              onClick={() => setShowCamera(!showCamera)}
            >
              {showCamera ? "Fechar Câmera" : "Abrir Câmera"}
            </Button>

            <Button variant="outlined" component="label">
              Galeria
              <input
                type="file"
                accept="image/*"
                hidden
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setNovasImagens((prev) => [...prev, ...files]);
                    toast.success(`${files.length} imagem(ns) adicionada(s)!`);
                  }
                }}
              />
            </Button>
          </Box>

          {showCamera && (
            <Box sx={{ mb: 2 }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: "environment" }}
              />
              <Button
                variant="contained"
                color="success"
                onClick={capturarFoto}
                fullWidth
                sx={{ mt: 1 }}
              >
                Capturar Foto
              </Button>
            </Box>
          )}

          {novasImagens.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: 'success.main' }}>
                ✅ Imagens selecionadas: {novasImagens.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {novasImagens.map((img, idx) => (
                  <Box key={idx} sx={{ position: 'relative', width: 100, height: 100 }}>
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Foto ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                        border: '2px solid #4caf50'
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removerImagem(idx)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        minWidth: 24,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        p: 0
                      }}
                    >
                      X
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {anexosValidacaoSalvos.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: '#1b5e20' }}>
                📎 Anexos já inseridos: {anexosValidacaoSalvos.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {anexosValidacaoSalvos.map((imgUrl, idx) => (
                  <Box key={idx} sx={{ width: 100, height: 100 }}>
                    <img
                      src={imgUrl}
                      alt={`Anexo salvo ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                        border: '2px solid #66bb6a',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(imgUrl, '_blank')}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {showSubmitButton && (
          <Button
            onClick={() => UpdatePA()}
            variant="contained"
            color={resolucaoInconformidade === 'nao' ? 'error' : 'success'}
            size="large"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!resolucaoInconformidade || !notaParecer?.trim()}
          >
            {resolucaoInconformidade === 'nao' ? '❌ Reprovar Plano de Ação' : '✅ Aprovar Plano de Ação'}
          </Button>
        )}
      </Box>
    );
  }

  function renderOptionInputs() {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {selectedOption === "Sim" && (
          <>
            <TextField
              label="SLA (Data)"
              type="date"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
            <TextField
              label="Comentário"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
        {selectedOption === "Não" && (
          <>
            <TextField
              label="Justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              select
              fullWidth
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            >
              <MenuItem value="Instalada solução similar">
                Instalada solução similar
              </MenuItem>
              <MenuItem value="Sem orçamento">Sem orçamento</MenuItem>
              <MenuItem value="Solução em desacordo">Solução em desacordo</MenuItem>
              <MenuItem value="Discordância de necessidade">
                Discordância de necessidade
              </MenuItem>
            </TextField>
            <TextField
              label="Comentário"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
        {(selectedOption === "Detentora" || selectedOption === "Patrimonio") && (
          <>
            {selectedOption === "Detentora" && (
              <TextField
                label="Nome Detentora"
                value={nomeDetentora}
                onChange={(e) => setNomeDetentora(e.target.value.toUpperCase())}
                fullWidth
                slotProps={isReadOnly && {
                  input: {
                    readOnly: true,
                  },
                }}
              />
            )}
            <TextField
              label="Número Chamado"
              value={numeroChamado}
              onChange={(e) => setNumeroChamado(e.target.value.toUpperCase())}
              fullWidth
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
            <TextField
              label="Comentário"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
        {selectedOption === "Logistica" && (
          <>
            {/* Histórico de SLAs e Comentários anteriores */}
            {historicoLocal && historicoLocal.length > 0 && (
              <Box 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📋 Histórico de Alterações
                </Typography>
                {historicoLocal.map((historico, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 1.5, 
                      pb: 1.5, 
                      borderBottom: index < historicoLocal.length - 1 ? '1px solid #ddd' : 'none' 
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      <strong>Data:</strong> {historico.data ? new Date(historico.data.seconds * 1000).toLocaleString('pt-BR') : 'N/D'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      <strong>Responsável:</strong> {historico.usuario || 'N/D'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      <strong>SLA:</strong> {historico.sla ? new Date(historico.sla.toDate()).toLocaleDateString('pt-BR') : 'N/D'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      <strong>Comentário:</strong> {historico.comentario || 'N/D'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Card com SLA atual */}
            {planoAcaoLocal?.sla_logistica && (
              <Box 
                sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: '#e3f2fd', 
                  borderRadius: 1,
                  border: '2px solid #1976d2'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#0d47a1' }}>
                  ✅ SLA Atual
                </Typography>
                <Typography variant="body2">
                  <strong>Data:</strong> {new Date(planoAcaoLocal.sla_logistica.seconds ? planoAcaoLocal.sla_logistica.seconds * 1000 : planoAcaoLocal.sla_logistica).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2">
                  <strong>Comentário:</strong> {planoAcaoLocal.comentario || 'N/D'}
                </Typography>
              </Box>
            )}

            <TextField
              label="SLA (Data)"
              type="date"
              value={slaLogistica}
              onChange={(e) => setSlaLogistica(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Defina o prazo para tratativa de logística"
              slotProps={
                // Revisor, revisor_logistica e administrador podem editar
                (user.nivel !== "revisor" && user.nivel !== "revisor_logistica" && user.nivel !== "administrador" && isReadOnly) && {
                  input: {
                    readOnly: true,
                  },
                }
              }
            />
            <TextField
              label="Comentário"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Comentários sobre as tratativas e justificativa para alteração de SLA (se aplicável)"
              slotProps={
                // Revisor, revisor_logistica e administrador podem editar
                (user.nivel !== "revisor" && user.nivel !== "revisor_logistica" && user.nivel !== "administrador" && isReadOnly) && {
                  input: {
                    readOnly: true,
                  },
                }
              }
            />
          </>
        )}

        <Box>
          {isReadOnly ? (
            <Box>
              {/* Mostrar anexo antigo (backward compatibility) */}
              {conteudo?.plano_acao?.anexo_url && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Download />}
                    href={conteudo.plano_acao.anexo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {conteudo.plano_acao.anexo_nome || "Baixar Anexo"}
                  </Button>
                </Box>
              )}
              
              {/* Mostrar novos anexos (múltiplos) */}
              {anexosLocal && anexosLocal.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e8d5f2', background: 'linear-gradient(135deg, #f5f0ff 0%, #fff8ff 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#660099', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📎 Arquivos Anexados ({anexosLocal.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {anexosLocal.map((anexo, idx) => (
                      <Link
                        key={idx}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: 'white',
                          borderRadius: 1.5,
                          border: '1px solid #e0d5e8',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#fafafa',
                            border: '1px solid #660099',
                            boxShadow: '0 4px 8px rgba(102, 0, 153, 0.15)',
                            transform: 'translateX(4px)'
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {getFileIcon(anexo.nome)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#660099',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {anexo.nome}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                            {new Date(anexo.data).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                        <Download sx={{ color: '#660099', fontSize: '1.2rem', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <input type="file" onChange={handleArquivoChange} disabled={uploading} />
          )}
        </Box>
      </Box>
    );
  }

  // Função para renderizar inputs específicos da aba OEM
  function renderOptionInputsOEM() {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {selectedOptionOEM === "Sim" && (
          <>
            <TextField
              label="Comentário OEM"
              value={comentarioOEM}
              onChange={(e) => setComentarioOEM(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
        {selectedOptionOEM === "Não" && (
          <>
            <TextField
              label="Justificativa OEM"
              value={justificativaOEM}
              onChange={(e) => setJustificativaOEM(e.target.value)}
              select
              fullWidth
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            >
              <MenuItem value="Instalada solução similar">
                Instalada solução similar
              </MenuItem>
              <MenuItem value="Sem orçamento">Sem orçamento</MenuItem>
              <MenuItem value="Solução em desacordo">Solução em desacordo</MenuItem>
              <MenuItem value="Discordância de necessidade">
                Discordância de necessidade
              </MenuItem>
            </TextField>
            <TextField
              label="Comentário OEM"
              value={comentarioOEM}
              onChange={(e) => setComentarioOEM(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
        {selectedOptionOEM === "Detentora" && (
          <>
            <TextField
              label="Nome Detentora OEM"
              value={nomeDetentoraOEM}
              onChange={(e) => setNomeDetentoraOEM(e.target.value.toUpperCase())}
              fullWidth
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
            <TextField
              label="Número Chamado OEM"
              value={numeroChamadoOEM}
              onChange={(e) => setNumeroChamadoOEM(e.target.value.toUpperCase())}
              fullWidth
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
            <TextField
              label="Comentário OEM"
              value={comentarioOEM}
              onChange={(e) => setComentarioOEM(e.target.value)}
              fullWidth
              multiline
              rows={4}
              slotProps={isReadOnly && {
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
      </Box>
    );
  }

  return (
    <Dialog open={true} onClose={close} maxWidth="lg" fullWidth>
      <DialogTitle>
        {(user.nivel === "revisor_logistica" || user.nivel === "ponto_focal") && !isModoVisualizacao 
          ? "📦 Plano de Ação - Logística" 
          : "Plano de Ação"}
      </DialogTitle>
      <DialogContent dividers>
        {/* MODO ESPECIAL PARA REVISOR DE LOGÍSTICA E PONTO FOCAL */}
        {(user.nivel === "revisor_logistica" || user.nivel === "ponto_focal") && !isModoVisualizacao ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: '#660099', borderBottom: '2px solid #660099', pb: 1 }}>
              🚚 Definir SLA para Tratativa de Logística
            </Typography>

            {/* Mostrar a pergunta */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                ❓ Pergunta:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {conteudo.question}
              </Typography>
              
              {conteudo.image && conteudo.image.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {conteudo.image.map((img, idx) => (
                    <Box key={idx} sx={{ maxWidth: 200 }}>
                      <img 
                        src={typeof img === 'string' ? img : img.url} 
                        alt={`Referência ${idx + 1}`}
                        style={{ width: '100%', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}
                        onClick={() => window.open(typeof img === 'string' ? img : img.url, '_blank')}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {conteudo.respostas && conteudo.respostas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                    🟢 Resposta Correta: {conteudo.answers} | 🔴 Resposta Aplicada: {conteudo.resp}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Loading ou Histórico de SLAs anteriores */}
            {loadingHistorico ? (
              <Box sx={{ mb: 3, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid #9c27b0', minHeight: 150 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#6a1b9a' }}>
                    Carregando SLA...
                  </Typography>
                </Box>
              </Box>
            ) : historicoLocal && historicoLocal.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid #9c27b0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#6a1b9a' }}>
                  📜 Histórico de SLAs Anteriores:
                </Typography>
                {historicoLocal.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #9c27b0' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                      🕐 {new Date(item.data.seconds ? item.data.seconds * 1000 : item.data).toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      👤 {item.usuario}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      📅 SLA: {new Date(item.sla.seconds ? item.sla.seconds * 1000 : item.sla).toLocaleDateString('pt-BR')}
                    </Typography>
                    {item.comentario && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        💬 {item.comentario}
                      </Typography>
                    )}
                  </Box>
                ))}
                {user.nivel === "revisor_logistica" && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                    {renderResolucaoInconformidade(true)}
                  </Box>
                )}
              </Box>
            )}

            {/* Formulário para definir SLA */}
            {planoAcaoLocal?.sla_logistica && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #43a047' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#2e7d32' }}>
                  ✅ SLA Atual
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#1b5e20' }}>
                  <strong>Data:</strong> {new Date(planoAcaoLocal.sla_logistica.seconds ? planoAcaoLocal.sla_logistica.seconds * 1000 : planoAcaoLocal.sla_logistica).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                  <strong>Comentário:</strong> {planoAcaoLocal.comentario || 'N/D'}
                </Typography>
              </Box>
            )}

            {user.nivel !== "revisor_logistica" && (
            <Box sx={{ mb: 3, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#0d47a1' }}>
                📅 {planoAcaoLocal?.sla_logistica ? "Redefinir SLA:" : "Definir SLA:"}
              </Typography>
              
              <TextField
                label="SLA (Data)"
                type="date"
                value={slaLogistica}
                onChange={(e) => setSlaLogistica(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText={`Defina o prazo para tratativa de ${user.area}`}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Comentário"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                fullWidth
                multiline
                rows={4}
                placeholder="Comentários sobre as tratativas e justificativa para SLA"
                helperText={planoAcaoLocal?.sla_logistica ? "Explique o motivo da alteração do SLA" : "Descreva as ações planejadas"}
              />
            </Box>
            )}

            {/* Área para anexar arquivo */}
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#660099' }}>
                📎 Anexar Documentos (Opcional)
              </Typography>
              
              {/* Arquivos selecionados (em processo de upload) - MOSTRAR AQUI PRIMEIRO */}
              {arquivosSelecionados && arquivosSelecionados.length > 0 && (
                <Box sx={{ p: 2, mb: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50', background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⏳ Arquivos Selecionados ({arquivosSelecionados.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {arquivosSelecionados.map((arquivo, idx) => (
                      <Box key={idx} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: 1.5,
                        border: '1px solid #81c784',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {getFileIcon(arquivo.nome)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#2e7d32',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {arquivo.nome}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                            {arquivo.tamanho} MB
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          🔄 Enviando...
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Zona de upload visual */}
              <Box
                sx={{
                  p: 2,
                  border: '2px dashed #660099',
                  borderRadius: 2,
                  bgcolor: 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  mb: 2,
                  '&:hover': {
                    bgcolor: uploading ? 'white' : '#f0e6ff',
                    borderColor: uploading ? '#660099' : '#660099',
                  },
                }}
                onClick={() => !uploading && inputFileRef.current?.click()}
              >
                {uploading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="primary">
                      Enviando arquivos...
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <CloudUpload sx={{ fontSize: 40, color: '#660099', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#660099', mb: 0.5 }}>
                      Clique ou arraste arquivos aqui
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Você pode adicionar múltiplos arquivos (máx. 10MB cada)
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <input 
                ref={inputFileRef}
                type="file" 
                onChange={handleArquivoChange} 
                disabled={uploading}
                multiple
                style={{ display: 'none' }}
              />
              
              {/* Listagem de anexos existentes */}
              {anexosLocal && anexosLocal.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e8d5f2', background: 'linear-gradient(135deg, #f5f0ff 0%, #fff8ff 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#660099', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📎 Arquivos Anexados ({anexosLocal.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {anexosLocal.map((anexo, idx) => (
                      <Link
                        key={idx}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: 'white',
                          borderRadius: 1.5,
                          border: '1px solid #e0d5e8',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#fafafa',
                            border: '1px solid #660099',
                            boxShadow: '0 4px 8px rgba(102, 0, 153, 0.15)',
                            transform: 'translateX(4px)'
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {getFileIcon(anexo.nome)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#660099',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {anexo.nome}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                            {new Date(anexo.data).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                        <Download sx={{ color: '#660099', fontSize: '1.2rem', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Mostrar quem definiu anteriormente */}
            {conteudo?.resp_pa_user_name && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #ddd' }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                  <strong>Última atualização por:</strong> {conteudo.resp_pa_user_name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                  <strong>Data:</strong> {conteudo.resp_pa_data ? new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString('pt-BR') : ""}
                </Typography>
              </Box>
            )}
          </Box>
        ) : isModoVisualizacao && conteudo?.plano_acao && conteudo?.resp_pa_selectedOption ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#660099' }}>
              📋 Histórico da Correção
            </Typography>

            {/* Mostrar a pergunta original */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                ❓ Pergunta:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {conteudo.question}
              </Typography>
              
              {/* Mostrar imagem da pergunta se existir */}
              {conteudo.image && conteudo.image.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {conteudo.image.map((img, idx) => (
                    <Box key={idx} sx={{ maxWidth: 200 }}>
                      <img 
                        src={typeof img === 'string' ? img : img.url} 
                        alt={`Referência ${idx + 1}`}
                        style={{ width: '100%', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}
                        onClick={() => window.open(typeof img === 'string' ? img : img.url, '_blank')}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Mostrar opções de resposta com destaque */}
              {conteudo.respostas && conteudo.respostas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                    🟢 Resposta Correta: {conteudo.answers} | 🔴 Resposta Anterior: {conteudo.resp}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Mostrar comentário do plano de ação */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                📝 Orientações do Revisor:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {conteudo.plano_acao?.comentario || 'Nenhum comentário disponível'}
              </Typography>
              
              <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                <strong>Definido por:</strong> {conteudo.resp_pa_user_name} em {conteudo.resp_pa_data ? 
                  new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString('pt-BR') : 'N/D'}
              </Typography>
            </Box>

            {/* Mostrar anexo do plano de ação se existir */}
            <Box sx={{ mb: 3 }}>
              {conteudo?.plano_acao?.anexo_url && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Download />}
                    href={conteudo.plano_acao.anexo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                  >
                    📎 {conteudo.plano_acao.anexo_nome || "Baixar Anexo do Plano"}
                  </Button>
                </Box>
              )}
              
              {/* Mostrar novos anexos (múltiplos) */}
              {anexosLocal && anexosLocal.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e8d5f2', background: 'linear-gradient(135deg, #f5f0ff 0%, #fff8ff 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#660099', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📎 Arquivos Anexados ({anexosLocal.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {anexosLocal.map((anexo, idx) => (
                      <Link
                        key={idx}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: 'white',
                          borderRadius: 1.5,
                          border: '1px solid #e0d5e8',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#fafafa',
                            border: '1px solid #660099',
                            boxShadow: '0 4px 8px rgba(102, 0, 153, 0.15)',
                            transform: 'translateX(4px)'
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {getFileIcon(anexo.nome)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#660099',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {anexo.nome}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                            {new Date(anexo.data).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                        <Download sx={{ color: '#660099', fontSize: '1.2rem', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Status de correção */}
            {conteudo?.plano_acao?.resolvido ? (
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
                <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                  ✅ Correção Confirmada
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Confirmado por:</strong> {conteudo.plano_acao.resolvido_por}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Data:</strong> {conteudo.plano_acao.resolvido_data ? 
                    new Date(conteudo.plano_acao.resolvido_data.seconds * 1000).toLocaleString('pt-BR') : 'N/D'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Nova Resposta:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ {conteudo.plano_acao.nova_resposta}</span>
                </Typography>

                {/* Imagens da correção */}
                {conteudo.plano_acao?.imagens_correcao && conteudo.plano_acao.imagens_correcao.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#2e7d32' }}>
                      📸 Evidências da Correção ({conteudo.plano_acao.imagens_correcao.length} foto{conteudo.plano_acao.imagens_correcao.length > 1 ? 's' : ''}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {conteudo.plano_acao.imagens_correcao.map((img, idx) => (
                        <Box key={idx} sx={{ position: 'relative', width: 150, height: 150 }}>
                          <img
                            src={img}
                            alt={`Foto ${idx + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              borderRadius: 4,
                              border: '2px solid #4caf50',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(img, '_blank')}
                          />
                          <Typography variant="caption" sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            bgcolor: 'rgba(0,0,0,0.7)', 
                            color: 'white', 
                            textAlign: 'center',
                            p: 0.5
                          }}>
                            Foto {idx + 1}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 2, bgcolor: '#fff9c4', borderRadius: 1, border: '1px solid #fbc02d' }}>
                <Typography variant="subtitle2" sx={{ color: '#f57f17', fontWeight: 'bold' }}>
                  ⏳ Aguardando Correção
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  O aplicador ainda não realizou a correção desta inconformidade.
                </Typography>
              </Box>
            )}

            {/* Validação (se houver) */}
            {conteudo?.resp_pa_status_alterado && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 1, border: '1px solid #9c27b0' }}>
                <Typography variant="subtitle2" sx={{ color: '#6a1b9a', fontWeight: 'bold', mb: 1 }}>
                  🔍 Validação Final
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Validado por:</strong> {conteudo.resp_pa_status_alterado}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Data:</strong> {conteudo.resp_pa_status_alterado_data ? 
                    new Date(conteudo.resp_pa_status_alterado_data.seconds * 1000).toLocaleString('pt-BR') : 'N/D'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> {conteudo.resp_pa_status}
                </Typography>
                {conteudo.resp_pa_status_parecer && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    <strong>Parecer:</strong> {conteudo.resp_pa_status_parecer}
                  </Typography>
                )}

                {Array.isArray(conteudo?.resp_pa_validacao_imagens) && conteudo.resp_pa_validacao_imagens.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      <strong>Anexos da validação:</strong> {conteudo.resp_pa_validacao_imagens.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {conteudo.resp_pa_validacao_imagens.map((imgUrl, idx) => (
                        <Box key={idx} sx={{ width: 100, height: 100 }}>
                          <img
                            src={imgUrl}
                            alt={`Validação ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '2px solid #9c27b0',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(imgUrl, '_blank')}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* Interface normal para edição/correção */
          <>
        {/* Interface específica para o aplicador */}
        {user.nivel === "aplicador" && conteudo?.resp_pa_selectedOption ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#660099' }}>
              📋 Verificação de Correção
            </Typography>

            {/* Mostrar a pergunta original */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                ❓ Pergunta:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {conteudo.question}
              </Typography>
              
              {/* Mostrar imagem da pergunta se existir */}
              {conteudo.image && conteudo.image.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {conteudo.image.map((img, idx) => (
                    <Box key={idx} sx={{ maxWidth: 200 }}>
                      <img 
                        src={typeof img === 'string' ? img : img.url} 
                        alt={`Referência ${idx + 1}`}
                        style={{ width: '100%', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Mostrar opções de resposta com destaque */}
              {conteudo.respostas && conteudo.respostas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                    🟢 Resposta Correta: {conteudo.answers} | 🔴 Sua Resposta Anterior: {conteudo.resp}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Status de resolução */}
            {conteudo?.plano_acao?.resolvido ? (
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
                <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ✅ Resolução Confirmada
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Confirmado por:</strong> {conteudo.plano_acao.resolvido_por}
                </Typography>
                <Typography variant="body2">
                  <strong>Data:</strong> {conteudo.plano_acao.resolvido_data ? 
                    new Date(conteudo.plano_acao.resolvido_data.seconds * 1000).toLocaleString('pt-BR') : 'N/D'}
                </Typography>
                <Typography variant="body2">
                  <strong>Nova Resposta:</strong> {conteudo.plano_acao.nova_resposta}
                </Typography>
              </Box>
            ) : (
              <>
                {/* AÇÕES SOLICITADAS - PRIMEIRO */}
                
                {/* Botões de resposta (Sim/Não/N/A) */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #2196f3' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#1565c0' }}>
                    1️⃣ Selecione a resposta correta:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={novaResposta === (conteudo.respostas?.[0] || "Sim") ? "contained" : "outlined"}
                      color="success"
                      startIcon={<FiCheck />}
                      onClick={() => setNovaResposta(conteudo.respostas?.[0] || "Sim")}
                      sx={{ minWidth: 100 }}
                    >
                      {conteudo.respostas?.[0] || "Sim"}
                    </Button>
                    <Button
                      variant={novaResposta === (conteudo.respostas?.[1] || "Não") ? "contained" : "outlined"}
                      color="error"
                      startIcon={<FiX />}
                      onClick={() => setNovaResposta(conteudo.respostas?.[1] || "Não")}
                      sx={{ minWidth: 100 }}
                    >
                      {conteudo.respostas?.[1] || "Não"}
                    </Button>
                    <Button
                      variant={novaResposta === "N/A" ? "contained" : "outlined"}
                      color="warning"
                      startIcon={<FiX />}
                      onClick={() => setNovaResposta("N/A")}
                      sx={{ minWidth: 100 }}
                    >
                      {conteudo.respostas?.[2] || "N/A"}
                    </Button>
                  </Box>
                </Box>

                {/* Câmera e Fotos */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#2e7d32' }}>
                    2️⃣ Anexar Fotos de Evidência da Correção:
                  </Typography>
                  
                  {/* Botões de Câmera */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FiCamera />}
                      onClick={() => setShowCamera(!showCamera)}
                    >
                      {showCamera ? "Fechar Câmera" : "Abrir Câmera"}
                    </Button>
                    <Button
                      variant="outlined"
                      component="label"
                    >
                      Galeria
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setNovasImagens([...novasImagens, e.target.files[0]]);
                            toast.success("Imagem adicionada!");
                          }
                        }}
                      />
                    </Button>
                  </Box>

                  {/* Webcam */}
                  {showCamera && (
                    <Box sx={{ mb: 2 }}>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        videoConstraints={{
                          facingMode: "environment"
                        }}
                      />
                      <Button
                        variant="contained"
                        color="success"
                        onClick={capturarFoto}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Capturar Foto
                      </Button>
                    </Box>
                  )}

                  {/* Prévia das imagens capturadas */}
                  {novasImagens.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: 'success.main' }}>
                        ✅ Imagens capturadas: {novasImagens.length}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {novasImagens.map((img, idx) => (
                          <Box key={idx} sx={{ position: 'relative', width: 100, height: 100 }}>
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Foto ${idx + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                borderRadius: 4,
                                border: '2px solid #4caf50'
                              }}
                            />
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removerImagem(idx)}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                minWidth: 24,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                p: 0
                              }}
                            >
                              X
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Comentario da correcao */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 2, border: '2px solid #cbd5f5' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#334155' }}>
                    3️⃣ Comentario sobre a correcao:
                  </Typography>
                  <TextField
                    label="Comentario"
                    value={comentarioCorrecao}
                    onChange={(e) => setComentarioCorrecao(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </Box>

                {/* INFORMAÇÕES ADICIONAIS - DEPOIS */}

                {/* Mostrar comentário do plano de ação */}
                <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📝 Orientações do Revisor:
                  </Typography>
                  <Typography variant="body2">
                    {conteudo.plano_acao?.comentario || 'Nenhum comentário disponível'}
                  </Typography>
                </Box>

                {/* Mostrar anexo do plano de ação se existir */}
                <Box sx={{ mb: 2 }}>
                  {conteudo?.plano_acao?.anexo_url && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Download />}
                        href={conteudo.plano_acao.anexo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        fullWidth
                      >
                        📎 {conteudo.plano_acao.anexo_nome || "Baixar Anexo do Plano"}
                      </Button>
                    </Box>
                  )}
                  
                  {/* Mostrar novos anexos (múltiplos) */}
                  {anexosLocal && anexosLocal.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e8d5f2', background: 'linear-gradient(135deg, #f5f0ff 0%, #fff8ff 100%)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#660099', display: 'flex', alignItems: 'center', gap: 1 }}>
                        📎 Arquivos Anexados ({anexosLocal.length})
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.5 }}>
                        {anexosLocal.map((anexo, idx) => (
                          <Link
                            key={idx}
                            href={anexo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              bgcolor: 'white',
                              borderRadius: 1.5,
                              border: '1px solid #e0d5e8',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#fafafa',
                                border: '1px solid #660099',
                                boxShadow: '0 4px 8px rgba(102, 0, 153, 0.15)',
                                transform: 'translateX(4px)'
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {getFileIcon(anexo.nome)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#660099',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {anexo.nome}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                                {new Date(anexo.data).toLocaleDateString('pt-BR')}
                              </Typography>
                            </Box>
                            <Download sx={{ color: '#660099', fontSize: '1.2rem', flexShrink: 0 }} />
                          </Link>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        ) : podeValidarPlano() ? (
          /* Interface para revisor_logistica validar plano de ação */
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#9c27b0', fontWeight: 'bold' }}>
              ✅ Validação de Plano de Ação
            </Typography>

            {/* Mostrar a pergunta */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                ❓ Pergunta:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {conteudo.question}
              </Typography>
            </Box>

            {/* Mostrar a resposta do aplicador */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#2e7d32' }}>
                ✓ Resposta:
              </Typography>
              <Typography variant="body1">
                {conteudo.resp}
              </Typography>
            </Box>

            {/* Mostrar o plano de ação definido */}
            {conteudo?.resp_pa_selectedOption && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid #9c27b0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#6a1b9a' }}>
                  📋 Plano de Ação Definido:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tipo:</strong> {conteudo.resp_pa_selectedOption}
                </Typography>
                {conteudo?.plano_acao?.comentario && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Comentário:</strong> {conteudo.plano_acao.comentario}
                  </Typography>
                )}
                {conteudo?.plano_acao?.sla_logistica && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>SLA Logística:</strong> {new Date(conteudo.plano_acao.sla_logistica.toDate()).toLocaleDateString('pt-BR')}
                  </Typography>
                )}
              </Box>
            )}

            {renderResolucaoInconformidade(false)}
          </Box>
        ) : (
          /* Interface normal para outros usuários */
          <>
            {user.nivel === "ponto_focal" ? (
              // INTERFACE SIMPLIFICADA PARA PONTO FOCAL
              <Box>
                {/* Pergunta */}
                <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1.5, border: '2px solid #ff9800' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                    ❓ Pergunta
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {conteudo.question}
                  </Typography>
                </Box>

                {/* Imagem da Pergunta (anexos do aplicador) */}
                {conteudo.imagesURL && conteudo.imagesURL.length > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 1.5, border: '2px solid #ff9800' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#ff6f00' }}>
                      📸 Imagem Anexada
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      {conteudo.imagesURL.map((img, idx) => (
                        <Box key={idx} sx={{ cursor: 'pointer' }}>
                          <img 
                            src={img.url ? img.url : img} 
                            alt={`Anexo ${idx + 1}`}
                            style={{ 
                              width: '100%', 
                              maxHeight: '250px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #ff9800',
                              boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)',
                            }}
                            onClick={() => window.open(img.url ? img.url : img, '_blank')}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Histórico de SLAs */}
                {historicoLocal && historicoLocal.length > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1.5, border: '2px solid #0277bd' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#0277bd' }}>
                      📋 Histórico de SLAs Anteriores
                    </Typography>
                    {historicoLocal.map((historico, index) => (
                      <Box key={index} sx={{ mb: 1.5, pb: 1.5, borderBottom: index < historicoLocal.length - 1 ? '1px solid #90caf9' : 'none' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: '#0277bd', fontWeight: 'bold' }}>
                          📅 {historico.data ? new Date(historico.data.seconds * 1000).toLocaleDateString('pt-BR') : 'N/D'} - {historico.usuario || 'N/D'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1565c0' }}>
                          <strong>SLA:</strong> {historico.sla ? new Date(historico.sla.toDate()).toLocaleDateString('pt-BR') : 'N/D'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#424242', mt: 0.5 }}>
                          {historico.comentario || 'Sem comentário'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {planoAcaoLocal?.sla_logistica && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1.5, border: '2px solid #43a047' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#2e7d32' }}>
                      ✅ SLA Atual
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                      <strong>Data:</strong> {new Date(planoAcaoLocal.sla_logistica.seconds ? planoAcaoLocal.sla_logistica.seconds * 1000 : planoAcaoLocal.sla_logistica).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                      <strong>Comentário:</strong> {planoAcaoLocal.comentario || 'N/D'}
                    </Typography>
                  </Box>
                )}

                {/* Formulário simplificado para Ponto Focal */}
                <Box sx={{ p: 2.5, bgcolor: '#f0f4f8', borderRadius: 1.5, border: '2px solid #0277bd', background: 'linear-gradient(135deg, #f0f4f8 0%, #e1f5fe 100%)' }}>
                  <Typography variant="h6" sx={{ mb: 2.5, color: '#01579b', fontWeight: 'bold' }}>
                    📋 Defina o Plano de Ação
                  </Typography>

                  {/* SLA - Data */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0277bd' }}>
                      📅 Data de SLA/Prazo:
                    </Typography>
                    <TextField
                      type="date"
                      value={slaLogistica}
                      onChange={(e) => setSlaLogistica(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      disabled={isReadOnly}
                      sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                  </Box>

                  {/* Comentário */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0277bd' }}>
                      💬 Ações a Executar / Comentário:
                    </Typography>
                    <TextField
                      label="Descreva as ações necessárias"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      disabled={isReadOnly}
                      sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                  </Box>

                  {/* Upload de Anexo */}
                  <Box sx={{ mb: 2.5, p: 2, bgcolor: 'white', borderRadius: 1.5, border: '2px dashed #0277bd' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: '#0277bd' }}>
                      📎 Anexe Documentos/Evidências (Opcional)
                    </Typography>
                    <input
                      ref={inputFileRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={isReadOnly}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => inputFileRef.current?.click()}
                      fullWidth
                      disabled={isReadOnly || uploading}
                    >
                      {uploading ? 'Enviando...' : '⬆️ Selecionar Arquivos'}
                    </Button>
                    {arquivosSelecionados.length > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {arquivosSelecionados.map((arquivo, idx) => (
                          <Chip
                            key={idx}
                            label={arquivo.name}
                            onDelete={() => {
                              setArquivosSelecionados(prev => prev.filter((_, i) => i !== idx));
                            }}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : (user.nivel === "revisor" || user.nivel === "administrador") ? (
              // REVISOR / ADMINISTRADOR COM ABAS
              <Box>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: '2px solid #660099', mb: 2 }}>
                  <Tab label="📋 Plano de Ação" />
                  <Tab label="🏢 OEM" />
                </Tabs>

                {activeTab === 0 && (
                  // Aba Plano de Ação
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, color: '#660099', fontWeight: 'bold', borderBottom: '2px solid #660099', pb: 1 }}>
                      📋 Plano de Ação
                    </Typography>

                    {/* Card para seleção do tipo de resposta */}
                    <Box sx={{ p: 3, bgcolor: '#f3e5f5', borderRadius: 2, mb: 3, border: '2px solid #660099', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#6a1b9a', display: 'flex', alignItems: 'center', gap: 1 }}>
                        🎯 Responsável
                      </Typography>
                      <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1.5 }}>Selecione a opção</FormLabel>
                        <RadioGroup
                          row
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        >
                          <FormControlLabel 
                            value="Sim" 
                            control={<Radio />} 
                            label="✓ Sim" 
                            disabled={isReadOnly}
                            sx={{ mr: 3 }}
                          />
                          <FormControlLabel 
                            value="Não" 
                            control={<Radio />} 
                            label="✗ Não" 
                            disabled={isReadOnly}
                            sx={{ mr: 3 }}
                          />
                          <FormControlLabel 
                            value="Patrimonio" 
                            control={<Radio />} 
                            label="🏗️ Patrimonio" 
                            disabled={isReadOnly}
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>

                    {/* Inputs baseado na seleção */}
                    <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#424242' }}>
                        📝 Detalhes:
                      </Typography>
                      {renderOptionInputs()}
                    </Box>

                    {/* Card de informações se já foi respondido */}
                    {conteudo?.resp_pa_user_name && (
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ✓ Última Atualização
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          <Typography variant="body2">
                            <strong>👤 Por:</strong> {conteudo.resp_pa_user_name}
                          </Typography>
                          <Typography variant="body2">
                            <strong>📅 Data:</strong> {conteudo.resp_pa_data ? new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString('pt-BR') : "N/D"}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Card de validação se existir */}
                    {conteudo?.resp_pa_status_alterado && (
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f3f4f6', borderRadius: 2, border: '2px solid #4b5563', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
                          🔍 Validação
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          <Typography variant="body2">
                            <strong>✓ Validado por:</strong> {conteudo.resp_pa_status_alterado}
                          </Typography>
                          <Typography variant="body2">
                            <strong>📅 Data:</strong> {conteudo.resp_pa_status_alterado_data ? new Date(conteudo.resp_pa_status_alterado_data.seconds * 1000).toLocaleString('pt-BR') : "N/D"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> <Chip label={conteudo.resp_pa_status} color="primary" size="small" />
                          </Typography>
                          {conteudo.resp_pa_status_parecer && (
                            <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #6a1b9a' }}>
                              <strong>💬 Parecer:</strong> {conteudo.resp_pa_status_parecer}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 1 && (
                  // Aba OEM - Layout bonito
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, color: '#d32f2f', fontWeight: 'bold', borderBottom: '2px solid #d32f2f', pb: 1 }}>
                      🏢 Gestão OEM
                    </Typography>

                    {/* Card para seleção do tipo de resposta */}
                    <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 2, mb: 3, border: '2px solid #d32f2f', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#b71c1c', display: 'flex', alignItems: 'center', gap: 1 }}>
                        📋 Classificação OEM
                      </Typography>
                      <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1.5 }}>Tipo de Resposta OEM</FormLabel>
                        <RadioGroup
                          row
                          value={selectedOptionOEM}
                          onChange={(e) => setSelectedOptionOEM(e.target.value)}
                        >
                          <FormControlLabel 
                            value="Sim" 
                            control={<Radio />} 
                            label="✓ Sim" 
                            disabled={isReadOnly}
                            sx={{ mr: 3 }}
                          />
                          <FormControlLabel 
                            value="Não" 
                            control={<Radio />} 
                            label="✗ Não" 
                            disabled={isReadOnly}
                            sx={{ mr: 3 }}
                          />
                          <FormControlLabel 
                            value="Detentora" 
                            control={<Radio />} 
                            label="🏛️ Detentora" 
                            disabled={isReadOnly}
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>

                    {/* Inputs baseado na seleção */}
                    <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#424242' }}>
                        📝 Detalhes da Resposta OEM:
                      </Typography>
                      {renderOptionInputsOEM()}
                    </Box>

                    {/* Card de informações se já foi respondido */}
                    {conteudo?.resp_pa_user_name && (
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ✓ Última Atualização
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          <Typography variant="body2">
                            <strong>👤 Por:</strong> {conteudo.resp_pa_user_name}
                          </Typography>
                          <Typography variant="body2">
                            <strong>📅 Data:</strong> {conteudo.resp_pa_data ? new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString('pt-BR') : "N/D"}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Card de validação se existir */}
                    {conteudo?.resp_pa_status_alterado && (
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid #9c27b0', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#6a1b9a', display: 'flex', alignItems: 'center', gap: 1 }}>
                          🔍 Validação OEM
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          <Typography variant="body2">
                            <strong>✓ Validado por:</strong> {conteudo.resp_pa_status_alterado}
                          </Typography>
                          <Typography variant="body2">
                            <strong>📅 Data:</strong> {conteudo.resp_pa_status_alterado_data ? new Date(conteudo.resp_pa_status_alterado_data.seconds * 1000).toLocaleString('pt-BR') : "N/D"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> <Chip label={conteudo.resp_pa_status} color="primary" size="small" />
                          </Typography>
                          {conteudo.resp_pa_status_parecer && (
                            <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #9c27b0' }}>
                              <strong>💬 Parecer:</strong> {conteudo.resp_pa_status_parecer}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {conteudo?.resp_pa_user_name && (
                  <Box mt={2}>
                    <Typography variant="subtitle1"><strong>Respondido por:</strong> {conteudo.resp_pa_user_name}</Typography>
                    <Typography variant="subtitle1"><strong>Data:</strong> {conteudo.resp_pa_data ? new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString() : ""}</Typography>
                  </Box>
                )}
                {conteudo?.resp_pa_status_alterado && (
                  <Box mt={2}>
                    <Typography variant="subtitle1"><strong>Validado por:</strong> {conteudo.resp_pa_status_alterado}</Typography>
                    <Typography variant="subtitle1"><strong>Data:</strong> {conteudo.resp_pa_status_alterado_data ? new Date(conteudo.resp_pa_status_alterado_data.seconds * 1000).toLocaleString() : ""}</Typography>
                    <Typography variant="subtitle1"><strong>Status:</strong> {conteudo.resp_pa_status}</Typography>
                    <Typography variant="subtitle1"><strong>Parecer da segurança:</strong> {conteudo.resp_pa_status_parecer}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              // OUTROS USUÁRIOS (administrador, etc)
              <Box>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">Responsável</FormLabel>
                  <RadioGroup
                    row
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  >
                    {user.nivel === "revisor_logistica" ? (
                      // Revisor de logística só vê a opção Logística
                      <FormControlLabel value="Logistica" control={<Radio />} label="Logística" disabled={isReadOnly} />
                    ) : (
                      // Administrador e outros usuários veem todas as opções
                      <>
                        <FormControlLabel value="Sim" control={<Radio />} label="Sim" disabled={isReadOnly} />
                        <FormControlLabel value="Não" control={<Radio />} label="Não" disabled={isReadOnly} />
                        <FormControlLabel value="Detentora" control={<Radio />} label="Detentora" disabled={isReadOnly} />
                        <FormControlLabel value="Patrimonio" control={<Radio />} label="Patrimonio" disabled={isReadOnly} />
                        <FormControlLabel value="Logistica" control={<Radio />} label="Logística" disabled={isReadOnly} />
                      </>
                    )}
                  </RadioGroup>
                </FormControl>
                <Box mt={2}>{renderOptionInputs()}</Box>
                {conteudo?.resp_pa_user_name && (
                  <Box mt={2}>
                    <Typography variant="subtitle1"><strong>Respondido por:</strong> {conteudo.resp_pa_user_name}</Typography>
                    <Typography variant="subtitle1"><strong>Data:</strong> {conteudo.resp_pa_data ? new Date(conteudo.resp_pa_data.seconds * 1000).toLocaleString() : ""}</Typography>
                  </Box>
                )}
                {conteudo?.resp_pa_status_alterado && (
                  <Box mt={2}>
                    <Typography variant="subtitle1"><strong>Validado por:</strong> {conteudo.resp_pa_status_alterado}</Typography>
                    <Typography variant="subtitle1"><strong>Data:</strong> {conteudo.resp_pa_status_alterado_data ? new Date(conteudo.resp_pa_status_alterado_data.seconds * 1000).toLocaleString() : ""}</Typography>
                    <Typography variant="subtitle1"><strong>Status:</strong> {conteudo.resp_pa_status}</Typography>
                    <Typography variant="subtitle1"><strong>Parecer da segurança:</strong> {conteudo.resp_pa_status_parecer}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="error" variant="outlined">
          Cancelar
        </Button>
        
        {(user.nivel === "ponto_focal" || user.nivel === "revisor_logistica") && !isModoVisualizacao && (
          <Button 
            onClick={() => alterarPA()} 
            variant="contained" 
            color={todosOsPlanosForamDefinidos() ? "success" : "warning"}
            size="large"
            startIcon={<FiCheck />}
            disabled={!slaLogistica || !comentario}
            title="Preencha SLA e comentário"
          >
            ➕ Adicionar
          </Button>
        )}
        
        {podeValidarPlano() && conteudo?.resp_pa_selectedOption && (
          <Button 
            onClick={() => UpdatePA()} 
            variant="contained" 
            color="success"
            size="large"
            startIcon={<FiCheck />}
            disabled={!resolucaoInconformidade || !notaParecer?.trim()}
          >
            ✅ {resolucaoInconformidade === 'sim' ? 'Aprovar' : 'Reprovar'} Plano de Ação
          </Button>
        )}
        
        {user.nivel === "aplicador" && conteudo?.resp_pa_selectedOption && !conteudo?.plano_acao?.resolvido && (
          <Button 
            onClick={() => confirmarResolucao()} 
            variant="contained" 
            color="success"
            disabled={!novaResposta || novasImagens.length === 0}
          >
            ✅ Confirmar Correção
          </Button>
        )}
        {user.nivel !== "aplicador" && user.nivel !== "ponto_focal" && user.nivel !== "revisor_logistica" && !isReadOnly && (
          <Button onClick={() => alterarPA()} variant="contained" color="primary">
            Salvar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
