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
import Title from "../../components/Title";
import ModalLoading from "../../components/Modal_Loading";
import Modal_Justificativa from "../../components/Modal_Justificativa";
import CameraComponent from "./CameraComponent";
import InputComponent from "./InputComponent";
import {
  Box,
  Checkbox,
  FormControl,
  ListItemText,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";
import { Label } from "@mui/icons-material";

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

  useEffect(() => {
    addBodyClass("page-new");

    loadSite();
    getCheckLists();

    navigator.geolocation.getCurrentPosition(function (position) {
      setLocation(position.coords);
    });
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

  const maisUtilizados = [2, 3, 5, 6, 7, 8, 10, 11, 18, 19];

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
        setInicio(new Date());
      })
      .catch((error) => {
        console.log("DEU ALGUM ERRO!", error);
      });
  }

  async function getQuestions(snapshot) {
    navigator.permissions.query({ name: "geolocation" }).then(async (item) => {
      if (item.state !== "granted") {
        alert("habilite a geolocation para realizar a APR");
        return;
      } else {
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

            const orderedEntries = Object.entries(data).sort((a, b) =>
              a[0].localeCompare(b[0])
            );
            console.log(orderedEntries);

            setQuestions(orderedEntries);
          });
      }
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
    let imageArray = [];
    let arrayQuestion = questions[indexA][1][objIndex];
    let index = arrayQuestion.images.findIndex((obj) => obj.name === file.name);

    delete arrayQuestion.images[index];

    arrayQuestion.images.forEach((file) => {
      imageArray.push(file);
    });

    questions[indexA][1][objIndex].images = imageArray;
    setQuestions(questions);
  }

  async function updateAssignments() {
    await firebase
      .firestore()
      .collection("atribuicoes")
      .doc(id_assign)
      .update({
        status: "APR Criada",
      })
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

  function submit() {
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
        console.log("Insira uma justificativa");
        return;
      }
    }

    navigator.permissions.query({ name: "geolocation" }).then(async (item) => {
      if (item.state === "granted") {
        getPerimetro(location.latitude, location.longitude)
          .then(async (perimeter) => {
            togglePostModal(); //abre modal de loading
            insertData(perimeter);
          })
          .catch((err) => {
            alert("Erro na geolocation, contate um administrador");
            console.log("Erro na geolocation, contate um administrador" + err);
          });
      } else {
        alert("habilite a geolocation para realizar a APR");
        console.log("habilite a geolocation para realizar a APR");
      }
    });
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
        .update({
          ID: currentID + 1,
        });

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
      .update({
        last_apr: new Date(),
        last_motivo: motivo,
      })
    console.log('atualizou site concluido')
    return querySnapshot;
  }

  async function insertData(perimeter) {
    let checklist = [];

    let qtdImages = 0;
    let imagesCompleted = 0;

    saveIndexedDB();

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
              locationCreated: {
                latitude: location.latitude,
                longitude: location.longitude,
                perimetro: perimeter,
              },
              tempoConclusao: {
                inicio: inicio === undefined ? new Date() : inicio,
                conclusao: new Date(),
              },
            })

            await firebase
              .firestore()
              .collection(base)
              .add({
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
                locationCreated: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  perimetro: perimeter,
                },
                tempoConclusao: {
                  inicio: inicio === undefined ? new Date() : inicio,
                  conclusao: new Date(),
                },
              })
              .then(async (index) => {
                let containsImage = verifyContainsImage();

                questions.forEach(async (area, indexA) => {
                  checklist.push({
                    0: area[0],
                    1: [],
                  });
                  area[1].forEach(async (question, indexQ) => {
                    question.question && checklist[indexA][1].push({
                      imagesURL: [],
                      resp: question.resp,
                      respTextArea: question.respTextArea,
                      questionId: question.questionId,
                      question: question.question,
                      plano_acao: question.plano_acao,
                      openPA: question.openPA,
                      areaResposavel: question.areaResposavel,
                      respGabarito: question.respGabarito,
                      answers: question.answers,
                      selectOptions: question.selectOptions ? question.selectOptions : false,
                      status: question.status ? question.status : false,
                      isRequired: question.isRequired ? question.isRequired : false,
                      optionList: question.optionList ? question.optionList : [],
                      optionListResp: question.optionListResp ? question.optionListResp : [],
                      listCheck: question.listCheck ? question.listCheck : "",
                      respInputNumber: question.respInputNumber ? question.respInputNumber : "",
                      inputNumber: question.inputNumber ? question.inputNumber : "",
                      valorArmazenado: question.valorArmazenado ? question.valorArmazenado : [],
                      valorEstoque: question.valorEstoque ? question.valorEstoque : [],
                      valorTransporte: question.valorTransporte ? question.valorTransporte : [],
                      ValorSinistro: question.ValorSinistro ? question.ValorSinistro : [],
                      tipoLoja: question.tipoLoja ? question.tipoLoja : []
                    });

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
                              .update({
                                checklist: checklist,
                              })
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
                    .update({
                      checklist: checklist,
                    })
                    .then(async () => {
                      console.log("Completed not contains Image");
                      logSistem("A APR foi criado", index.id);
                      conclusionApr(index.id);
                    })
                    .catch((err) => {
                      console.log("Erro ao inserir APR (sem imagens)");
                    });
                }

                if (id_assign !== undefined) {
                  updateAssignments();
                }
              })
              .catch((err) => console.log(err));
          })
          .catch((err) =>
            console.log("Erro ao inserir informações no SITE: " + err)
          );
      })
      .catch((err) => console.log("Erro ao inserir ID: " + err));
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
    const center = [parseFloat(lat), parseFloat(lng)];
    const radiusInM = 1 * 1000;

    let latitude = parseFloat(siteInfo.Latitude.replace(",", "."));
    let longitude = parseFloat(siteInfo.Longitude.replace(",", "."));
    console.log(latitude);
    console.log(longitude);
    const distanceInKm = geofire.distanceBetween([latitude, longitude], center);
    const distanceInM = distanceInKm * 1000;
    if (distanceInM <= radiusInM) {
      return "Esta dentro do Perimetro";
    } else {
      return "fora perimetro";
    }
  }

  function conclusionApr(id) {
    document.getElementById("container-conclusion").style.display = "flex";
    document.getElementById("container-questions").style.display = "none";
    document.getElementById("container-save").style.display = "none";
    document.getElementById("container-motivo").style.display = "none";
    (siteInfo.tipoSite === "AUDIT PGR FIXA" ||
      siteInfo.tipoSite === "AUDIT PGR MOVEL") &&
      (document.getElementById("container-pgr").style.display = "none")(
        siteInfo.tipoSite === "LOJA" || siteInfo.tipoSite === "LOJA DEALER"
      ) &&
      (document.getElementById("container-loja").style.display = "none");
    document.getElementById("container").style.display = "none";
    document.getElementById("modalLoading").style.display = "none";

    var container = document.getElementById("container-conclusion");
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
      <>
        <span>APR Finalizada com Sucesso !</span>
        <span>
          ID da sua APR : <i>{id}</i>
        </span>
        <span>
          Classificação : <i>{classificacao}</i>
        </span>

        <a href={"/aprs"}>Ir Pagina Inicial</a>
        <a href={`/open/${id}`}>Ir APR Criada</a>
      </>
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
    const isPGR = siteInfo?.tipoSite?.includes("PGR");
    const isVENEZA = siteInfo?.tipoSite?.includes("PROJETO VENEZA");
    const isEstadoValido = isPGR && doc.estados.includes(siteInfo.Estado);
    const isTipoLojaValido = isVENEZA && doc.tipoLoja.includes(tipoLoja)

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

    return exibition
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Aplicar APR">
          <FiClipboard size={25} onClick={() => console.log(siteInfo.tipoSite)} />
        </Title>

        <div className="container">
          <div className="siteInfo">
            <ul>
              <li>
                <span>Unidade: </span>
                {siteInfo.Nome}
              </li>
              <li>
                <span>Endereço: </span>
                {siteInfo.Endereco}
              </li>
              <li>
                <span>Estado: </span>
                {siteInfo.Estado}
              </li>
              <li>
                <span>Criticidade: </span>
                {siteInfo.critical}
              </li>
            </ul>
            <ul>
              <li>
                <span>Cidade: </span>
                {siteInfo.Cidade}
              </li>
              <li>
                <span>Latitude: </span>
                {siteInfo.Latitude}
              </li>
              <li>
                <span>Longitude: </span>
                {siteInfo.Longitude}
              </li>
            </ul>
          </div>
        </div>

        <div className="container">
          <div className="siteInfo">
            <ul>
              <li>
                <span>Ultima APR: </span>
                {lastAPR.data}
              </li>
            </ul>
            <ul>
              <li>
                <span>Ultima APR Motivo: </span>
                {lastAPR.motivo}
              </li>
            </ul>
          </div>
        </div>

        <div className="container" id="container-save">
          <div className="save">
            <a onClick={() => loadIndexedDB()}>Carregar Salvo</a>
            <a
              onClick={() => saveIndexedDB("APR salvo/atualizado com sucesso.")}
            >
              Salvar APR
            </a>
          </div>
        </div>

        <div className="container" id="container-motivo">
          <Select
            id="selectMotivo"
            value={motivoAPR}
            onChange={(e) => selectMotivoAPR(e)}
            size="small"
            displayEmpty
            placeholder="Selecione um motivo..."
            sx={{ width: "600px", borderRadius: "8px" }}
          >
            <MenuItem disabled value="">
              Selecione uma indicação...
            </MenuItem>

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
        </div>

        <div className="container" id="container" style={{ display: "none" }}>
          <Select
            id="selectSite"
            defaultValue={siteInfo.tipoSite}
            onChange={(e) => getQuestions(e.target.value)}
            displayEmpty
            size="small"
            style={{ width: "600px", borderRadius: "8px" }}
          >
            <MenuItem disabled value="">
              Selecione um checklist...
            </MenuItem>

            <ListSubheader>Mais Utilizados</ListSubheader>
            {listQuestions.map((value, index) => {
              if (maisUtilizados.includes(index)) {
                return (
                  <MenuItem key={index} value={value.id}>
                    {value.id === "PROJETO VENEZA" ? `${value.id} ⚠` : value.id}
                  </MenuItem>
                );
              }
              return null;
            })}

            <ListSubheader>Outros</ListSubheader>
            {listQuestions.map((value, index) => {
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
        </div>

        {siteInfo.tipoSite && siteInfo.tipoSite.includes("PGR") && (
          <div className="container" id="container-pgr">
            <label name="valor-armazenamento">
              Valor Armazenamento
              <input
                id="selectValorArmazenamento"
                name="valor-armazenamento"
                type="text"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorArmazenamento / 100)}
                onChange={(e) =>
                  setValorArmazenamento(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Valor de Armazenamento"
              ></input>
            </label>
            <label name="valor-transporte">
              Valor Transporte
              <input
                id="selectValorTransporte"
                name="valor-transporte"
                type="text"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorTransporte / 100)}
                onChange={(e) =>
                  setValorTransporte(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Valor de Transporte"
              ></input>
            </label>
            <label name="valor-sinistro">
              Valor Sinistro
              <input
                id="selectValorSinistro"
                name="valor-sinistro"
                type="text"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorSinistro / 100)}
                onChange={(e) =>
                  setValorSinistro(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Valor do Sinistro"
              ></input>
            </label>
          </div>
        )}

        {siteInfo.tipoSite && (["LOJA", "LOJA DEALER", "PROJETO VENEZA"].includes(siteInfo.tipoSite)) && (
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
                <option value={"LOJA GALERIA"}>LOJA GALERIA</option>
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
          style={{ display: "none" }}
        >
          <div id="checklist" className="form-new">
            {questions.map((area, indexA) => {
              return (
                <div key={indexA} className="question">
                  <i id="button-area" onClick={() => dropdownArea(indexA)}>
                    {area[0]}
                  </i>
                  <span id={`container-${indexA}`} style={{ display: "none" }}>
                    {area[1].map((doc, indexDoc) => {
                      if (enableQuestions(doc) === true) {
                        return (
                          <div
                            key={indexDoc}
                            className="container-perg question"
                          >
                            {indexDoc + 1} - {doc.question}
                            {doc.isRequired === true && (
                              <FiAlertCircle
                                className="icon-required"
                                size={15}
                                color="#FF0000"
                              />
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
                                            background: `url(${URL.createObjectURL(
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
                            <i className="clearQuestion" onClick={() => clearQuestion(doc, indexA)}>
                              {" "}
                              Limpar{" "}
                            </i>
                          </div>
                        );
                      }
                    })}
                  </span>
                </div>
              );
            })}
            <button
              className="submit-apr"
              onClick={() => {
                const hasUnanswered = hasRequired();
                if (hasUnanswered) {
                  return;
                }
                submit();
              }}
            >
              Concluir APR
            </button>
          </div>
        </div>

        <div
          className="container"
          id="container-conclusion"
          style={{ display: "none" }}
        ></div>

        <Modal_Justificativa
          openModal={openModalJust}
          setModal={setOpenModalJust}
          setJustificativa={setJustificativa}
        />

        {showPostModal && <ModalLoading carregamento={loadingImages} />}
      </div>
    </div>
  );
}
