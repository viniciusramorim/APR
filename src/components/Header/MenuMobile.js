import "./header.css";
import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import { MenuOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
export default function MenuMobile({ user, signOut, redefinirPassword }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="show">
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <MenuOutlined />
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {user.area === "ronda" && (
          <MenuItem onClick={handleClose}>
            <Link to="/newronda">
              <i id="label-menu" hidden>
                Aplicar Ronda
              </i>
            </Link>
            <Link to="/dashboardrondas">
              <i id="label-menu" hidden>
                Rondas Realizadas
              </i>
            </Link>
          </MenuItem>
        )}

        {(user.area === "patrimonial" || user.area === "oem") && (
          <MenuItem onClick={handleClose}>
            <Link to="/new">
              <a id="label-menu">Aplicar APR</a>
            </Link>
            <Link to="/dashboard">
              <i id="label-menu" hidden>
                APRs
              </i>
            </Link>
          </MenuItem>
        )}

        {user.nivel === "administrador" && (
          <Box>
            <MenuItem onClick={handleClose}>
              <Link to="/new_site">
                <a id="label-menu">Novo Site</a>
              </Link>
            </MenuItem>

            <MenuItem onClick={handleClose}>
              <Link to="/profileadm">
                <a id="label-menu">Gerenciar Perfis</a>
              </Link>
            </MenuItem>

            <MenuItem onClick={handleClose}>
              <Link to="/reports">
                <a id="label-menu">Relatório</a>
              </Link>
            </MenuItem>

            <MenuItem onClick={handleClose}>
              <Link to="/register">Registrar Usuário</Link>
            </MenuItem>
          </Box>
        )}
        <MenuItem onClick={handleClose}>
          <Link to="/profile">Configurações</Link>
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <a onClick={() => redefinirPassword()}>Trocar Senha</a>
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <a onClick={() => signOut()}>Sair</a>
        </MenuItem>
      </Menu>
    </div>
  );
}
