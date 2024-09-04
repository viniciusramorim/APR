import { useState, useContext } from 'react';
import { BsEye } from 'react-icons/bs';

import './signin.css';
import { AuthContext } from '../../contexts/auth';
import logo from '../../assets/logoaprdigital-removebg.png';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('null');

  const { signIn, loadingAuth } = useContext(AuthContext);

  function handleSubmit(e) {
    e.preventDefault();

    if (email !== '' && password !== '') {
      signIn(email.replaceAll(' ', ''), password.replaceAll(' ', ''));
    }
  }

  function toggleVisible() {
    var x = document.getElementById('password');
    if (x.type === 'password') {
      x.type = 'text';
    } else {
      x.type = 'password';
    }
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Sistema Logo" />
        </div>
        <form className="form-signin" onSubmit={handleSubmit}>
          <label className="label-login">E-mail:</label>
          <input
            type="text"
            placeholder="email@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="label-login">Senha:</label>
          <label className="password-visibily">
            <input
              id="password"
              type="password"
              placeholder="*******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <BsEye size={15} onClick={() => toggleVisible()} />
          </label>
          <button type="submit">
            {loadingAuth ? 'Carregando...' : 'Acessar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
