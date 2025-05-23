import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiFileText } from "react-icons/fi";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import { AuthContext } from "../../contexts/auth";
import "./report.scss";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

export default function Reports() {
  const { user } = useContext(AuthContext);

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState({ startDate: "", endDate: "" });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMotivo, setFilterMotivo] = useState("");
  const [filterTipoSite, setFilterTipoSite] = useState("");
  const [includeQuestions, setIncludeQuestions] = useState(false);

  useEffect(() => {
    addBodyClass('page-reports');
  }, []);

  async function loadChamados() {
    setLoading(true);
    try {
      let query = firebase.firestore().collection("aprs-producao");

      // Filtro por Data
      if (filterDate.startDate && filterDate.endDate) {
        console.log('data filter')
        const start = new Date(filterDate.startDate);
        const end = new Date(filterDate.endDate);
        end.setDate(end.getDate() + 1); // Inclui o dia final
        query = query.where("created", ">=", start).where("created", "<", end);
      }

      // Filtro por Status
      if (filterStatus) {
        console.log('data status')
        query = query.where("status", "==", filterStatus);
      }

      // Filtro por Motivo
      if (filterMotivo && filterMotivo !== "Todos") {
        console.log('motivo filter')
        query = query.where("motivo_apr", "==", filterMotivo);
      }

      // Filtro por Tipo de Site
      if (filterTipoSite && filterTipoSite !== "todos") {
        console.log('tipo site filter')
        query = query.where("site_id.tipoSite", "==", filterTipoSite);
      }

      query = user.nivel === 'auditor' ? query.where('site_id.tipoSite', 'in', ['AUDIT PGR FIXA', 'AUDIT PGR MOVEL']) : query

      const snapshot = await query.get();
      const list = [];

      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      setChamados(list);
    } catch (err) {
      console.error("Deu algum erro: ", err);
    }
    setLoading(false);
  }

  function downloadExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "aprs");

    const options = {
      compression: "DEFLATE", // Configura o nível de compressão
      bookSST: false,
      type: "blob",
    };

    XLSX.writeFile(workbook, "apr-digital.xlsx", options);
  }

  // Função para calcular a classificação de risco
  function calculatePontos(peso) {
    if (peso <= 10) {
      return `Risco Muito Baixo`
    } else if (peso >= 11 && peso <= 30) {
      return `Risco Baixo`
    } else if (peso >= 31 && peso <= 50) {
      return `Risco Médio`
    } else if (peso >= 51 && peso <= 70) {
      return `Risco Alto`
    } else if (peso >= 71) {
      return `Risco Muito Alto`
    }
  }

  // Função para processar o APRworksheet
  async function v0(apr) {
    if (!apr.peso) return "-";

    try {
      // Fetch the site document based on apr.site_id
      const querySnapshot = await firebase.firestore().collection('sites')
        .where("Sigla", "==", apr.site_id.Sigla)
        .where("Estado", "==", apr.site_id.Estado)
        .get();

      if (querySnapshot.empty) {
        console.log("Nenhum documento encontrado.");
        return;
      }

      const site = querySnapshot.docs[0].data();
      const classif = calculatePontos(apr.peso);

      // Verifying site values
      if (site.CtCritica !== '-' || site.NonStop !== '-' || site.ErbCritica !== '-') return "v0 - Rota Critica";

      // Determine the return value based on classification and site criticality
      switch (classif) {
        case "Risco Muito Baixo":
          return site.critical === "Baixo" ? "v4 - Classificação"
            : site.critical === "Médio" ? "v4 - Classificação"
              : "v3 - Classificação";
        case "Risco Baixo":
          return site.critical === "Baixo" ? "v4 - Classificação"
            : site.critical === "Médio" ? "v3 - Classificação"
              : "v3 - Classificação";
        case "Risco Médio":
          return site.critical === "Baixo" ? "v3 - Classificação"
            : site.critical === "Médio" ? "v3 - Classificação"
              : "v2 - Classificação";
        case "Risco Alto":
          return site.critical === "Baixo" ? "v3 - Classificação"
            : site.critical === "Médio" ? "v2 - Classificação"
              : "v1 - Classificação";
        case "Risco Muito Alto":
          return site.critical === "Baixo" ? "v2 - Classificação"
            : site.critical === "Médio" ? "v1 - Classificação"
              : "v0 - Classificação";
        default:
          return "-";
      }
    } catch (error) {
      console.error("Erro ao consultar o Firestore:", error);
      return "-";
    }
  }

  // async function updateState(snapshot) {
  //   setLoading(true)
  //   const relatorioApr = [];
  //   const promises = snapshot.map(doc => {
  //     // Verifica se o documento tem a propriedade
  //     if (doc.created !== undefined) {
  //       return v0(doc).then(result => {
  //         if (includeQuestions) {
  //           if (doc.checklist && doc.status !== "Com Exceção") {
  //             doc.checklist.forEach((blocoQuestion) => {
  //               blocoQuestion[1].forEach((question) => {
  //                 if ((question.resp === "" && question.optionListResp !== "") || (question.resp !== "")) {
  //                   console.log(question.areaResposavel, doc.id)
  //                   relatorioApr.push({
  //                     ID: doc.id,
  //                     DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
  //                     STATUS: doc.status,
  //                     MOTIVO: doc.motivo_apr,
  //                     CLASSIFICACAO: calculatePontos(doc.peso),
  //                     PESO: doc.peso,
  //                     QUESTIONS: question.question,
  //                     QUESTIONS_RESP: question.resp,
  //                     QUESTIONS_CHECKS: question.optionListResp.toString(),
  //                     QUESTIONS_AREA_RESPONSAVEL: question.areaResposavel ? question.areaResposavel.toString() : "",
  //                     QUESTIONS_RESPTEXTAREA: question.respTextArea,
  //                     QUESTIONS_RESPGABARITO: question.respGabarito,
  //                     QUESTIONS_PA: question.openPA,
  //                     QUESTION_PA_DATA: question.resp_pa_data
  //                       ? format(
  //                         question.resp_pa_data.toDate(),
  //                         "dd/MM/yyyy HH:mm:ss"
  //                       )
  //                       : "",
  //                     QUESTION_PA_RESP: question.resp_pa_selectedOption || "",
  //                     QUESTION_PA_NOME: question.resp_pa_user_name || "",
  //                     SIGLA: doc.site_id.Sigla,
  //                     SIGLA_GVT: doc.site_id.Sigla_GVT,
  //                     TIPO_CHECKLIST: doc.site_id.tipoSite,
  //                     NOME_SITE: doc.site_id.Nome,
  //                     LAT_SITE: doc.site_id.Latitude,
  //                     LNG_SITE: doc.site_id.Longitude,
  //                     UF_SITE: doc.site_id.Estado,
  //                     END_SITE: doc.site_id.Endereco,
  //                     MUNICIPIO_SITE: doc.site_id.Cidade,
  //                     BAIRRO_SITE: doc.site_id.Bairro,
  //                     CEP_SITE: doc.site_id.CEP,
  //                     CRITICIDADE_SITE: doc.site_id.critical,
  //                     ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
  //                     ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
  //                     ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
  //                     TEMP_INCIO: doc.tempoConclusao ? format(
  //                       doc.tempoConclusao.inicio.toDate(),
  //                       "dd/MM/yyyy HH:mm:ss"
  //                     ) : "-",
  //                     TEMP_TERMINO: doc.tempoConclusao ? format(
  //                       doc.tempoConclusao.conclusao.toDate(),
  //                       "dd/MM/yyyy HH:mm:ss"
  //                     ) : '-',
  //                     TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
  //                       (doc.tempoConclusao.conclusao.toDate() -
  //                         doc.tempoConclusao.inicio.toDate()) /
  //                       (1000 * 60)
  //                     ) : '-',
  //                     USER_ID: doc.user_id.uid,
  //                     USER_NOME: doc.user_id.nome,
  //                     USER_UF: doc.user_id.uf,
  //                     V0: result,
  //                   });
  //                 }
  //               });
  //             });
  //           } else if (doc.status === "Com Exceção") {
  //             relatorioApr.push({
  //               ID: doc.id,
  //               DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
  //               STATUS: doc.status,
  //               SIGLA: doc.site_id.Sigla,
  //               SIGLA_GVT: doc.site_id.Sigla_GVT,
  //               TIPO_CHECKLIST: doc.site_id.tipoSite,
  //               NOME_SITE: doc.site_id.Nome,
  //               LAT_SITE: doc.site_id.Latitude,
  //               LNG_SITE: doc.site_id.Longitude,
  //               UF_SITE: doc.site_id.Estado,
  //               END_SITE: doc.site_id.Endereco,
  //               MUNICIPIO_SITE: doc.site_id.Cidade,
  //               BAIRRO_SITE: doc.site_id.Bairro,
  //               CEP_SITE: doc.site_id.CEP,
  //               CRITICIDADE_SITE: doc.site_id.critical,
  //               ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
  //               ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
  //               ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
  //               TEMP_INCIO: doc.tempoConclusao ? format(
  //                 doc.tempoConclusao.inicio.toDate(),
  //                 "dd/MM/yyyy HH:mm:ss"
  //               ) : "-",
  //               TEMP_TERMINO: doc.tempoConclusao ? format(
  //                 doc.tempoConclusao.conclusao.toDate(),
  //                 "dd/MM/yyyy HH:mm:ss"
  //               ) : '-',
  //               TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
  //                 (doc.tempoConclusao.conclusao.toDate() -
  //                   doc.tempoConclusao.inicio.toDate()) /
  //                 (1000 * 60)
  //               ) : '-',
  //               USER_ID: doc.user_id.uid,
  //               USER_NOME: doc.user_id.nome,
  //               USER_UF: doc.user_id.uf,
  //               V0: "-",
  //             });
  //           }
  //         } else {
  //           relatorioApr.push({
  //             ID: doc.id,
  //             DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
  //             STATUS: doc.status,
  //             MOTIVO: doc.motivo_apr,
  //             CLASSIFICACAO: calculatePontos(doc.peso),
  //             PESO: doc.peso,
  //             SIGLA: doc.site_id.Sigla,
  //             SIGLA_GVT: doc.site_id.Sigla_GVT,
  //             TIPO_CHECKLIST: doc.site_id.tipoSite,
  //             NOME_SITE: doc.site_id.Nome,
  //             LAT_SITE: doc.site_id.Latitude,
  //             LNG_SITE: doc.site_id.Longitude,
  //             UF_SITE: doc.site_id.Estado,
  //             END_SITE: doc.site_id.Endereco,
  //             MUNICIPIO_SITE: doc.site_id.Cidade,
  //             BAIRRO_SITE: doc.site_id.Bairro,
  //             CEP_SITE: doc.site_id.CEP,
  //             CRITICIDADE_SITE: doc.site_id.critical,
  //             ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
  //             ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
  //             ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
  //             TEMP_INCIO: doc.tempoConclusao ? format(
  //               doc.tempoConclusao.inicio.toDate(),
  //               "dd/MM/yyyy HH:mm:ss"
  //             ) : "-",
  //             TEMP_TERMINO: doc.tempoConclusao ? format(
  //               doc.tempoConclusao.conclusao.toDate(),
  //               "dd/MM/yyyy HH:mm:ss"
  //             ) : '-',
  //             TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
  //               (doc.tempoConclusao.conclusao.toDate() -
  //                 doc.tempoConclusao.inicio.toDate()) /
  //               (1000 * 60)
  //             ) : '-',
  //             USER_ID: doc.user_id.uid,
  //             USER_NOME: doc.user_id.nome,
  //             USER_UF: doc.user_id.uf,
  //             V0: result,
  //           });
  //         }
  //       });
  //     } else {
  //       return Promise.resolve(); // Retorna uma promise resolvida para documentos sem 'created'
  //     }
  //   });

  //   // Aguarda a resolução de todas as Promises
  //   Promise.all(promises).then(() => {
  //     console.log(relatorioApr);
  //     downloadExcel(relatorioApr);
  //     setLoading(false)
  //   }).catch(error => {
  //     console.error("Erro ao processar documentos:", error);
  //     setLoading(false)
  //   });
  // }

  async function updateState(snapshot) {
    setLoading(true)
    const relatorioApr = [];
    const promises = snapshot.map(doc => {
      if (doc.created !== undefined) {
        return v0(doc).then(result => {
          if (includeQuestions) {
            if (doc.checklist && doc.status !== "Com Exceção") {
              doc.checklist.forEach((blocoQuestion) => {
                blocoQuestion[1].forEach((question) => {
                  if ((question.resp === "" && question.optionListResp !== "") || (question.resp !== "")) {
                    relatorioApr.push({
                      ID: doc.id,
                      DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
                      STATUS: doc.status,
                      TIPO_LOJA: doc.tipo_loja ? doc.tipo_loja : '-',
                      VALOR_ESTOQUE: doc.valor_estoque ? doc.valor_estoque : '-',
                      MOTIVO: doc.motivo_apr,
                      CLASSIFICACAO: calculatePontos(doc.peso),
                      PESO: doc.peso,
                      QUESTIONS: question.question,
                      QUESTIONS_RESP: question.resp,
                      QUESTIONS_CHECKS: question.optionListResp ? question.optionListResp.toString() : "",
                      QUESTIONS_AREA_RESPONSAVEL: question.areaResposavel ? question.areaResposavel.toString() : "",
                      QUESTIONS_RESPTEXTAREA: question.respTextArea,
                      QUESTIONS_RESPGABARITO: question.respGabarito,
                      QUESTIONS_PA: question.openPA,
                      QUESTION_PA_DATA: question.resp_pa_data
                        ? format(
                          question.resp_pa_data.toDate(),
                          "dd/MM/yyyy HH:mm:ss"
                        )
                        : "",
                      QUESTION_PA_RESP: question.resp_pa_selectedOption || "",
                      QUESTION_PA_NOME: question.resp_pa_user_name || "",
                      SIGLA: doc.site_id.Sigla,
                      SIGLA_GVT: doc.site_id.Sigla_GVT,
                      TIPO_CHECKLIST: doc.site_id.tipoSite,
                      NOME_SITE: doc.site_id.Nome,
                      LAT_SITE: doc.site_id.Latitude,
                      LNG_SITE: doc.site_id.Longitude,
                      UF_SITE: doc.site_id.Estado,
                      END_SITE: doc.site_id.Endereco,
                      MUNICIPIO_SITE: doc.site_id.Cidade,
                      BAIRRO_SITE: doc.site_id.Bairro,
                      CEP_SITE: doc.site_id.CEP,
                      CRITICIDADE_SITE: doc.site_id.critical,
                      ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
                      ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
                      ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
                      TEMP_INCIO: doc.tempoConclusao ? format(
                        doc.tempoConclusao.inicio.toDate(),
                        "dd/MM/yyyy HH:mm:ss"
                      ) : "-",
                      TEMP_TERMINO: doc.tempoConclusao ? format(
                        doc.tempoConclusao.conclusao.toDate(),
                        "dd/MM/yyyy HH:mm:ss"
                      ) : '-',
                      TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
                        (doc.tempoConclusao.conclusao.toDate() -
                          doc.tempoConclusao.inicio.toDate()) /
                        (1000 * 60)
                      ) : '-',
                      USER_ID: doc.user_id.uid,
                      USER_NOME: doc.user_id.nome,
                      USER_UF: doc.user_id.uf,
                      V0: result,
                    });
                  }
                });
              });
            } else if (doc.status === "Com Exceção") {
              relatorioApr.push({
                ID: doc.id,
                DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
                STATUS: doc.status,
                SIGLA: doc.site_id.Sigla,
                SIGLA_GVT: doc.site_id.Sigla_GVT,
                TIPO_CHECKLIST: doc.site_id.tipoSite,
                NOME_SITE: doc.site_id.Nome,
                LAT_SITE: doc.site_id.Latitude,
                LNG_SITE: doc.site_id.Longitude,
                UF_SITE: doc.site_id.Estado,
                END_SITE: doc.site_id.Endereco,
                MUNICIPIO_SITE: doc.site_id.Cidade,
                BAIRRO_SITE: doc.site_id.Bairro,
                CEP_SITE: doc.site_id.CEP,
                CRITICIDADE_SITE: doc.site_id.critical,
                ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
                ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
                ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
                TEMP_INCIO: doc.tempoConclusao ? format(
                  doc.tempoConclusao.inicio.toDate(),
                  "dd/MM/yyyy HH:mm:ss"
                ) : "-",
                TEMP_TERMINO: doc.tempoConclusao ? format(
                  doc.tempoConclusao.conclusao.toDate(),
                  "dd/MM/yyyy HH:mm:ss"
                ) : '-',
                TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
                  (doc.tempoConclusao.conclusao.toDate() -
                    doc.tempoConclusao.inicio.toDate()) /
                  (1000 * 60)
                ) : '-',
                USER_ID: doc.user_id.uid,
                USER_NOME: doc.user_id.nome,
                USER_UF: doc.user_id.uf,
                V0: "-",
              });
            }
          } else {
            relatorioApr.push({
              ID: doc.id,
              DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
              STATUS: doc.status,
              TIPO_LOJA: doc.tipo_loja ? doc.tipo_loja : '-',
              VALOR_ESTOQUE: doc.valor_estoque ? doc.valor_estoque : '-',
              MOTIVO: doc.motivo_apr,
              CLASSIFICACAO: calculatePontos(doc.peso),
              PESO: doc.peso,
              SIGLA: doc.site_id.Sigla,
              SIGLA_GVT: doc.site_id.Sigla_GVT,
              TIPO_CHECKLIST: doc.site_id.tipoSite,
              NOME_SITE: doc.site_id.Nome,
              LAT_SITE: doc.site_id.Latitude,
              LNG_SITE: doc.site_id.Longitude,
              UF_SITE: doc.site_id.Estado,
              END_SITE: doc.site_id.Endereco,
              MUNICIPIO_SITE: doc.site_id.Cidade,
              BAIRRO_SITE: doc.site_id.Bairro,
              CEP_SITE: doc.site_id.CEP,
              CRITICIDADE_SITE: doc.site_id.critical,
              ABERTURA_LAT: doc.locationCreated ? doc.locationCreated.latitude : '-',
              ABERTURA_LNG: doc.locationCreated ? doc.locationCreated.logitude : '-',
              ABERTURA_PERIMETRO: doc.locationCreated ? doc.locationCreated.perimetro : '-',
              TEMP_INCIO: doc.tempoConclusao ? format(
                doc.tempoConclusao.inicio.toDate(),
                "dd/MM/yyyy HH:mm:ss"
              ) : "-",
              TEMP_TERMINO: doc.tempoConclusao ? format(
                doc.tempoConclusao.conclusao.toDate(),
                "dd/MM/yyyy HH:mm:ss"
              ) : '-',
              TEMP_EFETUADO: doc.tempoConclusao ? Math.ceil(
                (doc.tempoConclusao.conclusao.toDate() -
                  doc.tempoConclusao.inicio.toDate()) /
                (1000 * 60)
              ) : '-',
              USER_ID: doc.user_id.uid,
              USER_NOME: doc.user_id.nome,
              USER_UF: doc.user_id.uf,
              V0: result,
            });
          }
        });
      } else {
        return Promise.resolve();
      }
    });

    Promise.all(promises).then(() => {
      console.log(relatorioApr);
      downloadExcel(relatorioApr);
      setLoading(false)
    }).catch(error => {
      console.error("Erro ao processar documentos:", error);
      setLoading(false)
    });
  }

  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Relatórios">
          <FiFileText size={25} onClick={() => console.log(chamados)} />
        </Title>
        <div className="filter-reports-container">
          <div className="filter-reports">
            <Grid container spacing={2}>
              <Grid item xs={2} sx={12}>
                <TextField
                  id="startDate"
                  type="date"
                  label=""
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={filterDate.startDate}
                  onChange={(e) =>
                    setFilterDate({ ...filterDate, startDate: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={2} sx={12}>
                <TextField
                  id="endDate"
                  type="date"
                  label=""
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={filterDate.endDate}
                  onChange={(e) =>
                    setFilterDate({ ...filterDate, endDate: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={2} sx={12}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="status-label" size="small">Status</InputLabel>
                  <Select
                    id="status"
                    labelId="status-label"
                    label="Status"
                    size="small"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Cancelado">Cancelado</MenuItem>
                    <MenuItem value="Com Exceção">Com Exceção</MenuItem>
                    <MenuItem value="Em Aberto">Em Aberto</MenuItem>
                    <MenuItem value="Enviado">Enviado</MenuItem>
                    <MenuItem value="Respondido">Respondido pela Área</MenuItem>
                    <MenuItem value="Revisado">Revisado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={1}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="motivo-label" size="small">Motivo</InputLabel>
                  <Select
                    id="apr-motivo"
                    labelId="motivo-label"
                    label="Motivo"
                    size="small"
                    value={filterMotivo}
                    onChange={(e) => setFilterMotivo(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
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
              <Grid item xs={1}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="tipo-de-site-label" size="small">Tipo de Site</InputLabel>
                  <Select
                    id="tipo-de-site"
                    labelId="tipo-de-site-label"
                    label="Tipo de Site"
                    size="small"
                    value={filterTipoSite}
                    onChange={(e) => setFilterTipoSite(e.target.value)}
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
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeQuestions}
                      onChange={(e) => setIncludeQuestions(e.target.checked)}
                    />
                  }
                  label="Incluir Perguntas"
                />
              </Grid>
              <Grid item xs={2}>
                <FormControl>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={loadChamados}
                    disabled={loading}
                    style={{ borderColor: "#380054e8", color: "#380054e8" }}
                  >
                    {loading ? "Carregando..." : "Filtrar"}
                  </Button>
                </FormControl>
              </Grid>
            </Grid>
          </div>
        </div>

        <div className={"container reports"}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => updateState(chamados)}
            disabled={loading || chamados.length === 0}
          >
            {loading ? "Carregando..." : "Download"}
          </Button>
        </div>
        <div className="container reports">
          <i>APR´s carregadas: {chamados.length}</i>
        </div>
      </div>
    </div>
  );
}
