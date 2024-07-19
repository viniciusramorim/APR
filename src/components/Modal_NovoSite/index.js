import React, { useState } from 'react';
import { Grid, TextField, Modal, Button, Box, MenuItem, InputLabel, Select, FormControl, IconButton } from '@mui/material';
import { toast } from 'react-toastify';
import firebase from '../../services/firebaseConnection';
import * as geofire from 'geofire-common';
import { FiMapPin } from 'react-icons/fi';

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

export default function ModalNovoSite(props) {
  const { user } = props

  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState('');
  const [uf, setUf] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cep, setCep] = useState('');
  const [criticidade, setCriticidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [detentora, setDetentora] = useState('');
  const [nomeSite, setNomeSite] = useState('');
  const [tipoSite, setTipoSite] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSiglaChange = (event) => {
    const { value } = event.target;
    // Limita a 3 caracteres e permite apenas letras maiúsculas
    const newValue = value.slice(0, 3).toUpperCase();
    setSigla(newValue);
  };

  const handleUfChange = (event) => {
    const { value } = event.target;
    // Limita a 2 caracteres e permite apenas letras maiúsculas
    const newValue = value.slice(0, 2).toUpperCase();
    setUf(newValue);
  };

  const formatCoordinate = (value) => {
    // Formata a coordenada para o formato -32.009429
    const newValue = value.replace(/[^0-9.-]/g, '').slice(0, 9);
    return newValue;
  };

  const handleLatitudeChange = (event) => {
    const { value } = event.target;
    const formattedValue = formatCoordinate(value);
    setLatitude(formattedValue);
  };

  const handleLongitudeChange = (event) => {
    const { value } = event.target;
    const formattedValue = formatCoordinate(value);
    setLongitude(formattedValue);
  };

  const formatCep = (value) => {
    // Formata o CEP para o formato 00000-000
    const newValue = value.replace(/[^0-9]/g, '').slice(0, 8);
    return newValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCepChange = (event) => {
    const { value } = event.target;
    const formattedValue = formatCep(value);
    setCep(formattedValue);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(function (position) {
      setLatitude(position.coords.latitude.toString().slice(0, 9))
      setLongitude(position.coords.longitude.toString().slice(0, 9))
    })
  }

  const handleTipoSite = (event) => {
    let value = event.target.value;

    if(value === 'LOJA DEALER') setSigla('LOJA DEALER')
    else if(value === 'LOJA VIVO') setSigla('LOJA VIVO')
    else if(value === 'CROSS DOCKING') setSigla('CROSS DOCKING')
    else setSigla('')

    setTipoSite(value)
  }

  function submit() {
    if (nomeSite === '') return toast.error('Voce precisa preencher um nome de site.')
    if (sigla === '') return toast.error('Voce precisa preencher uma sigla.')
    if (uf === '') return toast.error('Voce precisa preencher uma Unidade Federativa (UF).')
    if (latitude === '') return toast.error('Voce precisa preencher uma latitude.')
    if (longitude === '') return toast.error('Voce precisa preencher uma longitude.')
    if (endereco === '') return toast.error('Voce precisa preencher um endereço.')
    if (bairro === '') return toast.error('Voce precisa preencher um bairro.')
    if (municipio === '') return toast.error('Voce precisa preencher um municipio.')
    if (cep === '') return toast.error('Voce precisa preencher um CEP.')
    if (criticidade === '') return toast.error('Voce precisa preencher uma criticidade.')
    if (tipoSite === '') return toast.error('Voce precisa preencher um tipo de site.')

    try {
      var hash = geofire.geohashForLocation([parseFloat(latitude), parseFloat(longitude)]);
    } catch (error) {
      toast.error('Erro ao obter hash de geolocalização, verifique a lat e lng inserido.')
      return;
    }

    firebase.firestore().collection('sites-aprovacao')
      .add({
        Bairro: bairro,
        CEP: cep,
        Cidade: municipio,
        Complemento: complemento,
        Endereco: endereco,
        Estado: uf,
        Latitude: latitude.replace('.', ',').toString(),
        Longitude: longitude.replace('.', ',').toString(),
        Nome: nomeSite,
        Sigla: sigla,
        Sigla_GVT: '-',
        Situacao: 'ATIVO',
        critical: criticidade,
        geohash: hash,
        tipoContrato: '-',
        tipoSite: tipoSite,
        user_nome: user.nome,
        user_uid: user.uid,
        Detentora: detentora,
        created: new Date(),
      })
      .then(() => {
        console.log('Cadastro feito com sucesso.');
        handleClose()
        toast.success('Solicitação de site enviada! Aguarde aprovação de um Administrador.')
      })
      .catch((error) => {
        console.log('Erro ao cadastrar: ' + error);
      })
  }

  return (
    <div>
      <Button sx={{ width: "100%" }} color="secondary" variant="outlined" onClick={handleOpen}>Novo Site</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid container spacing={1} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={12}>
              <TextField
                size="small"
                id="filled-basic"
                label="Nome do Site"
                value={nomeSite}
                onChange={(e) => setNomeSite(e.target.value.toUpperCase())}
                variant="filled"
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <FormControl variant="filled" fullWidth>
                <InputLabel id="demo-simple-select-filled-label">Tipo de Site</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={tipoSite}
                  onChange={handleTipoSite}
                  label="Tipo de Site"
                >
                  <MenuItem value={'ERB'}>ERB</MenuItem>
                  <MenuItem value={'CT'}>CT</MenuItem>
                  <MenuItem value={'LOJA VIVO'}>LOJA VIVO</MenuItem>
                  <MenuItem value={'LOJA DEALER'}>LOJA DEALER</MenuItem>
                  <MenuItem value={'OUTDOOR'}>OUTDOOR</MenuItem>
                  <MenuItem value={'INDOOR'}>INDOOR</MenuItem>
                  <MenuItem value={'PREDIO CORE'}>PREDIO CORE</MenuItem>
                  <MenuItem value={'CD'}>CD</MenuItem>
                  <MenuItem value={'CROSS DOCKING'}>CROSS DOCKING</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="Sigla Movel"
                variant="filled"
                fullWidth
                disabled={['LOJA DEALER', 'LOJA VIVO', 'CROSS DOCKING'].includes(tipoSite)}
                value={sigla}
                onChange={handleSiglaChange}
                inputProps={{ maxLength: 3, pattern: '[A-Z]*' }}
              />
            </Grid>
            <Grid item xs={5} md={5}>
              <TextField
                size="small"
                id="filled-basic"
                label="Lat"
                variant="filled"
                fullWidth
                value={latitude}
                onChange={handleLatitudeChange}
              />
            </Grid>
            <Grid item xs={5} md={5}>
              <TextField
                size="small"
                id="filled-basic"
                label="Lng"
                variant="filled"
                fullWidth
                value={longitude}
                onChange={handleLongitudeChange}
              />
            </Grid>
            <Grid item xs={2} md={2} textAlign="center">
              <IconButton color="secondary" aria-label="add an alarm" onClick={getLocation}>
                <FiMapPin size={20} />
              </IconButton>
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                size="small"
                id="filled-basic"
                label="Endereço"
                variant="filled"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value.toUpperCase())}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="Complemento"
                variant="filled"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value.toUpperCase())}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="Bairro"
                variant="filled"
                value={bairro}
                onChange={(e) => setBairro(e.target.value.toUpperCase())}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="Municipio"
                variant="filled"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value.toUpperCase())}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="CEP"
                variant="filled"
                fullWidth
                value={cep}
                onChange={handleCepChange}
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                size="small"
                id="filled-basic"
                label="UF"
                variant="filled"
                fullWidth
                value={uf}
                onChange={handleUfChange}
                inputProps={{ maxLength: 2, pattern: '[A-Z]*' }}
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <FormControl variant="filled" fullWidth>
                <InputLabel id="demo-simple-select-filled-label">Criticidade</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={criticidade}
                  onChange={(e) => setCriticidade(e.target.value)}
                  label="Criticidade"
                >
                  <MenuItem value={'Baixo'}>Baixo</MenuItem>
                  <MenuItem value={'Médio'}>Médio</MenuItem>
                  <MenuItem value={'Alto'}>Alto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={12}>
              <TextField
                size="small"
                id="filled-basic"
                label="Detentora"
                variant="filled"
                fullWidth
                value={detentora}
                onChange={(e) => setDetentora(e.target.value.toUpperCase())}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} marginTop={0.5}>
            <Grid item xs={3.5} md={3.5}>
              <Button size="small" color="error" variant="outlined" onClick={handleClose}>Cancelar</Button>
            </Grid>
            <Grid item xs={3.5} md={3.5}>
              <Button size="small" color="secondary" variant="outlined" onClick={() => submit()}>Enviar</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </div>
  );
}
