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

    async function loadChamados() {
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
            })
            .catch((err) => {
                console.log('Deu algum erro: ', err);
            })
    }

    function calculatePontos(peso) {
        if (peso < 10) {
            return `Risco Baixo - RB`
        } else if (peso >= 10 && peso < 40) {
            return `Risco Médio - RM`
        } else if (peso >= 40 && peso < 80) {
            return `Risco Alto - RA`
        } else if (peso >= 80) {
            return `Risco Extremo - RE`
        }
    }

    //faz busca do banco de chamados
    async function updateState(snapshot) {
        let relatorioApr = [];

        snapshot.forEach(doc => {
            if (doc.created !== undefined) {
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
                                })
                            }
                        })
                    })
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
                    })
                }
            }
        });

        downloadExcel(relatorioApr);
        console.log(relatorioApr);
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


    return (
        <div>
            <Header />
            <div className="content">
                <Title name="Relatorios">
                    <FiFileText size={25} onClick={() => console.log(chamados)} />
                </Title>
                <div className={"container reports"}>
                    <button onClick={() => loadChamados()}>
                        Carregar Relatorio APR
                    </button>
                </div>
                <div className="container reports">
                    <i>APR`s carregadas {chamados.length}</i>
                </div>
                {chamados.length > 0 && (
                    <div className={"container reports"}>
                        <button onClick={() => updateState(chamados)}>
                            Download
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}