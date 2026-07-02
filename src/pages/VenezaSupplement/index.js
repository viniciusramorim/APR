import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "react-toastify";
import { format } from "date-fns";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {
  Box,
  Checkbox,
  FormControl,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import {
  FiAlertCircle,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiHelpCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";
import firebase from "../../services/firebaseConnection";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter";
import ModalLoading from "../../components/Modal_Loading";
import CameraComponent from "../New/CameraComponent";
import InputComponent from "../New/InputComponent";
import "../New/new.scss";
import "./venezaSupplement.scss";

// Configurar fontes do pdfmake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const BASE_COLLECTION = "aprs-producao";
const CHECKLIST_ID = "LOJA PROJ VENEZA";
const CHECKLIST_BLOCK = "4 PCI";
const VENEZA_APR_MOTIVOS = [
  "LOJA PROJETO VENEZA",
  "Loja Projeto Veneza",
  "LOJA PROJ VENEZA",
  "Projeto Veneza",
];
const STORAGE_ROOT = "images-suplementacao";
const STORE_SITE_TYPES = [
  "LOJA",
  "LOJA DEALER",
  "LOJA VIVO",
  "PROJETO VENEZA",
  "LOJA PROJ VENEZA",
];
const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 8;
const UPLOAD_TIMEOUT_MS = 120000;
const DOWNLOAD_URL_TIMEOUT_MS = 30000;
const MAX_UPLOAD_RETRIES = 3;
const MIN_IMAGE_SIZE_TO_COMPRESS_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_PX = 2560;
const IMAGE_UPLOAD_QUALITY = 0.88;
const COOKIE_NOTICE_NAME = "veneza_supplement_notice";

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function normalizeAdabas(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeLookupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getSiteAdabas(site) {
  const sigla = normalizeAdabas(site?.Sigla);
  const nome = normalizeAdabas(site?.Nome);

  if (sigla && !STORE_SITE_TYPES.includes(sigla)) {
    return sigla;
  }

  const match = nome.match(/([A-Z]{2}\d{3,}-\d+)/);
  return match ? match[1] : "";
}

function siteMatchesAdabas(site, adabasValue) {
  const normalized = normalizeAdabas(adabasValue);
  const nome = normalizeAdabas(site?.Nome);

  return getSiteAdabas(site) === normalized || nome.includes(normalized);
}

function sortNumericEntries(entries) {
  return entries.sort(([firstKey], [secondKey]) => {
    const firstNumber = Number(firstKey);
    const secondNumber = Number(secondKey);

    if (Number.isNaN(firstNumber) || Number.isNaN(secondNumber)) {
      return firstKey.localeCompare(secondKey);
    }

    return firstNumber - secondNumber;
  });
}

function normalizeQuestionList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value[1])) {
    return value[1];
  }

  if (value[1] && typeof value[1] === "object") {
    return sortNumericEntries(Object.entries(value[1]))
      .map(([, question]) => question)
      .filter((question) => question && typeof question === "object");
  }

  return sortNumericEntries(Object.entries(value))
    .map(([, question]) => question)
    .filter((question) => question && typeof question === "object" && question.question);
}

function normalizeChecklistData(data) {
  return sortNumericEntries(Object.entries(data))
    .map(([areaKey, areaValue]) => {
      const questions = normalizeQuestionList(areaValue).filter(
        (question) => question && question.question
      );

      if (questions.length === 0) {
        return null;
      }

      const title =
        areaValue && typeof areaValue === "object" && typeof areaValue[0] === "string"
          ? areaValue[0]
          : areaKey;

      return [title, questions];
    })
    .filter(Boolean);
}

function buildQuestionsFromBlock(blockKey, blockData) {
  if (!blockData) {
    return [];
  }

  if (
    Array.isArray(blockData) &&
    typeof blockData[0] === "string" &&
    Array.isArray(blockData[1])
  ) {
    const questions = normalizeQuestionList(blockData[1]).filter(
      (question) => question && question.question
    );

    return questions.length > 0 ? [[blockData[0], questions]] : [];
  }

  if (Array.isArray(blockData)) {
    const questions = normalizeQuestionList(blockData).filter(
      (question) => question && question.question
    );

    return questions.length > 0 ? [[blockKey, questions]] : [];
  }

  if (
    typeof blockData === "object" &&
    typeof blockData[0] === "string" &&
    Array.isArray(blockData[1])
  ) {
    const questions = normalizeQuestionList(blockData[1]).filter(
      (question) => question && question.question
    );

    return questions.length > 0 ? [[blockData[0], questions]] : [];
  }

  const { ativo, ...rest } = blockData;
  return normalizeChecklistData(rest);
}

function resolveChecklistBlock(fullData, targetBlock) {
  const entries = Object.entries(fullData || {}).filter(([key]) => key !== "ativo");
  const normalizedTarget = normalizeLookupText(targetBlock);
  const fallbackTarget = normalizeLookupText("PCI");

  const getBlockTitle = (value) => {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }

    if (value && typeof value === "object" && typeof value[0] === "string") {
      return value[0];
    }

    return "";
  };

  const matchesTarget = (entry, expectedValue) => {
    const [key, value] = entry;
    const normalizedKey = normalizeLookupText(key);
    const normalizedTitle = normalizeLookupText(getBlockTitle(value));

    return (
      normalizedKey === expectedValue ||
      normalizedTitle === expectedValue ||
      normalizedKey.includes(expectedValue) ||
      normalizedTitle.includes(expectedValue)
    );
  };

  return (
    entries.find((entry) => matchesTarget(entry, normalizedTarget)) ||
    entries.find((entry) => matchesTarget(entry, fallbackTarget)) ||
    null
  );
}

function formatDate(value) {
  if (!value) return "-";
  if (value.toDate) return format(value.toDate(), "dd/MM/yyyy HH:mm");
  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

function sanitizeFileName(fileName) {
  return String(fileName || "imagem")
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_");
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, errorMessage) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export default function VenezaSupplement() {
  const webcamRef = useRef(null);
  const previewUrlMapRef = useRef(new WeakMap());
  const previewFilesRef = useRef([]);

  const [adabas, setAdabas] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState("");
  const [step, setStep] = useState("search");
  const [site, setSite] = useState(null);
  const [aprs, setAprs] = useState([]);
  const [selectedApr, setSelectedApr] = useState(null);
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerSelfie, setManagerSelfie] = useState("");
  const [questions, setQuestions] = useState([]);
  const [resultAprId, setResultAprId] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [cookieNoticeAccepted, setCookieNoticeAccepted] = useState(
    getCookie(COOKIE_NOTICE_NAME) === "accepted"
  );
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  useEffect(() => {
    addBodyClass("page-new");
    addBodyClass("page-veneza-supplement");

    return () => {
      document.body.classList.remove("page-new");
      document.body.classList.remove("page-veneza-supplement");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty || step === "done") return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, step]);

  useEffect(() => {
    const activeFiles = new Set();

    questions.forEach((area) => {
      area[1].forEach((question) => {
        (question.images || []).forEach((file) => activeFiles.add(file));
      });
    });

    previewFilesRef.current.forEach((file) => {
      if (!activeFiles.has(file)) {
        const previewUrl = previewUrlMapRef.current.get(file);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrlMapRef.current.delete(file);
        }
      }
    });

    previewFilesRef.current = Array.from(activeFiles);
  }, [questions]);

  useEffect(() => {
    const previewUrlMap = previewUrlMapRef.current;

    return () => {
      previewFilesRef.current.forEach((file) => {
        const previewUrl = previewUrlMap.get(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    };
  }, []);

  function getPreviewUrl(file) {
    if (!file) return "";

    const cachedUrl = previewUrlMapRef.current.get(file);
    if (cachedUrl) return cachedUrl;

    const previewUrl = URL.createObjectURL(file);
    previewUrlMapRef.current.set(file, previewUrl);
    return previewUrl;
  }

  async function findSiteFromCollection(siteData) {
    if (!siteData?.Nome) return siteData;

    const snapshot = await firebase
      .firestore()
      .collection("sites")
      .where("Nome", "==", siteData.Nome)
      .limit(1)
      .get();

    if (snapshot.empty) return siteData;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };
  }

  async function findVenezaAprsByAdabas(adabasValue) {
    const snapshot = await firebase
      .firestore()
      .collection(BASE_COLLECTION)
      .where("motivo_apr", "in", VENEZA_APR_MOTIVOS)
      .get();

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (apr) =>
          VENEZA_APR_MOTIVOS.includes(apr.motivo_apr) &&
          siteMatchesAdabas(apr.site_id, adabasValue)
      )
      .sort((a, b) => {
        const first = a.created?.toDate ? a.created.toDate().getTime() : 0;
        const second = b.created?.toDate ? b.created.toDate().getTime() : 0;
        return second - first;
      })
      .slice(0, 1);
  }

  async function handleSearch(e) {
    e.preventDefault();
    const normalized = normalizeAdabas(adabas);

    if (!normalized) {
      toast.error("Informe o ADABAS da loja.");
      return;
    }

    setLoading(true);
    setSite(null);
    setAprs([]);
    setSelectedApr(null);

    try {
      const foundAprs = await findVenezaAprsByAdabas(normalized);

      if (foundAprs.length === 0) {
        toast.info("Nenhuma APR LOJA PROJETO VENEZA encontrada para este ADABAS.");
        return;
      }

      const siteData = await findSiteFromCollection(foundAprs[0].site_id);
      setSite(siteData);
      setAprs(foundAprs);
    } catch (error) {
      console.error("Erro ao buscar APR Projeto Veneza:", error);
      toast.error("Erro ao buscar a APR pelo ADABAS.");
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklist() {
    const checklistDoc = await firebase
      .firestore()
      .collection("question")
      .doc(CHECKLIST_ID)
      .get();

    if (!checklistDoc.exists) {
      throw new Error(`Checklist ${CHECKLIST_ID} nao encontrado.`);
    }

    const fullData = checklistDoc.data();
    const resolvedBlock = resolveChecklistBlock(fullData, CHECKLIST_BLOCK);

    if (!resolvedBlock) {
      const availableBlocks = Object.keys(fullData || {})
        .filter((key) => key !== "ativo")
        .join(", ");

      throw new Error(
        `Bloco ${CHECKLIST_BLOCK} nao encontrado em ${CHECKLIST_ID}. Blocos disponiveis: ${availableBlocks || "nenhum"}.`
      );
    }

    // Converter Array para Object se necessário
    const [blockKey, blockData] = resolvedBlock;
    const normalizedQuestions = buildQuestionsFromBlock(blockKey, blockData);

    if (normalizedQuestions.length === 0) {
      throw new Error(
        `O bloco ${blockKey} foi encontrado em ${CHECKLIST_ID}, mas nao possui perguntas validas para carregar.`
      );
    }

    setQuestions(normalizedQuestions);
  }

  async function startSupplement(apr) {
    setSelectedApr(apr);
    setStep("identify");
  }

  async function advanceToChecklist(e) {
    e.preventDefault();

    if (!managerName.trim()) {
      toast.error("Informe o nome completo do gerente.");
      return;
    }

    if (!managerEmail.trim()) {
      toast.error("Informe o email do gerente.");
      return;
    }

    if (!managerSelfie) {
      toast.error("Capture a selfie de verificacao.");
      return;
    }

    setLoading(true);

    try {
      await loadChecklist();
      setStep("checklist");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Erro ao carregar checklist.");
    } finally {
      setLoading(false);
    }
  }

  function captureSelfie() {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      toast.warning("Nao foi possivel capturar a selfie.");
      return;
    }

    setManagerSelfie(imageSrc);
    setIsDirty(true);
  }

  function addImageToQuestion(indexA, questionId, file) {
    if (!file) return;

    setIsDirty(true);
    setQuestions((previousQuestions) =>
      previousQuestions.map((area, areaIndex) => {
        if (areaIndex !== indexA) return area;

        return [
          area[0],
          area[1].map((question) => {
            if (question.questionId !== questionId) return question;

            const currentImages = question.images || [];
            if (currentImages.length >= 4) return question;

            return {
              ...question,
              images: [...currentImages, file],
            };
          }),
        ];
      })
    );
  }

  function removeImageFromQuestion(indexA, questionId, imageIndex) {
    setIsDirty(true);
    setQuestions((previousQuestions) =>
      previousQuestions.map((area, areaIndex) => {
        if (areaIndex !== indexA) return area;

        return [
          area[0],
          area[1].map((question) => {
            if (question.questionId !== questionId) return question;

            return {
              ...question,
              images: (question.images || []).filter((_, index) => index !== imageIndex),
            };
          }),
        ];
      })
    );
  }

  function updateQuestion(indexA, questionId, updater) {
    setIsDirty(true);
    setQuestions((previousQuestions) =>
      previousQuestions.map((area, areaIndex) => {
        if (areaIndex !== indexA) return area;

        return [
          area[0],
          area[1].map((question) => {
            if (question.questionId !== questionId) return question;
            return updater(question);
          }),
        ];
      })
    );
  }

  function handleChangeSelect(question, indexA, e) {
    const value = e.target.value;
    updateQuestion(indexA, question.questionId, (currentQuestion) => ({
      ...currentQuestion,
      optionListResp: typeof value === "string" ? value.split(",") : value,
    }));
  }

  function inputNumber(question, indexA, e) {
    updateQuestion(indexA, question.questionId, (currentQuestion) => ({
      ...currentQuestion,
      respInputNumber: e.target.value,
    }));
  }

  function textareaValue(question, indexA, e) {
    updateQuestion(indexA, question.questionId, (currentQuestion) => ({
      ...currentQuestion,
      respTextArea: e.target.value,
    }));
  }

  function radioSetValue(question, indexA, e) {
    const nextValue = e.target.value;
    updateQuestion(indexA, question.questionId, (currentQuestion) => ({
      ...currentQuestion,
      resp: nextValue,
      images: nextValue === "N/A" ? [] : currentQuestion.images || [],
    }));
  }

  function clearQuestion(question, indexA) {
    updateQuestion(indexA, question.questionId, (currentQuestion) => ({
      ...currentQuestion,
      resp: "",
      images: [],
      respTextArea: "",
      respInputNumber: "",
      optionListResp: [],
    }));
  }

  function dropdownArea(indexA) {
    const element = document.getElementById(`supplement-container-${indexA}`);
    if (!element) return;
    element.style.display = element.style.display === "none" ? "block" : "none";
  }

  function hasRequired() {
    for (const area of questions) {
      for (const question of area[1]) {
        if (!question.isRequired) continue;

        if (question.selectOptions && !question.resp) {
          toast.error(`A questao "${question.question}" e obrigatoria.`);
          return true;
        }

        if (
          question.listCheck &&
          (!question.optionListResp || question.optionListResp.filter(Boolean).length === 0)
        ) {
          toast.error(`A questao "${question.question}" e obrigatoria.`);
          return true;
        }
      }
    }

    return false;
  }

  function calculatePontos() {
    let peso = 0;

    questions.forEach((area) => {
      area[1].forEach((question) => {
        if (
          question.resp !== "N/A" &&
          question.resp !== "" &&
          question.resp !== question.respGabarito
        ) {
          peso += Number(question.peso || 0);
        }
      });
    });

    return peso;
  }

  function shouldCompressImage(file) {
    return file?.type?.startsWith("image/") && file.size > MIN_IMAGE_SIZE_TO_COMPRESS_BYTES;
  }

  function compressImageFile(file) {
    if (!shouldCompressImage(file)) {
      return Promise.resolve(file);
    }

    return new Promise((resolve) => {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIZE_PX / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(imageUrl);

            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: file.lastModified || Date.now(),
            });

            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          "image/jpeg",
          IMAGE_UPLOAD_QUALITY
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(file);
      };

      image.src = imageUrl;
    });
  }

  function trackUpload(upload, label) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;

        settled = true;
        try {
          upload.cancel();
        } catch (cancelError) {
          console.log("Erro ao cancelar upload:", cancelError);
        }

        reject(new Error(`Tempo limite excedido no upload: ${label}`));
      }, UPLOAD_TIMEOUT_MS);

      const unsubscribe = upload.on(
        "state_changed",
        null,
        (error) => {
          if (settled) return;

          settled = true;
          clearTimeout(timeoutId);
          unsubscribe();
          reject(error);
        },
        () => {
          if (settled) return;

          settled = true;
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      );
    });
  }

  async function uploadFileWithRetry(storageRef, file, label) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
      try {
        const uploadFile = await compressImageFile(file);
        const upload = storageRef.put(uploadFile, {
          contentType: uploadFile.type || file.type || "image/jpeg",
        });
        await trackUpload(upload, label);
        return await withTimeout(
          storageRef.getDownloadURL(),
          DOWNLOAD_URL_TIMEOUT_MS,
          `Tempo limite ao obter URL da imagem: ${label}`
        );
      } catch (error) {
        lastError = error;

        if (attempt < MAX_UPLOAD_RETRIES) {
          await delay(1500 * attempt);
        }
      }
    }

    throw new Error(`Falha ao enviar imagem ${label}. ${lastError?.message || ""}`.trim());
  }

  function createChecklistQuestion(question) {
    return {
      imagesURL: [],
      resp: question.resp || "",
      respTextArea: question.respTextArea || "",
      questionId: question.questionId,
      question: question.question,
      plano_acao: question.plano_acao || {},
      openPA: question.openPA || false,
      areaResposavel: question.areaResposavel || [],
      respGabarito: question.respGabarito || "",
      answers: question.answers || "",
      selectOptions: question.selectOptions || false,
      status: question.status || false,
      isRequired: question.isRequired || false,
      optionList: question.optionList || [],
      optionListResp: question.optionListResp || [],
      listCheck: question.listCheck || "",
      respInputNumber: question.respInputNumber || "",
      inputNumber: question.inputNumber || "",
      valorEstoque: question.valorEstoque || [],
      tipoLoja: question.tipoLoja || [],
    };
  }

  function countImages() {
    let totalImages = 0;

    questions.forEach((area) => {
      area[1].forEach((question) => {
        totalImages += (question.images || []).length;
      });
    });

    return totalImages;
  }

  async function buildChecklistAndUploadImages(supplementId) {
    const checklist = [];
    const progress = {
      completed: 0,
      total: countImages(),
    };

    setLoadingImages(progress.total > 0 ? `0 / ${progress.total}` : "");

    for (let indexA = 0; indexA < questions.length; indexA++) {
      const area = questions[indexA];
      const checklistArea = {
        0: area[0],
        1: [],
      };

      checklist.push(checklistArea);

      for (const question of area[1]) {
        if (!question.question) continue;

        const checklistQuestion = createChecklistQuestion(question);
        checklistArea[1].push(checklistQuestion);

        for (let imageIndex = 0; imageIndex < (question.images || []).length; imageIndex++) {
          const file = question.images[imageIndex];
          const uploadFileName = `${Date.now()}_${imageIndex}_${sanitizeFileName(file.name)}`;
          const imgPath = `${STORAGE_ROOT}/${selectedApr.id}/${supplementId}/${indexA}/${question.questionId}/${uploadFileName}`;
          const storageRef = firebase.storage().ref(imgPath);
          const uploadLabel = `${question.questionId || "sem-id"} - ${file.name || "imagem"}`;

          setLoadingImages(`Enviando ${progress.completed + 1} / ${progress.total} - ${uploadLabel}`);

          const downloadUrl = await uploadFileWithRetry(storageRef, file, uploadLabel);
          checklistQuestion.imagesURL.push({
            url: downloadUrl,
            ref: storageRef.fullPath,
          });

          progress.completed += 1;
          setLoadingImages(`${progress.completed} / ${progress.total}`);
        }
      }
    }

    return checklist;
  }

  async function getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        try {
          resolve(canvas.toDataURL("image/jpeg"));
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        reject(new Error(`Erro ao carregar imagem: ${url}`));
      };

      img.src = url;
    });
  }

  async function generateSupplementationPDF(supplement) {
    const pdf = {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: "#00529B",
          margin: [0, 0, 0, 20],
        },
      },
    };

    // Cabeçalho
    pdf.content.push({
      text: "Suplementação de APR - Bloco PCI",
      style: "header",
      alignment: "center",
    });

    pdf.content.push({
      text: `Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      alignment: "right",
      margin: [0, 0, 0, 20],
      fontSize: 10,
      color: "#666",
    });

    // Informações da Suplementação
    pdf.content.push({
      table: {
        widths: [300, 300],
        body: [
          ["ID Suplementação:", supplement.id || "-"],
          ["APR ID:", selectedApr.apr_id || selectedApr.id],
          ["Usuário:", managerName || "-"],
          ["Email:", managerEmail || "-"],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 20],
    });

    // Informações do Site
    if (site) {
      pdf.content.push({
        text: "Informações do Estabelecimento",
        bold: true,
        fontSize: 14,
        color: "#00529B",
        margin: [0, 20, 0, 10],
      });

      pdf.content.push({
        table: {
          widths: [300, 300],
          body: [
            ["Unidade:", site.Nome || "-"],
            ["ADABAS:", getSiteAdabas(site) || "-"],
            ["Endereço:", site.Endereco || "-"],
            ["Cidade/UF:", `${site.Cidade || "-"} - ${site.Estado || "-"}`],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 20],
      });
    }

    // Selfie do Gestor
    if (managerSelfie) {
      pdf.content.push({
        text: "Selfie de Verificação",
        bold: true,
        fontSize: 12,
        color: "#00529B",
        margin: [0, 10, 0, 5],
      });

      try {
        const selfieBase64 = managerSelfie.startsWith("data:")
          ? managerSelfie
          : await getBase64ImageFromURL(managerSelfie);

        pdf.content.push({
          image: selfieBase64,
          width: 150,
          alignment: "center",
          margin: [0, 5, 0, 20],
        });
      } catch (error) {
        console.log("Erro ao adicionar selfie:", error);
      }
    }

    pdf.content.push({
      canvas: [{ type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" }],
    });

    // Respostas do Checklist
    for (const area of supplement.checklist || questions) {
      pdf.content.push({
        text: area[0],
        bold: true,
        fontSize: 14,
        margin: [0, 30, 0, 10],
        color: "#00529B",
        decoration: "underline",
      });

      const docs = area[1];

      for (const doc of docs) {
        if (!doc) continue;

        pdf.content.push({
          text: `${doc.question}`,
          fontSize: 11,
          bold: true,
          margin: [0, 10, 0, 5],
          background: "#F2F2F2",
          alignment: "left",
        });

        if (doc.resp) {
          const respColor =
            doc.resp === "Sim"
              ? "#4CAF50"
              : doc.resp === "Não"
              ? "#F44336"
              : "#FFA500";

          pdf.content.push({
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: doc.resp,
                    fillColor: respColor,
                    color: "white",
                    alignment: "center",
                    bold: true,
                    margin: [0, 5, 0, 5],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: function () {
                return 0;
              },
              vLineWidth: function () {
                return 0;
              },
            },
            margin: [0, 5, 0, 5],
          });
        }

        if (doc.respTextArea) {
          pdf.content.push({
            text: `Observações: ${doc.respTextArea}`,
            italics: true,
            margin: [10, 5, 0, 5],
            fontSize: 10,
          });
        }

        // Adicionar imagens
        if (doc.imagesURL && doc.imagesURL.length > 0) {
          for (const img of doc.imagesURL) {
            try {
              const imgBase64 = await getBase64ImageFromURL(img.url);
              pdf.content.push({
                image: imgBase64,
                width: 150,
                height: 150,
                margin: [0, 10, 10, 10],
              });
            } catch (error) {
              console.log("Erro ao adicionar imagem:", error);
            }
          }
        }

        pdf.content.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 520,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#ccc",
            },
          ],
          margin: [0, 20, 0, 20],
        });
      }
    }

    return pdf;
  }

  async function downloadSupplementationPDF(supplement) {
    try {
      const pdf = await generateSupplementationPDF(supplement);
      const fileName = `Suplementacao_PCI_${getSiteAdabas(site)}_${format(
        new Date(),
        "dd-MM-yyyy_HHmm"
      )}.pdf`;
      pdfMake.createPdf(pdf).download(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF de suplementação.");
    }
  }

  function generateAccessGuidePDF() {
    const pdf = {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: "#00529B",
          margin: [0, 0, 0, 20],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          color: "#00529B",
          margin: [0, 15, 0, 10],
        },
        stepBox: {
          margin: [0, 10, 0, 15],
          fillColor: "#F0F4F8",
          padding: [10, 10, 10, 10],
        },
      },
    };

    // Cabeçalho
    pdf.content.push({
      text: "GUIA DE ACESSO - Suplementação PCI",
      style: "header",
      alignment: "center",
    });

    pdf.content.push({
      text: "Projeto Veneza - Bloco 4 PCI",
      alignment: "center",
      fontSize: 12,
      color: "#666",
      margin: [0, 0, 0, 20],
    });

    // Introdução
    pdf.content.push({
      text: "Bem-vindo! Este guia irá ajudá-lo a completar a suplementação do formulário PCI de forma rápida e segura.",
      margin: [0, 0, 0, 20],
      fontSize: 11,
    });

    // Passo 1
    pdf.content.push({
      text: "PASSO 1: Busca da APR",
      style: "subheader",
    });

    pdf.content.push({
      stack: [
        {
          text: "• Digite o ADABAS da sua loja",
          margin: [10, 5, 0, 5],
        },
        {
          text: "• Sistema irá localizar a APR mais recente do Projeto Veneza",
          margin: [10, 5, 0, 5],
        },
        {
          text: "• Revise os dados apresentados (unidade, endereço, etc)",
          margin: [10, 5, 0, 5],
        },
        {
          text: "• Clique em 'Próximo' para continuar",
          margin: [10, 5, 0, 15],
        },
      ],
    });

    // Passo 2
    pdf.content.push({
      text: "PASSO 2: Identificação",
      style: "subheader",
    });

    pdf.content.push({
      stack: [
        {
          text: "Nome Completo: Digite seu nome com seu sobrenome",
          margin: [10, 5, 0, 5],
        },
        {
          text: "Email: Use um email válido e ativo para contato",
          margin: [10, 5, 0, 5],
        },
        {
          text: "Selfie: Tire uma foto clara mostrando seu rosto",
          margin: [10, 5, 0, 10],
        },
        {
          text: "💡 Dica: Certifique-se de ter boa iluminação ao tirar a selfie",
          fillColor: "#E3F2FD",
          margin: [10, 5, 0, 15],
          padding: [5, 5, 5, 5],
        },
      ],
    });

    // Passo 3
    pdf.content.push({
      text: "PASSO 3: Preenchimento do Bloco PCI (6 Perguntas)",
      style: "subheader",
    });

    pdf.content.push({
      stack: [
        {
          text: "Para cada pergunta, você deverá:",
          margin: [0, 0, 0, 10],
          bold: true,
        },
        {
          text: "1. Selecionar SIM ou NÃO",
          margin: [10, 5, 0, 5],
        },
        {
          text: "2. Tirar uma foto relacionada à resposta",
          margin: [10, 5, 0, 5],
        },
        {
          text: "3. Adicionar observações (texto) se necessário",
          margin: [10, 5, 0, 15],
        },
      ],
    });

    pdf.content.push({
      text: "Dicas Importantes:",
      bold: true,
      margin: [0, 10, 0, 5],
      color: "#D32F2F",
    });

    pdf.content.push({
      ul: [
        "Fotos devem ser claras e bem iluminadas",
        "Imagens muito grandes serão comprimidas automaticamente",
        "Máximo recomendado: 2 fotos por pergunta",
        "Use observações para descrever detalhes importantes",
        "Todos os campos são obrigatórios",
      ],
      margin: [0, 5, 0, 20],
    });

    // Passo 4
    pdf.content.push({
      text: "PASSO 4: Conclusão e Envio",
      style: "subheader",
    });

    pdf.content.push({
      stack: [
        {
          text: "1. Revise todos os dados preenchidos",
          margin: [10, 5, 0, 5],
        },
        {
          text: "2. Verifique se todas as fotos estão anexadas",
          margin: [10, 5, 0, 5],
        },
        {
          text: "3. Clique em 'Concluir Suplementação'",
          margin: [10, 5, 0, 10],
        },
        {
          text: "✅ Um PDF com suas respostas será gerado automaticamente",
          fillColor: "#C8E6C9",
          margin: [10, 5, 0, 15],
          padding: [5, 5, 5, 5],
        },
      ],
    });

    // Perguntas Frequentes
    pdf.content.push({
      canvas: [{ type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" }],
      margin: [0, 20, 0, 10],
    });

    pdf.content.push({
      text: "DÚVIDAS FREQUENTES",
      style: "subheader",
    });

    pdf.content.push({
      stack: [
        {
          text: "P: O que fazer se não encontrar minha APR?",
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          text: "R: Verifique se o ADABAS está correto. Se a loja não tiver uma APR Projeto Veneza registrada, ela não aparecerá.",
          margin: [10, 0, 0, 10],
        },
        {
          text: "P: Posso editar minha suplementação após enviar?",
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          text: "R: Não, a suplementação é final após o envio. Revise cuidadosamente antes de concluir.",
          margin: [10, 0, 0, 10],
        },
        {
          text: "P: Quanto tempo leva para processar?",
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          text: "R: O processamento é imediato. Você receberá um PDF com suas respostas automaticamente.",
          margin: [10, 0, 0, 20],
        },
      ],
    });

    // Contato
    pdf.content.push({
      canvas: [{ type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" }],
      margin: [0, 20, 0, 10],
    });

    pdf.content.push({
      text: "Precisa de ajuda?",
      bold: true,
      fontSize: 12,
      margin: [0, 10, 0, 10],
      color: "#00529B",
    });

    pdf.content.push({
      text: "Em caso de dúvidas ou problemas, consulte o administrador do sistema ou procure pelo suporte disponível na plataforma.",
      margin: [0, 0, 0, 30],
      color: "#666",
    });

    return pdf;
  }

  function downloadAccessGuidePDF() {
    try {
      const pdf = generateAccessGuidePDF();
      const fileName = `Guia_Acesso_Suplementacao_PCI_${format(new Date(), "dd-MM-yyyy")}.pdf`;
      pdfMake.createPdf(pdf).download(fileName);
      toast.success("Guia de acesso baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar guia:", error);
      toast.error("Erro ao gerar guia de acesso.");
    }
  }

  async function submitSupplement(e) {
    e.preventDefault();

    if (hasRequired()) return;

    setLoading(true);
    setLoadingImages("");

    try {
      const aprRef = firebase.firestore().collection(BASE_COLLECTION).doc(selectedApr.id);
      const currentSnapshot = await aprRef.get();

      if (!currentSnapshot.exists) {
        throw new Error("APR nao encontrada.");
      }

      const currentApr = currentSnapshot.data();

      if (!VENEZA_APR_MOTIVOS.includes(currentApr.motivo_apr)) {
        throw new Error("Esta APR nao esta liberada para suplementacao Projeto Veneza.");
      }

      if (!siteMatchesAdabas(currentApr.site_id, getSiteAdabas(site))) {
        throw new Error("ADABAS da APR nao confere com a loja selecionada.");
      }

      if (currentApr.suplementacao) {
        throw new Error("Esta APR ja possui suplementacao registrada.");
      }

      const supplementId = firebase.firestore().collection("_").doc().id;
      const checklist = await buildChecklistAndUploadImages(supplementId);
      const now = new Date();
      const supplementPayload = {
        id: supplementId,
        checklist_id: CHECKLIST_ID,
        created: now,
        adabas: getSiteAdabas(site),
        gerente: {
          nome: managerName.trim(),
          email: managerEmail.trim(),
        },
        site_id: site,
        verify_manager: managerSelfie,
        tipo_loja: selectedApr.tipo_loja || "",
        valor_estoque: selectedApr.valor_estoque || "",
        peso: calculatePontos(),
        checklist,
      };

      await firebase.firestore().runTransaction(async (transaction) => {
        const transactionSnapshot = await transaction.get(aprRef);

        if (!transactionSnapshot.exists) {
          throw new Error("APR nao encontrada.");
        }

        const transactionApr = transactionSnapshot.data();

        if (!VENEZA_APR_MOTIVOS.includes(transactionApr.motivo_apr)) {
          throw new Error("Esta APR nao esta liberada para suplementacao Projeto Veneza.");
        }

        if (!siteMatchesAdabas(transactionApr.site_id, getSiteAdabas(site))) {
          throw new Error("ADABAS da APR nao confere com a loja selecionada.");
        }

        if (transactionApr.suplementacao) {
          throw new Error("Esta APR ja possui suplementacao registrada.");
        }

        transaction.update(aprRef, {
          suplementacao: supplementPayload,
        });
      });

      setResultAprId(selectedApr.apr_id || selectedApr.id);
      setIsDirty(false);
      setStep("done");
      
      // Gerar e fazer download do PDF de suplementação
      setTimeout(() => {
        downloadSupplementationPDF(supplementPayload);
      }, 500);
      
      toast.success("Suplementacao concluida com sucesso e PDF gerado!");
    } catch (error) {
      console.error("Erro ao salvar suplementacao:", error);
      toast.error(error.message || "Erro ao salvar suplementacao.");
    } finally {
      setLoading(false);
      setLoadingImages("");
    }
  }

  function renderSiteInfo(siteData) {
    if (!siteData) return null;

    return (
      <div className="supplement-info-grid">
        <span>
          <strong>Unidade:</strong> {siteData.Nome || "-"}
        </span>
        <span>
          <strong>ADABAS:</strong> {getSiteAdabas(siteData) || "-"}
        </span>
        <span>
          <strong>Endereco:</strong> {siteData.Endereco || "-"}
        </span>
        <span>
          <strong>Cidade/UF:</strong> {siteData.Cidade || "-"} - {siteData.Estado || "-"}
        </span>
      </div>
    );
  }

  function acceptCookieNotice() {
    setCookie(COOKIE_NOTICE_NAME, "accepted", 60 * 60 * 24 * 365);
    setCookieNoticeAccepted(true);
  }

  return (
    <div className="veneza-public-page">
      <main className="veneza-shell">
        <section className="veneza-header">
          <div>
            <h1>Suplementacao Projeto Veneza</h1>
            <p>Localize a APR pelo ADABAS da loja e complete a suplementacao.</p>
          </div>
          <button
            type="button"
            className="veneza-help-btn"
            onClick={() => setShowHelpDrawer(true)}
            title="Abrir guia de ajuda"
          >
            <FiHelpCircle size={24} />
            Ajuda
          </button>
        </section>

        {step === "search" && (
          <>
            <form className="veneza-card veneza-search" onSubmit={handleSearch}>
              <label htmlFor="adabas">ADABAS</label>
              <div className="veneza-search-row">
                <input
                  id="adabas"
                  value={adabas}
                  onChange={(e) => setAdabas(normalizeAdabas(e.target.value))}
                  placeholder="Digite o ADABAS da loja"
                />
                <button type="submit" disabled={loading}>
                  <FiSearch size={18} />
                  Buscar
                </button>
              </div>
            </form>

            {site && (
              <section className="veneza-card">
                <h2>Loja encontrada</h2>
                {renderSiteInfo(site)}
              </section>
            )}

            {site && aprs.length === 0 && (
              <section className="veneza-card veneza-empty">
                <FiAlertCircle size={22} />
                <span>Nenhuma APR de Projeto Veneza encontrada para este ADABAS.</span>
              </section>
            )}

            {aprs.length > 0 && (
              <section className="veneza-card">
                <h2>APR Projeto Veneza</h2>
                <div className="veneza-apr-list">
                  {aprs.map((apr) => {
                    const alreadySupplemented = Boolean(apr.suplementacao?.created);

                    return (
                      <article key={apr.id} className="veneza-apr-item">
                        <div>
                          <strong>ID APR: {apr.apr_id || apr.id}</strong>
                          <span>{apr.site_id?.Nome || site.Nome}</span>
                          <small>
                            Criada em {formatDate(apr.created)} | Status: {apr.status || "-"}
                          </small>
                          {alreadySupplemented && (
                            <small>Ja suplementada em {formatDate(apr.suplementacao.created)}</small>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => startSupplement(apr)}
                          disabled={alreadySupplemented}
                        >
                          {alreadySupplemented ? "Suplementada" : "Suplementar"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {step === "identify" && selectedApr && (
          <form className="veneza-card veneza-identify" onSubmit={advanceToChecklist}>
            <h2>Identificacao do gerente</h2>
            {renderSiteInfo(site)}

            <div className="veneza-form-grid">
              <label>
                Nome completo
                <input
                  value={managerName}
                  onChange={(e) => {
                    setManagerName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Nome completo"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => {
                    setManagerEmail(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="email@empresa.com"
                />
              </label>
            </div>

            <div className="veneza-selfie">
              <div className="veneza-camera">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.9}
                  videoConstraints={{
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                />
                <button type="button" onClick={captureSelfie}>
                  <FiCamera size={18} />
                  Capturar selfie
                </button>
              </div>
              {managerSelfie && (
                <div className="veneza-selfie-preview">
                  <img src={managerSelfie} alt="Selfie capturada" />
                  <span>
                    <FiCheckCircle size={16} />
                    Selfie capturada
                  </span>
                </div>
              )}
            </div>

            <div className="veneza-actions">
              <button type="button" className="secondary" onClick={() => setStep("search")}>
                Voltar
              </button>
              <button type="submit" disabled={loading}>
                Avancar
              </button>
            </div>
          </form>
        )}

        {step === "checklist" && (
          <section className="veneza-card veneza-checklist">
            <h2>Checklist {CHECKLIST_ID}</h2>

            <form className="form-new" onSubmit={submitSupplement}>
              {questions.map((area, indexA) => (
                <div key={indexA} className="question">
                  <i id="button-area" onClick={() => dropdownArea(indexA)}>
                    {area[0]}
                  </i>
                  <span id={`supplement-container-${indexA}`} style={{ display: "block" }}>
                    {area[1].map((doc, indexDoc) => {
                      return (
                        <div key={indexDoc} className="container-perg question">
                          {indexDoc + 1} - {doc.question}
                          {doc.isRequired === true && (
                            <FiAlertCircle className="icon-required" size={15} color="#FF0000" />
                          )}

                          <div className="question">
                            {doc.selectOptions === true && doc.answers && (
                              <>
                                <label>
                                  <input
                                    className="yes"
                                    type="radio"
                                    name={indexA + "-" + doc.questionId}
                                    value={doc.answers[0]}
                                    checked={doc.resp === doc.answers[0]}
                                    onChange={(e) => radioSetValue(doc, indexA, e)}
                                  />
                                  <FiCheck size={25} /> {doc.answers[0]}
                                </label>
                                <label>
                                  <input
                                    className="no"
                                    type="radio"
                                    name={indexA + "-" + doc.questionId}
                                    value={doc.answers[1]}
                                    checked={doc.resp === doc.answers[1]}
                                    onChange={(e) => radioSetValue(doc, indexA, e)}
                                  />
                                  <FiX size={25} /> {doc.answers[1]}
                                </label>
                                <label>
                                  <input
                                    className="na"
                                    type="radio"
                                    name={indexA + "-" + doc.questionId}
                                    value="N/A"
                                    checked={doc.resp === "N/A"}
                                    onChange={(e) => radioSetValue(doc, indexA, e)}
                                  />
                                  <FiX size={25} /> {doc.answers[2] ? doc.answers[2] : "N/A"}
                                </label>
                              </>
                            )}

                            {doc.inputImages === true && doc.resp !== "N/A" && (
                              <ul className="imageList">
                                <li className="notremove" style={{ marginRight: 10 }}>
                                  <CameraComponent
                                    doc={doc}
                                    indexA={indexA}
                                    onAddImage={addImageToQuestion}
                                  />
                                </li>
                                {doc.inputImagesLibrary === true && (
                                  <li className="notremove">
                                    <InputComponent
                                      doc={doc}
                                      indexA={indexA}
                                      onAddImage={addImageToQuestion}
                                    />
                                  </li>
                                )}
                                {doc.images?.map((img, indexImg) => (
                                  <li
                                    key={`${doc.questionId}_${indexImg}_${img.name}`}
                                    style={{
                                      background: `url(${getPreviewUrl(img)}) round`,
                                    }}
                                  >
                                    <i
                                      onClick={() =>
                                        removeImageFromQuestion(indexA, doc.questionId, indexImg)
                                      }
                                    >
                                      X
                                    </i>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {doc.textarea === true && (
                              <textarea
                                type="text"
                                placeholder="Descreva o problema."
                                value={doc.respTextArea || ""}
                                onChange={(e) => textareaValue(doc, indexA, e)}
                              />
                            )}

                            {doc.inputNumber === true && (
                              <FormControl size="small" sx={{ marginTop: 1 }}>
                                <TextField
                                  label="Quantidade"
                                  size="small"
                                  fullWidth
                                  type="number"
                                  onChange={(e) => inputNumber(doc, indexA, e)}
                                  value={doc.respInputNumber || ""}
                                />
                              </FormControl>
                            )}

                            {doc.listCheck === true && (
                              <FormControl
                                size="small"
                                sx={{ marginTop: 1, width: { xs: "100%", sm: "300px", md: "400px" } }}
                              >
                                <Select
                                  multiple={doc.multipleCheck}
                                  value={
                                    doc.optionListResp && doc.optionListResp.length > 0
                                      ? doc.optionListResp
                                      : [""]
                                  }
                                  onChange={(e) => handleChangeSelect(doc, indexA, e)}
                                  renderValue={(selected) => (
                                    <Box sx={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                      {selected.filter((value) => value !== "").join(", ")}
                                    </Box>
                                  )}
                                  MenuProps={MenuProps}
                                >
                                  <MenuItem key="" value="" sx={{ height: "30px" }} disabled>
                                    <Checkbox checked={doc.optionListResp?.includes("")} disabled />
                                    <ListItemText primary="Selecione uma opcao" />
                                  </MenuItem>

                                  {doc.optionList?.map((name) => (
                                    <MenuItem key={name} value={name} sx={{ height: "auto", py: 1 }}>
                                      <Checkbox checked={doc.optionListResp?.includes(name)} />
                                      <ListItemText primary={name} />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </div>

                          <i className="clearQuestion" onClick={() => clearQuestion(doc, indexA)}>
                            Limpar
                          </i>
                        </div>
                      );
                    })}
                  </span>
                </div>
              ))}

              <div className="veneza-actions">
                <button type="button" className="secondary" onClick={() => setStep("identify")}>
                  Voltar
                </button>
                <button className="submit-apr" type="submit" disabled={loading}>
                  Concluir Suplementacao
                </button>
              </div>
            </form>
          </section>
        )}

        {step === "done" && (
          <section className="veneza-card veneza-done">
            <FiCheckCircle size={36} />
            <h2>Suplementacao concluida</h2>
            <p>APR {resultAprId} atualizada com os dados do gerente e checklist preenchido.</p>
            <button type="button" onClick={() => setStep("search")}>
              Nova suplementacao
            </button>
          </section>
        )}
      </main>

      {!cookieNoticeAccepted && (
        <section className="veneza-cookie-notice">
          <div>
            <strong>Aviso de continuidade</strong>
            <span>
              Este formulario usa apenas um cookie tecnico para lembrar este aviso. Ao sair ou
              atualizar a pagina antes de concluir, as alteracoes nao salvas serao perdidas.
            </span>
          </div>
          <button type="button" onClick={acceptCookieNotice}>
            Entendi
          </button>
        </section>
      )}

      {loading && <ModalLoading carregamento={loadingImages} />}

      {/* Help Drawer */}
      {showHelpDrawer && (
        <div className="veneza-help-overlay" onClick={() => setShowHelpDrawer(false)}>
          <div className="veneza-help-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="veneza-help-header">
              <h2>Guia de Preenchimento</h2>
              <div className="veneza-help-buttons">
                <button
                  type="button"
                  className="veneza-help-download-btn"
                  onClick={downloadAccessGuidePDF}
                  title="Baixar guia em PDF"
                >
                  <FiClipboard size={18} /> Baixar Guia
                </button>
                <button
                  type="button"
                  className="veneza-help-close"
                  onClick={() => setShowHelpDrawer(false)}
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="veneza-help-content">
              <div className="help-section">
                <h3>1️⃣ Busca da APR</h3>
                <p>
                  Digite o <strong>ADABAS</strong> da sua loja para localizar a APR mais recente aplicada para o checklist Loja Projeto Veneza.
                </p>
                <div className="help-tip">
                  <strong>💡 Dica:</strong> O ADABAS é o código único da sua loja.
                </div>
              </div>

              <div className="help-section">
                <h3>2️⃣ Identificação</h3>
                <p>Preencha seus dados:</p>
                <ul>
                  <li><strong>Nome Completo:</strong> Use seu nome completo</li>
                  <li><strong>Email:</strong> Email válido e ativo</li>
                  <li><strong>Selfie:</strong> Capture sua foto para segurança</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>3️⃣ Preenchimento do Bloco PCI</h3>
                <p>Responda as <strong>6 perguntas</strong> do bloco PCI:</p>
                <ul>
                  <li><strong>Sim/Não:</strong> Selecione a opção apropriada</li>
                  <li><strong>Com Foto:</strong> Tire fotos claras e bem iluminadas</li>
                  <li><strong>Texto:</strong> Descreva sua observação</li>
                </ul>
                <div className="help-warning">
                  <strong>⚠️ Importante:</strong> Fotos muito grandes serão comprimidas automaticamente.
                </div>
              </div>

              <div className="help-section">
                <h3>4️⃣ Conclusão e Envio</h3>
                <p>
                  Revise todas as informações e clique em <strong>"Concluir Suplementacao"</strong>.
                </p>
                <div className="help-success">
                  <strong>✅ Sucesso!</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
