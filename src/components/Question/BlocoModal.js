import React, { useState } from "react";
import { Modal, Box, Typography, Button, TextField } from "@mui/material";

const BlocoModal = ({ open, onClose, onSave, bloco }) => {
  const [blocoTitle, setBlocoTitle] = useState(bloco?.title || "");

  const handleSave = () => {
    const newBloco = {
      title: blocoTitle,
      id: bloco?.id || new Date().getTime(),
    };
    onSave(newBloco);
    onClose();
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^a-zA-Z0-9 ]/g, "");
    setBlocoTitle(sanitizedValue);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          width: 400,
        }}
      >
        <Typography variant="h6" component="h2">
          {bloco ? "Editar Bloco" : "Novo Bloco"}
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Título do Bloco"
          value={blocoTitle}
          onChange={handleTitleChange}
        />
        <i style={{ fontSize: "12px", color: "#d32f2f" }}>
          *Caracteres especiais não são aceitos*
        </i>
        <Button
          variant="contained"
          color="primary"
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

export default BlocoModal;
