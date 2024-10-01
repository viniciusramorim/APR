import React, { useState } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ChecklistModal = ({ open, onClose, onSave, checklist }) => {
  // Define o estado inicial do título com base no checklist passado ou vazio
  const [title, setTitle] = useState(checklist ? checklist.title : "");

  const handleSave = () => {
    if (!title.trim()) {
      console.error("O título do checklist não pode estar vazio.");
      return;
    }

    // Define o ID como sendo igual ao título, removendo espaços e colocando em minúsculo
    const id = title.trim().toLowerCase().replace(/\s+/g, "-");

    // Log para verificar os dados que estão sendo passados para a função de salvamento
    console.log("Salvando Checklist:", { id, title: title.trim() });

    // Passa o ID e o título para a função de salvamento
    onSave({ id, title: title.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <TextField
          label="Título do Checklist"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ mt: 2 }}
          fullWidth
        >
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

export default ChecklistModal;
