
import { useContext, useEffect, useState } from 'react';
import { FiClipboard, FiCheck, FiX } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { toast } from 'react-toastify';
import { format } from 'date-fns'
import * as geofire from 'geofire-common';

import './new.css'

import { AuthContext } from '../../contexts/auth';
import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';
import ModalLoading from '../../components/Modal_Loading';
import Modal_Justificativa from '../../components/Modal_Justificativa';
import CameraComponent from './CameraComponent';

import questions_erb_ct from './Questions/erb-ct'
import questions_predio_core from './Questions/predio_core'
import question_outdoor from './Questions/outdoor'
import questions_indoor from './Questions/indoor'
import questions_llpp from './Questions/llpp'
import questions_ldealer from './Questions/ldealer';

export default function New() {
  const { user, logSistem } = useContext(AuthContext);
  const { id } = useParams();
  const { id_assign } = useParams();


  const [questions, setQuestions] = useState([]);
  
  const [siteInfo, setSiteInfo] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  
  const [location, setLocation] = useState([]);
  const [inicio, setInicio] = useState('');
  const [areaResp, setAreaResp] = useState('');
  const [lastAPR, setLastAPR] = useState('');
  
  const [loadingImages, setLoadingImages] = useState('');
  
  const [justificativa, setJustificativa] = useState();
  const [openModalJust, setOpenModalJust] = useState(false);
  useEffect(() => {

    async function loadSite() {
      await firebase.firestore().collection('sites')
        .doc(id)
        .get()
        .then((snapshot) => {
          setSiteInfo(snapshot.data());
          if (snapshot.data().last_apr !== undefined) {
            setLastAPR(format(snapshot.data().last_apr.toDate(), 'dd/MM/yyyy HH:mma'))
          }
          setInicio(new Date());
        })
        .catch((error) => {
          console.log('DEU ALGUM ERRO!', error);
        })
    }

    loadSite()

    navigator.geolocation.getCurrentPosition(function (position) {
      setLocation(position.coords)
    })

  }, [id])

  async function getQuestions(snapshot) {
    let question = [];
    navigator.permissions.query({ name: 'geolocation' })
      .then(async (item) => {
        if (item.state !== 'granted') {
          alert('habilite a geolocation para realizar a APR')
          return
        } else {
          document.getElementById('container-questions').style.display = 'flex';
          siteInfo.tipoSite = snapshot

          if (snapshot === "ERB-CT") {
            question = questions_erb_ct.filter(Boolean);
          } else if (snapshot === "PREDIO CORE") {
            question = questions_predio_core.filter(Boolean);
          } else if (snapshot === "OUTDOOR") {
            question = question_outdoor.filter(Boolean);
          } else if (snapshot === "INDOOR") {
            question = questions_indoor.filter(Boolean);
          } else if (snapshot === "LOJA") {
            question = questions_llpp.filter(Boolean);
          } else if (snapshot === "LOJA DEALER") {
            question = questions_ldealer.filter(Boolean);
          }
          setQuestions(Object.entries(question[0]));
        }
      })

  }
  //questions textarea
  function textareaValue(question, indexA, e) {
    let objIndex = questions[indexA][1].findIndex((obj => obj.questionId == question.questionId));
    questions[indexA][1][objIndex].respTextArea = e.target.value;
    setQuestions(questions)
  }
  //questions sim ou não
  function radioSetValue(question, indexA, e) {
    let objIndex = questions[indexA][1].findIndex((obj => obj.questionId == question.questionId));
    questions[indexA][1][objIndex].resp = e.target.value;
    setQuestions(questions);
    saveIndexedDB()

    if (e.target.value === '') {
      document.getElementById(indexA + "_textarea_" + question.questionId).style.display = 'none'
      document.getElementById("inputimg_" + question.questionId + "_" + indexA).style.display = 'none'
      return
    }

    if (question.textarea === true) {
      document.getElementById(indexA + "_textarea_" + question.questionId).style.display = 'block'
      document.getElementById("inputimg_" + question.questionId + "_" + indexA).style.display = 'flex'
    } else if (question.textarea === true) {
      document.getElementById(indexA + "_textarea_" + question.questionId).style.display = 'none'
      document.getElementById("inputimg_" + question.questionId + "_" + indexA).style.display = 'none'
    }
  }

  function clearQuestion(question, indexA) {
    var element = document.getElementsByName(indexA + '-' + question.questionId);
    let objIndex = questions[indexA][1].findIndex((obj => obj.questionId == question.questionId));
    saveIndexedDB();

    document.querySelectorAll("#inputimg_" + question.questionId + "_" + indexA).forEach(item => {
      for (let index = 0; index < item.children.length; index++) {
        if (item.children.length > 1) {
          item.lastChild.remove()
        }
      }
    });

    document.getElementById(indexA + "_textarea_" + question.questionId).style.display =
      document.getElementById(indexA + "_textarea_" + question.questionId).style.display === 'block' && 'none'
    document.getElementById("inputimg_" + question.questionId + "_" + indexA).style.display =
      document.getElementById("inputimg_" + question.questionId + "_" + indexA).style.display === 'flex' && 'none'



    document.getElementById(indexA + "_textarea_" + question.questionId).value = ""

    questions[indexA][1][objIndex].resp = '';
    questions[indexA][1][objIndex].images = [];
    questions[indexA][1][objIndex].respTextArea = '';

    setQuestions(questions);
    for (var i = 0; i < element.length; i++)
      element[i].checked = false;

  }
  //função do botão remover imagem da lista
  function removeImg(indexA, objIndex, file) {
    let imageArray = []
    let arrayQuestion = questions[indexA][1][objIndex]
    let index = arrayQuestion.images.findIndex((obj => obj.name === file.name));

    delete arrayQuestion.images[index]

    arrayQuestion.images.forEach((file) => {
      imageArray.push(file)
    })

    questions[indexA][1][objIndex].images = imageArray;
    setQuestions(questions);
  }

  async function updateAssignments() {
    await firebase.firestore().collection('atribuicoes')
      .doc(id_assign)
      .update({
        status: 'APR Criada'
      })
      .then(() => {
        console.log('Apr Criada')
      })
      .catch(err => {
        console.log(err)
      })
  }

  function togglePostModal() {
    setShowPostModal(!showPostModal) //trocando de true pra false
  }

  function submit(e) {
    let notBlankChecklist = 0;

    questions.forEach(async (area) => {
      area[1].forEach(async (question) => {
        if (question.resp !== '') {
          notBlankChecklist = notBlankChecklist + 1;
        }
      })
    })

    if (notBlankChecklist <= 0) {
      if (justificativa == null || justificativa == "" || justificativa.motivo === '' || justificativa.desc === '' ) {
        setOpenModalJust(true)
        console.log('Insira uma justificativa')
        return
      } 
      console.log(justificativa)
    }

    navigator.permissions.query({ name: 'geolocation' })
      .then(async (item) => {
        if (item.state === 'granted') {
          getPerimetro(location.latitude, location.longitude).then(async perimeter => {
            togglePostModal(); //abre modal de loading
            insertDatabase(perimeter);
          }).catch(err => {
            alert('Erro na geolocation, contate um administrador')
            console.log('Erro na geolocation, contate um administrador' + err)
          })
        } else {
          alert('habilite a geolocation para realizar a APR')
          console.log('habilite a geolocation para realizar a APR')
        }
      })
  }

  async function insertDatabase(perimeter) {
    let checklist = []
    let concluido = false;

    let qtdImages = 0
    let imagesCompleted = 0

    saveIndexedDB();

    await firebase.firestore().collection('aprs-producao')
      .add({
        user_id: user,
        site_id: siteInfo,
        created: new Date(),
        status: justificativa ? 'Com Exceção' : 'Em Aberto',
        justificativa: justificativa ? justificativa : '',
        locationCreated: {
          latitude: location.latitude,
          longitude: location.longitude,
          perimetro: perimeter,
        },
        tempoConclusao: {
          inicio: inicio === undefined ? new Date() : inicio,
          conclusao: new Date(),
        }
      })
      .then(async (index) => {

        let containsImage = verifyContainsImage()

        questions.forEach(async (area, indexA) => {
          checklist.push({
            0: area[0],
            1: []
          })
          area[1].forEach(async (question, indexQ) => {

            checklist[indexA][1].push(
              {
                imagesURL: [],
                resp: question.resp,
                respTextArea: question.respTextArea,
                questionId: question.questionId,
                question: question.question,
                plano_acao: question.plano_acao,
                openPA: question.openPA,
                areaResposavel: question.areaResposavel,
                respGabarito: question.respGabarito,
              }
            )

            //Verifica antes de carregar no banco se contem resposta
            if (question.resp !== '') {
              let imageList = [] // criar uma lista de imagem e reseta a cada questao
              //inserção de dados no banco OBS: se contem imagem ou não
              if (containsImage === true) {
                question.images.forEach(async file => {
                  let imgName = file.name
                  let imgPath = `images/${index.id}/${indexA}/${question.questionId}/${imgName}`

                  let storageRef = await firebase.storage().ref(imgPath)
                  let upload = storageRef.put(file)

                  qtdImages = qtdImages + 1

                  let uploadCompleted = new Promise((resolve, reject) => { // promise para concluir apos termino de upload geral de fotos
                    trackUpload(upload).then(() => {
                      storageRef.getDownloadURL()
                        .then((downloadUrl) => {
                          imageList.push({
                            url: downloadUrl,
                            ref: storageRef.fullPath
                          })
                          try {
                            console.log(indexA + "-" + indexQ)
                            checklist[indexA][1][indexQ].imagesURL = imageList; //define a lista em uma pergunta
                          } catch (error) {
                            console.log(indexA + "-" + indexQ)
                            console.log('Erro ao obter url da imagem' + error)
                          }
                          imagesCompleted = imagesCompleted + 1 // conta quantos imagens foi obtida a url
                          // console.log((imagesCompleted / qtdImages * 100).toFixed(2) + '%'); // mostra o status de imagens concluida vs pendentes
                          console.log(imagesCompleted + ' / ' + qtdImages); // mostra o status de imagens concluida vs pendentes
                          setLoadingImages(imagesCompleted + ' / ' + qtdImages)
                          if (imagesCompleted === qtdImages) { // retorna como concluido apenas quantos os valores estiverem ok
                            resolve()
                          }
                        }).catch(err => {
                          console.log("Erro ao obter URL" + err)
                        })
                    }).catch((err) => {
                      console.log("Erro no upload: " + err)
                    })
                  })

                  uploadCompleted.then(async () => {
                    await firebase.firestore().collection('aprs-producao')
                      .doc(index.id)
                      .update({
                        checklist: checklist,
                      })
                      .then(() => {
                        console.log('Completed')
                        logSistem('A APR foi criada', index.id)
                        conclusionApr(index.id)
                      })
                      .catch((err) => {
                        console.log(err)
                      })
                  })
                })
              }
            }
          })
        })

        if (containsImage === false) {
          await firebase.firestore().collection('aprs-producao')
            .doc(index.id)
            .update({
              checklist: checklist,
            })
            .then(async () => {
              console.log('Completed not contains Image')
              logSistem('A APR foi criado', index.id)
              conclusionApr(index.id)
            })
            .catch((err) => {
              console.log('Erro ao inserir APR (sem imagens)')
            })
        }

        if (id_assign !== undefined) {
          updateAssignments();
        }

      })
      .catch(err => [
        console.log(err)
      ])
  }
  // função de monitoramento de upload de imagens
  function trackUpload(upload) {
    return new Promise((resolve, reject) => { // promise para retornar somente quando concluido.
      upload.on('state_changed',
        (snapshot) => {
          let percent = (snapshot.bytesTransferred / snapshot.totalBytes * 100).toFixed(2) + '%' // exibe em porcentagem o processo de upload
          console.log(percent)
        },
        (error) => {
          toast.error("Erro ao carregar imagem !")
          console.log(error)
          reject("Erro ao carregar imagem", error)
          document.getElementById('modalLoading').style.display = 'none'
        },
        () => {
          resolve() // retorna quando concluido a imagem
        }
      )
    })
  }

  function verifyContainsImage() {
    let containsImage = false
    questions.forEach(async (area) => {
      area[1].forEach(async (question) => {
        // verifica se contem imagem
        if (question.images.length > 0) {
          containsImage = true
        }
      })
    })

    return containsImage
  }

  async function getPerimetro(lat, lng) {
    const center = [parseFloat(lat), parseFloat(lng)];
    const radiusInM = 1 * 1000

    let latitude = parseFloat(siteInfo.Latitude.replace(',', '.'));
    let longitude = parseFloat(siteInfo.Longitude.replace(',', '.'));
    console.log(latitude)
    console.log(longitude)
    const distanceInKm = geofire.distanceBetween([latitude, longitude], center);
    const distanceInM = distanceInKm * 1000;
    if (distanceInM <= radiusInM) {
      return ('Esta dentro do Perimetro')
    } else {
      return ('fora perimetro')
    }
  }

  function conclusionApr(id) {
    document.getElementById('container-conclusion').style.display = 'flex';
    document.getElementById('container-questions').style.display = 'none';
    document.getElementById('container-save').style.display = 'none';
    document.getElementById('container').style.display = 'none';
    document.getElementById('modalLoading').style.display = 'none'

    var container = document.getElementById('container-conclusion');
    var root = createRoot(container);

    return root.render(
      <>
        <span>APR Finalizada com Sucesso !</span>
        <span>ID da sua APR : <i>{id}</i></span>
        <a href={'/dashboard'} >Ir Pagina Inicial</a>
        <a href={`/open/${id}`} >Ir APR Criada</a>
      </>
    );
  }

  function dropdownArea(indexA) {
    let element = document.getElementById(`container-${indexA}`).style.display
    document.getElementById(`container-${indexA}`).style.display = element === 'none' ? 'block' : 'none'
  }

  function loadIndexedDB() {
    // Abrir ou criar um banco de dados no IndexedDB 
    var request = indexedDB.open('SaveAPR', 1);
    var db;

    request.onerror = function (event) {
      console.error('Erro ao abrir o banco de dados:', event.target.error);
    };

    request.onsuccess = function (event) {
      db = event.target.result;

      // Função para ler o objeto do IndexedDB 
      function lerObjetoDoIndexedDB(id) {
        var transaction = db.transaction(['dados'], 'readonly');
        var objectStore = transaction.objectStore('dados');
        var request = objectStore.get(id);

        request.onsuccess = function (event) {
          var objeto = event.target.result;
          if (objeto) {
            // delete objeto.id;
            let newObj = []
            let date
            try {
              date = new Date(objeto.inicio)
            } catch (error) {
              console.log('Erro ao converter data' + error)
            }
            setInicio(date)
            document.getElementById('selectSite').value = objeto.tipo_site
            siteInfo.tipoSite = objeto.tipo_site
            delete objeto.id
            delete objeto.inicio
            delete objeto.tipo_site
            Object.entries(objeto).forEach((doc, index) => {
              newObj.push(doc[1])
            })
            setQuestions(newObj)
            document.getElementById('container-questions').style.display = 'flex';
          } else {
            alert('Voce nao tem nenhuma APR salva.');
            console.log('Usuario não possui APR Salva')
          }
        };

        request.onerror = function (event) {
          console.error('Erro ao ler o objeto do IndexedDB:', event.target.error);
        };
      }

      // Chamar a função para ler o objeto do IndexedDB 
      lerObjetoDoIndexedDB(1); // Passar o ID do objeto que deseja ler 

    };


    setQuestions(questions)
  }

  function saveIndexedDB(button) {
    let questiosSave = {
      id: 1,
      inicio: inicio,
      tipo_site: siteInfo.tipoSite,
      ...questions
    };

    // Abrir ou criar um banco de dados no IndexedDB 
    var request = indexedDB.open('SaveAPR', 1);
    var db;

    request.onerror = function (event) {
      console.error('Erro ao abrir o banco de dados:', event.target.error);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      // Cria uma nova tabela (object store) chamada "dados" 
      var objectStore = db.createObjectStore('dados', { keyPath: 'id' });
    };

    request.onsuccess = function (event) {
      db = event.target.result;

      // Função para salvar/atualizar o objeto JSON no IndexedDB 
      function salvarObjetoNoIndexedDB(objeto) {
        var transaction = db.transaction(['dados'], 'readwrite');
        var objectStore = transaction.objectStore('dados');
        var request = objectStore.put(objeto);
        request.onsuccess = function (event) {
          toast.success(button);
          // toast.success('APR salvo/atualizado com sucesso.');
        };
        request.onerror = function (event) {
          toast.error('Erro ao salvar/atualizar o objeto no IndexedDB:', event.target.error);
          console.log('Erro ao salvar/atualizar o objeto no IndexedDB:')
        };
      }
      // Função para realizar as atualizações no objeto 
      function realizarAtualizacoes(objeto) {
        salvarObjetoNoIndexedDB(objeto);
      }
      // Verificar se o objeto já existe no IndexedDB 
      function verificarObjetoExistente() {
        var transaction = db.transaction(['dados'], 'readonly');
        var objectStore = transaction.objectStore('dados');
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
          console.error('Erro ao verificar o objeto no IndexedDB:', event.target.error);
        };
      }
      // Chamada da função para verificar se o objeto já existe e realizar as atualizações ou salvá-lo 
      verificarObjetoExistente();
    };
  }

  function getQuestion(params) {
    questions.forEach((value, index) => {
      console.log(value[0])
      value[1].forEach((value) => {
        console.log(value.questionId + " - " + value.question)
      })
    })
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Aplicar APR">
          <FiClipboard size={25} onClick={() => getQuestion()} />
        </Title>

        <div className='container'>
          <div className='siteInfo'>
            <ul>
              <li><span>Unidade: </span>{siteInfo.Nome}</li>
              <li><span>Endereço: </span>{siteInfo.Endereco}</li>
              <li><span>Estado: </span>{siteInfo.Estado}</li>
              <li><span>Criticidade: </span>{siteInfo.critical}</li>
            </ul>
            <ul>
              <li><span>Cidade: </span>{siteInfo.Cidade}</li>
              <li><span>Latitude: </span>{siteInfo.Latitude}</li>
              <li><span>Longitude: </span>{siteInfo.Longitude}</li>
              <li><span>Ultima APR: </span>{lastAPR}</li>
            </ul>
          </div>
        </div>

        <div className='container' id='container-save'>
          <div className='save'>
            <a onClick={() => loadIndexedDB()}>Carregar Salvo</a>
            <a onClick={() => saveIndexedDB('APR salvo/atualizado com sucesso.')}>Salvar APR</a>
          </div>
        </div>

        <div className='container' id='container'>
          <select id='selectSite' onChange={e => getQuestions(e.target.value)}>
            <option value={'0'}>Selecione um tipo de site...</option>
            <option value={'ERB-CT'}>ERB-CT</option>
            <option value={'PREDIO CORE'}>PREDIO CORE</option>
            <option value={'OUTDOOR'}>ARMARIO OUTDOOR</option>
            <option value={'INDOOR'}>ARMARIO INDOOR</option>
            <option value={'LOJA'}>LOJA</option>
            <option value={'LOJA DEALER'}>LOJA DEALER</option>
          </select>
        </div>

        <div className='container' id='container-questions' style={{ display: 'none' }}>
          <div id='checklist' className="form-new">
            {questions.map((area, indexA) => {
              return (
                <div key={indexA}>
                  <i id='button-area' onClick={() => dropdownArea(indexA)}>{area[0]}</i>
                  <span id={`container-${indexA}`} style={{ display: 'block' }}>
                    {area[1].map((doc, indexDoc) => {
                      return ( // (doc.critical[0] === siteInfo.critical || doc.critical[1] === siteInfo.critical || doc.critical[2] === siteInfo.critical) &&
                        <div key={indexDoc} className='container-perg'>
                          {doc.questionId} - {doc.question}
                          <div>
                            {doc.selectOptions === true && (
                              <>
                                <label>
                                  <input className='yes' type="radio" name={indexA + '-' + doc.questionId} value={doc.answers[0]} defaultChecked={doc.resp === 'Sim' ? true : false} onChange={(e) => radioSetValue(doc, indexA, e)} />
                                  <FiCheck size={25} /> {doc.answers[0]}
                                </label>
                                <label>
                                  <input className='no' type="radio" name={indexA + '-' + doc.questionId} value={doc.answers[1]} defaultChecked={doc.resp === 'Não' ? true : false} onChange={(e) => radioSetValue(doc, indexA, e)} />
                                  <FiX size={25} /> {doc.answers[1]}
                                </label>
                                <label>
                                  <input className='no' type="radio" name={indexA + '-' + doc.questionId} value={''} onChange={(e) => radioSetValue(doc, indexA, e)} />
                                  <FiX size={25} /> N/A
                                </label>
                              </>
                            )}
                            {doc.inputImages === true && ( // className='input-file'
                              <ul className='imageList' id={"inputimg_" + doc.questionId + "_" + indexA} style={{ display: doc.resp !== '' && doc.resp !== doc.respGabarito ? 'flex' : 'none' }}>
                                <li className='notremove'>
                                  <CameraComponent
                                    saveIndexedDB={saveIndexedDB}
                                    questions={questions}
                                    doc={doc}
                                    indexA={indexA}
                                  />
                                </li>
                                {doc.images.length > 0 && (
                                  doc.images.map((img, indexImg) => {
                                    return (
                                      <li id={doc.questionId + "_image_" + indexImg} style={{ background: `url(${URL.createObjectURL(img)}) round` }}>
                                        <i id={doc.questionId + "_removeimg_" + indexImg} onClick={() => {
                                          document.getElementById(doc.questionId + "_image_" + indexImg).remove()
                                          removeImg(indexA, '0', doc.images[0])
                                        }}>
                                          X
                                        </i>
                                      </li>
                                    )
                                  })
                                )}
                              </ul>
                            )}
                            {doc.textarea === true && (
                              <textarea
                                id={indexA + "_textarea_" + doc.questionId}
                                type="text"
                                placeholder="Descreva o problema (obrigatorio)."
                                style={{ display: doc.resp !== '' ? 'block' : 'none' }}
                                onChange={(e) => textareaValue(doc, indexA, e)}
                                defaultValue={doc.respTextArea !== '' && doc.resp !== doc.respGabarito ? doc.respTextArea : ''}
                              />
                            )}
                          </div>
                          {/* <select key={doc.questionId} style={{ textAlign: 'right' }} value={doc.areaResposavel} onChange={(e) => handleSelectArea(doc, indexA, e)}>
                            <option value={'oem'}>O&M</option>
                            <option value={'patrimonial'}>Segurança Patrimonial</option>
                            <option value={'predial'}>Gerencia de Operações Predial</option>
                          </select> */}
                          <i className='clearQuestion' onClick={(() => clearQuestion(doc, indexA))}> Limpar </i>
                        </div>
                      )
                    })}
                  </span>
                </div>
              )
            })}
            <button onClick={() => submit()}>Concluir APR</button>
          </div>
        </div>

        <div className='container' id='container-conclusion' style={{ display: 'none' }}>
        </div>

        <Modal_Justificativa openModal={openModalJust} setModal={setOpenModalJust} setJustificativa={setJustificativa}/>

        {showPostModal && (
          <ModalLoading
            carregamento={loadingImages}
          />
        )}
      </div>
    </div>
  )
}