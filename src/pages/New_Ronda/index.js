
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/auth';
import { FiMapPin, FiCamera } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as geofire from 'geofire-common';

import './newronda.css'

import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';
import questionsRonda from './questions'

export default function NewRonda() {
  const { user } = useContext(AuthContext);

  const [location, setLocation] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {

    function getQuestions() {
      setQuestions(questionsRonda);
    }

    componentDidMount();

    getQuestions();

  }, [])

  function componentDidMount() {
    navigator.geolocation.getCurrentPosition(function (position) {
      console.log(position)
      setLocation(position.coords)
      getSites(position.coords.latitude, position.coords.longitude);
      setLoading(false)
    });
  }

  async function getSites(lat, lng) {
    // Find cities within 50km of London
    const center = [lat, lng];
    const radiusInM = 1 * 1000

    // Each item in 'bounds' represents a startAt/endAt pair. We have to issue
    // a separate query for each pair. There can be up to 9 pairs of bounds
    // depending on overlap, but in most cases there are 4.
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    console.log(bounds)
    const promises = [];
    for (const b of bounds) {
      const q = await firebase.firestore().collection('sites')
        .orderBy('geohash')
        .startAt(b[0])
        .endAt(b[1]);

      promises.push(q.get());
    }

    // Collect all the query results together into a single list
    Promise.all(promises).then((snapshots) => {
      const matchingDocs = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const lat = parseFloat(doc.get('Latitude'));
          console.log(doc.get('Latitude'));
          const lng = parseFloat(doc.get('Longitude'));
          console.log(doc.get('Longitude'));
          
          // We have to filter out a few false positives due to GeoHash
          // accuracy, but most will match
          const distanceInKm = geofire.distanceBetween([lat, lng], center);
          console.log(distanceInKm)
          const distanceInM = distanceInKm * 1000;
          console.log(distanceInM)
          console.log(radiusInM)
          if (distanceInKm <= radiusInM) {
            matchingDocs.push(doc);
          }
        }
      }

      return matchingDocs;
    }).then((matchingDocs) => {
      setSites(matchingDocs)
    });
  }

  async function submit(site_id) {

    let lat = location.latitude;
    let lng = location.longitude;
    let hash = geofire.geohashForLocation([lat, lng]);

    await firebase.firestore().collection('rondas')
      .add({
        geohash: hash,
        lat: lat,
        lng: lng,
        user_id: firebase.firestore().doc('users/' + user.uid),
        site_id: firebase.firestore().doc('sites/' + site_id),
        created: new Date(),
        checklist: [],
      })
      .then(async (index) => {

        let containsImage = verifyContainsImage();
        
        if (containsImage === true) {
          const questionsForEach = new Promise((resolve, reject) => {
            questions.forEach(async (question, indexQ) => {
              question.photo.forEach(async file => {
                let imgName = file.name
                let imgPath = `imagesRonda/${index.id}/${question.questionId}/${imgName}`
                let storageRef = await firebase.storage().ref(imgPath)
                let upload = storageRef.put(file)
  
                trackUpload(upload).then(() => {
                  storageRef.getDownloadURL().then((downloadUrl) => {
                    questions[indexQ].photo = downloadUrl
                    resolve()
                  })
                })
              })
            })
          })

          questionsForEach.then(async () => {
            await firebase.firestore().collection('rondas')
              .doc(index.id)
              .update({
                checklist: questions,
              })
              .then(() => {
                console.log('Completed')
                toast.success('Rota cadastrado com sucesso !');
              })
              .catch((err) => {
                console.log(err)
              })
          })
        }

        if(containsImage === false){
          await firebase.firestore().collection('rondas')
            .doc(index.id)
            .update({
              checklist: questions,
            })
            .then(() => {
              console.log('Completed')
              toast.success('Rota cadastrado com sucesso !');
            })
            .catch((err) => {
              console.log(err)
            })
        }
        
      })
  }

  function verifyContainsImage() {
    let containsImage = false
    questions.forEach(async (question) => {
        // verifica se contem imagem
        if (question.photo.length > 0) {
          containsImage = true
        }
    })

    return containsImage
  }

  function trackUpload(upload) {
    return new Promise((resolve, reject) => { // promise para retornar somente quando concluido.
      upload.on('state_changed',
        (snapshot) => {
          let percent = (snapshot.bytesTransferred / snapshot.totalBytes * 100).toFixed(2) + '%' // exibe em porcentagem o processo de upload
          console.log(percent)
        },
        (error) => {
          console.log(error)
          reject("Erro ao carregar imagem", error)
        },
        () => {
          resolve() // retorna quando concluido a imagem
        }
      )
    })
  }

  function checkQuestions(e, question, site) {
    let objIndex = questions.findIndex((obj => obj.id_question == question.id_question));
    questions[objIndex].resp = e.target.checked;
    setQuestions(questions);
  }
  //checklist file/img
  function handleFileCheclist(e, question, site) {
    let filesArr = Array.prototype.slice.call(e.target.files);
    let not_img = false;

    filesArr.forEach(file => {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        not_img = true;
      }
    })

    if (not_img === true) {
      toast.error("Selecione apenas imagens (PNG/JPEG)")
    } else {
      let objIndex = questions.findIndex((obj => obj.id_question == question.id_question));
      questions[objIndex].photo = filesArr;
      setQuestions(questions);
    }

    if (filesArr.length > 0) {
      document.getElementById("image_" + site.data().Sigla + "" + question.id_question).innerHTML = filesArr[0].name
    } else {
      document.getElementById("image_" + site.data().Sigla + "" + question.id_question).innerHTML = "Carregar Foto..."
    }
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Aplicar Ronda">
          <FiMapPin size={25} />
        </Title>

        {!loading ? (
          <>
            <div className='container geoloc'>
              <label>Local Atual</label>
              <span>Latitude: {location.latitude}</span>
              <span>Longitude: {location.longitude}</span>
            </div>

            <div className='container geoloc'>
              <label>Sites proximos</label>
              {sites.map((site, index) => {
                return (
                  <div key={index}>
                    <i>{site.data().Sigla}</i>
                    <i>{site.data().tipoSite}</i>
                    <i>{site.data().Endereco}</i>
                    <i>{site.data().Cidade}</i>
                    <i>{site.data().Estado}</i>
                    <i>{site.data().CEP}</i>
                    {questions.map((doc, index_) => {
                      return (
                        <p key={index_} className='questions-ronda'>
                          <span htmlFor={doc.id_question}>
                            <input type="checkbox" id={doc.id_question} name={doc.id_question} onChange={(e) => checkQuestions(e, doc, site)} />
                            {doc.question}
                          </span>
                        </p>
                      )
                    })}
                    <button onClick={() => submit(site.id)}> Realziar Ronda </button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className='container'>
            <label>Carregando informações...</label>
          </div>
        )}

      </div>
    </div>
  )
}