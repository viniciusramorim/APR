import React, { useState } from 'react';
import { Grid, TextField, Modal, Button, Box } from '@mui/material';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import { FiSearch } from 'react-icons/fi';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function ModalInfoSite(props) {

  const { site, loadSites, logSistem, user } = props

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const removeSite = () => {
    firebase.firestore().collection('sites-aprovacao')
      .doc(site.id)
      .delete()
      .then(() => {
        toast.success('Site para aprovação removido com sucesso.');
        logSistem('REMOVIDO-SITE-APROVAÇÃO', site.id);
        handleClose();
        loadSites();
      })
      .catch((err) => toast('Erro ao remover site. ' + err))
  };

  const aprovaSite = () => {
    firebase.firestore().collection('sites')
      .add({
        Bairro: site.Bairro,
        Situacao: site.Situacao,
        geohash: site.geohash,
        Endereco: site.Endereco,
        Sigla: site.Sigla,
        Cidade: site.Cidade,
        tipoSite: site.tipoSite,
        Estado: site.Estado,
        critical: site.critical,
        created: site.created,
        Complemento: site.Complemento,
        Longitude: site.Longitude,
        Latitude: site.Latitude,
        tipoContrato: site.tipoContrato,
        Sigla_GVT: site.Sigla_GVT,
        user_nome: site.user_nome,
        CEP: site.CEP,
        Nome: site.Nome,
        lastUpdate: new Date(),
        userLastUpdate: user.nome
      })
      .then((result) => {
        toast.success('Site para aprovação cadastrado com sucesso.');
        logSistem('APROVADO-SITE-APROVAÇÃO', result.id);
        removeSite();
      })
      .catch((err) => toast('Erro ao remover site. ' + err))
  };

  return (
    <div>
      <Button variant="outlined" size="small" color="secondary" onClick={handleOpen}>
        <FiSearch></FiSearch>
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid container spacing={2} textAlign={'right'}>
            <Grid item xs={12} md={12}>
              <Button size="small" color="error" variant="contained" onClick={handleClose}>X</Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} marginTop={0.5}>
            <Grid item xs={12} md={12}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.user_nome}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ disabled: true }}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Nome}
                variant="filled"
                size="small"
                fullWidth
                onChange={(e) => site.Nome = e.target.value.toUpperCase()}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Endereco}
                variant="filled"
                size="small"
                fullWidth
                onChange={(e) => site.Endereco = e.target.value.toUpperCase()}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Cidade}
                variant="filled"
                size="small"
                fullWidth
                onChange={(e) => site.Cidade = e.target.value.toUpperCase()}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Bairro}
                variant="filled"
                size="small"
                fullWidth
                onChange={(e) => site.Bairro = e.target.value.toUpperCase()}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Estado}
                variant="filled"
                size="small"
                fullWidth
                onChange={(e) => site.Estado = e.target.value.toUpperCase()}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.critical}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ disabled: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Sigla}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.tipoSite}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.CEP}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ disabled: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Latitude}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ disabled: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                hiddenLabel
                id="filled-hidden-label-small"
                defaultValue={site.Longitude}
                variant="filled"
                size="small"
                fullWidth
                InputProps={{ disabled: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} marginTop={0.5} textAlign={'right'}>
            <Grid item xs={9} md={9}>
              <Button size="small" color="error" variant="outlined" onClick={removeSite}>Remover</Button>
            </Grid>
            <Grid item xs={3} md={3}>
              <Button size="small" color="secondary" variant="outlined" onClick={aprovaSite}>Aprovar</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </div>
  );
}