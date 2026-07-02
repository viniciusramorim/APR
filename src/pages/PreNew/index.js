import "./prenew.scss";
import { useEffect, useState, useContext } from "react";
import * as geofire from "geofire-common";
import { FiClipboard } from "react-icons/fi";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import SiteDetailModal from "../../components/SiteDetailModal";
import ModalNovoSite from "../../components/Modal_NovoSite/index.js";
import { AuthContext } from "../../contexts/auth";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { format } from "date-fns";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";

function normalizeString(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export default function PreNew() {
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const [site, setSite] = useState([]);
  const [siteSelect, setSiteSelect] = useState([]);
  const [aplicador, setAplicador] = useState([]);
  const [selectedAplicador, setSelectedAplicador] = useState("0");

  const [sigla, setSigla] = useState("");
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("Todos");

  const [page, setPage] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getPerimetro() {
    let lat = siteSelect[0].latitude;
    let lng = siteSelect[0].longitude;
    const center = [parseFloat(lat), parseFloat(lng)];

    try {
      let latitude = parseFloat(lat.replace(",", "."));
      let longitude = parseFloat(lng.replace(",", "."));
      geofire.distanceBetween([latitude, longitude], center);
      history.push("/new/" + siteSelect[0].id);
    } catch (err) {
      alert("Erro na localizacao do site, informe um Administrador.");
    }
  }

  useEffect(() => {
    addBodyClass("page-apply-apr");

    async function loadUsers() {
      await firebase
        .firestore()
        .collection("users")
        .where("nivel", "==", "aplicador")
        .where("status", "==", true)
        .get()
        .then((users) => {
          let userList = [];
          users.forEach((doc) => {
            userList.push({
              uid: doc.id,
              email: doc.data().email,
              nome: doc.data().nome,
              area: doc.data().area,
              uf: doc.data().uf,
            });
          });
          setAplicador(userList);
        })
        .catch((error) => {
          console.log("Erro ao carregar aplicadores:", error);
        });
    }

    loadUsers();
  }, []);

  function handleSiglaChange(event) {
    setSigla(event.target.value.toUpperCase());
  }

  function handleNomeChange(event) {
    setNome(event.target.value.toUpperCase());
  }

  function handleKeyPress(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  async function handleSearch() {
    if (sigla.trim() === "" && nome.trim() === "" && uf === "Todos") {
      return toast.error("Digite algo ou selecione um estado para buscar...");
    }

    let filteredData = [];

    setLoading(true);

    try {
      let searchQuery = firebase.firestore().collection("sites");

      if (uf !== "Todos") {
        searchQuery = searchQuery.where("Estado", "==", uf.toUpperCase());
      }

      if (sigla.trim() !== "") {
        const searchSigla = normalizeString(sigla.trim());
        searchQuery = searchQuery
          .where("Sigla", ">=", searchSigla)
          .where("Sigla", "<=", searchSigla + "\uf8ff");
      } else if (nome.trim() !== "") {
        const searchNome = normalizeString(nome.trim());
        searchQuery = searchQuery
          .where("Nome", ">=", searchNome)
          .where("Nome", "<=", searchNome + "\uf8ff");
      } else {
        searchQuery = searchQuery.limit(100);
      }

      const snapshot = await searchQuery.get();

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (sigla.trim() !== "" && nome.trim() !== "") {
          const searchNome = normalizeString(nome.trim());
          const normalizedNome = normalizeString(data.Nome || "");

          if (!normalizedNome.includes(searchNome)) {
            return;
          }
        }

        filteredData.push({
          id: doc.id,
          nome: data.Nome,
          cidade: data.Cidade,
          cep: data.CEP,
          complemento: data.Complemento,
          estado: data.Estado,
          endereco: data.Endereco,
          numero: data.Numero,
          latitude: data.Latitude,
          longitude: data.Longitude,
          tipoSite: data.tipoSite,
          critical: data.critical,
          geohash: data.geohash,
          sigla: data.Sigla,
          tipo_contrato: data.tipoContrato,
          detentora: data.Detentora,
          userLastUpdate: data.userLastUpdate || "-",
          lastUpdate: data.lastUpdate
            ? format(data.lastUpdate.toDate(), "dd/MM/yyyy HH:mm")
            : "-",
        });
      });

      if (filteredData.length === 0) {
        toast.info("Nenhum site encontrado com esses filtros.");
      }

      setSite(filteredData);
      setPage(0);
    } catch (err) {
      console.error("Erro ao buscar sites:", err);
      toast.error("Erro ao buscar sites. Tente refinar sua busca.");
    }

    setLoading(false);
  }

  function handlePaginationChange(event) {
    setResultsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  function handleList(sites) {
    setSelectedSite(sites);
    setSiteSelect(sites);
    setShowPostModal(true);
  }

  const paginatedSites = site.slice(
    page * resultsPerPage,
    page * resultsPerPage + resultsPerPage
  );
  const hasFilters = sigla.trim() !== "" || nome.trim() !== "" || uf !== "Todos";
  const totalPages = Math.max(1, Math.ceil(site.length / resultsPerPage));
  const visibleStart = site.length === 0 ? 0 : page * resultsPerPage + 1;
  const visibleEnd = Math.min(site.length, (page + 1) * resultsPerPage);

  return (
    <div>
      <Header name="Aplicar APR">
        <FiClipboard size={25} />
      </Header>

      <div className="content">
        <div className="container filters-container">
          <div className="prenew-hero">
            <div className="prenew-hero-copy">
              <span className="prenew-eyebrow">APR Digital</span>
              <Typography variant="h5" className="prenew-title">
                Buscar site para iniciar APR
              </Typography>
              <Typography variant="body2" className="prenew-subtitle">
                Localize o site por sigla ou nome, refine pela UF e escolha o registro correto para continuar.
              </Typography>

              <div className="prenew-newsite-action prenew-newsite-action--hero">
                <ModalNovoSite user={user} />
              </div>
            </div>
          </div>

          <div className="prenew-search-panel">
            <div className="prenew-search-topline">
              <Typography variant="body2" className="prenew-search-topline-text">
                Preencha um dos campos abaixo para localizar rapidamente o site desejado.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="prenew-status-chips">
                <Chip
                  label={`${site.length} resultado(s)`}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
                <Chip
                  label={uf === "Todos" ? "Busca nacional" : `UF ${uf}`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </div>

            <Grid container spacing={2.2} alignItems="stretch">
              <Grid item xs={12} md={4} lg={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Sigla do Site"
                  variant="outlined"
                  value={sigla}
                  onChange={handleSiglaChange}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={8} lg={5}>
                <TextField
                  size="small"
                  fullWidth
                  label="Nome do Site"
                  variant="outlined"
                  value={nome}
                  onChange={handleNomeChange}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel id="uf-select-label">UF</InputLabel>
                  <Select
                    labelId="uf-select-label"
                    id="uf-select"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    label="UF"
                  >
                    <MenuItem value="Todos">Todos</MenuItem>
                    {[
                      "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG",
                      "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR",
                      "RS", "SC", "SE", "SP", "TO",
                    ].map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} lg={2}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  className="btn-search"
                  fullWidth
                  startIcon={!loading ? <SearchRoundedIcon /> : null}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Buscar"}
                </Button>
              </Grid>
            </Grid>

            <div className="prenew-search-footer">
              <div className="prenew-search-meta">
                {hasFilters && !loading ? (
                  <div className="prenew-filter-note">
                    <span>Busca atual:</span>
                    <strong>
                      {sigla
                        ? ` sigla "${sigla}"`
                        : nome
                          ? ` nome "${nome}"`
                          : ` UF ${uf}`}
                    </strong>
                  </div>
                ) : (
                  <div className="prenew-filter-hint">
                    Digite uma sigla ou nome para listar os sites disponiveis.
                  </div>
                )}
              </div>

            </div>
          </div>

          {showPostModal && (
            <SiteDetailModal
              open={showPostModal}
              onClose={() => setShowPostModal(false)}
              site={selectedSite}
              handleSearch={handleSearch}
              getPerimetro={getPerimetro}
              user={user}
            />
          )}
        </div>

        <div className="container content-apr">
          {!loading && site.length > 0 && (
            <div className="prenew-results-header">
              <Box>
                <Typography variant="h6" className="prenew-results-title">
                  Sites encontrados
                </Typography>
                <Typography variant="body2" className="prenew-results-subtitle">
                  Exibindo {visibleStart}-{visibleEnd} de {site.length} registros.
                </Typography>
              </Box>

              <Chip
                label={`${resultsPerPage} por pagina`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            </div>
          )}

          {loading && (
            <div className="prenew-loading-state">
              <CircularProgress />
              <p>Buscando sites...</p>
            </div>
          )}

          {!loading &&
            paginatedSites.map((item) => (
              <div
                key={item.id}
                className="site-item-content"
                onClick={() => handleList([item])}
              >
                <div className="site-info-main">
                  <span className="site-sigla">{item.sigla}</span>
                  <span className="site-nome">{item.nome}</span>
                </div>

                <div className="site-info-sub">
                  <span>
                    <PlaceRoundedIcon fontSize="inherit" />
                    {item.estado} - {item.cidade}
                  </span>
                  <span>{item.endereco || "Endereco nao informado"}</span>
                  <span className="site-tipo">{item.tipoSite || "Sem tipo"}</span>
                  <span
                    className={`site-critical ${
                      normalizeString(item.critical || "BAIXO").includes("CRIT")
                        ? "critical"
                        : normalizeString(item.critical || "BAIXO").includes("ALTO")
                          ? "high"
                          : normalizeString(item.critical || "BAIXO").includes("MED")
                            ? "medium"
                            : "low"
                    }`}
                  >
                    {item.critical || "Baixo"}
                  </span>
                </div>

                <div className="site-item-footer">
                  <span>Atualizado em {item.lastUpdate}</span>
                  <span className="site-open-link">
                    Selecionar site
                    <ArrowOutwardRoundedIcon fontSize="inherit" />
                  </span>
                </div>
              </div>
            ))}

          {!loading && site.length === 0 && hasFilters && (
            <div className="prenew-empty-state">
              <h3>Nenhum site encontrado</h3>
              <p>Tente ajustar a sigla, o nome ou a UF para ampliar a busca.</p>
            </div>
          )}

          {!loading && site.length === 0 && !hasFilters && (
            <div className="prenew-empty-state prenew-empty-state--soft">
              <h3>Comece pela busca</h3>
              <p>Preencha uma sigla ou nome do site para listar os registros disponiveis.</p>
            </div>
          )}

          {!loading && site.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Pagina {page + 1} de {totalPages}
              </div>

              <FormControl variant="outlined" size="small" className="pagination-select">
                <InputLabel id="results-per-page-label">Resultados por Pagina</InputLabel>
                <Select
                  labelId="results-per-page-label"
                  id="results-per-page"
                  value={resultsPerPage}
                  onChange={handlePaginationChange}
                  label="Resultados por Pagina"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>

              <div className="pagination-actions">
                <Button
                  variant="outlined"
                  className="pagination-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outlined"
                  className="pagination-btn next"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(site.length / resultsPerPage) - 1}
                >
                  Proximo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
