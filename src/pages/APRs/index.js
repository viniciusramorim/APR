import { useState, useEffect, useContext } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { format } from "date-fns";
import { AuthContext } from "../../contexts/auth";
import Header from "../../components/Header";
import Title from "../../components/Title";
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

// Função para salvar os filtros no localStorage
const saveFiltersToSessionStorage = (filters) => {
  sessionStorage.setItem("filters", JSON.stringify(filters));
};

// Função para carregar os filtros do localStorage
const loadFiltersFromSessionStorage = () => {
  const savedFilters = localStorage.getItem("filters");
  return savedFilters ? JSON.parse(savedFilters) : {};
};

// Função para salvar a página no localStorage
const savePageToSessionStorage = (page) => {
  sessionStorage.setItem("tablePage", page);
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
    setLoading(true);
    let query = listRef;

    query = novasAPRs
      ? query.where("apr_id", ">", 0).orderBy("apr_id", "desc")
      : query.orderBy("created", "desc");

    // Aplicar os filtros
    if (filterID !== "")
      query = query.where("apr_id", "==", parseInt(filterID));
    if (filterUF !== "") query = query.where("site_id.Estado", "==", filterUF);
    if (filterSigla !== "")
      query = query.where("site_id.Sigla", "==", filterSigla);
    if (filterTipoSite !== "")
      query = query.where("site_id.tipoSite", "==", filterTipoSite);
    if (filterStatus !== "") query = query.where("status", "==", filterStatus);
    if (filterNome !== "")
      query = query.where("user_id.nome", "==", filterNome);
    if (filterMotivo !== "")
      query = query.where("motivo_apr", "==", filterMotivo);
    if (filterRegional !== "") {
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
        SE: ["RJ", "ES", "MG"],
        SP: ["SP"],
        SUL: ["RS", "PR", "SC"],
      };
      const estados = regionMap[filterRegional];
      if (estados) {
        query = query.where("site_id.Estado", "in", estados);
      }
    }

    let lista = [];

    await query
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            apr_id: doc.data().apr_id,
            nome: doc.data().user_id.nome || "",
            site_id: doc.data().site_id,
            status: doc.data().status,
            motivo_apr: doc.data().motivo_apr,
            created: format(doc.data().created.toDate(), "dd/MM/yyyy HH:mma"),
          });
        });
        setChamados(lista);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar APRs: ", err);
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
    var quantidadeElementos = chamados.filter(
      (x) => x.status === status
    ).length;
    return quantidadeElementos;
  }

  const styles = {
    containerDash: {
      background: "#380054e8",
      color: "#fff",
      padding: "6px",
      borderRadius: "8px",
    },
    gridContainer: {
      gap: "10px",
    },
  };

  return (
    <div className="apr-digital">
      <Header />
      <div className="content">
        <Title name="APRs">
          <FiMessageSquare size={25} onClick={() => console.log("")} />
        </Title>
        {(user.nivel === "administrador" || user.nivel === "revisor") && (
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
              sx={styles.containerDash}
            >
              <Grid>Em Aberto</Grid>
              <Grid>{contAprs("Em Aberto")}</Grid>
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
              <Grid>{contAprs("Respondido pela Área")}</Grid>
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
                  <MenuItem value="Mapa de Calor">Mapa de Calor</MenuItem>
                  <MenuItem value="Retrofit">Retrofit</MenuItem>
                  <MenuItem value="Rota Critica DWDM">
                    Rota Critica DWDM
                  </MenuItem>
                  <MenuItem value="Projeto Veneza">Projeto Veneza</MenuItem>
                  <MenuItem value="Estoque Avançado">Estoque Avançado</MenuItem>
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
                  <MenuItem value="SE">SE</MenuItem>
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
                  <MenuItem value="AUDIT PGR FIXA">AUDIT PGR FIXA</MenuItem>
                  <MenuItem value="AUDIT PGR MOVEL">AUDIT PGR MOVEL</MenuItem>
                  <MenuItem value="OUTDOOR">OUTDOOR</MenuItem>
                  <MenuItem value="INDOOR">INDOOR</MenuItem>
                  <MenuItem value="SMARTTAG2">SMARTTAG</MenuItem>
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
        />
      </div>
    </div>
  );
}
