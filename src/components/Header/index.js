
import { useContext } from 'react';
import './header.css';
import { AuthContext } from '../../contexts/auth';

import { Link } from 'react-router-dom';
import { FiHome, FiUser, FiMapPin, FiFileText, FiUsers } from "react-icons/fi";
import { MdPlayCircleFilled, MdOutlineAssignmentLate, MdMenu } from "react-icons/md";
import logo from '../../assets/logoaprdigital-removebg.png';
import logoRonda from '../../assets/logoRondaDigital-removebg.png';

export default function Header() {
  const { user } = useContext(AuthContext);

  return (
    <div className={"sidebar " + user.area}>

      <div className='info-user' data-color={user.area}>

        {user.area === 'ronda' && (
          <img src={logoRonda} alt="Logo da Vivo Ronda Digital" />
        )}
        {(user.area === 'patrimonial' || user.area === 'oem') && (
          <img src={logo} alt="Logo da Vivo APR Digital" />
        )}
        <span>{user.nome}</span>
        <i>{user.area === 'patrimonial' ? 'empresarial' : user.area}</i>
      </div>

      <span className="dropdown">
        <span className='menuButton'><MdMenu size={25} /> Menu</span>

        <p className='dropdown-content'>
          {user.area === 'ronda' && (
            <>
              <Link className={'firs-ronda'} to="/newronda" >
                <MdPlayCircleFilled color="#fff" size={26} />
                Aplicar Ronda
              </Link>

              <Link to="/dashboardrondas" >
                <FiHome size={24} />
                Rondas Realizadas
              </Link>
            </>
          )}

          {(user.area === 'patrimonial') && (
            <>
              <Link className={'first-patrimonial'} to="/new" >
                <MdPlayCircleFilled color="#fff" size={21} />
                Aplicar APR
              </Link>

              <Link to="/dashboard" >
                <FiHome size={21} />
                APRs
              </Link>

              <Link to="/assignments" >
                <MdOutlineAssignmentLate size={21} />
                APRs Atribuidas
              </Link>
            </>
          )}

          {(user.area === 'oem') && (
            <Link to="/dashboard" >
              <FiHome size={21} />
              APRs
            </Link>
          )}

          {user.nivel === 'administrador' && (
            <>
              <Link to="/new_site" >
                <FiMapPin size={21} />
                Novo Site
              </Link>
              <Link to="/profileadm" >
                <FiUsers size={21} />
                Gerenciar Perfis
              </Link>
              <Link to="/reports" >
                <FiFileText size={21} />
                Relatorio
              </Link>
              <Link to="/register" >
                <FiUsers size={21} />
                Registrar Usuario
              </Link>
            </>
          )}

          {user.nivel === 'revisor' && (
            <>

              <Link to="/reports" >
                <FiFileText size={21} />
                Relatorio
              </Link>
            </>
          )}


          <Link to="/profile" >
            <FiUser size={21} />
            Meu Perfil
          </Link>
        </p>
      </span>

    </div>
  )
}