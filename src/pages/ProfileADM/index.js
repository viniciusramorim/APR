
import { useState, useEffect, useContext } from 'react';
import { FiUsers, FiX, FiCheck, FiLock } from 'react-icons/fi';
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

  async function updateNivel(id_user, nivel) {
    await firebase.firestore().collection('users')
      .doc(id_user)
      .update({
        nivel: nivel,
      })
      .then(() => {
        toast.info("Usuario foi alterado !")
        logSistem(`NIVEL-USUARIO-ALTERADO ${nivel.toUpperCase()}`, id_user)
        loadUsers()
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  async function updateStatus(id_user, status) {
    await firebase.firestore().collection('users')
      .doc(id_user)
      .update({
        status: status,
      })
      .then(() => {
        toast.info("Usuario foi alterado !")
        logSistem(`STATUS-USUARIO-ALTERADO ${status === true ? 'ATIVO' : 'INATIVO'}`, id_user)
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
        logSistem(`REGIONAL-ALTERADA ${regional}`, id_user)
        loadUsers()
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  function contUsers(status) {
    var quantidadeElementos = users.filter(x => x.status === status).length;
    return quantidadeElementos
  }

  function trocaSenha(id) {
    const requestOptions = {
      method: "POST",
      redirect: "follow"
    };

    fetch(`https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/alterarSenhaUsuario?userId=${id}`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result)
        logSistem('SENHA-USUARIO-TROCADA', id)
        alert(result)
        return result;
      })
      .catch((error) => console.error(error));
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
                <th scope="col">Troca Senha</th>
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
                        <i onClick={() => updateStatus(item.id_user, false)}><FiCheck size={25} style={{ backgroundColor: "#0deb0d" }} /></i>
                      ) : (
                        <i onClick={() => updateStatus(item.id_user, true)}><FiX size={25} style={{ backgroundColor: "#f52a2a" }} /></i>
                      )}
                    </td>
                    <td data-label="Email">{item.email}</td>
                    <td data-label="Area">{item.area === 'patrimonial' ? 'empresarial' : item.area}</td>
                    {user.uid === 'wQzKfmkPgsV8PULa9t5JLg9Ta6j2' && (
                      <td data-label="Trocar Senha">
                        <i onClick={() => trocaSenha(item.id_user)}><FiLock size={25} style={{ backgroundColor: "#716c6c" }} /></i>
                      </td>
                    )}
                    <td data-label="">
                      <select key={'nivel-' + index} value={item.nivel} onChange={(e) => updateNivel(item.id_user, e.target.value)} style={{ marginBottom: '0px', width: '100%' }}>
                        {user.uid === 'wQzKfmkPgsV8PULa9t5JLg9Ta6j2' && <option value={'administrador'}>Administrador</option>}
                        <option value={'supervisor'}>Supervisor</option>
                        <option value={'aplicador'}>Aplicador</option>
                        <option value={'revisor'}>Revisor</option>
                      </select>
                      <select key={'regional-' + index} value={item.regional !== undefined ? item.regional : "0"} onChange={(e) => updateRegional(item.id_user, e.target.value)} style={{ marginBottom: '0px', width: '100%' }}>
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