
import { useState, useContext } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

import { AuthContext } from '../../contexts/auth';
import Header from '../../components/Header';
import Title from '../../components/Title';
import firebase from '../../services/firebaseConnection';
import './dashboard.css';
import { toast } from 'react-toastify';

import TableDashboard from './tableDashboard';
import { Switch } from '@mui/material';


export default function Dashboard() {
  const base = 'aprs-producao' //aprs-producao
  const listRef = firebase.firestore().collection(base)

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, logSistem } = useContext(AuthContext);

  const [filterUF, setFilterUF] = useState('');
  const [filterSigla, setFilterSigla] = useState('');
  const [filterTipoSite, setFilterTipoSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNome, setFilterNome] = useState('');
  const [filterID, setFilterID] = useState('');

  async function loadChamados(props) {

    let regional = [];

    let query = listRef
    query = props === true ? query.where("apr_id", ">", 0).orderBy("apr_id", "desc") : query.orderBy('created', 'desc');

    if (user.regional === 'NE') regional = ['PE', 'CE', 'PB', 'RN', 'AL', 'PI', 'BA', 'SE']
    if (user.regional === 'CO_N') regional = ['DF', 'GO', 'TO', 'AC', 'MS', 'MT', 'RO', 'AM', 'AP', 'MA', 'PA', 'RR']
    if (user.regional === 'RJ_ES_MG') regional = ['RJ', 'ES', 'MG']
    if (user.regional === 'SP') regional = ['SP']
    if (user.regional === 'SUL') regional = ['RS', 'PR', 'SC']

    query = user.nivel === 'aplicador' && user.area !== 'oem' ? query.where('user_id.uid', '==', user.uid) : query
    query = user.nivel === 'supervisor' ? query.where('site_id.Estado', 'in', regional) : query
    query = user.nivel === 'revisor' ? query.where('site_id.Estado', 'in', regional) : query
    query = user.area === 'oem' ? query.where('status', 'in', ['Enviado', 'Respondido pela Area', 'Revisado']) : query

    query = filterID !== '' ? query.where('apr_id', '==', parseInt(filterID)) : query
    query = filterUF !== '' ? query.where('site_id.Estado', '==', filterUF) : query
    query = filterSigla !== '' ? query.where('site_id.Sigla', '==', filterSigla) : query
    query = filterTipoSite !== '' ? query.where('site_id.tipoSite', '==', filterTipoSite) : query
    query = filterStatus !== '' ? query.where('status', '==', filterStatus) : query
    query = filterNome !== '' ? query.where('user_id.nome', '==', filterNome) : query

    console.log(filterID)

    let lista = [];

    setLoading(false)
    await query
      .get()
      .then((snapshot) => {
        new Promise((resolve, reject) => {
          snapshot.forEach(async (doc) => {
            let questoes = 0
            let respondidas = 0
            if (doc.data().status === "Respondido pela Area") {
              // teste de contagem
              doc.data().checklist.forEach((area, indexA) => {
                area[1].forEach((question, indexQ) => {
                  if (question.openPA === true && question.respGabarito !== question.resp && question.resp !== '') {
                    questoes = questoes + 1
                    if (question.plano_acao.comentario) {
                      respondidas = respondidas + 1
                    }
                  }
                })
              })
            }

            if (user.area === 'oem' && doc.data().checklist !== undefined) {
              let paTrue = false;
              doc.data().checklist.forEach((area, indexA) => {
                area[1].forEach((question, indexQ) => {
                  if (question.openPA === true && question.respGabarito !== question.resp) {
                    paTrue = true;
                  }
                })
              })
              if (paTrue === true) {
                lista.push({
                  id: doc.id,
                  nome: doc.data().user_id.nome !== undefined ? doc.data().user_id.nome : '',
                  site_id: doc.data().site_id,
                  status: doc.data().status,
                  motivo_apr: doc.data().motivo_apr,
                  created: format(doc.data().created.toDate(), 'dd/MM/yyyy HH:mma'),
                  porcentagem_resp_area: questoes !== 0 ? ((respondidas / questoes) * 100).toFixed(2) + "%" : '-',
                })
              }
            } else {
              lista.push({
                id: doc.id,
                apr_id: doc.data().apr_id,
                nome: doc.data().user_id.nome !== undefined ? doc.data().user_id.nome : '',
                site_id: doc.data().site_id,
                status: doc.data().status,
                motivo_apr: doc.data().motivo_apr,
                created: format(doc.data().created.toDate(), 'dd/MM/yyyy HH:mma'),
                porcentagem_resp_area: questoes !== 0 ? ((respondidas / questoes) * 100).toFixed(2) + "%" : '-',
              })
            }
            setLoading(true);
            setChamados(lista);
            resolve();
          })
        })
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
        setLoading(true);
      })
    setLoading(true);
  }

  function elementHiddenAndShow() {
    let id = document.getElementById('id').style
    let uf = document.getElementById('uf').style
    let sigla = document.getElementById('sigla').style
    let tipo = document.getElementById('tipo').style
    let status = document.getElementById('status').style
    let nome = document.getElementById('nome').style

    id.display === 'block' ? id.display = 'none' : id.display = 'block'
    uf.display === 'block' ? uf.display = 'none' : uf.display = 'block'
    sigla.display === 'block' ? sigla.display = 'none' : sigla.display = 'block'
    tipo.display === 'block' ? tipo.display = 'none' : tipo.display = 'block'
    status.display === 'block' ? status.display = 'none' : status.display = 'block'
    nome.display === 'block' ? nome.display = 'none' : nome.display = 'block'

  }

  function contAprs(status) {
    var quantidadeElementos = chamados.filter(x => x.status === status).length;
    return quantidadeElementos
  }

  function updateStatus(id, index) {
    let confirm = window.confirm("Press a button!");
    if (confirm === false) return 

    listRef.doc(id)
      .update({
        status: 'Cancelado'
      })
      .then(() => {
        chamados[index].status = 'Cancelado'
        loadChamados();
        logSistem(`APR foi alterado o status para Cancelado`, id)
        toast.success('Status da APR alterado com sucesso !')
      })
      .catch((err) => {
        toast.success('Erro ao atualizar o status da APR!')
        console.log(err)
      })
  }


  return (
    <div>
      <Header />

      <div className="content">
        <Title name="APRs">
          <FiMessageSquare size={25} onClick={() => console.log('')} />
        </Title>

        {(user.nivel === "administrador" || user.nivel === "revisor") && (
          <div className="container indicadores-aprs">
            <div className="grupoCard">
              <span className='card-aberto'>Em Aberto<b>{contAprs("Em Aberto")}</b></span>
              <span className='card-cancelado'>Cancelado<b>{contAprs("Cancelado")}</b></span>
            </div>
            <div className="grupoCard">
              <span className='card-enviado'>Enviado<b>{contAprs("Enviado")}</b></span>
              <span className='card-respondido'>Respondido pela Area<b>{contAprs("Respondido pela Area")}</b></span>
            </div>
          </div>
        )}

        <div className="container filter">
          <div className="filtrosAPRs">

            <label><i onClick={() => elementHiddenAndShow()}>Abrir Filtros</i> </label>
            <input id='id' type='number' placeholder='ID APR' value={filterID} onChange={(e) => setFilterID(e.target.value.toUpperCase().slice(0, 6))} />
            <select id='uf' placeholder='UF' value={filterUF} onChange={(e) => setFilterUF(e.target.value.toUpperCase())}>
              <option value=''>Todas UF</option>
              <option value='AC'>AC</option>
              <option value='AL'>AL</option>
              <option value='AM'>AM</option>
              <option value='AP'>AP</option>
              <option value='BA'>BA</option>
              <option value='CE'>CE</option>
              <option value='DF'>DF</option>
              <option value='ES'>ES</option>
              <option value='GO'>GO</option>
              <option value='MA'>MA</option>
              <option value='MG'>MG</option>
              <option value='MS'>MS</option>
              <option value='MT'>MT</option>
              <option value='PA'>PA</option>
              <option value='PB'>PB</option>
              <option value='PE'>PE</option>
              <option value='PI'>PI</option>
              <option value='PR'>PR</option>
              <option value='RJ'>RJ</option>
              <option value='RN'>RN</option>
              <option value='RO'>RO</option>
              <option value='RR'>RR</option>
              <option value='RS'>RS</option>
              <option value='SC'>SC</option>
              <option value='SE'>SE</option>
              <option value='SP'>SP</option>
              <option value='TO'>TO</option>
            </select>
            <input id='nome' type='text' placeholder='Aplicador' value={filterNome} onChange={(e) => setFilterNome(e.target.value.toUpperCase())} />
            <input id='sigla' type='text' placeholder='Sigla' value={filterSigla} onChange={(e) => setFilterSigla(e.target.value.toUpperCase())} />
            <select id='tipo' name="select-tipoSite" defaultValue={filterTipoSite} onChange={(e) => setFilterTipoSite(e.target.value)}>
              <option disabled value=''>Tipo de Site</option>
              <option value="ERB-CT">ERB-CT</option>
              <option value="ERB">ERB</option>
              <option value="CT">CT</option>
              <option value="CD">CT</option>
              <option value="PREDIO CORE">PREDIO CORE</option>
              <option value="LOJA">LOJA</option>
              <option value="LOJA DEALER">LOJA DEALER</option>
              <option value="OUTDOOR">OUTDOOR</option>
              <option value="INDOOR">INDOOR</option>
            </select>
            <select id='status' name="select" defaultValue={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option disabled value=''>Status</option>
              <option value="Enviado">Enviado</option>
              <option value="Em Aberto">Em Aberto</option>
              <option value="Concluido">Concluido</option>
              <option value="Respondido pela Area">Respondido pela Area</option>
              <option value="Com Exceção">Com Exceção</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Revisado">Revisado</option>
            </select>

          </div>
          <div className="btnListar">
            <span>
              <a onClick={() => loadChamados(false)} disabled={!loading}>{loading === true ? 'Listar Todas APRs' : 'Carregando APRs...'}</a>
            </span>
          </div>
          <div className="btnListar">
            <span>
              <a style={{ backgroundColor: '#4eb414f5' }} onClick={() => loadChamados(true)} disabled={!loading}>{loading === true ? 'Listar Novas APRs' : 'Carregando APRs...'}</a>
            </span>
          </div>
        </div>

        <TableDashboard chamados={chamados} user={user} updateStatus={updateStatus}></TableDashboard>

      </div>

    </div>
  )
}