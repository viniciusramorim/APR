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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Autocomplete,
} from "@mui/material";
import * as XLSX from "xlsx";
import "./log.scss";
import Header from "../../components/Header";
import Title from "../../components/Title";
import { FiMessageSquare } from "react-icons/fi";

export default function LogManagement() {
  const [searchUser, setSearchUser] = useState("");
  const [logs, setLogs] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: "", event: "", chamado: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [userOptions, setUserOptions] = useState([]);
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
    if (!searchUser.trim()) {
      alert("Por favor, insira o nome de um usuário para buscar.");
      return;
    }

    setLoading(true);
    setLogs([]);
    setUserDetails(null);
    try {
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

      // Ordenar logs de forma decrescente (mais recentes primeiro)
      logsList.sort((a, b) => b.data.toDate() - a.data.toDate());

      setLogs(logsList);
    } catch (error) {
      console.error("Erro ao buscar logs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (logs.length === 0) {
      alert("Nenhum log disponível para download.");
      return;
    }

    const formattedLogs = logs.map((log) => ({
      Evento: log.event,
      Usuário: userDetails?.nome || "",
      Email: userDetails?.email || "",
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

    XLSX.writeFile(workbook, `logs_${searchUser}.xlsx`);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesDate = filters.date
      ? log.data.toDate().toISOString().startsWith(filters.date)
      : true;
    const matchesEvent = filters.event
      ? log.event.includes(filters.event.toUpperCase())
      : true;
    const matchesChamado = filters.chamado
      ? log.chamado && log.chamado.includes(filters.chamado.toUpperCase())
      : true;
    return matchesDate && matchesEvent && matchesChamado;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="apr-digital">
      <Header />
      <div className="content">
        <Title name="APRs">
          <FiMessageSquare size={25} onClick={() => console.log("")} />
        </Title>
          <div style={{ marginBottom: "20px" }} className="info-user">
            <Autocomplete
              freeSolo
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
          {userDetails && (
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
                    <TableCell>
                      <strong>Evento</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Chamado</strong>
                    </TableCell>
                    <TableCell>
                      <strong>IP</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rota</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Data</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{log.event}</TableCell>
                      <TableCell>{log.chamado || "N/A"}</TableCell>
                      <TableCell>{log.ip || "N/A"}</TableCell>
                      <TableCell>{log.rota || "N/A"}</TableCell>
                      <TableCell>
                        {log.data.toDate().toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            !loading && <p>Nenhum log encontrado para o usuário selecionado.</p>
          )}
          <Pagination
            count={Math.ceil(filteredLogs.length / itemsPerPage)}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            style={{ marginTop: "20px" }}
          />
        </div>
    </div>
  );
}
