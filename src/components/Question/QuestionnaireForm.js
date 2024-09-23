import React, { useState, useCallback, useEffect } from "react";
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
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";

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

const MyModal = ({ open, handleClose }) => {
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

  const [checklistOptions, setChecklistOptions] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [newChecklist, setNewChecklist] = useState("");

  const [blocoOptions, setBlocoOptions] = useState([]);
  const [selectedBloco, setSelectedBloco] = useState("");
  const [newBloco, setNewBloco] = useState("");

  const [areaResposavelOptions, setAreaResposavelOptions] = useState([
    "oem",
    "Área Responsável 1",
  ]);

  const [hierarchicalData, setHierarchicalData] = useState({});
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const checklistsRef = firebase.firestore().collection("question");
      const snapshot = await checklistsRef.get();
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setHierarchicalData(data);

      const checklistNames = Object.keys(data);
      setChecklistOptions(checklistNames);

      if (checklistNames.length > 0) {
        setSelectedChecklist(checklistNames[0]);
        const blocoNames = Object.keys(data[checklistNames[0]] || {});
        setBlocoOptions(blocoNames);
        if (blocoNames.length > 0) {
          setSelectedBloco(blocoNames[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleNewChecklist = useCallback(() => {
    if (newChecklist && !checklistOptions.includes(newChecklist)) {
      setChecklistOptions((prevOptions) => [...prevOptions, newChecklist]);
      setSelectedChecklist(newChecklist);
      setHierarchicalData((prevData) => ({
        ...prevData,
        [newChecklist]: {},
      }));
      setNewChecklist("");
      setBlocoOptions([]);
      setSelectedBloco("");
    }
  }, [newChecklist, checklistOptions]);

  const handleNewBloco = useCallback(() => {
    if (newBloco && selectedChecklist && !blocoOptions.includes(newBloco)) {
      setBlocoOptions((prevOptions) => [...prevOptions, newBloco]);
      setSelectedBloco(newBloco);
      setHierarchicalData((prevData) => ({
        ...prevData,
        [selectedChecklist]: {
          ...prevData[selectedChecklist],
          [newBloco]: [],
        },
      }));
      setNewBloco("");
    }
  }, [newBloco, selectedChecklist, blocoOptions]);

  const handleNewAreaResponsavel = useCallback(() => {
    if (formData.newAreaResponsavel && !areaResposavelOptions.includes(formData.newAreaResponsavel)) {
      setAreaResposavelOptions((prevOptions) => [
        ...prevOptions,
        formData.newAreaResponsavel,
      ]);
      setFormData((prevData) => ({
        ...prevData,
        areaResposavel: prevData.newAreaResponsavel,
        newAreaResponsavel: "",
      }));
    }
  }, [formData.newAreaResponsavel, areaResposavelOptions]);

  const handleAddQuestion = useCallback(() => {
    if (!selectedChecklist || !selectedBloco) {
      setError("Por favor, selecione um Checklist e um Bloco antes de adicionar uma pergunta.");
      return;
    }

    const newQuestionId = `${selectedChecklist}-${selectedBloco}-${(hierarchicalData[selectedChecklist]?.[selectedBloco]?.length || 0) + 1}`;

    setHierarchicalData((prevData) => ({
      ...prevData,
      [selectedChecklist]: {
        ...prevData[selectedChecklist],
        [selectedBloco]: [
          ...(prevData[selectedChecklist]?.[selectedBloco] || []),
          {
            ...formData,
            questionId: newQuestionId,
          },
        ],
      },
    }));

    setFormData((prevData) => ({
      ...prevData,
      question: "",
      questionId: `${selectedChecklist}-${selectedBloco}-${(hierarchicalData[selectedChecklist]?.[selectedBloco]?.length || 0) + 2}`,
    }));

    setError(null);
  }, [formData, selectedChecklist, selectedBloco, hierarchicalData]);

  const handleSubmit = useCallback(async () => {
    try {
      const batch = firebase.firestore().batch();
      const checklistsRef = firebase.firestore().collection("question");

      Object.keys(hierarchicalData).forEach((checklistName) => {
        const checklistDoc = checklistsRef.doc(checklistName);
        batch.set(checklistDoc, hierarchicalData[checklistName], { merge: true });
      });

      await batch.commit();
      console.log("Dados salvos com sucesso:", hierarchicalData);
      handleClose();
    } catch (error) {
      setError("Erro ao salvar os dados. Por favor, tente novamente.");
      console.error("Erro ao salvar:", error);
    }
  }, [hierarchicalData, handleClose]);

  useEffect(() => {
    if (selectedChecklist) {
      const blocoNames = Object.keys(hierarchicalData[selectedChecklist] || {});
      setBlocoOptions(blocoNames);
      if (blocoNames.length > 0 && !blocoNames.includes(selectedBloco)) {
        setSelectedBloco(blocoNames[0]);
      }
    }
  }, [selectedChecklist, hierarchicalData, selectedBloco]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" gutterBottom>
          Preencha as Informações
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>Checklist</InputLabel>
          <Select
            value={selectedChecklist}
            onChange={(e) => setSelectedChecklist(e.target.value)}
          >
            {checklistOptions.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="addNew">Adicionar novo checklist</MenuItem>
          </Select>
        </FormControl>

        {selectedChecklist === "addNew" && (
          <>
            <TextField
              label="Novo Checklist"
              value={newChecklist}
              onChange={(e) => setNewChecklist(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="outlined" onClick={handleNewChecklist}>
              Adicionar Checklist
            </Button>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Adicionar Novo Bloco ao Checklist Selecionado
        </Typography>

        <TextField
          label="Nome do Novo Bloco"
          value={newBloco}
          onChange={(e) => setNewBloco(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="outlined" onClick={handleNewBloco} disabled={!selectedChecklist || selectedChecklist === "addNew"}>
          Adicionar Novo Bloco
        </Button>

        <Divider sx={{ my: 2 }} />

        <FormControl fullWidth margin="normal">
          <InputLabel>Bloco</InputLabel>
          <Select
            value={selectedBloco}
            onChange={(e) => setSelectedBloco(e.target.value)}
          >
            {blocoOptions.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

        <TextField
          label="ID da Pergunta"
          name="questionId"
          value={formData.questionId}
          fullWidth
          margin="normal"
          disabled
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Área Responsável</InputLabel>
          <Select
            name="areaResposavel"
            value={formData.areaResposavel}
            onChange={handleChange}
          >
            {areaResposavelOptions.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="addNewResponsavel">
              Adicionar nova área responsável
            </MenuItem>
          </Select>
        </FormControl>

        {formData.areaResposavel === "addNewResponsavel" && (
          <>
            <TextField
              label="Nova Área Responsável"
              name="newAreaResponsavel"
              value={formData.newAreaResponsavel}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <Button variant="outlined" onClick={handleNewAreaResponsavel}>
              Adicionar Área Responsável
            </Button>
          </>
        )}

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

        <TextField
          label="Usuário de Criação"
          name="user"
          value={formData.user}
          fullWidth
          margin="normal"
          disabled
        />

        <TextField
          label="Última Atualização"
          name="lastUpdate"
          value={formData.lastUpdate}
          fullWidth
          margin="normal"
          disabled
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

        <Button variant="contained" onClick={handleAddQuestion} fullWidth>
          Adicionar Pergunta
        </Button>

        {selectedChecklist && (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>
              Blocos no Checklist Atual:
            </Typography>
            <List>
              {Object.keys(hierarchicalData[selectedChecklist] || {}).map((bloco, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={bloco}
                    secondary={`${hierarchicalData[selectedChecklist][bloco].length} pergunta(s)`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Button variant="contained" onClick={handleSubmit} fullWidth>
          Salvar
        </Button>
      </Box>
    </Modal>
  );
};

export default MyModal;