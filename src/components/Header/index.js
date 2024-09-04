import "./header.css";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth";
import logoRonda from "../../assets/logoRondaDigital-removebg.png";
import logo from "../../assets/logoaprdigital-removebg.png";

import { Link } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiLogOut,
  FiUser,
  FiLock,
  FiMapPin,
  FiFileText,
} from "react-icons/fi";
import { Avatar, Tooltip } from "@mui/material";
import MenuMobile from "./MenuMobile";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import FileDownloadDoneSharpIcon from "@mui/icons-material/FileDownloadDoneSharp";
import PlaylistAddSharpIcon from "@mui/icons-material/PlaylistAddSharp";
import PersonOutlineSharpIcon from "@mui/icons-material/PersonOutlineSharp";
import ContentPasteSearchSharpIcon from "@mui/icons-material/ContentPasteSearchSharp";
import PersonAddSharpIcon from "@mui/icons-material/PersonAddSharp";
import LockResetSharpIcon from "@mui/icons-material/LockResetSharp";
import ExitToAppSharpIcon from "@mui/icons-material/ExitToAppSharp";

export default function Header() {
  const { user, signOut, redefinirPassword } = useContext(AuthContext);

  function expandMenu() {
    let element = document.getElementById("sidebar-menu");
    let width = element.offsetWidth;
    let queryObj = document.querySelectorAll("#label-menu");

    document.getElementById("sidebar-menu").style.width =
      width >= 170 ? "50px" : "170px";
    document.getElementById("logo-apr").style.width =
      width >= 170 ? "120px" : "170px";


    for (let i of queryObj) {
      i.hidden = width >= 170 ? true : false;
    }
  }

  return (
    <div id="sidebar-menu" className="sidebar">
      <Avatar
        id={"logo-apr"}
        variant="rounded"
        src={logo}
        onClick={() => expandMenu()}
      ></Avatar>
      <MenuMobile
        className="menu-mobile"
        user={user}
        signOut={signOut}
        redefinirPassword={redefinirPassword}
      />

      <section id="menu">
        {user.area === "ronda" && (
          <>
            <Tooltip title="Aplicar Ronda" placement="right" arrow>
              <Link to="/newronda">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar Ronda</i>
              </Link>
            </Tooltip>
            <Tooltip title="Rondas Realizadas" placement="right" arrow>
              <Link to="/dashboardrondas">
                <FiHome color="#000" size={20} />
                <i id="label-menu">Rondas Realizadas</i>
              </Link>
            </Tooltip>
          </>
        )}

        {(user.area === "patrimonial" || user.area === "oem") && (
          <>
            <Tooltip title="Aplicar APR" placement="right" arrow>
              <Link to="/new">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar APR</i>
              </Link>
            </Tooltip>
            <Tooltip title="APRs" placement="right" arrow>
              <Link to="/dashboard">
                <FileDownloadDoneSharpIcon color="#000" size={20} />
                <i id="label-menu">APRs</i>
              </Link>
            </Tooltip>
          </>
        )}

        {user.nivel === "administrador" && (
          <>
            <Tooltip title="Novo Site" placement="right" arrow>
              <Link to="/new_site">
                <PlaylistAddSharpIcon color="#000" size={20} />
                <i id="label-menu">Novo Site</i>
              </Link>
            </Tooltip>
            <Tooltip title="Gerenciar Perfis" placement="right" arrow>
              <Link to="/profileadm">
                <PersonOutlineSharpIcon color="#000" size={20} />
                <i id="label-menu">Gerenciar Perfis</i>
              </Link>
            </Tooltip>
            <Tooltip title="Relatório" placement="right" arrow>
              <Link to="/reports">
                <ContentPasteSearchSharpIcon color="#000" size={20} />
                <i id="label-menu">Relatório</i>
              </Link>
            </Tooltip>
            <Tooltip title="Registrar Usuário" placement="right" arrow>
              <Link to="/register">
                <PersonAddSharpIcon color="#000" size={20} />
                <i id="label-menu">Registrar Usuário</i>
              </Link>
            </Tooltip>
          </>
        )}

        {user.nivel === "revisor" && (
          <Tooltip title="Relatório" placement="right" arrow>
            <Link to="/reports">
              <ContentPasteSearchSharpIcon color="#000" size={20} />
              <i id="label-menu">Relatório</i>
            </Link>
          </Tooltip>
        )}

        <Tooltip title="Meu Perfil" placement="right" arrow>
          <Link to="/profile">
            <PersonOutlineSharpIcon color="#000" size={20} />
            <i id="label-menu">Meu Perfil</i>
          </Link>
        </Tooltip>

        <Tooltip title="Trocar Senha" placement="right" arrow>
          <a onClick={() => redefinirPassword()}>
            <LockResetSharpIcon color="#000" size={20} />
            <i id="label-menu">Trocar Senha</i>
          </a>
        </Tooltip>

        <Tooltip title="Sair" placement="right" arrow>
          <a onClick={() => signOut()}>
            <ExitToAppSharpIcon color="#000" size={20} />
            <i id="label-menu">Sair</i>
          </a>
        </Tooltip>
      </section>
    </div>
  );
}
