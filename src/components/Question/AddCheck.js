import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";
import '../../components/Question/styles/addCheck.css';

const AddChecklist = () => {
  const [checklists, setChecklists] = useState([]);
  const [newChecklist, setNewChecklist] = useState("");
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false); // Estado para controlar o modal

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const checklistsRef = firebase.firestore().collection("question");
        const snapshot = await checklistsRef.get();
        const data = snapshot.docs.map((doc) => doc.id);
        setChecklists(data);
      } catch (error) {
        console.error("Error fetching checklists:", error);
        setError("Erro ao carregar checklists. Por favor, tente novamente.");
      }
    };

    fetchChecklists();
  }, []);

  const handleNewChecklist = useCallback(async () => {
    if (newChecklist && !checklists.includes(newChecklist)) {
      try {
        await firebase
          .firestore()
          .collection("question")
          .doc(newChecklist)
          .set({});
        setChecklists((prevChecklists) => [...prevChecklists, newChecklist]);
        setNewChecklist("");
        setError(null);
        setOpen(false); // Fecha o modal após adicionar o checklist

        // Realiza um refresh na página após a adição
        window.location.reload();
      } catch (error) {
        console.error("Error adding new checklist:", error);
        setError(
          "Erro ao adicionar novo checklist. Por favor, tente novamente."
        );
      }
    }
  }, [newChecklist, checklists]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <div className="grid-checklist">
      <Button variant="contained" onClick={handleOpen}>
        Adicionar Novo Checklist
      </Button>
      <Typography variant="h6" gutterBottom></Typography>

      {/* Modal para adicionar checklist */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Adicionar Novo Checklist</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome do Novo Checklist"
            value={newChecklist}
            onChange={(e) => setNewChecklist(e.target.value)}
            fullWidth
            margin="normal"
          />
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleNewChecklist}
            variant="contained"
            color="primary"
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
      </div>
    </Box>
  );
};

export default AddChecklist;
