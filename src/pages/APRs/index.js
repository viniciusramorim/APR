import { useState, useEffect, useContext } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { format } from "date-fns";
import { AuthContext } from "../../contexts/auth";
import Header from "../../components/Header";
import firebase from "../../services/firebaseConnection";
import "./index.scss";
import { toast } from "react-toastify";
import TableDashboard from "./tableDashboard";
import {
  Grid,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

const styles = {
  containerDash: {
    background: "#380054e8",
    color: "#fff",
    padding: "6px",
    borderRadius: "8px",
  },
  pendendia: {
    background: "#ef0808e8",
    color: "#fff",
    padding: "6px",
    borderRadius: "8px",
  },
  gridContainer: {
    gap: "10px",
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

// Função para salvar o botão clicado no localStorage
const saveLastButtonToSessionStorage = (button) => {
  sessionStorage.setItem("lastButtonClicked", button);
};

// Função para carregar o último botão clicado do localStorage
const loadLastButtonFromSessionStorage = () => {
  return sessionStorage.getItem("lastButtonClicked");
};

// Função para limpar as informações de filtro e paginação do localStorage
const clearSessionStorage = () => {
  sessionStorage.removeItem("filters");
  sessionStorage.removeItem("tablePage");
  sessionStorage.removeItem("lastButtonClicked");
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
  const [filterSigla, setFilterSigla] = useState(
    savedFilters.filterSigla || ""
  );
  const [filterTipoSite, setFilterTipoSite] = useState(
    savedFilters.filterTipoSite || ""
  );
  const [filterStatus, setFilterStatus] = useState(
    savedFilters.filterStatus || ""
  );
  const [filterNome, setFilterNome] = useState(savedFilters.filterNome || "");
  const [filterID, setFilterID] = useState(savedFilters.filterID || "");
  const [filterMotivo, setFilterMotivo] = useState(
    savedFilters.filterMotivo || ""
  );
  const [filterRegional, setFilterRegional] = useState(
    savedFilters.filterRegional || ""
  );

  useEffect(() => {
    addBodyClass("page-dash");

    // Recupera o último botão clicado e dispara o clique correspondente
    const lastButtonClicked = loadLastButtonFromSessionStorage();
    if (lastButtonClicked === "all") {
      loadChamados(false);
    } else if (lastButtonClicked === "new") {
      loadChamados(true);
    }
  }, []);

  // Função para carregar os chamados com base nos filtros
  const loadChamados = async (novasAPRs = false) => {
    console.log("👤 User:", { nivel: user.nivel, area: user.area, uid: user.uid });
    setLoading(true);
    let query = listRef;

    const regionMap = {
      CO_N: [
        "DF",
        "GO",
        "TO",
        "AC",
        "MS",
        "MT",
        "RO",
        "AM",
        "AP",
        "MA",
        "PA",
        "RR",
      ],
      NE: ["PE", "CE", "PB", "RN", "AL", "PI", "BA", "SE"],
      RJ_ES_MG: ["RJ", "ES", "MG"],
      SP: ["SP"],
      SUL: ["RS", "PR", "SC"],
    };

    // ⚠️ Se filtrar por ID, essa deve ser a primeira query (sem orderBy antes)
    if (filterID !== "") {
      query = listRef.where("apr_id", "==", parseInt(filterID));
    } else {
      query = novasAPRs
        ? query.where("apr_id", ">", 0).orderBy("apr_id", "desc")
        : query.orderBy("created", "desc");
    }

    // Aplicar os filtros (apenas se não for filtro por ID)
    if (filterID === "") {
      if (filterUF !== "") query = query.where("site_id.Estado", "==", filterUF);
      if (filterSigla !== "")
        query = query.where("site_id.Sigla", "==", filterSigla);
      if (filterTipoSite !== "")
        query = query.where("site_id.tipoSite", "==", filterTipoSite);
      // Revisor e revisor_logistica veem todos os status, outros usuários podem filtrar
      if (filterStatus !== "" && user.nivel !== "revisor" && user.nivel !== "revisor_logistica")
        query = query.where("status", "==", filterStatus);
      if (filterNome !== "")
        query = query.where("user_id.nome", "==", filterNome);
      if (filterMotivo !== "")
        query = query.where("motivo_apr", "==", filterMotivo);
      if (filterRegional !== "") {
        const estados = regionMap[filterRegional];
        if (estados) {
          query = query.where("site_id.Estado", "in", estados);
        }
      }
    }

    //valida regional por usuario
    const regional = regionMap[user.regional];

    //filtro por perfil
    // Aplicadores não filtram por UID se forem OEM (precisam ver APRs de outros)
    query =
      user.nivel === "aplicador" && user.area !== "oem"
        ? query.where("user_id.uid", "==", user.uid)
        : query;
    query =
      user.nivel === "supervisor" && regional
        ? query.where("site_id.Estado", "in", regional)
        : query;
    query =
      user.nivel === "revisor" && regional
        ? query.where("site_id.Estado", "in", regional)
        : query;
    query =
      user.nivel === "revisor_logistica" && regional
        ? query.where("site_id.Estado", "in", regional)
        : query;
    query =
      user.area === "oem"
        ? query.where("status", "in", ["Enviado", "Respondido pela Area"])
        : query;
    query =
      user.area === "pci"
        ? query.where("site_id.tipoSite", "in", ["PCI", "RPCI"])
        : query;
    // Filtro para ponto_focal: status específico + área do usuário
    if (user.nivel === "ponto_focal") {
      console.log("🔍 Ponto focal filtro - area:", user.area);
      query = query.where("status", "==", "Enviado para Área Responsável");
      // TESTE: Removendo filtro de área temporariamente para debugar
      console.log("⚠️ TESTE: Filtro de área REMOVIDO temporariamente");
      if (!user.area) {
        console.warn("⚠️ Ponto focal sem area definida");
      }
    }
    query =
      user.nivel === "auditor"
        ? query.where("site_id.tipoSite", "in", [
          "AUDIT PGR FIXA",
          "AUDIT PGR MOVEL",
        ])
        : query;


    const contarQuestions = (checklist) => {
      let totalQuestions = 0;
      let totalRespondidas = 0;

      if (checklist) {
        checklist.forEach((area) => {
          if (Array.isArray(area[1])) {
            totalQuestions += area[1].length;

            area[1].forEach((question) => {
              if (question.resp && question.resp !== "") {
                totalRespondidas++;
              }
            });
          }
        });
      }

      return { totalQuestions, totalRespondidas };
    };

    await query
      .get()
      .then((snapshot) => {
        console.log("📊 Query resultado - Total docs:", snapshot.size);
        if (user.nivel === "ponto_focal") {
          console.log("🔍 Ponto focal recebeu", snapshot.size, "documentos");
        }
        const lista = [];

        snapshot.forEach((doc) => {
          // Filtro para revisor_logistica: apenas APRs com tipoSite contendo "PGR"
          if (user.nivel === "revisor_logistica" && !doc.data().site_id.tipoSite.includes("PGR")) {
            return; // Pula este documento
          }

          let questoes = 0;
          let respondidas = 0;
          let pgr_inconformidade = 0;
          const checklist = doc.data().checklist;
          const { totalQuestions, totalRespondidas } =
            contarQuestions(checklist);

          if (
            doc.data().site_id.tipoSite === "AUDIT PGR FIXA" ||
            doc.data().site_id.tipoSite === "AUDIT PGR MOVEL"
          ) {
            checklist.forEach((area) => {
              area[1].forEach((question) => {
                if (
                  question.respGabarito !== question.resp &&
                  question.resp !== ""
                ) {
                  pgr_inconformidade++;
                }
              });
            });
          }

          if (doc.data().status === "Respondido pela Area") {
            checklist.forEach((area) => {
              area[1].forEach((question) => {
                if (
                  question.openPA === true &&
                  question.respGabarito !== question.resp &&
                  question.resp !== ""
                ) {
                  questoes++;
                  if (question.plano_acao.comentario) {
                    respondidas++;
                  }
                }
              });
            });
          }

          if (user.area === "oem" && checklist !== undefined) {
            let paTrue = false;
            checklist.forEach((area) => {
              area[1].forEach((question) => {
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
                nome:
                  doc.data().user_id.nome !== undefined
                    ? doc.data().user_id.nome
                    : "",
                motivo_apr: doc.data().motivo_apr,
                site_id: doc.data().site_id,
                status: doc.data().status,
                created: format(
                  doc.data().created.toDate(),
                  "dd/MM/yyyy HH:mma"
                ),
                porcentagem_resp_area:
                  questoes !== 0
                    ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                    : "-",
                pgr_inconformidade: pgr_inconformidade,
                totalQuestions: totalQuestions,
                totalRespondidas: totalRespondidas,
              });
            }
          } else if (user.nivel === "ponto_focal" && checklist !== undefined) {
            // Ponto focal vê todas as APRs dos status configurados
            // Sem restrição adicional - pois já filtra por status na query
            lista.push({
              id: doc.id,
              apr_id: doc.data().apr_id,
              nome:
                doc.data().user_id.nome !== undefined
                  ? doc.data().user_id.nome
                  : "",
              motivo_apr: doc.data().motivo_apr,
              site_id: doc.data().site_id,
              status: doc.data().status,
              created: format(doc.data().created.toDate(), "dd/MM/yyyy HH:mma"),
              porcentagem_resp_area:
                questoes !== 0
                  ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                  : "-",
              pgr_inconformidade: pgr_inconformidade,
              totalQuestions: totalQuestions,
              totalRespondidas: totalRespondidas,
            });
          } else {
            lista.push({
              id: doc.id,
              apr_id: doc.data().apr_id,
              nome:
                doc.data().user_id.nome !== undefined
                  ? doc.data().user_id.nome
                  : "",
              motivo_apr: doc.data().motivo_apr,
              site_id: doc.data().site_id,
              status: doc.data().status,
              created: format(doc.data().created.toDate(), "dd/MM/yyyy HH:mma"),
              porcentagem_resp_area:
                questoes !== 0
                  ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                  : "-",
              pgr_inconformidade: pgr_inconformidade,
              totalQuestions: totalQuestions,
              totalRespondidas: totalRespondidas,
            });
          }
        });

        console.log("📝 Total de APRs na lista final:", lista.length);
        setChamados(lista);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Erro ao carregar APRs: ", err);
        console.error("Detalhes:", err.message);
        setLoading(false);
      });
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
      default:
        break;
    }
  };

  function contAprs(status) {
    const quantidadeElementos = chamados.filter((x) => {
      if (x.status !== status) return false;

      // Parse da data
      const [datePart, timePartWithPeriod] = x.created.split(' ');
      const [day, month, year] = datePart.split('/');
      const timePart = timePartWithPeriod.slice(0, -2);
      const period = timePartWithPeriod.slice(-2);
      const formattedDateStr = `${year}-${month}-${day}`;
      const createdDate = new Date(formattedDateStr);

      const now = new Date();
      const diffMs = now - createdDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Só conta se estiver em aberto E tiver mais de 5 dias
      return diffDays > 10;
    }).length;

    return quantidadeElementos;
  }

  return (
    <div className="apr-digital">
      <Header name="APRs" subtitle="Visualize suas APRs">
      </Header>
      <div className="content">
        {(user.nivel === "administrador" || user.nivel === "revisor" || user.nivel === 'revisor_logistica' ) && (
          <Grid
            container
            marginBottom={2}
            justifyContent="center"
            alignItems="center"
            textAlign="center"
            sx={styles.gridContainer}
          >
            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.pendendia}
            >
              <Grid>Pendencia de Revisão (10 dias)</Grid>
              <Grid>{contAprs("Em Aberto")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.pendendia}
            >
              <Grid>Aguardando Ponto Focal</Grid>
              <Grid>{chamados.filter((x) => x.status === "Enviado para Área Responsável").length}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Em Aberto</Grid>
              <Grid>{chamados.filter((x) => x.status === "Em Aberto").length}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Cancelado</Grid>
              <Grid>{contAprs("Cancelado")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Revisado</Grid>
              <Grid>{contAprs("Revisado")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Enviado</Grid>
              <Grid>{contAprs("Enviado")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={5}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Respondido pela Área</Grid>
              <Grid>{contAprs("Respondido pela Area")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={6}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Concluido</Grid>
              <Grid>{contAprs("Concluido")}</Grid>
            </Grid>

            <Grid
              container
              item
              direction="column"
              xs={5.5}
              sm={5}
              md={2.9}
              sx={styles.containerDash}
            >
              <Grid>Total</Grid>
              <Grid>{chamados.length}</Grid>
            </Grid>
          </Grid>
        )}

        <div className="container filter">
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
                    e.target.value.toUpperCase().slice(0, 6)
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

            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={clearFilters}
                fullWidth
              >
                Limpar Filtros
              </Button>
            </Grid>
          </Grid>
        </div>

        <Grid
          container
          marginTop={2}
          marginBottom={2}
          justifyContent="flex-end"
          alignItems="center"
        >
          <ButtonGroup size="small" aria-label="small button group">
            <Button
              size="small"
              color="secondary"
              variant="contained"
              onClick={() => {
                loadChamados(false);
                saveLastButtonToSessionStorage("all");
              }}
              disabled={loading}
            >
              {loading ? "Carregando APRs..." : "Listar Todas APRs"}
            </Button>
            <Button
              size="small"
              color="secondary"
              variant="outlined"
              style={{ marginLeft: "10px" }}
              onClick={() => {
                loadChamados(true);
                saveLastButtonToSessionStorage("new");
              }}
              disabled={loading}
            >
              {loading ? "Carregando APRs..." : "Listar Novas APRs"}
            </Button>
          </ButtonGroup>
        </Grid>

        {/* Lista de resultados */}
        <TableDashboard
          chamados={chamados}
          user={user}
          updateStatus={updateStatus}
          updateStatusRollBack={updateStatusRollBack}
        />
      </div>
    </div>
  );
}
