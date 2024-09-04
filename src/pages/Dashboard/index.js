import { useState, useContext } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { format } from "date-fns";
import { AuthContext } from "../../contexts/auth";
import Header from "../../components/Header";
import Title from "../../components/Title";
import firebase from "../../services/firebaseConnection";
import "./dashboard.css";
import { toast } from "react-toastify";
import TableDashboard from "./tableDashboard";
import {
  Switch,
  Grid,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

export default function Dashboard() {
  const base = "aprs-producao"; //aprs-producao
  const listRef = firebase.firestore().collection(base);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logSistem } = useContext(AuthContext);
  const [filterUF, setFilterUF] = useState("");
  const [filterSigla, setFilterSigla] = useState("");
  const [filterTipoSite, setFilterTipoSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNome, setFilterNome] = useState("");
  const [filterID, setFilterID] = useState("");

  async function loadChamados(props) {
    let regional = [];

    let query = listRef;
    query =
      props === true
        ? query.where("apr_id", ">", 0).orderBy("apr_id", "desc")
        : query.orderBy("created", "desc");

    if (user.regional === "NE")
      regional = ["PE", "CE", "PB", "RN", "AL", "PI", "BA", "SE"];
    if (user.regional === "CO_N")
      regional = [
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
      ];
    if (user.regional === "RJ_ES_MG") regional = ["RJ", "ES", "MG"];
    if (user.regional === "SP") regional = ["SP"];
    if (user.regional === "SUL") regional = ["RS", "PR", "SC"];

    query =
      user.nivel === "aplicador" && user.area !== "oem"
        ? query.where("user_id.uid", "==", user.uid)
        : query;
    query =
      user.nivel === "supervisor"
        ? query.where("site_id.Estado", "in", regional)
        : query;
    query =
      user.nivel === "revisor"
        ? query.where("site_id.Estado", "in", regional)
        : query;
    query =
      user.nivel === "auditor"
        ? query.where("site_id.tipoSite", "in", [
            "AUDIT PGR MOVEL",
            "AUDIT PGR FIXA",
          ])
        : query;
    query =
      user.area === "oem"
        ? query.where("status", "in", [
            "Enviado",
            "Respondido pela Area",
            "Revisado",
          ])
        : query;

    query =
      filterID !== "" ? query.where("apr_id", "==", parseInt(filterID)) : query;
    query =
      filterUF !== "" ? query.where("site_id.Estado", "==", filterUF) : query;
    query =
      filterSigla !== ""
        ? query.where("site_id.Sigla", "==", filterSigla)
        : query;
    query =
      filterTipoSite !== ""
        ? query.where("site_id.tipoSite", "==", filterTipoSite)
        : query;
    query =
      filterStatus !== "" ? query.where("status", "==", filterStatus) : query;
    query =
      filterNome !== "" ? query.where("user_id.nome", "==", filterNome) : query;

    let lista = [];

    setLoading(false);
    await query
      .get()
      .then((snapshot) => {
        new Promise((resolve, reject) => {
          snapshot.forEach(async (doc) => {
            let questoes = 0;
            let respondidas = 0;
            if (doc.data().status === "Respondido pela Area") {
              // teste de contagem
              doc.data().checklist.forEach((area, indexA) => {
                area[1].forEach((question, indexQ) => {
                  if (
                    question.openPA === true &&
                    question.respGabarito !== question.resp &&
                    question.resp !== ""
                  ) {
                    questoes = questoes + 1;
                    if (question.plano_acao.comentario) {
                      respondidas = respondidas + 1;
                    }
                  }
                });
              });
            }

            if (user.area === "oem" && doc.data().checklist !== undefined) {
              let paTrue = false;
              doc.data().checklist.forEach((area, indexA) => {
                area[1].forEach((question, indexQ) => {
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
                  site_id: doc.data().site_id,
                  status: doc.data().status,
                  motivo_apr: doc.data().motivo_apr,
                  created: format(
                    doc.data().created.toDate(),
                    "dd/MM/yyyy HH:mma"
                  ),
                  porcentagem_resp_area:
                    questoes !== 0
                      ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                      : "-",
                });
              }
            } else {
              lista.push({
                id: doc.id,
                apr_id: doc.data().apr_id,
                nome:
                  doc.data().user_id.nome !== undefined
                    ? doc.data().user_id.nome
                    : "",
                site_id: doc.data().site_id,
                status: doc.data().status,
                motivo_apr: doc.data().motivo_apr,
                created: format(
                  doc.data().created.toDate(),
                  "dd/MM/yyyy HH:mma"
                ),
                porcentagem_resp_area:
                  questoes !== 0
                    ? ((respondidas / questoes) * 100).toFixed(2) + "%"
                    : "-",
              });
            }
            setLoading(true);
            setChamados(lista);
            resolve();
          });
        });
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
        setLoading(true);
      });
    setLoading(true);
  }

  function elementHiddenAndShow() {
    let id = document.getElementById("id").style;
    let uf = document.getElementById("uf").style;
    let sigla = document.getElementById("sigla").style;
    let tipo = document.getElementById("tipo").style;
    let status = document.getElementById("status").style;
    let nome = document.getElementById("nome").style;

    id.display === "block" ? (id.display = "none") : (id.display = "block");
    uf.display === "block" ? (uf.display = "none") : (uf.display = "block");
    sigla.display === "block"
      ? (sigla.display = "none")
      : (sigla.display = "block");
    tipo.display === "block"
      ? (tipo.display = "none")
      : (tipo.display = "block");
    status.display === "block"
      ? (status.display = "none")
      : (status.display = "block");
    nome.display === "block"
      ? (nome.display = "none")
      : (nome.display = "block");
  }

  function contAprs(status) {
    var quantidadeElementos = chamados.filter(
      (x) => x.status === status
    ).length;
    return quantidadeElementos;
  }

  function updateStatus(id, index) {
    let confirm = window.confirm("Deseja realmente alterar o status da APR?");
    if (confirm === false) return;

    listRef
      .doc(id)
      .update({
        status: "Cancelado",
      })
      .then(() => {
        chamados[index].status = "Cancelado";
        loadChamados();
        logSistem(`APR foi alterado o status para Cancelado`, id);
        toast.success("Status da APR alterado com sucesso !");
      })
      .catch((err) => {
        toast.success("Erro ao atualizar o status da APR!");
        console.log(err);
      });
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
          <div className="filtrosAPRs">
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <TextField
                  id="id"
                  type="number"
                  label="ID APR"
                  value={filterID}
                  onChange={(e) =>
                    setFilterID(e.target.value.toUpperCase().slice(0, 6))
                  }
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="uf-label">UF</InputLabel>
                  <Select
                    id="uf"
                    labelId="uf-label"
                    label="UF"
                    value={filterUF}
                    onChange={(e) => setFilterUF(e.target.value.toUpperCase())}
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

              <Grid item xs={2}>
                <TextField
                  id="nome"
                  type="text"
                  label="Aplicador"
                  value={filterNome}
                  onChange={(e) => setFilterNome(e.target.value.toUpperCase())}
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={2}>
                <TextField
                  id="sigla"
                  type="text"
                  label="Sigla"
                  value={filterSigla}
                  onChange={(e) => setFilterSigla(e.target.value.toUpperCase())}
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={2}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="tipo-label">Tipo de Site</InputLabel>
                  <Select
                    id="tipo"
                    labelId="tipo-label"
                    label="Tipo de Site"
                    value={filterTipoSite}
                    onChange={(e) => setFilterTipoSite(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      Tipo de Site
                    </MenuItem>
                    <MenuItem value="ERB-CT">ERB-CT</MenuItem>
                    <MenuItem value="ERB">ERB</MenuItem>
                    <MenuItem value="CT">CT</MenuItem>
                    <MenuItem value="CD">CD</MenuItem>
                    <MenuItem value="PREDIO CORE">PREDIO CORE</MenuItem>
                    <MenuItem value="LOJA">LOJA</MenuItem>
                    <MenuItem value="LOJA DEALER">LOJA DEALER</MenuItem>
                    <MenuItem value="CROSS DOCKING">CROSS DOCKING</MenuItem>
                    <MenuItem value="OUTDOOR">OUTDOOR</MenuItem>
                    <MenuItem value="INDOOR">INDOOR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={2}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    id="status"
                    labelId="status-label"
                    label="Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      Status
                    </MenuItem>
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
                onClick={() => loadChamados(false)}
                disabled={!loading}
              >
                {loading === true ? "Listar Todas APRs" : "Carregando APRs..."}
              </Button>
              <Button
                size="small"
                color="secondary"
                variant="outlined"
                style={{ marginLeft: "10px" }}
                onClick={() => loadChamados(true)}
                disabled={!loading}
              >
                {loading === true ? "Listar Novas APRs" : "Carregando APRs..."}
              </Button>
            </ButtonGroup>
          </Grid>
        </div>

        <TableDashboard
          chamados={chamados}
          user={user}
          updateStatus={updateStatus}
        ></TableDashboard>
      </div>
    </div>
  );
}
