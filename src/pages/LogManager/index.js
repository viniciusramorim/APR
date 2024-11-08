import React, { useState } from 'react';
import firebase from '../../services/firebaseConnection';
import { TextField, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, MenuItem, Select, FormControl, InputLabel, Pagination } from '@mui/material';
import * as XLSX from 'xlsx';

export default function LogManagement() {
    const [searchUser, setSearchUser] = useState('');
    const [logs, setLogs] = useState([]);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ date: '', event: '', chamado: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleSearch = async () => {
        if (!searchUser.trim()) {
            alert('Por favor, insira o nome de um usuário para buscar.');
            return;
        }

        setLoading(true);
        setLogs([]);
        setUserDetails(null);
        try {
            const userSnapshot = await firebase.firestore().collection('users').where('nome', '==', searchUser).get();
            if (userSnapshot.empty) {
                alert('Usuário não encontrado.');
                setLoading(false);
                return;
            }

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            setUserDetails(userData);

            const logSnapshot = await firebase.firestore().collection('log').where('user', '==', searchUser).get();
            let logsList = [];
            logSnapshot.forEach((doc) => {
                logsList.push({ id: doc.id, ...doc.data() });
            });
            
            logsList.sort((a, b) => a.data.toDate() - b.data.toDate());

            setLogs(logsList);
        } catch (error) {
            console.error('Erro ao buscar logs:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (logs.length === 0) {
            alert('Nenhum log disponível para download.');
            return;
        }

        const formattedLogs = logs.map(log => ({
            Evento: log.event,
            Usuário: userDetails?.nome || '',
            Email: userDetails?.email || '',
            Região: userDetails?.regional || '',
            Nível: userDetails?.nivel || '',
            Chamado: log.chamado || '',
            IP: log.ip || '',
            Data: log.data.toDate().toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedLogs);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');

        XLSX.writeFile(workbook, `logs_${searchUser}.xlsx`);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredLogs = logs.filter(log => {
        const matchesDate = filters.date ? log.data.toDate().toISOString().startsWith(filters.date) : true;
        const matchesEvent = filters.event ? log.event.includes(filters.event) : true;
        const matchesChamado = filters.chamado ? log.chamado && log.chamado.includes(filters.chamado) : true;
        return matchesDate && matchesEvent && matchesChamado;
    });

    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div style={{ padding: "20px" }}>
        <h2>Gerenciamento de Logs</h2>
        <div style={{ marginBottom: "20px" }}>
          <TextField
            label="Buscar por nome de usuário"
            variant="outlined"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            style={{ marginRight: "10px", width: "300px" }}
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
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <TextField
            label="Filtrar por data"
            type="date"
            name="date"
            InputLabelProps={{ shrink: true }}
            onChange={handleFilterChange}
            style={{ width: "200px" }}
          />
          <TextField
            label="Filtrar por evento"
            name="event"
            onChange={handleFilterChange}
            style={{ width: "200px" }}
          />
          <TextField
            label="Filtrar por chamado"
            name="chamado"
            onChange={handleFilterChange}
            style={{ width: "200px" }}
          />
        </div>
        {userDetails && (
          <div style={{ marginBottom: "20px" }}>
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
                    <TableCell>{log.data.toDate().toLocaleString()}</TableCell>
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
    );
}
