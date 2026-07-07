import { useContext, useEffect, useState } from "react";
import {
  FiClipboard,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiArrowLeft,
  FiEye,
} from "react-icons/fi";
import { useLocation, useParams } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { toast } from "react-toastify";
import { format } from "date-fns";
import * as geofire from "geofire-common";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import {
  clearOfflineAprEditSession,
  getOfflineAprEditSession,
  hydrateQuestionsFromOffline,
  removeOfflineAprRecord,
  saveOfflineAprRecord,
  serializeQuestionsForOffline,
  updateOfflineAprRecord,
} from "../../services/offlineAprStorage";
import "./new.scss";

import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import ModalLoading from "../../components/Modal_Loading";
import Modal_Justificativa from "../../components/Modal_Justificativa";
import CameraComponent from "./CameraComponent";
import InputComponent from "./InputComponent";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  Container,
  FormControl,
  Grid,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function New() {
  const { user, logSistem } = useContext(AuthContext);
  const { id } = useParams();
  const { id_assign } = useParams();
  const locationRouter = useLocation();

  // Verificar se geolocalização é suportada
  const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
  };

  // Verificar se é iOS para ajustes específicos
  const isIOS = () => {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  };

  const getGeolocation = () => {
    if (!isGeolocationSupported()) {
      console.warn('Geolocalização não suportada pelo navegador');
      setGeolocationError('Geolocalização não suportada pelo navegador');
      setShowGeolocationModal(true);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: isIOS() ? 20000 : 15000, // Timeout maior para iOS
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setGeolocationEnabled(true);
        setGeolocationError(null);
        console.log('Localização obtida:', position.coords);
      },
      (error) => {
        console.warn('Erro na geolocalização:', error);
        setGeolocationError(getGeolocationErrorText(error));

        // Tentar fallback com configurações diferentes se for iOS
        if (isIOS() && error.code === error.TIMEOUT) {
          console.log('Tentando fallback para iOS...');

          // Configuração alternativa para iOS
          const fallbackOptions = {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 0
          };

          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation(position.coords);
              setGeolocationEnabled(true);
              setGeolocationError(null);
            },
            (fallbackError) => {
              console.error('Fallback também falhou:', fallbackError);
              setGeolocationError(getGeolocationErrorText(fallbackError));
              setShowGeolocationModal(true);
            },
            fallbackOptions
          );
        } else {
          setShowGeolocationModal(true);
        }
      },
      options
    );
  };

  // Função para obter texto do erro de geolocalização
  const getGeolocationErrorText = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Permissão de geolocalização negada pelo usuário";
      case error.POSITION_UNAVAILABLE:
        return "Localização indisponível";
      case error.TIMEOUT:
        return "Tempo limite para obter localização excedido";
      default:
        return "Erro desconhecido na geolocalização";
    }
  };

  useEffect(() => {
    addBodyClass("page-new");
    loadSite();
    getCheckLists();

    // Verificar permissão de geolocalização
    if (isGeolocationSupported()) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          getGeolocation();
        } else if (result.state === "prompt") {
          getGeolocation();
        } else {
          setShowGeolocationModal(true);
        }
      });
    } else {
      setShowGeolocationModal(true);
    }
  }, [id]);

  useEffect(() => {
    restoreOfflineAprSession();
  }, [locationRouter.search]);

  const base = "aprs-producao"; //aprs-producao
  const storage = "images"; //images

  //question
  const [questions, setQuestions] = useState([]);
  const [listQuestions, setListQuestions] = useState([]);

  const [motivoAPR, setMotivoAPR] = useState("");

  const [siteInfo, setSiteInfo] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [loadedChecklist, setLoadedChecklist] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);

  const [location, setLocation] = useState([]);
  const [inicio, setInicio] = useState("");
  const [lastAPR, setLastAPR] = useState("");

  const [loadingImages, setLoadingImages] = useState("");

  const [justificativa, setJustificativa] = useState();
  const [openModalJust, setOpenModalJust] = useState(false);
  //PGR
  const [valorArmazenamento, setValorArmazenamento] = useState("");
  const [valorTransporte, setValorTransporte] = useState("");
  const [valorSinistro, setValorSinistro] = useState("");
  //Loja
  const [tipoLoja, setTipoLoja] = useState("");
  const [valorEstoque, setValorEstoque] = useState("0");
  // Estados para controle de geolocalização e justificativa
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [geolocationJustification, setGeolocationJustification] = useState("");
  const [showGeolocationModal, setShowGeolocationModal] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);
  const [aprSalva, setAprSalva] = useState(false);
  const [activeOfflineAprId, setActiveOfflineAprId] = useState(null);

  const isEditingOfflineApr = new URLSearchParams(locationRouter.search).has("edit_offline");

  const maisUtilizados = [2, 3, 5, 6, 7, 8, 10, 11, 18, 20];
  const currentChecklist = selectedChecklist || siteInfo?.tipoSite || "";
  const lojaChecklists = [
    "LOJA",
    "LOJA DEALER",
    "PROJETO VENEZA",
    "LOJA PROJ VENEZA",
  ];

  const handleChangeSelect = (question, indexA, e) => {
    const {
      target: { value },
    } = e;

    let newQuestions = [...questions];
    let objIndex = newQuestions[indexA][1].findIndex(
      (obj) => obj.questionId === question.questionId
    );

    newQuestions[indexA][1][objIndex].optionListResp =
      typeof value === "string" ? value.split(",") : value;

    setQuestions(newQuestions);
    saveIndexedDB();
  };

  async function getCheckLists() {
    const collections = await firebase.firestore().collection("question").get();
    setListQuestions(collections.docs);
  }

  async function loadSite() {
    await firebase
      .firestore()
      .collection("sites")
      .doc(id)
      .get()
      .then((snapshot) => {
        const siteData = snapshot.data();
        setSiteInfo(siteData);
        if (!isEditingOfflineApr) {
          setSelectedChecklist(siteData?.tipoSite || "");
        }
        if (siteData.last_apr !== undefined) {
          setLastAPR({
            data: format(siteData.last_apr.toDate(), "dd/MM/yyyy HH:mm"),
            motivo: siteData.last_motivo,
          });
        }
        setInicio(new Date());
      })
      .catch((error) => {
        console.log("DEU ALGUM ERRO!", error);
      });
  }

  const showAprFormContainers = () => {
    const questionsContainer = document.getElementById("container-questions");
    const formContainer = document.getElementById("container");

    if (questionsContainer) {
      questionsContainer.style.display = "flex";
    }

    if (formContainer) {
      formContainer.style.display = "flex";
    }
  };

  const buildOfflineAprPayload = async () => {
    const serializedQuestions = await serializeQuestionsForOffline(questions);
    const offlineId =
      activeOfflineAprId ||
      `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      id: offlineId,
      timestamp: Date.now(),
      user,
      siteId: id,
      idAssign: id_assign || null,
      siteInfo,
      selectedChecklist: currentChecklist,
      loadedChecklist,
      motivoAPR,
      valorArmazenamento,
      valorTransporte,
      valorSinistro,
      valorEstoque,
      tipoLoja,
      justificativa: justificativa || null,
      geolocationEnabled,
      geolocationJustification,
      geolocationError,
      location,
      inicio,
      questions: serializedQuestions,
    };
  };

  const saveAprOffline = async () => {
    const offlinePayload = await buildOfflineAprPayload();

    if (activeOfflineAprId) {
      updateOfflineAprRecord(activeOfflineAprId, offlinePayload);
    } else {
      saveOfflineAprRecord(offlinePayload);
      setActiveOfflineAprId(offlinePayload.id);
    }

    clearOfflineAprEditSession();
    setShowPostModal(false);
    toast.warning(
      "Sem conexão. APR salva localmente. Quando voltar a internet, use o painel APRs Offline para sincronizar."
    );

    setTimeout(() => {
      window.location.href = "/aprs";
    }, 700);
  };

  async function restoreOfflineAprSession() {
    const params = new URLSearchParams(locationRouter.search);
    const editOfflineId = params.get("edit_offline");
    const offlineSession = getOfflineAprEditSession();

    if (!offlineSession) {
      return;
    }

    if (editOfflineId && offlineSession.id !== editOfflineId) {
      return;
    }

    try {
      const hydratedQuestions = await hydrateQuestionsFromOffline(
        offlineSession.questions || []
      );

      setActiveOfflineAprId(offlineSession.id || editOfflineId || null);
      setQuestions(hydratedQuestions);
      setSelectedChecklist(
        offlineSession.selectedChecklist || offlineSession.siteInfo?.tipoSite || ""
      );
      setLoadedChecklist(
        offlineSession.selectedChecklist || offlineSession.siteInfo?.tipoSite || ""
      );
      setMotivoAPR(offlineSession.motivoAPR || "");
      setValorArmazenamento(offlineSession.valorArmazenamento || "");
      setValorTransporte(offlineSession.valorTransporte || "");
      setValorSinistro(offlineSession.valorSinistro || "");
      setValorEstoque(offlineSession.valorEstoque || "0");
      setTipoLoja(offlineSession.tipoLoja || "");
      setJustificativa(offlineSession.justificativa || undefined);
      setGeolocationEnabled(Boolean(offlineSession.geolocationEnabled));
      setGeolocationJustification(offlineSession.geolocationJustification || "");
      setGeolocationError(offlineSession.geolocationError || null);

      if (offlineSession.location) {
        setLocation(offlineSession.location);
      }

      if (offlineSession.inicio) {
        setInicio(new Date(offlineSession.inicio));
      }

      setSiteInfo((prev) => ({
        ...(prev || {}),
        ...(offlineSession.siteInfo || {}),
      }));

      setTimeout(showAprFormContainers, 0);

      if (params.get("auto_sync") === "1" && navigator.onLine) {
        toast.info(
          "APR offline carregada para sincronização. Revise os dados e clique em Concluir APR."
        );
      } else {
        toast.info("APR offline carregada para edição.");
      }
    } catch (error) {
      console.error("Erro ao carregar APR offline:", error);
      toast.error("Erro ao carregar APR offline para edição.");
    }
  }

  async function getQuestions(snapshot) {
    if (!snapshot) {
      toast.error("Selecione um checklist antes de continuar.");
      return;
    }

    // Verificar se a geolocalização está habilitada ou se há justificativa
    if (!geolocationEnabled && !geolocationJustification) {
      setShowGeolocationModal(true);
      return;
    }

    document.getElementById("container-questions").style.display = "flex";
    setSelectedChecklist(snapshot);
    setLoadedChecklist("");
    setQuestions([]);

    await firebase
      .firestore()
      .collection("question")
      .doc(snapshot)
      .get()
      .then(async (item_question) => {
        if (!item_question.exists) {
          toast.error(`Checklist "${snapshot}" nao encontrado.`);
          return;
        }

        const data = item_question.data();
        console.log(data);

        // Remover a propriedade 'ativo' do objeto data
        const { ativo, ...restoData } = data;

        const orderedEntries = Object.entries(restoData).sort((a, b) =>
          a[0].localeCompare(b[0])
        ).map(([key, value]) => {
          const questionsList = Array.isArray(value) ? value : [];

          return [
            key,
            questionsList.map((question) => ({
              ...question,
              inputImages:
                question.inputImages === true || question.images === true,
              inputImagesLibrary: question.inputImagesLibrary === true,
              images: Array.isArray(question.images) ? question.images : [],
            })),
          ];
        });

        console.log(orderedEntries);
        setQuestions(orderedEntries);
        setLoadedChecklist(snapshot);
      });
  }

  //questions number amount
  function inputNumber(question, indexA, e) {
    let objIndex = questions[indexA][1].findIndex(
      (obj) => obj.questionId == question.questionId
    );
    questions[indexA][1][objIndex].respInputNumber = e.target.value;
    setQuestions(questions);
  }

  //questions textarea
  function textareaValue(question, indexA, e) {
    let objIndex = questions[indexA][1].findIndex(
      (obj) => obj.questionId == question.questionId
    );
    questions[indexA][1][objIndex].respTextArea = e.target.value;
    setQuestions(questions);
  }

  //questions sim ou não
  function radioSetValue(question, indexA, e) {
    let objIndex = questions[indexA][1].findIndex(
      (obj) => obj.questionId == question.questionId
    );
    questions[indexA][1][objIndex].resp = e.target.value;
    setQuestions(questions);
    saveIndexedDB();

    let textarea = document.getElementById(
      indexA + "_textarea_" + question.questionId
    );
    let inputimage = document.getElementById(
      "inputimg_" + question.questionId + "_" + indexA
    );
    let inputSelectResp = document.getElementById(
      indexA + "_select_" + question.questionId
    );
    let inputNumber = document.getElementById(
      indexA + "_numberarea_" + question.questionId
    );

    const hasImageInput =
      question.inputImages === true ||
      question.images === true ||
      question.inputImagesLibrary === true;

    if (e.target.value === "N/A") {
      if (question.textarea === true) textarea.style.display = "none";
      if (hasImageInput && inputimage) inputimage.style.display = "none";
      if (question.listCheck === true) inputSelectResp.style.display = "none";
      if (question.inputNumber === true) inputNumber.style.display = "none";
    } else if (e.target.value !== "") {
      if (question.textarea === true) textarea.style.display = "block";
      if (hasImageInput && inputimage) inputimage.style.display = "flex";
      if (question.listCheck === true)
        inputSelectResp.style.display = "inline-flex";
      if (question.inputNumber === true) inputNumber.style.display = "block";
    }
  }

  function clearQuestion(question, indexA) {
    var element = document.getElementsByName(
      indexA + "-" + question.questionId
    );
    let objIndex = questions[indexA][1].findIndex(
      (obj) => obj.questionId == question.questionId
    );
    saveIndexedDB();

    document
      .querySelectorAll("#inputimg_" + question.questionId + "_" + indexA)
      .forEach((item) => {
        Array.from(item.children).forEach((child) => {
          if (!child.classList.contains("notremove")) {
            child.remove();
          }
        });
      });

    let textarea = document.getElementById(
      indexA + "_textarea_" + question.questionId
    );
    let inputimage = document.getElementById(
      "inputimg_" + question.questionId + "_" + indexA
    );

    textarea &&
      (textarea.style.display = textarea.style.display === "block" && "none");
    inputimage &&
      (inputimage.style.display =
        inputimage.style.display === "flex" && "none");

    textarea && (textarea.value = "");

    questions[indexA][1][objIndex].resp = "";
    questions[indexA][1][objIndex].images = [];
    questions[indexA][1][objIndex].respTextArea = "";

    setQuestions(questions);
    for (var i = 0; i < element.length; i++) element[i].checked = false;
  }

  //função do botão remover imagem da lista
  function removeImg(indexA, objIndex, file) {
    // Validar se a estrutura existe
    if (!questions[indexA] || !Array.isArray(questions[indexA][1]) || !questions[indexA][1][objIndex]) {
      console.error("Estrutura de questions inválida:", { indexA, objIndex, questions });
      return;
    }

    let imageArray = [];
    let arrayQuestion = questions[indexA][1][objIndex];

    // Garantir que images existe e é um array
    if (!arrayQuestion.images || !Array.isArray(arrayQuestion.images)) {
      console.error("arrayQuestion.images não é um array:", arrayQuestion);
      arrayQuestion.images = [];
      return;
    }

    let index = arrayQuestion.images.findIndex((obj) => obj.name === file.name);

    if (index !== -1) {
      delete arrayQuestion.images[index];

      arrayQuestion.images.forEach((file) => {
        if (file) { // Verificar se o file não é undefined após o delete
          imageArray.push(file);
        }
      });

      questions[indexA][1][objIndex].images = imageArray;
      setQuestions([...questions]); // Usar spread para forçar re-render
    }
  }

  async function updateAssignments() {
    await firebase
      .firestore()
      .collection("atribuicoes")
      .doc(id_assign)
      .update(cleanFirebaseData({
        status: "APR Criada",
      }))
      .then(() => {
        console.log("Apr Criada");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function togglePostModal() {
    setShowPostModal(!showPostModal);
  }

  function hasRequired() {
    for (let area of questions) {
      for (let question of area[1]) {
        let questionStatus = enableQuestions(question);
        if (question.isRequired && questionStatus === true) {
          if (question.answers === "" && question.optionListResp === "") {
            toast.error(`A questão "${question.question}" é obrigatória`);
            return true;
          } else if (question.answers !== "" && question.resp === "") {
            toast.error(`A questão "${question.question}" é obrigatória`);
            return true;
          }
        }
      }
    }
    return false;
  }

  // Função com tratamento robusto de erros
  async function submitWithErrorHandling() {
    try {
      if (!currentChecklist) {
        toast.error("Selecione um checklist antes de concluir a APR.");
        return;
      }

      if (questions.length === 0 || loadedChecklist !== currentChecklist) {
        toast.error(`Carregue as perguntas do checklist ${currentChecklist}.`);
        return;
      }

      let notBlankChecklist = 0;
      console.log(justificativa);

      questions.forEach(async (area) => {
        area[1].forEach(async (question) => {
          if (question.resp !== "N/A" && question.resp !== "") {
            notBlankChecklist = notBlankChecklist + 1;
          }
        });
      });

      if (notBlankChecklist <= 0) {
        if (justificativa == null || justificativa == "" || justificativa.motivo === "" || justificativa.desc === "") {
          setOpenModalJust(true);
          toast.warning("⚠️ Insira uma justificativa para continuar");
          return;
        }
      }

      // Verificar geolocalização antes de submeter
      if (!geolocationEnabled && !geolocationJustification) {
        setShowGeolocationModal(true);
        toast.warning("⚠️ Geolocalização necessária ou forneça uma justificativa");
        return;
      }

      if (!navigator.onLine) {
        await saveAprOffline();
        return;
      }

      togglePostModal(); //abre modal de loading
      toast.info("🔄 Processando APR...");

      if (geolocationEnabled && location.latitude && location.longitude) {
        console.log('Com geolocalização:', geolocationEnabled, location);
        try {
          const perimeter = await getPerimetro(location.latitude, location.longitude);
          insertDataWithErrorHandling(perimeter);
        } catch (err) {
          console.log("❌ Erro na geolocalização:", err);
          toast.warning("⚠️ Erro na geolocalização, usando justificativa");
          insertDataWithErrorHandling("Erro na geolocalização - " + geolocationJustification);
        }
      } else {
        console.log('Sem geolocalização, usando justificativa');
        insertDataWithErrorHandling("Geolocalização não habilitada - " + geolocationJustification);
      }
    } catch (error) {
      console.error("❌ Erro crítico em submitWithErrorHandling:", error);
      toast.error(`❌ Erro crítico: ${error.message || 'Falha inesperada'}`);
      togglePostModal(); // Fechar modal de loading
    }
  }

  function submit() {
    let notBlankChecklist = 0;
    console.log(justificativa);
    // Função mantida por compatibilidade, mas agora usa submitWithErrorHandling
    console.log("Função submit() chamada diretamente - use submitWithErrorHandling()");
  }

  async function incrementID() {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("incrementID")
        .doc("currentID")
        .get();
      const currentID = snapshot.data().ID;

      await firebase
        .firestore()
        .collection("incrementID")
        .doc("currentID")
        .update(cleanFirebaseData({
          ID: currentID + 1,
        }));

      return currentID;
    } catch (error) {
      console.error("Erro:", error);
      throw error; // Lança o erro para que possa ser tratado fora da função se necessário
    }
  }

  async function setSite(id, motivo) {
    console.log('atualizou site...')
    const querySnapshot = await firebase
      .firestore()
      .collection("sites")
      .doc(id)
      .update(cleanFirebaseData({
        last_apr: new Date(),
        last_motivo: motivo || "",
      }))
    console.log('atualizou site concluido')
    return querySnapshot;
  }

  // Wrapper com tratamento de erros para insertData
  function insertDataWithErrorHandling(perimeter) {
    try {
      insertData(perimeter);
    } catch (error) {
      console.error("❌ Erro crítico em insertData:", error);
      toast.error(`❌ Erro ao salvar APR: ${error.message || 'Falha no servidor'}`);
      togglePostModal(); // Fechar modal de loading
    }
  }

  // Função para remover valores undefined antes de salvar no Firebase
  const cleanFirebaseData = (obj) => {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => cleanFirebaseData(item)).filter(item => item !== null && item !== undefined);
    }

    if (obj instanceof Date) {
      return obj;
    }

    if (typeof obj === 'object') {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined && value !== null) {
          const cleanedValue = cleanFirebaseData(value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        } else {
          // Para campos que são undefined/null, não incluir no objeto final
          console.warn(`Removendo campo undefined/null: ${key}`, value);
        }
      });
      return cleaned;
    }

    return obj;
  };

  async function insertData(perimeter) {
    try {
      let checklist = [];

      let qtdImages = 0;
      let imagesCompleted = 0;

      try {
        saveIndexedDB();
      } catch (error) {
        console.error("❌ Erro ao salvar no IndexedDB:", error);
        toast.warning("⚠️ Erro ao salvar backup local, continuando...");
      }

      const result_peso = calculatePontos();

      incrementID()
        .then(async (result) => {
          setSite(id, motivoAPR)
            .then(async () => {
              const aprSiteInfo = {
                ...siteInfo,
                tipoSite: currentChecklist,
              };

              console.log("ID Atual:", result);

              console.log({
                user_id: user,
                apr_id: result,
                site_id: aprSiteInfo,
                checklist_aplicado: currentChecklist,
                created: new Date(),
                motivo_apr: motivoAPR,
                valor_armazenamento: valorArmazenamento,
                valor_transporte: valorTransporte,
                valor_sinistro: valorSinistro,
                valor_estoque: valorEstoque,
                tipo_loja: tipoLoja,
                status: justificativa ? "Com Exceção" : "Em Aberto",
                peso: result_peso,
                justificativa: justificativa ? justificativa : "",
                locationCreated: geolocationEnabled ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  perimetro: perimeter,
                } : {
                  latitude: null,
                  longitude: null,
                  perimetro: "Geolocalização não habilitada",
                },
                tempoConclusao: {
                  inicio: inicio === undefined ? new Date() : inicio,
                  conclusao: new Date(),
                },
                geolocation_info: {
                  enabled: geolocationEnabled,
                  justification: geolocationJustification,
                  error: geolocationError
                },
              })

              const aprData = {
                user_id: user,
                apr_id: result,
                site_id: aprSiteInfo,
                checklist_aplicado: currentChecklist,
                created: new Date(),
                motivo_apr: motivoAPR || "",
                valor_armazenamento: valorArmazenamento || "",
                valor_transporte: valorTransporte || "",
                valor_sinistro: valorSinistro || "",
                valor_estoque: valorEstoque || "",
                tipo_loja: tipoLoja || "",
                status: justificativa ? "Com Exceção" : "Em Aberto",
                peso: result_peso || 0,
                justificativa: justificativa || "",
                locationCreated: geolocationEnabled ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  perimetro: perimeter,
                } : {
                  latitude: null,
                  longitude: null,
                  perimetro: "Geolocalização não habilitada",
                },
                tempoConclusao: {
                  inicio: inicio || new Date(),
                  conclusao: new Date(),
                },
                geolocation_info: {
                  enabled: geolocationEnabled || false,
                  justification: geolocationJustification || "",
                  error: geolocationError || ""
                },
              };

              // Limpar dados antes de enviar para o Firebase
              console.log("Dados antes da limpeza:", aprData);
              const cleanedAprData = cleanFirebaseData(aprData);
              console.log("Dados depois da limpeza:", cleanedAprData);

              await firebase
                .firestore()
                .collection(base)
                .add(cleanedAprData)
                .then(async (index) => {
                  let containsImage = verifyContainsImage();

                  questions.forEach(async (area, indexA) => {
                    checklist.push({
                      0: area[0],
                      1: [],
                    });
                    area[1].forEach(async (question, indexQ) => {
                      question.question && checklist[indexA][1].push(cleanFirebaseData({
                        imagesURL: [],
                        resp: question.resp || "",
                        respTextArea: question.respTextArea || "",
                        questionId: question.questionId || "",
                        question: question.question || "",
                        plano_acao: question.plano_acao || {},
                        openPA: question.openPA || false,
                        areaResposavel: question.areaResposavel || [],
                        respGabarito: question.respGabarito || "",
                        answers: question.answers || [],
                        selectOptions: question.selectOptions || false,
                        status: question.status || false,
                        isRequired: question.isRequired || false,
                        optionList: question.optionList || [],
                        optionListResp: question.optionListResp || [],
                        listCheck: question.listCheck || "",
                        respInputNumber: question.respInputNumber || "",
                        inputNumber: question.inputNumber || "",
                        valorArmazenado: question.valorArmazenado || [],
                        valorEstoque: question.valorEstoque || [],
                        valorTransporte: question.valorTransporte || [],
                        ValorSinistro: question.ValorSinistro || [],
                        tipoLoja: question.tipoLoja || []
                      }));

                      let imageList = []; // criar uma lista de imagem e reseta a cada questao
                      //inserção de dados no banco OBS: se contem imagem ou não
                      if (containsImage === true) {
                        question.images &&
                          question.images.forEach(async (file) => {
                            let imgName = file.name;
                            let imgPath = `${storage}/${index.id}/${indexA}/${question.questionId}/${imgName}`;

                            let storageRef = await firebase
                              .storage()
                              .ref(imgPath);
                            let upload = storageRef.put(file);

                            qtdImages = qtdImages + 1;

                            let uploadCompleted = new Promise(
                              (resolve, reject) => {
                                // promise para concluir apos termino de upload geral de fotos
                                trackUpload(upload)
                                  .then(() => {
                                    storageRef
                                      .getDownloadURL()
                                      .then((downloadUrl) => {
                                        imageList.push({
                                          url: downloadUrl,
                                          ref: storageRef.fullPath,
                                        });
                                        try {
                                          console.log(indexA + "-" + indexQ);
                                          checklist[indexA][1][
                                            indexQ
                                          ].imagesURL = imageList; //define a lista em uma pergunta
                                        } catch (error) {
                                          console.log(indexA + "-" + indexQ);
                                          console.log(
                                            "Erro ao obter url da imagem" +
                                            error
                                          );
                                        }
                                        imagesCompleted = imagesCompleted + 1; // conta quantos imagens foi obtida a url
                                        // console.log((imagesCompleted / qtdImages * 100).toFixed(2) + '%'); // mostra o status de imagens concluida vs pendentes
                                        console.log(
                                          imagesCompleted + " / " + qtdImages
                                        ); // mostra o status de imagens concluida vs pendentes
                                        setLoadingImages(
                                          imagesCompleted + " / " + qtdImages
                                        );
                                        if (imagesCompleted === qtdImages) {
                                          // retorna como concluido apenas quantos os valores estiverem ok
                                          resolve();
                                        }
                                      })
                                      .catch((err) => {
                                        console.log("Erro ao obter URL" + err);
                                      });
                                  })
                                  .catch((err) => {
                                    console.log("Erro no upload: " + err);
                                  });
                              }
                            );

                            uploadCompleted.then(async () => {
                              await firebase
                                .firestore()
                                .collection(base)
                                .doc(index.id)
                                .update(cleanFirebaseData({
                                  checklist: checklist,
                                }))
                                .then(() => {
                                  console.log("Completed");
                                  logSistem("A APR foi criada", index.id);
                                  conclusionApr(index.id);
                                })
                                .catch((err) => {
                                  console.log(err);
                                });
                            });
                          });
                      }
                    });
                  });

                  if (containsImage === false) {
                    console.log(checklist);
                    await firebase
                      .firestore()
                      .collection(base)
                      .doc(index.id)
                      .update(cleanFirebaseData({
                        checklist: checklist,
                      }))
                      .then(async () => {
                        console.log("Completed not contains Image");
                        logSistem("A APR foi criado", index.id);
                        conclusionApr(index.id);
                      })
                      .catch((err) => {
                        console.log("❌ Erro ao inserir APR (sem imagens):", err);
                        toast.error("❌ Erro ao salvar APR no banco de dados");
                        togglePostModal();
                      });
                  }

                  if (id_assign !== undefined) {
                    updateAssignments();
                  }
                })
                .catch((err) => {
                  console.log("❌ Erro geral no processo:", err);
                  toast.error("❌ Erro no processo de conclusão da APR");
                  togglePostModal();
                });
            })
            .catch((err) => {
              console.log("❌ Erro ao inserir informações no SITE:", err);
              toast.error("❌ Erro ao atualizar informações do site");
              togglePostModal();
            });
        })
        .catch((err) => {
          console.log("❌ Erro ao inserir ID:", err);
          toast.error("❌ Erro ao gerar ID da APR");
          togglePostModal();
        });
    } catch (error) {
      console.error("❌ Erro crítico em insertData:", error);
      toast.error(`❌ Erro crítico: ${error.message || 'Falha inesperada'}`);
      togglePostModal();
    }
  }

  // função de monitoramento de upload de imagens
  function trackUpload(upload) {
    return new Promise((resolve, reject) => {
      // promise para retornar somente quando concluido.
      upload.on(
        "state_changed",
        (snapshot) => {
          let percent =
            ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(
              2
            ) + "%"; // exibe em porcentagem o processo de upload
          console.log(percent);
        },
        (error) => {
          toast.error("Erro ao carregar imagem !");
          console.log(error);
          reject("Erro ao carregar imagem", error);
          document.getElementById("modalLoading").style.display = "none";
        },
        () => {
          resolve(); // retorna quando concluido a imagem
        }
      );
    });
  }

  function verifyContainsImage() {
    let containsImage = false;
    questions.forEach(async (area) => {
      area[1].forEach(async (question) => {
        // verifica se contem imagem
        if (question.images && question.images.length > 0) {
          containsImage = true;
        }
      });
    });

    return containsImage;
  }

  function calculatePontos() {
    let peso = 0;
    questions.forEach(async (area) => {
      area[1].forEach(async (question) => {
        if (question.resp !== "N/A" && question.resp !== "" && question.resp !== question.respGabarito) {
          peso = peso + question.peso;
        }
      });
    });

    return peso;
  }

  async function getPerimetro(lat, lng) {
    // Se não temos coordenadas (geolocalização não habilitada), retornar mensagem apropriada
    if (!lat || !lng) {
      return "Geolocalização não disponível";
    }

    try {
      const center = [parseFloat(lat), parseFloat(lng)];
      const radiusInM = 1 * 1000;

      let latitude = parseFloat(siteInfo.Latitude.replace(",", "."));
      let longitude = parseFloat(siteInfo.Longitude.replace(",", "."));

      console.log('Coordenadas do site:', latitude, longitude);
      console.log('Coordenadas atuais:', center);

      const distanceInKm = geofire.distanceBetween([latitude, longitude], center);
      const distanceInM = distanceInKm * 1000;

      console.log('Distância calculada:', distanceInM, 'metros');

      if (distanceInM <= radiusInM) {
        return "Esta dentro do Perimetro";
      } else {
        return "fora perimetro";
      }
    } catch (error) {
      console.error('Erro ao calcular perímetro:', error);
      return "Erro no cálculo do perímetro";
    }
  }

  function conclusionApr(id) {
    if (activeOfflineAprId) {
      removeOfflineAprRecord(activeOfflineAprId);
      clearOfflineAprEditSession();
      setActiveOfflineAprId(null);
    }

    // Função helper para esconder elemento com verificação
    const hideElement = (elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = "none";
      } else {
        console.warn(`Elemento não encontrado: ${elementId}`);
      }
    };

    // Função helper para mostrar elemento com verificação
    const showElement = (elementId, displayType = "flex") => {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = displayType;
      } else {
        console.warn(`Elemento não encontrado: ${elementId}`);
      }
    };

    showElement("container-conclusion");
    hideElement("container-questions");
    hideElement("container-save");
    hideElement("container-motivo");
    setAprSalva(true);

    if (currentChecklist?.includes('PGR')) {
      hideElement("container-pgr");
    }

    if (currentChecklist === "LOJA" || currentChecklist === "LOJA DEALER") {
      hideElement("container-loja");
    }

    hideElement("container");
    hideElement("modalLoading");

    var container = document.getElementById("container-conclusion");
    if (!container) {
      console.error("Container de conclusão não encontrado!");
      return;
    }

    var root = createRoot(container);

    let peso = calculatePontos();
    let classificacao = "";

    if (peso < 10) {
      classificacao = `Risco Baixo - RB`;
    } else if (peso >= 10 && peso < 40) {
      classificacao = `Risco Médio - RM`;
    } else if (peso >= 40 && peso < 80) {
      classificacao = `Risco Alto - RA`;
    } else if (peso >= 80) {
      classificacao = `Risco Extremo - RE`;
    }

    return root.render(
      <Card
        elevation={0}
        sx={{
          background: "#ffffff",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
          border: "1px solid #e2e8f0",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            {/* Título */}
            <Box sx={{ textAlign: "center" }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 500, 
                  color: "#667eea",
                  mb: 1.5,
                  letterSpacing: "-0.3px",
                  fontSize: "1.5rem"
                }}
              >
                APR Finalizada com Sucesso
              </Typography>
            </Box>

            {/* Informações */}
            <Stack spacing={2.5} sx={{ width: "100%" }}>
              {/* ID */}
              <Box 
                sx={{ 
                  p: 2.5, 
                  backgroundColor: "#f8fbff", 
                  borderRadius: 1.5,
                  borderLeft: "3px solid #667eea",
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: "#94a3b8", 
                    fontWeight: 500, 
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontSize: "0.7rem"
                  }}
                >
                  ID da APR
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 400, 
                    color: "#667eea", 
                    mt: 0.75,
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    letterSpacing: "0.5px"
                  }}
                >
                  {id}
                </Typography>
              </Box>

              {/* Classificação */}
              <Box 
                sx={{ 
                  p: 2.5, 
                  backgroundColor: "#f8fbff", 
                  borderRadius: 1.5,
                  borderLeft: "3px solid #764ba2",
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: "#94a3b8", 
                    fontWeight: 500, 
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontSize: "0.7rem"
                  }}
                >
                  Classificação de Risco
                </Typography>
                <Box sx={{ mt: 0.75, display: "flex", justifyContent: "flex-start", gap: 1 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      backgroundColor: "#f0f3ff",
                      color: "#667eea",
                      borderRadius: 1,
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      border: "1px solid #e0e7ff"
                    }}
                  >
                    {classificacao}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Stack>
        </CardContent>

        <CardActions 
          sx={{ 
            bgcolor: "#ffffff", 
            justifyContent: "center", 
            gap: 2,
            flexWrap: "wrap",
            p: 3,
            borderTop: "1px solid #e2e8f0"
          }}
        >
          <Button
            variant="outlined"
            href="/aprs"
            startIcon={<FiArrowLeft size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.92rem",
              borderColor: "#8a42e7",
              color: "#581c87",
              borderRadius: "10px",
              minWidth: 170,
              py: 1,
              px: 2.5,
              "&:hover": {
                borderColor: "#6e06f7",
                color: "#43057e",
                backgroundColor: "#f3e8ff"
              }
            }}
          >
            Voltar para APRs
          </Button>
          <Button
            variant="contained"
            href={`/open/${id}`}
            startIcon={<FiEye size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.92rem",
              background: "linear-gradient(135deg, #8a42e7 0%, #581c87 100%)",
              borderRadius: "10px",
              minWidth: 170,
              py: 1,
              px: 2.5,
              boxShadow: "0 8px 18px rgba(88, 28, 135, 0.22)",
              "&:hover": {
                background: "linear-gradient(135deg, #6e06f7 0%, #43057e 100%)",
                boxShadow: "0 10px 24px rgba(88, 28, 135, 0.3)"
              }
            }}
          >
            Visualizar APR
          </Button>
        </CardActions>
      </Card>
    );
  }

  function dropdownArea(indexA) {
    let element = document.getElementById(`container-${indexA}`).style.display;
    document.getElementById(`container-${indexA}`).style.display =
      element === "none" ? "block" : "none";
  }

  function loadIndexedDB() {
    // Abrir ou criar um banco de dados no IndexedDB
    var request = indexedDB.open("SaveAPR", 1);
    var db;

    request.onerror = function (event) {
      console.error("Erro ao abrir o banco de dados:", event.target.error);
    };

    request.onsuccess = function (event) {
      db = event.target.result;

      // Função para ler o objeto do IndexedDB
      function lerObjetoDoIndexedDB(id) {
        var transaction = db.transaction(["dados"], "readonly");
        var objectStore = transaction.objectStore("dados");
        var request = objectStore.get(id);

        request.onsuccess = function (event) {
          var objeto = event.target.result;
          if (objeto) {
            // delete objeto.id;
            let newObj = [];
            let date;
            try {
              date = new Date(objeto.inicio);
            } catch (error) {
              console.log("Erro ao converter data" + error);
            }
            setInicio(date);
            document.getElementById("selectSite").value = objeto.tipo_site;
            setSelectedChecklist(objeto.tipo_site || "");
            setLoadedChecklist(objeto.tipo_site || "");
            setMotivoAPR(objeto.motivo_apr);
            delete objeto.id;
            delete objeto.inicio;
            delete objeto.tipo_site;
            delete objeto.motivo_apr;
            Object.entries(objeto).forEach((doc, index) => {
              newObj.push(doc[1]);
            });
            setQuestions(newObj);
            document.getElementById("container-questions").style.display =
              "flex";
            document.getElementById("container").style.display = "flex";
          } else {
            alert("Voce nao tem nenhuma APR salva.");
            console.log("Usuario não possui APR Salva");
          }
        };

        request.onerror = function (event) {
          console.error(
            "Erro ao ler o objeto do IndexedDB:",
            event.target.error
          );
        };
      }

      // Chamar a função para ler o objeto do IndexedDB
      lerObjetoDoIndexedDB(1); // Passar o ID do objeto que deseja ler
    };

    setQuestions(questions);
  }

  function saveIndexedDB(button) {
    let questiosSave = {
      id: 1,
      inicio: inicio,
      motivo_apr: motivoAPR,
      tipo_site: currentChecklist,
      ...questions,
    };

    // Abrir ou criar um banco de dados no IndexedDB
    var request = indexedDB.open("SaveAPR", 1);
    var db;

    request.onerror = function (event) {
      console.error("Erro ao abrir o banco de dados:", event.target.error);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      // Cria uma nova tabela (object store) chamada "dados"
      var objectStore = db.createObjectStore("dados", { keyPath: "id" });
    };

    request.onsuccess = function (event) {
      db = event.target.result;

      // Função para salvar/atualizar o objeto JSON no IndexedDB
      function salvarObjetoNoIndexedDB(objeto) {
        var transaction = db.transaction(["dados"], "readwrite");
        var objectStore = transaction.objectStore("dados");
        var request = objectStore.put(objeto);
        request.onsuccess = function (event) {
          toast.success(button);
          // toast.success('APR salvo/atualizado com sucesso.');
        };
        request.onerror = function (event) {
          toast.error(
            "Erro ao salvar/atualizar o objeto no IndexedDB:",
            event.target.error
          );
          console.log("Erro ao salvar/atualizar o objeto no IndexedDB:");
        };
      }
      // Função para realizar as atualizações no objeto
      function realizarAtualizacoes(objeto) {
        salvarObjetoNoIndexedDB(objeto);
      }
      // Verificar se o objeto já existe no IndexedDB
      function verificarObjetoExistente() {
        var transaction = db.transaction(["dados"], "readonly");
        var objectStore = transaction.objectStore("dados");
        var request = objectStore.get(1); // Obter o objeto pelo ID (1)
        request.onsuccess = function (event) {
          var objetoExistente = event.target.result;
          if (objetoExistente) {
            // Se o objeto já existe, realize as atualizações
            realizarAtualizacoes(questiosSave);
          } else {
            // Se o objeto não existe, salve-o no IndexedDB
            salvarObjetoNoIndexedDB(questiosSave);
          }
        };
        request.onerror = function (event) {
          console.error(
            "Erro ao verificar o objeto no IndexedDB:",
            event.target.error
          );
        };
      }
      // Chamada da função para verificar se o objeto já existe e realizar as atualizações ou salvá-lo
      verificarObjetoExistente();
    };
  }

  function selectMotivoAPR(e) {
    let value = e.target.value;
    if (value !== undefined || value !== "") {
      setMotivoAPR(value);
      document.getElementById("container").style.display = "flex";
      if (currentChecklist && loadedChecklist !== currentChecklist) {
        getQuestions(currentChecklist);
      }
    } else {
      setMotivoAPR(value);
      document.getElementById("container").style.display = "none";
    }
  }

  function enableQuestions(doc) {
    const isPGR = currentChecklist?.includes('PGR');
    const isVENEZA = currentChecklist?.includes("PROJETO VENEZA");
    const isLOJAUNIFICAD = currentChecklist?.includes("LOJA PROJ VENEZA");

    // Se não tiver estados no doc OU não tiver Estado no siteInfo, considera válido (true)
    const isEstadoValido = isPGR && (
      !doc.estados ||
      !siteInfo?.Estado ||
      doc.estados.includes(siteInfo.Estado)
    );

    // Se não tiver tipoLoja no doc, considera válido (true)
    const isTipoLojaValido = (isVENEZA || isLOJAUNIFICAD) && (
      !doc.tipoLoja ||
      doc.tipoLoja.includes(tipoLoja)
    );

    const valorDentroDoIntervalo = (valor, intervalo) => {
      if (!intervalo) return false;
      const convertido = valor / 100;
      return convertido > intervalo.min && convertido <= intervalo.max;
    };

    const atendeAlgumValor =
      valorDentroDoIntervalo(valorArmazenamento, doc.valorArmazenado) ||
      valorDentroDoIntervalo(valorTransporte, doc.valorTransporte) ||
      valorDentroDoIntervalo(valorSinistro, doc.valorSinistro) ||
      valorDentroDoIntervalo(valorEstoque, doc.valorEstoque);

    const exibition = (!isPGR && !isVENEZA) ||
      (isPGR && isEstadoValido && atendeAlgumValor) ||
      (isVENEZA && isTipoLojaValido && atendeAlgumValor);

    return exibition;
  }

  // Função para tentar novamente obter a geolocalização
  const retryGeolocation = () => {
    setGeolocationJustification("");
    setGeolocationError(null);
    setGeolocationEnabled(false); // Resetar para false até conseguir a localização
    setShowGeolocationModal(false);
    getGeolocation();
  };

  // Função para lidar com a justificativa da geolocalização
  const handleGeolocationJustification = () => {
    if (!geolocationJustification.trim()) {
      toast.error("Por favor, informe uma justificativa para continuar sem geolocalização");
      return;
    }

    // Marcar que a geolocalização não está habilitada, mas temos justificativa
    setGeolocationEnabled(false); // Importante: manter como false quando usando justificativa
    setShowGeolocationModal(false);
    toast.success("Justificativa registrada. Prosseguindo com a APR...");
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Header name="APLICAR APR" subtitle="Preencha as informações abaixo para criar uma nova APR" />

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Informações de Localização */}
        <Paper
          elevation={0}
          sx={{
            mt: 10,
            mb: 3,
            p: 3,
            border: '2px solid #8e24aa',
            borderRadius: 2,
            bgcolor: '#f7f7f7'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            📍 Informações de Localização
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: '#64748b',
              fontWeight: 500
            }}
          >
            Dados de endereço e coordenadas do local
          </Typography>

          <Grid container spacing={0}>
            {/* Linha 1: UNIDADE */}
            <Grid item xs={12} sx={{ mb: 3 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  UNIDADE
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.95rem'
                  }}
                >
                  {siteInfo.Nome}
                </Typography>
              </Box>
            </Grid>

            {/* Linha 2: ENDEREÇO */}
            <Grid item xs={12} sx={{ mb: 3 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  ENDEREÇO
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.95rem'
                  }}
                >
                  {siteInfo.Endereco}
                </Typography>
              </Box>
            </Grid>

            {/* Linha 3: UF e CIDADE (lilás - extremidades) */}
            <Grid container item xs={12} spacing={0} sx={{ mb: 3 }}>
              <Grid item xs={6} sx={{ background: '#7b1fa26e', padding: '20px' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  UF
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.95rem'
                  }}
                >
                  {siteInfo.Estado}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ background: '#7b1fa27c', padding: '20px' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  CIDADE
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.95rem'
                  }}
                >
                  {siteInfo.Cidade}
                </Typography>
              </Grid>
            </Grid>

            {/* Linha 4: ESTADO e CRITICIDADE */}
            <Grid container item xs={12} spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    ESTADO
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#0f172a',
                      mt: 0.5,
                      fontSize: '0.95rem'
                    }}
                  >
                    {siteInfo.Estado}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    CRITICIDADE
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#0f172a',
                      mt: 0.5,
                      fontSize: '0.95rem'
                    }}
                  >
                    {siteInfo.critical || 'BAIXO'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Linha 5: LATITUDE e LONGITUDE (cinza - extremidades) */}
            <Grid container item xs={12} spacing={0}>
              <Grid item xs={6} sx={{ background: '#c0c0c0', padding: '20px' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#059669',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  ✅ LATITUDE
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.85rem'
                  }}
                >
                  {siteInfo.Latitude}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ background: '#c0c0c08a', padding: '20px' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#059669',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  ✅ LONGITUDE
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    mt: 0.5,
                    fontSize: '0.85rem'
                  }}
                >
                  {siteInfo.Longitude}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Data e Status - esconde após salvar */}
        {!aprSalva && (
        <Box sx={{ background: '#f7f7f7', padding: '24px', borderRadius: '8px', border: 'solid, 2px, #8e24aa' }}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 500
                }}
              >
                📅 {lastAPR.data || new Date().toLocaleDateString('pt-BR')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500
                }}
              >
                ÚLTIMA APR ATIVA
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#e2e8f0',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#475569',
                  letterSpacing: '0.5px'
                }}
              >
                {lastAPR.motivo || 'OPINADA'}
              </Box>
            </Box>
          </Box>

          {/* Botões de Controle */}
          {/* <Box className="apr-history-card">
            <Box className="apr-history-header">
              <Typography variant="subtitle1">Historico de APRs</Typography>
              <Typography variant="caption">
                Ultimas APRs registradas para este site
              </Typography>
            </Box>

            {loadHistorico ? (
              historicoAPRs.length > 0 ? (
                <Box className="apr-history-list">
                  {historicoAPRs.map((aprHist) => (
                    <Box key={aprHist.id} className="apr-history-item">
                      <Box className="apr-history-main">
                        <Box className="apr-history-id">
                          <span>APR</span>
                          <strong>{aprHist.apr_id}</strong>
                        </Box>
                        <Box className="apr-history-info">
                          <strong>{aprHist.motivo}</strong>
                          <span>
                            {aprHist.created
                              ? `${format(aprHist.created.toDate(), "dd/MM/yyyy")} as ${format(aprHist.created.toDate(), "HH:mm")}`
                              : "Data nao informada"}
                          </span>
                        </Box>
                      </Box>

                      <Box className="apr-history-actions">
                        <Chip
                          size="small"
                          label={aprHist.status}
                          className={`apr-history-status status-${aprHist.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => visualizarAPR(aprHist.id)}
                        >
                          Visualizar
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box className="apr-history-empty">
                  Nenhuma APR anterior encontrada para este site.
                </Box>
              )
            ) : (
              <Box className="apr-history-empty">Carregando historico...</Box>
            )}
          </Box> */}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => loadIndexedDB()}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Carregar Salvo
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => saveIndexedDB("APR salvo/atualizado com sucesso.")}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  bgcolor: '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    bgcolor: '#2563eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                Salvar APR
              </Button>
            </Grid>
          </Grid>

          {/* Selects lado a lado */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Select
                  id="selectMotivo"
                  value={motivoAPR}
                  onChange={(e) => selectMotivoAPR(e)}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem disabled value="">
                    Selecione uma indicação...
                  </MenuItem>
                  <MenuItem value="Mapa de Calor">Mapa de Calor</MenuItem>
                  <MenuItem value="Retrofit">Retrofit</MenuItem>
                  <MenuItem value="Rota Critica DWDM">Rota Critica DWDM</MenuItem>
                  <MenuItem value="Projeto Veneza">Projeto Veneza</MenuItem>
                  <MenuItem value="TurnKey">TurnKey</MenuItem>
                  <MenuItem value="Conectividade nos Sites">Conectividade nos Sites</MenuItem>
                  <MenuItem value="Torre Segura">Torre Segura</MenuItem>
                  <MenuItem value="Internalização Loja Dealer">Internalização Loja Dealer</MenuItem>
                  <MenuItem value="Estoque Avançado">Estoque Avançado</MenuItem>
                  <MenuItem value="Instalação Tag">Instalação Tag</MenuItem>
                  <MenuItem value="Sites Criticos (Mapa de Proteção)">Sites Criticos (Mapa de Proteção)</MenuItem>
                  <MenuItem value="Não Opinada">Não Opinada</MenuItem>
                  <MenuItem value="Opinada">Opinada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} id="container" style={{ display: "none" }}>
              <FormControl fullWidth>
                <Select
                  id="selectSite"
                  value={currentChecklist}
                  onChange={(e) => getQuestions(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem disabled value="">
                    Selecione um checklist...
                  </MenuItem>
                  <ListSubheader>Mais Utilizados</ListSubheader>
                  {listQuestions.filter(doc => doc.data().ativo === true).map((value, index) => {
                    if (maisUtilizados.includes(index)) {
                      return (
                        <MenuItem key={index} value={value.id}>
                          {value.id}
                        </MenuItem>
                      );
                    }
                    return null;
                  })}
                  <ListSubheader>Outros</ListSubheader>
                  {listQuestions.filter(doc => doc.data().ativo === true).map((value, index) => {
                    if (!maisUtilizados.includes(index)) {
                      return (
                        <MenuItem key={index} value={value.id}>
                          {value.id}
                        </MenuItem>
                      );
                    }
                    return null;
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        )}

        {currentChecklist && currentChecklist.includes("PGR") && !aprSalva && (
          <Paper
            id="container-pgr"
            elevation={0}
            sx={{
              mt: 3,
              mb: 3,
              p: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              bgcolor: '#ffffff'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              Informações PGR
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="selectValorArmazenamento"
                  label="Valor Armazenamento"
                  type="text"
                  value={new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(valorArmazenamento / 100)}
                  onChange={(e) =>
                    setValorArmazenamento(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Valor de Armazenamento"
                  sx={{ borderRadius: 2 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="selectValorTransporte"
                  label="Valor Transporte"
                  type="text"
                  value={new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(valorTransporte / 100)}
                  onChange={(e) =>
                    setValorTransporte(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Valor de Transporte"
                  sx={{ borderRadius: 2 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="selectValorSinistro"
                  label="Valor Sinistro"
                  type="text"
                  value={new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(valorSinistro / 100)}
                  onChange={(e) =>
                    setValorSinistro(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Valor do Sinistro"
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {currentChecklist && lojaChecklists.includes(currentChecklist) && !aprSalva && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              bgcolor: '#ffffff'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              Informações da Loja
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Select
                    id="selectTipoLoja"
                    value={tipoLoja}
                    onChange={(e) => setTipoLoja(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem disabled value="">
                      Selecione um tipo de loja...
                    </MenuItem>
                    <MenuItem value="LOJA ESTOQUE ZERO">LOJA ESTOQUE ZERO</MenuItem>
                    <MenuItem value="LOJA GALERIA PISO TÉRREO">LOJA GALERIA PISO TÉRREO</MenuItem>
                    <MenuItem value="GALERIA PISO SUPERIOR">GALERIA PISO SUPERIOR</MenuItem>
                    <MenuItem value="LOJA RUA">LOJA RUA</MenuItem>
                    <MenuItem value="LOJA SHOP PISO TERREO">LOJA SHOP PISO TERREO</MenuItem>
                    <MenuItem value="LOJA SHOP PISO SUPERIOR">LOJA SHOP PISO SUPERIOR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="selectValorEstoque"
                  label="Valor Estoque"
                  type="text"
                  value={new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(valorEstoque / 100)}
                  onChange={(e) => {
                    setValorEstoque(e.target.value.replace(/\D/g, ""))
                  }}
                  placeholder="Valor de Estoque"
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {currentChecklist && lojaChecklists.includes(currentChecklist) && !aprSalva && (
          <div className="container" id="container-loja">
            <label name="valor-estoque">
              Tipo de Loja
              <select
                id="selectTipoLoja"
                defaultValue={""}
                value={tipoLoja}
                onChange={(e) => setTipoLoja(e.target.value)}
              >
                <option disabled value={""}>
                  Selecione um tipo de loja...
                </option>
                <option value={"LOJA ESTOQUE ZERO"}>LOJA ESTOQUE ZERO</option>
                <option value={"LOJA GALERIA PISO TÉRREO"}>LOJA GALERIA PISO TÉRREO</option>
                <option value={"GALERIA PISO SUPERIOR"}>GALERIA PISO SUPERIOR</option>
                <option value={"LOJA RUA"}>LOJA RUA</option>
                <option value={"LOJA SHOP PISO TERREO"}>LOJA SHOP PISO TERREO</option>
                <option value={"LOJA SHOP PISO SUPERIOR"}>LOJA SHOP PISO SUPERIOR</option>
              </select>
            </label>
            <label name="valor-estoque">
              Valor Estoque
              <input
                id="selectValorEstoque"
                name="valor-estoque"
                type="text"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorEstoque / 100)}
                onChange={(e) => {
                  setValorEstoque(e.target.value.replace(/\D/g, ""))
                }
                }
                placeholder="Valor de Estoque"
              />
            </label>
          </div>
        )}

        <div
          className="container"
          id="container-questions"
          style={{ display: "none", width: "100%", margin: "0 auto" }}
        >
          <div id="checklist" className="form-new">
            {questions.map((area, indexA) => {
              return (
                <div key={indexA} className="question">
                  <i id="button-area" onClick={() => dropdownArea(indexA)}>
                    {area[0]}
                  </i>
                  <span id={`container-${indexA}`} style={{ display: "none" }}>
                    {Array.isArray(area[1]) && area[1].map((doc, indexDoc) => {
                      if (enableQuestions(doc) === true) {
                        return (
                          <div
                            key={indexDoc}
                            className="container-perg question"
                          >
                            <div className="question-title-row">
                              <span className="question-title-text">
                                {indexDoc + 1} - {doc.question}
                              </span>
                              <span
                                className={`question-required-badge ${
                                  doc.isRequired === true
                                    ? "is-required"
                                    : "is-optional"
                                }`}
                                title={
                                  doc.isRequired === true
                                    ? "Pergunta obrigatoria"
                                    : "Pergunta opcional"
                                }
                              >
                                {doc.isRequired === true ? (
                                  <FiAlertCircle size={15} />
                                ) : (
                                  <FiInfo size={15} />
                                )}
                                <span>
                                  {doc.isRequired === true
                                    ? "Obrigatoria"
                                    : "Opcional"}
                                </span>
                              </span>
                            </div>
                            <div className="question">
                              {doc.selectOptions === true && doc.answers && (
                                <>
                                  <label>
                                    <input
                                      className="yes"
                                      type="radio"
                                      name={indexA + "-" + doc.questionId}
                                      value={doc.answers[0]}
                                      defaultChecked={
                                        doc.resp === "Sim" ? true : false
                                      }
                                      onChange={(e) =>
                                        radioSetValue(doc, indexA, e)
                                      }
                                    />
                                    <FiCheck size={25} /> {doc.answers[0]}
                                  </label>
                                  <label>
                                    <input
                                      className="no"
                                      type="radio"
                                      name={indexA + "-" + doc.questionId}
                                      value={doc.answers[1]}
                                      defaultChecked={
                                        doc.resp === "Não" ? true : false
                                      }
                                      onChange={(e) =>
                                        radioSetValue(doc, indexA, e)
                                      }
                                    />
                                    <FiX size={25} /> {doc.answers[1]}
                                  </label>
                                  <label>
                                    <input
                                      className="na"
                                      type="radio"
                                      name={indexA + "-" + doc.questionId}
                                      value={"N/A"}
                                      defaultChecked={
                                        doc.resp === "N/A" ? true : false
                                      }
                                      onChange={(e) =>
                                        radioSetValue(doc, indexA, e)
                                      }
                                    />
                                    <FiX size={25} />{" "}
                                    {doc.answers[2] ? doc.answers[2] : "N/A"}
                                  </label>
                                </>
                              )}
                              {((doc.inputImages === true ||
                                doc.inputImagesLibrary === true ||
                                (Array.isArray(doc.images) ? doc.images : []).length > 0)) && (
                                <ul
                                  className="imageList"
                                  id={
                                    "inputimg_" + doc.questionId + "_" + indexA
                                  }
                                >
                                  {doc.inputImages === true && (
                                    <li
                                      className="notremove"
                                      style={{ marginRight: 10 }}
                                    >
                                      <CameraComponent
                                        saveIndexedDB={saveIndexedDB}
                                        questions={questions}
                                        doc={doc}
                                        indexA={indexA}
                                      />
                                    </li>
                                  )}
                                  {(doc.inputImages === true ||
                                    doc.inputImagesLibrary === true) && (
                                    <li className="notremove">
                                      <InputComponent
                                        saveIndexedDB={saveIndexedDB}
                                        questions={questions}
                                        doc={doc}
                                        indexA={indexA}
                                      />
                                    </li>
                                  )}
                                  {(Array.isArray(doc.images) ? doc.images : []).filter(Boolean).length > 0 &&
                                    (Array.isArray(doc.images) ? doc.images : []).filter(Boolean).map((img, indexImg) => {
                                      return (
                                        <li
                                          key={
                                            doc.questionId +
                                            "_image_" +
                                            indexImg
                                          }
                                          id={
                                            doc.questionId +
                                            "_image_" +
                                            indexImg
                                          }
                                          style={{
                                            background: `url(${img?.data || URL.createObjectURL(
                                              img
                                            )}) round`,
                                          }}
                                        >
                                          <i
                                            id={
                                              doc.questionId +
                                              "_removeimg_" +
                                              indexImg
                                            }
                                            onClick={() => {
                                              document
                                                .getElementById(
                                                  doc.questionId +
                                                  "_image_" +
                                                  indexImg
                                                )
                                                .remove();
                                              removeImg(
                                                indexA,
                                                indexDoc,
                                                img
                                              );
                                            }}
                                          >
                                            X
                                          </i>
                                        </li>
                                      );
                                    })}
                                </ul>
                              )}
                              {doc.textarea === true && (
                                <textarea
                                  id={indexA + "_textarea_" + doc.questionId}
                                  type="text"
                                  placeholder="Descreva o problema (obrigatorio)."
                                  style={{
                                    display:
                                      doc.resp !== "" ? "block" : "block",
                                  }}
                                  onChange={(e) =>
                                    textareaValue(doc, indexA, e)
                                  }
                                  defaultValue={
                                    doc.respTextArea !== "" &&
                                      doc.resp !== doc.respGabarito
                                      ? doc.respTextArea
                                      : ""
                                  }
                                />
                              )}
                              {doc.inputNumber === true && (
                                <FormControl
                                  size="small"
                                  sx={{ marginTop: 1 }}
                                  id={indexA + "_numberarea_" + doc.questionId}
                                >
                                  <TextField
                                    id="outlined-basic"
                                    label={"Quantidade"}
                                    size="small"
                                    fullWidth
                                    type="number"
                                    onChange={(e) =>
                                      inputNumber(doc, indexA, e)
                                    }
                                    defaultValue={
                                      doc.respInputNumber !== "" &&
                                        doc.resp !== doc.respGabarito
                                        ? doc.respInputNumber
                                        : ""
                                    }
                                  />
                                </FormControl>
                              )}
                              {doc.listCheck === true && (
                                <FormControl
                                  size="small"
                                  sx={{ marginTop: 1, width: { xs: '100%', sm: '300px', md: '400px' } }}
                                  id={`${indexA}_select_${doc.questionId}`}
                                >
                                  <Select
                                    labelId="demo-multiple-checkbox-label"
                                    id="demo-multiple-checkbox"
                                    multiple={doc.multipleCheck}
                                    value={
                                      doc.optionListResp && doc.optionListResp.length > 0
                                        ? doc.optionListResp
                                        : [""]
                                    }
                                    onChange={(e) => handleChangeSelect(doc, indexA, e)}
                                    renderValue={(selected) => (
                                      <Box sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {selected.filter((value) => value !== "").join(", ")}
                                      </Box>
                                    )}
                                    MenuProps={MenuProps}
                                    sx={{
                                      whiteSpace: 'normal',
                                      wordWrap: 'break-word',
                                    }}
                                  >
                                    <MenuItem key={""} value={""} sx={{ height: "30px" }} disabled>
                                      <Checkbox checked={(doc.optionListResp || []).includes("")} disabled />
                                      <ListItemText
                                        primary={"Selecione uma opção"}
                                        sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                                      />
                                    </MenuItem>

                                    {(doc.optionList || []).map((name) => (
                                      <MenuItem
                                        key={name}
                                        value={name}
                                        sx={{
                                          alignItems: 'center',
                                          height: 'auto',
                                          py: 1,
                                        }}
                                      >
                                        <Checkbox
                                          checked={(doc.optionListResp || []).includes(name)}
                                          sx={{ paddingTop: '4px' }}
                                        />
                                        <ListItemText
                                          primary={name}
                                          sx={{
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            margin: 0,
                                          }}
                                        />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              )}
                            </div>
                            <i className="clearQuestion" onClick={() => clearQuestion(doc, indexA)}>
                              {" "}
                              Limpar{" "}
                            </i>
                          </div>
                        );
                      }
                      return null; // Retorna null quando enableQuestions é false
                    })}
                  </span>
                </div>
              );
            })}
            <button
              className="submit-apr"
              onClick={async () => {
                try {
                  const hasUnanswered = hasRequired();
                  if (hasUnanswered) {
                    return;
                  }
                  await submitWithErrorHandling();
                } catch (error) {
                  console.error("❌ Erro crítico ao concluir APR:", error);
                  toast.error(`❌ Erro crítico: ${error.message || 'Falha inesperada ao concluir APR'}`);
                  togglePostModal(); // Fechar modal de loading se estiver aberto
                }
              }}
            >
              Concluir APR
            </button>
          </div>
        </div>

        <Box
          id="container-conclusion"
          sx={{
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "auto",
            gap: 3,
            mt: 3,
          }}
        />

        {/* Modal de Geolocalização */}
        {showGeolocationModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Geolocalização Requerida</h3>
                <FiX
                  size={20}
                  onClick={() => setShowGeolocationModal(false)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="modal-body">
                {geolocationError ? (
                  <div className="error-message">
                    <FiAlertCircle size={20} color="#f44336" />
                    <span>Erro na geolocalização: {geolocationError}</span>
                  </div>
                ) : (
                  <div className="warning-message">
                    <FiAlertCircle size={20} color="#ff9800" />
                    <span>A geolocalização é necessária para realizar a APR</span>
                  </div>
                )}

                <div className="justification-section">
                  <label htmlFor="geolocation-justification">
                    Justificativa para continuar sem geolocalização:
                  </label>
                  <textarea
                    id="geolocation-justification"
                    value={geolocationJustification}
                    onChange={(e) => setGeolocationJustification(e.target.value)}
                    placeholder="Descreva o motivo pelo qual não é possível habilitar a geolocalização..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-retry"
                  onClick={retryGeolocation}
                >
                  Tentar Novamente
                </button>
                <button
                  className="btn-continue"
                  onClick={handleGeolocationJustification}
                  disabled={!geolocationJustification.trim()}
                >
                  Continuar com Justificativa
                </button>
              </div>
            </div>
          </div>
        )}

        <Modal_Justificativa
          openModal={openModalJust}
          setModal={setOpenModalJust}
          setJustificativa={setJustificativa}
        />

        {showPostModal && <ModalLoading carregamento={loadingImages} />}
      </Container>
    </Box>
  );
}
