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
} from "@mui/material";
import { Download } from "@mui/icons-material";

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
  const [nomeDetentora, setNomeDetentora] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [slaLogistica, setSlaLogistica] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notaParecer, setNotaParecer] = useState("");
  const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
  const [novaResposta, setNovaResposta] = useState("");
  const [novasImagens, setNovasImagens] = useState([]);
  const [comentarioCorrecao, setComentarioCorrecao] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);

  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const index = checklist[area][1].findIndex(
    (object) => object?.question === conteudo.question
  );

  useEffect(() => {
    function loadConstants() {
      setTempo(conteudo?.plano_acao?.tempo || "");
      setComentario(conteudo?.plano_acao?.comentario || "");

      // Se for revisor_logistica, definir "Logistica" como padrão
      const defaultOption = (user.nivel === "revisor_logistica") ? "Logistica" : "";

      setSelectedOption(
        conteudo?.resp_pa_selectedOption || conteudo?.plano_acao?.selectedOption || defaultOption
      );
      setJustificativa(conteudo?.plano_acao?.justificativa || "");
      setNomeDetentora(conteudo?.plano_acao?.nome_detentora || "");
      setNumeroChamado(conteudo?.plano_acao?.numero_chamado || "");
      setSlaLogistica(conteudo?.plano_acao?.sla_logistica ?
        new Date(conteudo.plano_acao.sla_logistica.toDate()).toISOString().split('T')[0] : "");
      setNotaParecer(conteudo?.nota_parecer || "");
    }

    loadConstants();
  }, []);

  // Variável para bloquear edição baseada no usuário e status
  // Revisor, revisor_logistica e administrador podem sempre editar o SLA e comentário da opção Logística
  // Para revisor_logistica, isReadOnly só é true se a pergunta já tem um plano de ação definido (para mostrar o botão Validar)
  const isReadOnly = conteudo?.resp_pa_selectedOption && 
    user.nivel !== "revisor_logistica" && 
    !((user.nivel === "revisor" || user.nivel === "administrador") && conteudo?.resp_pa_selectedOption === "Logistica");

  // Modo visualização: mostrar histórico completo quando APR está em status final
  // Revisor_logistica e ponto_focal não entram em modo visualização pois precisam continuar definindo SLAs
  const statusVisualizacao = ["Revisado", "Enviado", "Concluido", "Respondido pela Area"];
  const isModoVisualizacao = statusVisualizacao.includes(apr.status) && conteudo?.resp_pa_selectedOption && 
    user.nivel !== "revisor_logistica" && user.nivel !== "ponto_focal";

  async function alterarPA() {
    if (isReadOnly) return; // segurança extra para não alterar se for somente leitura

    const docRef = firebase.firestore().collection(base).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];

    // Validações básicas
    if (selectedOption === "Sim") {
      if (!tempo) return toast("Selecione um SLA (data)");
      if (!comentario) return toast("Preencha um comentário");
    } else if (selectedOption === "Não") {
      if (!justificativa) return toast("Selecione uma justificativa");
      if (!comentario) return toast("Preencha um comentário");
    } else if (selectedOption === "Detentora") {
      if (!nomeDetentora) return toast("Preencha a detentora");
      if (!numeroChamado) return toast("Preencha o número de chamado");
      if (!comentario) return toast("Preencha um comentário");
    } else if (selectedOption === "Patrimonio") {
      if (!numeroChamado) return toast("Preencha o número de chamado");
      if (!comentario) return toast("Preencha um comentário");
    } else if (selectedOption === "Logistica") {
      if (!slaLogistica) return toast("Preencha o SLA (data)");
      if (!comentario) return toast("Preencha um comentário");
    } else {
      return toast("Selecione uma opção");
    }

    // Monta o objeto plano_acao para salvar
    let planoAcaoToSave = {};
    if (selectedOption === "Sim") {
      planoAcaoToSave = {
        tempo,
        comentario,
      };
    } else if (selectedOption === "Não") {
      planoAcaoToSave = { justificativa, comentario };
    } else if (selectedOption === "Detentora") {
      planoAcaoToSave = {
        nome_detentora: nomeDetentora,
        numero_chamado: numeroChamado,
        comentario,
      };
    } else if (selectedOption === "Patrimonio") {
      planoAcaoToSave = {
        numero_chamado: numeroChamado,
        comentario,
      };
    } else if (selectedOption === "Logistica") {
      // Inicializar histórico se não existir
      const historicoAtual = plano.plano_acao?.historico_logistica || [];
      
      // Adicionar entrada atual ao histórico se já existe SLA
      if (plano.plano_acao?.sla_logistica) {
        historicoAtual.push({
          data: new Date(),
          usuario: user.nome,
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
    plano.resp_pa_selectedOption = selectedOption;
    plano.resp_pa_data = new Date();
    plano.resp_pa_user_name = user.nome;
    plano.resp_pa_user_id = user.uid;

    await docRef.update(dados);

    // Se for revisor de logística finalizando plano de ação, atualizar status da APR
    if (user.nivel === "revisor_logistica") {
      await updateAPRStatusLogistics(id);
    } else {
      await updateAPR(id);
    }

    toast.success("Plano de ação atualizado");
    loadApr();
    close();
  }

  async function UpdatePA() {
    const docRef = firebase.firestore().collection(base).doc(id);

    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];

    plano.resp_pa_status_alterado_data = new Date();
    plano.resp_pa_status_alterado = user.nome;
    plano.resp_pa_status_parecer = notaParecer;
    plano.resp_pa_status = "Concluido";

    await docRef.update(dados);

    toast.success("Plano de ação validado");
    loadApr();
  }

  async function salvarNovoSLA() {
    if (!slaLogistica) return toast.error("Preencha o SLA (data)");
    if (!comentario) return toast.error("Preencha um comentário");

    const docRef = firebase.firestore().collection(base).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[area][1][index];

    // Inicializar histórico se não existir
    const historicoAtual = plano.plano_acao?.historico_logistica || [];
    
    // Adicionar o SLA atual ao histórico (novo registro)
    historicoAtual.push({
      data: new Date(),
      usuario: user.nome,
      sla: new Date(slaLogistica),
      comentario: comentario,
    });

    // Atualizar o plano_acao mantendo o SLA atual e adicionando ao histórico
    plano.plano_acao = {
      ...plano.plano_acao,
      sla_logistica: new Date(slaLogistica),
      comentario: comentario,
      historico_logistica: historicoAtual,
    };

    plano.resp_pa_selectedOption = "Logistica";
    plano.resp_pa_data = new Date();
    plano.resp_pa_user_name = user.nome;
    plano.resp_pa_user_id = user.uid;

    await docRef.update(dados);

    toast.success("SLA salvo com sucesso!");
    setSlaLogistica("");
    setComentario("");
    loadApr();
  }

  async function updateAPR(id) {
    await firebase.firestore().collection(base).doc(id).update({
      status: "Respondido pela Area",
      data_alteracao: new Date(),
    });
  }

  // Nova função para atualizar status quando ponto focal finaliza
  async function updateAPRStatusLogistics(id) {
    await firebase.firestore().collection(base).doc(id).update({
      status: "Aguardando Revisão",
      data_ponto_focal_resposta: firebase.firestore.FieldValue.serverTimestamp(),
      data_alteracao: new Date(),
    });
  }

  // Upload do arquivo para Storage Firebase
  async function handleArquivoChange(e) {
    if (isReadOnly) return; // bloqueia upload se somente leitura
    if (!e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Arquivo deve ter até 10MB");
    }

    setUploading(true);

    try {
      const storageRef = firebase.storage().ref();
      const arquivoRef = storageRef.child(
        `anexos_pa/${id}/${area}_q${index}_${file.name}`
      );

      // Faz upload
      await arquivoRef.put(file);

      // Pega URL do arquivo
      const url = await arquivoRef.getDownloadURL();

      // Atualiza o campo no Firestore
      const docRef = firebase.firestore().collection(base).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return toast.error("Documento não encontrado");
      const dados = doc.data();
      const plano = dados.checklist[area][1][index];

      // Atualiza anexo no plano_acao
      plano.plano_acao = {
        ...plano.plano_acao,
        anexo_url: url,
        anexo_nome: file.name,
      };

      await docRef.update(dados);

      toast.success("Arquivo anexado com sucesso!");
      loadApr();
    } catch (error) {
      toast.error("Erro ao enviar arquivo: " + error.message);
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
            {conteudo?.plano_acao?.historico_logistica && conteudo.plano_acao.historico_logistica.length > 0 && (
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
                {conteudo.plano_acao.historico_logistica.map((historico, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 1.5, 
                      pb: 1.5, 
                      borderBottom: index < conteudo.plano_acao.historico_logistica.length - 1 ? '1px solid #ddd' : 'none' 
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
            conteudo?.plano_acao?.anexo_url && (
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
            )
          ) : (
            <input type="file" onChange={handleArquivoChange} disabled={uploading} />
          )}
        </Box>
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

            {/* Histórico de SLAs anteriores se existir */}
            {conteudo?.plano_acao?.historico_logistica && conteudo.plano_acao.historico_logistica.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid #9c27b0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#6a1b9a' }}>
                  📜 Histórico de SLAs Anteriores:
                </Typography>
                {conteudo.plano_acao.historico_logistica.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #9c27b0' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                      🕐 {new Date(item.data.seconds * 1000).toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      👤 {item.usuario}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      📅 SLA: {new Date(item.sla.seconds * 1000).toLocaleDateString('pt-BR')}
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
                    <Button 
                      onClick={() => UpdatePA()} 
                      variant="contained" 
                      color="success"
                      fullWidth
                    >
                      ✅ Validar SLA
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Formulário para definir SLA */}
            {user.nivel !== "revisor_logistica" && (
            <Box sx={{ mb: 3, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#0d47a1' }}>
                📅 {conteudo?.plano_acao?.sla_logistica ? "Redefinir SLA:" : "Definir SLA:"}
              </Typography>
              
              <TextField
                label="SLA (Data)"
                type="date"
                value={slaLogistica}
                onChange={(e) => setSlaLogistica(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Defina o prazo para tratativa de logística"
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
                helperText={conteudo?.plano_acao?.sla_logistica ? "Explique o motivo da alteração do SLA" : "Descreva as ações planejadas"}
              />
              
              <Button
                onClick={() => salvarNovoSLA()}
                variant="contained"
                color="primary"
                startIcon={<FiCheck />}
                disabled={!slaLogistica || !comentario}
                sx={{ mt: 2 }}
              >
                ➕ Adicionar
              </Button>
            </Box>
            )}

            {/* Área para anexar arquivo */}
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                📎 Anexar Documento (Opcional):
              </Typography>
              
              {conteudo?.plano_acao?.anexo_url ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Download />}
                    href={conteudo.plano_acao.anexo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {conteudo.plano_acao.anexo_nome || "Baixar Anexo Atual"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Você pode substituir o anexo selecionando um novo arquivo
                  </Typography>
                </Box>
              ) : null}
              
              <input 
                type="file" 
                onChange={handleArquivoChange} 
                disabled={uploading}
                style={{ marginTop: '8px' }}
              />
              {uploading && <Typography variant="caption" color="primary">Enviando arquivo...</Typography>}
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
            {conteudo?.plano_acao?.anexo_url && (
              <Box sx={{ mb: 3 }}>
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
              </>
            )}
          </Box>
        ) : (
          /* Interface normal para outros usuários */
          <>
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
                ) : user.nivel === "revisor" ? (
                  // Revisor comum NÃO vê a opção Logística
                  <>
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" disabled={isReadOnly} />
                    <FormControlLabel value="Não" control={<Radio />} label="Não" disabled={isReadOnly} />
                    <FormControlLabel value="Detentora" control={<Radio />} label="Detentora" disabled={isReadOnly} />
                    <FormControlLabel value="Patrimonio" control={<Radio />} label="Patrimonio" disabled={isReadOnly} />
                  </>
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
            {(user.nivel === "revisor" || user.nivel === "revisor_logistica" || user.nivel === "administrador") && isReadOnly && !conteudo.resp_pa_status && (
              <TextField
                label="Nota Parecer"
                value={notaParecer}
                onChange={(e) => setNotaParecer(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              />
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
        
        {/* Botão específico para ponto_focal e revisor_logistica salvarem SLA */}
        {(user.nivel === "ponto_focal" || user.nivel === "revisor_logistica") && !isModoVisualizacao && (
          <Button 
            onClick={() => alterarPA()} 
            variant="contained" 
            color="primary"
            size="large"
            startIcon={<FiCheck />}
            disabled={!slaLogistica || !comentario}
          >
            💾 Salvar
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