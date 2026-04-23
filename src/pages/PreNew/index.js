import "./prenew.scss";
import { useEffect, useState, useContext } from "react";
import * as geofire from "geofire-common";
import { FiClipboard, FiMap, FiActivity, FiTag, FiSearch, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import SiteDetailModal from "../../components/SiteDetailModal";
import ModalNovoSite from "../../components/Modal_NovoSite/index.js";
import { AuthContext } from '../../contexts/auth';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CircularProgress,
} from "@mui/material";
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

  const [loading, setLoading] = useState(false); // <= NOVO

  async function getPerimetro() {
    let lat = siteSelect[0].latitude;
    let lng = siteSelect[0].longitude;
    const center = [parseFloat(lat), parseFloat(lng)];

    try {
      let latitude = parseFloat(lat.replace(",", "."));
      let longitude = parseFloat(lng.replace(",", "."));
      const distanceInKm = geofire.distanceBetween([latitude, longitude], center);
      history.push("/new/" + siteSelect[0].id);
    } catch (err) {
      alert("Erro na localização do site, informe um Administrador.");
    }
  }

  useEffect(() => {
    addBodyClass('page-apply-apr');
    async function loadUsers() {
      await firebase
        .firestore()
        .collection("users")
        .where("nivel", "==", "aplicador")
        .where("status", "==", true)
        .get()
        .then((users) => {
          let user = [];
          users.forEach((doc) => {
            user.push({
              uid: doc.id,
              email: doc.data().email,
              nome: doc.data().nome,
              area: doc.data().area,
              uf: doc.data().uf,
            });
          });
          setAplicador(user);
        })
        .catch((error) => {
          console.log("Erro ao carregar aplicadores:", error);
        });
    }

    loadUsers();
  }, []);

  // Handle changes in the sigla input
  function handleSiglaChange(event) {
    setSigla(event.target.value.toUpperCase());
  }

  // Handle changes in the nome input
  function handleNomeChange(event) {
    setNome(event.target.value.toUpperCase());
  }

  async function handleSearch() {
    if (sigla.trim() === "" && nome.trim() === "" && uf === "Todos") {
      return toast.error("Digite algo ou selecione um estado para buscar...");
    }

    setLoading(true);
    let filteredData = [];

    try {
      let query = firebase.firestore().collection("sites");

      if (uf !== "Todos") {
        query = query.where("Estado", "==", uf.toUpperCase());
      }

      // Se tiver sigla, usa como filtro primário (prefixo)
      if (sigla.trim() !== "") {
        const searchSigla = normalizeString(sigla.trim());
        query = query.where("Sigla", ">=", searchSigla)
          .where("Sigla", "<=", searchSigla + "\uf8ff");
      }
      // Se não tiver sigla mas tiver nome, usa nome como filtro primário (prefixo)
      else if (nome.trim() !== "") {
        const searchNome = normalizeString(nome.trim());
        query = query.where("Nome", ">=", searchNome)
          .where("Nome", "<=", searchNome + "\uf8ff");
      }
      // Se tiver apenas UF, limita a busca
      else {
        query = query.limit(100);
      }

      const snapshot = await query.get();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Se ambos foram preenchidos, fazemos um filtro adicional em memória para o que não foi na query
        if (sigla.trim() !== "" && nome.trim() !== "") {
          const searchNome = normalizeString(nome.trim());
          const normalizedNome = normalizeString(data.Nome || "");
          if (!normalizedNome.includes(searchNome)) return;
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

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function clearFilters() {
    setSigla("");
    setNome("");
    setUf("Todos");
    setSite([]);
  }

  function handlePaginationChange(event) {
    setResultsPerPage(parseInt(event.target.value));
    setPage(0);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  function handleList(sites) {
    setSelectedSite(sites);
    setShowPostModal(true);
  }

  const paginatedSites = site.slice(
    page * resultsPerPage,
    page * resultsPerPage + resultsPerPage
  );

  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Aplicar APR">
          <FiClipboard size={25} />
        </Title>
        <div className="container filters-container">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                label="Sigla do Site"
                variant="outlined"
                value={sigla}
                onChange={handleSiglaChange}
                onKeyPress={handleKeyPress}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                label="Nome do Site"
                variant="outlined"
                value={nome}
                onChange={handleNomeChange}
                onKeyPress={handleKeyPress}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" style={{ minWidth: "100%" }} size="small">
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
            <Grid item xs={12} md={4}>
              <Button
                className="btn-search"
                onClick={handleSearch}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (
                  <>
                    <FiSearch style={{ marginRight: '8px' }} /> Buscar
                  </>
                )}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                className="btn-clear"
                onClick={clearFilters}
                fullWidth
                style={{ height: '40px' }}
              >
                <FiTrash2 style={{ marginRight: '8px' }} /> Limpar
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <ModalNovoSite user={user} />
            </Grid>
          </Grid>

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
          {loading ? (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <CircularProgress />
              <p>Buscando sites...</p>
            </div>
          ) : (
            <>
              {paginatedSites.map((siteItem) => (
                <div
                  key={siteItem.id}
                  className="site-item-content"
                  onClick={() => handleList([siteItem])}
                >
                  <div className="site-info-main">
                    <span className="site-sigla">{siteItem.sigla}</span>
                    <span className="site-nome">{siteItem.nome}</span>
                  </div>
                  <div className="site-info-sub">
                    <span><FiMap size={14} /> {siteItem.estado} - {siteItem.cidade}</span>
                    <span className="site-tipo"><FiTag size={14} /> {siteItem.tipoSite}</span>
                  </div>
                </div>
              ))}

              <div className="pagination-container">
                <div className="pagination-info">
                  Mostrando {paginatedSites.length} de {site.length} sites
                </div>
                
                <FormControl variant="outlined" size="small" className="pagination-select">
                  <InputLabel id="results-per-page-label">Sites por página</InputLabel>
                  <Select
                    labelId="results-per-page-label"
                    id="results-per-page"
                    value={resultsPerPage}
                    onChange={handlePaginationChange}
                    label="Sites por página"
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>

                <div className="pagination-actions">
                  <Button
                    variant="outlined"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    className="pagination-btn"
                  >
                    <FiChevronLeft /> Anterior
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(site.length / resultsPerPage) - 1}
                    className="pagination-btn next"
                  >
                    Próximo <FiChevronRight />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}