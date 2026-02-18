import "./header.scss";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import logo from "../../assets/logoaprdigital-removebg.png";
import logoMobile from "../../assets/logoaprdigital-removebg-mobile.png";
import DrawerMyAccount from "../../components/DrawerMyAccount/DrawerMyAccount";

import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { Avatar, Tooltip } from "@mui/material";
import MenuMobile from "./MenuMobile";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import FileDownloadDoneSharpIcon from "@mui/icons-material/FileDownloadDoneSharp";
import PlaylistAddSharpIcon from "@mui/icons-material/PlaylistAddSharp";
import PersonOutlineSharpIcon from "@mui/icons-material/PersonOutlineSharp";
import ContentPasteSearchSharpIcon from "@mui/icons-material/ContentPasteSearchSharp";
import PersonAddSharpIcon from "@mui/icons-material/PersonAddSharp";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import ApprovalOutlinedIcon from '@mui/icons-material/ApprovalOutlined';
import SignUpModal from "../RegisterMember";
import { AddModerator, Analytics, Email } from "@mui/icons-material";

export default function Header() {
  const { user, signOut, redefinirPassword } = useContext(AuthContext);
  const [openModal, setOpenModal] = useState(false);

  function expandMenu() {
    let element = document.getElementById("sidebar-menu");
    let width = element.offsetWidth;
    let queryObj = document.querySelectorAll("#label-menu");

    document.getElementById("sidebar-menu").style.width =
      width >= 170 ? "50px" : "170px";
    document.getElementById("logo-apr").style.width =
      width >= 170 ? "50px" : "170px";

    for (let i of queryObj) {
      i.hidden = width >= 170 ? true : false;
    }
  }

  const location = useLocation();

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <div id="sidebar-menu" className="sidebar">
      <Avatar
        className="logo"
        id={"logo-apr"}
        variant="rounded"
        src={logo}
        onClick={() => expandMenu()}
      />
      <Avatar
        className="logo-m"
        id={"logo-apr-m"}
        variant="rounded"
        src={logoMobile}
        onClick={() => expandMenu()}
      />
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

        {(user.area === "patrimonial" || user.area === "pci") && (
          <>
            <Tooltip title="Aplicar APR" placement="right" arrow>
              <Link to="/new">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar APR</i>
              </Link>
            </Tooltip>
            <Tooltip title="APRs" placement="right" arrow>
              <Link to="/aprs">
                <FileDownloadDoneSharpIcon color="#000" size={20} />
                <i id="label-menu">APRs</i>
              </Link>
            </Tooltip>
          </>
        )}

        {(user.area === "oem") && (
          <>
            <Tooltip title="Aplicar APR" placement="right" arrow>
              <Link to="/new">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar APR</i>
              </Link>
            </Tooltip>
            <Tooltip title="APRs" placement="right" arrow>
              <Link to="/aprs">
                <FileDownloadDoneSharpIcon color="#000" size={20} />
                <i id="label-menu">APRs</i>
              </Link>
            </Tooltip>
            <Tooltip title="Analytics" placement="right" arrow>
              <Link to="/oem">
                <Analytics color="#000" size={20} />
                <i id="label-menu">Analytics</i>
              </Link>
            </Tooltip>
          </>
        )}

        {user.nivel === "administrador" && (
          <>
            <Tooltip title="Aplicar APR" placement="right" arrow>
              <Link to="/new">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar APR</i>
              </Link>
            </Tooltip>
            <Tooltip title="APRs" placement="right" arrow>
              <Link to="/aprs">
                <FileDownloadDoneSharpIcon color="#000" size={20} />
                <i id="label-menu">APRs</i>
              </Link>
            </Tooltip>
            <Tooltip title="Novo Site" placement="right" arrow>
              <Link to="/new_site">
                <PlaylistAddSharpIcon color="#000" size={20} />
                <i id="label-menu">Novo Site</i>
              </Link>
            </Tooltip>
            <Tooltip title="Usuarios" placement="right" arrow>
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
            <Tooltip title="Analytics" placement="right" arrow>
              <Link to="/oem">
                <Analytics color="#000" size={20} />
                <i id="label-menu">Analytics</i>
              </Link>
            </Tooltip>
            <Tooltip title="Gerenciar Email" placement="right" arrow>
              <Link to="/contact-email">
                <Email color="#000" size={20} />
                <i id="label-menu">Gerenciar Emails</i>
              </Link>
            </Tooltip>
            <Tooltip title="Questionários" placement="right" arrow>
              <Link to="/questions">
                <ContentPasteIcon color="#000" size={20} />
                <i id="label-menu">Questionário</i>
              </Link>
            </Tooltip>
            <Tooltip title="Cadastrar Novo Usuário" placement="right" arrow>
              <Link
                to={location.pathname}
                className="user-name"
                onClick={handleOpenModal}
              >
                <SignUpModal />
                <PersonAddSharpIcon color="#000" size={10} />
                <i id="label-menu">Cadastrar Usuário</i>
              </Link>
            </Tooltip>
            <Tooltip title="Gerenciamento de Logs" placement="right" arrow>
              <Link to="/manager-logs">
                <AddModerator color="#000" size={20} />
                <i id="label-menu">Gerenciamento de Logs</i>
              </Link>
            </Tooltip>
          </>
        )}

        {user.nivel === "auditor" && (
          <Tooltip title="Relatório" placement="right" arrow>
            <Link to="/reports">
              <ContentPasteSearchSharpIcon color="#000" size={20} />
              <i id="label-menu">Relatório</i>
            </Link>
          </Tooltip>
        )}

        {user.nivel === "revisor" && (
          <>
            <Tooltip title="Relatório" placement="right" arrow>
              <Link to="/reports">
                <ContentPasteSearchSharpIcon color="#000" size={20} />
                <i id="label-menu">Relatório</i>
              </Link>
            </Tooltip>
            <Tooltip title="Gerenciar Email" placement="right" arrow>
              <Link to="/contact-email">
                <Email color="#000" size={20} />
                <i id="label-menu">Gerenciar Emails</i>
              </Link>
            </Tooltip>
          </>
        )}

        {user.nivel === "usuario_gcn" && (
          <>
            <Tooltip title="Aplicar APR" placement="right" arrow>
              <Link to="/new">
                <PlaylistAddCheckSharpIcon color="#000" size={20} />
                <i id="label-menu">Aplicar APR</i>
              </Link>
            </Tooltip>
            <Tooltip title="APRs" placement="right" arrow>
              <Link to="/aprs">
                <FileDownloadDoneSharpIcon color="#000" size={20} />
                <i id="label-menu">APRs</i>
              </Link>
            </Tooltip>
            <Tooltip title="Relatório" placement="right" arrow>
              <Link to="/reports">
                <ContentPasteSearchSharpIcon color="#000" size={20} />
                <i id="label-menu">Relatório</i>
              </Link>
            </Tooltip>
          </>
        )}

        <Tooltip title="Meu Perfil" placement="right" arrow>
          <Link to={location.pathname} className="myaccount">
            <DrawerMyAccount />
          </Link>
        </Tooltip>

        {[
          "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
          "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
          "J8Ktb51lucTxok00HAi2qTv7jQH2",
          "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
          "WN0EtV44xnV0V87n5wBBXT87QXI2",
          "Eic8AhQR6ITeEkfOfuV5uo5SGBJ2",
        ].includes(user.uid) && (
            <Tooltip title="Gerenciar Sites" placement="right" arrow>
              <Link to="/sites">
                <ApprovalOutlinedIcon color="#000" size={20} />
                <i id="label-menu">Gerenciar Sites</i>
              </Link>
            </Tooltip>
          )}

      </section>
      <SignUpModal open={openModal} onClose={handleCloseModal} />
    </div>
  );
}
