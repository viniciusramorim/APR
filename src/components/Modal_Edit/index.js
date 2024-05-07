import React, { useState } from 'react';
import { Grid, TextField, Modal, Button, Box, RadioGroup, FormControl, FormControlLabel, Radio } from '@mui/material';
import firebase from '../../services/firebaseConnection';
import { FiEdit } from 'react-icons/fi';

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

export default function ModalEdit(props) {

  const { id, areaIndex, questionIndex, checklistCompleto, loadApr, logSistem } = props

  const [open, setOpen] = useState(false);
  const [questionResp, setQuestionResp] = useState(checklistCompleto[areaIndex][1][questionIndex].resp);
  const [questionComentario, setQuestionComentario] = useState(checklistCompleto[areaIndex][1][questionIndex].respTextArea);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const concluirEdit = () => {
    checklistCompleto[areaIndex][1][questionIndex].resp = questionResp
    checklistCompleto[areaIndex][1][questionIndex].respTextArea = questionComentario
    firebase.firestore().collection('aprs-producao')
    .doc(id)
    .update({
      checklist: checklistCompleto
    })
    .then(() => {
      console.log('update question')
      logSistem(`QUESTÃO-EDIT-${checklistCompleto[areaIndex][0].toUpperCase()}-QUESTION-${checklistCompleto[areaIndex][1][questionIndex].questionId}`, id)
    })
    .catch(err => console.log(err))
    loadApr()
    handleClose()
  };

  return (
    <>
      <label className='Edit'>
        <a onClick={() => handleOpen()}>
          <FiEdit></FiEdit>Editar
        </a>
      </label>
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
              {checklistCompleto[areaIndex][1][questionIndex].questionId} - {checklistCompleto[areaIndex][1][questionIndex].question}
            </Grid>
            <Grid item xs={12} md={12}>
              <FormControl>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  value={questionResp}
                  onChange={(e) => setQuestionResp(e.target.value)}
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                  <FormControlLabel value="Não" control={<Radio />} label="Não" />
                  <FormControlLabel value="" control={<Radio />} label="N/A" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                id="outlined-multiline-static"
                label="Comentario"
                multiline
                rows={4}
                value={questionComentario}
                onChange={(e) => setQuestionComentario(e.target.value)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} marginTop={0.5} textAlign={'left'}>
            <Grid item xs={3} md={3}>
              <Button size="small" color="secondary" variant="outlined" onClick={concluirEdit}>Editar</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
