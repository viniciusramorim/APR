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
    if (event.target.value !== "") {
      setNome("");
    }
  }

  // Handle changes in the nome input
  function handleNomeChange(event) {
    setNome(event.target.value);
    if (event.target.value !== "") {
      setSigla("");
    }
  }

  async function handleSearch() {
    if (sigla.trim() === "" && nome.trim() === "") {
      return toast.error("Digite uma sigla ou nome para buscar...");
    }

    const searchSigla = normalizeString(sigla.trim());
    const searchNome = normalizeString(nome.trim());
    let filteredData = [];

    setLoading(true); // INICIA LOADING

    try {
      let searchQuery = firebase.firestore().collection("sites");

      if (uf !== "Todos") {
        searchQuery = searchQuery.where("Estado", "==", uf.toUpperCase());
      }

      // Buscando por sigla usando where
      if (searchSigla) {
        const siglaSnapshot = await searchQuery
          .where("Sigla", ">=", searchSigla)
          .get();

        siglaSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!filteredData.some((item) => item.nome === data.Nome)) {
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
          }
        });
      }

      // Buscando por nome sem where completo
      if (searchNome) {
        const snapshot = await searchQuery.get();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const nome = data.Nome || "";

          const normalizedNome = normalizeString(nome);

          if (normalizedNome.includes(searchNome)) {
            if (!filteredData.some((item) => item.nome === data.Nome)) {
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
            }
          }
        });
      }

      setSite(filteredData);
      setPage(0);
    } catch (err) {
      console.log("Erro ao buscar sites:", err);
      toast.error("Erro ao buscar sites. Verifique sua conexão.");
    }

    setLoading(false); // FINALIZA LOADING
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
      <Header name="Aplicar APR">
        <FiClipboard size={25} />
      </Header>
      <div className="content">
        <div className="container">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                label="Sigla do Site"
                variant="outlined"
                value={sigla}
                onChange={handleSiglaChange}
                disabled={nome !== ""}
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
                disabled={sigla !== ""}
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
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={loading}
                style={{ backgroundColor: "#380054e8" }}
                fullWidth
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
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
          {loading && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
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
                <p>
                  <strong>
                    {item.sigla} - {item.nome}
                  </strong>{" "}
                  - {item.estado} - {item.cidade}
                </p>
              </div>
            ))}

          {!loading && (
            <Grid container spacing={2} justifyContent="right" style={{ marginTop: "10px" }}>
              <Grid item xs={12} md={2.3} textAlign="right">
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel id="results-per-page-label">Resultados por Página</InputLabel>
                  <Select
                    labelId="results-per-page-label"
                    id="results-per-page"
                    value={resultsPerPage}
                    onChange={handlePaginationChange}
                    label="Resultados por Página"
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1.5} textAlign="right">
                <Button
                  variant="outlined"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  style={{ borderColor: "#380054e8" }}
                  fullWidth
                >
                  Anterior
                </Button>
              </Grid>
              <Grid item xs={12} md={1.5} textAlign="right">
                <Button
                  variant="outlined"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(site.length / resultsPerPage) - 1}
                  style={{ borderColor: "#380054e8", color: "#380054e8" }}
                  fullWidth
                >
                  Próximo
                </Button>
              </Grid>
            </Grid>
          )}
        </div>
      </div>
    </div>
  );
}