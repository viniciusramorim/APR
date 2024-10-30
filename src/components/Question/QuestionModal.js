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
  IconButton,
} from "@mui/material";
import { AuthContext } from "../../contexts/auth";
import DeleteIcon from "@mui/icons-material/Delete";
import "./styles/questionnaireForm.scss";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1000,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
};

const QuestionModal = ({
  open,
  onClose,
  onSave,
  question,
  selectedBlocoTitle,
  questionId,
}) => {
  const { user } = useContext(AuthContext);
  const [newOption, setNewOption] = useState("");

  const initialFormData = {
    question: "",
    answers: ["Sim", "Não"],
    selectOptions: true,
    textarea: false,
    inputImages: false,
    questionId: questionId || 0,
    resp: "",
    respTextArea: "",
    respGabarito: "",
    images: [],
    plano_acao: [],
    openPA: false,
    area: selectedBlocoTitle || "",
    areaResponsavel: [],
    critical: "Baixo",
    user: user ? user.nome : "",
    lastUpdate: new Date(),
    status: true,
    peso: "",
    peso_icd: "",
    peso_fmc: "",
    peso_rct: "",
    peso_daef: "",
    inputImagesLibrary: false,
    optionList: [],
    listCheck: false,
    optionListResp: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [areaOptions, setAreaOptions] = useState(["oem", "patrimonial"]);
  const [newArea, setNewArea] = useState("");

  useEffect(() => {
    if (question) {
      setFormData({
        ...initialFormData,
        ...question,
        lastUpdate: new Date(),
        area: selectedBlocoTitle || "",
        areaResponsavel: question.areaResponsavel || [],
        listCheck: question.listCheck || false,
      });
    } else {
      setFormData({
        ...initialFormData,
        questionId: questionId,
      });
    }
  }, [question, open, questionId]);

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

  const handleAreaResponsavelChange = (event) => {
    const { value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      areaResponsavel: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleAddNewAreaResponsavel = () => {
    if (!newArea.trim()) return;

    setAreaOptions((prevOptions) => [...prevOptions, newArea]);
    setFormData((prevData) => ({
      ...prevData,
      areaResponsavel: [...prevData.areaResponsavel, newArea],
    }));

    setNewArea("");
  };

  // Função para salvar a opção selecionada diretamente como string
  const handleOptionSelect = (event) => {
    setFormData((prevData) => ({
      ...prevData,
      selectedOption: event.target.value,
    }));
  };

  // Função para adicionar uma nova opção à lista de opções do Select
  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      setFormData((prevData) => ({
        ...prevData,
        optionList: [...prevData.optionList, newOption],
      }));
      setNewOption("");
    }
  };

  // Função para excluir uma opção do Select
  const handleDeleteOption = (optionToDelete) => {
    setFormData((prevData) => ({
      ...prevData,
      optionList: prevData.optionList.filter(
        (option) => option !== optionToDelete
      ),
    }));
  };

  const handleSave = () => {
    const formattedQuestion = {
      ...formData,
      lastUpdate: new Date(),
    };
    onSave(formattedQuestion);
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

        <div className="type-weight">
          <TextField
            sx={{
              width: {
                xs: "100%",
                md: "100%",
              },
            }}
            type="number"
            label="Peso"
            name="peso"
            value={formData.peso}
            onChange={(e) =>
              setFormData({ ...formData, peso: parseInt(e.target.value) })
            }
            fullWidth
            margin="normal"
          />
          <div className="nivel-impacto">
            <h2>Nível de Impacto</h2>
            <TextField
              sx={{
                width: {
                  xs: "100%",
                  md: "100%",
                  sm: "100%",
                  lg: "25%",
                },
              }}
              placeholder="0"
              type="number"
              label="Invasão"
              name="peso_icd"
              value={formData.peso_icd}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  peso_icd: parseInt(e.target.value),
                })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              sx={{
                width: {
                  xs: "100%",
                  md: "100%",
                  sm: "100%",
                  lg: "25%",
                },
                padding: {
                  xs: "0px",
                  md: "0px",
                  lg: "0px 10px",
                },
              }}
              placeholder="0"
              type="number"
              label="Furto de Mercadoria"
              name="peso_fmc"
              value={formData.peso_fmc}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  peso_fmc: parseInt(e.target.value),
                })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              sx={{
                width: {
                  xs: "100%",
                  md: "100%",
                  sm: "100%",
                  lg: "25%",
                },
                padding: {
                  xs: "0px",
                  md: "0px",
                  lg: "0px 10px",
                },
              }}
              placeholder="0"
              type="number"
              label="Roubo de Carga Transporte"
              name="peso_rct"
              value={formData.peso_rct}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  peso_rct: parseInt(e.target.value),
                })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              sx={{
                width: {
                  xs: "100%",
                  md: "100%",
                  sm: "100%",
                  lg: "25%",
                },
              }}
              placeholder="0"
              type="number"
              label="Danos a estrutura física"
              name="peso_daef"
              value={formData.peso_daef}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  peso_daef: parseInt(e.target.value),
                })
              }
              fullWidth
              margin="normal"
            />
          </div>
        </div>

        <FormControl fullWidth margin="normal">
          <InputLabel>Área Responsável</InputLabel>
          <Select
            name="areaResponsavel"
            multiple
            value={formData.areaResponsavel}
            onChange={handleAreaResponsavelChange}
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

        {formData.areaResponsavel.includes("addNew") && (
          <Box display="flex" alignItems="center">
            <TextField
              label="Nova Área Responsável"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="outlined"
              onClick={handleAddNewAreaResponsavel}
              sx={{ ml: 2, mt: 2 }}
            >
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
              onChange={(e) =>
                setFormData((prevData) => ({
                  ...prevData,
                  status: e.target.checked,
                }))
              }
              name="status"
            />
          }
          label="Status (Ativa/Inativa)"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.listCheck}
              onChange={handleChange}
              name="listCheck"
            />
          }
          label="Adicionar Lista de Opções?"
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

        {/* Input para adicionar novas opções ao Select */}
        {formData.listCheck && (
          <Box display="flex" mb={2} className="new-option">
            <TextField
              label="Nova Opção"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={handleAddOption}
              sx={{ ml: 2, mt: 2 }}
            >
              Adicionar Opção
            </Button>
          </Box>
        )}

        {/* Exibir Select com as opções dinâmicas */}
        {formData.listCheck && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>Selecione uma Opção</InputLabel>
              <Select
                value={formData.selectedOption}
                onChange={handleOptionSelect}
                fullWidth
              >
                {formData.optionList.map((option, index) => (
                  <MenuItem key={index} value={option}>
                    {option}
                    <IconButton
                      onClick={() => handleDeleteOption(option)}
                      sx={{ marginLeft: "auto" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <TextField
          label="Criado por"
          name="user"
          value={formData.user}
          fullWidth
          margin="normal"
          disabled
        />

        <TextField
          label="ID da Pergunta"
          name="questionId"
          value={formData.questionId}
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

        <Button
          variant="contained"
          onClick={handleSave}
          fullWidth
          sx={{ mt: 2 }}
        >
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

export default QuestionModal;
