import "./prenew.css";
import { useEffect, useState, useContext } from "react";
import * as geofire from "geofire-common";
import { FiClipboard } from "react-icons/fi";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import ModalLoading from "../../components/Modal_Loading";
import SiteDetailModal from "../../components/SiteDetailModal";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { format } from "date-fns";

export default function PreNew() {
  const [user, setUser] = useState(null);
  const history = useHistory();

  const [site, setSite] = useState([]);
  const [siteSelect, setSiteSelect] = useState([]);
  const [aplicador, setAplicador] = useState([]);
  const [selectedAplicador, setSelectedAplicador] = useState("0");

  //alterar informações do site
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newDetentora, setNewDetentora] = useState("");

  //Busca
  const [sigla, setSigla] = useState("");
  const [uf, setUf] = useState("Todos");

  // Paginação
  const [page, setPage] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  let query = firebase.firestore().collection("sites");

  async function getPerimetro() {
    let lat = siteSelect[0].latitude;
    let lng = siteSelect[0].longitude;
    const center = [parseFloat(lat), parseFloat(lng)];

    try {
      let latitude = parseFloat(lat.replace(",", "."));
      let longitude = parseFloat(lng.replace(",", "."));
      const distanceInKm = geofire.distanceBetween(
        [latitude, longitude],
        center
      );
      history.push("/new/" + siteSelect[0].id);
    } catch (err) {
      alert("Erro na localização do site, informe um Administrador.");
    }
  }

  useEffect(() => {
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
          console.log("DEU ALGUM ERRO!", error);
        });
    }

    loadUsers();
  }, []);

  function selectAplicador(e) {
    setSelectedAplicador(e.target.value);
  }

  // async function atribuir() {
  //   if (selectedAplicador !== "0") {
  //     let aplicadorEmailAndName = [];
  //     aplicador
  //       .filter((user) => user.uid === selectedAplicador)
  //       .map(
  //         (filtered) =>
  //           (aplicadorEmailAndName = {
  //             email: filtered.email,
  //             nome: filtered.nome,
  //           })
  //       );

  //     await firebase
  //       .firestore()
  //       .collection("atribuicoes")
  //       .add({
  //         solicitante: user.uid,
  //         atribuido_id: selectedAplicador,
  //         created: new Date(),
  //         link: "/new/" + siteSelect[0].id,
  //         status: "Solicitado",
  //       })
  //       .then(() => {
  //         toast.success("APR Atribuida");
  //       })
  //       .catch((err) => {
  //         console.log("ops deu um erro: " + err);
  //       });
  //   } else {
  //     toast.error("Você precisa selecionar um Aplicador e(ou) APR");
  //   }
  // }

  function togglePostModal() {
    setShowPostModal(!showPostModal); // Trocando de true pra false
  }

  async function handleSearch() {
    if (sigla === "") {
      return toast.error("Digite uma sigla de site ou endereço para buscar...");
    }

    query =
      sigla !== "" &&
      query
        .where("Sigla", ">=", sigla.toUpperCase())
        .where("Sigla", "<=", sigla.toUpperCase() + "\uf8ff");
    query =
      uf !== "Todos" ? query.where("Estado", "==", uf.toUpperCase()) : query;

    let filteredData = [];
    await query
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          let exist = filteredData.some(
            (item) => doc.data().nome === item.nome
          );
          if (exist === false) {
            filteredData.push({
              id: doc.id,
              nome: doc.data().Nome,
              cidade: doc.data().Cidade,
              cep: doc.data().CEP,
              complemento: doc.data().Complemento,
              estado: doc.data().Estado,
              endereco: doc.data().Endereco,
              numero: doc.data().Numero,
              latitude: doc.data().Latitude,
              longitude: doc.data().Longitude,
              tipoSite: doc.data().tipoSite,
              critical: doc.data().critical,
              geohash: doc.data().geohash,
              sigla: doc.data().Sigla,
              tipo_contrato: doc.data().tipoContrato,
              detentora: doc.data().Detentora,
              userLastUpdate: doc.data().userLastUpdate
                ? doc.data().userLastUpdate
                : "-",
              lastUpdate: doc.data().lastUpdate
                ? format(doc.data().lastUpdate.toDate(), "dd/MM/yyyy HH:mm")
                : "-",
            });
          }
        });
        setSite(filteredData);
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
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
        <div className="container">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                label="Sigla do Site"
                variant="outlined"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl
                variant="outlined"
                style={{ minWidth: "100%" }}
                size="small"
              >
                <InputLabel id="uf-select-label">UF</InputLabel>
                <Select
                  labelId="uf-select-label"
                  id="uf-select"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  label="UF"
                >
                  <MenuItem value="Todos">Todos</MenuItem>
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
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                style={{ backgroundColor: "#6e0dec" }}
              >
                Buscar
              </Button>
              <FormControl
                variant="outlined"
                size="small"
                style={{ width: "30%", marginLeft: "15px" }}
              >
                <InputLabel id="results-per-page-label">
                  Resultados por Página
                </InputLabel>
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
          </Grid>
          <div className="site-list">{/*  */}</div>
          {showPostModal && (
            <SiteDetailModal
              open={showPostModal}
              onClose={() => setShowPostModal(false)}
              site={selectedSite[0]}
              getPerimetro={getPerimetro}
            />
          )}
        </div>
        <div className="container content-apr">
          {paginatedSites.map((item) => (
            <div
              key={item.id}
              className="site-item-content"
              onClick={() => handleList([item])}
            >
              <p>
                <strong> {item.nome} :</strong> {item.sigla} | {item.estado} |{" "}
                {item.cidade}
              </p>
            </div>
          ))}
          <Grid
            container
            spacing={2}
            justifyContent="right"
            style={{ marginTop: "10px" }}
          >
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                style={{ borderColor: "#6e0dec" }}
              >
                Anterior
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(site.length / resultsPerPage) - 1}
                style={{ borderColor: "#6e0dec", color: "#6e0dec" }}
              >
                Próximo
              </Button>
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  );
}
