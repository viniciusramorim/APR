import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, Grid } from "@mui/material";
import firebase from "../../services/firebaseConnection";
import "./SiteDetailModal.scss";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

const SiteDetailModal = ({ open, onClose, site, handleSearch, user }) => {
  const [editSite, setEditSite] = useState(null);

  const history = useHistory();

  useEffect(() => {
    if (site[0]) {
      setEditSite({ ...site[0] });
    }
  }, [site[0]]);

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
      className="modal-site-details"
      aria-labelledby="modal-sites-details"
      aria-describedby="modal-description"
      style={{ borderRadius: "8px" }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "83%",
          maxWidth: 800,
          height: "80%",
          bgcolor: "background.paper",
          border: "1px solid #000",
          boxShadow: 24,
          p: 4,
          overflow: "auto",
          borderColor: "#6e0dec",
          borderRadius: "8px",
        }}
      >
        <Typography id="modal-title" variant="h6" component="h2" sx={{ pb: 2 }}>
          Detalhes do Site - {editSite.sigla} - {editSite.nome}
        </Typography>
        <Grid container spacing={2} className="modal-details">
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>ID:</strong> {editSite.id}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>UF:</strong> {editSite.estado}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Site:</strong> {editSite.tipoSite}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Contrato:</strong> {editSite.tipo_contrato}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Criticidade:</strong> {editSite.critical}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Municipio:</strong> {editSite.cidade}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>CEP:</strong> {editSite.cep}
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
              <strong>DETENTORA:</strong> {editSite.detentora}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LATITUDE:</strong> {editSite.latitude}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LONGITUDE:</strong> {editSite.longitude}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <div className="buttons-modal-new-site">
              <div className="buttons-left">
                <Button
                  onClick={onClose}
                  variant="outlined"
                  sx={{ mt: 2 }}
                  style={{ color: "#e84118", borderColor: "#e84118" }}
                >
                  Fechar
                </Button>
              </div>
              <div className="buttons-right">
                <Button
                  onClick={handleAdvance}
                  variant="outlined"
                  style={{ color: "#6e0dec", borderColor: "#6e0dec" }}
                  sx={{ mt: 2 }}
                >
                  Avançar
                </Button>
              </div>
            </div>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default SiteDetailModal;
