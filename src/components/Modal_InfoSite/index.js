import React, { useState } from 'react';
import { 
  Grid, 
  TextField, 
  Modal, 
  Button, 
  Box, 
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container
} from '@mui/material';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import { FiSearch, FiX } from 'react-icons/fi';
import { Padding } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 2
};

const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  bgcolor: 'background.paper',
  borderBottom: '1px solid',
  borderColor: 'divider'
};

const footerStyle = {
  position: 'sticky',
  bottom: 0,
  zIndex: 10,
  bgcolor: 'background.paper',
  borderTop: '1px solid',
  borderColor: 'divider',
  py: 2,
  px: 3
};

const contentStyle = {
  overflowY: 'auto',
  maxHeight: 'calc(90vh - 120px)',
  p: 3
};

export default function ModalInfoSite(props) {
  const { site, loadSites, logSistem, user } = props;
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    console.log(site)
  }
  const handleClose = () => setOpen(false);

  const removeSite = () => {
    firebase.firestore().collection('sites-aprovacao')
      .doc(site.id)
      .delete()
      .then(() => {
        toast.success('Site para aprovação removido com sucesso.');
        logSistem(`REMOVIDO-SITE ${site.Nome} - ${site.Sigla}`, site.id);
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
        logSistem(`APROVADO-SITE ${site.Nome} - ${site.Sigla}`, result.id);
        removeSite();
      })
      .catch((err) => toast('Erro ao remover site. ' + err))
  };

  return (
    <div>
      <Button variant="outlined" size="small" color="secondary" onClick={handleOpen}>
        <FiSearch />
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {/* Header Fixo */}
          <Box sx={headerStyle}>
            <Toolbar>
              <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                Detalhes do Site
              </Typography>
              <IconButton 
                edge="end" 
                color="inherit" 
                onClick={handleClose} 
                aria-label="fechar"
              >
                <FiX />
              </IconButton>
            </Toolbar>
          </Box>

          {/* Conteúdo com Scroll */}
          <Box sx={contentStyle}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <TextField
                  label="Usuário"
                  id="user-nome"
                  defaultValue={site.user_nome}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    disabled: true,
                    readOnly: true 
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  label="Nome do Site"
                  id="nome-site"
                  defaultValue={site.Nome}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Nome = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Endereço"
                  id="endereco"
                  defaultValue={site.Endereco}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Endereco = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Complemento"
                  id="complemento"
                  defaultValue={site.Complemento}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Complemento = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cidade"
                  id="cidade"
                  defaultValue={site.Cidade}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Cidade = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Bairro"
                  id="bairro"
                  defaultValue={site.Bairro}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Bairro = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Estado"
                  id="estado"
                  defaultValue={site.Estado}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Estado = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Criticalidade"
                  id="critical"
                  defaultValue={site.critical}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    disabled: true,
                    readOnly: true 
                  }}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Detentora"
                  id="detentora"
                  defaultValue={site.Detentora}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onChange={(e) => site.Detentora = e.target.value.toUpperCase()}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Sigla"
                  id="sigla"
                  defaultValue={site.Sigla}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    readOnly: true 
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tipo de Site"
                  id="tipo-site"
                  defaultValue={site.tipoSite}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    readOnly: true 
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="CEP"
                  id="cep"
                  defaultValue={site.CEP}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    disabled: true 
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Latitude"
                  id="latitude"
                  defaultValue={site.Latitude}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    disabled: true 
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Longitude"
                  id="longitude"
                  defaultValue={site.Longitude}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{ 
                    disabled: true 
                  }}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer Fixo */}
          <Box sx={footerStyle}>
            <Grid container spacing={2} justifyContent="flex-end">
              <Grid item>
                <Button 
                  size="medium" 
                  color="error" 
                  variant="outlined" 
                  onClick={removeSite}
                >
                  Remover
                </Button>
              </Grid>
              <Grid item>
                <Button 
                  size="medium" 
                  color="primary" 
                  variant="contained" 
                  onClick={aprovaSite}
                >
                  Aprovar
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}