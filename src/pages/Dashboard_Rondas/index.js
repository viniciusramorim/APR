
import { useState, useEffect, useContext } from 'react';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';

import { AuthContext } from '../../contexts/auth';
import Header from '../../components/Header';
import Title from '../../components/Title';
import firebase from '../../services/firebaseConnection';
import './dashboardRondas.css';

const listRef = firebase.firestore().collection('rondas')

export default function DashboardRondas() {
  const [chamados, setChamados] = useState([]);

  const [loadchamado, setLoadchamado] = useState(true)

  const { user } = useContext(AuthContext);

  useEffect(() => {

    loadRondas();

  }, []);

  async function loadRondas() {
    let lista = [];
    await listRef
      .where('user_id', '==', firebase.firestore().collection('users').doc(user.uid))
      .get()
      .then(async (snapshot) => {
        let totalRondas = snapshot.docs.length
        let countRondas = 0

        new Promise((resolve, reject) => {
          snapshot.forEach(async (doc) => {
            lista.push({
              id: doc.id,
              site_id: await firebase.firestore().doc(doc.data().site_id.path).get().then((site) => {
                countRondas = countRondas + 1
                return site.data()
              }),
              user_id: await firebase.firestore().doc(doc.data().user_id.path).get().then((user) => { 
                return user.data()
              }),
              created: format(doc.data().created.toDate(), 'dd/MM/yyyy HH:mma')
            })
            if (countRondas === totalRondas) {
              setLoadchamado(false);
              setChamados(lista)
              resolve()
            }
          })
        })

      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Rondas">
          <FiMessageSquare size={25} />
        </Title>

        {!loadchamado && (

          
          <div className="container">
            <table>
              <thead>
                <tr>
                  <th scope="col">Sigla</th>
                  <th scope="col">Municipio</th>
                  <th scope="col">UF</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td data-label="Sigla">{item.site_id.Sigla}</td>
                      <td data-label="Municipio">{item.site_id.Cidade}</td>
                      <td data-label="UF">{item.site_id.Estado}</td>
                      <td data-label="Nome">{item.user_id.nome}</td>
                      <td data-label="Data">{item.created}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}