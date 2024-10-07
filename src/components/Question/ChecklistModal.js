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
    window.location.reload();
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
