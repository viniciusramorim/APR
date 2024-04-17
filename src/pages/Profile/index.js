
import { useState, useContext } from 'react';
import { FiUser } from 'react-icons/fi';

import { AuthContext } from '../../contexts/auth';
import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';

import './profile.css';
import { toast } from 'react-toastify';

export default function Profile(){
  const { user, signOut, redefinirPassword, redefinirEmail} = useContext(AuthContext);

  const [nome, setNome] = useState(user && user.nome);
  const [email, setEmail] = useState(user && user.email);

  async function updateNivel(e) {
    e.preventDefault();
    if(nome !== '' && nome !== undefined){
      await firebase.firestore().collection('users')
        .doc(user.uid)
        .update({
          nome: nome,
        })
        .then(() => {
          alert('Nome aterado com sucesso!')
          signOut();
        })
        .catch((err) => {
          console.log('Deu algum erro: ', err);
        })
    } else {
      toast.error('Nome não pode ser nulo!')
    }
  }

  return(
    <div>
      <Header/>

      <div className="content">
        <Title name="Meu perfil">
          <FiUser size={25} onClick={() => console.log(user.uid)} />
        </Title>

        <div className="container">
          <form className="form-profile" onSubmit={updateNivel}>
            <label>Nome</label>
            <input type="text" value={nome} onChange={ (e) => setNome(e.target.value.toUpperCase()) } />

            <label>Email</label>
            <input type="text" value={email} disabled={true} />     

            <button className='btn-salvar' type="submit">Salvar</button>       

          </form>
        </div>

        <div className="container">
            <button className="logout-btn" onClick={ () => signOut() } >
               Sair
            </button>
            <button className="logout-btn" onClick={ () => redefinirPassword() } >
               Trocar Senha
            </button>
            <button className="logout-btn" onClick={ () => redefinirEmail() } >
               Alterar E-mail
            </button>
        </div>

      </div>
    </div>
  )
}