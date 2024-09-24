import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";

const AddBlock = ({ open, onClose, selectedChecklist }) => {
  const [blocks, setBlocks] = useState([]);
  const [newBlock, setNewBlock] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (selectedChecklist) {
        try {
          const checklistRef = firebase
            .firestore()
            .collection("question")
            .doc(selectedChecklist);
          const doc = await checklistRef.get();
          if (doc.exists) {
            setBlocks(Object.keys(doc.data()));
          }
        } catch (error) {
          console.error("Error fetching blocks:", error);
          setError("Erro ao carregar blocos. Por favor, tente novamente.");
        }
      }
    };

    fetchBlocks();
  }, [selectedChecklist]);

  const handleNewBlock = useCallback(async () => {
    if (newBlock && !blocks.includes(newBlock)) {
      try {
        const checklistRef = firebase
          .firestore()
          .collection("question")
          .doc(selectedChecklist);
        await checklistRef.update({
          [newBlock]: [],
        });
        setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
        setNewBlock("");
        setError(null);
        onClose();
      } catch (error) {
        console.error("Error adding new block:", error);
        setError("Erro ao adicionar novo bloco. Por favor, tente novamente.");
      }
    } else {
      setError("Bloco já existente ou nome inválido.");
    }
  }, [newBlock, blocks, selectedChecklist, onClose]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Adicionar Novo Bloco</DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="h6" gutterBottom>
            Adicionar Novo Bloco ao Checklist: {selectedChecklist}
          </Typography>
          <TextField
            label="Nome do Novo Bloco"
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            fullWidth
            margin="normal"
          />
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleNewBlock} variant="contained" color="primary">
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBlock;
