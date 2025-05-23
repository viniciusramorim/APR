import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiFileText } from "react-icons/fi";
import firebase from "../../services/firebaseConnection.js";
import Header from "../../components/Header/index.js";
import Title from "../../components/Title/index.js";
import { AuthContext } from "../../contexts/auth.js";
import "./report.scss";
import { Button, FormControl, Grid, Accordion, AccordionSummary, AccordionDetails, Typography, CardMedia, Box, Modal, TextField, Select, MenuItem, InputLabel } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toast } from 'react-toastify';

export default function Patrimonio() {
  const { user } = useContext(AuthContext);

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [tempo, setTempo] = useState("");
  const [comentario, setComentario] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [nomeDetentora, setNomeDetentora] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");

  useEffect(() => {
    addBodyClass('page-reports');
  }, []);

  async function loadChamados() {
    setLoading(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");

      query = user.area === 'patrimonial' ? query.where("status", "in", ["Respondido pela Area", "Enviado"]) : query
      const snapshot = await query.get();
      const list = [];

      snapshot.forEach((doc) => {
        doc.data().checklist.forEach((area) => {
          area[1].forEach((question) => {
            const docInclude = question.resp !== "" && question.resp !== "N/A" && question.resp !== question.respGabarito && question.openPA === true && question.areaResposavel?.includes("patrimonio")
            if (docInclude) {
              list.push({
                id: doc.data().apr_id,
                sigla: doc.data().site_id.Sigla,
                uf: doc.data().site_id.Estado,
                municipio: doc.data().site_id.Cidade,
                endereco: doc.data().site_id.Endereco,
                nome: doc.data().site_id.Nome,
                status: doc.data().status,
                ...question
              });
            }
          })
        })
      });

      setChamados(list);
    } catch (err) {
      console.error("Deu algum erro: ", err);
    }
    setLoading(false);
  }

  const groupedByUF = chamados.reduce((acc, question) => {
    const { uf, municipio, sigla } = question;
    if (!acc[uf]) {
      acc[uf] = {};
    }
    if (!acc[uf][municipio]) {
      acc[uf][municipio] = {};
    }
    if (!acc[uf][municipio][sigla]) {
      acc[uf][municipio][sigla] = [];
    }
    acc[uf][municipio][sigla].push(question);
    return acc;
  }, {});

  const handleOpenModal = (question) => {
    setSelectedQuestion(question);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedQuestion(null);
    setSelectedOption("");
    setTempo("");
    setComentario("");
    setJustificativa("");
    setNomeDetentora("");
    setNumeroChamado("");
  };

  async function alterarPA() {
    if (!selectedQuestion) return;

    const docRef = firebase.firestore().collection("aprs-producao").doc(selectedQuestion.id);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const plano = dados.checklist[selectedQuestion.area][1][selectedQuestion.index];

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
    toast.success("Plano de ação atualizado");
    loadChamados();
    handleCloseModal();
  }

  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Patrimonio">
          <FiFileText size={25} onClick={() => console.log(Object.keys(groupedByUF))} />
        </Title>
        <div className="filter-reports-container">
          <div className="filter-reports">
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <FormControl>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={loadChamados}
                    disabled={loading}
                    style={{ borderColor: "#380054e8", color: "#380054e8" }}
                  >
                    {loading ? "Carregando..." : "Filtrar"}
                  </Button>
                  <i>APR´s carregadas: {chamados.length}</i>
                </FormControl>
              </Grid>
            </Grid>
          </div>
        </div>
        <div className="container reports">
          <div className="questions-list">
            {Object.keys(groupedByUF).map((uf, ufIndex) => (
              <Accordion key={ufIndex} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel-uf-${ufIndex}-content`}
                  id={`panel-uf-${ufIndex}-header`}
                >
                  <Typography variant="h6">{uf}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.keys(groupedByUF[uf]).map((municipio, municipioIndex) => (
                    <Accordion key={municipioIndex} sx={{ mb: 2 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel-municipio-${municipioIndex}-content`}
                        id={`panel-municipio-${municipioIndex}-header`}
                      >
                        <Typography variant="h6">{municipio}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {Object.keys(groupedByUF[uf][municipio]).map((sigla, siglaIndex) => (
                          <Accordion key={siglaIndex} sx={{ mb: 2 }}>
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              aria-controls={`panel-sigla-${siglaIndex}-content`}
                              id={`panel-sigla-${siglaIndex}-header`}
                            >
                              <Typography variant="h6">
                                {sigla} - {groupedByUF[uf][municipio][sigla][0].nome} - {groupedByUF[uf][municipio][sigla][0].endereco} - ID: {groupedByUF[uf][municipio][sigla][0].id}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {groupedByUF[uf][municipio][sigla].map((question, index) => (
                                <Accordion key={index} sx={{ mb: 2 }}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`panel-question-${index}-content`}
                                    id={`panel-question-${index}-header`}
                                  >
                                    <Typography variant="h6">Inconformidade {index + 1} - {question.status} </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Box mb={2}>
                                      <Typography variant="body1" color="text.secondary">
                                        <strong>Pergunta:</strong> {question.question}
                                      </Typography>
                                    </Box>
                                    {question.imagesURL && question.imagesURL.length > 0 && (
                                      <Box mb={2}>
                                        <CardMedia
                                          component="img"
                                          height="200"
                                          image={question.imagesURL[0].url}
                                          alt={`Imagem da questão ${index + 1}`}
                                          sx={{ borderRadius: 2, width: 'fit-content' }}
                                        />
                                      </Box>
                                    )}
                                    <Box mb={2}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Resposta:</strong> {question.resp}
                                      </Typography>
                                    </Box>
                                    <Box mb={2}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Comentário:</strong> {question.respTextArea || "Nenhum comentário fornecido"}
                                      </Typography>
                                    </Box>
                                    <Button variant="contained" color="primary" onClick={() => handleOpenModal(question)}>
                                      Inserir Plano de Ação
                                    </Button>
                                  </AccordionDetails>
                                </Accordion>
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </div>
      </div>
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
          <Typography variant="h6" component="h2">
            Inserir Plano de Ação
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="select-option-label">Opção</InputLabel>
            <Select
              labelId="select-option-label"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <MenuItem value="Sim">Sim</MenuItem>
              <MenuItem value="Não">Não</MenuItem>
              <MenuItem value="Detentora">Detentora</MenuItem>
              <MenuItem value="Patrimonio">Patrimonio</MenuItem>
            </Select>
          </FormControl>
          {selectedOption === "Sim" && (
            <TextField
              fullWidth
              label="SLA (data)"
              type="date"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          )}
          {selectedOption === "Não" && (
            <TextField
              fullWidth
              label="Justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
          {(selectedOption === "Detentora" || selectedOption === "Patrimonio") && (
            <TextField
              fullWidth
              label="Número de Chamado"
              value={numeroChamado}
              onChange={(e) => setNumeroChamado(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
          {selectedOption === "Detentora" && (
            <TextField
              fullWidth
              label="Nome da Detentora"
              value={nomeDetentora}
              onChange={(e) => setNomeDetentora(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
          <TextField
            fullWidth
            label="Comentário"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button variant="contained" color="primary" onClick={alterarPA} sx={{ mt: 2 }}>
            Salvar
          </Button>
        </Box>
      </Modal>
    </div>
  );
}