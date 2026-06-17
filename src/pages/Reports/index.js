import { useState, useEffect, useContext } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import { AuthContext } from "../../contexts/auth";
import "./report.scss";
import {
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Typography,
  Box,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

export default function Reports() {
  const { user } = useContext(AuthContext);

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState({ startDate: "", endDate: "" });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMotivo, setFilterMotivo] = useState("");
  const [filterTipoSite, setFilterTipoSite] = useState("");
  const [filterAprIds, setFilterAprIds] = useState("");
  const [includeQuestions, setIncludeQuestions] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sitesCache, setSitesCache] = useState(new Map());

  useEffect(() => {
    addBodyClass('page-reports');
  }, []);

  const hasDateFilter = filterDate.startDate || filterDate.endDate;
  const hasSpecificIds = filterAprIds.trim() !== "";

  function parseAprIds(rawValue) {
    const tokens = rawValue
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueTokens = Array.from(new Set(tokens));
    const numericAprIds = [];
    const documentIds = [];

    uniqueTokens.forEach((token) => {
      if (/^\d+$/.test(token)) {
        numericAprIds.push(Number(token));
        return;
      }

      documentIds.push(token);
    });

    return {
      numericAprIds,
      documentIds,
      total: uniqueTokens.length,
    };
  }

  function chunkArray(items, chunkSize = 10) {
    const chunks = [];

    for (let index = 0; index < items.length; index += chunkSize) {
      chunks.push(items.slice(index, index + chunkSize));
    }

    return chunks;
  }

  function matchesUserAndFilters(apr) {
    if (filterStatus && apr.status !== filterStatus) {
      return false;
    }

    if (filterMotivo && filterMotivo !== "Todos" && apr.motivo_apr !== filterMotivo) {
      return false;
    }

    const siteType = apr.site_id?.tipoSite;

    if (filterTipoSite && filterTipoSite !== "todos") {
      const allowedTypes = [filterTipoSite.toUpperCase(), filterTipoSite.toLowerCase()];

      if (!allowedTypes.includes(siteType)) {
        return false;
      }
    }

    if (user.nivel === "auditor") {
      const auditorAllowed = ["AUDIT PGR FIXA", "AUDIT PGR MOVEL"];

      if (!auditorAllowed.includes(siteType)) {
        return false;
      }
    }

    return true;
  }

  function sortResultsByRequestedIds(results, numericAprIds, documentIds) {
    const orderMap = new Map();
    let currentIndex = 0;

    numericAprIds.forEach((aprId) => {
      orderMap.set(`apr:${aprId}`, currentIndex);
      currentIndex += 1;
    });

    documentIds.forEach((docId) => {
      orderMap.set(`doc:${docId}`, currentIndex);
      currentIndex += 1;
    });

    return [...results].sort((first, second) => {
      const firstOrder = orderMap.has(`apr:${first.apr_id}`)
        ? orderMap.get(`apr:${first.apr_id}`)
        : orderMap.get(`doc:${first.id}`);
      const secondOrder = orderMap.has(`apr:${second.apr_id}`)
        ? orderMap.get(`apr:${second.apr_id}`)
        : orderMap.get(`doc:${second.id}`);

      return (firstOrder ?? Number.MAX_SAFE_INTEGER) - (secondOrder ?? Number.MAX_SAFE_INTEGER);
    });
  }

  async function loadChamadosBySpecificIds() {
    const { numericAprIds, documentIds, total } = parseAprIds(filterAprIds);

    if (total === 0) {
      toast.warning("Cole pelo menos um ID de APR para buscar.");
      setChamados([]);
      return;
    }

    setLoading(true);
    setDownloadProgress(0);
    setIsDownloading(true);

    try {
      const resultMap = new Map();
      const newCache = new Map();
      const numericChunks = chunkArray(numericAprIds, 10);
      const documentChunks = chunkArray(documentIds, 10);
      const totalChunks = numericChunks.length + documentChunks.length;
      let processedChunks = 0;

      for (const chunk of numericChunks) {
        const snapshot = await firebase
          .firestore()
          .collection("aprs-producao")
          .where("apr_id", "in", chunk)
          .get();

        snapshot.docs.forEach((doc) => {
          if (resultMap.has(doc.id)) {
            return;
          }

          const aprData = { id: doc.id, ...doc.data() };
          resultMap.set(doc.id, aprData);

          const siteKey = `${aprData.site_id?.Sigla}_${aprData.site_id?.Estado}`;
          if (!newCache.has(siteKey) && aprData.site_id) {
            newCache.set(siteKey, aprData.site_id);
          }
        });

        processedChunks += 1;
        setDownloadProgress(Math.round((processedChunks / totalChunks) * 100));
      }

      for (const chunk of documentChunks) {
        const snapshot = await firebase
          .firestore()
          .collection("aprs-producao")
          .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
          .get();

        snapshot.docs.forEach((doc) => {
          if (resultMap.has(doc.id)) {
            return;
          }

          const aprData = { id: doc.id, ...doc.data() };
          resultMap.set(doc.id, aprData);

          const siteKey = `${aprData.site_id?.Sigla}_${aprData.site_id?.Estado}`;
          if (!newCache.has(siteKey) && aprData.site_id) {
            newCache.set(siteKey, aprData.site_id);
          }
        });

        processedChunks += 1;
        setDownloadProgress(Math.round((processedChunks / totalChunks) * 100));
      }

      const filteredResults = sortResultsByRequestedIds(
        Array.from(resultMap.values()).filter(matchesUserAndFilters),
        numericAprIds,
        documentIds
      );

      setSitesCache(newCache);
      setChamados(filteredResults);

      if (filteredResults.length < total) {
        toast.info(`Busca concluida: ${filteredResults.length} APR(s) encontrada(s) de ${total} ID(s) informado(s).`);
      }
    } catch (err) {
      console.error("Erro ao carregar APRs por ID: ", err);
      toast.error("Erro ao buscar APRs pelos IDs informados.");
      setChamados([]);
    } finally {
      setLoading(false);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }

  async function loadChamados() {
    if (hasSpecificIds) {
      await loadChamadosBySpecificIds();
      return;
    }

    setLoading(true);
    try {
      const allResults = [];
      const newCache = new Map();

      // Validar se tem pelo menos uma data preenchida
      if (!filterDate.startDate && !filterDate.endDate) {
        toast.warning("Preencha pelo menos a Data Inicio ou Data Fim para fazer a busca.");
        setChamados([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Buscando dados em lotes para evitar timeout...');
      setDownloadProgress(0);
      setIsDownloading(true); // Usando a mesma flag para o loading centralizado
      
      // Determinar intervalo de data
      let start, end;
      
      if (filterDate.startDate && filterDate.endDate) {
        start = new Date(filterDate.startDate + "T00:00:00Z");
        end = new Date(filterDate.endDate + "T23:59:59Z");
      } else if (filterDate.startDate && !filterDate.endDate) {
        start = new Date(filterDate.startDate + "T00:00:00Z");
        end = new Date();
        end.setHours(23, 59, 59, 999);
      } else if (!filterDate.startDate && filterDate.endDate) {
        start = new Date("2000-01-01T00:00:00Z");
        end = new Date(filterDate.endDate + "T23:59:59Z");
      }
      
      console.log(`📅 Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`);

      let currentStart = new Date(start);
      let batchNumber = 1;

      while (currentStart < end) {
        let currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 30); // Lotes de 30 dias

        if (currentEnd > end) {
          currentEnd = new Date(end);
        }

        console.log(`📦 Lote de Tempo ${batchNumber}: ${currentStart.toLocaleDateString()} até ${currentEnd.toLocaleDateString()}`);

        let hasMoreInTimeBatch = true;
        let lastVisible = null;
        let subBatchCount = 1;

        while (hasMoreInTimeBatch) {
          // Construir query - aplicar filtros diretamente no Firestore para melhor performance
          let query = firebase.firestore().collection("aprs-producao")
            .where("created", ">=", currentStart)
            .where("created", "<=", currentEnd)
            .orderBy("created");

          // Aplicar filtros de Status e Motivo se selecionados
          if (filterStatus) {
            query = query.where("status", "==", filterStatus);
          }
          if (filterMotivo && filterMotivo !== "" && filterMotivo !== "Todos") {
            query = query.where("motivo_apr", "==", filterMotivo);
          }

          // Lógica para filtro de Tipo de Site combinada com a restrição de Auditor
          if (filterTipoSite && filterTipoSite !== "" && filterTipoSite !== "todos") {
            const typesToFilter = [filterTipoSite.toUpperCase(), filterTipoSite.toLowerCase()];
            
            if (user.nivel === 'auditor') {
              const auditorAllowed = ['AUDIT PGR FIXA', 'AUDIT PGR MOVEL'];
              const intersection = typesToFilter.filter(t => auditorAllowed.includes(t));
              
              if (intersection.length > 0) {
                query = query.where('site_id.tipoSite', 'in', intersection);
              } else {
                // Auditor selecionou um tipo que não tem acesso
                hasMoreInTimeBatch = false;
                break;
              }
            } else {
              query = query.where('site_id.tipoSite', 'in', typesToFilter);
            }
          } else if (user.nivel === 'auditor') {
            // Restrição padrão para auditores
            query = query.where('site_id.tipoSite', 'in', ['AUDIT PGR FIXA', 'AUDIT PGR MOVEL']);
          }

          // Paginação dentro do lote de tempo
          if (lastVisible) {
            query = query.startAfter(lastVisible);
          }

          // Limite por sub-lote para evitar timeout de rede/memória
          const subBatchSize = 2000;
          query = query.limit(subBatchSize);

          const snapshot = await query.get();
          console.log(`   -> Sub-lote ${subBatchCount}: ${snapshot.docs.length} registros encontrados`);

          if (snapshot.empty) {
            hasMoreInTimeBatch = false;
            break;
          }

          // Processar resultados deste sub-lote
          snapshot.docs.forEach(doc => {
            const aprData = { id: doc.id, ...doc.data() };
            
            const siteKey = `${aprData.site_id?.Sigla}_${aprData.site_id?.Estado}`;
            if (!newCache.has(siteKey) && aprData.site_id) {
              newCache.set(siteKey, aprData.site_id);
            }

            allResults.push(aprData);
          });


          if (snapshot.docs.length < subBatchSize) {
            hasMoreInTimeBatch = false;
          } else {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
            subBatchCount++;
          }
          
          // Atualizar progresso baseado no tempo (meta-lotes)
          const totalTime = end.getTime() - start.getTime();
          const elapsed = currentEnd.getTime() - start.getTime();
          const progress = Math.min(Math.round((elapsed / totalTime) * 100), 99); // Deixa 99 até o final total
          setDownloadProgress(progress);
        }

        // Avançar para o próximo período (adicionando 1ms para não repetir o último registro se ele cair no limite exato)
        currentStart = new Date(currentEnd.getTime() + 1);
        batchNumber++;

        // Delay pequeno entre lotes para não sobrecarregar o navegador
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setSitesCache(newCache);
      console.log(`✅ Extração completa: ${allResults.length} APRs carregados`);
      setChamados(allResults);
    } catch (err) {
      console.error("❌ Erro ao carregar dados: ", err);
      // Se der erro de índice ausente, o Firestore logará o link no console
    }
    setLoading(false);
    setDownloadProgress(0); // Resetar após terminar
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

  // // Função para calcular a classificação de risco
  // function calculatePontos(peso) {
  //   if (peso <= 10) {
  //     return `Risco Muito Baixo`
  //   } else if (peso >= 11 && peso <= 30) {
  //     return `Risco Baixo`
  //   } else if (peso >= 31 && peso <= 50) {
  //     return `Risco Médio`
  //   } else if (peso >= 51 && peso <= 70) {
  //     return `Risco Alto`
  //   } else if (peso >= 71) {
  //     return `Risco Muito Alto`
  //   }
  // }

  // Função para processar o APRworksheet
  async function v0(apr, siteData) {
    if (!apr.peso) return "-";

    try {
      // Usar dados do cache ao invés de fazer nova query
      if (!siteData) {
        console.log("Dados do site não encontrados no cache.");
        return "-";
      }

      const site = siteData;
      // const classif = calculatePontos(apr.peso);

      // Verifying site values
      if (site.CtCritica !== '-' || site.NonStop !== '-' || site.ErbCritica !== '-') return "v0 - Rota Critica";

      // Determine the return value based on classification and site criticality
      // switch (classif) {
      //   case "Risco Muito Baixo":
      //     return site.critical === "Baixo" ? "v4 - Classificação"
      //       : site.critical === "Médio" ? "v4 - Classificação"
      //         : "v3 - Classificação";
      //   case "Risco Baixo":
      //     return site.critical === "Baixo" ? "v4 - Classificação"
      //       : site.critical === "Médio" ? "v3 - Classificação"
      //         : "v3 - Classificação";
      //   case "Risco Médio":
      //     return site.critical === "Baixo" ? "v3 - Classificação"
      //       : site.critical === "Médio" ? "v3 - Classificação"
      //         : "v2 - Classificação";
      //   case "Risco Alto":
      //     return site.critical === "Baixo" ? "v3 - Classificação"
      //       : site.critical === "Médio" ? "v2 - Classificação"
      //         : "v1 - Classificação";
      //   case "Risco Muito Alto":
      //     return site.critical === "Baixo" ? "v2 - Classificação"
      //       : site.critical === "Médio" ? "v1 - Classificação"
      //         : "v0 - Classificação";
      //   default:
      //     return "-";
      // }
    } catch (error) {
      console.error("Erro ao consultar o Firestore:", error);
      return "-";
    }
  }

  async function updateState(snapshot) {
    setLoading(true);
    setIsDownloading(false); // Mudado para false aqui
    setDownloadProgress(0);
    const relatorioApr = [];

    const buildQuestionWeightMap = async () => {
      const weightMap = new Map();
      const snapshot = await firebase.firestore().collection("question").get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        Object.entries(data).forEach(([key, value]) => {
          if (key === "title" || key === "ativo") return;
          if (!Array.isArray(value)) return;

          value.forEach((question) => {
            if (!question || !question.questionId) return;
            const peso =
              question.peso ??
              question.peso_rct ??
              question.peso_daef ??
              question.peso_fmc ??
              question.peso_icd;

            if (peso !== undefined && peso !== null && peso !== "") {
              weightMap.set(question.questionId, peso);
            }
          });
        });
      });

      return weightMap;
    };

    const getPesoPergunta = (question, weightMap) => {
      const localPeso =
        question.peso ??
        question.peso_rct ??
        question.peso_daef ??
        question.peso_fmc ??
        question.peso_icd;

      if (localPeso !== undefined && localPeso !== null && localPeso !== "") {
        return localPeso;
      }

      if (weightMap && question.questionId && weightMap.has(question.questionId)) {
        return weightMap.get(question.questionId);
      }

      return "";
    };

    const hasFilledValue = (value) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.filter((item) => String(item).trim() !== "").length > 0;
      return String(value).trim() !== "";
    };

    const isAnsweredByApplicator = (question) => {
      return (
        hasFilledValue(question?.resp) ||
        hasFilledValue(question?.optionListResp) ||
        hasFilledValue(question?.respTextArea) ||
        hasFilledValue(question?.respInputNumber)
      );
    };

    const questionWeightMap = includeQuestions
      ? await buildQuestionWeightMap()
      : null;

    // Processar em lotes para evitar timeout
    const batchSize = 50;
    console.log(`Processando ${snapshot.length} APRs em lotes de ${batchSize}...`);

    for (let i = 0; i < snapshot.length; i += batchSize) {
      const batch = snapshot.slice(i, i + batchSize);
      console.log(`Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(snapshot.length / batchSize)}...`);

      const promises = batch.map(doc => {
        if (doc.created !== undefined) {
          const siteKey = `${doc.site_id.Sigla}_${doc.site_id.Estado}`;
          const siteData = sitesCache.get(siteKey);

          return v0(doc, siteData).then(result => {
            if (includeQuestions) {
              if (doc.checklist && doc.status !== "Com Exceção") {
                // Usar Set para rastrear perguntas já adicionadas e evitar duplicidade
                // FIXADO: Set criado FORA do forEach para rastrear entre blocos
                const addedQuestions = new Set();
                
                doc.checklist.forEach((blocoQuestion) => {
                  blocoQuestion[1].forEach((question) => {
                    // Criar chave única para evitar duplicação
                    const questionKey = `${blocoQuestion[0]}_${question.questionId}`;
                    
                    // Verificar se a pergunta já foi adicionada
                    if (addedQuestions.has(questionKey)) {
                      return; // Pula se já foi adicionada
                    }
                    
                    // Filtrar apenas perguntas realmente respondidas pelo aplicador
                    if (isAnsweredByApplicator(question)) {
                      // Marcar pergunta como adicionada
                      addedQuestions.add(questionKey);
                      
                      relatorioApr.push({
                        ID: doc.id,
                        ID_APR: doc.apr_id ? doc.apr_id : '-',
                        DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
                        STATUS: doc.status,
                        TIPO_LOJA: doc.tipo_loja ? doc.tipo_loja : '-',
                        VALOR_ESTOQUE: doc.valor_estoque ? parseInt(doc.valor_estoque) / 100 : '-',
                        VALOR_SINISTRO: doc.valor_sinistro ? parseInt(doc.valor_sinistro) / 100 : '-',
                        VALOR_TRANSPORTE: doc.valor_transporte ? parseInt(doc.valor_transporte) / 100 : '-',
                        VALOR_ARMAZENAMENTO: doc.valor_armazenamento ? parseInt(doc.valor_armazenamento) / 100 : '-',
                        MOTIVO: doc.motivo_apr,
                        TIPO_CHECKLIST: doc.site_id.tipoSite,
                        // CLASSIFICACAO: calculatePontos(doc.peso),
                        PESO_PERGUNTA: getPesoPergunta(question, questionWeightMap),
                        BLOCO: blocoQuestion[0],
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
                        OPERADOR_LOGISTICO: doc.site_id.operador_logistico || doc.site_id['Operador Logistico'] || '-',
                        COBERTURA_SEGURO: doc.site_id.Cobertura_Seguro || doc.site_id['Cobertura Seguro'] || '-',
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
                  ID_APR: doc.apr_id ? doc.apr_id : '-',
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
                  OPERADOR_LOGISTICO: doc.site_id.operador_logistico || doc.site_id['Operador Logistico'] || '-',
                  COBERTURA_SEGURO: doc.site_id.Cobertura_Seguro || doc.site_id['Cobertura Seguro'] || '-',
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
                PESO_PERGUNTA: "",
                ID: doc.id,
                ID_APR: doc.apr_id ? doc.apr_id : '-',
                DATA: format(doc.created.toDate(), "dd/MM/yyyy HH:mm:ss"),
                STATUS: doc.status,
                TIPO_LOJA: doc.tipo_loja ? doc.tipo_loja : '-',
                VALOR_ESTOQUE: doc.valor_estoque ? parseInt(doc.valor_estoque) / 100 : '-',
                MOTIVO: doc.motivo_apr,
                // CLASSIFICACAO: calculatePontos(doc.peso),
                PESO_APR: doc.peso,
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
                OPERADOR_LOGISTICO: doc.site_id.operador_logistico || doc.site_id['Operador Logistico'] || '-',
                COBERTURA_SEGURO: doc.site_id.Cobertura_Seguro || doc.site_id['Cobertura Seguro'] || '-',
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

      await Promise.all(promises).catch(error => {
        console.error("Erro ao processar lote:", error);
      });
    }

    setDownloadProgress(100);
    console.log(`Processamento completo. Total de registros: ${relatorioApr.length}`);
    downloadExcel(relatorioApr);
    
    setTimeout(() => {
      setLoading(false);
      setIsDownloading(false);
      setDownloadProgress(0);
    }, 1000);
  }

  return (
    <div>
      <Header name="Relatorios" />
      <div className="content">
        <div className="container reports-shell">
          <div className="reports-hero">
            <div className="reports-hero-copy">
              <span className="reports-eyebrow">APR Digital</span>
              <Typography variant="h5" className="reports-title">
                Central de relatorios
              </Typography>
              <Typography variant="body2" className="reports-subtitle">
                Filtre por periodo, status, motivo e tipo de site para gerar a exportacao com mais clareza.
              </Typography>
            </div>

            <div className="reports-hero-aside">
              <Chip
                label={`${chamados.length} APR(s) carregadas`}
                color="secondary"
                className="reports-chip-primary"
              />
              <Chip
                label={includeQuestions ? "Com perguntas" : "Resumo da APR"}
                variant="outlined"
              />
            </div>
          </div>
        <div className="filter-reports-container">
          <div className="filter-reports reports-filter-panel">
            <div className="reports-filter-header">
              <Box>
                <Typography variant="h6" className="reports-filter-title">
                  Ajustar filtros
                </Typography>
                <Typography variant="body2" className="reports-filter-subtitle">
                  Informe pelo menos uma data para iniciar a consulta e depois refine os demais criterios.
                </Typography>
              </Box>

              <div className="reports-filter-chips">
                <Chip
                  icon={<TuneRoundedIcon />}
                  label={
                    hasSpecificIds
                      ? "IDs definidos"
                      : hasDateFilter
                        ? "Periodo definido"
                        : "Periodo obrigatorio"
                  }
                  variant={hasDateFilter || hasSpecificIds ? "filled" : "outlined"}
                  color={hasDateFilter || hasSpecificIds ? "secondary" : "default"}
                  size="small"
                />
              </div>
            </div>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  id="apr-ids"
                  label="IDs da APR"
                  variant="outlined"
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  value={filterAprIds}
                  onChange={(e) => setFilterAprIds(e.target.value)}
                  placeholder="Cole os IDs separados por quebra de linha, virgula, espaco ou ponto e virgula"
                  helperText="Se preencher este campo, a busca usa apenas os IDs informados e ignora o periodo."
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <TextField
                  id="startDate"
                  type="date"
                  label="Data inicio"
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filterDate.startDate}
                  onChange={(e) =>
                    setFilterDate({ ...filterDate, startDate: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <TextField
                  id="endDate"
                  type="date"
                  label="Data fim"
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filterDate.endDate}
                  onChange={(e) =>
                    setFilterDate({ ...filterDate, endDate: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
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
              <Grid item xs={12} sm={6} md={4} lg={3}>
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
              <Grid item xs={12} sm={6} md={4} lg={3}>
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
                    <MenuItem value={"pgr cd movel"}>PGR CD MÓVEL</MenuItem>
                    <MenuItem value={"pgr cd fixa"}>PGR CD FIXA</MenuItem>
                    <MenuItem value={"pgr base cross"}>PGR BASE CROSS</MenuItem>
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
              <Grid item xs={12} md={7} lg={8}>
                <div className="reports-options-row">
                  <FormControlLabel
                    className="reports-checkbox"
                    control={
                      <Checkbox
                        checked={includeQuestions}
                        onChange={(e) => setIncludeQuestions(e.target.checked)}
                      />
                    }
                    label="Incluir perguntas no arquivo"
                  />
                </div>
              </Grid>
              <Grid item xs={12} md={5} lg={4}>
                <div className="reports-submit-wrap">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={loadChamados}
                    disabled={loading}
                    className="reports-submit-button"
                    fullWidth
                  >
                    {loading && !isDownloading ? "Filtrando..." : "Carregar relatorio"}
                  </Button>
                </div>
              </Grid>
            </Grid>
            {loading && isDownloading && (
              <Box className="reports-progress">
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                  Carregando dados... {downloadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 10, borderRadius: 5 }} />
              </Box>
            )}
          </div>
        </div>

        <div className="container reports-export-card">
          <div className="reports-export-copy">
            <span className="reports-export-badge">
              <TaskAltRoundedIcon fontSize="inherit" />
              Exportacao
            </span>
            <Typography variant="h6" className="reports-export-title">
              Gerar arquivo Excel
            </Typography>
            <Typography variant="body2" className="reports-export-subtitle">
              Depois de carregar os registros, exporte a base consolidada em um unico arquivo.
            </Typography>
          </div>

          <div className="reports-export-actions">
            <Button
              variant="contained"
              color="secondary"
              onClick={() => updateState(chamados)}
              disabled={loading || chamados.length === 0}
              className="reports-download-button"
              startIcon={<DownloadRoundedIcon />}
            >
              {loading ? "Processando..." : "Baixar Excel"}
            </Button>

            <div className="reports-export-meta">
              <strong>{chamados.length}</strong>
              <span>APR(s) prontas para exportacao</span>
            </div>
          </div>
        </div>
        <div className="container reports">
          <i>APR´s carregadas: {chamados.length}</i>
        </div>
      </div>
      </div>
    </div>
  );
}
