import "./header.scss";
import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import MenuMobile from "./MenuMobile";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import FileDownloadDoneSharpIcon from "@mui/icons-material/FileDownloadDoneSharp";
import PlaylistAddSharpIcon from "@mui/icons-material/PlaylistAddSharp";
import PersonOutlineSharpIcon from "@mui/icons-material/PersonOutlineSharp";
import ContentPasteSearchSharpIcon from "@mui/icons-material/ContentPasteSearchSharp";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import { AddModerator, Analytics, Email } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import Title from "../Title";
import RegisterMember from "../RegisterMember";

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Header({ name, subtitle, children }) {
  const { user, signOut, redefinirPassword } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const canAccessAnalyticsMap = user?.uid === "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2";

  const location = useLocation();

  const userInitials = getInitials(user?.nome);
  const userLevelLabel = user?.nivel?.replace(/_/g, " ") || "usuario";

  const handleChangePassword = () => {
    setDrawerOpen(false);
    redefinirPassword();
  };

  const handleSignOut = () => {
    setDrawerOpen(false);
    signOut();
  };

  const handleOpenRegister = () => {
    setDrawerOpen(false);
    setRegisterModalOpen(true);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(open);
  };

  const menuItems = [];

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
        text: "Relatorio",
        icon: <Analytics />,
        link: "/oem",
        subtitle: "Gere relatorios",
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
        text: "Novo Site",
        icon: <PlaylistAddSharpIcon />,
        link: "/new_site",
        subtitle: "Cadastre um novo site",
      },
      {
        text: "Gerenciar Perfis",
        icon: <PersonOutlineSharpIcon />,
        link: "/profileadm",
        subtitle: "Gerencie usuarios",
      },
      {
        text: "Relatorio",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatorios",
      },
      {
        text: "Analytics",
        icon: <Analytics />,
        link: "/oem",
        subtitle: "Visualize metricas",
      },
      {
        text: "Gerenciar Emails",
        icon: <Email />,
        link: "/contact-email",
        subtitle: "Configure emails",
      },
      {
        text: "Questionarios",
        icon: <ContentPasteIcon />,
        link: "/questions",
        subtitle: "Gerencie questionarios",
      },
      {
        text: "Gerenciamento de Logs",
        icon: <AddModerator />,
        link: "/manager-logs",
        subtitle: "Visualize logs do sistema",
      }
    );

    if (canAccessAnalyticsMap) {
      menuItems.push({
        text: "Mapa Analytics",
        icon: <TravelExploreRoundedIcon />,
        link: "/analytics-map",
        subtitle: "Radar territorial das APRs",
      });
    }

    if (
      [
        "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
        "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
        "J8Ktb51lucTxok00HAi2qTv7jQH2",
        "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
        "WN0EtV44xnV0V87n5wBBXT87QXI2",
        "Eic8AhQR6ITeEkfOfuV5uo5SGBJ2",
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
        text: "Relatorio",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatorios",
      }
    );

    if (canAccessAnalyticsMap) {
      menuItems.push({
        text: "Mapa Analytics",
        icon: <TravelExploreRoundedIcon />,
        link: "/analytics-map",
        subtitle: "Radar territorial das APRs",
      });
    }
  }

  if (user.nivel === "revisor" || user.nivel === "revisor_logistica") {
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
        text: "Relatorio",
        icon: <ContentPasteSearchSharpIcon />,
        link: "/reports",
        subtitle: "Visualize relatorios",
      },
      {
        text: "Gerenciar Emails",
        icon: <Email />,
        link: "/contact-email",
        subtitle: "Configure emails",
      }
    );

    if (canAccessAnalyticsMap) {
      menuItems.push({
        text: "Mapa Analytics",
        icon: <TravelExploreRoundedIcon />,
        link: "/analytics-map",
        subtitle: "Radar territorial das APRs",
      });
    }
  }

  const uniqueMenuItems = menuItems.filter(
    (item, index, items) =>
      items.findIndex((currentItem) => currentItem.link === item.link) === index
  );

  return (
    <>
      <div
        className="header-fixed"
        sx={{ position: "fixed", display: "flex", justifyContent: "space-between" }}
      >
        <Box className="title-pages">
          <Title name={name} subtitle={subtitle}>
            {children}
          </Title>
        </Box>

        <Box className="header-user-meta">
          <Typography
            className="header-user-label"
            variant="subtitle2"
            sx={{
              color: "#666",
              mt: 0.5,
              mr: 2,
              textTransform: "uppercase",
            }}
          >
            {user.nome} - {userLevelLabel}
          </Typography>
        </Box>

        <Box
          className="header-menu-trigger"
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
              borderRadius: 2.5,
              p: 1.5,
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
              "&:hover": {
                backgroundColor: "#7b1fa2",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </div>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        transitionDuration={0}
        hideBackdrop={false}
        PaperProps={{
          sx: {
            width: { xs: "86vw", sm: 320 },
            maxWidth: 360,
            backgroundColor: "white",
            color: "#333",
            zIndex: 1200,
            borderRight: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.16)",
          },
        }}
        ModalProps={{
          sx: {
            zIndex: 1200,
          },
        }}
      >
        <Box
          sx={{
            height: "100vh",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              background:
                "linear-gradient(135deg, #7b1fa2 0%, #8e24aa 55%, #a63cc8 100%)",
              px: 2.5,
              py: 2.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(142, 36, 170, 0.22)",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}
              >
                APR Digital
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Analise Preliminar de Risco
              </Typography>
            </Box>

            <IconButton
              onClick={toggleDrawer(false)}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.18)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ backgroundColor: "white", px: 1.5, pt: 2.25, pb: 2 }}>
            {uniqueMenuItems.map((item, index) => {
              const isActive = location.pathname === item.link;

              return (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.link}
                    onClick={toggleDrawer(false)}
                    sx={{
                      borderRadius: 3,
                      mb: 0.75,
                      px: 1.5,
                      py: 1.15,
                      backgroundColor: isActive
                        ? "rgba(142, 36, 170, 0.10)"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(142, 36, 170, 0.22)"
                        : "1px solid transparent",
                      "&:hover": {
                        backgroundColor: "rgba(142, 36, 170, 0.06)",
                        borderColor: "rgba(142, 36, 170, 0.16)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? "#8e24aa" : "#7c3aed",
                        minWidth: 44,
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isActive
                          ? "rgba(142, 36, 170, 0.14)"
                          : "rgba(124, 58, 237, 0.08)",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.text}
                      secondary={item.subtitle}
                      sx={{ ml: 0.75 }}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActive ? 700 : 600,
                        color: "#1f2937",
                      }}
                      secondaryTypographyProps={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}

            {user.nivel === "administrador" && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleOpenRegister}
                  sx={{
                    borderRadius: 3,
                    mb: 0.75,
                    px: 1.5,
                    py: 1.15,
                    backgroundColor: "transparent",
                    border: "1px solid transparent",
                    "&:hover": {
                      backgroundColor: "rgba(142, 36, 170, 0.06)",
                      borderColor: "rgba(142, 36, 170, 0.16)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "#7c3aed",
                      minWidth: 44,
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(124, 58, 237, 0.08)",
                    }}
                  >
                    <PersonAddAlt1RoundedIcon />
                  </ListItemIcon>

                  <ListItemText
                    primary="Adicionar usuario"
                    secondary="Cadastre um novo acesso"
                    sx={{ ml: 0.75 }}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          <Box
            sx={{
              mt: "auto",
              backgroundColor: "white",
              px: 2,
              pb: 2,
              pt: 1.5,
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                px: 1,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 700,
              }}
            >
              Conta
            </Typography>

            <Box
              sx={{
                mt: 1,
                borderRadius: 3,
                border: "1px solid rgba(142, 36, 170, 0.14)",
                background:
                  "linear-gradient(180deg, rgba(250, 245, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%)",
                px: 1.25,
                py: 1.1,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: "#8e24aa",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                }}
              >
                {userInitials}
              </Avatar>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#1f2937",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.nome || "Meu perfil"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userLevelLabel}
                </Typography>
              </Box>
            </Box>

            <ListItem disablePadding sx={{ mt: 1 }}>
              <ListItemButton
                onClick={handleChangePassword}
                sx={{
                  borderRadius: 3,
                  px: 1.25,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "rgba(142, 36, 170, 0.06)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#8e24aa",
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(124, 58, 237, 0.08)",
                  }}
                >
                  <LockResetRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Trocar senha"
                  secondary="Atualize seu acesso"
                  sx={{ ml: 0.75 }}
                  primaryTypographyProps={{ fontSize: "0.88rem", fontWeight: 600 }}
                  secondaryTypographyProps={{ fontSize: "0.74rem", color: "#6b7280" }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mt: 0.5 }}>
              <ListItemButton
                onClick={handleSignOut}
                sx={{
                  borderRadius: 3,
                  px: 1.25,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "rgba(220, 38, 38, 0.06)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#dc2626",
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                  }}
                >
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Sair"
                  secondary="Encerrar sessao"
                  sx={{ ml: 0.75 }}
                  primaryTypographyProps={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#991b1b",
                  }}
                  secondaryTypographyProps={{ fontSize: "0.74rem", color: "#6b7280" }}
                />
              </ListItemButton>
            </ListItem>
          </Box>
        </Box>
      </Drawer>

      <MenuMobile
        className="menu-mobile"
        user={user}
        signOut={signOut}
        redefinirPassword={redefinirPassword}
      />

      <RegisterMember
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </>
  );
}
