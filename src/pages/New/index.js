import { useContext, useEffect, useState } from "react";
import { FiClipboard, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { toast } from "react-toastify";
import { format } from "date-fns";
import * as geofire from "geofire-common";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import "./new.scss";

import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import ModalLoading from "../../components/Modal_Loading";
import Modal_Justificativa from "../../components/Modal_Justificativa";
import {
  clearOfflineAprEditSession,
  getOfflineAprById,
  getOfflineAprEditSession,
  getUserOfflineAprs,
  hydrateQuestionsFromOffline,
  removeOfflineAprRecord,
  saveOfflineAprRecord,
  serializeQuestionsForOffline,
  updateOfflineAprRecord,
} from "../../services/offlineAprStorage";
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
  Chip,
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

  const base = "aprs-producao"; //aprs-producao
  const storage = "images"; //images

  //question
  const [questions, setQuestions] = useState([]);
  const [listQuestions, setListQuestions] = useState([]);

  const [motivoAPR, setMotivoAPR] = useState("");

  const [siteInfo, setSiteInfo] = useState([]);
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isEditingOffline, setIsEditingOffline] = useState(false);
  const [editingAPRId, setEditingAPRId] = useState(null);
  const [autoSyncRequested, setAutoSyncRequested] = useState(false);
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);

  const maisUtilizados = [2, 3, 5, 6, 7, 8, 10, 11, 18, 20];

  const loadOfflineAPRForEdit = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const editOfflineId = urlParams.get("edit_offline");

      if (!editOfflineId) {
        return;
      }

      const sessionApr = getOfflineAprEditSession();
      const storedApr =
        (sessionApr && sessionApr.id === editOfflineId && sessionApr) ||
        getOfflineAprById(editOfflineId);

      if (!storedApr) {
        toast.error("APR offline não encontrada.");
        return;
      }

      const hydratedQuestions = await hydrateQuestionsFromOffline(
        storedApr.questions || []
      );

      setQuestions(hydratedQuestions);
      setMotivoAPR(storedApr.motivoAPR || "");
      setSiteInfo(storedApr.siteInfo || []);
      setLocation(storedApr.location || []);
      setInicio(
        storedApr.inicio ? new Date(storedApr.inicio) : new Date()
      );
      setJustificativa(storedApr.justificativa || undefined);
      setValorArmazenamento(storedApr.valorArmazenamento || "");
      setValorTransporte(storedApr.valorTransporte || "");
      setValorSinistro(storedApr.valorSinistro || "");
      setTipoLoja(storedApr.tipoLoja || "");
      setValorEstoque(storedApr.valorEstoque || "0");
      setGeolocationEnabled(Boolean(storedApr.geolocationEnabled));
      setGeolocationJustification(storedApr.geolocationJustification || "");
      setGeolocationError(storedApr.geolocationError || null);
      setIsEditingOffline(true);
      setEditingAPRId(editOfflineId);
      setAutoSyncRequested(urlParams.get("auto_sync") === "1");

      setTimeout(() => {
        const selectSite = document.getElementById("selectSite");
        if (selectSite && storedApr.siteInfo?.tipoSite) {
          selectSite.value = storedApr.siteInfo.tipoSite;
        }

        const questionsContainer = document.getElementById("container-questions");
        if (questionsContainer) {
          questionsContainer.style.display = "flex";
        }

        const mainContainer = document.getElementById("container");
        if (mainContainer) {
          mainContainer.style.display = "flex";
        }
      }, 250);

      clearOfflineAprEditSession();
      toast.info("APR offline carregada.");
    } catch (error) {
      console.error("Erro ao carregar APR offline:", error);
      toast.error("Erro ao carregar APR offline.");
    }
  };

  const persistOfflineAPR = async () => {
    const serializedQuestions = await serializeQuestionsForOffline(questions);

    const offlineAprData = {
      id: editingAPRId || `offline_${Date.now()}`,
      siteId: id,
      idAssign: id_assign,
      siteInfo,
      questions: serializedQuestions,
      motivoAPR,
      location,
      inicio: inicio
        ? new Date(inicio).toISOString()
        : new Date().toISOString(),
      user,
      timestamp: new Date().toISOString(),
      status: "offline",
      justificativa: justificativa || null,
      valorArmazenamento,
      valorTransporte,
      valorSinistro,
      tipoLoja,
      valorEstoque,
      geolocationEnabled,
      geolocationJustification,
      geolocationError,
    };

    if (editingAPRId) {
      const updatedApr = updateOfflineAprRecord(editingAPRId, offlineAprData);
      return updatedApr?.id || null;
    }

    const savedApr = saveOfflineAprRecord(offlineAprData);
    return savedApr.id;
  };

  useEffect(() => {
    loadOfflineAPRForEdit();

    const handleOnline = () => {
      setIsOffline(false);
      const pendingOfflineAprs = getUserOfflineAprs(user?.uid);
      if (pendingOfflineAprs.length > 0) {
        toast.info(
          `Conexão restabelecida. Você tem ${pendingOfflineAprs.length} APR(s) offline pendente(s).`
        );
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("Conexão perdida. O envio será salvo localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [id, user?.uid]);

  useEffect(() => {
    if (
      !autoSyncRequested ||
      autoSyncTriggered ||
      isOffline ||
      !isEditingOffline ||
      questions.length === 0 ||
      !siteInfo ||
      Object.keys(siteInfo).length === 0
    ) {
      return;
    }

    setAutoSyncTriggered(true);

    const timer = setTimeout(() => {
      toast.info("Iniciando sincronização da APR offline.");
      submitWithErrorHandling();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    autoSyncRequested,
    autoSyncTriggered,
    isOffline,
    isEditingOffline,
    questions,
    siteInfo,
  ]);

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
        setSiteInfo(snapshot.data());
        if (snapshot.data().last_apr !== undefined) {
          setLastAPR({
            data: format(snapshot.data().last_apr.toDate(), "dd/MM/yyyy HH:mm"),
            motivo: snapshot.data().last_motivo,
          });
        }
        setInicio((currentInicio) => currentInicio || new Date());
      })
      .catch((error) => {
        console.log("DEU ALGUM ERRO!", error);
      });
  }

  async function getQuestions(snapshot) {
    // Verificar se a geolocalização está habilitada ou se há justificativa
    if (!geolocationEnabled && !geolocationJustification) {
      setShowGeolocationModal(true);
      return;
    }

    document.getElementById("container-questions").style.display = "flex";
    siteInfo.tipoSite = snapshot;

    await firebase
      .firestore()
      .collection("question")
      .doc(snapshot)
      .get()
      .then(async (item_question) => {
        const data = item_question.data();
        console.log(data);

        // Remover a propriedade 'ativo' do objeto data
        const { ativo, ...restoData } = data;

        const orderedEntries = Object.entries(restoData).sort((a, b) =>
          a[0].localeCompare(b[0])
        ).map(([key, value]) => {
          // Garantir que o valor seja sempre um array
          return [key, Array.isArray(value) ? value : []];
        });

        console.log(orderedEntries);
        setQuestions(orderedEntries);
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

    if (e.target.value === "N/A") {
      if (question.textarea === true) textarea.style.display = "none";
      if (question.inputImages === true) inputimage.style.display = "none";
      if (question.listCheck === true) inputSelectResp.style.display = "none";
      if (question.inputNumber === true) inputNumber.style.display = "none";
    } else if (e.target.value !== "") {
      if (question.textarea === true) textarea.style.display = "block";
      if (question.inputImages === true) inputimage.style.display = "flex";
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
        for (let index = 0; index < item.children.length; index++) {
          if (item.children.length > 1) {
            item.lastChild.remove();
          }
        }
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
    // Validar Tipo de Loja
    if (siteInfo.tipoSite && ["LOJA", "LOJA DEALER", "PROJETO VENEZA", "LOJA PROJ VENEZA"].includes(siteInfo.tipoSite)) {
      if (!tipoLoja || tipoLoja === "") {
        toast.error("O campo 'Tipo de Loja' é obrigatório");
        return true;
      }
    }
    
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

      if (isOffline) {
        const offlineAprId = await persistOfflineAPR();

        if (!offlineAprId) {
          toast.error("Erro ao salvar a APR offline.");
          return;
        }

        toast.success(
          isEditingOffline
            ? "APR offline atualizada com sucesso."
            : "APR salva offline. Ela poderá ser sincronizada depois."
        );
        window.location.href = "/aprs";
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
              console.log("ID Atual:", result);

              console.log({
                user_id: user,
                apr_id: result,
                site_id: siteInfo,
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
                site_id: siteInfo,
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

    if (isEditingOffline && editingAPRId) {
      removeOfflineAprRecord(editingAPRId);
      clearOfflineAprEditSession();
      setIsEditingOffline(false);
      setEditingAPRId(null);
      setAutoSyncRequested(false);
      setAutoSyncTriggered(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (siteInfo.tipoSite?.includes('PGR')) {
      hideElement("container-pgr");
    }

    if (siteInfo.tipoSite === "LOJA" || siteInfo.tipoSite === "LOJA DEALER") {
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
            gap: 1.5, 
            p: 3,
            borderTop: "1px solid #e2e8f0"
          }}
        >
          <Button
            variant="outlined"
            href="/aprs"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              borderColor: "#cbd5e1",
              color: "#64748b",
              py: 0.75,
              px: 2.5,
              "&:hover": {
                borderColor: "#667eea",
                color: "#667eea",
                backgroundColor: "#f8fbff"
              }
            }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            href={`/open/${id}`}
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              py: 0.75,
              px: 2.5,
              "&:hover": {
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
              }
            }}
          >
            Visualizar
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
            siteInfo.tipoSite = objeto.tipo_site;
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
      tipo_site: siteInfo.tipoSite,
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
    } else {
      setMotivoAPR(value);
      document.getElementById("container").style.display = "none";
    }
  }

  function enableQuestions(doc) {
    const isPGR = siteInfo?.tipoSite?.includes('PGR');
    const isVENEZA = siteInfo?.tipoSite?.includes("PROJETO VENEZA");
    const isLOJAUNIFICAD = siteInfo?.tipoSite?.includes("LOJA PROJ VENEZA");

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

  const showPgrFields = Boolean(siteInfo.tipoSite?.includes("PGR"));
  const showLojaFields = Boolean(
    siteInfo.tipoSite &&
      ["LOJA", "LOJA DEALER", "PROJETO VENEZA", "LOJA PROJ VENEZA"].includes(
        siteInfo.tipoSite
      )
  );

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Header name="APLICAR APR" subtitle="Preencha as informações abaixo para criar uma nova APR" />

      <Container maxWidth="lg" className="new-apr-shell" sx={{ py: 3 }}>
        {(isOffline || isEditingOffline) && (
          <Alert
            severity={isOffline ? "warning" : "info"}
            className="new-apr-status-alert"
            sx={{ mt: 10, mb: 3, borderRadius: 2 }}
          >
            {isOffline
              ? "Sem conexão: ao concluir, a APR será salva localmente."
              : "Você está editando uma APR offline pendente de sincronização."}
          </Alert>
        )}

        <Paper
          elevation={0}
          className="new-apr-overview-card"
          sx={{ mt: 10, mb: 3 }}
        >
          <Box className="new-apr-overview-header">
            <Box>
              <Typography variant="h6" className="new-apr-card-title">
                Informações do local
              </Typography>
              <Typography variant="body2" className="new-apr-card-subtitle">
                Confirme os dados do site antes de selecionar o checklist da APR.
              </Typography>
            </Box>

            <Chip
              label={
                geolocationEnabled
                  ? "Geolocalização ativa"
                  : geolocationJustification
                    ? "Sem geolocalização"
                    : "Geolocalização pendente"
              }
              color={
                geolocationEnabled
                  ? "success"
                  : geolocationJustification
                    ? "warning"
                    : "default"
              }
              variant={geolocationEnabled ? "filled" : "outlined"}
              size="small"
            />
          </Box>

          <Box className="new-apr-overview-grid">
            <Box className="new-apr-overview-item new-apr-overview-item--wide">
              <span className="new-apr-overview-label">Unidade</span>
              <strong>{siteInfo.Nome || "-"}</strong>
            </Box>

            <Box className="new-apr-overview-item new-apr-overview-item--wide">
              <span className="new-apr-overview-label">Endereço</span>
              <strong>{siteInfo.Endereco || "-"}</strong>
            </Box>

            <Box className="new-apr-overview-item">
              <span className="new-apr-overview-label">UF</span>
              <strong>{siteInfo.Estado || "-"}</strong>
            </Box>

            <Box className="new-apr-overview-item">
              <span className="new-apr-overview-label">Cidade</span>
              <strong>{siteInfo.Cidade || "-"}</strong>
            </Box>

            <Box className="new-apr-overview-item">
              <span className="new-apr-overview-label">Criticidade</span>
              <strong>{siteInfo.critical || "Baixo"}</strong>
            </Box>

            <Box className="new-apr-overview-item new-apr-overview-item--code">
              <span className="new-apr-overview-label">Latitude</span>
              <strong>{siteInfo.Latitude || "-"}</strong>
            </Box>

            <Box className="new-apr-overview-item new-apr-overview-item--code">
              <span className="new-apr-overview-label">Longitude</span>
              <strong>{siteInfo.Longitude || "-"}</strong>
            </Box>
          </Box>
        </Paper>

        {!aprSalva && (
        <Paper
          id="container-motivo"
          elevation={0}
          className="new-apr-config-card"
          sx={{ mb: 3 }}
        >
          <Box
            className="new-apr-config-header"
          >
            <Box>
              <Typography variant="h6" className="new-apr-card-title">
                Configuração da APR
              </Typography>
              <Typography variant="body2" className="new-apr-card-subtitle">
                Escolha a indicação, o checklist e avance para o preenchimento.
              </Typography>
            </Box>

            <Box className="new-apr-history-pill">
              <span className="new-apr-history-label">Última APR</span>
              <strong>{lastAPR.motivo || "Opinada"}</strong>
              <small>{lastAPR.data || new Date().toLocaleDateString("pt-BR")}</small>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }} id="container-save">
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => loadIndexedDB()}
                className="new-apr-secondary-action"
                sx={{
                  py: 1.35,
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
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => saveIndexedDB("APR salvo/atualizado com sucesso.")}
                className="new-apr-primary-action"
                sx={{
                  py: 1.35,
                  textTransform: 'none',
                  bgcolor: '#8e24aa',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 12px 30px rgba(142, 36, 170, 0.18)',
                  '&:hover': {
                    bgcolor: '#7b1fa2',
                    boxShadow: '0 16px 36px rgba(142, 36, 170, 0.24)'
                  }
                }}
              >
                Salvar APR
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} className="new-apr-select-grid">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
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

            <Grid item xs={12} md={6} id="container" style={{ display: "none" }}>
              <FormControl fullWidth size="small">
                <Select
                  id="selectSite"
                  defaultValue={siteInfo.tipoSite}
                  onChange={(e) => getQuestions(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem disabled value="">
                    Selecione um checklist...
                  </MenuItem>
                  <ListSubheader>Mais Utilizados</ListSubheader>
                  {listQuestions.filter(doc => doc.data().ativo === true || user.nivel === "administrador").map((value, index) => {
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
                  {listQuestions.filter(doc => doc.data().ativo === true || user.nivel === "administrador").map((value, index) => {
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
        </Paper>
        )}

        {showPgrFields && !aprSalva && (
          <Paper
            id="container-pgr"
            elevation={0}
            className="new-apr-support-card"
            sx={{ mt: 3, mb: 3 }}
          >
            <Typography
              variant="h6"
              className="new-apr-card-title"
              sx={{ mb: 0.5 }}
            >
              Informações PGR
            </Typography>
            <Typography variant="body2" className="new-apr-card-subtitle" sx={{ mb: 3 }}>
              Preencha os valores para filtrar corretamente as perguntas específicas de PGR.
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

        {showLojaFields && !aprSalva && (
          <Paper
            id="container-loja"
            elevation={0}
            className="new-apr-support-card"
            sx={{ mb: 3 }}
          >
            <Typography
              variant="h6"
              className="new-apr-card-title"
              sx={{ mb: 0.5 }}
            >
              Informações da Loja
            </Typography>
            <Typography variant="body2" className="new-apr-card-subtitle" sx={{ mb: 3 }}>
              Informe o perfil da loja para exibir somente as verificações relevantes.
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

        <div
          className="container new-apr-questions-card"
          id="container-questions"
          style={{ display: "none", width: "100%", margin: "0 auto" }}
        >
          <div id="checklist" className="form-new new-apr-form">
            <div className="new-apr-checklist-header">
              <div>
                <Typography variant="h6" className="new-apr-card-title">
                  Checklist da APR
                </Typography>
                <Typography variant="body2" className="new-apr-card-subtitle">
                  Abra cada grupo, responda os itens obrigatórios e registre evidências quando necessário.
                </Typography>
              </div>
            </div>
            {questions.map((area, indexA) => {
              return (
                <div key={indexA} className="question new-apr-area">
                  <button
                    type="button"
                    className="new-apr-area-toggle"
                    onClick={() => dropdownArea(indexA)}
                  >
                    {area[0]}
                  </button>
                  <span id={`container-${indexA}`} style={{ display: "none" }}>
                    {Array.isArray(area[1]) && area[1].map((doc, indexDoc) => {
                      if (enableQuestions(doc) === true) {
                        return (
                          <div
                            key={indexDoc}
                            className="container-perg question new-apr-question-card"
                          >
                            <div className="new-apr-question-title">
                              <span>{indexDoc + 1} - {doc.question}</span>
                              {doc.isRequired === true && (
                                <FiAlertCircle
                                  className="icon-required"
                                  size={15}
                                  color="#FF0000"
                                />
                              )}
                            </div>
                            <div className="question new-apr-question-body">
                              {doc.selectOptions === true && doc.answers && (
                                <div className="new-apr-answer-group">
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
                                </div>
                              )}
                              {doc.inputImages === true && (
                                <ul
                                  className="imageList"
                                  id={
                                    "inputimg_" + doc.questionId + "_" + indexA
                                  }
                                >
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
                                  {doc.inputImagesLibrary === true && (
                                    <li className="notremove">
                                      <InputComponent
                                        saveIndexedDB={saveIndexedDB}
                                        questions={questions}
                                        doc={doc}
                                        indexA={indexA}
                                      />
                                    </li>
                                  )}
                                  {doc.images.length > 0 &&
                                    doc.images.map((img, indexImg) => {
                                      return (
                                        <li
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
                                                "0",
                                                doc.images[0]
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
                                      <Checkbox checked={doc.optionListResp.includes("")} disabled />
                                      <ListItemText
                                        primary={"Selecione uma opção"}
                                        sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                                      />
                                    </MenuItem>

                                    {doc.optionList.map((name) => (
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
                                          checked={doc.optionListResp.includes(name)}
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
                            <button
                              type="button"
                              className="clearQuestion"
                              onClick={() => clearQuestion(doc, indexA)}
                            >
                              Limpar
                            </button>
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
              type="button"
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
              {isEditingOffline
                ? isOffline
                  ? "Salvar APR Offline"
                  : "Sincronizar APR"
                : isOffline
                  ? "Salvar APR Offline"
                  : "Concluir APR"}
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
