import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import { FiClipboard, FiCheck, FiCheckSquare } from "react-icons/fi";
import { useParams, useHistory } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";

import "./open.scss";

import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import Modal from "../../components/Modal";
import ModalLoading from "../../components/Modal_Loading";
import telefonicaLogo from "../../assets/telefonica-logo.png";
import EmailLink from "../../components/Email/EmailLink";
import ModalEdit from "../../components/Modal_Edit";

// Importar as fontes do pdfmake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default function Open() {
  const base = "aprs-producao"; //aprs-producao

  const { user, logSistem } = useContext(AuthContext);
  const { id } = useParams();
  const history = useHistory();

  const [apr, setApr] = useState([]);
  const [aprCompleta, setAprCompleta] = useState([]);
  const [loadApr, setLoadApr] = useState(false);
  //modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPostModalLoading, setShowPostModalLoading] = useState(false);
  const [detail, setDetail] = useState();
  const [area, setArea] = useState();

  const formatarValor = (valor) => {
    let result = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);

    return result;
  };

  async function ReloadAPR() {
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .get()
      .then((snapshot) => {
        let apr = snapshot.data();
        setAprCompleta(snapshot.data());
        apr.checklist.forEach((area, indexA) => {
          area[1].forEach((doc, indexQ) => {
            if (apr.status !== "Em Aberto" && doc.resp === "") {
              delete apr.checklist[indexA][1][indexQ];
            } else if (apr.status === "Em Aberto" && doc.resp === "") {
              if (user.nivel !== 'revisor' && user.nivel !== 'administrador' && user.uid !== apr.user_id.uid) {
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

      // Adiciona um timeout para rejeitar a promessa se a imagem não carregar em um tempo razoável
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error("Erro ao carregar a imagem: tempo limite excedido"));
        }
      }, 10000); // 10 segundos de timeout
    });
  }

  async function generatePDF(e) {
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
        {
          type: "rect",
          x: -20,
          y: 0,
          w: 560, // 70 percent completion
          h: 1,
          lineColor: "lightblue",
        },
      ],
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

    pdf.content.push({
      margin: [0, 20, 0, 20],
      table: {
        widths: [300, 300],
        body: [
          [
            "Sigla-UF: " + apr.site_id.Sigla + "-" + apr.site_id.Estado,
            "Criticidade: " + apr.site_id.critical,
          ],
          ["Unidade: " + apr.site_id.Nome, "Cidade: " + apr.site_id.Cidade],
          [
            "Endereço: " + apr.site_id.Endereco,
            "Latitude: " + apr.site_id.Latitude,
          ],
          [
            "Bairro: " + apr.site_id.Bairro,
            "Longitude: " + apr.site_id.Longitude,
          ],
        ],
      },
      layout: "noBorders",
    });

    pdf.content.push({
      canvas: [
        {
          type: "rect",
          x: -20,
          y: 0,
          w: 560, // 70 percent completion
          h: 1,
          lineColor: "lightblue",
        },
      ],
    });

    for (const area of apr.checklist) {
      pdf.content.push({
        text: area[0],
        bold: true,
        margin: [0, 30, 0, 0],
        fontSize: 18,
      });
      for (const doc of area[1]) {
        for (const imgs of doc.imagesURL) {
          console.log(doc.questionId)
          imgs.url = await getBase64ImageFromURL(imgs.url);
        }

        pdf.content.push({
          text: `${doc.question}`,
          margin: [0, 20, 0, 0],
        });
        pdf.content.push({
          stack: [
            {
              text: `\t${doc.resp}\t `,
              bold: true,
              color: "white",
              margin: [10, 10, 0, 20],
            },
          ],
          background: doc.resp === "Sim" ? "green" : "red",
        });
        if (doc.respTextArea !== "" && doc.respTextArea !== "N/A") {
          pdf.content.push({
            text: `Obs: ${doc.respTextArea}`,
            margin: [0, 5, 0, 5],
            italics: true,
          });
        }
        for (const imgs of doc.imagesURL) {
          try {
            pdf.content.push({
              image: imgs.url,
              width: 150,
              height: 150,
              margin: [0, 10, 0, 0],
            });
          } catch (error) {
            console.log(imgs);
            console.log("Erro ao adicionar foto no documento." + error);
          }
        }
      }
    }

    console.log(pdf);

    pdfMake
      .createPdf(pdf)
      .download(`APR Digital ${apr.site_id.Sigla + "_" + apr.site_id.Estado}.pdf`);
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

  async function updateRevisor(e, id) {
    e.preventDefault();
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        status: apr.site_id.tipoSite === "SMARTTAG2" ? "Concluido" : "Revisado",
        data_alteracao: new Date(),
      })
      .then(() => {
        toast.success("Status apr atualizado com sucesso!");
        logSistem("APR Revisada", id);
        history.push("/dashboard");
      })
      .catch((error) => {
        toast.error("Erro ao atualizar status da apr:", error);
        console.log("Erro ao atualizar status da apr:", error);
      });
  }

  async function updateMotivoAPR(e, id) {
    e.preventDefault();
    let confirm = window.confirm("Deseja realmente alterar o motivo da APR?");
    if (confirm === false) return;
    await firebase
      .firestore()
      .collection(base)
      .doc(id)
      .update({
        motivo_apr: e.target.value,
      })
      .then(() => {
        toast.success("Motivo da apr atualizado com sucesso!");
        logSistem(`Motivo APR Atualizado para ${e.target.value}`, id);
        ReloadAPR();
      })
      .catch((error) => {
        toast.error("Erro ao atualizar status da apr:", error);
        console.log("Erro ao atualizar status da apr:", error);
      });
  }

  function matrizRiscoLoja(valor, tipo) {
    if (tipo === "LOJA RUA") {
      if (valor === 0) {
        return "Muito Baixo";
      } else if (valor > 0 && valor <= 30000000) {
        return "Baixo";
      } else if (valor > 30000000 && valor <= 70000000) {
        return "Alto";
      } else if (valor > 70000000 && valor <= 150000000) {
        return "Muito Alto";
      } else if (valor > 150000000) {
        return "Muito Alto";
      }
    } else if (tipo === "LOJA GALERIA") {
      if (valor === 0) {
        return "Muito Baixo";
      } else if (valor > 0 && valor <= 30000000) {
        return "Baixo";
      } else if (valor > 30000000 && valor <= 70000000) {
        return "Alto";
      } else if (valor > 70000000 && valor <= 150000000) {
        return "Muito Alto";
      } else if (valor > 150000000) {
        return "Muito Alto";
      }
    } else if (tipo === "LOJA SHOP TERREO") {
      if (valor === 0) {
        return "Muito Baixo";
      } else if (valor > 0 && valor <= 30000000) {
        return "Baixo";
      } else if (valor > 30000000 && valor <= 70000000) {
        return "Médio";
      } else if (valor > 70000000 && valor <= 150000000) {
        return "Alto";
      } else if (valor > 150000000) {
        return "Muito Alto";
      }
    } else if (tipo === "LOJA SHOP 1° PISO") {
      if (valor === 0) {
        return "Muito Baixo";
      } else if (valor > 0 && valor <= 30000000) {
        return "Muito Baixo";
      } else if (valor > 30000000 && valor <= 70000000) {
        return "Médio";
      } else if (valor > 70000000 && valor <= 150000000) {
        return "Alto";
      } else if (valor > 150000000) {
        return "Muito Alto";
      }
    } else if (tipo === "LOJA SHOP ELITE") {
      if (valor === 0) {
        return "Muito Baixo";
      } else if (valor > 0 && valor <= 30000000) {
        return "Muito Baixo";
      } else if (valor > 30000000 && valor <= 70000000) {
        return "Médio";
      } else if (valor > 70000000 && valor <= 150000000) {
        return "Médio";
      } else if (valor > 150000000) {
        return "Alto";
      }
    }
  }

  return (
    <div>
      <Header />

      <div className="content">
        <div id="exportContent">
          <Title name="APR Digital">
            <FiClipboard size={25} onClick={() => console.log(apr)} />
          </Title>

          {loadApr ? (
            <>
              {user.nivel === "administrador" && apr.status === "Revisado" && (
                <div className="container">
                  <EmailLink apr={apr} id={id} logSistem={logSistem} />
                </div>
              )}

              <div className="container">
                <div className="siteInfo">
                  <ul>
                    <li>
                      <span>SIGLA: </span>
                      {apr.site_id.Sigla + "-" + apr.site_id.Estado}
                    </li>
                    <li style={{ textTransform: "none" }}>
                      <span>ID APR: </span>
                      {apr.apr_id ? apr.apr_id : id}
                    </li>
                    <li>
                      <span>Classificação: </span>
                      {apr.status !== "Com Exceção" &&
                        calculatePontos(apr.peso)}
                    </li>
                  </ul>
                  <ul>
                    <li>
                      <span>STATUS: </span>
                      {apr.status}
                    </li>
                    <li>
                      <span>MOTIVO: </span>
                      {user.nivel === "administrador" ||
                        (user.nivel === "revisor" &&
                          apr.status === "Em Aberto") ? (
                        <select
                          value={apr.motivo_apr}
                          onChange={(e) => updateMotivoAPR(e, id)}
                        >
                          <option value={"Mapa de Calor"}>Mapa de Calor</option>
                          <option value={"Retrofit"}>Retrofit</option>
                          <option value={"Rota Critica DWDM"}>
                            Rota Critica DWDM
                          </option>
                          <option value={"Projeto Veneza"}>
                            Projeto Veneza
                          </option>
                          <option value={"Estoque Avançado"}>
                            Estoque Avançado
                          </option>
                          <option value={"Instalação Tag"}>
                            Instalação Tag
                          </option>
                          <option value={"Não Opinada"}>Não Opinada</option>
                        </select>
                      ) : (
                        apr.motivo_apr
                      )}
                    </li>
                    <li>
                      <span>TIPO DE SITE: </span>
                      {apr.site_id.tipoSite}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="container">
                <div className="siteInfo">
                  <ul>
                    <li>
                      <span>Unidade: </span>
                      {apr.site_id.Nome}
                    </li>
                    <li>
                      <span>Endereço: </span>
                      {apr.site_id.Endereco}
                    </li>
                    <li>
                      <span>Estado: </span>
                      {apr.site_id.Estado}
                    </li>
                    <li>
                      <span>Criticidade: </span>
                      {apr.site_id.critical}
                    </li>
                  </ul>
                  <ul>
                    <li>
                      <span>Cidade: </span>
                      {apr.site_id.Cidade}
                    </li>
                    <li>
                      <span>Latitude: </span>
                      {apr.site_id.Latitude}
                    </li>
                    <li>
                      <span>Longitude: </span>
                      {apr.site_id.Longitude}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="container">
                <div className="siteInfo">
                  <ul>
                    <li>
                      <span>Inicio: </span>
                      {format(apr.tempoConclusao.inicio.toDate(), "HH:mm")}
                    </li>
                  </ul>
                  <ul>
                    <li>
                      <span>Conclusão: </span>
                      {format(apr.tempoConclusao.conclusao.toDate(), "HH:mm")}
                    </li>
                  </ul>
                  <ul>
                    <li>
                      <span>Tempo: </span>
                      {Math.ceil(
                        (apr.tempoConclusao.conclusao.toDate() -
                          apr.tempoConclusao.inicio.toDate()) /
                        (1000 * 60)
                      )}{" "}
                      Min.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="container">
                <div className="siteInfo">
                  <span>{apr.user_id.nome}</span>
                  <span>
                    {format(apr.created.toDate(), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </div>

              <div className="container">
                <div className="siteInfo">
                  <span>Latitude:</span>{" "}
                  {apr.locationCreated.latitude.toFixed(5)}
                  <span>Longitude:</span>{" "}
                  {apr.locationCreated.longitude.toFixed(5)}
                  <span
                    style={{
                      backgroundColor:
                        apr.locationCreated.perimetro === "fora perimetro"
                          ? "rgb(228, 54, 23)"
                          : "rgb(14, 206, 14)",
                      color: "#FFF",
                      padding: "0.2em",
                    }}
                  >
                    {apr.locationCreated.perimetro}
                  </span>
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
                <>
                  <div className="container">
                    <div className="siteInfo">
                      <span>Tipo de Loja:</span> {apr.tipo_loja}
                      <span>Valor Transporte:</span>{" "}
                      {formatarValor(parseInt(apr.valor_estoque))}
                    </div>
                  </div>
                  <div className="container">
                    <div className="siteInfo">
                      <span>Classificação Loja:</span>{" "}
                      {matrizRiscoLoja(
                        parseInt(apr.valor_estoque),
                        apr.tipo_loja
                      )}
                    </div>
                  </div>
                </>
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
                                  if (doc.openPA === true && doc.respGabarito !== doc.resp && area === true) {
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
                                        {doc.listCheck && doc.optionListResp.map(
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
                                        {doc.openPA === true && doc.resp !== doc.respGabarito && user.uid !== apr.id_user ? (
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
                                        background: doc.resp
                                          ? "transparent"
                                          : "#e7e6e6",
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
                                      {doc.listCheck &&
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

                    <button onClick={generatePDF}>Gerar PDF</button>
                    {apr.status === "Em Aberto" && user.nivel === "revisor" && (
                      <button onClick={(e) => updateRevisor(e, id)}>
                        Confirmar Revisão
                      </button>
                    )}
                  </form>
                </div>
              )}
              
            </>
          ) : (
            <div className="container">Carregando dados APR...</div>
          )}

          {showPostModal && (
            <Modal
              checklist={apr.checklist}
              firebase={firebase}
              conteudo={detail}
              close={togglePostModal}
              area={area}
              tipoSite={apr.site_id.tipoSite}
              loadApr={ReloadAPR}
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
