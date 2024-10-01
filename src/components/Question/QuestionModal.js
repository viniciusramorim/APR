import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
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
  Divider,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";
import { AuthContext } from "../../contexts/auth";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
};

const QuestionModal = ({ open, onClose, onSave, question, selectedBlocoTitle }) => {
  const { user } = useContext(AuthContext);

  // Estado inicial para o formulário
  const initialFormData = {
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
    area: "", // Inicializa `area` vazio e será atualizado
    newAreaResponsavel: "",
    critical: "Baixo",
    user: user ? user.nome : "",
    lastUpdate: new Date(),
    status: true,
    peso: 0,
    inputImagesLibrary: false,
  };

  // Estado para o formulário
  const [formData, setFormData] = useState(initialFormData);
  const [areaOptions, setAreaOptions] = useState(["oem", "Área Responsável 1", "Área Responsável 2"]);
  const [newArea, setNewArea] = useState("");

  useEffect(() => {
    if (question) {
      setFormData({
        ...formData,
        ...question,
        lastUpdate: new Date(),
      });
    } else {
      setFormData(initialFormData); // Reseta o estado ao abrir o modal para adicionar nova pergunta
    }
  }, [question, open]);

  useEffect(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        user: user.nome,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (selectedBlocoTitle) {
      setFormData((prevData) => ({
        ...prevData,
        area: selectedBlocoTitle,
      }));
    }
  }, [selectedBlocoTitle]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddNewAreaResponsavel = async () => {
    if (!newArea.trim()) {
      return;
    }

    const newAreaLower = newArea.trim().toLowerCase();

    try {
      const areasRef = firebase.firestore().collection("areas");
      await areasRef.add({ name: newAreaLower });

      setAreaOptions((prevOptions) => [...prevOptions, newAreaLower]);
      setFormData((prevData) => ({
        ...prevData,
        area: newAreaLower,
      }));

      setNewArea(""); // Limpa o campo de nova área
    } catch (error) {
      console.error("Erro ao adicionar nova área responsável:", error);
    }
  };

  const handleSave = () => {
    const formattedQuestion = {
      ...formData,
      lastUpdate: new Date(),
    };
    onSave(formattedQuestion); // Passa a pergunta formatada para a função onSave
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" gutterBottom>
          Preencha as Informações da Pergunta
        </Typography>
        <Divider sx={{ my: 2 }} />
        <TextField
          label="Pergunta"
          name="question"
          value={formData.question}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          type="number"
          label="Peso"
          name="peso"
          value={formData.peso}
          onChange={(e) => setFormData({ ...formData, peso: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Área Responsável</InputLabel>
          <Select
            name="area"
            value={formData.area}
            onChange={handleChange}
            fullWidth
          >
            {areaOptions.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="addNew">Adicionar nova área</MenuItem>
          </Select>
        </FormControl>

        {formData.area === "addNew" && (
          <Box display="flex" alignItems="center">
            <TextField
              label="Nova Área Responsável"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="outlined" onClick={handleAddNewAreaResponsavel} sx={{ ml: 2, mt: 2 }}>
              Adicionar
            </Button>
          </Box>
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel>Gabarito da Questão</InputLabel>
          <Select
            name="respGabarito"
            value={formData.respGabarito}
            onChange={handleChange}
          >
            <MenuItem value="Sim">Sim</MenuItem>
            <MenuItem value="Não">Não</MenuItem>
            <MenuItem value="Ambas">Ambas</MenuItem>
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
          label="Habilitar Plano de Ação"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.status}
              onChange={(e) => setFormData((prevData) => ({
                ...prevData,
                status: e.target.checked,
              }))}
              name="status"
            />
          }
          label="Status (Ativa/Inativa)"
        />

        {/* Campos adicionais com Checkbox */}
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
              checked={formData.inputImages}
              onChange={handleChange}
              name="inputImages"
            />
          }
          label="Possui upload de imagens?"
        />

        <TextField
          label="Criado por"
          name="user"
          value={formData.user}
          fullWidth
          margin="normal"
          disabled
        />
        <TextField
          label="Última Atualização"
          name="lastUpdate"
          value={formData.lastUpdate.toLocaleString()}
          fullWidth
          margin="normal"
          disabled
        />
        <Button variant="contained" onClick={handleSave} fullWidth sx={{ mt: 2 }}>
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

export default QuestionModal;
