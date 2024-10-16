import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, Grid } from "@mui/material";
import firebase from "../../services/firebaseConnection";
import "./SiteDetailModal.scss";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

const SiteDetailModal = ({ open, onClose, site, handleSearch, user }) => {
  const [editSite, setEditSite] = useState(null);
  const [newEstado, setNewEstado] = useState("");
  const [newTipoSite, setNewTipoSite] = useState("");
  const [newTipo_contrato, setNewTipo_contrato] = useState("");
  const [newCritical, setNewCritical] = useState("");
  const [newCidade, setNewCidade] = useState("");
  const [newCep, setNewCep] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newDetentora, setNewDetentora] = useState("");

  const history = useHistory();

  useEffect(() => {
    if (site[0]) {
      setEditSite({ ...site[0] });
      setNewEstado(site[0].estado);
      setNewTipoSite(site[0].tipoSite);
      setNewTipo_contrato(site[0].tipo_contrato);
      setNewCritical(site[0].critical);
      setNewCidade(site[0].cidade);
      setNewCep(site[0].cep);
      setNewDetentora(site[0].detentora);
      setNewLat(site[0].latitude);
      setNewLng(site[0].longitude);
    }
  }, [site[0]]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditSite((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (editSite) {
      try {
        const updatedSite = {
          ...editSite,
          estado: newEstado,
          tipoSite: newTipoSite,
          tipo_contrato: newTipo_contrato,
          criticidade: newCritical,
          municio: newCidade,
          cep: newCep,
          detentora: newDetentora,
          latitude: newLat,
          longitude: newLng,
        };

        await firebase
          .firestore()
          .collection("sites")
          .doc(updatedSite.id)
          .update({
            Estado: updatedSite.estado,
            tipoSite: updatedSite.tipoSite,
            tipoContrato: updatedSite.tipo_contrato,
            critical: updatedSite.critical,
            Cidade: updatedSite.cidade,
            CEP: updatedSite.cep,
            Detentora: updatedSite.detentora,
            Latitude: updatedSite.latitude,
            Longitude: updatedSite.longitude,
          });
        toast.success("Site atualizado com sucesso!");
        onClose();
        handleSearch();
      } catch (error) {
        console.error("Erro ao atualizar site:", error);
        toast.error("Erro ao atualizar site!");
      }
    }
    console.log(editSite);
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
          height: "90%",
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
              <strong>ID:</strong>
              <input
                name="id"
                value={editSite.id}
                onChange={handleChange}
                disabled
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>UF:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="estado"
                value={editSite.estado}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Site:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="tipoSite"
                value={editSite.tipoSite}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Tipo de Contrato:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="tipoContrato"
                value={editSite.tipo_contrato}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Criticidade:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="critical"
                value={editSite.critical}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Municipio:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="cidade"
                value={editSite.cidade}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>CEP:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                name="cep"
                value={editSite.cep}
                onChange={handleChange}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
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
                disabled={user.nivel !== "administrador"}
                value={newDetentora}
                onChange={(e) => setNewDetentora(e.target.value.toUpperCase())}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LATITUDE:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>LONGITUDE:</strong>
              <input
                disabled={user.nivel !== "administrador"}
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                style={{
                  width: "fit-content",
                  padding: "8px",
                  borderColor: "#6e0dec",
                  borderRadius: "8px",
                  borderWidth: "1px",
                }}
              />
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
                {user.nivel === "administrador" && (
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    style={{ backgroundColor: "#6e0dec", borderColor: "#6e0dec" }}
                    sx={{ mt: 2, ml: 2 }}
                  >
                    Salvar Alteração
                  </Button>
                )}
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
