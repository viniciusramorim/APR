import "./header.scss";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../contexts/auth";
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
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import SignUpModal from "../RegisterMember";
import { AddModerator, Analytics, Email } from "@mui/icons-material";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Title from "../Title";

export default function Header({ name, subtitle, children }) {
  const { user, signOut, redefinirPassword } = useContext(AuthContext);
  const [openModal, setOpenModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const location = useLocation();

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const menuItems = [];

  // Adicionar itens do menu baseado no usuário

  if (user.area === "patrimonial" || user.area === "pci") {
    menuItems.push(
      {
        text: "Aplicar APR",
        icon: <PlaylistAddCheckSharpIcon />,
        link: "/new",
        subtitle: "Submeta uma nova APR",
      },
      {
        text: "APRs",
        icon: <FileDownloadDoneSharpIcon />,
        link: "/aprs",
        subtitle: "Visualize suas APRs",
      }
    );
  }

  if (user.area === "oem") {
    menuItems.push(
      {
        text: "Aplicar APR",
        icon: <PlaylistAddCheckSharpIcon />,
        link: "/new",
        subtitle: "Submeta uma nova APR",
      },
      {
        text: "APRs",
        icon: <FileDownloadDoneSharpIcon />,
        link: "/aprs",
        subtitle: "Visualize suas APRs",
      },
      {
        text: "Relatório",
        icon: <Analytics />,
        link: "/oem",
        subtitle: "Gere relatórios",
      }
    );
  }

  if (user.area === "logistica") {
    menuItems.push(
      {
        text: "Aplicar APR",
        icon: <PlaylistAddCheckSharpIcon />,
        link: "/new",
        subtitle: "Submeta uma nova APR",
      },
      {
        text: "APRs",
        icon: <FileDownloadDoneSharpIcon />,
        link: "/aprs",
        subtitle: "Visualize suas APRs",
      }
    );
  }

  if (user.nivel === "administrador") {
    menuItems.push(

      {
        text: "Novo Site",
        icon: <PlaylistAddSharpIcon />,
        link: "/new_site",
        subtitle: "Cadastre um novo site",
      },
      {
        text: "Gerenciar Perfis",
        icon: <PersonOutlineSharpIcon />,
        link: "/profileadm",
        subtitle: "Gerencie usuários",
      },
      {
        text: "Relatório",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatórios",
      },
      {
        text: "Analytics",
        icon: <Analytics />,
        link: "/oem",
        subtitle: "Visualize métricas",
      },
      {
        text: "Gerenciar Emails",
        icon: <Email />,
        link: "/contact-email",
        subtitle: "Configure emails",
      },
      {
        text: "Questionários",
        icon: <ContentPasteIcon />,
        link: "/questions",
        subtitle: "Gerencie questionários",
      },
      {
        text: "Gerenciamento de Logs",
        icon: <AddModerator />,
        link: "/manager-logs",
        subtitle: "Visualize logs do sistema",
      }
    );

    // Adicionar gerenciar sites para usuários específicos
    if (
      [
        "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
        "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
        "J8Ktb51lucTxok00HAi2qTv7jQH2",
        "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
        "WN0EtV44xnV0V87n5wBBXT87QXI2",
      ].includes(user.uid)
    ) {
      menuItems.push({
        text: "Gerenciar Sites",
        icon: <ApprovalOutlinedIcon />,
        link: "/sites",
        subtitle: "Administre sites",
      });
    }
  }

  if (user.nivel === "auditor") {
    menuItems.push(
      {
        text: "APRs",
        icon: <FileDownloadDoneSharpIcon />,
        link: "/aprs",
        subtitle: "Visualize suas APRs",
      },
      {
        text: "Relatório",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatórios",
      }
    );
  }

  if (user.nivel === "revisor" || user.nivel === "revisor_logistica") {
    menuItems.push(
      {
        text: "APRs",
        icon: <FileDownloadDoneSharpIcon />,
        link: "/aprs",
        subtitle: "Visualize suas APRs",
      },
      {
        text: "Relatório",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatórios",
      },
      {
        text: "Gerenciar Emails",
        icon: <Email />,
        link: "/contact-email",
        subtitle: "Configure emails",
      }
    );
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="header-fixed" sx={{ position: "fixed", display: "flex", justifyContent:"space-between" }}>
        <Box className="title-pages">
          <Title name={name} subtitle={subtitle}>
            {children}
          </Title>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ color: "#666", mt: 0.5, mr: 2, textTransform: "uppercase" }}>
           {user.nome} - {user.nivel?.replace(/_/g, ' ')}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: drawerOpen ? 1100 : 1500,
          }}
        >
          <IconButton
            onClick={toggleDrawer(true)}
            sx={{
              backgroundColor: "#8e24aa",
              color: "white",
              "&:hover": {
                backgroundColor: "#7b1fa2",
              },
              borderRadius: 2,
              p: 1.5,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </div>

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        transitionDuration={0}
        hideBackdrop={false}
        PaperProps={{
          sx: {
            width: 320,
            backgroundColor: "white",
            color: "#333",
            zIndex: 1200,
          },
        }}
        ModalProps={{
          sx: {
            zIndex: 1200,
          },
        }}
      >
        <Box sx={{ height: "100vh", backgroundColor: "white" }}>
          {/* Header Roxo do Drawer */}
          <Box
            sx={{
              backgroundColor: "#8e24aa",
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "white" }}
              >
                APR Digital
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.8)" }}
              >
                Análise Preliminar de Risco
              </Typography>
            </Box>
            <IconButton onClick={toggleDrawer(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Lista de Menus */}
          <List sx={{ backgroundColor: "white", p: 2 }}>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.link;
              return (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.link}
                    onClick={toggleDrawer(false)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: isActive
                        ? "rgba(142, 36, 170, 0.1)"
                        : "transparent",
                      borderLeft: isActive
                        ? "4px solid #8e24aa"
                        : "4px solid transparent",
                      "&:hover": {
                        backgroundColor: "rgba(142, 36, 170, 0.08)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#8e24aa", minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      secondary={item.subtitle}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: "#333",
                      }}
                      secondaryTypographyProps={{
                        fontSize: "0.75rem",
                        color: "#666",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Seção do Perfil */}
          <Box sx={{ mt: "auto", backgroundColor: "white", p: 2 }}>
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "rgba(142, 36, 170, 0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#8e24aa", minWidth: 40 }}>
                  <PersonOutlineSharpIcon />
                </ListItemIcon>
                <DrawerMyAccount />
              </ListItemButton>
            </ListItem>

            {/* Cadastrar Usuário para Administradores */}
            {user.nivel === "administrador" && (
              <ListItem disablePadding sx={{ mt: 1 }}>
                <ListItemButton
                  onClick={() => {
                    handleOpenModal();
                    setDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: "rgba(142, 36, 170, 0.08)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "#8e24aa", minWidth: 40 }}>
                    <PersonAddSharpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cadastrar Usuário"
                    secondary="Adicione um novo usuário"
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: "white",
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Menu Mobile Original (mantido para compatibilidade) */}
      <MenuMobile
        className="menu-mobile"
        user={user}
        signOut={signOut}
        redefinirPassword={redefinirPassword}
      />

      <SignUpModal open={openModal} onClose={handleCloseModal} />
    </>
  );
}
