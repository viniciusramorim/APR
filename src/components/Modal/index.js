import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

import { AuthContext } from '../../contexts/auth';
import planoAcao from './PlanoAcao/planoAcao';
import './modal.css';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function Modal({ checklist, firebase, conteudo, close, area, tipoSite, loadApr }) {
  const base = 'aprs-producao'

  const [tempo, setTempo] = useState('');
  const [comentario, setComentario] = useState('');
  const [cardapio, setCardapio] = useState([]);
  const [justificativa, setJutificativa] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [nomeDetentora, setNomeDetentora] = useState('');
  const [numeroChamado, setNumeroChamado] = useState('');

  const [planoAcaoAtual, setPlanoAcaoAtual] = useState('');

  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const index = checklist[area][1].findIndex(object => {
    if (object !== undefined) {
      return object.question === conteudo.question;
    }
  });

  useEffect(() => {
    function loadConstants() {
      setTempo(conteudo.plano_acao.tempo ? conteudo.plano_acao.tempo : '')
      setComentario(conteudo.plano_acao.comentario ? conteudo.plano_acao.comentario : '')
      setSelectedOption(conteudo.resp_pa_selectedOption ? conteudo.resp_pa_selectedOption : conteudo.plano_acao.selectedOption)
      setJutificativa(conteudo.plano_acao.justificativa ? conteudo.plano_acao.justificativa : '')
      setNomeDetentora(conteudo.plano_acao.nome_detentora ? conteudo.plano_acao.nome_detentora : '')
      setNumeroChamado(conteudo.plano_acao.numero_chamado ? conteudo.plano_acao.numero_chamado : '')
    }

    loadConstants()

    if (planoAcao[0][tipoSite] !== undefined) {
      let newArray = planoAcao[0][tipoSite].filter(item => (item.indexQ === index && item.indexA === area));  // Filtra as strings com comprimento maior que 5
      setPlanoAcaoAtual(newArray[0]);
      setCardapio(newArray)
    }
  }, [])


  function handleChangeSelect(e) {
    setTempo(e.target.value);
  }

  async function alterarPA(indexA, indexQ) {
    console.log(indexA + ' - ' + indexQ)
    await firebase.firestore().collection(base)
      .doc(id)
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          const dados = doc.data();
          if (selectedOption === 'Sim') {
            if (tempo === '') return toast('Voce precisa selecionar um SLA.')
            if (comentario === '') return toast('Voce precisa preencher um comentario/justificativa.')
            dados.checklist[area][1][index].plano_acao = {
              planoId: planoAcaoAtual ? planoAcaoAtual.planoId : 'n/a',
              nomeTecnico: planoAcaoAtual ? planoAcaoAtual.nomeTecnico : 'n/a',
              apicabilidade: planoAcaoAtual ? planoAcaoAtual.apicabilidade : 'n/a',
              ambiente: planoAcaoAtual ? planoAcaoAtual.ambiente : 'n/a',
              especificacao: planoAcaoAtual ? planoAcaoAtual.especificacao : 'n/a',
              tempo: tempo,

              comentario: comentario,
            };

          } else if (selectedOption === 'Não') {
            if (justificativa === '') return toast('Voce precisa selecionar um Justificativa.')
            if (comentario === '') return toast('Voce precisa preencher um comentario/justificativa.')
            dados.checklist[area][1][index].plano_acao = {
              justificativa: justificativa,

              comentario: comentario,
            };
          } else if (selectedOption === 'Detentora') {
            if (nomeDetentora === '') return toast('Voce precisa preencher a detentora.')
            if (numeroChamado === '') return toast('Voce precisa preencher o numero de chamado.')
            if (comentario === '') return toast('Voce precisa preencher um comentario/justificativa.')
            dados.checklist[area][1][index].plano_acao = {
              nome_detentora: nomeDetentora,
              numero_chamado: numeroChamado,

              comentario: comentario,
            };
          }

          dados.checklist[area][1][index].resp_pa_selectedOption = selectedOption;
          dados.checklist[area][1][index].resp_pa_data = new Date();
          dados.checklist[area][1][index].resp_pa_user_name = user.nome;
          dados.checklist[area][1][index].resp_pa_user_id = user.uid

          console.log(dados)
          // Agora, atualize o documento no Firestore
          await firebase.firestore().collection(base)
            .doc(id)
            .update(dados)
            .then(() => {
              updateAPR(id)
              toast.success('PA atualizado com sucesso!');
              loadApr()
              close()
            })
            .catch((error) => {
              console.log('Erro ao atualizar valor:', error);
              close()
            });
        } else {
          console.log('O documento não existe.');
        }
      })
      .catch(err => {
        console.log('Error ao inserir update!' + err)
        close()
      });
  }

  function updatePlanoAcao() {
    if (index !== -1) {
      alterarPA(area, index)
    }
  }

  async function updateAPR(id) {
    await firebase.firestore().collection(base)
      .doc(id)
      .update({
        status: 'Respondido pela Area',
        data_alteracao: new Date()
      })
      .then(() => {
        console.log('Status APR atualizado com sucesso!');
      })
      .catch((error) => {
        toast.error('Erro ao atualizar status da apr:', error);
        console.log('Erro ao atualizar status da apr:', error);
      });
  }

  return (
    <div className="modal">
      <div className="container">
        <button className="close" onClick={close}>
          <FiX size={23} color="#FFF" />

        </button>

        <h2 className='titulo-planoacao'>Plano de Ação</h2>

        <div className='selectOptions' style={{ display: conteudo.plano_acao.selected_option || conteudo.resp_pa_selectedOption ? 'none' : 'flex' }}>
          <label>inconformidade sera tratada? </label>

          <input
            type="radio"
            id="Sim"
            name="option"
            value="Sim"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <label htmlFor="Sim">Sim</label>

          <input
            type="radio"
            id="Não"
            name="option"
            value="Não"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <label htmlFor="Não">Não</label>

          <input
            type="radio"
            id="Detentora"
            name="option"
            value="Detentora"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <label htmlFor="Detentora">Detentora</label>
        </div>

        <div id={'modal-sim'} className='modal-body' style={{ display: selectedOption === 'Sim' ? 'block' : 'none' }}>
          <div className="row">
            <span>
              Sugestão de Proteção:
              <select value={tempo} onChange={(e) => setPlanoAcaoAtual(cardapio[e.target.value])}>
                {cardapio.map((item, index) => {
                  console.log(item)
                  return (
                    <option key={index} value={index}>{item ? item.nomeTecnico + '-' + item.apicabilidade : 'Sem Aplicabilidade'}</option>
                  )
                })}
              </select>
            </span>
          </div>

          <div className="row">
            <span>
              Nome Tecnico: <i>{planoAcaoAtual ? planoAcaoAtual.nomeTecnico : 'Sem Nome Tecnico'}</i>
            </span>
          </div>

          <div className="row">
            <span>
              Aplicabilidade: <i>{planoAcaoAtual ? planoAcaoAtual.apicabilidade : 'Sem Aplicabilidade'}</i>
            </span>
          </div>

          <div className="row">
            <span>
              Especificação: <textarea value={planoAcaoAtual ? planoAcaoAtual.especificacao : 'Sem Especificação'} readOnly style={{ height: '150px' }} />
            </span>
          </div>

          <div className="row">
            <span>
              SLA:
              {conteudo.plano_acao.tempo ? (
                <i>{conteudo.plano_acao.tempo}</i>
              ) : (
                <select value={tempo} onChange={handleChangeSelect}>
                  <option value="" disabled>Selecione Tempo</option>
                  <option value="03 meses">03 meses</option>
                  <option value="06 meses">06 meses</option>
                  <option value="09 meses">09 meses</option>
                  <option value="12 meses">12 meses</option>
                </select>
              )}
            </span>
          </div>

          <div className="row">
            <span>
              Comentario / Justificativa:
            </span>
          </div>

          {conteudo.plano_acao.comentario ? (
            <div className="row">
              <i>{conteudo.plano_acao.comentario}</i>
            </div>
          ) : (
            <div className="row">
              <textarea type='text' value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
          )}
        </div>

        <div id={'modal-nao'} className='modal-body' style={{ display: selectedOption === 'Não' ? 'block' : 'none' }}>
          <div className="row">
            <span>
              Justificativa:
              <select value={justificativa} disabled={conteudo.plano_acao.justificativa} onChange={(e) => setJutificativa(e.target.value)}>
                <option value={''} disabled>Selecione a justificativa...</option>
                <option value={'Instalada solução similar'}>Instalada solução similar</option>
                <option value={'Sem orçamento'}>Sem orçamento</option>
                <option value={'Solução em desacordo'}>Solução em desacordo</option>
                <option value={'Discordância de necessidade'}>Discordância de necessidade</option>
              </select>
            </span>
          </div>

          <div className="row">
            <span>
              Comentario / Justificativa:
            </span>
          </div>

          {conteudo.plano_acao.comentario ? (
            <div className="row">
              <i>{conteudo.plano_acao.comentario}</i>
            </div>
          ) : (
            <div className="row">
              <textarea type='text' value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
          )}
        </div>

        <div id={'modal-detentora'} className='modal-body' style={{ display: selectedOption === 'Detentora' ? 'block' : 'none' }}>
          <div className="row">
            <span>
              Nome da Detentora:
              <input type='text' readOnly={conteudo.plano_acao.nome_detentora} value={nomeDetentora} onChange={(e) => setNomeDetentora(e.target.value.toUpperCase())} />
            </span>
          </div>

          <div className="row">
            <span>
              Numero do Chamado:
              <input type='text' readOnly={conteudo.plano_acao.numero_chamado} value={numeroChamado} onChange={(e) => setNumeroChamado(e.target.value.toUpperCase())} />
            </span>
          </div>

          <div className="row">
            <span>
              Comentario / Justificativa:
            </span>
          </div>

          {conteudo.plano_acao.comentario ? (
            <div className="row">
              <i>{conteudo.plano_acao.comentario}</i>
            </div>
          ) : (
            <div className="row">
              <textarea type='text' value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
          )}
        </div>

        {conteudo.resp_pa_user_name && (
          <div>
            <div className="row">
              <span>Nome: {conteudo.resp_pa_user_name}</span>
            </div>
            <div className="row">
              <span>Data: {format(conteudo.resp_pa_data.toDate(), "dd/MM/yyyy HH:mm")}</span>
            </div>
          </div>
        )}

        <div className="btnAcao">
          {(conteudo.plano_acao.length === 0 && selectedOption) && (
            <a onClick={updatePlanoAcao}>Criar Plano de Ação</a>
          )}
        </div>
      </div>
    </div>
  )
}