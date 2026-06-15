import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { FiUsers, FiLock } from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import "./profileAdm.scss";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Stack from "@mui/material/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import RegisterMember from "../../components/RegisterMember";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const listRef = firebase.firestore().collection("users");

const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function ProfileADM() {
  const {
    user,
    logSistem,
    updateAllUsersPasswordExpiry,
    forceAllUsersChangePassword,
  } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loadingUpdatePassword, setLoadingUpdatePassword] = useState(false);
  const [loadingForceChange, setLoadingForceChange] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const permissionMaster = [
    "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
    "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
    "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
  ];

  const hasMasterPermission = permissionMaster.includes(user.uid);
  const isDisabled = user.uid !== "wQzKfmkPgsV8PULa9t5JLg9Ta6j2";

  const activeUsersCount = useMemo(
    () => users.filter((item) => item.status === true).length,
    [users]
  );
  const inactiveUsersCount = useMemo(
    () => users.filter((item) => item.status === false).length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.status === (statusFilter === "active")
      );
    }

    if (search) {
      const normalizedSearch = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nome.toLowerCase().includes(normalizedSearch) ||
          item.email.toLowerCase().includes(normalizedSearch)
      );
    }

    return filtered;
  }, [users, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  async function handleUpdateAllPasswordExpiry() {
    if (
      window.confirm(
        "Tem certeza que deseja aplicar expiracao de 30 dias a TODOS os usuarios?"
      )
    ) {
      setLoadingUpdatePassword(true);
      await updateAllUsersPasswordExpiry();
      setLoadingUpdatePassword(false);
    }
  }

  async function handleForceAllUsersChangePassword() {
    if (
      window.confirm(
        "ATENCAO: Todos os usuarios serao obrigados a trocar senha no proximo login. Continuar?"
      )
    ) {
      setLoadingForceChange(true);
      await forceAllUsersChangePassword();
      setLoadingForceChange(false);
    }
  }

  const handleChangeChecklist = async (event, id) => {
    const {
      target: { value },
    } = event;

    await listRef
      .doc(id)
      .update({ checklist: value })
      .then(() => {
        loadUsers();
      })
      .catch((err) => console.log(err));
  };

  const loadUsers = useCallback(async () => {
    let query = listRef.orderBy("nome", "asc");

    if (user.area === "cabos") {
      query = query.where("area", "==", user.area);
    }

    await query
      .get()
      .then((snapshot) => {
        const usuarios = [];

        snapshot.forEach((doc) => {
          usuarios.push({
            id_user: doc.id,
            nome: doc.data().nome,
            nivel: doc.data().nivel,
            status: doc.data().status,
            area: doc.data().area,
            email: doc.data().email,
            regional: doc.data().regional,
            checklist: doc.data().checklist,
          });
        });

        setUsers(usuarios);
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }, [user.area]);

  async function loadChecklists() {
    await firebase
      .firestore()
      .collection("question")
      .get()
      .then((snapshot) => {
        const checklist = [];

        snapshot.forEach((doc) => {
          checklist.push(doc.id);
        });

        setChecklists(checklist);
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }

  useEffect(() => {
    loadUsers();
    loadChecklists();
    addBodyClass("page-profile-adm");
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function updateNivel(id_user, nivel, nome) {
    await firebase
      .firestore()
      .collection("users")
      .doc(id_user)
      .update({
        nivel: nivel,
      })
      .then(() => {
        toast.info("Usuario foi alterado.");
        logSistem(
          `O NIVEL DO USUARIO ${nome} FOI ALTERADO PARA ${nivel.toUpperCase()}`,
          id_user
        );
        loadUsers();
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }

  async function updateStatus(id_user, status, nome) {
    await firebase
      .firestore()
      .collection("users")
      .doc(id_user)
      .update({
        status: status,
        ultimo_login: new Date(),
      })
      .then(() => {
        toast.info("Usuario foi alterado.");
        logSistem(
          `O STATUS DO USUARIO ${nome} FOI ALTERADO PARA ${status === true ? "ATIVO" : "INATIVO"}`,
          id_user
        );
        loadUsers();
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }

  async function updateRegional(id_user, regional, nome) {
    await firebase
      .firestore()
      .collection("users")
      .doc(id_user)
      .update({
        regional: regional,
      })
      .then(() => {
        toast.info("Usuario foi alterado.");
        logSistem(
          `A REGIONAL DO USUARIO ${nome} FOI ALTERADA PARA ${regional}`,
          id_user
        );
        loadUsers();
      })
      .catch((err) => {
        console.log("Deu algum erro: ", err);
      });
  }

  function trocaSenha(id) {
    const requestOptions = {
      method: "POST",
      redirect: "follow",
    };

    fetch(
      `https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/alterarSenhaUsuario?userId=${id}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        logSistem("SENHA-USUARIO-TROCADA", id);
        alert(result);
        return result;
      })
      .catch((error) => console.error(error));
  }

  return (
    <div>
      <Header name="ADM Usuarios">
        <FiUsers size={25} />
      </Header>

      <div className="content">
        <div className="container users-topbar">
          <div className="users-topbar-summary">
            <div className="users-stat-pill users-stat-pill--active">
              <div className="users-stat-icon">
                <Groups2RoundedIcon />
              </div>
              <div>
                <span className="users-stat-label">Ativos</span>
                <strong>{activeUsersCount}</strong>
              </div>
            </div>

            <div className="users-stat-pill users-stat-pill--inactive">
              <div className="users-stat-icon">
                <PersonOffRoundedIcon />
              </div>
              <div>
                <span className="users-stat-label">Inativos</span>
                <strong>{inactiveUsersCount}</strong>
              </div>
            </div>
          </div>

          <div className="users-topbar-actions">
            <div className="users-action-inline users-action-inline--orange">
              <div className="users-action-badge">
                <KeyRoundedIcon fontSize="small" />
                <span>Expiracao</span>
              </div>
              <p>Aplica contagem de 30 dias para todos os usuarios.</p>
              <Button
                variant="contained"
                onClick={handleUpdateAllPasswordExpiry}
                disabled={loadingUpdatePassword}
                className="users-action-button users-action-button--orange"
              >
                {loadingUpdatePassword ? "Processando..." : "Aplicar aos 30 dias"}
              </Button>
            </div>

            <div className="users-action-inline users-action-inline--red">
              <div className="users-action-badge">
                <WarningAmberRoundedIcon fontSize="small" />
                <span>Troca forcada</span>
              </div>
              <p>Obriga todos os usuarios a trocar senha no proximo login.</p>
              <Button
                variant="contained"
                onClick={handleForceAllUsersChangePassword}
                disabled={loadingForceChange}
                className="users-action-button users-action-button--red"
              >
                {loadingForceChange ? "Processando..." : "Forcar mudanca"}
              </Button>
            </div>
          </div>
        </div>

        <div className="container filtros users-toolbar">
          <div className="users-toolbar-header">
            <Box>
              <Typography variant="h6" className="users-toolbar-title">
                Controle de usuarios
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<PersonAddAlt1RoundedIcon />}
              className="users-register-button"
              onClick={() => setRegisterModalOpen(true)}
            >
              Adicionar usuario
            </Button>

            <Chip
              label={`${filteredUsers.length} resultado(s)`}
              variant="outlined"
              color="secondary"
            />
          </div>

          <div className="users-toolbar-controls">
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>

            <TextField
              id="search"
              label="Buscar usuario ou email"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="users-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel id="rows-per-page-label">Registros por pagina</InputLabel>
              <Select
                labelId="rows-per-page-label"
                id="rows-per-page"
                value={rowsPerPage}
                label="Registros por pagina"
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="container table-usuarios">
          <TableContainer component={Paper} className="table-users">
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  {hasMasterPermission && (
                    <TableCell align="center">Trocar Senha</TableCell>
                  )}
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Email</TableCell>
                  <TableCell align="center">Area</TableCell>
                  {hasMasterPermission && (
                    <TableCell align="center">Checklists</TableCell>
                  )}
                  <TableCell align="center">Nivel de Usuario</TableCell>
                  <TableCell align="center">Regional</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((item, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell data-label="Usuario">{item.nome}</TableCell>
                      {hasMasterPermission && (
                        <TableCell align="center">
                          <Chip
                            label={<FiLock size={15} />}
                            color="secondary"
                            size="small"
                            onClick={() => trocaSenha(item.id_user)}
                          />
                        </TableCell>
                      )}
                      <TableCell data-label="Status" sx={{ textAlign: "center" }}>
                        <Switch
                          checked={item.status}
                          onChange={() =>
                            updateStatus(item.id_user, !item.status, item.nome)
                          }
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#0deb0d",
                              "&:hover": {
                                backgroundColor: "rgba(18, 18, 18, 0.08)",
                              },
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#0deb0d",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell data-label="Email">{item.email}</TableCell>
                      <TableCell data-label="Area" sx={{ textAlign: "center" }}>
                        {item.area === "patrimonial" ? "empresarial" : item.area}
                      </TableCell>
                      {hasMasterPermission && (
                        <TableCell data-label="Checklists">
                          <FormControl sx={{ minWidth: 120 }} fullWidth size="small">
                            <InputLabel id="checklists-label">Checklists</InputLabel>
                            <Select
                              labelId="checklists-label"
                              id="checklists"
                              multiple={true}
                              value={item.checklist ? item.checklist : []}
                              onChange={(e) => handleChangeChecklist(e, item.id_user)}
                              input={<OutlinedInput label="Checklists" />}
                              renderValue={(selected) => selected.join(", ")}
                              MenuProps={MenuProps}
                            >
                              {checklists.map((name) => (
                                <MenuItem key={name} value={name} sx={{ height: "30px" }}>
                                  <Checkbox
                                    checked={
                                      item.checklist && item.checklist.includes(name)
                                    }
                                  />
                                  <ListItemText primary={name} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      )}
                      <TableCell>
                        <FormControl sx={{ minWidth: 120 }} fullWidth size="small">
                          <InputLabel id="nivel-usuario-label">
                            Nivel de Usuario
                          </InputLabel>
                          <Select
                            labelId="nivel-usuario-label"
                            id={`nivel-usuario-${index}`}
                            label="Nivel de Usuario"
                            value={item.nivel || ""}
                            onChange={(e) =>
                              updateNivel(item.id_user, e.target.value, item.nome)
                            }
                            MenuProps={MenuProps}
                          >
                            <MenuItem disabled={isDisabled} value={"administrador"}>
                              Administrador
                            </MenuItem>
                            <MenuItem value={"usuario_gcn"}>Usuario GCM</MenuItem>
                            <MenuItem value={"aplicador"}>Aplicador</MenuItem>
                            <MenuItem value={"supervisor"}>Supervisor</MenuItem>
                            <MenuItem value={"revisor"}>Revisor</MenuItem>
                            <MenuItem value={"revisor_logistica"}>
                              Revisor Logistica
                            </MenuItem>
                            <MenuItem value={"ponto_focal"}>Ponto Focal</MenuItem>
                            <MenuItem value={"auditor"}>Auditor</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl sx={{ minWidth: 120 }} fullWidth size="small">
                          <InputLabel id="regional-label">Regional</InputLabel>
                          <Select
                            labelId="regional-label"
                            id={`regional-${index}`}
                            label="Regional"
                            value={item.regional !== undefined ? item.regional : ""}
                            onChange={(e) =>
                              updateRegional(item.id_user, e.target.value, item.nome)
                            }
                          >
                            <MenuItem value={"SP"}>SP</MenuItem>
                            <MenuItem value={"SUL"}>SUL</MenuItem>
                            <MenuItem value={"NE"}>NE</MenuItem>
                            <MenuItem value={"CO_N"}>CO_N</MenuItem>
                            <MenuItem value={"RJ_ES_MG"}>RJ_ES_MG</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Stack spacing={2} className="pagination">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            renderItem={(item) => (
              <PaginationItem
                slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                {...item}
              />
            )}
          />
        </Stack>

        <RegisterMember
          open={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
        />
      </div>
    </div>
  );
}
