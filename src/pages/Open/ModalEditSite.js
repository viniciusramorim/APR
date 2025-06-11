import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import firebase from "../../services/firebaseConnection";
import { toast } from 'react-toastify';

export default function ModalEditSite({ idDoc, ReloadAPR, tipoSite, logSistem }) {
  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState('');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscarSites = async () => {
    setLoading(true);
    try {
      const snapshot = await firebase.firestore().collection('sites')
        .where('Sigla', '==', sigla)
        .get();

      const sitesBuscados = [];
      snapshot.forEach(doc => {
        sitesBuscados.push({ id: doc.id, ...doc.data() });
      });
      console.log(sitesBuscados)
      setSites(sitesBuscados);
    } catch (error) {
      console.error("Erro ao buscar sites:", error);
      toast.error("Erro ao buscar sites.");
    } finally {
      setLoading(false);
    }
  };

  const updateSigla = async () => {
    try {
      await firebase.firestore().collection('aprs-producao').doc(idDoc)
        .update({
          site_id: {
            ...selectedSite,
            tipoSite: tipoSite
          },
        });
      toast.success("Sigla atualizada com sucesso!");
      logSistem(`Sigla atualizada para ${selectedSite.Sigla} - ${selectedSite.Estado}`, idDoc);
      ReloadAPR()
      setOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar sigla:", error);
      toast.error("Erro ao atualizar sigla.");
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSites([]);
    setSigla('');
    setSelectedSite(null);
  };

  return (
    <div>
      <Button variant="outlined" onClick={handleClickOpen}>
        Editar Sigla do Site
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Alterar Sigla do Site</DialogTitle>
        <DialogContent dividers style={{ minHeight: '400px' }}>
          <TextField
            autoFocus
            margin="dense"
            label="Sigla"
            type="text"
            fullWidth
            variant="outlined"
            value={sigla}
            onChange={(e) => setSigla(e.target.value.toUpperCase())}
          />
          <Button onClick={buscarSites} color="primary" style={{ marginTop: 10 }}>
            Buscar
          </Button>
          {loading && <CircularProgress style={{ marginTop: 20 }} />}
          {sites.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Typography variant="h6">Sites encontrados:</Typography>
              <List>
                {sites.map(site => (
                  <ListItem
                    button
                    key={site.id}
                    selected={selectedSite && selectedSite.id === site.id}
                    onClick={() => setSelectedSite(site)}
                    style={{
                      backgroundColor: selectedSite && selectedSite.id === site.id ? '#9c27b04a' : 'transparent'
                    }}
                  >
                    <ListItemText primary={site.Nome} secondary={site.Estado} />
                  </ListItem>
                ))}
              </List>
            </div>
          )}
          {selectedSite && (
            <div style={{ marginTop: 20 }}>
              <Typography variant="subtitle1">Você selecionou: {selectedSite.Nome} - {selectedSite.Estado}</Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => updateSigla(sigla)}
                style={{ marginTop: 10 }}
              >
                Confirmar
              </Button>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error" variant='outlined'>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}