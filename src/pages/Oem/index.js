import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiExternalLink, FiFileText } from "react-icons/fi";
import firebase from "../../services/firebaseConnection.js";
import Header from "../../components/Header/index.js";
import Title from "../../components/Title/index.js";
import { AuthContext } from "../../contexts/auth.js";
import * as XLSX from 'xlsx';
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
  Card,
  Pagination,
  CircularProgress,
  Autocomplete,
  Chip,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "react-toastify";

// Definição das regiões
const REGIONAIS = {
  CO_N: ["DF", "GO", "TO", "AC", "MS", "MT", "RO", "AM", "AP", "MA", "PA", "RR"],
  NE: ["PE", "CE", "PB", "RN", "AL", "PI", "BA", "SE"],
  RJ_ES_MG: ["RJ", "ES", "MG"],
  SP: ["SP"],
  SUL: ["RS", "PR", "SC"]
};

export default function Oem() {
  const { user } = useContext(AuthContext);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState("oem");
  const [tempo, setTempo] = useState("");
  const [comentario, setComentario] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [isEditDisabled, setIsEditDisabled] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const [totalPA, setTotalPA] = useState(0);
  const [tratadosPA, setTratadosPA] = useState(0);
  const [pendentesPA, setPendentesPA] = useState(0);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedChamados, setPaginatedChamados] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  // Estados para o pré-filtro de municípios
  const [municipiosOptions, setMunicipiosOptions] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Estado para região selecionada
  const [selectedRegion, setSelectedRegion] = useState("SP"); // Valor padrão
  const [selectedUFs, setSelectedUFs] = useState(["SP"]); // UFs baseadas na região selecionada

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    addBodyClass("page-reports");
  }, []);

  // Atualizar UFs quando a região mudar
  useEffect(() => {
    if (selectedRegion === "TODAS") {
      // Juntar todas as UFs de todas as regiões
      const allUFs = Object.values(REGIONAIS).flat();
      setSelectedUFs(allUFs);
    } else if (REGIONAIS[selectedRegion]) {
      setSelectedUFs(REGIONAIS[selectedRegion]);
    } else {
      // Se for uma UF específica
      setSelectedUFs([selectedRegion]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    // Carregar lista de municípios disponíveis para as UFs selecionadas
    if (selectedUFs.length > 0) {
      loadMunicipiosOptions();
    }
  }, [selectedUFs]);

  useEffect(() => {
    // Atualizar dados paginados quando chamados ou página mudar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = chamados.slice(indexOfFirstItem, indexOfLastItem);
    setPaginatedChamados(currentItems);
    setTotalPages(Math.ceil(chamados.length / itemsPerPage));
  }, [chamados, currentPage, itemsPerPage]);

  useEffect(() => {
    // Atualizar o estado "Selecionar Todos" quando a seleção de municípios mudar
    setSelectAll(selectedMunicipios.length === municipiosOptions.length && municipiosOptions.length > 0);
  }, [selectedMunicipios, municipiosOptions]);

  async function loadMunicipiosOptions() {
    setLoadingMunicipios(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");

      // Aplicar filtros básicos - agora por UFs da região selecionada
      query = query
        .where("site_id.Estado", "in", selectedUFs)
        .where("site_id.tipoSite", "in", ["ERB", "CT"]);

      const snapshot = await query.get();
      const municipiosSet = new Set();

      snapshot.forEach((doc) => {
        const siteData = doc.data().site_id;
        if (selectedUFs.includes(siteData.Estado) && (siteData.tipoSite === "ERB" || siteData.tipoSite === "CT")) {
          municipiosSet.add(siteData.Cidade);
        }
      });

      const municipiosList = Array.from(municipiosSet).sort();
      setMunicipiosOptions(municipiosList);
      setSelectedMunicipios([]); // Resetar seleção de municípios quando a região muda
    } catch (err) {
      console.error("Erro ao carregar municípios: ", err);
      toast.error("Erro ao carregar a lista de municípios");
    }
    setLoadingMunicipios(false);
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedMunicipios(municipiosOptions);
    } else {
      setSelectedMunicipios([]);
    }
  };

  async function loadChamados() {
    if (selectedMunicipios.length === 0) {
      toast.info("Selecione pelo menos um município para filtrar");
      return;
    }

    setLoading(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");

      // Aplicar filtros básicos - agora por UFs da região selecionada
      query = query
        .where("site_id.Estado", "in", selectedUFs)
        .where("site_id.tipoSite", "in", ["ERB", "CT"]);

      // Aplicar filtro de municípios selecionados
      // Se todos os municípios estiverem selecionados, não aplicamos filtro por município
      if (selectedMunicipios.length !== municipiosOptions.length) {
        query = query.where("site_id.Cidade", "in", selectedMunicipios);
      }

      // Aplicar filtro de status baseado no usuário
      query =
        user.area === "oem" || user.nivel === "administrador" || user.nivel === "revisor"
          ? query.where("status", "in", ["Respondido pela Area", "Enviado"])
          : query.where("status", "in", ["Nenhum"]);

      const snapshot = await query.get();
      const list = [];

      snapshot.forEach((doc) => {
        const siteData = doc.data().site_id;
        const aprData = doc.data();
        // Verificar se o município está na lista selecionada (ou se todos estão selecionados)
        if ((selectedMunicipios.length === municipiosOptions.length || selectedMunicipios.includes(siteData.Cidade)) &&
          selectedUFs.includes(siteData.Estado) &&
          (siteData.tipoSite === "ERB" || siteData.tipoSite === "CT")) {
          doc.data().checklist.forEach((area) => {
            area[1].forEach((question, idx) => {
              const docInclude =
                question.resp !== "" &&
                question.resp !== "N/A" &&
                question.resp !== question.respGabarito &&
                question.openPA === true &&
                question.areaResposavel?.includes("oem");
              if (docInclude) {
                list.push({
                  uid: doc.id,
                  id: doc.data().apr_id,
                  tipoSite: siteData.tipoSite,
                  data_apr: aprData.created,
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
        }
      });

      setChamados(list);
      setTotalPA(list.length);
      setTratadosPA(list.filter(item => item.plano_acao?.comentario).length);
      setPendentesPA(list.filter(item => !item.plano_acao?.comentario).length);
      setCurrentPage(1); // Reset para primeira página
    } catch (err) {
      console.error("Deu algum erro: ", err);
      toast.error("Erro ao carregar os chamados");
    }
    setLoading(false);
  }

  const groupByUF = paginatedChamados.reduce((acc, chamado) => {
    if (!acc[chamado.uf]) acc[chamado.uf] = {};
    if (!acc[chamado.uf][chamado.municipio]) acc[chamado.uf][chamado.municipio] = [];
    acc[chamado.uf][chamado.municipio].push(chamado);
    return acc;
  }, {});

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (question) => {
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
    setSelectedOption("oem");
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

  // Função para exportar o relatório em XLSX
const exportToXLSX = (chamados) => {
  const MAX_CELL_LEN = 32767;

  const safeText = (val) => {
    if (val === null || val === undefined) return "";
    let s = String(val);
    // remove caracteres de controle problemáticos
    s = s.replace(/\u0000/g, "");
    // trunca se exceder o limite do Excel
    if (s.length > MAX_CELL_LEN) s = s.slice(0, MAX_CELL_LEN - 3) + "...";
    return s;
  };

  const toBRDate = (v) => {
    if (!v) return "";
    const d = typeof v === "object" && v.seconds ? new Date(v.seconds * 1000) : new Date(v);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
  };

  // prepara os dados já sanitizados
  const dataToExport = chamados.map((q) => ({
    "UID": safeText(q.uid),
    "ID": safeText(q.id),
    "Sigla": safeText(q.sigla),
    "UF": safeText(q.uf),
    "Tipo de Site": safeText(q.tipoSite),
    "Data da APR": safeText(toBRDate(q.data_apr)),
    "Município": safeText(q.municipio),
    "Endereço": safeText(q.endereco),
    "Nome do Site": safeText(q.nome),
    "Status": safeText(q.status),
    "Área": safeText(q.area),
    "ID da Questão": safeText(q.questionId),
    "Área Responsável": safeText(Array.isArray(q.areaResposavel) ? q.areaResposavel.join(", ") : q.areaResposavel || ""),
    "Pergunta": safeText(q.question),
    "Resposta": safeText(q.resp),
    "Comentário": safeText(q.respTextArea),
    "Gabarito": safeText(q.respGabarito),
    "Número do Chamado (PA)": safeText(q.plano_acao?.numero_chamado || ""),
    "SLA (PA)": safeText(q.plano_acao?.tempo || ""),
    "Comentário (PA)": safeText(q.plano_acao?.comentario || ""),
    "Usuário do PA": safeText(q.resp_pa_user_name || ""),
    "Data do PA": safeText(toBRDate(q.resp_pa_data)),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataToExport);

  ws['!cols'] = [
    { wch: 20 }, // UID
    { wch: 10 }, // ID
    { wch: 10 }, // Sigla
    { wch: 5 },  // UF
    { wch: 15 }, // Tipo de Site
    { wch: 12 }, // Data da APR
    { wch: 20 }, // Município
    { wch: 30 }, // Endereço
    { wch: 25 }, // Nome do Site
    { wch: 15 }, // Status
    { wch: 20 }, // Área
    { wch: 15 }, // ID da Questão
    { wch: 22 }, // Área Responsável
    { wch: 50 }, // Pergunta
    { wch: 15 }, // Resposta
    { wch: 40 }, // Comentário
    { wch: 15 }, // Gabarito
    { wch: 22 }, // Número do Chamado (PA)
    { wch: 15 }, // SLA (PA)
    { wch: 40 }, // Comentário (PA)
    { wch: 20 }, // Usuário do PA
    { wch: 12 }, // Data do PA
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Relatório Planos de Ação");
  XLSX.writeFile(wb, `relatorio_planos_acao_${new Date().toISOString().split('T')[0]}.xlsx`);
};


  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Infra e Móvel">
          <FiFileText size={25} onClick={() => console.log(chamados)} />
        </Title>
        <div className="filter-reports-container">
          <div className="filter-reports">
            <Grid container spacing={2} alignItems="center">
              {/* Novo seletor de regional */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="region-select-label">Regional</InputLabel>
                  <Select
                    labelId="region-select-label"
                    value={selectedRegion}
                    label="Regional"
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <MenuItem value="SP">SP</MenuItem>
                    <MenuItem value="RJ_ES_MG">RJ/ES/MG</MenuItem>
                    <MenuItem value="SUL">Sul (RS/PR/SC)</MenuItem>
                    <MenuItem value="NE">Nordeste</MenuItem>
                    <MenuItem value="CO_N">Centro-Oeste/Norte</MenuItem>
                    <MenuItem value="TODAS">Todas as Regionais</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={loadingMunicipios || municipiosOptions.length === 0}
                    />
                  }
                  label="Selecionar todos os municípios"
                />
              </Grid>
              <Grid item xs={12} md={8}>
                {loadingMunicipios ? (
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Carregando municípios...</Typography>
                  </Box>
                ) : (
                  <Autocomplete
                    multiple
                    options={municipiosOptions}
                    value={selectedMunicipios}
                    onChange={(event, newValue) => {
                      setSelectedMunicipios(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecione os municípios"
                        placeholder="Digite o nome do município"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    disabled={loadingMunicipios}
                    // Adicionando estilo para limitar a altura e adicionar scroll
                    ListboxProps={{
                      style: {
                        maxHeight: '200px', // Altura máxima da lista
                        overflow: 'auto',   // Adiciona scroll quando necessário
                      },
                    }}
                    // Estilo para o container dos chips selecionados
                    sx={{
                      '& .MuiAutocomplete-tag': {
                        maxWidth: '100%',
                      },
                      '& .MuiAutocomplete-inputRoot': {
                        flexWrap: 'wrap',
                        overflow: 'auto',
                        height: '120px', // Altura máxima do campo de input com chips
                      }
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={loadChamados}
                    disabled={loading || selectedMunicipios.length === 0 || loadingMunicipios}
                    style={{ borderColor: "#380054e8", color: "#380054e8", height: '56px', marginBottom: '10px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Filtrar"}
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                      setExporting(true);
                      setTimeout(() => {
                        exportToXLSX(chamados);
                        setExporting(false);
                      }, 500);
                    }}
                    disabled={chamados.length === 0 || exporting}
                    style={{ height: '56px' }}
                  >
                    {exporting ? <CircularProgress size={24} /> : "Exportar XLSX"}
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

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : (
          <>
            {chamados.length > 0 ? (
              <>
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
                                        ? '2px solid #4caf50'
                                        : '2px solid #f44336',
                                      backgroundColor:
                                        `${question.uid}-${question.index}` === expandedQuestionId
                                          ? question.plano_acao?.comentario
                                            ? '#e8f5e9'
                                            : '#ffebee'
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

                                          <Grid container spacing={1}>
                                            <Grid item xs={12} sm={12}>
                                              <Button
                                                variant="outlined"
                                                onClick={() => window.open(`/open/${question.uid}`, '_blank')}
                                                sx={{
                                                  borderColor: "#380054e8",
                                                  color: "#380054e8",
                                                  ":hover": {
                                                    backgroundColor: "#f0e6f5",
                                                    borderColor: "#5e168c"
                                                  },
                                                  width: "100%",
                                                  mb: 1,
                                                }}
                                                startIcon={<FiExternalLink />}
                                              >
                                                ABRIR APR
                                              </Button>
                                            </Grid>
                                          </Grid>
                                        </Grid>

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

                {/* Paginação */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', padding: '20px' }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </div>
                )}

                {/* Informações de paginação */}
                <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
                  <Typography variant="body2">
                    Exibindo {paginatedChamados.length} de {chamados.length} itens (Página {currentPage} de {totalPages})
                  </Typography>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <Typography variant="h6">
                  {selectedMunicipios.length === 0
                    ? "Selecione um ou mais municípios para visualizar os planos de ação"
                    : "Nenhum plano de ação encontrado para os municípios selecionados"}
                </Typography>
              </div>
            )}
          </>
        )}
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