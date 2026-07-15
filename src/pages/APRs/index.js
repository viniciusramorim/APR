import { useState, useEffect, useContext } from "react";
import {
  FiMessageSquare,
  FiSearch,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiMessageCircle,
  FiFileText,
  FiActivity
} from "react-icons/fi";
import { format } from "date-fns";
import { AuthContext } from "../../contexts/auth";
import Header from "../../components/Header";
import Title from "../../components/Title";
import firebase from "../../services/firebaseConnection";
import "./index.scss";
import { toast } from "react-toastify";
import TableDashboard from "./tableDashboard";
import OfflineAPRsPanel from "../../components/OfflineAPRsPanel";
import {
  Grid,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Backdrop,
  CircularProgress,
  Box,
} from "@mui/material";
import { useMemo } from "react";

const MOBILE_BREAKPOINT_QUERY = 768;
const MOBILE_DEFAULT_LIMIT = 80;
const DESKTOP_DEFAULT_LIMIT = 1000;

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_QUERY}px)`).matches;

const styles = {
  kpiCard: {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "14px 10px",
    borderRadius: "16px",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
    display: "flex",
    gap: "18px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "118px",
    height: "100%",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.16)",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 16px 28px rgba(15, 23, 42, 0.22)",
      filter: "brightness(1.1)",
    }
  },
  kpiTitle: {
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "10px",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    lineHeight: 1.25,
    textShadow: "1px 1px 2px rgba(0,0,0,0.2)"
  },
  kpiValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#fff",
    textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
  },
  kpiIcon: {
    fontSize: "1.25rem",
    marginBottom: "12px",
    color: "#fff"
  },
  pendenciaCard: {
    background: "linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)",
  },
  emAbertoCard: {
    background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
  },
  canceladoCard: {
    background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
  },
  revisadoCard: {
    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  enviadoCard: {
    background: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
  },
  respondidoCard: {
    background: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  },
  concluidoCard: {
    background: "linear-gradient(135deg, #000000 0%, #434343 100%)",
  },
  totalCard: {
    background: "linear-gradient(135deg, #380054 0%, #6a008a 100%)",
  },
};

// Função para salvar os filtros no localStorage
const saveFiltersToSessionStorage = (filters) => {
  sessionStorage.setItem("filters", JSON.stringify(filters));
};

// Função para carregar os filtros do localStorage
const loadFiltersFromSessionStorage = () => {
  const savedFilters = sessionStorage.getItem("filters");
  return savedFilters ? JSON.parse(savedFilters) : {};
};

// Função para carregar a página do localStorage
const loadPageFromSessionStorage = () => {
  const savedPage = sessionStorage.getItem("tablePage");
  return savedPage ? parseInt(savedPage, 10) : 0;
};



// Função para limpar as informações de filtro e paginação do localStorage
const clearSessionStorage = () => {
  sessionStorage.removeItem("filters");
  sessionStorage.removeItem("tablePage");
};

// Função para adicionar uma classe ao body
const addBodyClass = (className) => {
  document.body.classList.add(className);
};

export default function Dashboard() {
  const base = "aprs-producao";
  const listRef = firebase.firestore().collection(base);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(loadPageFromSessionStorage());
  const { user, logSistem } = useContext(AuthContext);

  // Carregar os filtros do localStorage ao montar o componente
  const savedFilters = loadFiltersFromSessionStorage();
  const [filterUF, setFilterUF] = useState(savedFilters.filterUF || "");
  const [filterSigla, setFilterSigla] = useState(savedFilters.filterSigla || "");
  const [filterTipoSite, setFilterTipoSite] = useState(savedFilters.filterTipoSite || "");
  const [filterStatus, setFilterStatus] = useState(savedFilters.filterStatus || "");
  const [filterNome, setFilterNome] = useState(savedFilters.filterNome || "");
  const [filterID, setFilterID] = useState(savedFilters.filterID || "");
  const [filterMotivo, setFilterMotivo] = useState(savedFilters.filterMotivo || "");
  const [filterRegional, setFilterRegional] = useState(savedFilters.filterRegional || "");
  const [filterDataInicio, setFilterDataInicio] = useState(savedFilters.filterDataInicio || "");
  const [filterDataFim, setFilterDataFim] = useState(savedFilters.filterDataFim || "");

  // Otimização: Calcular contagens do Dashboard de forma eficiente
  const dashboardStats = useMemo(() => {
    const counts = {
      emAberto: 0,
      cancelado: 0,
      revisado: 0,
      enviado: 0,
      aguardandoPontoFocal: 0,
      respondidoArea: 0,
      concluido: 0,
      pendencia10Dias: 0,
    };

    const now = new Date();

    chamados.forEach((x) => {
      // Contagem básica por status
      if (x.status === "Em Aberto") counts.emAberto++;
      else if (x.status === "Cancelado") counts.cancelado++;
      else if (x.status === "Revisado") counts.revisado++;
      else if (x.status === "Enviado") counts.enviado++;
      else if (x.status === "Enviado para Área Responsável") counts.aguardandoPontoFocal++;
      else if (x.status === "Respondido pela Area") counts.respondidoArea++;
      else if (x.status === "Concluido") counts.concluido++;

      // Lógica específica para pendência de 10 dias
      if (x.status === "Em Aberto" && x.created) {
        try {
          const [datePart] = x.created.split(" ");
          const [day, month, year] = datePart.split("/");
          const createdDate = new Date(`${year}-${month}-${day}`);
          const diffMs = now - createdDate;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 10) {
            counts.pendencia10Dias++;
          }
        } catch (e) {
          console.error("Erro ao processar data para stats:", e);
        }
      }
    });
    return counts;
  }, [chamados]);

  useEffect(() => {
    addBodyClass("page-dash");
    // Carrega os chamados inicialmente
    loadChamados(false);

    return () => {
      document.body.classList.remove("page-dash");
    };
  }, []);

  // Função para carregar os chamados com base nos filtros
  const loadChamados = async (novasAPRs = false, searchAll = false) => {
    setLoading(true);
    let query = listRef;
    const normalizedFilterID = String(filterID || "").trim();
    const hasIdFilter = normalizedFilterID !== "";
    const hasDateFilter = filterDataInicio !== "" || filterDataFim !== "";
    const numericFilterID = Number(normalizedFilterID);
    const hasNumericFilterID =
      hasIdFilter && Number.isFinite(numericFilterID) && normalizedFilterID !== "";

    const regionMap = {
      CO_N: ["DF", "GO", "TO", "AC", "MS", "MT", "RO", "AM", "AP", "MA", "PA", "RR",],
      NE: ["PE", "CE", "PB", "RN", "AL", "PI", "BA", "SE"],
      RJ_ES_MG: ["RJ", "ES", "MG"],
      SP: ["SP"],
      SUL: ["RS", "PR", "SC"],
    };

    // ESTRATÉGIA: Aplicar filtros críticos no Firestore, resto em memória
    // Filtro de data com UTC correto
    if (!hasIdFilter && hasDateFilter) {
      // Se apenas data inicio está preenchida
      if (filterDataInicio !== "" && filterDataFim === "") {
        const dataInicio = new Date(filterDataInicio + "T00:00:00Z");
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        query = query.where("created", ">=", dataInicio).where("created", "<=", hoje);
        console.log(`📅 Filtro: APRs de ${filterDataInicio} até hoje (${hoje.toLocaleDateString()})`);
      }
      // Se apenas data fim está preenchida
      else if (filterDataInicio === "" && filterDataFim !== "") {
        const dataFim = new Date(filterDataFim + "T23:59:59Z");
        query = query.where("created", "<=", dataFim);
        console.log(`📅 Filtro: APRs do início até ${filterDataFim}`);
      }
      // Se ambas estão preenchidas
      else if (filterDataInicio !== "" && filterDataFim !== "") {
        const dataInicio = new Date(filterDataInicio + "T00:00:00Z");
        const dataFim = new Date(filterDataFim + "T23:59:59Z");
        query = query.where("created", ">=", dataInicio).where("created", "<=", dataFim);
        console.log(`📅 Filtro: APRs de ${filterDataInicio} até ${filterDataFim}`);
      }
    }

    // Aplicar filtro de perfil/nível
    if (user.nivel === "aplicador" && user.area !== "oem") {
      query = query.where("user_id.uid", "==", user.uid);
    } else if (user.area === "oem") {
      query = query.where("status", "in", ["Enviado", "Respondido pela Area"]);
    } else if (user.area === "pci") {
      query = query.where("site_id.tipoSite", "in", ["PCI", "RPCI"]);
    } else if (user.nivel === "auditor") {
      query = query.where("site_id.tipoSite", "in", ["AUDIT PGR FIXA", "AUDIT PGR MOVEL"]);
    }

    // Filtro por regional do usuário se aplicável
    const regional = regionMap[user.regional];
    if (user.nivel === "supervisor" && regional) {
      query = query.where("site_id.Estado", "in", regional);
    } else if (user.nivel === "revisor" && regional) {
      query = query.where("site_id.Estado", "in", regional);
    } else if (user.nivel === "ponto_focal") {
      query = query.where("status", "==", "Enviado para Área Responsável");
    }

    // OTIMIZAÇÃO: Puxar filtros de igualdade para o Firestore para reduzir tráfego e aumentar velocidade
    if (filterStatus !== "") {
      query = query.where("status", "==", filterStatus);
    }
    if (filterUF !== "") {
      query = query.where("site_id.Estado", "==", filterUF);
    }
    if (filterTipoSite !== "") {
      query = query.where("site_id.tipoSite", "==", filterTipoSite);
    }
    if (filterMotivo !== "") {
      query = query.where("motivo_apr", "==", filterMotivo);
    }
    if (filterNome !== "") {
      query = query.where("user_id.nome", "==", filterNome);
    }
    if (filterSigla !== "") {
      query = query.where("site_id.Sigla", "==", filterSigla);
    }
    // Regional manual: Apenas para administradores (evita conflito de 'in' em outros perfis)
    if (filterRegional !== "" && user.nivel === "administrador") {
      const estados = regionMap[filterRegional];
      if (estados) {
        query = query.where("site_id.Estado", "in", estados);
      }
    }

    // Guarda a base da query para fallback quando o ID estiver salvo como string.
    const baseQuery = query;

    // Otimização: com ID informado, tenta buscar direto no Firestore por igualdade.
    if (hasNumericFilterID) {
      query = query.where("apr_id", "==", numericFilterID);
    }

    // Nota: Outros filtros (ID, UF, Sigla, TipoSite, Status, Nome, Motivo, Regional manual)
    // serão aplicados em memória para evitar timeout (múltiplos where simultâneos)

    // Aplicar orderBy
    query = hasIdFilter
      ? query.orderBy("apr_id", "desc")
      : hasDateFilter
        ? query.orderBy("created", "desc")
        : novasAPRs
          ? query.orderBy("apr_id", "desc")
          : query.orderBy("created", "desc");

    // Limites inteligentes para evitar lentidão
    // Se for busca por ID, traz apenas 1 (ou poucos legados).
    // Se houver filtro de data ou se o usuário pediu 'Tudo', não aplicamos o limite de 1000.
    if (hasIdFilter) {
      query = query.limit(10);
    } else if (hasDateFilter || searchAll) {
      // Sem limite ou um limite muito alto para garantir que traz tudo do período
      console.log("🔍 Buscando sem limite (Filtro de data ou Buscar Tudo ativo)");
    } else {
      query = query.limit(
        isMobileViewport() ? MOBILE_DEFAULT_LIMIT : DESKTOP_DEFAULT_LIMIT
      );
    }

    const summarizeChecklist = (checklist, status, tipoSite) => {
      let totalQuestions = 0;
      let totalRespondidas = 0;
      let questoes = 0;
      let respondidas = 0;
      let pgrInconformidade = 0;

      if (!Array.isArray(checklist)) {
        return {
          totalQuestions,
          totalRespondidas,
          questoes,
          respondidas,
          pgrInconformidade,
        };
      }

      const isPgrAudit =
        tipoSite === "AUDIT PGR FIXA" || tipoSite === "AUDIT PGR MOVEL";
      const needsRespondidoAreaStats = status === "Respondido pela Area";

      checklist.forEach((area) => {
        const questions = Array.isArray(area?.[1]) ? area[1] : [];
        totalQuestions += questions.length;

        questions.forEach((question) => {
          const hasResponse = question?.resp && question.resp !== "";
          const isInconformidade =
            question?.respGabarito !== question?.resp && hasResponse;

          if (hasResponse) {
            totalRespondidas++;
          }

          if (isPgrAudit && isInconformidade) {
            pgrInconformidade++;
          }

          if (
            needsRespondidoAreaStats &&
            question?.openPA === true &&
            isInconformidade
          ) {
            questoes++;
            if (question?.plano_acao?.comentario) {
              respondidas++;
            }
          }
        });
      });

      return {
        totalQuestions,
        totalRespondidas,
        questoes,
        respondidas,
        pgrInconformidade,
      };
    };

    const mapSnapshotToList = (snapshot) => {
      const lista = [];

      snapshot.forEach((doc) => {
        const docData = doc.data();

        // Se ID estiver preenchido, ele funciona de forma independente dos demais filtros.
        if (hasIdFilter) {
          const docAprId = String(docData.apr_id ?? "").trim();
          if (docAprId !== normalizedFilterID) {
            return;
          }
        } else {
          // Aplicar demais filtros em memória para os que não puderam ser otimizados na query (ex: regional para não-admins)
          if (filterRegional !== "" && user.nivel !== "administrador") {
            const estados = regionMap[filterRegional];
            if (!estados || !estados.includes(docData.site_id?.Estado)) {
              return;
            }
          }
        }

        const checklist = docData.checklist;
        const {
          totalQuestions,
          totalRespondidas,
          questoes,
          respondidas,
          pgrInconformidade,
        } = summarizeChecklist(
          checklist,
          docData.status,
          docData.site_id?.tipoSite
        );

        if (user.area === "oem" && checklist !== undefined) {
          let paTrue = false;
          checklist.forEach((area) => {
            area[1]?.forEach((question) => {
              if (
                question.openPA === true &&
                question.respGabarito !== question.resp
              ) {
                paTrue = true;
              }
            });
          });

          if (paTrue === true) {
            lista.push({
              id: doc.id,
              apr_id: docData.apr_id,
              nome:
                docData.user_id.nome !== undefined
                  ? docData.user_id.nome
                  : "",
              motivo_apr: docData.motivo_apr,
              site_id: docData.site_id,
              status: docData.status,
              created: format(
                docData.created.toDate(),
                "dd/MM/yyyy HH:mma"
              ),
              porcentagem_resp_area:
                questoes !== 0
                  ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                  : "-",
              pgr_inconformidade: pgrInconformidade,
              totalQuestions: totalQuestions,
              totalRespondidas: totalRespondidas,
            });
          }
        } else {
          lista.push({
            id: doc.id,
            apr_id: docData.apr_id,
            nome:
              docData.user_id.nome !== undefined
                ? docData.user_id.nome
                : "",
            motivo_apr: docData.motivo_apr,
            site_id: docData.site_id,
            status: docData.status,
            created: format(docData.created.toDate(), "dd/MM/yyyy HH:mma"),
            porcentagem_resp_area:
              questoes !== 0
                ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                : "-",
            pgr_inconformidade: pgrInconformidade,
            totalQuestions: totalQuestions,
            totalRespondidas: totalRespondidas,
          });
        }
      });

      return lista;
    };

    try {
      const snapshot = await query.get();
      let lista = mapSnapshotToList(snapshot);

      // Fallback para legado: tenta ID como string se o campo estiver salvo com tipo diferente.
      if (hasIdFilter && hasNumericFilterID && lista.length === 0) {
        const fallbackSnapshot = await baseQuery
          .where("apr_id", "==", normalizedFilterID)
          .orderBy("apr_id", "desc")
          .limit(50)
          .get();
        lista = mapSnapshotToList(fallbackSnapshot);
      }

      setChamados(lista);
      if (
        isMobileViewport() &&
        !searchAll &&
        !hasIdFilter &&
        !hasDateFilter &&
        lista.length >= MOBILE_DEFAULT_LIMIT
      ) {
        toast.info(
          `Carga otimizada no celular: exibindo os primeiros ${MOBILE_DEFAULT_LIMIT} registros.`
        );
      }
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar APRs: ", err);
      setLoading(false);
    }
  };

  // Função para atualizar o status de uma APR
  const updateStatus = (id, index) => {
    let confirm = window.confirm("Deseja realmente alterar o status da APR?");
    if (!confirm) return;

    listRef
      .doc(id)
      .update({ status: "Cancelado" })
      .then(() => {
        let updatedChamados = [...chamados];
        updatedChamados[index].status = "Cancelado";
        setChamados(updatedChamados);
        logSistem(`APR foi alterado o status para Cancelado`, id);
        toast.success("Status da APR alterado com sucesso!");
      })
      .catch((err) => {
        toast.error("Erro ao atualizar o status da APR!");
        console.error(err);
      });
  };

  const updateStatusRollBack = (id, index) => {
    let confirm = window.confirm("Deseja realmente alterar o status da APR para Em Aberto?");
    if (!confirm) return;

    listRef
      .doc(id)
      .update({ status: "Em Aberto" })
      .then(() => {
        let updatedChamados = [...chamados];
        updatedChamados[index].status = "Em Aberto";
        setChamados(updatedChamados);
        logSistem(`APR foi alterado o status para Em Aberto`, id);
        toast.success("Status da APR alterado com sucesso!");
      })
      .catch((err) => {
        toast.error("Erro ao atualizar o status da APR!");
        console.error(err);
      });
  };

  // Função para limpar os filtros
  const clearFilters = () => {
    setFilterUF("");
    setFilterSigla("");
    setFilterTipoSite("");
    setFilterStatus("");
    setFilterNome("");
    setFilterID("");
    setFilterMotivo("");
    setFilterRegional("");
    setFilterDataInicio("");
    setFilterDataFim("");
    clearSessionStorage();
  };

  // Atualizar o estado dos filtros e salvar no localStorage
  const handleFilterChange = (name, value) => {
    const newFilters = {
      filterUF,
      filterSigla,
      filterTipoSite,
      filterStatus,
      filterNome,
      filterID,
      filterMotivo,
      filterRegional,
      filterDataInicio,
      filterDataFim,
      [name]: value,
    };
    saveFiltersToSessionStorage(newFilters);

    switch (name) {
      case "filterUF":
        setFilterUF(value);
        break;
      case "filterSigla":
        setFilterSigla(value);
        break;
      case "filterTipoSite":
        setFilterTipoSite(value);
        break;
      case "filterStatus":
        setFilterStatus(value);
        break;
      case "filterNome":
        setFilterNome(value);
        break;
      case "filterID":
        setFilterID(value);
        break;
      case "filterMotivo":
        setFilterMotivo(value);
        break;
      case "filterRegional":
        setFilterRegional(value);
        break;
      case "filterDataInicio":
        setFilterDataInicio(value);
        break;
      case "filterDataFim":
        setFilterDataFim(value);
        break;
      default:
        break;
    }
  };

  // function contAprs(status) {
  //   var quantidadeElementos = chamados.filter(
  //     (x) => x.status === status
  //   ).length;
  //   return chamados.filter(x) => x.status === status).length;;
  // }

  return (
    <div className="apr-digital dashboard-page">
      <Header name="APRs" />
      <div className="content">
        {(user.nivel === "administrador" ||
          user.nivel === "revisor") && (
            <Grid
              container
              className="dashboard-kpis"
              marginBottom={3}
              justifyContent="center"
              alignItems="stretch"
              className="dashboard-kpis-grid"
              sx={{ width: "100%" }}
            >
              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.pendenciaCard }}>
                  <FiAlertCircle style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Pendência (10 dias)</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.pendencia10Dias}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.enviadoCard }}>
                  <FiSend style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Aguardando Ponto Focal</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.aguardandoPontoFocal}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.emAbertoCard }}>
                  <FiClock style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Em Aberto</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.emAberto}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.canceladoCard }}>
                  <FiXCircle style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Cancelado</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.cancelado}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.revisadoCard }}>
                  <FiCheckCircle style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Revisado</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.revisado}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.enviadoCard }}>
                  <FiSend style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Enviado</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.enviado}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={5}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.respondidoCard }}>
                  <FiMessageCircle style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Respondido</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.respondidoArea}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={6}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.concluidoCard }}>
                  <FiFileText style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Concluido</Box>
                  <Box sx={styles.kpiValue}>{dashboardStats.concluido}</Box>
                </Box>
              </Grid>

              <Grid
                item
                xs={5.5}
                sm={5}
                md={1.4}
              >
                <Box sx={{ ...styles.kpiCard, ...styles.totalCard }}>
                  <FiActivity style={styles.kpiIcon} />
                  <Box sx={styles.kpiTitle}>Total</Box>
                  <Box sx={styles.kpiValue}>{chamados.length}</Box>
                </Box>
              </Grid>
            </Grid>
          )}

        <div className="container filter dashboard-filters">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={2}>
              <TextField
                id="id"
                type="number"
                label="ID APR"
                value={filterID}
                onChange={(e) =>
                  handleFilterChange(
                    "filterID",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                variant="outlined"
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={12} md={2}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="uf-label" size="small">
                  Motivo
                </InputLabel>
                <Select
                  id="motivo"
                  labelId="motivo-label"
                  label="Motivo"
                  value={filterMotivo}
                  onChange={(e) =>
                    handleFilterChange("filterMotivo", e.target.value)
                  }
                  size="small"
                >
                  <MenuItem value={"Mapa de Calor"}>Mapa de Calor</MenuItem>
                  <MenuItem value={"Retrofit"}>Retrofit</MenuItem>
                  <MenuItem value={"Rota Critica DWDM"}>Rota Critica DWDM</MenuItem>
                  <MenuItem value={"Projeto Veneza"}>Projeto Veneza</MenuItem>
                  <MenuItem value={"TurnKey"}>TurnKey</MenuItem>
                  <MenuItem value={"Conectividade nos Sites"}>Conectividade nos Sites</MenuItem>
                  <MenuItem value={"Torre Segura"}>Torre Segura</MenuItem>
                  <MenuItem value={"Internalização Loja Dealer"}>Internalização Loja Dealer</MenuItem>
                  <MenuItem value={"Estoque Avançado"}>Estoque Avançado</MenuItem>
                  <MenuItem value={"Instalação Tag"}>Instalação Tag</MenuItem>
                  <MenuItem value={"Sites Criticos (Mapa de Proteção)"}>Sites Criticos (Mapa de Proteção)</MenuItem>
                  <MenuItem value={"Não Opinada"}>Não Opinada</MenuItem>
                  <MenuItem value={"Opinada"}>Opinada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={0.9}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="uf-label" size="small">
                  UF
                </InputLabel>
                <Select
                  id="uf"
                  labelId="uf-label"
                  label="UF"
                  value={filterUF}
                  onChange={(e) =>
                    handleFilterChange("filterUF", e.target.value.toUpperCase())
                  }
                  size="small"
                >
                  <MenuItem value="">Todas UF</MenuItem>
                  <MenuItem value="AC">AC</MenuItem>
                  <MenuItem value="AL">AL</MenuItem>
                  <MenuItem value="AM">AM</MenuItem>
                  <MenuItem value="AP">AP</MenuItem>
                  <MenuItem value="BA">BA</MenuItem>
                  <MenuItem value="CE">CE</MenuItem>
                  <MenuItem value="DF">DF</MenuItem>
                  <MenuItem value="ES">ES</MenuItem>
                  <MenuItem value="GO">GO</MenuItem>
                  <MenuItem value="MA">MA</MenuItem>
                  <MenuItem value="MG">MG</MenuItem>
                  <MenuItem value="MS">MS</MenuItem>
                  <MenuItem value="MT">MT</MenuItem>
                  <MenuItem value="PA">PA</MenuItem>
                  <MenuItem value="PB">PB</MenuItem>
                  <MenuItem value="PE">PE</MenuItem>
                  <MenuItem value="PI">PI</MenuItem>
                  <MenuItem value="PR">PR</MenuItem>
                  <MenuItem value="RJ">RJ</MenuItem>
                  <MenuItem value="RN">RN</MenuItem>
                  <MenuItem value="RO">RO</MenuItem>
                  <MenuItem value="RR">RR</MenuItem>
                  <MenuItem value="RS">RS</MenuItem>
                  <MenuItem value="SC">SC</MenuItem>
                  <MenuItem value="SE">SE</MenuItem>
                  <MenuItem value="SP">SP</MenuItem>
                  <MenuItem value="TO">TO</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={1.5}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="tipo-label" size="small">
                  Regional
                </InputLabel>
                <Select
                  id="tipo"
                  labelId="tipo-label"
                  label="Regional"
                  value={filterRegional}
                  onChange={(e) =>
                    handleFilterChange("filterRegional", e.target.value)
                  }
                  size="small"
                >
                  <MenuItem value="SP">SP</MenuItem>
                  <MenuItem value="RJ_ES_MG">RJ_ES_MG</MenuItem>
                  <MenuItem value="NE">NE</MenuItem>
                  <MenuItem value="SUL">SUL</MenuItem>
                  <MenuItem value="CO_N">CO_N</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={1.5}>
              <TextField
                id="nome"
                type="text"
                label="Aplicador"
                value={filterNome}
                onChange={(e) =>
                  handleFilterChange("filterNome", e.target.value.toUpperCase())
                }
                variant="outlined"
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={12} md={1}>
              <TextField
                id="sigla"
                type="text"
                label="Sigla"
                value={filterSigla}
                onChange={(e) =>
                  handleFilterChange(
                    "filterSigla",
                    e.target.value.toUpperCase()
                  )
                }
                variant="outlined"
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={12} md={1.5}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="tipo-label" size="small">
                  Tipo de Site
                </InputLabel>
                <Select
                  id="tipo"
                  labelId="tipo-label"
                  label="Tipo de Site"
                  value={filterTipoSite}
                  onChange={(e) =>
                    handleFilterChange("filterTipoSite", e.target.value)
                  }
                  size="small"
                >
                  <MenuItem value="ERB-CT">ERB-CT</MenuItem>
                  <MenuItem value="ERB">ERB</MenuItem>
                  <MenuItem value="CT">CT</MenuItem>
                  <MenuItem value="CD">CD</MenuItem>
                  <MenuItem value="PREDIO CORE">PREDIO CORE</MenuItem>
                  <MenuItem value="LOJA">LOJA</MenuItem>
                  <MenuItem value="LOJA DEALER">LOJA DEALER</MenuItem>
                  <MenuItem value="TORRE SEGURA">TORRE SEGURA</MenuItem>
                  <MenuItem value="PROJETO VENEZA">PROJETO VENEZA</MenuItem>
                  <MenuItem value="RETROFIT">RETROFIT</MenuItem>
                  <MenuItem value="TURNKEY">TURNKEY</MenuItem>
                  <MenuItem value="CHECK SEG PROTEÇÃO">CHECK SEG PROTEÇÃO</MenuItem>
                  <MenuItem value="AUDIT PGR FIXA">AUDIT PGR FIXA</MenuItem>
                  <MenuItem value="AUDIT PGR MOVEL">AUDIT PGR MOVEL</MenuItem>
                  <MenuItem value="PGR CD MOVEL">PGR CD MOVEL</MenuItem>
                  <MenuItem value="PGR CD FIXA">PGR CD FIXA</MenuItem>
                  <MenuItem value="PGR BASE CROSS">PGR BASE CROSS</MenuItem>
                  <MenuItem value="OUTDOOR">OUTDOOR</MenuItem>
                  <MenuItem value="INDOOR">INDOOR</MenuItem>
                  <MenuItem value="SMARTTAG2">SMARTTAG</MenuItem>
                  <MenuItem value="RPCI">RPCI</MenuItem>
                  <MenuItem value="PCI">PCI</MenuItem>
                  <MenuItem value="LOJA PROJ VENEZA">LOJA PROJ VENEZA</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={1.6}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="status-label" size="small">
                  Status
                </InputLabel>
                <Select
                  id="status"
                  labelId="status-label"
                  label="Status"
                  value={filterStatus}
                  onChange={(e) =>
                    handleFilterChange("filterStatus", e.target.value)
                  }
                  size="small"
                >
                  <MenuItem value="Enviado">Enviado</MenuItem>
                  <MenuItem value="Em Aberto">Em Aberto</MenuItem>
                  <MenuItem value="Concluido">Concluido</MenuItem>
                  <MenuItem value="Respondido pela Area">
                    Respondido pela Area
                  </MenuItem>
                  <MenuItem value="Com Exceção">Com Exceção</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                  <MenuItem value="Revisado">Revisado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1.4}>
              <TextField
                id="dataInicio"
                type="date"
                label="Data Início"
                value={filterDataInicio}
                onChange={(e) =>
                  handleFilterChange("filterDataInicio", e.target.value)
                }
                variant="outlined"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.4}>
              <TextField
                id="dataFim"
                type="date"
                label="Data Fim"
                value={filterDataFim}
                onChange={(e) =>
                  handleFilterChange("filterDataFim", e.target.value)
                }
                variant="outlined"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => loadChamados(false, false)}
                fullWidth
                disabled={loading}
                startIcon={<FiSearch />}
                title="Busca os primeiros 1000 registros"
              >
                Buscar
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={1.6}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => loadChamados(false, true)}
                fullWidth
                disabled={loading}
                startIcon={<FiSearch />}
                title="Busca todos os registros filtrados"
              >
                Buscar Tudo
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={clearFilters}
                fullWidth
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </div>
        <OfflineAPRsPanel />
        <div className="container dashboard-table-shell">
          <TableDashboard
            chamados={chamados}
            user={user}
            updateStatus={updateStatus}
            updateStatusRollBack={updateStatusRollBack}
          />
        </div>

        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
          <span style={{ marginLeft: '15px', fontSize: '1.2rem' }}>Carregando dados, por favor aguarde...</span>
        </Backdrop>
      </div>
    </div>
  );
}
