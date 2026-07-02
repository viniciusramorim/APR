import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useState, useEffect, useContext } from "react";
import { FiMapPin } from "react-icons/fi";
import { toast } from "react-toastify";
import * as geofire from "geofire-common";
import * as XLSX from "xlsx";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import "./new_site.scss";

import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import { format } from "date-fns";
import ModalInfoSite from "../../components/Modal_InfoSite";
import { AuthContext } from "../../contexts/auth";

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";

  if (typeof timestamp.toDate === "function") {
    return format(timestamp.toDate(), "dd/MM/yyyy HH:mm");
  }

  return "-";
}

export default function New_Site() {
  const { user, logSistem } = useContext(AuthContext);

  const [file, setFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(
    "Nenhum arquivo selecionado"
  );
  const [sitesAprovacao, setSitesAprovacao] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const canManageSpreadsheet = [
    "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
    "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
  ].includes(user.uid);

  const canReviewSites = [
    "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
    "WN0EtV44xnV0V87n5wBBXT87QXI2",
    "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
    "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
  ].includes(user.uid);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    loadSitesAprovacao();
    addBodyClass("page-new-site");
  }, []);

  async function loadSitesAprovacao() {
    await firebase
      .firestore()
      .collection("sites-aprovacao")
      .get()
      .then((result) => {
        const sites = [];

        result.forEach((doc) => {
          sites.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setSitesAprovacao(sites);
      })
      .catch((error) => console.log(error));
  }

  function parseCoordinate(value) {
    const normalizedValue =
      typeof value === "string" ? value.replace(",", ".") : value;
    const parsedValue = parseFloat(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function buildGeohash(latitudeValue, longitudeValue) {
    const latitude = parseCoordinate(latitudeValue);
    const longitude = parseCoordinate(longitudeValue);

    if (latitude === null || longitude === null) {
      return "";
    }

    return geofire.geohashForLocation([latitude, longitude]);
  }

  function ensureFileSelected() {
    if (!file) {
      toast.error("Selecione um arquivo XLSX antes de continuar.");
      return false;
    }

    return true;
  }

  async function submitAllXlsx() {
    if (!ensureFileSelected()) return;

    try {
      const fileRows = await onLoadXLSX();

      for (const [index, item] of fileRows.entries()) {
        if (index < 1) continue;

        const latitude = parseCoordinate(item[10]);
        const longitude = parseCoordinate(item[11]);

        const doc = {
          Estado: item[0] === undefined ? "" : item[0],
          Nome: item[1] === undefined ? "" : item[1].toString(),
          Sigla: item[2] === undefined ? "" : item[2],
          Sigla_GVT: item[3] === undefined ? "" : item[3],
          Situacao: item[4] === undefined ? "" : item[4],
          Cidade: item[5] === undefined ? "" : item[5],
          Bairro: item[6] === undefined ? "" : item[6],
          Endereco: item[7] === undefined ? "" : item[7],
          Complemento: item[8] === undefined ? "" : item[8],
          CEP: item[9] === undefined ? "" : item[9],
          Latitude: latitude === null ? "" : String(item[10]),
          Longitude: longitude === null ? "" : String(item[11]),
          tipoContrato: item[12] === undefined ? "" : item[12],
          critical: item[13] === undefined ? "" : item[13],
          geohash: buildGeohash(item[10], item[11]),
          tipoSite: item[14] === undefined ? "" : item[14],
          Detentora: item[15] === undefined ? "" : item[15],
          lastUpdate: new Date(),
          userLastUpdate: user.nome,
        };

        await firebase.firestore().collection("sites").add(doc);
        logSistem("CADASTRADO-SITES-XLSX", item[0]);
      }

      toast.success("Importacao concluida com sucesso.");
    } catch (err) {
      console.log("Erro ao carregar dados.", err);
      toast.error("Nao foi possivel processar o arquivo.");
    }
  }

  async function removeAllXlsx() {
    if (!ensureFileSelected()) return;

    try {
      const fileRows = await onLoadXLSX();

      for (const [index, item] of fileRows.entries()) {
        if (index < 1) continue;

        await firebase.firestore().collection("sites").doc(item[0]).delete();
        logSistem("REMOVIDO-SITES-XLSX", item[0]);
      }

      toast.success("Remocao concluida com sucesso.");
    } catch (err) {
      console.log("Erro ao remover dados.", err);
      toast.error("Nao foi possivel remover os sites do arquivo.");
    }
  }

  async function updateAllXlsx() {
    if (!ensureFileSelected()) return;

    try {
      const fileRows = await onLoadXLSX();

      for (const [index, item] of fileRows.entries()) {
        if (index < 1) continue;

        const doc = {
          CEP: item[1],
          Cidade: item[2],
          Complemento: item[3],
          Endereco: item[4],
          Estado: item[5],
          Latitude: item[6] ? item[6].toString() : "",
          Longitude: item[7] ? item[7].toString() : "",
          Sigla: item[9],
          Sigla_GVT: item[10],
          Situacao: item[11],
          Nome: item[8] ? item[8].toString() : "",
          tipoSite: item[12],
          critical: item[13],
          geohash: buildGeohash(item[6], item[7]),
          tipoContrato: item[15],
          Detentora: item[16],
          NonStop: item[17],
          CtCritica: item[18],
          ErbCritica: item[19],
          MapaCalor: item[20],
          lastUpdate: new Date(),
          userLastUpdate: user.nome,
        };

        await firebase.firestore().collection("sites").doc(item[0]).update(doc);
        logSistem("UPDATE-SITES-XLSX", item[0]);
      }

      toast.success("Atualizacao concluida com sucesso.");
    } catch (err) {
      console.log("Erro ao atualizar dados.", err);
      toast.error("Nao foi possivel atualizar os sites do arquivo.");
    }
  }

  function handleFileSelect(evt) {
    const selectedFile = evt.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setSelectedFileName("Nenhum arquivo selecionado");
      return;
    }

    if (
      selectedFile.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      toast.error("Selecione apenas arquivos XLSX");
      evt.target.value = "";
      setFile(null);
      setSelectedFileName("Nenhum arquivo selecionado");
      return;
    }

    setFile(selectedFile);
    setSelectedFileName(selectedFile.name);
  }

  function onLoadXLSX() {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("Nenhum arquivo selecionado"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.Sheets.sites ? "sites" : workbook.SheetNames[0];

          if (!sheetName) {
            reject(new Error("Planilha vazia"));
            return;
          }

          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
          });

          resolve(sheetData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
      reader.readAsArrayBuffer(file);
    });
  }

  async function downloadExcel() {
    await firebase
      .firestore()
      .collection("sites")
      .get()
      .then((snapshot) => {
        updateState(snapshot);
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }

  async function downloadModelo() {
    const relatorioApr = [];

    relatorioApr.push({
      UF: "",
      NOME: "",
      SIGLA: "",
      SIGLA_GVT: "",
      SITUACAO: "",
      MUNICIPIO: "",
      BAIRRO: "",
      ENDERECO: "",
      COMPLEMENTO: "",
      CEP: "",
      LATITUDE: "-0,00000",
      LONGITUDE: "-0,00000",
      TIPO_CONTRATO: "",
      CRITICIDADE: "",
      TIPO_SITE: "",
      DETENTORA: "",
    });

    exportExcel(relatorioApr);
  }

  async function updateState(snapshot) {
    const relatorioApr = [];

    snapshot.forEach((doc) => {
      relatorioApr.push({
        id: doc.id,
        CEP: doc.data().CEP,
        Cidade: doc.data().Cidade,
        Complemento: doc.data().Complemento,
        Endereco: doc.data().Endereco,
        UF: doc.data().Estado,
        Latitude: doc.data().Latitude,
        Longitude: doc.data().Longitude,
        Nome: doc.data().Nome,
        Sigla_Site: doc.data().Sigla,
        Sigla_GVT: doc.data().Sigla_GVT,
        Situacao: doc.data().Situacao,
        Tipo_de_Site: doc.data().tipoSite,
        Criticidade: doc.data().critical,
        Geohash: doc.data().geohash,
        Tipo_Contrato: doc.data().tipoContrato,
        Detentora: doc.data().Detentora,
        NonStop: doc.data().NonStop,
        CtCritica: doc.data().CtCritica,
        ErbCritica: doc.data().ErbCritica,
        MapaCalor: doc.data().MapaCalor,
      });
    });

    exportExcel(relatorioApr);
  }

  function exportExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "sites");
    XLSX.writeFile(workbook, "sites.xlsx");
  }

  return (
    <div>
      <Header name="Aprovacao de Novos Sites">
        <FiMapPin size={25} onClick={() => console.log(sitesAprovacao)} />
      </Header>

      <div className="content">
        {canManageSpreadsheet && (
          <div className="container inputfile new-site-upload-panel">
            <Box className="new-site-upload-header">
              <Box>
                <Typography variant="h6" className="new-site-upload-title">
                  Importacao de Sites
                </Typography>
                <Typography variant="body2" className="new-site-upload-subtitle">
                  Selecione uma planilha XLSX e escolha a acao desejada.
                </Typography>
              </Box>

              <Chip
                label={selectedFileName}
                className="new-site-upload-chip"
                variant="outlined"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <label id="arquive" className="new-site-file-trigger">
              <span>Selecionar arquivo</span>
              <input
                id="inputXLSX"
                type="file"
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
              />
            </label>

            <Stack className="new-site-actions" direction="row" spacing={1.5}>
              <Button
                variant="contained"
                color="secondary"
                onClick={submitAllXlsx}
                disabled={!file}
              >
                Enviar
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={removeAllXlsx}
                disabled={!file}
              >
                Remover
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={updateAllXlsx}
                disabled={!file}
              >
                Atualizar
              </Button>
              <Button variant="text" color="secondary" onClick={downloadModelo}>
                Baixar modelo
              </Button>
              <Button variant="text" color="secondary" onClick={downloadExcel}>
                Baixar todos os sites
              </Button>
            </Stack>
          </div>
        )}

        {canReviewSites && (
          <div className="container new-site-approval-panel">
            <Box
              className="new-site-tabs-shell"
              sx={{
                borderBottom: 1,
                borderColor: "rgba(0, 0, 0, 0.12)",
                mb: 3,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="site approval tabs"
                sx={{
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#000",
                    height: 3,
                  },
                  "& .MuiTab-root": {
                    color: "rgba(0, 0, 0, 0.6)",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                  },
                  "& .Mui-selected": {
                    color: "#000 !important",
                  },
                }}
              >
                <Tab label="Solicitacoes Pendentes" />
                <Tab label="Historico" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <TableContainer component={Paper} className="new-site-table-wrap" sx={{ width: "100%" }}>
                <Table size="small" aria-label="pending table">
                  <TableHead className="new-site-table">
                    <TableRow>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Sigla
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        UF
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Municipio
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Lat
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Lng
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Data Solicitacao
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Acoes
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sitesAprovacao
                      .filter((row) => !row.status || row.status === "PENDENTE")
                      .map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell align="center">{row.Sigla}</TableCell>
                          <TableCell align="center">{row.Estado}</TableCell>
                          <TableCell align="center">{row.Cidade}</TableCell>
                          <TableCell align="center">{row.Latitude}</TableCell>
                          <TableCell align="center">{row.Longitude}</TableCell>
                          <TableCell align="center">
                            {formatTimestamp(row.created)}
                          </TableCell>
                          <TableCell align="center">
                            <ModalInfoSite
                              site={row}
                              loadSites={loadSitesAprovacao}
                              logSistem={logSistem}
                              user={user}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <TableContainer component={Paper} className="new-site-table-wrap" sx={{ width: "100%" }}>
                <Table size="small" aria-label="history table">
                  <TableHead className="new-site-table">
                    <TableRow>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Sigla
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        UF
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Municipio
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Resolvido por
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Data Resolucao
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Detalhes
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sitesAprovacao
                      .filter(
                        (row) => row.status === "APROVADO" || row.status === "REPROVADO"
                      )
                      .sort((a, b) => {
                        const dateA = a.data_aprovacao || a.data_reprovacao || a.created;
                        const dateB = b.data_aprovacao || b.data_reprovacao || b.created;

                        return dateB.toDate() - dateA.toDate();
                      })
                      .map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell align="center">{row.Sigla}</TableCell>
                          <TableCell align="center">{row.Estado}</TableCell>
                          <TableCell align="center">{row.Cidade}</TableCell>
                          <TableCell align="center">
                            <span
                              style={{
                                color: row.status === "APROVADO" ? "#4caf50" : "#f44336",
                                fontWeight: "bold",
                              }}
                            >
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            {row.aprovado_por || row.reprovado_por || "-"}
                          </TableCell>
                          <TableCell align="center">
                            {formatTimestamp(row.data_aprovacao || row.data_reprovacao)}
                          </TableCell>
                          <TableCell align="center">
                            <ModalInfoSite
                              site={row}
                              loadSites={loadSitesAprovacao}
                              logSistem={logSistem}
                              user={user}
                              readOnly={true}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
