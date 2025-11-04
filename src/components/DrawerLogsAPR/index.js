import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import firebase from "../../services/firebaseConnection";
import "./DrawerLogsAPR.scss";

export default function DrawerLogsAPR({ open, onClose, aprUid, aprId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aprData, setAprData] = useState(null);

  useEffect(() => {
    if (open && aprUid) {
      loadLogs();
    }
  }, [open, aprUid]);

  async function loadLogs() {
    setLoading(true);
    try {
      const aprDoc = await firebase
        .firestore()
        .collection("aprs-producao")
        .doc(aprUid)
        .get();

      if (aprDoc.exists) {
        setAprData(aprDoc.data());
      }

      let logsSnapshot = await firebase
        .firestore()
        .collection("log")
        .where("chamado", "==", aprId)
        .get();

      let logsData = [];
      
      if (!logsSnapshot.empty) {
        logsSnapshot.forEach((doc) => {
          logsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }

      if (logsData.length === 0) {
        const allLogsSnapshot = await firebase
          .firestore()
          .collection("log")
          .get();

        allLogsSnapshot.forEach((doc) => {
          const logData = doc.data();
          if (logData.rota && logData.rota.includes(aprUid)) {
            logsData.push({
              id: doc.id,
              ...logData
            });
          }
        });
      }

      logsData.sort((a, b) => {
        const dateA = a.data?.toDate ? a.data.toDate() : new Date(a.data);
        const dateB = b.data?.toDate ? b.data.toDate() : new Date(b.data);
        return dateB - dateA;
      });

      console.log("Logs encontrados:", logsData);
      console.log("APR UID:", aprUid);
      console.log("APR ID:", aprId);
      console.log("Dados da APR:", aprDoc.data());
      
      setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      try {
        const simpleSnapshot = await firebase
          .firestore()
          .collection("log")
          .limit(1000)
          .get();

        const filteredLogs = [];
        simpleSnapshot.forEach((doc) => {
          const logData = doc.data();
          if (
            (logData.rota && logData.rota.includes(aprUid)) ||
            (logData.chamado && logData.chamado === aprId) ||
            (logData.event && (logData.event.includes(aprUid) || logData.event.includes(aprId)))
          ) {
            filteredLogs.push({
              id: doc.id,
              ...logData
            });
          }
        });

        filteredLogs.sort((a, b) => {
          const dateA = a.data?.toDate ? a.data.toDate() : new Date(a.data);
          const dateB = b.data?.toDate ? b.data.toDate() : new Date(b.data);
          return dateB - dateA;
        });

        setLogs(filteredLogs);
      } catch (err) {
        console.error("Erro na busca alternativa:", err);
      }
    }
    setLoading(false);
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível";
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (event) => {
    const eventLower = event?.toLowerCase() || "";
    
    if (eventLower.includes("criação") || eventLower.includes("criado") || eventLower.includes("criar")) {
      return "success";
    }
    if (eventLower.includes("edição") || eventLower.includes("editado") || eventLower.includes("editar") || eventLower.includes("alterado")) {
      return "warning";
    }
    if (eventLower.includes("status") || eventLower.includes("envio") || eventLower.includes("enviado")) {
      return "info";
    }
    if (eventLower.includes("plano") || eventLower.includes("ação") || eventLower.includes("pa")) {
      return "primary";
    }
    if (eventLower.includes("exclusão") || eventLower.includes("deletado") || eventLower.includes("excluir")) {
      return "error";
    }
    if (eventLower.includes("justificativa")) {
      return "secondary";
    }
    if (eventLower.includes("login") || eventLower.includes("acesso")) {
      return "default";
    }
    
    return "default";
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: "500px", md: "600px" } }
      }}
    >
      <Box sx={{ p: 3 }}>
        <div className="drawer-logs-apr-header">
          <Typography variant="h5" component="h2" fontWeight="bold">
            Histórico de Logs
          </Typography>
          <IconButton onClick={onClose} sx={{ color: "#666" }}>
            <CloseIcon />
          </IconButton>
        </div>

        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
          APR: {aprId}
        </Typography>

        {aprData && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Site:</strong> {aprData.site_id?.Nome || aprData.nome || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {aprData.status || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Criado por:</strong> {aprData.userName || aprData.created_by_name || "N/A"}
            </Typography>
            {aprData.created && (
              <Typography variant="body2">
                <strong>Criado em:</strong> {formatDate(aprData.created)}
              </Typography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <CircularProgress />
          </div>
        ) : logs.length > 0 ? (
          <List>
            {logs.map((log, index) => (
              <ListItem
                key={log.id || index}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  mb: 2,
                  p: 2,
                  bgcolor: "#f9f9f9"
                }}
              >
                <div style={{ width: "100%", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <Chip
                    label={log.event || "Evento"}
                    color={getActionColor(log.event)}
                    size="small"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(log.data)}
                  </Typography>
                </div>

                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="bold">
                      {log.user || "Usuário não identificado"}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                        <strong>Evento:</strong> {log.event || "Sem descrição"}
                      </Typography>
                      {log.rota && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block", wordBreak: "break-all" }}>
                          <strong>Rota:</strong> {log.rota}
                        </Typography>
                      )}
                      {log.ip && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                          <strong>IP:</strong> {log.ip}
                        </Typography>
                      )}
                      {log.destinatario && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                          <strong>Destinatário:</strong> {log.destinatario}
                        </Typography>
                      )}
                      {log.chamado && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                          <strong>Chamado:</strong> {log.chamado}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            Nenhum log registrado para esta APR.
          </Alert>
        )}
      </Box>
    </Drawer>
  );
}