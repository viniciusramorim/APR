import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Container,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import ChecklistModal from "../../components/Question/ChecklistModal";
import BlocoModal from "../../components/Question/BlocoModal";
import QuestionModal from "../../components/Question/QuestionModal";
import "../../pages/Questionarios/Question.scss";

const ChecklistManager = () => {
  const [checklists, setChecklists] = useState({});
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [selectedBloco, setSelectedBloco] = useState(null);
  const [selectedBlocoTitle, setSelectedBlocoTitle] = useState("");

  const [openChecklistModal, setOpenChecklistModal] = useState(false);
  const [openBlocoModal, setOpenBlocoModal] = useState(false);
  const [openQuestionModal, setOpenQuestionModal] = useState(false);

  const [editingChecklist, setEditingChecklist] = useState(null);
  const [editingBloco, setEditingBloco] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const checklistsRef = firebase.firestore().collection("question");
        const snapshot = await checklistsRef.get();
        const data = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setChecklists(data);
      } catch (error) {
        console.error("Erro ao buscar checklists:", error);
      }
    };
    fetchChecklists();
  }, []);

  const clearFields = () => {
    setEditingChecklist(null);
    setEditingBloco(null);
    setEditingQuestion(null);
    setSelectedBloco(null);
    setSelectedBlocoTitle("");
  };

  const handleAddChecklist = () => {
    setEditingChecklist(null);
    setOpenChecklistModal(true);
  };

  const handleAddBloco = () => {
    setEditingBloco(null);
    setOpenBlocoModal(true);
  };

  const handleAddQuestion = () => {
    if (!selectedChecklist || !selectedBloco) {
      console.error(
        "Checklist e Bloco devem ser selecionados antes de adicionar uma pergunta."
      );
      return;
    }
    setEditingQuestion(null);
    setOpenQuestionModal(true);
  };

  const handleChecklistClick = (checklistId) => {
    setSelectedChecklist(checklistId);
    setSelectedBloco(null);
    setSelectedBlocoTitle("");
  };

  const handleBlocoClick = (blocoId) => {
    const blocoTitle =
      checklists[selectedChecklist]?.[blocoId]?.title || blocoId;
    setSelectedBloco(blocoId);
    setSelectedBlocoTitle(blocoTitle);
    console.log("Bloco selecionado:", blocoTitle);
  };

  const handleSaveChecklist = async (checklist) => {
    try {
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklist.id);

      const emptyChecklist = {};
      await checklistRef.set(emptyChecklist, { merge: true });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklist.id]: emptyChecklist,
      }));

      setOpenChecklistModal(false);
      clearFields();
    } catch (error) {
      console.error("Erro ao salvar o checklist:", error);
    }
  };

  const handleSaveBloco = async (bloco) => {
    try {
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);

      const blocoData = checklists[selectedChecklist]?.[bloco.title] || [];

      await checklistRef.set(
        {
          [bloco.title]: blocoData,
        },
        { merge: true }
      );

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [selectedChecklist]: {
          ...prevChecklists[selectedChecklist],
          [bloco.title]: blocoData,
        },
      }));

      setOpenBlocoModal(false);
      clearFields();
    } catch (error) {
      console.error("Erro ao salvar o bloco:", error);
    }
  };

  const handleSaveQuestion = async (question) => {
    try {
      if (!selectedChecklist || !selectedBloco) {
        console.error(
          "Checklist e Bloco devem ser selecionados antes de adicionar uma pergunta."
        );
        return;
      }

      if (
        !question.question ||
        question.question.trim() === "" ||
        !question.area ||
        question.area.trim() === ""
      ) {
        console.error("A pergunta ou área não podem estar vazias!");
        return;
      }

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);

      let updatedBlocoData = checklists[selectedChecklist][selectedBloco] || [];

      if (!Array.isArray(updatedBlocoData)) {
        updatedBlocoData = [];
      }

      if (editingQuestion) {
        const questionIndex = updatedBlocoData.findIndex(
          (q) => q.questionId === editingQuestion.questionId
        );
        if (questionIndex !== -1) {
          updatedBlocoData[questionIndex] = {
            ...editingQuestion,
            ...question,
            lastUpdate: new Date(),
          };
        }
      } else {
        updatedBlocoData = [
          ...updatedBlocoData,
          {
            ...question,
            questionId: new Date().getTime().toString(),
            order: updatedBlocoData.length + 1,
            lastUpdate: new Date(),
          },
        ];
      }

      await checklistRef.update({ [`${selectedBloco}`]: updatedBlocoData });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [selectedChecklist]: {
          ...prevChecklists[selectedChecklist],
          [selectedBloco]: updatedBlocoData,
        },
      }));

      setOpenQuestionModal(false);
      clearFields();
    } catch (error) {
      console.error("Erro ao salvar a pergunta:", error);
    }
  };

  const handleDeleteBloco = async (blocoId) => {
    try {
      if (!selectedChecklist || !blocoId) {
        console.error("Checklist ou bloco inválido.");
        return;
      }
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);
      await checklistRef.update({
        [blocoId]: firebase.firestore.FieldValue.delete(),
      });

      setChecklists((prevChecklists) => {
        const updatedChecklists = { ...prevChecklists };
        delete updatedChecklists[selectedChecklist][blocoId];
        return updatedChecklists;
      });
      setSelectedBloco(null);
      setSelectedBlocoTitle("");
    } catch (error) {
      console.error("Erro ao excluir o bloco:", error);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setOpenQuestionModal(true);
  };

  const handleDeleteQuestion = async (checklistId, blocoId, questionId) => {
    try {
      let updatedBlocoData = checklists[checklistId][blocoId].filter(
        (q) => q.questionId !== questionId
      );

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({ [blocoId]: updatedBlocoData });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: updatedBlocoData,
        },
      }));

      console.log(`Pergunta excluída com sucesso do bloco ${blocoId}`);
    } catch (error) {
      console.error("Erro ao excluir a pergunta:", error);
    }
  };

  const moveQuestion = async (
    checklistId,
    blocoId,
    currentIndex,
    direction
  ) => {
    try {
      let blocoData = [...checklists[checklistId][blocoId]];
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= blocoData.length) return;

      [blocoData[currentIndex], blocoData[newIndex]] = [
        blocoData[newIndex],
        blocoData[currentIndex],
      ];

      blocoData = blocoData.map((q, index) => ({ ...q, order: index + 1 }));

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({ [blocoId]: blocoData });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: blocoData,
        },
      }));

      console.log(
        `Pergunta movida para ${direction === "up" ? "cima" : "baixo"}`
      );
    } catch (error) {
      console.error("Erro ao mover a pergunta:", error);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este checklist? Essa ação é irreversível."
      )
    ) {
      try {
        await firebase
          .firestore()
          .collection("question")
          .doc(checklistId)
          .delete();
        setChecklists((prevChecklists) => {
          const updatedChecklists = { ...prevChecklists };
          delete updatedChecklists[checklistId];
          return updatedChecklists;
        });
        console.log(`Checklist ${checklistId} excluído com sucesso!`);
        clearFields();
      } catch (error) {
        console.error("Erro ao excluir o checklist:", error);
      }
    }
  };

  return (
    <div className="apr-digital">
      <Header />
      <div className="content">
        <Title name="Gerenciamento de Checklist" />
        <div className="container">
          <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
              <Button
                color="success"
                variant="outlined"
                onClick={handleAddChecklist}
                sx={{ mb: 2 }}
              >
                Adicionar Novo Checklist
              </Button>
              {!selectedChecklist ? (
                <Grid container spacing={2}>
                  {Object.entries(checklists).map(
                    ([checklistId, checklist]) => (
                      <Grid item xs={12} sm={6} md={4} key={checklistId}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">
                              {checklist.title || checklistId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {
                                Object.keys(checklist).filter(
                                  (key) => key !== "title"
                                ).length
                              }{" "}
                              blocos
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              onClick={() => handleChecklistClick(checklistId)}
                            >
                              Ver Detalhes
                            </Button>
                            <IconButton
                              aria-label="delete"
                              color="error"
                              onClick={() => handleDeleteChecklist(checklistId)} // Adiciona a funcionalidade de excluir checklist completo
                            >
                              <DeleteIcon />
                            </IconButton>
                          </CardActions>
                        </Card>
                      </Grid>
                    )
                  )}
                </Grid>
              ) : !selectedBloco ? (
                <Box>
                  <div className="button-header">
                    <Button
                      color="success"
                      variant="outlined"
                      onClick={handleAddBloco}
                      sx={{ mb: 2 }}
                    >
                      Adicionar Novo Bloco
                    </Button>
                    <Button
                      color="secondary"
                      variant="outlined"
                      onClick={() => setSelectedChecklist(null)}
                      sx={{ mb: 2 }}
                    >
                      Voltar para Checklists
                    </Button>
                  </div>
                  <Typography variant="h5" gutterBottom>
                    {checklists[selectedChecklist].title || selectedChecklist}
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(checklists[selectedChecklist])
                      .filter(([key]) => key !== "title")
                      .map(([blocoId, blocoData]) => (
                        <Grid item xs={12} sm={6} md={4} key={blocoId}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">
                                {blocoData.title || blocoId}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {
                                  Object.keys(blocoData).filter(
                                    (key) => key !== "title"
                                  ).length
                                }{" "}
                                perguntas
                              </Typography>
                            </CardContent>
                            <CardActions>
                              <Button
                                size="small"
                                onClick={() => handleBlocoClick(blocoId)}
                              >
                                Ver Perguntas
                              </Button>
                              <IconButton
                                aria-label="delete"
                                color="error"
                                onClick={() => handleDeleteBloco(blocoId)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Button
                    color="success"
                    variant="outlined"
                    onClick={handleAddQuestion}
                    sx={{ mb: 2 }}
                  >
                    Adicionar Nova Pergunta
                  </Button>
                  <Button
                    color="secondary"
                    variant="outlined"
                    onClick={() => setSelectedBloco(null)}
                    sx={{ mb: 2 }}
                  >
                    Voltar para Blocos
                  </Button>
                  <Typography variant="h5" gutterBottom>
                    {checklists[selectedChecklist].title || selectedChecklist} -{" "}
                    {selectedBlocoTitle}
                  </Typography>
                  <List>
                    {Array.isArray(
                      checklists[selectedChecklist][selectedBloco]
                    ) &&
                      checklists[selectedChecklist][selectedBloco]
                        .sort((a, b) => a.order - b.order) // Ordena pelo campo `order`
                        .map((question, index) => (
                          <ListItem key={question.questionId}>
                            <ListItemText primary={index + 1} />
                            <ListItemText secondary={question.question} />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="move up"
                                onClick={() =>
                                  moveQuestion(
                                    selectedChecklist,
                                    selectedBloco,
                                    index,
                                    "up"
                                  )
                                }
                                disabled={index === 0}
                              >
                                <ArrowUpward />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="move down"
                                onClick={() =>
                                  moveQuestion(
                                    selectedChecklist,
                                    selectedBloco,
                                    index,
                                    "down"
                                  )
                                }
                                disabled={
                                  index ===
                                  checklists[selectedChecklist][selectedBloco]
                                    .length -
                                    1
                                }
                              >
                                <ArrowDownward />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                color="error"
                                onClick={() =>
                                  handleDeleteQuestion(
                                    selectedChecklist,
                                    selectedBloco,
                                    question.questionId
                                  )
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                  </List>
                </Box>
              )}
            </Box>
          </Container>
        </div>
      </div>

      {/* Modais para adicionar ou editar */}
      <ChecklistModal
        open={openChecklistModal}
        onClose={() => setOpenChecklistModal(false)}
        onSave={handleSaveChecklist}
        checklist={editingChecklist}
      />

      <BlocoModal
        open={openBlocoModal}
        onClose={() => setOpenBlocoModal(false)}
        onSave={handleSaveBloco}
        bloco={editingBloco}
      />

      <QuestionModal
        open={openQuestionModal}
        onClose={() => setOpenQuestionModal(false)}
        onSave={handleSaveQuestion}
        question={editingQuestion}
        selectedChecklist={selectedChecklist}
        selectedBloco={selectedBloco}
        selectedBlocoTitle={selectedBlocoTitle}
      />
    </div>
  );
};

export default ChecklistManager;
