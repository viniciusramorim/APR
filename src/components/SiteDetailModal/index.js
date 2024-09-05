import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, TextField, Grid } from "@mui/material";
import firebase from "../../services/firebaseConnection";
import "../SiteDetailModal/SiteDetailModal.css";
import { useHistory } from "react-router-dom";

const SiteDetailModal = ({ open, onClose, site, getPerimetro }) => {
  const [editSite, setEditSite] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (site) {
      setEditSite({ ...site });
    }
  }, [site]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditSite((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (editSite) {
      try {
        await firebase.firestore().collection("sites").doc(editSite.id).update({
          latitude: editSite.latitude,
          longitude: editSite.longitude,
          detentora: editSite.detentora,
          critical: editSite.critical,
        });
        onClose();
      } catch (error) {
        console.error("Erro ao atualizar site:", error);
      }
    }
  };

  const handleAdvance = () => {
    if (editSite) {
      const { id } = editSite;
      // Navigate to the APR page
      history.push(`/new/${id}`);
    }
  };

  if (!editSite) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-sites"
      aria-describedby="modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 800,
          height: "90%",
          bgcolor: "background.paper",
          border: "2px solid #000",
          boxShadow: 24,
          p: 4,
          overflow: "auto",
        }}
      >
        <Typography id="modal-title" variant="h6" component="h2" sx={{ pb: 2 }}>
          Detalhes do Site - {editSite.sigla} - {editSite.nome}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>ID:</strong> {editSite.id}
            </Typography>
          </Grid>
          {/* ... outros campos ... */}
          <Grid item xs={12}>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Salvar Alteração
            </Button>
            <Button onClick={onClose} variant="outlined" sx={{ mt: 2, ml: 2 }}>
              Fechar
            </Button>
            <Button onClick={handleAdvance} variant="outlined" sx={{ mt: 2, ml: 2 }}>
              Avançar
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default SiteDetailModal;
