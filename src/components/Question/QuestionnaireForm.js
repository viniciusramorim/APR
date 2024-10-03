import React, { useState, useCallback, useEffect, useContext } from "react";
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
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";
import "../../components/Question/styles/questionnaireForm.scss";
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

const MyModal = ({ open, handleClose }) => {
  const { user } = useContext(AuthContext);

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
    areaResposavel: "",
    newAreaResponsavel: "",
    critical: "Baixo",
    user: user ? user.nome : "",
    lastUpdate: new Date(),
    status: true,
    peso: 0,
    inputImagesLibrary: false,
  });

  const [checklistOptions, setChecklistOptions] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [newChecklist, setNewChecklist] = useState("");

  const [blocoOptions, setBlocoOptions] = useState([]);
  const [selectedBloco, setSelectedBloco] = useState("");
  const [newBloco, setNewBloco] = useState("");

  const [areaResposavelOptions, setAreaResposavelOptions] = useState([
    "oem",
    "patrimonial",
  ]);

  const [hierarchicalData, setHierarchicalData] = useState({});
  const [error, setError] = useState(null);

  // Carrega os checklists e blocos do Firebase
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

      // Inicializa o checklist e bloco selecionados
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

  // Carrega os dados quando o modal é aberto
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Atualiza o usuário no formulário
  useEffect(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        user: user.nome,
      }));
    }
  }, [user]);

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
    if (
      formData.newAreaResponsavel &&
      !areaResposavelOptions.includes(formData.newAreaResponsavel)
    ) {
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
      setError(
        "Por favor, selecione um Checklist e um Bloco antes de adicionar uma pergunta."
      );
      return;
    }

    const newQuestionId = `${selectedChecklist}-${selectedBloco}-${
      (hierarchicalData[selectedChecklist]?.[selectedBloco]?.length || 0) + 1
    }`;

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
      questionId: `${selectedChecklist}-${selectedBloco}-${
        (hierarchicalData[selectedChecklist]?.[selectedBloco]?.length || 0) + 2
      }`,
    }));

    setError(null);

    const blockElement = document.getElementById(`block-${selectedBloco}`);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: "smooth" });
    }
  }, [formData, selectedChecklist, selectedBloco, hierarchicalData]);

  const handleSubmit = useCallback(async () => {
    try {
      const batch = firebase.firestore().batch();
      const checklistsRef = firebase.firestore().collection("question");

      Object.keys(hierarchicalData).forEach((checklistName) => {
        const checklistDoc = checklistsRef.doc(checklistName);
        batch.set(checklistDoc, hierarchicalData[checklistName], {
          merge: true,
        });
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

  useEffect(() => {
    if (user) {
      const userName = user.nome || user.displayName || user.email || "Usuário";
      setFormData((prevData) => ({
        ...prevData,
        user: userName,
      }));
    }
  }, [user]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" gutterBottom>
          Preencha as Informações
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Selecione um checklist abaixo, ou crie um novo
        </Typography>
        <Divider sx={{ my: 2 }} />
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
          Selecione um bloco de perguntas abaixo:
        </Typography>

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
            <MenuItem value="newBloco">Adicionar novo Bloco</MenuItem>
          </Select>
        </FormControl>

        {selectedBloco === "newBloco" && (
          <>
            <TextField
              label="Novo Bloco"
              value={newBloco}
              onChange={(e) => setNewBloco(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="outlined" onClick={handleNewBloco}>
              Adicionar Bloco
            </Button>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Insira aqui a pergunta que deseja adicionar ao bloco
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

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Configure aqui os campos da sua pergunta
        </Typography>
        <Divider sx={{ my: 2 }} />

        <TextField
          type="number"
          label="Peso"
          name="peso"
          value={formData.peso}
          onChange={(e) =>
            setFormData({
              ...formData,
              peso: parseInt(e.target.value),
            })
          }
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

        <TextField
          label="ID da Pergunta"
          name="questionId"
          value={formData.questionId}
          fullWidth
          margin="normal"
          disabled
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Selecione o Gabarito e o Plano de Ação
        </Typography>
        <Divider sx={{ my: 2 }} />

        <FormControl fullWidth margin="normal">
          <InputLabel>Gabarito da Questão</InputLabel>
          <Select
            name="gabarito"
            value={formData.gabarito}
            onChange={handleChange}
          >
            <MenuItem value="sim">Sim</MenuItem>
            <MenuItem value="nao">Não</MenuItem>
            <MenuItem value="ambas">Ambas</MenuItem>
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

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          <p>
            Após preencher todas as informações, clique em adicionar pergunta
            logo abaixo.<br></br>
            <br></br>
            <i style={{ fontSize: "14px" }}>
              Caso precise adicionar mais uma pergunta, basta selecionar o
              checklist e bloco logo acima e preencher os campos novamente. Após
              realizar as inserções, clique em Salvar
            </i>
          </p>
        </Typography>
        <Divider sx={{ my: 2 }} />

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
              {Object.keys(hierarchicalData[selectedChecklist] || {}).map(
                (bloco, index) => (
                  <ListItem key={index} id={`block-${bloco}`}>
                                        <ListItemText
                      primary={bloco}
                      secondary={`${
                        hierarchicalData[selectedChecklist][bloco].length
                      } pergunta(s)`}
                    />
                  </ListItem>
                )
              )}
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

