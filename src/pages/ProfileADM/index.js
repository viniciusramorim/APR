
import { useState, useEffect, useContext } from 'react';
import { FiUsers, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { AuthContext } from '../../contexts/auth';
import firebase from '../../services/firebaseConnection';
import Title from '../../components/Title';
import Header from '../../components/Header';

import './profileAdm.css';

const listRef = firebase.firestore().collection('users')

export default function ProfileADM() {

  const { user, logSistem } = useContext(AuthContext);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers()
  })

  async function loadUsers() {

    let query = listRef

    query = query.orderBy('nome', 'asc')

    query = user.area === 'cabos' ? query.where('area', '==', user.area) : query

    await query
      .get()
      .then((snapshot) => {
        let usuarios = []
        snapshot.forEach((doc) => {
          usuarios.push({
            id_user: doc.id,
            nome: doc.data().nome,
            nivel: doc.data().nivel,
            status: doc.data().status,
            area: doc.data().area,
            email: doc.data().email,
            regional: doc.data().regional,
          })
        })
        setUsers(usuarios)
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  async function updateNivel(id_user, nivel, status) {
    await firebase.firestore().collection('users')
      .doc(id_user)
      .update({
        nivel: nivel,
        status: status
      })
      .then(() => {
        toast.info("Usuario foi alterado !")
        logSistem(`Nivel/Status de usuario foi alterado para ${nivel} - ${status} !`)
        loadUsers()
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  async function updateRegional(id_user, regional) {
    await firebase.firestore().collection('users')
      .doc(id_user)
      .update({
        regional: regional
      })
      .then(() => {
        toast.info("Usuario foi alterado !")
        logSistem(`Regional do usuario foi alterado para ${regional} !`)
        loadUsers()
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  function contUsers(status){
    var quantidadeElementos = users.filter(x => x.status === status).length;
    return quantidadeElementos
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="ADM Usuarios">
          <FiUsers size={25} />
        </Title>

        <div className="container indicadores">
          <span>Usuarios Ativos:<b>{contUsers(true)}</b></span>
          <span>Usuarios Inativos:<b>{contUsers(false)}</b></span>
        </div>

        <div className="container table-usuarios">
          <table>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Status</th>
                <th scope="col">Email</th>
                <th scope="col">Area</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((item, index) => {
                return (
                  <tr key={index}>
                    <td data-label="Usuario">{item.nome}</td>
                    <td data-label="Status">
                      {item.status === true ? (
                        <i onClick={() => updateNivel(item.id_user, item.nivel, false, item)}><FiCheck size={25} style={{ backgroundColor: "#0deb0d" }} /></i>
                      ) : (
                        <i onClick={() => updateNivel(item.id_user, item.nivel, true, item)}><FiX size={25} style={{ backgroundColor: "#f52a2a" }} /></i>
                      )}
                    </td>
                    <td data-label="Email">{item.email}</td>
                    <td data-label="Area">{item.area}</td>
                    <td data-label="">
                      <select key={'nivel-'+ index} value={item.nivel} onChange={(e) => updateNivel(item.id_user, e.target.value, item.status)} style={{ marginBottom: '0px', width: '100%' }}>
                        <option value={'administrador'}>Administrador</option>
                        <option value={'supervisor'}>Supervisor</option>
                        <option value={'aplicador'}>Aplicador</option>
                        <option value={'revisor'}>Revisor</option>
                      </select>
                      <select key={'regional-'+ index} value={item.regional !== undefined ? item.regional : "0"} onChange={(e) => updateRegional(item.id_user, e.target.value)} style={{ marginBottom: '0px', width: '100%' }}>
                        <option disabled value={'0'}>Regional</option>
                        <option value={'SP'}>SP</option>
                        <option value={'SUL'}>SUL</option>
                        <option value={'NE'}>NE</option>
                        <option value={'CO_N'}>CO_N</option>
                        <option value={'RJ_ES_MG'}>RJ_ES_MG</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}