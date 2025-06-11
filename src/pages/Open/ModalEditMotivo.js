import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { toast } from 'react-toastify';
import firebase from "../../services/firebaseConnection";

export default function ModalEditMotivo({ apr, id, logSistem, ReloadAPR }) {
    const [open, setOpen] = useState(false);
    const [motivo, setMotivo] = useState(apr.motivo_apr);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    async function updateMotivoAPR(motivo, id) {
        await firebase
            .firestore()
            .collection('aprs-producao')
            .doc(id)
            .update({
                motivo_apr: motivo,
            })
            .then(() => {
                toast.success("Motivo da apr atualizado com sucesso!");
                logSistem(`Motivo APR Atualizado para ${motivo}`, id);
                ReloadAPR();
            })
            .catch((error) => {
                toast.error("Erro ao atualizar status da apr:", error);
                console.log("Erro ao atualizar status da apr:", error);
            });
    }

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleMotivoChange = (e) => {
        setMotivo(e.target.value);
    };

    const handleSave = () => {
        updateMotivoAPR(motivo, id);
        toast.success('Motivo atualizado com sucesso!');
        setOpen(false);
    };

    return (
        <div>
            <Button variant="outlined" onClick={handleClickOpen}>
                Editar Motivo
            </Button>


            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Alterar Motivo do Site</DialogTitle>
                <DialogContent>
                    <Typography>Motivo Atual: {apr.motivo_apr}</Typography>
                    <TextField
                        select
                        fullWidth
                        label="Selecionar Motivo"
                        value={motivo}
                        onChange={handleMotivoChange}
                        SelectProps={{
                            native: true,
                        }}
                        variant="outlined"
                        margin="normal"
                    >
                        <option value={"Mapa de Calor"}>Mapa de Calor</option>
                        <option value={"Retrofit"}>Retrofit</option>
                        <option value={"Rota Critica DWDM"}>Rota Critica DWDM</option>
                        <option value={"Projeto Veneza"}>Projeto Veneza</option>
                        <option value={"TurnKey"}>TurnKey</option>
                        <option value={"Conectividade nos Sites"}>Conectividade nos Sites</option>
                        <option value={"Torre Segura"}>Torre Segura</option>
                        <option value={"Internalização Loja Dealer"}>Internalização Loja Dealer</option>
                        <option value={"Estoque Avançado"}>Estoque Avançado</option>
                        <option value={"Instalação Tag"}>Instalação Tag</option>
                        <option value={"Sites Criticos (Mapa de Proteção)"}>Sites Criticos (Mapa de Proteção)</option>
                        <option value={"Não Opinada"}>Não Opinada</option>
                        <option value={"Opinada"}>Opinada</option>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} color="primary">
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}