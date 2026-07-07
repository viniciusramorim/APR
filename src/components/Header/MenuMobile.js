import "./header.scss";
import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import { MenuOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import RegisterMember from "../RegisterMember";

export default function MenuMobile({ user }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [registerModalOpen, setRegisterModalOpen] = React.useState(false);
  const canAccessAnalyticsMap = user?.uid === "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2";
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenRegister = () => {
    handleClose();
    setRegisterModalOpen(true);
  };

  return (
    <div className="show mobile">
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        style={{ color: "#fff" }}
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
            <MenuItem onClick={handleClose} component={Link} to="/newronda">
              Aplicar Ronda
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/dashboardrondas">
              Rondas Realizadas
            </MenuItem>
          </Box>
        )}

        {(user.area === "patrimonial" ||
          user.area === "oem" ||
          user.area === "pci") && (
          <Box>
            <MenuItem onClick={handleClose} component={Link} to="/new">
              Aplicar APR
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/aprs">
              APRs
            </MenuItem>
          </Box>
        )}

        {user.nivel === "administrador" && (
          <Box>
            <MenuItem onClick={handleClose} component={Link} to="/new_site">
              Novo Site
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/profileadm">
              Gerenciar Perfis
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/reports">
              Relatorio
            </MenuItem>
            {canAccessAnalyticsMap && (
              <MenuItem onClick={handleClose} component={Link} to="/analytics-map">
                Mapa Analytics
              </MenuItem>
            )}
            <MenuItem onClick={handleOpenRegister}>Adicionar usuario</MenuItem>
          </Box>
        )}

        {(user.nivel === "auditor" ||
          user.nivel === "revisor" ||
          user.nivel === "revisor_logistica") && (
          <Box>
            <MenuItem onClick={handleClose} component={Link} to="/reports">
              Relatorio
            </MenuItem>
            {canAccessAnalyticsMap && (
              <MenuItem onClick={handleClose} component={Link} to="/analytics-map">
                Mapa Analytics
              </MenuItem>
            )}
          </Box>
        )}

        <MenuItem onClick={handleClose} component={Link} to="/profile">
          Configuracoes
        </MenuItem>
      </Menu>

      <RegisterMember
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </div>
  );
}
