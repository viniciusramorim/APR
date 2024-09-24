import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Button,
  Checkbox,
  InputLabel,
  FormControl,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";

const QuestionnaireFormModal = ({ selectedChecklist, selectedBlock }) => {
  const [formData, setFormData] = useState({
    question: "",
    answers: ["Sim", "Não"],
    selectOptions: false,
    textarea: false,
    inputImages: false,
    questionId: "",
    resp: "",
    respTextArea: "",
    respGabarito: "Ambas",
    images: [],
    plano_acao: [],
    openPA: false,
    areaResposavel: "oem",
    newAreaResponsavel: "",
    critical: "Baixo",
    user: "",
    lastUpdate: new Date(),
    status: true,
  });

  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false); // Estado para controlar a abertura do modal

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const checklistRef = firebase.firestore().collection("question").doc(selectedChecklist);
      const newQuestionId = `${selectedChecklist}-${selectedBlock}-${Date.now()}`;
      
      await checklistRef.update({
        [`${selectedBlock}`]: firebase.firestore.FieldValue.arrayUnion({
          ...formData,
          questionId: newQuestionId,
          lastUpdate: new Date().toISOString(),
        })
      });

      setFormData({
        ...formData,
        question: "",
        questionId: "",
      });
      setError(null);
      handleClose(); // Fecha o modal após o envio
    } catch (error) {
      console.error("Error adding question:", error);
      setError("Erro ao adicionar pergunta. Por favor, tente novamente.");
    }
  }, [formData, selectedChecklist, selectedBlock]);

  return (
    <div>
      {/* Botão para abrir o modal */}
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Adicionar Pergunta
      </Button>

      {/* Modal do formulário */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Nova Pergunta</DialogTitle>
        <DialogContent>
          <Box>
            <TextField
              label="Pergunta"
              name="question"
              value={formData.question}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.textarea}
                  onChange={handleChange}
                  name="textarea"
                />
              }
              label="Possui campo de texto adicional?"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.selectOptions}
                  onChange={handleChange}
                  name="selectOptions"
                />
              }
              label="Possui select de opções?"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.inputImages}
                  onChange={handleChange}
                  name="inputImages"
                />
              }
              label="Possui upload de imagens?"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Área Responsável</InputLabel>
              <Select
                name="areaResposavel"
                value={formData.areaResposavel}
                onChange={handleChange}
              >
                <MenuItem value="oem">OEM</MenuItem>
                <MenuItem value="Área Responsável 1">Área Responsável 1</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Criticidade</InputLabel>
              <Select
                name="critical"
                value={formData.critical}
                onChange={handleChange}
              >
                <MenuItem value="Baixo">Baixo</MenuItem>
                <MenuItem value="Médio">Médio</MenuItem>
                <MenuItem value="Alto">Alto</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.openPA}
                  onChange={handleChange}
                  name="openPA"
                />
              }
              label="Plano de Ação aberto?"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status}
                  onChange={handleChange}
                  name="status"
                />
              }
              label="Ativar/Desativar Pergunta"
            />
            {error && (
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Adicionar Pergunta
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionnaireFormModal;
