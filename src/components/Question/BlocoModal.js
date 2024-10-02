import React, { useState } from "react";
import { Modal, Box, Typography, Button, TextField } from "@mui/material";

const BlocoModal = ({ open, onClose, onSave, bloco }) => {
  const [blocoTitle, setBlocoTitle] = useState(bloco?.title || "");

  const handleSave = () => {
    const newBloco = { title: blocoTitle, id: bloco?.id || new Date().getTime() };
    onSave(newBloco);
    onClose();
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
          onChange={(e) => setBlocoTitle(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 2 }}
        >
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

export default BlocoModal;
