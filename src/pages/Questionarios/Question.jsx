import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth";
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
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";

const ChecklistManager = () => {
  const { user, logSistem, getUser } = useContext(AuthContext);

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

  const max_title_length = 20;

  const fetchChecklists = async () => {
    getUser(user.uid).then(async value => {
      try {
        const userChecklistPermission = value.data().checklist
        const checklistsRef = firebase.firestore().collection("question");
        const snapshot = await checklistsRef.get();
        const data = {};
        snapshot.forEach((doc) => {
          if (userChecklistPermission.includes(doc.id)) {
            data[doc.id] = doc.data();
          }
        });
        setChecklists(data);
      } catch (err) {
        console.error("Erro ao buscar checklists:", err);
      }
    });

  };

  useEffect(() => {
    addBodyClass("page-questions");
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
      alert.error(
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
      const checklistId = checklist.title
        ? checklist.title.replace(/-/g, " ").toUpperCase().slice(0, max_title_length)
        : "NOME_PADRÃO";

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);

      await checklistRef.set({}, { merge: true });


      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {},
      }));

      setOpenChecklistModal(false);
      clearFields();
      logSistem(`Checklist "${checklistId}" foi criado`);
    } catch (error) {
      console.error("Erro ao salvar o checklist:", error);
    }
  };

  // const handleSaveBloco = async (bloco) => {
  //   try {
  //     const blocoTitle = bloco.title
  //       ? bloco.title.toUpperCase().slice(0, max_title_length)
  //       : "BLOCO PADRÃO";

  //     const checklistRef = firebase
  //       .firestore()
  //       .collection("question")
  //       .doc(selectedChecklist);

  //     const blocoData = checklists[selectedChecklist]?.[blocoTitle] || [];

  //     await checklistRef.set(
  //       {
  //         [blocoTitle]: blocoData,
  //       },
  //       { merge: true }
  //     );

  //     setChecklists((prevChecklists) => ({
  //       ...prevChecklists,
  //       [selectedChecklist]: {
  //         ...prevChecklists[selectedChecklist],
  //         [blocoTitle]: blocoData,
  //       },
  //     }));

  //     setOpenBlocoModal(false);
  //     clearFields();
  //     logSistem(`Bloco "${blocoTitle}" foi criado no checklist "${selectedChecklist}"`);
  //   } catch (error) {
  //     console.error("Erro ao salvar o bloco:", error);
  //   }
  // };

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
        alert("A pergunta ou área não podem estar vazias!");
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
      logSistem(`Pergunta "${question.question}" foi editada no bloco "${selectedBloco}" do checklist "${selectedChecklist}"`);
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
      logSistem(`Bloco "${blocoId}" foi excluído do checklist "${selectedChecklist}"`);
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
      logSistem(`Pergunta "${questionId.questionId}" foi excluída do bloco "${blocoId}" do checklist "${checklistId}"`);
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

      alert(
        `Pergunta ${currentIndex} movida para ${direction === "up" ? "cima" : "baixo"}`
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
        logSistem(`Checklist (${checklistId}) foi excluído`);
      } catch (error) {
        console.error("Erro ao excluir o checklist:", error);
      }
    }
  };

  const handleEditBloco = (blocoId) => {
    const blocoData = checklists[selectedChecklist][blocoId];
    setEditingBloco({ id: blocoId, ...blocoData });
    setOpenBlocoModal(true);
  };

  const handleSaveBloco = async (bloco) => {
    try {
      const blocoTitle = bloco.title
        ? bloco.title.toUpperCase().slice(0, max_title_length)
        : "BLOCO PADRÃO";
  
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(selectedChecklist);
  
      const blocoData = checklists[selectedChecklist]?.[editingBloco?.id] || [];
  
      if (editingBloco) {
        await checklistRef.update({
          [editingBloco.id]: firebase.firestore.FieldValue.delete(),
        });
      }
  
      await checklistRef.set(
        {
          [blocoTitle]: blocoData,
        },
        { merge: true }
      );
  
      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [selectedChecklist]: {
          ...prevChecklists[selectedChecklist],
          [blocoTitle]: blocoData,
        },
      }));
  
      setOpenBlocoModal(false);
      clearFields();
      logSistem(`Bloco "${blocoTitle}" foi ${editingBloco ? "editado" : "criado"} no checklist "${selectedChecklist}"`);
    } catch (error) {
      console.error("Erro ao salvar o bloco:", error);
    }
  };

  return (
    <div className="apr-digital">
      <Header />
      <div className="content">
        <Title name="Gerenciamento de Checklist" />
        <div className="container">
          <Container maxWidth="xl">
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
                      <Grid className="card-check" key={checklistId}>
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
                              onClick={() => handleDeleteChecklist(checklistId)}
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
                        <Grid className="card-block" key={blocoId}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" 
                                // onClick={() => {
                                //   console.log(checklists[selectedChecklist]['2 - Segurança Interna'])
                                //   console.log(checklists[selectedChecklist]['4 - Proposta de Internalização'])

                                //   const checklistsRef = firebase.firestore().collection("question");
                                //   checklistsRef.doc(selectedChecklist).update({
                                //     '1 - Matriz de Risco': checklists[selectedChecklist]['2 - Segurança Interna'],
                                //     '2 - Proposta de estoque avançado': checklists[selectedChecklist]['4 - Proposta de Internalização']
                                //   })}}
                                  >
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
                                aria-label="edit"
                                onClick={() => handleEditBloco(blocoId)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                aria-label="delete"
                                color="error"
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir este bloco?')) {
                                  handleDeleteBloco(blocoId)}}}
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
                  <div className="button-header">
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
                  </div>
                  <Typography variant="h5" gutterBottom>
                    {checklists[selectedChecklist].title || selectedChecklist} -{" "}
                    {selectedBlocoTitle}
                  </Typography>
                  <List className="question-box">
                    {Array.isArray(
                      checklists[selectedChecklist][selectedBloco]
                    ) &&
                      checklists[selectedChecklist][selectedBloco]
                        .map((question, index) => (
                          <ListItem
                            key={question.questionId}
                            className="list-question"
                          >
                            <ListItemText
                              primary={index + 1}
                              className="item-index"
                            />
                            <ListItemText
                              secondary={question.question}
                              className="item-question"
                            />
                            <ListItemSecondaryAction
                              className="btn-comand"
                            >
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
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir esta pergunta?')) {
                                    handleDeleteQuestion(
                                      selectedChecklist,
                                      selectedBloco,
                                      question.questionId
                                    )
                                  }
                                }}
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
