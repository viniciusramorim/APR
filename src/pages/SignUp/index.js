
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BsEye } from "react-icons/bs";

import '../SignIn/signin.css';

import { AuthContext } from '../../contexts/auth';

function SignUp() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [area, setArea] = useState('0');
  const [estado, setEstado] = useState('0');


  const { user, signUp, loadingAuth } = useContext(AuthContext);
  const listPermissionCad = [
    'wQzKfmkPgsV8PULa9t5JLg9Ta6j2',
    '5WBRPLgGmzUSLzrthSs9e9qnSnb2'
  ]

  function handleSubmit(e) {
    e.preventDefault();

    nome === '' && toast.info('Voce precisa preencher seu nome.')
    email === '' && toast.info('Voce precisa preencher seu e-mail.')
    password === '' && toast.info('Voce precisa preencher sua senha.')
    area === '0' && toast.info('Voce precisa preencher sua area.')
    estado === '0' && toast.info('Voce precisa preencher sua UF.')

    if (nome !== '' && email !== '' && password !== '' && area !== '0' && estado !== '0') {
      signUp(email, password, nome.toUpperCase(), area, 'aplicador', estado, false)
    }

  }

  function handleChangeSelectArea(e) {
    setArea(e.target.value)
  }

  function handleChangeSelectEstado(e) {
    setEstado(e.target.value)
  }

  function toggleVisible() {
    var x = document.getElementById("password");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <h1 style={{ color: "#FFF", padding: "10px" }}>Cadastrar Usuario</h1>
        </div>

        {listPermissionCad.includes(user.uid) ? (
          <form className='form-signin' onSubmit={handleSubmit}>
            <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input type="text" placeholder="email@email.com" value={email} onChange={(e) => setEmail(e.target.value.replace(' ', ''))} />
            <select id='area' value={area} onChange={handleChangeSelectArea} >
              <option disabled selected value="0">Selecione uma area...</option>
              <option value="patrimonial">Segurança Patrimonial</option>
              <option value="oem">O&M</option>
              {/* <option value="predial">Gerencia de Operações Predial</option>
              <option value="ronda">Ronda Motorizada</option> */}
            </select>
            <select id='estado' value={estado} onChange={handleChangeSelectEstado} >
              <option selected disabled value="0">Selecione sua UF...</option>
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
            <label className='password-visibily'>
              <input id='password' type="password" placeholder="*******" value={password} onChange={(e) => setPassword(e.target.value)} />
              <BsEye size={15} onClick={() => toggleVisible()} />
            </label>
            Requisitos senha:
            <ul className='password-requisit'>
              <li>Conter no minimo 1 letra MAIUSCULA</li>
              <li>Conter no minimo 1 letra MINISCULA</li>
              <li>Conter no minimo 1 CARACTER ESPECIAL</li>
              <li>Conter no minimo 1 NUMERO</li>
              <li>Conter no minimo 10 CARACTERES</li>
            </ul>
            <button type="submit">{loadingAuth ? 'Carregando...' : 'Cadastrar'}</button>
          </form>
        ) : (
          <h1 style={{marginTop:'15px'}}>Você não tem acesso ao cadastramento.</h1>
        )}
        <Link to={'/dashboard'}>↩ Voltar</Link>
      </div>
    </div>
  );
}

export default SignUp;
