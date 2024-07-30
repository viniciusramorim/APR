import { FiFileText } from "react-icons/fi";
import { format } from 'date-fns';
import * as XLSX from 'xlsx'

import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';

import './report.css'
import { useState } from "react";

export default function Reports() {

    const [chamados, setChamados] = useState([])
    const [loading, setLoading] = useState(false);

    async function loadChamados() {
        setLoading(true)
        await firebase.firestore().collection('aprs-producao')
            .get()
            .then((snapshot) => {
                let list = []

                snapshot.forEach(docs => {
                    list.push({
                        id: docs.id,
                        ...docs.data()
                    })
                })

                setChamados(list)
                setLoading(false)
            })
            .catch((err) => {
                console.log('Deu algum erro: ', err);
                setLoading(false)
            })
    }

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

    async function updateState(snapshot) {
        setLoading(true)
        const relatorioApr = [];

        const promises = snapshot.map(doc => {
            // Verifica se o documento tem a propriedade 'created'
            if (doc.created !== undefined) {
                return v0(doc).then(result => {
                    if (doc.checklist && doc.status !== 'Com Exceção') {
                        doc.checklist.map((blocoQuestion) => {
                            blocoQuestion[1].map(question => {
                                if (question.resp !== "") {
                                    relatorioApr.push({
                                        ID: doc.id,
                                        DATA: format(doc.created.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                                        STATUS: doc.status,
                                        MOTIVO: doc.motivo_apr,
                                        CLASSIFICACAO: calculatePontos(doc.peso),
                                        PESO: doc.peso,
                                        QUESTIONS: question.question,
                                        QUESTIONS_RESP: question.resp,
                                        QUESTIONS_RESPGABARITO: question.respGabarito,
                                        QUESTIONS_PA: question.openPA,
                                        QUESTION_PA_DATA: question.resp_pa_data ? format(question.resp_pa_data.toDate(), 'dd/MM/yyyy HH:mm:ss') : '',
                                        QUESTION_PA_RESP: question.resp_pa_selectedOption ? question.resp_pa_selectedOption : '',
                                        QUESTION_PA_NOME: question.resp_pa_user_name ? question.resp_pa_user_name : '',
                                        SIGLA: doc.site_id.Sigla,
                                        SIGLA_GVT: doc.site_id.Sigla_GVT,
                                        TIPO_SITE: doc.site_id.tipoSite,
                                        NOME_SITE: doc.site_id.Nome,
                                        LAT_SITE: doc.site_id.Latitude,
                                        LNG_SITE: doc.site_id.Longitude,
                                        UF_SITE: doc.site_id.Estado,
                                        END_SITE: doc.site_id.Endereco,
                                        MUNICIPIO_SITE: doc.site_id.Cidade,
                                        BAIRRO_SITE: doc.site_id.Bairro,
                                        CEP_SITE: doc.site_id.CEP,
                                        CRITICIDADE_SITE: doc.site_id.critical,
                                        ABERTURA_LAT: doc.locationCreated.latitude,
                                        ABERTURA_LNG: doc.locationCreated.logitude,
                                        ABERTURA_PERIMETRO: doc.locationCreated.perimetro,
                                        TEMP_INCIO: format(doc.tempoConclusao.inicio.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                                        TEMP_TERMINO: format(doc.tempoConclusao.conclusao.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                                        TEMP_EFETUADO: Math.ceil((doc.tempoConclusao.conclusao.toDate() - doc.tempoConclusao.inicio.toDate()) / (1000 * 60)),
                                        USER_ID: doc.user_id.uid,
                                        USER_NOME: doc.user_id.nome,
                                        USER_UF: doc.user_id.uf,
                                        V0: result,
                                    });
                                }
                            });
                        });
                    } else if (doc.status === 'Com Exceção') {
                        relatorioApr.push({
                            ID: doc.id,
                            DATA: format(doc.created.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                            STATUS: doc.status,
                            SIGLA: doc.site_id.Sigla,
                            SIGLA_GVT: doc.site_id.Sigla_GVT,
                            TIPO_SITE: doc.site_id.tipoSite,
                            NOME_SITE: doc.site_id.Nome,
                            LAT_SITE: doc.site_id.Latitude,
                            LNG_SITE: doc.site_id.Longitude,
                            UF_SITE: doc.site_id.Estado,
                            END_SITE: doc.site_id.Endereco,
                            MUNICIPIO_SITE: doc.site_id.Cidade,
                            BAIRRO_SITE: doc.site_id.Bairro,
                            CEP_SITE: doc.site_id.CEP,
                            CRITICIDADE_SITE: doc.site_id.critical,
                            ABERTURA_LAT: doc.locationCreated.latitude,
                            ABERTURA_LNG: doc.locationCreated.logitude,
                            ABERTURA_PERIMETRO: doc.locationCreated.perimetro,
                            TEMP_INCIO: format(doc.tempoConclusao.inicio.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                            TEMP_TERMINO: format(doc.tempoConclusao.conclusao.toDate(), 'dd/MM/yyyy HH:mm:ss'),
                            TEMP_EFETUADO: Math.ceil((doc.tempoConclusao.conclusao.toDate() - doc.tempoConclusao.inicio.toDate()) / (1000 * 60)),
                            USER_ID: doc.user_id.uid,
                            USER_NOME: doc.user_id.nome,
                            USER_UF: doc.user_id.uf,
                            V0: '-',
                        });
                    }
                });
            } else {
                return Promise.resolve(); // Retorna uma promise resolvida para documentos sem 'created'
            }
        });
        
        // Aguarda a resolução de todas as Promises
        Promise.all(promises).then(() => {
            console.log(relatorioApr);
            downloadExcel(relatorioApr);
            setLoading(false)
        }).catch(error => {
            console.error("Erro ao processar documentos:", error);
            setLoading(false)
        });
        
    }

    function downloadExcel(data) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "aprs");

        const options = {
            compression: "DEFLATE", // Configurar o nível de compressão
            bookSST: false,
            type: "blob",
        };

        XLSX.writeFile(workbook, "apr-digital.xlsx", options);
    }

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
            if (site.CtCritica !== '-' || site.NonStop !== '-' || site.ErbCritica !== '-') return "v0";

            // Determine the return value based on classification and site criticality
            switch (classif) {
                case "Risco Muito Baixo":
                    return site.critical === "Baixo" ? "v4"
                        : site.critical === "Médio" ? "v4"
                            : "v3";
                case "Risco Baixo":
                    return site.critical === "Baixo" ? "v4"
                        : site.critical === "Médio" ? "v3"
                            : "v3";
                case "Risco Médio":
                    return site.critical === "Baixo" ? "v3"
                        : site.critical === "Médio" ? "v3"
                            : "v2";
                case "Risco Alto":
                    return site.critical === "Baixo" ? "v3"
                        : site.critical === "Médio" ? "v2"
                            : "v1";
                case "Risco Muito Alto":
                    return site.critical === "Baixo" ? "v2"
                        : site.critical === "Médio" ? "v1"
                            : "v0";
                default:
                    return "-";
            }
        } catch (error) {
            console.error("Erro ao consultar o Firestore:", error);
            return "-";
        }
    }

    return (
        <div>
            <Header />
            <div className="content">
                <Title name="Relatorios">
                    <FiFileText size={25} onClick={() => console.log(chamados)} />
                </Title>
                <div className={"container reports"}>
                    <button onClick={() => loadChamados()} disabled={loading}>
                        {!loading ? "Carregar Relatorio APR" : "Carregando..."}
                    </button>
                </div>
                <div className="container reports">
                    <i>APR`s carregadas {chamados.length}</i>
                </div>
                {chamados.length > 0 && (
                    <div className={"container reports"}>
                        <button onClick={() => updateState(chamados)} disabled={loading}>
                            {!loading ? "Download" : "Carregando..."}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}