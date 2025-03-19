import "./header.scss";
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
    <div className="show mobile">
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        style={{ color: '#fff' }}
      >
        <p>Menu</p>
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
          <Box>
            <MenuItem>
              <Link to="/newronda">
                <i id="label-menu" hidden>
                  Aplicar Ronda
                </i>
              </Link>
            </MenuItem>
            <MenuItem>
              <Link to="/dashboardrondas">
                <a id="label-menu" hidden>
                  Rondas Realizadas
                </a>
              </Link>
            </MenuItem>
          </Box>
        )}

        {(user.area === "patrimonial" || user.area === "oem" || user.area === "pci") && (
          <Box>
            <MenuItem>
              <Link to="/new">
                <a id="label-menu">Aplicar APR</a>
              </Link>
            </MenuItem>

            <MenuItem>
              <Link to="/aprs">
                <a id="label-menu">
                  APRs
                </a>
              </Link>
            </MenuItem>
          </Box>
        )}

        {(user.nivel === "administrador") && (
          <Box>
            <MenuItem >
              <Link to="/new_site">
                <a id="label-menu">Novo Site</a>
              </Link>
            </MenuItem>

            <MenuItem >
              <Link to="/profileadm">
                <a id="label-menu">Gerenciar Perfis</a>
              </Link>
            </MenuItem>

            <MenuItem>
              <Link to="/reports">
                <a id="label-menu">Relatório</a>
              </Link>
            </MenuItem>

            <MenuItem>
              <Link to="/register">Registrar Usuário</Link>
            </MenuItem>
          </Box>
        )}

        <MenuItem >
          <Link to="/profile">Configurações</Link>
        </MenuItem>
      </Menu>
    </div>
  );
}
