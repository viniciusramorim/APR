import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
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
import {
  Delete as DeleteIcon,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import MyModal from "../../components/Question/QuestionnaireForm";
import "../../pages/Questionarios/Question.css";
import Title from "../../components/Title";
import { FiMessageSquare } from "react-icons/fi";

const ChecklistManager = () => {
  const [checklists, setChecklists] = useState({});
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [selectedBloco, setSelectedBloco] = useState(null);
  const [openModal, setOpenModal] = useState(false);
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
        console.error("Error fetching checklists:", error);
      }
    };

    fetchChecklists();
  }, []);

  const handleChecklistClick = (checklistId) => {
    setSelectedChecklist(checklistId);
    setSelectedBloco(null);
  };

  const handleBlocoClick = (blocoId) => {
    setSelectedBloco(blocoId);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({
      ...question,
      selectedChecklist,
      selectedBloco,
    });
    setOpenModal(true);
  };

  const handleDeleteQuestion = async (checklistId, blocoId, questionId) => {
    try {
      if (!checklistId || !blocoId || !questionId) {
        console.error("Checklist, bloco ou pergunta inválida.");
        return;
      }

      // Filtra as perguntas removendo a que deve ser excluída
      const updatedQuestions = checklists[checklistId][blocoId].filter(
        (q) => q.questionId !== questionId
      );

      // Atualize o checklist no Firebase
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({
        [blocoId]: updatedQuestions,
      });

      // Atualize o estado local
      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: updatedQuestions,
        },
      }));

      console.log("Pergunta excluída com sucesso!");
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
      if (!checklistId || !blocoId) {
        console.error("Checklist ou bloco inválido.");
        return;
      }

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const questions = [...checklists[checklistId][blocoId]];

      if (newIndex < 0 || newIndex >= questions.length) return;

      const [movedQuestion] = questions.splice(currentIndex, 1);
      questions.splice(newIndex, 0, movedQuestion);

      const newChecklists = {
        ...checklists,
        [checklistId]: {
          ...checklists[checklistId],
          [blocoId]: questions,
        },
      };

      setChecklists(newChecklists);

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({
        [blocoId]: questions,
      });
    } catch (error) {
      console.error("Erro ao mover a pergunta:", error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingQuestion(null);
  };

  const handleModalSubmit = async (updatedData) => {
    try {
      if (!selectedChecklist || !selectedBloco) {
        console.error("Checklist ou bloco inválido.");
        return;
      }

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);

      if (editingQuestion) {
        const updatedQuestions = checklists[selectedChecklist][
          selectedBloco
        ].map((q) =>
          q.questionId === editingQuestion.questionId ? updatedData : q
        );
        await checklistRef.update({
          [selectedBloco]: updatedQuestions,
        });
      } else {
        await checklistRef.update({
          [selectedBloco]:
            firebase.firestore.FieldValue.arrayUnion(updatedData),
        });
      }

      setChecklists((prevChecklists) => {
        const newChecklists = { ...prevChecklists };
        if (editingQuestion) {
          newChecklists[selectedChecklist][selectedBloco] = newChecklists[
            selectedChecklist
          ][selectedBloco].map((q) =>
            q.questionId === editingQuestion.questionId ? updatedData : q
          );
        } else {
          newChecklists[selectedChecklist][selectedBloco].push(updatedData);
        }
        return newChecklists;
      });

      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar pergunta:", error);
    }
  };

  const handleDeleteBloco = async (blocoId) => {
    try {
      if (!selectedChecklist || !blocoId) {
        console.error("Checklist ou bloco inválido.");
        console.log(selectedChecklist);
        return;
      }

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);

      const updatedBlocos = { ...checklists[selectedChecklist] };
      delete updatedBlocos[blocoId];

      await checklistRef.update({
        [blocoId]: firebase.firestore.FieldValue.delete(),
      });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [selectedChecklist]: updatedBlocos,
      }));

      setSelectedBloco(null);
    } catch (error) {
      console.error("Erro ao excluir o bloco:", error);
    }
  };

  return (
    <div className="apr-digital">
      <Header />
      <div className="content">
        <Title name="Gerenciamento de Checklist">
          <FiMessageSquare size={25} onClick={() => console.log("")} />
        </Title>
        <div className="container">
          <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
              <Button
                color="success"
                variant="outlined"
                onClick={() => setOpenModal(true)}
                sx={{ mb: 2 }}
              >
                Adicionar Nova Pergunta
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
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteBloco(checklist)}
                              >
                                <DeleteIcon />
                              </IconButton>
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
                          </CardActions>
                        </Card>
                      </Grid>
                    )
                  )}
                </Grid>
              ) : !selectedBloco ? (
                <Box>
                  <div className="nav-header">
                    <Button
                      color="success"
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
                      .map(([blocoId, questions]) => (
                        <Grid item xs={12} sm={6} md={4} key={blocoId}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">
                                {blocoId}
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteBloco(blocoId)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {questions.length} perguntas
                              </Typography>
                            </CardContent>
                            <CardActions>
                              <Button
                                size="small"
                                onClick={() => handleBlocoClick(blocoId)}
                              >
                                Ver Perguntas
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Button onClick={() => setSelectedBloco(null)} sx={{ mb: 2 }}>
                    Voltar para Blocos
                  </Button>
                  <Typography variant="h5" gutterBottom>
                    {checklists[selectedChecklist].title || selectedChecklist} -{" "}
                    {selectedBloco}
                  </Typography>
                  <List>
                    {checklists[selectedChecklist][selectedBloco].map(
                      (question, index) => (
                        <ListItem
                          className="listQuest"
                          key={question.questionId}
                        >
                          <ListItemText primary={index + 1} />
                          <ListItemText secondary={question.question} />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
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
                          </ListItemSecondaryAction>
                        </ListItem>
                      )
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </Container>
        </div>
      </div>
      <MyModal
        open={openModal}
        handleClose={handleCloseModal}
        editingQuestion={editingQuestion}
        selectedChecklist={selectedChecklist}
        selectedBloco={selectedBloco}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ChecklistManager;
