import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiExternalLink, FiFileText, FiList } from "react-icons/fi";
import firebase from "../../services/firebaseConnection.js";
import Header from "../../components/Header/index.js";
import Title from "../../components/Title/index.js";
import { AuthContext } from "../../contexts/auth.js";
import DrawerLogsAPR from "../../components/DrawerLogsAPR/index.js";
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
  RJ_ES: ["RJ", "ES"],
  MG: ["MG"],
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

  // Estado para o drawer de logs
  const [openLogsDrawer, setOpenLogsDrawer] = useState(false);
  const [selectedAprForLogs, setSelectedAprForLogs] = useState(null);

  const [totalPA, setTotalPA] = useState(0);
  const [tratadosPA, setTratadosPA] = useState(0);
  const [pendentesPA, setPendentesPA] = useState(0);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 10 itens por página
  const [paginatedChamados, setPaginatedChamados] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  // Estado para região selecionada
  const [selectedRegion, setSelectedRegion] = useState("SP");
  const [selectedUFs, setSelectedUFs] = useState(["SP"]);

  // Estado para filtro de ID da APR
  const [aprIdFilter, setAprIdFilter] = useState("");

  const [exporting, setExporting] = useState(false);
  const [ufsList, setUfsList] = useState([]); // Lista de UFs únicas

  useEffect(() => {
    addBodyClass("page-reports");
  }, []);

  // Atualizar UFs quando a região mudar
  useEffect(() => {
    if (selectedRegion === "TODAS") {
      const allUFs = Object.values(REGIONAIS).flat();
      setSelectedUFs(allUFs);
    } else if (REGIONAIS[selectedRegion]) {
      setSelectedUFs(REGIONAIS[selectedRegion]);
    } else {
      setSelectedUFs([selectedRegion]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    // Aplicar filtro de ID da APR quando o filtro ou chamados mudarem
    let filteredChamados = chamados;
    
    if (aprIdFilter.trim() !== "") {
      filteredChamados = chamados.filter(chamado => 
        chamado.id && chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase())
      );
    }

    // Atualizar dados paginados quando chamados filtrados ou página mudar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredChamados.slice(indexOfFirstItem, indexOfLastItem);
    setPaginatedChamados(currentItems);
    setTotalPages(Math.ceil(filteredChamados.length / itemsPerPage));
  }, [chamados, currentPage, itemsPerPage, aprIdFilter]);

  // Extrair lista de UFs únicas para exibição
  useEffect(() => {
    const ufs = [...new Set(chamados.map(item => item.uf))].sort();
    setUfsList(ufs);
  }, [chamados]);

  async function loadChamados() {
    setLoading(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");

      // Aplicar filtros básicos - por UFs da região selecionada
      query = query
        .where("site_id.Estado", "in", selectedUFs)
        .where("site_id.tipoSite", "in", ["ERB", "CT"])
        .where("motivo_apr", "==", "Mapa de Calor");

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
        
        if (selectedUFs.includes(siteData.Estado) &&
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
                  ...question,
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
                });
              }
            });
          });
        }
      });

      // Ordenar por UF e município
      list.sort((a, b) => {
        if (a.uf !== b.uf) return a.uf.localeCompare(b.uf);
        return a.municipio.localeCompare(b.municipio);
      });

      setChamados(list);
      setTotalPA(list.length);
      setTratadosPA(list.filter(item => item.plano_acao?.comentario).length);
      setPendentesPA(list.filter(item => !item.plano_acao?.comentario).length);
      setCurrentPage(1); // Reset para primeira página
      setAprIdFilter(""); // Resetar filtro ao carregar novos dados
    } catch (err) {
      console.error("Deu algum erro: ", err);
      toast.error("Erro ao carregar os chamados");
    }
    setLoading(false);
  }

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

  const handleOpenLogsDrawer = (question) => {
    setSelectedAprForLogs({ uid: question.uid, id: question.id });
    setOpenLogsDrawer(true);
  };

  const handleCloseLogsDrawer = () => {
    setOpenLogsDrawer(false);
    setSelectedAprForLogs(null);
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
    plano.data_envio_email = new Date();



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
      s = s.replace(/\u0000/g, "");
      if (s.length > MAX_CELL_LEN) s = s.slice(0, MAX_CELL_LEN - 3) + "...";
      return s;
    };

    const toBRDate = (v) => {
      if (!v) return "";
      
      let d;
      try {
        // Timestamp do Firestore (formato { seconds, nanoseconds })
        if (typeof v === "object" && v.seconds) {
          d = new Date(v.seconds * 1000);
        }
        // Timestamp do Firestore (formato { _seconds, _nanoseconds })
        else if (typeof v === "object" && v._seconds) {
          d = new Date(v._seconds * 1000);
        }
        // String de data
        else if (typeof v === "string") {
          d = new Date(v);
        }
        // Número (timestamp em ms)
        else if (typeof v === "number") {
          d = new Date(v);
        }
        // Objeto Date
        else if (v instanceof Date) {
          d = v;
        }
        // Fallback para qualquer outro formato
        else {
          d = new Date(v);
        }
        
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
      } catch (error) {
        console.warn("Erro ao converter data:", v, error);
        return "";
      }
    };

    // Aplicar filtro de ID da APR também na exportação
    let chamadosToExport = chamados;
    if (aprIdFilter.trim() !== "") {
      chamadosToExport = chamados.filter(chamado => 
        chamado.id && chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase())
      );
    }



    // Calcular estatísticas por APR para o Excel
    const aprStatsForExport = chamadosToExport.reduce((acc, q) => {
      if (!acc[q.id]) {
        const aprQuestions = chamadosToExport.filter(item => item.id === q.id);
        const respondidas = aprQuestions.filter(item => item.plano_acao?.comentario).length;
        const pendentes = aprQuestions.length - respondidas;
        acc[q.id] = {
          total: aprQuestions.length,
          respondidas,
          pendentes,
          percentual: aprQuestions.length > 0 ? Math.round((respondidas / aprQuestions.length) * 100) : 0
        };
      }
      return acc;
    }, {});

    const dataToExport = chamadosToExport.map((q) => {
      // Calcular data do envio do email usando lógica de fallback expandida
      const dataEnvioEmail = 
        q.data_envio_email ? toBRDate(q.data_envio_email) :
        q.plano_acao?.data_envio_email ? toBRDate(q.plano_acao.data_envio_email) :
        q.resp_pa_data ? toBRDate(q.resp_pa_data) :
        q.data_criacao ? toBRDate(q.data_criacao) :
        q.created ? toBRDate(q.created) :
        q.createdAt ? toBRDate(q.createdAt) :
        q.data_apr ? toBRDate(q.data_apr) :
        "";
      
      // Log detalhado para investigar registros sem data
      if (q.status === "Enviado" && !dataEnvioEmail) {
        console.log(`🔍 Registro ID ${q.id} (Status: ${q.status}) sem data:`);
        console.log(`   data_envio_email:`, q.data_envio_email);
        console.log(`   plano_acao?.data_envio_email:`, q.plano_acao?.data_envio_email);
        console.log(`   resp_pa_data:`, q.resp_pa_data);
        console.log(`   data_criacao:`, q.data_criacao);
        console.log(`   created:`, q.created);
        console.log(`   Todas as propriedades com 'data':`, Object.keys(q).filter(key => key.includes('data')));
      }
      
      return {
        "UID": safeText(q.uid),
        "ID": safeText(q.id),
        "Sigla": safeText(q.sigla),
        "UF": safeText(q.uf),
        "Tipo de Site": safeText(q.tipoSite),
        "Data da APR": safeText(toBRDate(q.data_apr)),
        "Município": safeText(q.municipio),
        "Endereço": safeText(q.endereco),
        "Nome do Site": safeText(q.nome),
        "Status": q.status,
        "Total Perguntas APR": aprStatsForExport[q.id]?.total || 0,
        "Perguntas Respondidas": aprStatsForExport[q.id]?.respondidas || 0,
        "Perguntas Pendentes": aprStatsForExport[q.id]?.pendentes || 0,
        "% Perguntas Respondidas": `${aprStatsForExport[q.id]?.percentual || 0}%`,
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
        "Data do Envio do Email": safeText(dataEnvioEmail),
      };
    });

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
      { wch: 15 }, // Total Perguntas APR
      { wch: 15 }, // Perguntas Respondidas
      { wch: 15 }, // Perguntas Pendentes
      { wch: 18 }, // % Perguntas Respondidas
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
      { wch: 15 }, // Data do Envio do Email
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Relatório Planos de Ação");
    XLSX.writeFile(wb, `relatorio_planos_acao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Agrupar itens da página atual por UF
  const groupByUF = paginatedChamados.reduce((acc, chamado) => {
    if (!acc[chamado.uf]) acc[chamado.uf] = [];
    acc[chamado.uf].push(chamado);
    return acc;
  }, {});

  // Calcular estatísticas considerando o filtro
  const filteredTotalPA = aprIdFilter.trim() !== "" 
    ? chamados.filter(chamado => chamado.id && chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase())).length
    : totalPA;

  const filteredTratadosPA = aprIdFilter.trim() !== ""
    ? chamados.filter(chamado => 
        chamado.id && 
        chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase()) &&
        chamado.plano_acao?.comentario
      ).length
    : tratadosPA;

  const filteredPendentesPA = aprIdFilter.trim() !== ""
    ? chamados.filter(chamado => 
        chamado.id && 
        chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase()) &&
        !chamado.plano_acao?.comentario
      ).length
    : pendentesPA;

  // Calcular estatísticas de perguntas por APR (Verde/Vermelho)
  const filteredData = aprIdFilter.trim() !== ""
    ? chamados.filter(chamado => 
        chamado.id && 
        chamado.id.toString().toLowerCase().startsWith(aprIdFilter.toLowerCase())
      )
    : chamados;
  
  // Agrupar por APR única para contar perguntas
  const aprQuestionStats = filteredData.reduce((acc, question) => {
    const aprKey = question.id; // Usar apenas o ID da APR como chave
    if (!acc[aprKey]) {
      acc[aprKey] = {
        total: 0,
        respondidas: 0, // Verde (com plano de ação)
        pendentes: 0    // Vermelho (sem plano de ação)
      };
    }
    
    acc[aprKey].total++;
    if (question.plano_acao?.comentario) {
      acc[aprKey].respondidas++; // Verde
    } else {
      acc[aprKey].pendentes++;   // Vermelho
    }
    
    return acc;
  }, {});
  
  // Calcular totais gerais
  const totalPerguntas = Object.values(aprQuestionStats).reduce((sum, apr) => sum + apr.total, 0);
  const perguntasRespondidas = Object.values(aprQuestionStats).reduce((sum, apr) => sum + apr.respondidas, 0);
  const perguntasPendentes = Object.values(aprQuestionStats).reduce((sum, apr) => sum + apr.pendentes, 0);
  const percentualRespondidas = totalPerguntas > 0 ? Math.round((perguntasRespondidas / totalPerguntas) * 100) : 0;



  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Infra e Móvel">
          <FiFileText size={25} />
        </Title>
        <div className="filter-reports-container">
          <div className="filter-reports">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="region-select-label">Regional</InputLabel>
                  <Select
                    labelId="region-select-label"
                    value={selectedRegion}
                    label="Regional"
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <MenuItem value="SP">SP</MenuItem>
                    <MenuItem value="RJ_ES">RJ/ES</MenuItem>
                    <MenuItem value="MG">MG</MenuItem>
                    <MenuItem value="SUL">Sul (RS/PR/SC)</MenuItem>
                    <MenuItem value="NE">Nordeste</MenuItem>
                    <MenuItem value="CO_N">Centro-Oeste/Norte</MenuItem>
                    <MenuItem value="TODAS">Todas as Regionais</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Filtro de ID da APR */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Filtrar por ID da APR"
                  value={aprIdFilter}
                  onChange={(e) => setAprIdFilter(e.target.value)}
                  placeholder="Digite o ID da APR"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body1" color="textSecondary">
                  UFs selecionadas: {selectedUFs.join(", ")} | 
                  UFs encontradas: {ufsList.join(", ")}
                  {aprIdFilter && ` | Filtrado por: ${aprIdFilter}`}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={loadChamados}
                    disabled={loading}
                    style={{ borderColor: "#380054e8", color: "#380054e8", height: '56px', marginBottom: '10px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Carregar"}
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
                    {exporting ? <CircularProgress size={24} /> : "Exportar"}
                  </Button>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ my: 2 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                  <Typography variant="h6">Total de PAs</Typography>
                  <Typography variant="h4" color="primary">{filteredTotalPA}</Typography>
                  {aprIdFilter && totalPA !== filteredTotalPA && (
                    <Typography variant="caption" color="textSecondary">
                      (de {totalPA} no total)
                    </Typography>
                  )}
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#e8f5e9" }}>
                  <Typography variant="h6">Tratados</Typography>
                  <Typography variant="h4" color="success.main">{filteredTratadosPA}</Typography>
                  {aprIdFilter && tratadosPA !== filteredTratadosPA && (
                    <Typography variant="caption" color="textSecondary">
                      (de {tratadosPA} no total)
                    </Typography>
                  )}
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, backgroundColor: "#ffebee" }}>
                  <Typography variant="h6">Pendentes</Typography>
                  <Typography variant="h4" color="error.main">{filteredPendentesPA}</Typography>
                  {aprIdFilter && pendentesPA !== filteredPendentesPA && (
                    <Typography variant="caption" color="textSecondary">
                      (de {pendentesPA} no total)
                    </Typography>
                  )}
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
            {paginatedChamados.length > 0 ? (
              <>
                <div className="container reports">
                  <div className="questions-list">
                    {Object.entries(groupByUF).map(([uf, chamadosUF]) => (
                      <Accordion key={uf} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6">
                            UF: {uf} ({chamadosUF.length} item{chamadosUF.length > 1 ? 's' : ''})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {chamadosUF.map((question, index) => (
                            <Accordion
                              key={`${question.uid}-${question.index}`}
                              sx={{
                                mb: 1,
                                border: question.plano_acao?.comentario
                                  ? '2px solid #4caf50'
                                  : '2px solid #f44336',
                                borderRadius: 2,
                              }}
                              onClick={() => console.log(question)}
                            >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body1" noWrap>
                                  <strong>{question.id}</strong> - {question.nome} - {question.municipio}
                                  {question.plano_acao?.comentario ? " ✅" : " ❌"}
                                  <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#666' }}>
                                    ({aprQuestionStats[question.id]?.respondidas || 0}/{aprQuestionStats[question.id]?.total || 0} respondidas)
                                  </span>
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

                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                      <strong>Comentário:</strong> {question.respTextArea || "Nenhum comentário"}
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                      <strong>Município:</strong> {question.municipio}
                                    </Typography>

                                    {question.plano_acao?.comentario && (
                                      <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
                                          Plano de Ação
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                          <strong>Chamado:</strong> {question.plano_acao?.numero_chamado}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                          <strong>SLA:</strong> {question.plano_acao?.tempo}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                          <strong>Ação:</strong> {question.plano_acao?.comentario}
                                        </Typography>
                                      </>
                                    )}

                                    <Grid container spacing={1}>
                                      <Grid item xs={12} sm={6}>
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
                                      <Grid item xs={12} sm={6}>
                                        <Button
                                          variant="outlined"
                                          onClick={() => handleOpenLogsDrawer(question)}
                                          sx={{
                                            borderColor: "#1976d2",
                                            color: "#1976d2",
                                            ":hover": {
                                              backgroundColor: "#e3f2fd",
                                              borderColor: "#1565c0"
                                            },
                                            width: "100%",
                                            mb: 1,
                                          }}
                                          startIcon={<FiList />}
                                        >
                                          VER LOGS
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
                    Exibindo {paginatedChamados.length} de {filteredTotalPA} itens {aprIdFilter && '(filtrados)'} | 
                    Página {currentPage} de {totalPages} | 
                    {ufsList.length} UF{ufsList.length > 1 ? 's' : ''} no total
                    {aprIdFilter && ` | Filtrado por: "${aprIdFilter}"`}
                  </Typography>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <Typography variant="h6">
                  {chamados.length === 0 
                    ? "Nenhum plano de ação encontrado para as UFs selecionadas"
                    : aprIdFilter
                    ? `Nenhum item encontrado para o ID da APR: "${aprIdFilter}"`
                    : "Nenhum item encontrado nesta página"
                  }
                </Typography>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Plano de Ação */}
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
            multiline
            rows={3}
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

      {/* Drawer de Logs */}
      <DrawerLogsAPR
        open={openLogsDrawer}
        onClose={handleCloseLogsDrawer}
        aprUid={selectedAprForLogs?.uid}
        aprId={selectedAprForLogs?.id}
      />
    </div>
  );
}