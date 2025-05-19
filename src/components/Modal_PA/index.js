import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";

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
  const [uploading, setUploading] = useState(false);
  const [notaParecer, setNotaParecer] = useState("");

  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const index = checklist[area][1].findIndex(
    (object) => object?.question === conteudo.question
  );

  useEffect(() => {
    function loadConstants() {
      setTempo(conteudo?.plano_acao?.tempo || "");
      setComentario(conteudo?.plano_acao?.comentario || "");
      setSelectedOption(
        conteudo?.resp_pa_selectedOption || conteudo?.plano_acao?.selectedOption || ""
      );
      setJustificativa(conteudo?.plano_acao?.justificativa || "");
      setNomeDetentora(conteudo?.plano_acao?.nome_detentora || "");
      setNumeroChamado(conteudo?.plano_acao?.numero_chamado || "");
      setNotaParecer(conteudo?.nota_parecer || "");
    }

    loadConstants();
  }, []);

  // Variável para bloquear edição se já existir plano de ação preenchido com anexo
  const isReadOnly = conteudo?.resp_pa_selectedOption;

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
    await updateAPR(id);
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

    toast.success("Plano de ação finalizado");
    loadApr();
    close();
  }

  async function updateAPR(id) {
    await firebase.firestore().collection(base).doc(id).update({
      status: "Respondido pela Area",
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
    <Dialog open={true} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Plano de Ação</DialogTitle>
      <DialogContent dividers>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Responsável</FormLabel>
          <RadioGroup
            row
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <FormControlLabel value="Sim" control={<Radio />} label="Sim" disabled={isReadOnly} />
            <FormControlLabel value="Não" control={<Radio />} label="Não" disabled={isReadOnly} />
            <FormControlLabel value="Detentora" control={<Radio />} label="Detentora" disabled={isReadOnly} />
            <FormControlLabel value="Patrimonio" control={<Radio />} label="Patrimonio" disabled={isReadOnly} />
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
        {(user.nivel === "revisor" || user.nivel === "administrador") && isReadOnly && !conteudo.resp_pa_status && (
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
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="error" variant="outlined">
          Cancelar
        </Button>
        {!isReadOnly && (
          <Button onClick={() => alterarPA()} variant="contained" color="primary">
            Salvar
          </Button>
        )}
        {(conteudo.resp_pa_status !== 'Concluido' && apr.status === "Respondido pela Area" && isReadOnly && (user.nivel === "revisor" || user.nivel === "administrador")) && (
          <Button onClick={() => UpdatePA()} variant="contained" color="success">
            Validar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}