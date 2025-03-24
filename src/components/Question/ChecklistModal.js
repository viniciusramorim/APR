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
  const [title, setTitle] = useState(checklist ? checklist.title : "");

  const handleSave = () => {
    if (!title.trim()) {
      console.error("O título do checklist não pode estar vazio.");
      return;
    }
    const id = title.trim().replace(/\s+/g, "-");
    console.log("Salvando Checklist:", { id, title: title.trim() });
    onSave({ id, title: title.trim() });
    onClose();
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s]/g, "");
    setTitle(sanitizedValue);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <TextField
          label="Título do Checklist"
          value={title}
          onChange={handleTitleChange}
          fullWidth
          margin="normal"
        />
        <i style={{ fontSize: "12px", color: "#d32f2f" }}>
          *Caracteres especiais não são aceitos*
        </i>
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
