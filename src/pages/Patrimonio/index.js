import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiFileText } from "react-icons/fi";
import firebase from "../../services/firebaseConnection.js";
import Header from "../../components/Header/index.js";
import Title from "../../components/Title/index.js";
import { AuthContext } from "../../contexts/auth.js";
import "./report.scss";
import {
  Button,
  FormControl,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CardMedia,
  Box,
  Modal,
  TextField,
  Divider,
  Card
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "react-toastify";

export default function Patrimonio() {
  const { user } = useContext(AuthContext);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState("Patrimonio");
  const [tempo, setTempo] = useState("");
  const [comentario, setComentario] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [isEditDisabled, setIsEditDisabled] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const [totalPA, setTotalPA] = useState(0);
  const [tratadosPA, setTratadosPA] = useState(0);
  const [pendentesPA, setPendentesPA] = useState(0);


  useEffect(() => {
    addBodyClass("page-reports");
  }, []);

  async function loadChamados() {
    setLoading(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");
      query =
        user.area === "patrimonio" || user.nivel === "administrador"  || user.nivel === "revisor"
          ? query.where("status", "in", ["Respondido pela Area", "Enviado"])
          : query.where("status", "in", ["Nenhum"]);
      const snapshot = await query.get();
      const list = [];

      snapshot.forEach((doc) => {
        doc.data().checklist.forEach((area) => {
          area[1].forEach((question, idx) => {
            const docInclude =
              question.resp !== "" &&
              question.resp !== "N/A" &&
              question.resp !== question.respGabarito &&
              question.openPA === true &&
              question.areaResposavel?.includes("patrimonio");
            if (docInclude) {
              list.push({
                uid: doc.id,
                id: doc.data().apr_id,
                sigla: doc.data().site_id.Sigla,
                uf: doc.data().site_id.Estado,
                municipio: doc.data().site_id.Cidade,
                endereco: doc.data().site_id.Endereco,
                nome: doc.data().site_id.Nome,
                status: doc.data().status,
                area: area[0],
                index: idx,
                ...question
              });
            }
          });
        });
      });

      setChamados(list);
      setTotalPA(list.length);
      setTratadosPA(list.filter(item => item.plano_acao?.comentario).length);
      setPendentesPA(list.filter(item => !item.plano_acao?.comentario).length);
    } catch (err) {
      console.error("Deu algum erro: ", err);
    }
    setLoading(false);
  }

  const groupByUF = chamados.reduce((acc, chamado) => {
    if (!acc[chamado.uf]) acc[chamado.uf] = {};
    if (!acc[chamado.uf][chamado.municipio]) acc[chamado.uf][chamado.municipio] = [];
    acc[chamado.uf][chamado.municipio].push(chamado);
    return acc;
  }, {});

  const handleOpenModal = (question) => {
    console.log(question)
    const hasPlanoAcao = !!question?.plano_acao?.comentario || !!question?.plano_acao?.numero_chamado || !!question?.plano_acao?.tempo;
    setIsEditDisabled(hasPlanoAcao);
    setSelectedQuestion(question);
    setNumeroChamado(question?.plano_acao?.numero_chamado || "");
    setTempo(question?.plano_acao?.tempo || "");
    setComentario(question?.plano_acao?.comentario || "");
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedQuestion(null);
    setSelectedOption("Patrimonio");
    setTempo("");
    setComentario("");
    setNumeroChamado("");
  };

  async function alterarPA() {
    if (!selectedQuestion || !selectedQuestion.uid) {
      return toast.error("Questão selecionada inválida");
    }

    const docRef = firebase
      .firestore()
      .collection("aprs-producao")
      .doc(selectedQuestion.uid);
    const doc = await docRef.get();
    if (!doc.exists) return toast.error("Documento não encontrado");

    const dados = doc.data();
    const areaIndex = dados.checklist.findIndex(x => x[0] === selectedQuestion.area);
    const plano = dados.checklist[areaIndex][1][selectedQuestion.index];

    if (!numeroChamado || !comentario || !tempo) {
      return toast("Preencha todos os campos");
    }

    let planoAcaoToSave = {
      numero_chamado: numeroChamado,
      comentario,
      tempo
    };

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
          <FiFileText size={25} onClick={() => console.log(chamados)} />
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
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ my: 2 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                  <Typography variant="h6">Total de Planos de Ação</Typography>
                  <Typography variant="h4" color="primary">{totalPA}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#e8f5e9" }}>
                  <Typography variant="h6">Tratados</Typography>
                  <Typography variant="h4" color="success.main">{tratadosPA}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#ffebee" }}>
                  <Typography variant="h6">Pendentes</Typography>
                  <Typography variant="h4" color="error.main">{pendentesPA}</Typography>
                </Card>
              </Grid>
            </Grid>
          </div>
        </div>

        <div className="container reports">
          <div className="questions-list">
            {Object.entries(groupByUF).map(([uf, municipios], i) => (
              <Accordion key={uf + i} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">UF: {uf}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(municipios).map(([municipio, chamados]) => (
                    <Accordion key={municipio} sx={{ mb: 2, ml: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Município: {municipio}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {chamados.map((question, index) => (
                          <Accordion
                            key={index}
                            expanded={`${question.uid}-${question.index}` === expandedQuestionId}
                            onChange={() =>
                              setExpandedQuestionId(
                                expandedQuestionId === `${question.uid}-${question.index}`
                                  ? null
                                  : `${question.uid}-${question.index}`
                              )
                            }
                            sx={{
                              mb: 1,
                              ml: 2,
                              border: question.plano_acao?.comentario
                                ? '2px solid #4caf50' // verde
                                : '2px solid #f44336', // vermelho
                              backgroundColor:
                                `${question.uid}-${question.index}` === expandedQuestionId
                                  ? question.plano_acao?.comentario
                                    ? '#e8f5e9' // verde claro
                                    : '#ffebee' // vermelho claro
                                  : 'white',
                              boxShadow:
                                `${question.uid}-${question.index}` === expandedQuestionId
                                  ? '0 0 10px rgba(0, 0, 0, 0.2)'
                                  : 'none',
                              transition: 'all 0.3s ease-in-out',
                              borderRadius: 2,
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="body1">
                                ID: {question.id} - {question.nome} -{" "}
                                {question.endereco}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                {/* Coluna de informações */}
                                <Grid item xs={12} sm={8}>
                                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                                    Informações da Inconformidade
                                  </Typography>

                                  <Divider sx={{ mb: 2 }} />

                                  <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Pergunta:</strong><br />
                                    {question.question}
                                  </Typography>

                                  <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Resposta:</strong> {question.resp || "Não informado"}
                                  </Typography>

                                  <Typography variant="body1" sx={{ mb: 2 }}>
                                    <strong>Comentário:</strong> {question.respTextArea || "Nenhum comentário"}
                                  </Typography>

                                  <Button
                                    variant="contained"
                                    onClick={() => handleOpenModal(question)}
                                    sx={{
                                      backgroundColor: "#5e168c",
                                      ":hover": { backgroundColor: "#4a0e74" },
                                      width: "100%",
                                      mt: 2,
                                    }}
                                  >
                                    {!question.plano_acao.comentario ? "INSERIR PLANO DE AÇÃO" : "PLANO DE AÇÃO"}
                                  </Button>
                                </Grid>

                                {/* Coluna de imagem */}
                                {question.imagesURL?.length > 0 && (
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                      Imagem
                                    </Typography>

                                    <Card
                                      elevation={3}
                                      sx={{ borderRadius: 2, overflow: "hidden", maxWidth: "100%" }}
                                    >
                                      <CardMedia
                                        component="img"
                                        image={question.imagesURL[0].url}
                                        alt="Imagem relacionada à pergunta"
                                        sx={{ height: 200, objectFit: "cover" }}
                                      />
                                    </Card>
                                  </Grid>
                                )}
                              </Grid>
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
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}
        >
          <Typography variant="h6">Inserir Plano de Ação</Typography>
          <TextField
            fullWidth
            label="Numero Chamado"
            type="number"
            value={numeroChamado}
            onChange={(e) => setNumeroChamado(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            disabled={isEditDisabled}
          />
          <TextField
            fullWidth
            label="SLA (data)"
            type="date"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            disabled={isEditDisabled}
          />
          <TextField
            fullWidth
            label="Comentário"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            sx={{ mt: 2 }}
            disabled={isEditDisabled}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={alterarPA}
            sx={{ mt: 2 }}
            disabled={isEditDisabled}
          >
            Salvar
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

