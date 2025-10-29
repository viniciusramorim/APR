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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Grid2,
} from "@mui/material";
import { AuthContext } from "../../contexts/auth";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import "./styles/questionnaireForm.scss";
import { ChevronLeft } from "@mui/icons-material";

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
    answers: "",
    selectOptions: true,
    textarea: false,
    inputImages: false,
    questionId: questionId || uuidv4(),
    resp: "",
    respTextArea: "",
    respGabarito: "",
    images: [],
    plano_acao: [],
    openPA: false,
    area: selectedBlocoTitle || "",
    areaResposavel: [],
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
    multipleCheck: false,
    inputNumber: false,
    respInputNumber: "",
    isRequired: false,
    valorArmazenado: {
      max: 0,
      min: 0,
    },
    ValorSinistro: {
      max: 0,
      min: 0,
    },
    valorTransporte: {
      max: 0,
      min: 0,
    },
    valorEstoque: {
      max: 0,
      min: 0,
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [areaOptions, setAreaOptions] = useState(["oem", "patrimonial", "patrimonio", "CMC", "predial", "logistica"]);
  const [newArea, setNewArea] = useState("");

  useEffect(() => {
    if (question) {
      setFormData({
        ...initialFormData,
        ...question,
        lastUpdate: new Date(),
        area: selectedBlocoTitle || "",
        areaResposavel: question.areaResposavel || [],
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
    let newValue;

    if (type === "checkbox") {
      newValue = checked;
    } else if (
      name.includes("storage") ||
      name.includes("sinistro") ||
      name.includes("transporte") ||
      name.includes("estoque")
    ) {
      newValue = Number(value);
    } else {
      newValue = value;
    }

    setFormData((prevData) => {
      let updatedData = { ...prevData, [name]: newValue };

      if (name.includes("storage")) {
        updatedData.valorArmazenado = {
          ...prevData.valorArmazenado,
          [name === "storageMin" ? "min" : "max"]: newValue,
        };
      } else if (name.includes("sinistro")) {
        updatedData.valorSinistro = {
          ...prevData.valorSinistro,
          [name === "sinistroMin" ? "min" : "max"]: newValue,
        };
      } else if (name.includes("transporte")) {
        updatedData.valorTransporte = {
          ...prevData.valorTransporte,
          [name === "transporteMin" ? "min" : "max"]: newValue,
        };
      } else if (name.includes("estoque")) {
        updatedData.valorEstoque = {
          ...prevData.valorEstoque,
          [name === "estoqueMin" ? "min" : "max"]: newValue,
        };
      }

      return updatedData;
    });
  };

  const handleAreaResponsavelChange = (event) => {
    const { value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      areaResposavel: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleAddNewAreaResponsavel = () => {
    if (!newArea.trim()) return;

    setAreaOptions((prevOptions) => [...prevOptions, newArea]);
    setFormData((prevData) => ({
      ...prevData,
      areaResposavel: [...prevData.areaResposavel, newArea],
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
      valorArmazenado: {
        max: Number(formData.valorArmazenado.max) || 0,
        min: Number(formData.valorArmazenado.min) || 0,
      },
      lastUpdate: new Date(),
    };

    if (!formattedQuestion.question.trim()) {
      alert("A pergunta não pode estar vazia!");
      return;
    }

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

        <div className="area-estado">
          <FormControl fullWidth margin="normal">
            <p sx={{ marginTop: "=10px" }}>Área Responsável</p>
            <Select
              name="areaResposavel"
              multiple
              size="small"
              value={formData.areaResposavel}
              onChange={handleAreaResponsavelChange}
              sx={{ width: "100%" }}
            >
              {areaOptions.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value="addNew">Adicionar nova área</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <p sx={{ marginBottom: "10px" }}>Estados que se aplica </p>
            <Select
              multiple
              size="small"
              sx={{ width: "100%" }}
              name="estados"
              value={formData.estados || []}
              onChange={handleChange}
            >
              {[
                "AC",
                "AL",
                "AP",
                "AM",
                "BA",
                "CE",
                "DF",
                "ES",
                "GO",
                "MA",
                "MT",
                "MS",
                "MG",
                "PA",
                "PB",
                "PR",
                "PE",
                "PI",
                "RJ",
                "RN",
                "RS",
                "RO",
                "RR",
                "SC",
                "SP",
                "SE",
                "TO",
              ].map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="area-estado">
          <FormControl fullWidth>
            <p sx={{ marginBottom: "10px" }}>Tipos de Lojas que se aplica </p>
            <Select
              multiple
              size="small"
              sx={{ width: "100%" }}
              name="tipoLoja"
              value={formData.tipoLoja || []}
              onChange={handleChange}
            >
              {[
                "LOJA ESTOQUE ZERO",
                "LOJA GALERIA PISO TÉRREO",
                "GALERIA PISO SUPERIOR",
                "LOJA RUA",
                "LOJA SHOP PISO TERREO",
                "LOJA SHOP PISO SUPERIOR",
              ].map((tipoLoja) => (
                <MenuItem key={tipoLoja} value={tipoLoja}>
                  {tipoLoja}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        {formData.areaResposavel.includes("addNew") && (
          <Box display="flex" alignItems="center">
            <TextField
              label="Nova Área Responsável"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              fullWidth
              size="small"
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
        <Accordion>
          <AccordionSummary
            expandIcon={<ChevronLeft />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={{
              width: "100%",
              backgroundColor: "#c4c4c4",
              borderRadius: "5px",
            }}
          >
            <Typography component="span">
              Valores de Armazenagem/Sinistro/Transporte/Estoque
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: "flex", gap: "10px" }}>
            <div className="value-storage">
              <h2>Valor Armazen.</h2>
              <TextField
                sx={{ width: "45%" }}
                label="Valor Min"
                type="number"
                name="storageMin"
                value={formData.valorArmazenado?.min || ""}
                onChange={(e) => handleChange(e, "valorArmazenado", "min")}
                margin="normal"
              />

              <TextField
                sx={{ width: "45%", marginLeft: "10px" }}
                label="Valor Max"
                type="number"
                name="storageMax"
                value={formData.valorArmazenado?.max || ""}
                onChange={(e) => handleChange(e, "valorArmazenado", "max")}
                margin="normal"
              />
            </div>

            <div className="value-storage">
              <h2>Valor Sinistro</h2>
              <TextField
                sx={{ width: "45%" }}
                label="Valor Min"
                type="number"
                name="sinistroMin"
                value={formData.valorSinistro?.min || ""}
                onChange={(e) => handleChange(e, "valorSinistro", "min")}
                margin="normal"
              />

              <TextField
                sx={{ width: "45%", marginLeft: "10px" }}
                label="Valor Max"
                type="number"
                name="sinistroMax"
                value={formData.valorSinistro?.max || ""}
                onChange={(e) => handleChange(e, "valorSinistro", "max")}
                margin="normal"
              />
            </div>

            <div className="value-storage">
              <h2>Valor Transporte</h2>
              <TextField
                sx={{ width: "45%" }}
                label="Valor Min"
                type="number"
                name="transporteMin"
                value={formData.valorTransporte?.min || ""}
                onChange={(e) => handleChange(e, "valorTransporte", "min")}
                margin="normal"
              />

              <TextField
                sx={{ width: "45%", marginLeft: "10px" }}
                label="Valor Max"
                type="number"
                name="transporteMax"
                value={formData.valorTransporte?.max || ""}
                onChange={(e) => handleChange(e, "valorTransporte", "max")}
                margin="normal"
              />
            </div>

            <div className="value-storage">
              <h2>Valor Estoque</h2>
              <TextField
                sx={{ width: "45%" }}
                label="Valor Min"
                type="number"
                name="estoqueMin"
                value={formData.valorEstoque?.min || ""}
                onChange={(e) => handleChange(e, "valorEstoque", "min")}
                margin="normal"
              />

              <TextField
                sx={{ width: "45%", marginLeft: "10px" }}
                label="Valor Max"
                type="number"
                name="estoqueMax"
                value={formData.valorEstoque?.max || ""}
                onChange={(e) => handleChange(e, "valorEstoque", "max")}
                margin="normal"
              />
            </div>
          </AccordionDetails>
        </Accordion>
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
        <Divider sx={{ padding: "10px 0px" }}>Status da pergunta</Divider>
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
        <Divider sx={{ padding: "10px 0px" }}>
          Configurações da pergunta
        </Divider>
        <Grid2
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-arround",
            width: "100%",
          }}
        >
          <Grid2
            sx={{ width: "50%", display: "flex", flexDirection: "column" }}
          >
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
                  checked={formData.isRequired}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prevData) => ({
                      ...prevData,
                      isRequired: checked ? true : false,
                    }));
                  }}
                  name="isRequired"
                />
              }
              label="Resposta Obrigatória?"
            />
          </Grid2>
          <Grid2
            sx={{ width: "50%", display: "flex", flexDirection: "column" }}
          >
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.inputImagesLibrary}
                  onChange={handleChange}
                  name="inputImagesLibrary"
                />
              }
              label="Possui upload de imagens da biblioteca?"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.multipleCheck}
                  onChange={handleChange}
                  name="multipleCheck"
                  disabled={!formData.listCheck}
                />
              }
              label="Possui multipla seleção?"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.inputNumber}
                  onChange={handleChange}
                  name="inputNumber"
                />
              }
              label="Possui campo quantitativo?"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.answers}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prevData) => ({
                      ...prevData,
                      answers: checked ? ["Sim", "Não", "N/A"] : "",
                    }));
                  }}
                  name="inputAnswers"
                />
              }
              label="Possui campo de escolha (Sim ou Não) ?"
            />
          </Grid2>
        </Grid2>
        <Divider sx={{ padding: "10px 0px" }}>*</Divider>
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
                      onClick={() => {
                        if (
                          window.confirm(
                            "Tem certeza que deseja deletar? Essa ação não poderá ser desfeita"
                          )
                        ) {
                          handleDeleteOption(option);
                        }
                      }}
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
          className="save-button"
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
