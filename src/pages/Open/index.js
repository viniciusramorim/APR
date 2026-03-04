import { Fragment, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import { FiClipboard, FiCheck, FiCheckSquare } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";

import "./open.scss";

import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Modal_PA from "../../components/Modal_PA/index.js";
import ModalLoading from "../../components/Modal_Loading";
import telefonicaLogo from "../../assets/telefonica-logo.png";
import EmailLink from "../../components/Email/EmailLink";
import ModalEdit from "../../components/Modal_Edit";
import ModalEditSite from "./ModalEditSite.js";
import ModalEditMotivo from "./ModalEditMotivo.js";
import ModalInfoSiteAPR from "./ModalInfoSiteAPR.js";

// Importar as fontes do pdfmake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default function Open() {
  const base = "aprs-producao"; //aprs-producao

  const { user, logSistem } = useContext(AuthContext);
  const { id } = useParams();

  const [apr, setApr] = useState([]);
  const [aprCompleta, setAprCompleta] = useState([]);
  const [loadApr, setLoadApr] = useState(false);
  //modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPostModalLoading, setShowPostModalLoading] = useState(false);
  const [detail, setDetail] = useState();
  const [area, setArea] = useState();
  const [historicoAPRs, setHistoricoAPRs] = useState([]);
  const [loadHistorico, setLoadHistorico] = useState(false);

  const formatarValor = (valor) => {
    let result = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);

    return result;
  };

  const valorDentroDoIntervalo = (valor, intervalo) => {
    if (!intervalo) return false;
    const convertido = valor / 100;
    return convertido > intervalo.min && convertido <= intervalo.max;
  };

  async function loadHistoricoAPRs(siteData) {
    try {
      const snapshot = await firebase
        .firestore()
        .collection(base)
        .where("site_id.Sigla", "==", siteData.Sigla)
        .where("site_id.Estado", "==", siteData.Estado)
        .orderBy("created", "desc")
        .limit(10)
        .get();

      const aprs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== id) {
          // Não incluir a APR atual
          aprs.push({
            id: doc.id,
            apr_id: data.apr_id || doc.id,
            motivo: data.motivo_apr || "Sem motivo informado",
            status: data.status || "N/A",
            created: data.created,
          });
        }
      });

      setHistoricoAPRs(aprs);
      setLoadHistorico(true);
    } catch (error) {
      console.log("Erro ao carregar histórico de APRs:", error);
      setLoadHistorico(true);
    }
  }

  async function ReloadAPR() {
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .get()
      .then((snapshot) => {
        let apr = snapshot.data();
        setAprCompleta(snapshot.data()); // Corrigindo para usar apr ao invés de snapshot.data()

        // Carregar histórico de APRs para o site
        if (apr.site_id) {
          loadHistoricoAPRs(apr.site_id);
        }

        apr.checklist.forEach((area, indexA) => {
          area[1].forEach((doc, indexQ) => {
            const isEmAberto = apr.status === "Em Aberto";
            const isAguardandoCorrecao = apr.status === "Aguardando Correção";
            const isRevisorOuAdmin =
              user.nivel === "revisor" || user.nivel === "administrador";
            const isDono = user.uid === apr.user_id.uid;
            const hasAnswer = doc.answers !== "";
            const isRespVazio = doc.resp === "";
            const hasValorEstoque =
              doc.valorEstoque?.min != null || doc.valorEstoque?.max != null;
            const isRevisorLoja = hasValorEstoque && isRevisorOuAdmin;
            const isQuestionActiveLoja =
              isRevisorLoja &&
              valorDentroDoIntervalo(apr.valor_estoque, doc.valorEstoque) &&
              doc.tipoLoja?.includes(apr.tipo_loja);
            console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
            console.log(isQuestionActiveLoja);
            console.log(hasValorEstoque);
            console.log(!isQuestionActiveLoja, hasValorEstoque);

            if (isRespVazio && hasAnswer) {
              // Se for aplicador dono da APR e status for "Aguardando Correção", não deletar nada (mostrar tudo)
              if (
                user.nivel === "aplicador" &&
                isDono &&
                isAguardandoCorrecao
              ) {
                // Não deletar - aplicador precisa ver todas as perguntas para verificar correções
              } else if (!isRevisorOuAdmin && !isEmAberto) {
                console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
                delete apr.checklist[indexA][1][indexQ];
              } else if (!isRevisorOuAdmin && isEmAberto && !isDono) {
                console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
                delete apr.checklist[indexA][1][indexQ];
              } else if (!isEmAberto && isRevisorOuAdmin) {
                console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
                delete apr.checklist[indexA][1][indexQ];
              } else if (!isQuestionActiveLoja && hasValorEstoque) {
                console.log(hasValorEstoque);
                console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
                console.log(
                  `Valor Estoque: ${doc.valorEstoque.min} - ${doc.valorEstoque.max}`
                );
                console.log(`isQuestionActiveLoja: ${isQuestionActiveLoja}`);
                console.log(
                  `isRespVazio && hasAnswer: ${isRespVazio && hasAnswer}`
                );
                delete apr.checklist[indexA][1][indexQ];
              }
            }
          });
        });

        setApr(apr);
        setLoadApr(true);
      })
      .catch((error) => {
        console.log("DEU ALGUM ERRO!", error);
        setLoadApr(false);
      });
  }

  useEffect(() => {
    addBodyClass("page-open");
    ReloadAPR();
  }, []);

  // ----------- Download PDF ------------

  function getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.setAttribute("crossOrigin", "anonymous");

      img.onload = () => {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };

      img.onerror = (error) => {
        reject(new Error("Erro ao carregar a imagem: " + error.message));
      };

      img.src = url;

      setTimeout(() => {
        if (!img.complete) {
          reject(new Error("Erro ao carregar a imagem: tempo limite excedido"));
        }
      }, 10000);
    });
  }

  async function generatePDF(e, exportarea) {
    e.preventDefault();

    let pdf = {
      compress: true,
      content: [],
    };

    // Buscar informações adicionais do site
    let siteInfoData = null;
    try {
      const siteSnapshot = await firebase
        .firestore()
        .collection("sites")
        .where("Sigla", "==", apr.site_id.Sigla)
        .where("Estado", "==", apr.site_id.Estado)
        .get();

      if (!siteSnapshot.empty) {
        siteInfoData = siteSnapshot.docs[0].data();
      }
    } catch (error) {
      console.log("Erro ao buscar informações do site:", error);
    }

    pdf.content.push({
      image: await getBase64ImageFromURL(telefonicaLogo),
      width: 100,
      margin: [0, 0, 0, 10],
    });

    pdf.content.push({
      canvas: [
        { type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" },
      ],
    });

    pdf.content.push({
      margin: [0, 20, 0, 0],
      table: {
        widths: [300, 300],
        body: [["ID: " + apr.apr_id]],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      margin: [0, 20, 0, 0],
      table: {
        widths: [300, 300],
        body: [
          [
            "Nome: " + apr.user_id.nome,
            "Criado em: " + format(apr.created.toDate(), "dd/MM/yyyy HH:mm"),
          ],
        ],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      margin: [0, 20, 0, 0],
      table: {
        widths: [300, 300],
        body: [
          [
            "Motivo: " + apr.motivo_apr,
            "Classificação " + calculatePontos(apr.peso),
          ],
        ],
      },
      layout: "noBorders",
    });

    // Informações do site incluindo perímetro, área e imagem
    const siteTableBody = [
      [
        "Sigla-UF: " +
        (apr.site_id?.Sigla || "N/A") +
        "-" +
        (apr.site_id?.Estado || "N/A"),
        "Criticidade: " + (apr.site_id?.critical || "N/A"),
      ],
      [
        "Unidade: " + (apr.site_id?.Nome || "N/A"),
        "Cidade: " + (apr.site_id?.Cidade || "N/A"),
      ],
      [
        "Endereço: " + apr.site_id.Endereco,
        "Latitude: " + apr.site_id.Latitude,
      ],
      ["Bairro: " + apr.site_id.Bairro, "Longitude: " + apr.site_id.Longitude],
    ];

    // Adicionar perímetro e área se disponíveis, alinhados
    if (siteInfoData) {
      if (siteInfoData.perimetro && siteInfoData.area) {
        siteTableBody.push([
          "Perímetro: " + siteInfoData.perimetro + " metros",
          "Área: " + siteInfoData.area + " m²",
        ]);
      } else if (siteInfoData.perimetro) {
        siteTableBody.push([
          "Perímetro: " + siteInfoData.perimetro + " metros",
          "",
        ]);
      } else if (siteInfoData.area) {
        siteTableBody.push(["", "Área: " + siteInfoData.area + " m²"]);
      }
    }

    pdf.content.push({
      margin: [0, 20, 0, 20],
      table: {
        widths: [300, 300],
        body: siteTableBody,
      },
      layout: "noBorders",
    });

    // Adicionar imagem do site se disponível
    if (siteInfoData && siteInfoData.imagem) {
      try {
        const siteImageBase64 = await getBase64ImageFromURL(
          siteInfoData.imagem
        );
        pdf.content.push({
          text: "Imagem do Site:",
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 5],
          color: "#00529B",
        });
        pdf.content.push({
          image: siteImageBase64,
          width: 170,
          alignment: "center",
          margin: [0, 5, 0, 20],
        });
      } catch (error) {
        console.log("Erro ao carregar imagem do site:", error);
      }
    }

    pdf.content.push({
      canvas: [
        { type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" },
      ],
    });

    for (const area of apr.checklist) {
      pdf.content.push({
        text: area[0],
        bold: true,
        fontSize: 20,
        margin: [0, 30, 0, 10],
        color: "#00529B",
        decoration: "underline",
      });

      const docs = area[1];

      for (const doc of docs) {
        if (!doc) continue;

        const incluirDoc =
          exportarea === "All"
            ? doc.resp !== "" ||
            doc.optionListResp?.length > 0 ||
            doc.respTextArea !== ""
            : (exportarea === "oem" &&
              doc.resp !== "" &&
              doc.resp !== "N/A" &&
              doc.resp !== doc.respGabarito &&
              doc.openPA === true &&
              doc.areaResposavel?.includes("oem")) ||
            (exportarea === "patrimonio" &&
              doc.resp !== "" &&
              doc.resp !== "N/A" &&
              doc.resp !== doc.respGabarito &&
              doc.openPA === true &&
              doc.areaResposavel?.includes("patrimonio"));

        if (!incluirDoc) continue;

        for (const imgs of doc.imagesURL) {
          imgs.url = await getBase64ImageFromURL(imgs.url);
        }

        pdf.content.push({
          text: `${doc.question}`,
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5],
          background: "#F2F2F2",
          alignment: "left",
        });

        if (doc.resp !== "") {
          const respColor =
            doc.resp === "Sim"
              ? "#4CAF50"
              : doc.resp === "N/A"
                ? "#FFA500"
                : "#F44336";

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

        if (doc.optionListResp?.length > 0) {
          pdf.content.push({
            ul: doc.optionListResp.map((option) => `${option}`),
            margin: [10, 5, 0, 5],
          });
        }

        if (doc.respQuantidade) {
          pdf.content.push({
            text: `Quantidade: ${doc.respQuantidade}`,
            margin: [10, 5, 0, 5],
            italics: true,
          });
        }

        if (doc.respInputNumber) {
          pdf.content.push({
            text: `Quantidade: ${doc.respInputNumber}`,
            margin: [10, 5, 0, 5],
            italics: true,
          });
        }

        if (doc.respTextArea !== "") {
          pdf.content.push({
            text: `Observações: ${doc.respTextArea}`,
            italics: true,
            margin: [10, 5, 0, 5],
          });
        }

        for (const imgs of doc.imagesURL) {
          try {
            pdf.content.push({
              image: imgs.url,
              width: 150,
              height: 150,
              margin: [0, 10, 10, 10],
            });
          } catch (error) {
            console.log("Erro ao adicionar imagem: ", error);
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

    const sigla = apr.site_id?.Sigla || "SITE";
    const estado = apr.site_id?.Estado || "UF";
    const aprId = apr.apr_id || "APR";
    pdfMake
      .createPdf(pdf)
      .download(`APR Digital ${sigla}_${aprId}_${estado}.pdf`);
  }

  // -------------------------------------

  function togglePostModal(item, area) {
    setShowPostModal(!showPostModal); //trocando de true pra false
    setDetail(item);
    setArea(area);
  }

  function togglePostModalLoading() {
    setShowPostModalLoading(!showPostModalLoading); //trocando de true pra false
  }

  function dropdownArea(indexA) {
    let element = document.getElementById(`container-${indexA}`).style.display;
    document.getElementById(`container-${indexA}`).style.display =
      element === "none" ? "block" : "none";
  }

  async function alterarPA(indexA, indexQ) {
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          // Obtenha os dados do documento
          const dados = doc.data();

          // Atualize o valor no array interno
          dados.checklist[indexA][1][indexQ].openPA = true;

          // Agora, atualize o documento no Firestore
          await firebase
            .firestore()
            .collection(base)
            .doc(id)
            .update(dados)
            .then(() => {
              toast.success("Valor atualizado com sucesso!");
              logSistem(`PA Ativa para ${indexA} - ${indexQ}`, id);
            })
            .catch((error) => {
              toast.error("Erro ao atualizar valor:", error);
              console.log("Erro ao atualizar valor:", error);
            });
        } else {
          console.log("O documento não existe.");
        }
      });
  }

  function calculatePontos(peso) {
    if (peso <= 10) {
      return `Risco Muito Baixo`;
    } else if (peso >= 11 && peso <= 30) {
      return `Risco Baixo`;
    } else if (peso >= 31 && peso <= 50) {
      return `Risco Médio`;
    } else if (peso >= 51 && peso <= 70) {
      return `Risco Alto`;
    } else if (peso >= 71) {
      return `Risco Muito Alto`;
    }
  }

  async function updateStatusAPR(e, id) {
    e.preventDefault();
    let confirm = window.confirm(
      "Deseja realmente alterar o status para CONCLUIDO da APR?"
    );
    if (confirm === false) return;
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        status: "Concluido",
      })
      .then(() => {
        toast.success("APR finalizada com sucesso!");
        logSistem(`APR finalizada`, id);
        ReloadAPR();
      })
      .catch((error) => {
        toast.error("Erro ao atualizar status da apr:", error);
        console.log("Erro ao atualizar status da apr:", error);
      });
  }

  // Função para revisor_logistica finalizar APR após correções
  async function finalizarAPRRevisorLogistica(e, id) {
    e.preventDefault();

    let confirm = window.confirm(
      "Confirma a finalização da APR? O status será alterado para Concluído."
    );
    if (confirm === false) return;

    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(id)
        .update({
          status: "Concluido",
          data_finalizacao: firebase.firestore.FieldValue.serverTimestamp(),
          data_alteracao: new Date(),
        });

      toast.success("APR finalizada com sucesso!");
      logSistem(`APR finalizada pelo revisor_logistica`, id);
      ReloadAPR();
    } catch (error) {
      toast.error("Erro ao finalizar APR: " + error.message);
      console.error("Erro:", error);
    }
  }

  // Função para revisor_logistica enviar APR para operação após validar todos os planos
  async function enviarParaOperacao(e, id) {
    e.preventDefault();

    let confirm = window.confirm(
      "Confirma o envio para operação? O aplicador poderá conferir as correções."
    );
    if (confirm === false) return;

    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(id)
        .update({
          status: "Em Aberto",
          data_alteracao: new Date(),
        });

      toast.success("APR enviada para operação!");
      logSistem(`APR enviada para operação pelo revisor_logistica`, id);
      ReloadAPR();
    } catch (error) {
      toast.error("Erro ao enviar para operação: " + error.message);
      console.error("Erro:", error);
    }
  }

  // Função para verificar se todos os planos de ação foram definidos
  function verificarSeTemPendencias() {
    const checklist = apr.checklist;
    let temPendencias = false;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.openPA !== true;
        // Se tem inconformidade mas não tem plano de ação definido
        if (hasInconformity && !question.resp_pa_selectedOption && question.openPA === true) {
          temPendencias = true;
        }
      });
    });

    return temPendencias;
  }

  // Função para verificar se todos os planos de ação foram validados pelo revisor_logistica
  function verificarTodosValidados() {
    const checklist = apr.checklist;
    let todosValidados = true;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.resp !== question.respGabarito;

        // Se tem inconformidade, precisa estar validado (resp_pa_status = "Concluido")
        if (hasInconformity && question.resp_pa_selectedOption && question.resp_pa_status !== "Concluido") {
          todosValidados = false;
        }
      });
    });

    return todosValidados;
  }

  // Função para ponto focal enviar APR para monitoramento de SLA
  async function enviarParaMonitoramento(e, id) {
    e.preventDefault();

    // Verificar se todos os planos de ação foram definidos
    const checklist = apr.checklist;
    let temPendencias = false;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.resp !== question.respGabarito;

        // Se tem inconformidade mas não tem plano de ação definido
        if (hasInconformity && !question.resp_pa_selectedOption) {
          temPendencias = true;
        }
      });
    });

    if (temPendencias) {
      toast.error("Ainda existem inconformidades sem plano de ação definido!");
      return;
    }

    let confirm = window.confirm(
      "Confirma o envio da APR para monitoramento de SLA? Os alertas serão enviados automaticamente."
    );
    if (confirm === false) return;

    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        status: "Monitoramento SLA",
        data_envio_monitoramento:
          firebase.firestore.FieldValue.serverTimestamp(),
        data_alteracao: new Date(),
      })
      .then(() => {
        toast.success("APR enviada para monitoramento de SLA!");
        logSistem(`APR enviada para monitoramento de SLA pelo ponto focal`, id);
        ReloadAPR();
      })
      .catch((error) => {
        toast.error("Erro ao enviar para monitoramento:", error);
        console.log("Erro ao enviar para monitoramento:", error);
      });
  }

  // Função para ponto focal enviar APR para revisão após definir SLAs
  async function enviarParaRevisao(e, id) {
    e.preventDefault();

    // Verificar se todos os planos de ação foram definidos
    const checklist = apr.checklist;
    let temPendencias = false;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        const hasInconformity =
          question.resp &&
          question.resp !== "N/A" &&
          question.resp !== question.respGabarito;

        // Se tem inconformidade mas não tem plano de ação definido
        if (hasInconformity && !question.resp_pa_selectedOption) {
          temPendencias = true;
        }
      });
    });

    if (temPendencias) {
      toast.error("Ainda existem inconformidades sem plano de ação definido!");
      return;
    }

    let confirm = window.confirm(
      "Confirma o envio da APR para revisão? O revisor e revisor_logistica serão notificados."
    );
    if (confirm === false) return;

    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(id)
        .update({
          status: "Aguardando Revisão",
          data_envio_revisao: firebase.firestore.FieldValue.serverTimestamp(),
          data_alteracao: new Date(),
        });

      try {
        const destinatarios = await sendEmailToRevisor(apr, id);
        logSistem(
          "Email enviado para revisor - planos de acao definidos",
          id,
          destinatarios
        );
      } catch (error) {
        toast.error("Erro ao enviar e-mail para revisor: " + error.message);
        console.error("Erro ao enviar e-mail para revisor:", error);
      }

      toast.success("APR enviada para revisão com sucesso!");
      logSistem(`APR enviada para revisão pelo ponto focal`, id);
      ReloadAPR();
    } catch (error) {
      toast.error("Erro ao enviar para revisão: " + error.message);
      console.error("Erro:", error);
    }
  }

  async function fetchRevisorEmails() {
    const snapshot = await firebase
      .firestore()
      .collection("users")
      .where("nivel", "==", "revisor")
      .where("status", "==", true)
      .get();

    const emails = [];
    snapshot.forEach((doc) => {
      const email = doc.data().email;
      if (email && email.trim()) {
        emails.push(email.trim());
      }
    });

    return Array.from(new Set(emails));
  }

  async function sendEmailToRevisor(aprData, aprId) {
    const revisorEmails = await fetchRevisorEmails();

    if (!revisorEmails.length) {
      throw new Error("Nenhum e-mail de revisor encontrado");
    }

    const destinatario = revisorEmails.join(";");
    const siteNome = aprData?.site_id?.Nome || "N/I";
    const siteSigla = aprData?.site_id?.Sigla || "N/I";
    const siteCidade = aprData?.site_id?.Cidade || "N/I";
    const siteEstado = aprData?.site_id?.Estado || "N/I";
    const aprRef = aprData?.apr_id || aprId;

    const emailContent = {
      remetente: "aprdigital.seg.br@telefonica.com",
      assunto: `APR Digital - Planos de acao definidos - ${siteSigla}`,
      destinatario,
      texto: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
          <h2 style="color: #1976d2;">APR Digital - Revisao Necessaria</h2>
          <p>Foram incluidos planos de acao para as inconformidades da APR.</p>
          <p>Por favor, realize a revisao e aprove os planos de acao.</p>
          <p><strong>APR:</strong> ${aprRef}</p>
          <p><strong>Site:</strong> ${siteNome} (${siteSigla})</p>
          <p><strong>Localizacao:</strong> ${siteCidade}/${siteEstado}</p>
          <p>Para revisar, acesse o link:</p>
          <p><a href="${window.location.origin}/Open/${aprId}">${window.location.origin}/Open/${aprId}</a></p>
          <hr />
          <small>Mensagem automatica - APR Digital</small>
        </div>
      `,
    };

    const response = await fetch(
      "https://us-central1-aprdigital-b6fcf.cloudfunctions.net/sendEmail",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailContent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP! status: ${response.status} - ${errorText}`);
    }

    return destinatario;
  }

  // Função para aplicador finalizar APR após correções
  async function finalizarCorrecoes(e, id) {
    e.preventDefault();

    // Verificar se todas as correções pendentes foram feitas
    const checklist = apr.checklist;
    let temPendencias = false;
    let totalCorrecoes = 0;
    let correcoesFeitas = 0;

    checklist.forEach((area) => {
      area[1].forEach((question) => {
        if (question.openPA === true && question.resp_pa_selectedOption) {
          totalCorrecoes++;
          if (question.plano_acao?.resolvido) {
            correcoesFeitas++;
          } else {
            temPendencias = true;
          }
        }
      });
    });

    if (temPendencias) {
      toast.error(
        `Ainda existem correções pendentes! (${correcoesFeitas}/${totalCorrecoes} concluídas)`
      );
      return;
    }

    let confirm = window.confirm(
      `Todas as ${totalCorrecoes} correções foram feitas. Deseja enviar a APR para revisão?`
    );
    if (confirm === false) return;

    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        status: "Aguardando Revisão",
        data_correcao_aplicador:
          firebase.firestore.FieldValue.serverTimestamp(),
        data_alteracao: new Date(),
      })
      .then(() => {
        toast.success("Correções finalizadas! APR enviada para revisão.");
        logSistem(
          `Aplicador finalizou ${totalCorrecoes} correções - APR marcada como Aguardando Revisão`,
          id
        );
        ReloadAPR();
      })
      .catch((error) => {
        toast.error("Erro ao finalizar correções:", error);
        console.log("Erro ao finalizar correções:", error);
      });
  }

  function visualizarAPR(aprId) {
    window.open(`/open/${aprId}`, "_blank");
  }

  // Função para gerar PDF apenas das inconformidades
  async function generateInconformidadesPDF(e) {
    e.preventDefault();

    let pdf = {
      compress: true,
      content: [],
    };

    pdf.content.push({
      image: await getBase64ImageFromURL(telefonicaLogo),
      width: 100,
      margin: [0, 0, 0, 10],
    });

    pdf.content.push({
      canvas: [
        { type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" },
      ],
    });

    pdf.content.push({
      text: "RELATÓRIO DE INCONFORMIDADES",
      fontSize: 18,
      bold: true,
      alignment: "center",
      margin: [0, 20, 0, 10],
      color: "#00529B",
    });

    pdf.content.push({
      margin: [0, 20, 0, 0],
      table: {
        widths: [300, 300],
        body: [["ID: " + apr.apr_id]],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      margin: [0, 10, 0, 0],
      table: {
        widths: [300, 300],
        body: [
          [
            "Nome: " + apr.user_id.nome,
            "Criado em: " + format(apr.created.toDate(), "dd/MM/yyyy HH:mm"),
          ],
        ],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      margin: [0, 10, 0, 0],
      table: {
        widths: [300, 300],
        body: [
          [
            "Sigla-UF: " +
            (apr.site_id?.Sigla || "N/A") +
            "-" +
            (apr.site_id?.Estado || "N/A"),
            "Unidade: " + (apr.site_id?.Nome || "N/A"),
          ],
        ],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      canvas: [
        { type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" },
      ],
      margin: [0, 20, 0, 0],
    });

    let temInconformidades = false;

    for (const area of apr.checklist) {
      const docs = area[1];
      let areaComInconformidades = false;

      for (const doc of docs) {
        if (!doc) continue;

        // Verificar se é uma inconformidade
        const isInconformidade =
          doc.resp !== "" &&
          doc.resp !== "N/A" &&
          doc.resp !== doc.respGabarito;

        if (!isInconformidade) continue;

        if (!areaComInconformidades) {
          pdf.content.push({
            text: area[0],
            bold: true,
            fontSize: 16,
            margin: [0, 20, 0, 10],
            color: "#00529B",
            decoration: "underline",
          });
          areaComInconformidades = true;
        }

        temInconformidades = true;

        // Processar imagens
        for (const imgs of doc.imagesURL) {
          imgs.url = await getBase64ImageFromURL(imgs.url);
        }

        pdf.content.push({
          text: `${doc.question}`,
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5],
          background: "#FFE5E5",
          alignment: "left",
        });

        // Resposta com cor de destaque
        pdf.content.push({
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: doc.resp,
                  fillColor: "#F44336",
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

        // Opções de lista
        if (doc.optionListResp?.length > 0) {
          pdf.content.push({
            ul: doc.optionListResp.map((option) => `${option}`),
            margin: [10, 5, 0, 5],
          });
        }

        // Quantidade
        if (doc.respQuantidade) {
          pdf.content.push({
            text: `Quantidade: ${doc.respQuantidade}`,
            margin: [10, 5, 0, 5],
            italics: true,
          });
        }

        if (doc.respInputNumber) {
          pdf.content.push({
            text: `Quantidade: ${doc.respInputNumber}`,
            margin: [10, 5, 0, 5],
            italics: true,
          });
        }

        // Observações
        if (doc.respTextArea !== "") {
          pdf.content.push({
            text: `Observações: ${doc.respTextArea}`,
            italics: true,
            margin: [10, 5, 0, 5],
            color: "#666",
          });
        }

        // Plano de Ação (se existir)
        if (doc.resp_pa_selectedOption) {
          const planoAcao = doc.plano_acao || {};

          const formatSla = (value) => {
            if (!value) return "";
            if (typeof value.toDate === "function") {
              return format(value.toDate(), "dd/MM/yyyy");
            }
            if (value instanceof Date) {
              return format(value, "dd/MM/yyyy");
            }
            return value;
          };

          pdf.content.push({
            text: "Plano de Ação:",
            bold: true,
            fontSize: 11,
            margin: [10, 10, 0, 5],
            color: "#00529B",
          });

          pdf.content.push({
            text: `Opção: ${doc.resp_pa_selectedOption}`,
            margin: [20, 5, 0, 5],
          });

          const slaTempo = formatSla(planoAcao.tempo);
          if (slaTempo) {
            pdf.content.push({
              text: `SLA: ${slaTempo}`,
              margin: [20, 5, 0, 5],
            });
          }

          const slaLogistica = formatSla(planoAcao.sla_logistica);
          if (slaLogistica) {
            pdf.content.push({
              text: `SLA Logistica: ${slaLogistica}`,
              margin: [20, 5, 0, 5],
            });
          }

          if (planoAcao.comentario) {
            pdf.content.push({
              text: `Comentario do Plano de Acao: ${planoAcao.comentario}`,
              margin: [20, 5, 0, 5],
              italics: true,
              color: "#555",
            });
          }

          if (planoAcao.comentario_correcao) {
            pdf.content.push({
              text: `Comentario da Correcao: ${planoAcao.comentario_correcao}`,
              margin: [20, 5, 0, 5],
              italics: true,
              color: "#555",
            });
          }

          if (doc.resp_pa_sla) {
            pdf.content.push({
              text: `SLA: ${format(
                doc.resp_pa_sla.toDate(),
                "dd/MM/yyyy"
              )}`,
              margin: [20, 5, 0, 5],
            });
          }

          if (doc.resp_pa_responsavel) {
            pdf.content.push({
              text: `Responsável: ${doc.resp_pa_responsavel}`,
              margin: [20, 5, 0, 5],
            });
          }

          if (doc.resp_pa_observacao) {
            pdf.content.push({
              text: `Observação: ${doc.resp_pa_observacao}`,
              margin: [20, 5, 0, 5],
              italics: true,
            });
          }

          if (doc.resp_pa_status) {
            const statusColor =
              doc.resp_pa_status === "Concluido"
                ? "#4CAF50"
                : doc.resp_pa_status === "Em Andamento"
                  ? "#FFA500"
                  : "#F44336";

            pdf.content.push({
              text: `Status: ${doc.resp_pa_status}`,
              margin: [20, 5, 0, 5],
              color: statusColor,
              bold: true,
            });
          }
        }

        // Imagens ANTES (originais da inconformidade)
        if (doc.imagesURL && doc.imagesURL.length > 0) {
          pdf.content.push({
            text: "📸 Fotos ANTES:",
            bold: true,
            fontSize: 11,
            margin: [10, 10, 0, 5],
            color: "#F44336",
          });

          for (const imgs of doc.imagesURL) {
            try {
              pdf.content.push({
                image: imgs.url,
                width: 150,
                height: 150,
                margin: [20, 5, 10, 5],
              });
            } catch (error) {
              console.log("Erro ao adicionar imagem ANTES: ", error);
            }
          }
        }

        // Imagens DEPOIS (correção)
        if (doc.plano_acao?.imagens_correcao && doc.plano_acao.imagens_correcao.length > 0) {
          pdf.content.push({
            text: "✅ Fotos DEPOIS (Correção):",
            bold: true,
            fontSize: 11,
            margin: [10, 10, 0, 5],
            color: "#4CAF50",
          });

          for (const imgUrl of doc.plano_acao.imagens_correcao) {
            try {
              const imgBase64 = await getBase64ImageFromURL(imgUrl);
              pdf.content.push({
                image: imgBase64,
                width: 150,
                height: 150,
                margin: [20, 5, 10, 5],
              });
            } catch (error) {
              console.log("Erro ao adicionar imagem DEPOIS: ", error);
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

    if (!temInconformidades) {
      pdf.content.push({
        text: "Nenhuma inconformidade encontrada! ✅",
        fontSize: 14,
        alignment: "center",
        margin: [0, 50, 0, 0],
        color: "#4CAF50",
        bold: true,
      });
    }

    pdfMake
      .createPdf(pdf)
      .download(`APR_Inconformidades_${apr.apr_id}_${Date.now()}.pdf`);

    toast.success("PDF de Inconformidades gerado com sucesso!");
  }

  return (
    <div>
      <Header name="Aplicar APR" subtitle="Gerador de Relatórios"></Header>

      <div className="content">
        <div id="exportContent">
          {loadApr ? (
            <>
              {(user.nivel === "administrador" ||
                (user.nivel === "revisor" && apr.status === "Em Aberto")) && (
                  <div className="container header-actions">
                    <div className="siteInfo group-buttons">
                      <ModalEditSite
                        idDoc={id}
                        ReloadAPR={ReloadAPR}
                        tipoSite={apr.site_id.tipoSite}
                        logSistem={logSistem}
                      />
                      <ModalInfoSiteAPR
                        sigla={apr.site_id?.Sigla}
                        estado={apr.site_id?.Estado}
                      />
                      <ModalEditMotivo
                        apr={apr}
                        id={id}
                        logSistem={logSistem}
                        ReloadAPR={ReloadAPR}
                      />
                    </div>
                  </div>
                )}

              <div className="container">
                <div className="info-group">
                  <div className="info-card">
                    <div className="card-title">📋 Informações da APR</div>
                    <div className="card-content">
                      <div className="info-item">
                        <span className="label">SIGLA:</span>
                        <span className="value">
                          {apr.site_id?.Sigla
                            ? apr.site_id.Sigla + "-" + apr.site_id.Estado
                            : "N/A"}
                        </span>
                      </div>
                      <div
                        className="info-item"
                        style={{ textTransform: "none" }}
                      >
                        <span className="label">ID APR:</span>
                        <span className="value">
                          {apr.apr_id ? apr.apr_id : id}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Status:</span>
                        <span
                          className={`status-badge status-${apr.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {apr.status}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Classificação:</span>
                        <span className="value">
                          {apr.status !== "Com Exceção" &&
                            calculatePontos(apr.peso)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="card-title">🏢 Informações do Site</div>
                    <div className="card-content">
                      <div className="info-item">
                        <span className="label">Unidade:</span>
                        <span className="value">{apr.site_id.Nome}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Cidade:</span>
                        <span className="value">
                          {apr.site_id?.Cidade && apr.site_id?.Estado
                            ? `${apr.site_id.Cidade}/${apr.site_id.Estado}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Criticidade:</span>
                        <span
                          className={`criticality-badge criticality-${apr.site_id.critical.toLowerCase()}`}
                        >
                          {apr.site_id.critical}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Tipo:</span>
                        <span className="value">{apr.site_id.tipoSite}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="card-title">⏱️ Tempo & Execução</div>
                    <div className="card-content">
                      <div className="info-item">
                        <span className="label">Responsável:</span>
                        <span className="user-name">{apr.user_id.nome}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Criado:</span>
                        <span className="value">
                          {format(apr.created.toDate(), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Período:</span>
                        <span className="value">
                          {format(apr.tempoConclusao.inicio.toDate(), "HH:mm")}{" "}
                          -{" "}
                          {format(
                            apr.tempoConclusao.conclusao.toDate(),
                            "HH:mm"
                          )}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Duração:</span>
                        <span className="duration-badge">
                          {Math.ceil(
                            (apr.tempoConclusao.conclusao.toDate() -
                              apr.tempoConclusao.inicio.toDate()) /
                            (1000 * 60)
                          )}{" "}
                          min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="card-title">📍 Localização</div>
                    <div className="card-content">
                      <div className="info-item">
                        <span className="label">Endereço:</span>
                        <span className="value">{apr.site_id.Endereco}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Motivo:</span>
                        <span className="value">{apr.motivo_apr}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Coordenadas:</span>
                        <span className="value">
                          {apr.locationCreated.latitude &&
                            typeof apr.locationCreated.latitude === "number"
                            ? `${apr.locationCreated.latitude.toFixed(
                              5
                            )}, ${apr.locationCreated.longitude.toFixed(5)}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Perímetro:</span>
                        <span
                          className={`perimeter-badge ${apr.locationCreated.perimetro === "fora perimetro"
                              ? "perimeter-outside"
                              : apr.locationCreated.perimetro ===
                                "Esta dentro do Perimetro"
                                ? "perimeter-inside"
                                : "perimeter-unknown"
                            }`}
                        >
                          {apr.locationCreated.perimetro}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container">
                <div className="info-card history-card">
                  <div className="card-title">📚 Histórico de APRs</div>
                  <div className="card-content">
                    {loadHistorico ? (
                      historicoAPRs.length > 0 ? (
                        <div className="history-list">
                          {historicoAPRs.map((aprHist, index) => (
                            <div key={aprHist.id} className="history-item">
                              <div className="history-header">
                                <div className="history-id-wrapper">
                                  <span className="history-label">APR</span>
                                  <span className="history-id">
                                    {aprHist.apr_id}
                                  </span>
                                </div>
                                <span
                                  className={`status-badge status-${aprHist.status
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                >
                                  {aprHist.status}
                                </span>
                              </div>
                              <div className="history-body">
                                <div className="history-motivo-wrapper">
                                  <span className="motivo-label">Motivo:</span>
                                  <span className="history-motivo">
                                    {aprHist.motivo}
                                  </span>
                                </div>
                                {aprHist.created && (
                                  <span className="history-date">
                                    📅{" "}
                                    {format(
                                      aprHist.created.toDate(),
                                      "dd/MM/yyyy"
                                    )}{" "}
                                    às{" "}
                                    {format(aprHist.created.toDate(), "HH:mm")}
                                  </span>
                                )}
                              </div>
                              <button
                                className="btn-visualizar"
                                onClick={() => visualizarAPR(aprHist.id)}
                                title="Visualizar APR"
                              >
                                👁️ Visualizar
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-history">
                          <span>
                            📋 Nenhuma APR anterior encontrada para este site
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="loading-history">
                        <span>🔄 Carregando histórico...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(apr.valor_armazenamento ||
                apr.valor_transporte ||
                apr.valor_sinistro) && (
                  <div className="container">
                    <div className="siteInfo">
                      <span>
                        <strong>VALOR ARMAZENAMENTO:</strong>{" "}
                        {apr.valor_armazenamento
                          ? formatarValor(parseInt(apr.valor_armazenamento))
                          : "R$ 0"}
                      </span>
                      <span>
                        <strong>VALOR TRANSPORTE:</strong>{" "}
                        {apr.valor_transporte
                          ? formatarValor(parseInt(apr.valor_transporte))
                          : "R$ 0"}
                      </span>
                      <span>
                        <strong>VALOR SINISTRO:</strong>{" "}
                        {apr.valor_sinistro
                          ? formatarValor(parseInt(apr.valor_sinistro))
                          : "R$ 0"}
                      </span>
                    </div>
                  </div>
                )}

              {apr.valor_estoque && apr.tipo_loja && (
                <div className="container">
                  <div className="siteInfo">
                    <span>Tipo de Loja:</span> {apr.tipo_loja}
                    <span>Valor Estoque:</span>{" "}
                    {formatarValor(parseInt(apr.valor_estoque))}
                  </div>
                </div>
              )}

              {apr.justificativa ? (
                <div className="container">
                  <div className="siteInfo">
                    <ul>
                      <li>
                        <span>APR NÃO REALIZADA E JUSTIFICADA</span>
                      </li>
                      <li>
                        <span>MOTIVO: </span>
                        {apr.justificativa.motivo}
                      </li>
                      <li
                        style={{
                          display:
                            apr.justificativa.motivo === "Site Desativado"
                              ? "block"
                              : "none",
                        }}
                      >
                        <span>DATA INATIVADO: </span>
                        {apr.justificativa.data_inativo &&
                          format(
                            apr.justificativa.data_inativo.toDate(),
                            "dd/MM/yyyy"
                          )}
                      </li>
                      <li>
                        <span>DESCRIÇÃO: </span>
                        {apr.justificativa.desc}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="container">
                  <form className="form-open">
                    {apr.checklist.map((area, indexA) => {
                      return (
                        area[1].length > 0 && (
                          <div key={indexA}>
                            <i
                              id="button-area"
                              onClick={() => dropdownArea(indexA)}
                            >
                              {area[0]}
                            </i>
                            <span
                              id={`container-${indexA}`}
                              style={{ display: "none" }}
                            >
                              {area[1].map((doc, indexQ) => {
                                if (user.area === "oem") {
                                  let area = doc.areaResposavel.includes(
                                    user.area
                                  );
                                  if (
                                    doc.openPA === true &&
                                    doc.resp !== "N/A" &&
                                    doc.respGabarito !== doc.resp &&
                                    area === true
                                  ) {
                                    return (
                                      <div
                                        key={indexQ}
                                        className="container-perg-open"
                                        id={indexA + "-export-" + indexQ}
                                      >
                                        <label>
                                          {indexQ + 1} - {doc.question}
                                        </label>
                                        Resposta:
                                        <span data-text={doc.resp}>
                                          {doc.resp}
                                        </span>
                                        {doc.inputNumber && (
                                          <span>
                                            Quantidade: {doc.respInputNumber}
                                          </span>
                                        )}
                                        {doc.listCheck &&
                                          doc.optionListResp !== "" &&
                                          doc.optionListResp.map(
                                            (value, index) => {
                                              return (
                                                <span className="list_resp_question">
                                                  <FiCheckSquare />
                                                  {value}
                                                </span>
                                              );
                                            }
                                          )}
                                        {doc.respTextArea && (
                                          <>
                                            Comentario:
                                            <span
                                              className="textArea"
                                              data-text={doc.respTextArea}
                                            >
                                              {doc.respTextArea}
                                            </span>
                                          </>
                                        )}
                                        {doc.imagesURL && (
                                          <>
                                            Anexos:
                                            {doc.imagesURL.map(
                                              (imgs, indexImg) => {
                                                return (
                                                  <img
                                                    key={indexImg}
                                                    src={
                                                      imgs.url ? imgs.url : imgs
                                                    }
                                                  />
                                                );
                                              }
                                            )}
                                          </>
                                        )}
                                        {doc.openPA === true &&
                                          doc.resp !== "N/A" &&
                                          doc.resp !== doc.respGabarito &&
                                          user.uid !== apr.id_user &&
                                          (user.nivel !== "aplicador" || apr.status !== "Em Aberto") ? (
                                          <>
                                            <label className="plano-acao">
                                              {doc.plano_acao.comentario ? (
                                                <a
                                                  data-check="Sim"
                                                  onClick={() =>
                                                    togglePostModal(doc, indexA)
                                                  }
                                                >
                                                  <FiCheck size={20} />
                                                  {user.nivel === "aplicador" &&
                                                    doc.resp_pa_selectedOption
                                                    ? "✏️ Corrigir"
                                                    : "Plano de Ação"}
                                                </a>
                                              ) : (
                                                <a
                                                  data-check="Não"
                                                  onClick={() =>
                                                    togglePostModal(doc, indexA)
                                                  }
                                                >
                                                  {user.nivel === "aplicador" &&
                                                    doc.resp_pa_selectedOption
                                                    ? "✏️ Corrigir"
                                                    : "Plano de Ação"}
                                                </a>
                                              )}
                                            </label>
                                          </>
                                        ) : null}
                                      </div>
                                    );
                                  }
                                } else if (
                                  user.nivel === "revisor" ||
                                  user.nivel === "administrador" ||
                                  user.uid === apr.user_id.uid
                                ) {
                                  return (
                                    <div
                                      key={indexQ}
                                      className="container-perg-open"
                                      id={indexA + "-export-" + indexQ}
                                      style={{
                                        background:
                                          (doc.resp && doc.answers) ||
                                            (!doc.resp && !doc.answers)
                                            ? "#e7e6e6"
                                            : "transparent",
                                      }}
                                    >
                                      {(apr.status === "Em Aberto" ||
                                        (apr.status === "Aguardando Correção" &&
                                          user.uid === apr.user_id.uid)) && 
                                        user.nivel !== "ponto_focal" && 
                                        user.nivel !== "aplicador" && (
                                          <ModalEdit
                                            areaIndex={indexA}
                                            questionIndex={indexQ}
                                            questionId={doc.questionId}
                                            checklistCompleto={
                                              aprCompleta.checklist
                                            }
                                            logSistem={logSistem}
                                            id={id}
                                            loadApr={ReloadAPR}
                                          ></ModalEdit>
                                        )}
                                      <label>
                                        {indexQ + 1} - {doc.question}
                                      </label>
                                      Resposta:
                                      <span data-text={doc.resp}>
                                        {doc.resp}
                                      </span>
                                      {doc.inputNumber && (
                                        <span>
                                          Quantidade: {doc.respInputNumber}
                                        </span>
                                      )}
                                      {doc.listCheck &&
                                        doc.optionListResp !== "" &&
                                        doc.optionListResp.map(
                                          (value, index) => {
                                            return (
                                              <span className="list_resp_question">
                                                <FiCheckSquare />
                                                {value}
                                              </span>
                                            );
                                          }
                                        )}
                                      {doc.respTextArea && (
                                        <>
                                          Comentario:
                                          <span
                                            className="textArea"
                                            data-text={doc.respTextArea}
                                          >
                                            {doc.respTextArea}
                                          </span>
                                        </>
                                      )}
                                      {doc.imagesURL && (
                                        <>
                                          Anexos:
                                          {doc.imagesURL.map(
                                            (imgs, indexImg) => {
                                              return (
                                                <img
                                                  key={indexImg}
                                                  src={
                                                    imgs.url ? imgs.url : imgs
                                                  }
                                                />
                                              );
                                            }
                                          )}
                                        </>
                                      )}
                                      {doc.openPA === true &&
                                        doc.resp !== doc.respGabarito &&
                                        doc.resp !== "N/A" &&
                                        doc.resp !== "" &&
                                        user.uid !== apr.id_user &&
                                        (user.nivel !== "aplicador" || apr.status !== "Em Aberto") && (
                                          <label className="plano-acao">
                                            {doc.plano_acao.comentario ? (
                                              <a
                                                data-check={
                                                  doc.resp_pa_status ===
                                                    "Concluido"
                                                    ? "Sim"
                                                    : "Concluido"
                                                }
                                                onClick={() =>
                                                  togglePostModal(doc, indexA)
                                                }
                                              >
                                                <FiCheck size={20} />
                                                {doc.resp_pa_status ===
                                                  "Concluido"
                                                  ? "Plano de Ação Validado"
                                                  : "Plano de Ação"}
                                              </a>
                                            ) : (
                                              <a
                                                data-check="Não"
                                                onClick={() =>
                                                  togglePostModal(doc, indexA)
                                                }
                                              >
                                                Plano de Ação
                                              </a>
                                            )}
                                          </label>
                                        )}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      key={indexQ}
                                      className="container-perg-open"
                                      id={indexA + "-export-" + indexQ}
                                    >
                                      <label>
                                        {indexQ + 1} - {doc.question}
                                      </label>
                                      Resposta:
                                      <span data-text={doc.resp}>
                                        {doc.resp}
                                      </span>
                                      {doc.inputNumber && (
                                        <span>
                                          Quantidade: {doc.respInputNumber}
                                        </span>
                                      )}
                                      {doc.listCheck &&
                                        doc.optionListResp !== "" &&
                                        doc.optionListResp.map(
                                          (value, index) => {
                                            return (
                                              <span className="list_resp_question">
                                                <FiCheckSquare />
                                                {value}
                                              </span>
                                            );
                                          }
                                        )}
                                      {doc.respTextArea && (
                                        <>
                                          Comentario:
                                          <span
                                            className="textArea"
                                            data-text={doc.respTextArea}
                                          >
                                            {doc.respTextArea}
                                          </span>
                                        </>
                                      )}
                                      {doc.imagesURL.length > 0 && (
                                        <>
                                          Anexos:
                                          {doc.imagesURL.map(
                                            (imgs, indexImg) => {
                                              return (
                                                <img
                                                  key={indexImg}
                                                  src={
                                                    imgs.url ? imgs.url : imgs
                                                  }
                                                />
                                              );
                                            }
                                          )}
                                        </>
                                      )}
                                      {doc.openPA === true &&
                                        doc.resp !== doc.respGabarito &&
                                        doc.plano_acao.comentario && (
                                          <label className="plano-acao">
                                            <a
                                              data-check="Sim"
                                              onClick={() =>
                                                togglePostModal(doc, indexA)
                                              }
                                            >
                                              <FiCheck size={20} />
                                              Plano de Ação
                                            </a>
                                          </label>
                                        )}
                                      {(user.nivel === "administrador" ||
                                        user.nivel === "revisor") &&
                                        doc.resp !== doc.respGabarito &&
                                        doc.openPA === false && (
                                          <span
                                            data-text="Ativar-PA"
                                            onClick={() =>
                                              alterarPA(indexA, indexQ)
                                            }
                                          >
                                            Ativar PA
                                          </span>
                                        )}
                                    </div>
                                  );
                                }
                              })}
                            </span>
                          </div>
                        )
                      );
                    })}

                    {/* Botão para aplicador finalizar correções - ANTES DOS PDFs */}
                    {(() => {
                      // Verificar se existe algum plano de ação que precisa ser corrigido
                      let temPlanoAcao = false;
                      if (apr.checklist) {
                        apr.checklist.forEach((area) => {
                          area[1].forEach((question) => {
                            if (
                              question.openPA === true &&
                              question.plano_acao &&
                              question.plano_acao.comentario
                            ) {
                              temPlanoAcao = true;
                            }
                          });
                        });
                      }

                      // Mostrar botão para aplicador, revisor ou administrador quando há plano de ação
                      const podeFinalizarCorrecoes =
                        user.nivel === "aplicador" ||
                        user.nivel === "revisor" ||
                        user.nivel === "administrador";

                      // Esconder botão se já foi revisado, enviado ou concluído
                      const statusPermitido = ["Aguardando Correção"].includes(
                        apr.status
                      );

                      return (
                        podeFinalizarCorrecoes &&
                        temPlanoAcao &&
                        statusPermitido && (
                          <div
                            className="finalization-section"
                            style={{ marginBottom: "20px" }}
                          >
                            <div className="section-header">
                              <h3>✅ Finalizar Correções</h3>
                              <p>
                                Após corrigir todos os pontos pendentes, clique
                                no botão abaixo para enviar a APR para revisão
                              </p>
                            </div>

                            <div className="finalization-action">
                              <button
                                className="btn-finalize-correction"
                                onClick={(e) => finalizarCorrecoes(e, id)}
                                style={{
                                  backgroundColor: "#4caf50",
                                  color: "white",
                                  padding: "12px 24px",
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  width: "100%",
                                  marginTop: "10px",
                                }}
                              >
                                ✅ Finalizar e Enviar para Revisão
                              </button>
                              <p
                                className="info-text"
                                style={{
                                  marginTop: "10px",
                                  fontSize: "14px",
                                  color: "#666",
                                }}
                              >
                                ⚠️ Certifique-se de que todas as correções foram
                                realizadas antes de finalizar
                              </p>
                            </div>
                          </div>
                        )
                      );
                    })()}

                    <div className="reports-section">
                      <div className="section-header">
                        <h3>📊 Relatórios Disponíveis</h3>
                        <p>Escolha qual relatório deseja gerar</p>
                      </div>

                      <div className="main-report">
                        <button
                          className="btn-pdf-main"
                          onClick={(e) => generatePDF(e, "All")}
                        >
                          📄 Gerar PDF Completo
                        </button>
                      </div>

                      <div className="secondary-reports">
                        <button
                          className="btn-pdf-secondary"
                          onClick={(e) => generatePDF(e, "oem")}
                        >
                          🔧 PDF O&M
                        </button>
                        <button
                          className="btn-pdf-secondary"
                          onClick={(e) => generatePDF(e, "patrimonio")}
                        >
                          🏢 PDF Patrimônio
                        </button>
                        <button
                          className="btn-pdf-secondary"
                          onClick={(e) => generateInconformidadesPDF(e)}
                        >
                          ⚠️ PDF Inconformidades
                        </button>
                      </div>
                    </div>

                    {(user.nivel === "administrador" ||
                      user.nivel === "revisor" ||
                      user.nivel === "revisor_logistica") &&
                      (apr.status === "Em Aberto" ||
                        apr.status === "Revisado" ||
                        (user.nivel === "administrador" && apr.status === "Enviado") ||
                        apr.status === "Aguardando Revisão") && (
                        <div className="revision-section">
                          <div className="section-header">
                            <h3>📧 Revisão e Envio</h3>
                          </div>
                          <div className="revision-action">
                            <EmailLink
                              apr={apr}
                              setApr={setApr}
                              id={id}
                              logSistem={logSistem}
                            />
                            <p className="confirmation-text">
                              Você receberá um e-mail de confirmação após o
                              envio
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Seção para ponto_focal enviar para revisão após definir SLAs */}
                    {user.nivel === "ponto_focal" &&
                      apr.status === "Aguardando Correção" && (
                        <div className="logistics-section">
                          <div className="section-header">
                            <h3>📤 Enviar para Monitoramento</h3>
                            <p>
                              Após definir todos os planos de ação, envie a APR
                              para monitoramento de SLA
                            </p>
                            {apr.sla_ponto_focal && (
                              <div
                                className={`sla-alert ${new Date() >
                                    new Date(apr.sla_ponto_focal.toDate())
                                    ? "sla-expired"
                                    : "sla-active"
                                  }`}
                              >
                                <strong>SLA: </strong>
                                {new Date(
                                  apr.sla_ponto_focal.toDate()
                                ).toLocaleDateString("pt-BR")}
                                {new Date() >
                                  new Date(apr.sla_ponto_focal.toDate()) && (
                                    <span> - ⚠️ VENCIDO</span>
                                  )}
                              </div>
                            )}
                          </div>
                          <div className="finalization-action">
                            <button
                              className="btn-send-review"
                              onClick={(e) => enviarParaMonitoramento(e, id)}
                            >
                              📤 Enviar para Monitoramento de SLA
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Seção para ponto_focal enviar para revisão após definir SLAs */}
                    {user.nivel === "ponto_focal" &&
                      apr.status === "Enviado" && (
                        <div className="logistics-section">
                          <div className="section-header">
                            <h3>📤 Enviar para Revisão</h3>
                            <p>
                              Todos os planos de ação foram definidos. Envie a APR
                              para revisão do revisor e revisor_logistica
                            </p>
                            {verificarSeTemPendencias() && (
                              <div style={{ color: '#ff6b6b', marginTop: '10px', fontSize: '14px' }}>
                                ⚠️ Ainda existem inconformidades sem plano de ação definido
                              </div>
                            )}
                          </div>
                          <div className="finalization-action">
                            <button
                              className="btn-send-review"
                              onClick={(e) => enviarParaRevisao(e, id)}
                              disabled={verificarSeTemPendencias()}
                              style={{
                                opacity: verificarSeTemPendencias() ? 0.5 : 1,
                                cursor: verificarSeTemPendencias() ? 'not-allowed' : 'pointer'
                              }}
                            >
                              📤 Finalizar e Enviar para Revisão
                            </button>
                          </div>
                        </div>
                      )}


                    {user.nivel === "revisor_logistica" &&
                      apr.status === "Aguardando Correção" && (
                        <div className="logistics-section">
                          <div className="section-header">
                            <h3>✅ Enviar para Operação</h3>
                            <p>
                              Todos os planos de ação foram validados. Envie para operação para que o aplicador confira as correções.
                            </p>
                          </div>
                          <div className="finalization-action">
                            <button
                              className="btn-send-review"
                              onClick={(e) => enviarParaOperacao(e, id)}
                              disabled={!verificarTodosValidados()}
                              style={{
                                opacity: verificarTodosValidados() ? 1 : 0.5,
                                cursor: verificarTodosValidados() ? 'pointer' : 'not-allowed',
                              }}
                            >
                              📤 Enviar para Operação
                            </button>
                            {!verificarTodosValidados() && (
                              <p style={{ marginTop: '10px', fontSize: '14px', color: '#ff6b6b' }}>
                                ⚠️ Nem todos os planos foram validados ainda
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Seção para revisor_logistica finalizar APR após correções */}
                    {user.nivel === "revisor_logistica" &&
                      apr.status === "Respondido pela Area" && (
                        <div className="logistics-section">
                          <div className="section-header">
                            <h3>✅ Acompanhamento de SLA Concluído</h3>
                            <p>
                              As correções foram realizadas. Finalize a APR
                            </p>
                          </div>
                          <div className="finalization-action">
                            <button
                              className="btn-send-review"
                              onClick={(e) => finalizarAPRRevisorLogistica(e, id)}
                            >
                              ✅ Finalizar APR
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Botão para finalizar APR - apenas quando status for Aguardando Revisão */}
                    {/* Ponto focal NÃO pode encerrar APR, apenas insere planos de ação */}
                    {(user.nivel === "administrador" ||
                      user.nivel === "revisor" ||
                      user.nivel === "revisor_logistica" ||
                      user.nivel === "aplicador") &&
                      user.nivel !== "ponto_focal" &&
                      apr.status === "Aguardando Revisão" && (
                        <div className="finalization-section">
                          <div className="section-header">
                            <h3>✅ Finalização</h3>
                            <p>
                              Todas as correções foram realizadas. Conclua o
                              processo da APR
                            </p>
                          </div>

                          <div className="finalization-action">
                            <button
                              className="btn-finalize-main"
                              onClick={(e) => updateStatusAPR(e, id)}
                            >
                              ✅ Encerrar APR
                            </button>
                          </div>
                        </div>
                      )}
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="container">Carregando dados APR...</div>
          )}

          {showPostModal && (
            <Modal_PA
              checklist={apr.checklist}
              firebase={firebase}
              conteudo={detail}
              close={togglePostModal}
              area={area}
              tipoSite={apr.site_id.tipoSite}
              loadApr={ReloadAPR}
              apr={apr}
            />
          )}

          {showPostModalLoading && (
            <ModalLoading close={togglePostModalLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
