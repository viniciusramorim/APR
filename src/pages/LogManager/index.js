import React, { useState, useEffect } from "react";
import firebase from "../../services/firebaseConnection";
import {
  TextField,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  Autocomplete,
  TableSortLabel,
} from "@mui/material";
import * as XLSX from "xlsx";
import "./log.scss";
import Header from "../../components/Header";
import { FiMessageSquare } from "react-icons/fi";

export default function LogManagement() {
  const [searchUser, setSearchUser] = useState("");
  const [logs, setLogs] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: "", event: "", chamado: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [userOptions, setUserOptions] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("data");
  const itemsPerPage = 10;

  useEffect(() => {
    if (searchUser.trim()) {
      const fetchUsers = async () => {
        const userSnapshot = await firebase
          .firestore()
          .collection("users")
          .where("nome", ">=", searchUser.toUpperCase())
          .where("nome", "<=", searchUser + "\uf8ff")
          .get();
        let users = [];
        userSnapshot.forEach((doc) => {
          users.push(doc.data().nome);
        });
        setUserOptions(users);
      };
      fetchUsers();
    } else {
      setUserOptions([]);
    }
  }, [searchUser]);

  const handleSearch = async () => {
    setLoading(true);
    setLogs([]);
    setUserDetails(null);
    try {
      if (filters.date && !searchUser.trim()) {
        const startDate = new Date(filters.date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const logSnapshot = await firebase
          .firestore()
          .collection("log")
          .where("data", ">=", startDate)
          .where("data", "<", endDate)
          .get();

        let logsList = [];
        logSnapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() });
        });

        logsList.sort((a, b) => b.data.toDate() - a.data.toDate());
        setLogs(logsList);
        setLoading(false);
        return;
      }

      if (searchUser.trim()) {
        const userSnapshot = await firebase
          .firestore()
          .collection("users")
          .where("nome", "==", searchUser.toUpperCase())
          .get();
        if (userSnapshot.empty) {
          alert("Usuário não encontrado.");
          setLoading(false);
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        setUserDetails({ ...userData, nome: userData.nome.toUpperCase() });

        const logSnapshot = await firebase
          .firestore()
          .collection("log")
          .where("user", "==", searchUser)
          .get();

        let logsList = [];
        logSnapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() });
        });

        logsList.sort((a, b) => b.data.toDate() - a.data.toDate());
        setLogs(logsList);
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedLogs = logs.slice().sort((a, b) => {
    const valueA = orderBy === "data" ? a[orderBy].toDate() : a[orderBy];
    const valueB = orderBy === "data" ? b[orderBy].toDate() : b[orderBy];
    return (valueA < valueB ? -1 : 1) * (order === "asc" ? 1 : -1);
  });

  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = () => {
    if (sortedLogs.length === 0) {
      alert("Nenhum log disponível para download.");
      return;
    }

    const formattedLogs = sortedLogs.map((log) => ({
      Evento: log.event,
      Usuário: log.user || userDetails?.nome || "",
      Email: userDetails?.email || "",
      Destinatario: log.destinatario || "",
      Região: userDetails?.regional || "",
      Nível: userDetails?.nivel || "",
      Chamado: log.chamado || "",
      IP: log.ip || "",
      Rota: log.rota || "N/A",
      Data: log.data.toDate().toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedLogs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    XLSX.writeFile(workbook, `logs_${searchUser || filters.date}.xlsx`);
  };

  const loadAllLogs = async () => {
    const logSnapshot = await firebase.firestore().collection("log").get();
    let logsList = [];
    logSnapshot.forEach((doc) => {
      logsList.push({ id: doc.id, ...doc.data() });
    });

    logsList.sort((a, b) => b.data.toDate() - a.data.toDate());
    setLogs(logsList);
  }

  return (
    <div className="apr-digital">
      <Header name="Gerenciamento de Logs">
        <FiMessageSquare size={25} onClick={() => loadAllLogs()} />
      </Header>
      <div className="content">
        <div style={{ marginBottom: "20px" }} className="info-user">
          <Autocomplete
            freeSolo
            size="small"
            options={userOptions}
            inputValue={searchUser}
            onInputChange={(event, newInputValue) =>
              setSearchUser(newInputValue.toUpperCase())
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar por nome de usuário"
                variant="outlined"
                style={{ marginRight: "10px", width: "300px" }}
              />
            )}
          />
          <TextField
            label="Buscar por Data"
            type="date"
            name="date"
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            style={{ marginRight: "10px" }}
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Buscar"}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDownload}
            style={{ marginLeft: "10px" }}
          >
            Download Logs
          </Button>
        </div>
        {userDetails && searchUser && (
          <div style={{ marginBottom: "20px" }} className="details-user">
            <Typography variant="h6">Informações do Usuário:</Typography>
            <Typography>Nome: {userDetails.nome}</Typography>
            <Typography>Email: {userDetails.email}</Typography>
            <Typography>Região: {userDetails.regional}</Typography>
            <Typography>Nível: {userDetails.nivel}</Typography>
            <Typography>
              Status: {userDetails.status ? "Ativo" : "Inativo"}
            </Typography>
          </div>
        )}
        {paginatedLogs.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={orderBy === "user" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "user"}
                      direction={orderBy === "user" ? order : "asc"}
                      onClick={() => handleRequestSort("user")}
                    >
                      Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={orderBy === "event" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "event"}
                      direction={orderBy === "event" ? order : "asc"}
                      onClick={() => handleRequestSort("event")}
                    >
                      Evento
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "ip" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "ip"}
                      direction={orderBy === "ip" ? order : "asc"}
                      onClick={() => handleRequestSort("ip")}
                    >
                      IP
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "rota" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "rota"}
                      direction={orderBy === "rota" ? order : "asc"}
                      onClick={() => handleRequestSort("rota")}
                    >
                      Rota
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "destinatario" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "destinatario"}
                      direction={orderBy === "destinatario" ? order : "asc"}
                      onClick={() => handleRequestSort("destinatario")}
                    >
                      Destinatario
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "data" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "data"}
                      direction={orderBy === "data" ? order : "asc"}
                      onClick={() => handleRequestSort("data")}
                    >
                      Data
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.user || "N/A"}</TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>{log.ip || "N/A"}</TableCell>
                    <TableCell className="row-rota">{log.rota || "N/A"}</TableCell>
                    <TableCell>{log.destinatario || "-"}</TableCell>
                    <TableCell>{log.data.toDate().toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !loading && (
            <p>Nenhum log encontrado para o usuário ou data selecionada.</p>
          )
        )}
        <Pagination
          count={Math.ceil(sortedLogs.length / itemsPerPage)}
          page={currentPage}
          onChange={(e, page) => setCurrentPage(page)}
          style={{ marginTop: "20px" }}
        />
      </div>
    </div>
  );
}
