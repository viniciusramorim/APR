import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, Grid } from "@mui/material";
import firebase from "../../services/firebaseConnection";
import "../SiteDetailModal/SiteDetailModal.css";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

const SiteDetailModal = ({ open, onClose, site }) => {
  const [editSite, setEditSite] = useState(null);
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newDetentora, setNewDetentora] = useState("");

  const history = useHistory();

  useEffect(() => {
    if (site) {
      setEditSite({ ...site });
      setNewLat(site.latitude);
      setNewLng(site.longitude);
      setNewDetentora(site.detentora);
    }
  }, [site]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditSite((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (editSite) {
      try {
        const updatedSite = {
          ...editSite,
          latitude: newLat,
          longitude: newLng,
          detentora: newDetentora,
        };

        await firebase.firestore().collection("sites").doc(updatedSite.id).update({
          latitude: updatedSite.latitude,
          longitude: updatedSite.longitude,
          detentora: updatedSite.detentora,
          critical: updatedSite.critical,
        });
        toast.success("Site atualizado com sucesso!");
        onClose();
      } catch (error) {
        console.error("Erro ao atualizar site:", error);
        toast.error("Erro ao atualizar site!");
      }
    }
  };

  const handleAdvance = () => {
    if (editSite) {
      history.push(`/new/${editSite.id}`);
    }
  };

  if (!editSite) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-sites"
      aria-describedby="modal-description"
      style={{borderRadius:"8px"}}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "83%",
          maxWidth: 800,
          height: "83%",
          bgcolor: "background.paper",
          border: "1px solid #000",
          boxShadow: 24,
          p: 4,
          overflow: "auto",
          borderColor: "#6e0dec" , borderRadius:"8px"
        }}
      >
        <Typography id="modal-title" variant="h6" component="h2" sx={{ pb: 2 }}>
          Detalhes do Site - {editSite.sigla} - {editSite.nome}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>ID:</strong>
              <input
                name="id"
                value={editSite.id}
                onChange={handleChange}
                disabled
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px", borderWidth:"1px"}}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>UF:</strong>
              <input
                name="estado"
                value={editSite.estado}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Site:</strong>
              <input
                name="tipoSite"
                value={editSite.tipoSite}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px" , borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px"}}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Contrato:</strong>
              <input
                name="tipoContrato"
                value={editSite.tipo_contrato}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px"}}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Criticidade:</strong>
              <input
                name="critical"
                value={editSite.critical}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Municipio:</strong>
              <input
                name="cidade"
                value={editSite.cidade}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>CEP:</strong>
              <input
                name="cep"
                value={editSite.cep}
                onChange={handleChange}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px",borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>DATA UPDATE:</strong> {editSite.lastUpdate}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>USUARIO UPDATE:</strong> {editSite.userLastUpdate}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>DETENTORA:</strong>
              <input
                value={newDetentora}
                onChange={(e) => setNewDetentora(e.target.value.toUpperCase())}
                style={{width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px", borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LATITUDE:</strong>
              <input
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px", borderWidth:"1px" }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LONGITUDE:</strong>
              <input
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                style={{ width: "fit-content", padding: "8px", borderColor: "#6e0dec" , borderRadius:"8px", borderWidth:"1px" }}
              />
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button
              onClick={handleSave}
              variant="contained"
              style={{backgroundColor: "#6e0dec",borderColor:"#6e0dec",}}
              sx={{ mt: 2 }}
            >
              Salvar Alteração
            </Button>
            <Button
              onClick={handleAdvance}
              variant="outlined"
              style={{color: "#6e0dec",borderColor:"#6e0dec",}}
              sx={{ mt: 2, ml: 2 }}
            >
              Avançar
            </Button>
            <Button onClick={onClose} variant="outlined" sx={{ mt: 2, ml: 2 }} style={{color: "#e84118",borderColor:"#e84118"}}>
              Fechar
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default SiteDetailModal;
