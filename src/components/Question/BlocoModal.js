import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";

const BlocoModal = ({ open, onClose, onSave, bloco }) => {
  const [title, setTitle] = useState(bloco ? bloco.title : "");

  useEffect(() => {
    if (bloco) {
      setTitle(bloco.title);
    }
  }, [bloco]);

  const handleSave = () => {
    onSave({ title });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...modalStyle }}>
        <h2>{bloco ? "Editar Bloco" : "Adicionar Bloco"}</h2>
        <TextField
          label="Título do Bloco"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button onClick={handleSave} variant="contained" color="primary">
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default BlocoModal;