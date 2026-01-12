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
        .where('site_id.Sigla', '==', siteData.Sigla)
        .where('site_id.Estado', '==', siteData.Estado)
        .orderBy('created', 'desc')
        .limit(10)
        .get();

      const aprs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== id) { // Não incluir a APR atual
          aprs.push({
            id: doc.id,
            apr_id: data.apr_id || doc.id,
            motivo: data.motivo_apr || 'Sem motivo informado',
            status: data.status || 'N/A',
            created: data.created
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
            const isRevisorOuAdmin = user.nivel === "revisor" || user.nivel === "administrador";
            const isDono = user.uid === apr.user_id.uid;
            const hasAnswer = doc.answers !== "";
            const isRespVazio = doc.resp === "";
            const hasValorEstoque = doc.valorEstoque?.min != null || doc.valorEstoque?.max != null;
            const isRevisorLoja = hasValorEstoque && isRevisorOuAdmin;
            const isQuestionActiveLoja = isRevisorLoja &&
              valorDentroDoIntervalo(apr.valor_estoque, doc.valorEstoque) &&
              doc.tipoLoja?.includes(apr.tipo_loja);
            console.log(`Área: ${indexA + 1}, Questão: ${indexQ + 1}`);
            console.log(isQuestionActiveLoja)
            console.log(hasValorEstoque)
            console.log(!isQuestionActiveLoja, hasValorEstoque)


            if (isRespVazio && hasAnswer) {
              if (!isRevisorOuAdmin && !isEmAberto) {
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
                console.log(`Valor Estoque: ${doc.valorEstoque.min} - ${doc.valorEstoque.max}`);
                console.log(`isQuestionActiveLoja: ${isQuestionActiveLoja}`);
                console.log(`isRespVazio && hasAnswer: ${isRespVazio && hasAnswer}`);
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
      const siteSnapshot = await firebase.firestore().collection('sites')
        .where('Sigla', '==', apr.site_id.Sigla)
        .where('Estado', '==', apr.site_id.Estado)
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
      canvas: [{ type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" }],
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
        body: [["Nome: " + apr.user_id.nome, "Criado em: " + format(apr.created.toDate(), "dd/MM/yyyy HH:mm")]],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      margin: [0, 20, 0, 0],
      table: {
        widths: [300, 300],
        body: [["Motivo: " + apr.motivo_apr, "Classificação " + calculatePontos(apr.peso)]],
      },
      layout: "noBorders",
    });

    // Informações do site incluindo perímetro, área e imagem
    const siteTableBody = [
      ["Sigla-UF: " + (apr.site_id?.Sigla || 'N/A') + "-" + (apr.site_id?.Estado || 'N/A'), "Criticidade: " + (apr.site_id?.critical || 'N/A')],
      ["Unidade: " + (apr.site_id?.Nome || 'N/A'), "Cidade: " + (apr.site_id?.Cidade || 'N/A')],
      ["Endereço: " + apr.site_id.Endereco, "Latitude: " + apr.site_id.Latitude],
      ["Bairro: " + apr.site_id.Bairro, "Longitude: " + apr.site_id.Longitude],
    ];

    // Adicionar perímetro e área se disponíveis, alinhados
    if (siteInfoData) {
      if (siteInfoData.perimetro && siteInfoData.area) {
        siteTableBody.push([
          "Perímetro: " + siteInfoData.perimetro + " metros",
          "Área: " + siteInfoData.area + " m²"
        ]);
      } else if (siteInfoData.perimetro) {
        siteTableBody.push(["Perímetro: " + siteInfoData.perimetro + " metros", ""]);
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
        const siteImageBase64 = await getBase64ImageFromURL(siteInfoData.imagem);
        pdf.content.push({
          text: "Imagem do Site:",
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 5],
          color: '#00529B',
        });
        pdf.content.push({
          image: siteImageBase64,
          width: 170,
          alignment: 'center',
          margin: [0, 5, 0, 20],
        });
      } catch (error) {
        console.log("Erro ao carregar imagem do site:", error);
      }
    }

    pdf.content.push({
      canvas: [{ type: "rect", x: -20, y: 0, w: 560, h: 1, lineColor: "lightblue" }],
    });

    for (const area of apr.checklist) {
      pdf.content.push({
        text: area[0],
        bold: true,
        fontSize: 20,
        margin: [0, 30, 0, 10],
        color: '#00529B',
        decoration: 'underline',
      });

      const docs = area[1];

      for (const doc of docs) {
        if (!doc) continue;

        const incluirDoc = exportarea === "All"
          ? doc.resp !== "" || doc.optionListResp?.length > 0 || doc.respTextArea !== ""
          : (exportarea === "oem" && doc.resp !== "" && doc.resp !== "N/A" && doc.resp !== doc.respGabarito && doc.openPA === true && doc.areaResposavel?.includes("oem"))
          || (exportarea === "patrimonio" && doc.resp !== "" && doc.resp !== "N/A" && doc.resp !== doc.respGabarito && doc.openPA === true && doc.areaResposavel?.includes("patrimonio"));

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
          const respColor = doc.resp === "Sim" ? "#4CAF50" : doc.resp === "N/A" ? "#FFA500" : "#F44336";

          pdf.content.push({
            table: {
              widths: ["*"],
              body: [[
                {
                  text: doc.resp,
                  fillColor: respColor,
                  color: "white",
                  alignment: "center",
                  bold: true,
                  margin: [0, 5, 0, 5],
                }
              ]]
            },
            layout: {
              hLineWidth: function () { return 0; },
              vLineWidth: function () { return 0; },
            },
            margin: [0, 5, 0, 5],
          });
        }

        if (doc.optionListResp?.length > 0) {
          pdf.content.push({
            ul: doc.optionListResp.map(option => `${option}`),
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
          canvas: [{
            type: 'line', x1: 0, y1: 0, x2: 520, y2: 0,
            lineWidth: 0.5, lineColor: "#ccc"
          }],
          margin: [0, 20, 0, 20],
        });
      }
    }

    const sigla = apr.site_id?.Sigla || 'SITE';
    const estado = apr.site_id?.Estado || 'UF';
    const aprId = apr.apr_id || 'APR';
    pdfMake.createPdf(pdf).download(`APR Digital ${sigla}_${aprId}_${estado}.pdf`);
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
    let confirm = window.confirm("Deseja realmente alterar o status para CONCLUIDO da APR?");
    if (confirm === false) return;
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        status: 'Concluido',
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

  function visualizarAPR(aprId) {
    window.open(`/open/${aprId}`, '_blank');
  }

  return (
    <div>
      <Header name="Aplicar APR" subtitle="Gerador de Relatórios">
      </Header>

      <div className="content">
        <div id="exportContent">

          {loadApr ? (
            <>
              {(user.nivel === "administrador" || (user.nivel === "revisor" && apr.status === "Em Aberto")) && (
                <div className="container header-actions">
                  <div className="siteInfo group-buttons">
                    <ModalEditSite idDoc={id} ReloadAPR={ReloadAPR} tipoSite={apr.site_id.tipoSite} logSistem={logSistem} />
                    <ModalInfoSiteAPR sigla={apr.site_id?.Sigla} estado={apr.site_id?.Estado} />
                    <ModalEditMotivo apr={apr} id={id} logSistem={logSistem} ReloadAPR={ReloadAPR} />
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
                        <span className="value">{apr.site_id?.Sigla ? apr.site_id.Sigla + "-" + apr.site_id.Estado : 'N/A'}</span>
                      </div>
                      <div className="info-item" style={{ textTransform: "none" }}>
                        <span className="label">ID APR:</span>
                        <span className="value">{apr.apr_id ? apr.apr_id : id}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Status:</span>
                        <span className={`status-badge status-${apr.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {apr.status}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Classificação:</span>
                        <span className="value">{apr.status !== "Com Exceção" && calculatePontos(apr.peso)}</span>
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
                        <span className="value">{apr.site_id?.Cidade && apr.site_id?.Estado ? `${apr.site_id.Cidade}/${apr.site_id.Estado}` : 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Criticidade:</span>
                        <span className={`criticality-badge criticality-${apr.site_id.critical.toLowerCase()}`}>
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
                        <span className="value">{format(apr.created.toDate(), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Período:</span>
                        <span className="value">
                          {format(apr.tempoConclusao.inicio.toDate(), "HH:mm")} - {format(apr.tempoConclusao.conclusao.toDate(), "HH:mm")}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Duração:</span>
                        <span className="duration-badge">
                          {Math.ceil(
                            (apr.tempoConclusao.conclusao.toDate() -
                              apr.tempoConclusao.inicio.toDate()) /
                            (1000 * 60)
                          )} min
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
                          {apr.locationCreated.latitude && typeof apr.locationCreated.latitude === 'number'
                            ? `${apr.locationCreated.latitude.toFixed(5)}, ${apr.locationCreated.longitude.toFixed(5)}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Perímetro:</span>
                        <span className={`perimeter-badge ${
                          apr.locationCreated.perimetro === "fora perimetro" ? "perimeter-outside" :
                          apr.locationCreated.perimetro === "Esta dentro do Perimetro" ? "perimeter-inside" :
                          "perimeter-unknown"
                        }`}>
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
                                    <span className="history-id">{aprHist.apr_id}</span>
                                  </div>
                                  <span className={`status-badge status-${aprHist.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {aprHist.status}
                                  </span>
                                </div>
                                <div className="history-body">
                                  <div className="history-motivo-wrapper">
                                    <span className="motivo-label">Motivo:</span>
                                    <span className="history-motivo">{aprHist.motivo}</span>
                                  </div>
                                  {aprHist.created && (
                                    <span className="history-date">
                                      📅 {format(aprHist.created.toDate(), "dd/MM/yyyy")} às {format(aprHist.created.toDate(), "HH:mm")}
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
                            <span>📋 Nenhuma APR anterior encontrada para este site</span>
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

              {(apr.valor_armazenamento || apr.valor_transporte || apr.valor_sinistro) && (
                <div className="container">
                  <div className="siteInfo" style={{ flexDirection: "column" }}>
                    <span>Valor Armazenamento:</span>{" "}
                    {apr.valor_armazenamento
                      ? formatarValor(parseInt(apr.valor_armazenamento))
                      : "R$ 0"}
                    <span>Valor Transporte:</span>{" "}
                    {apr.valor_transporte
                      ? formatarValor(parseInt(apr.valor_transporte))
                      : "R$ 0"}
                    <span>Valor Sinistro:</span>{" "}
                    {apr.valor_sinistro
                      ? formatarValor(parseInt(apr.valor_sinistro))
                      : "R$ 0"}
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
                                  if (doc.openPA === true && doc.resp !== "N/A" && doc.respGabarito !== doc.resp && area === true) {
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
                                        {(doc.listCheck && doc.optionListResp !== '') && doc.optionListResp.map(
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
                                        {doc.openPA === true && doc.resp !== "N/A" && doc.resp !== doc.respGabarito && user.uid !== apr.id_user ? (
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
                                                  Plano de Ação
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
                                          </>
                                        ) : (
                                          <>
                                            {(doc.plano_acao.tempo ||
                                              doc.plano_acao.comentario) && (
                                                <>
                                                  <label>Plano de Ação:</label>
                                                  Tempo:{" "}
                                                  <i>{doc.plano_acao.tempo}</i>
                                                  Comentario:{" "}
                                                  <i>
                                                    {doc.plano_acao.comentario}
                                                  </i>
                                                </>
                                              )}
                                          </>
                                        )}
                                      </div>
                                    );
                                  }
                                } else if (user.nivel === "revisor" || user.nivel === "administrador" || user.uid === apr.user_id.uid) {
                                  return (
                                    <div
                                      key={indexQ}
                                      className="container-perg-open"
                                      id={indexA + "-export-" + indexQ}
                                      style={{
                                        background: ((doc.resp && doc.answers) || (!doc.resp && !doc.answers))
                                          ? "#e7e6e6"
                                          : "transparent",
                                      }}
                                    >
                                      {apr.status === "Em Aberto" && (
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
                                      {(doc.listCheck && doc.optionListResp !== '') &&
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
                                        user.uid !== apr.id_user && (
                                          <label className="plano-acao">
                                            {doc.plano_acao.comentario ? (
                                              <a
                                                data-check={doc.resp_pa_status === 'Concluido' ? 'Sim' : 'Concluido'}
                                                onClick={() =>
                                                  togglePostModal(doc, indexA)
                                                }
                                              >
                                                <FiCheck size={20} />
                                                {doc.resp_pa_status === 'Concluido' ? 'Plano de Ação Validado' : 'Plano de Ação'}
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
                                      {(doc.listCheck && doc.optionListResp !== '') &&
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

                    <div className="reports-section">
                      <div className="section-header">
                        <h3>📊 Relatórios Disponíveis</h3>
                        <p>Escolha qual relatório deseja gerar</p>
                      </div>
                      
                      <div className="main-report">
                        <button className="btn-pdf-main" onClick={(e) => generatePDF(e, "All")}>
                          📄 Gerar PDF Completo
                        </button>
                      </div>
                      
                      <div className="secondary-reports">
                        <button className="btn-pdf-secondary" onClick={(e) => generatePDF(e, "oem")}>
                          🔧 PDF O&M
                        </button>
                        <button className="btn-pdf-secondary" onClick={(e) => generatePDF(e, "patrimonio")}>
                          🏢 PDF Patrimônio
                        </button>
                      </div>
                    </div>

                    {((user.nivel === "administrador" || user.nivel === "revisor" || user.nivel === "revisor_logistica") && (apr.status === "Em Aberto" || apr.status === "Revisado" || apr.status === "Enviado")) && (
                      <div className="revision-section">
                        <div className="section-header">
                          <h3>📧 Revisão e Envio</h3>
                        </div>                      
                        <div className="revision-action">
                          <EmailLink apr={apr} setApr={setApr} id={id} logSistem={logSistem} />
                          <p className="confirmation-text">Você receberá um e-mail de confirmação após o envio</p>
                        </div>
                      </div>
                    )}

                    {(user.nivel === "ponto_focal_logistica" && (apr.status === "Aguardando Ponto Focal" || apr.status === "SLA Ponto Focal Vencido")) && (
                      <div className="logistics-section">
                        <div className="section-header">
                          <h3>🚚 Ponto Focal Logística</h3>
                          <p>Defina os planos de ação para as inconformidades de logística</p>
                          {apr.sla_ponto_focal && (
                            <div className={`sla-alert ${new Date() > new Date(apr.sla_ponto_focal.toDate()) ? 'sla-expired' : 'sla-active'}`}>
                              <strong>SLA: </strong>
                              {new Date(apr.sla_ponto_focal.toDate()).toLocaleDateString('pt-BR')}
                              {new Date() > new Date(apr.sla_ponto_focal.toDate()) && <span> - ⚠️ VENCIDO</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {((user.nivel === "administrador" || user.nivel === "revisor") && (apr.status === "Respondido pela Area" || apr.status === "Plano de Ação Logística Definido")) && (
                      <div className="finalization-section">
                        <div className="section-header">
                          <h3>✅ Finalização</h3>
                          <p>Conclua o processo da APR</p>
                        </div>
                        
                        <div className="finalization-action">
                          <button className="btn-finalize-main" onClick={(e) => updateStatusAPR(e, id)}>
                            ✅ Finalizar APR
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
