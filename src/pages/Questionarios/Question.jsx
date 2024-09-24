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
  Switch,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward,
  ArrowDownward,
  ToggleOn,
  ToggleOff,
} from "@mui/icons-material";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import "../../pages/Questionarios/Question.css";
import Title from "../../components/Title";
import { FiMessageSquare } from "react-icons/fi";
import AddChecklist from "../../components/Question/AddCheck";
import AddBlock from "../../components/Question/AddBlock";
import QuestionnaireForm from "../../components/Question/QuestionnaireForm";

const ChecklistManager = () => {
  const [checklists, setChecklists] = useState({});
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [selectedBloco, setSelectedBloco] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openBlockModal, setOpenBlockModal] = useState(false); // Modal for adding block
  const [openQuestionModal, setOpenQuestionModal] = useState(false); // Modal for adding questions
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
    setEditingQuestion(question);
    setOpenModal(true);
  };

  const handleDeleteQuestion = async (checklistId, blocoId, questionId) => {
    try {
      const updatedQuestions = checklists[checklistId][blocoId].filter(
        (q) => q.questionId !== questionId
      );

      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({
        [blocoId]: updatedQuestions,
      });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: updatedQuestions,
        },
      }));
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setOpenBlockModal(false); // Close block modal
    setOpenQuestionModal(false); // Close question modal
    setEditingQuestion(null);
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
              <Title name="Qual Checklist deseja editar?">
                <FiMessageSquare size={25} onClick={() => console.log("")} />
              </Title>
              {!selectedChecklist ? (
                <Grid container spacing={2}>
                  {Object.entries(checklists).map(
                    ([checklistId, checklist]) => (
                      <Grid item xs={12} sm={6} md={4} key={checklistId}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">{checklistId}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {Object.keys(checklist).length} blocos
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
                  <AddChecklist />
                </Grid>
              ) : !selectedBloco ? (
                <Box>
                  <Button onClick={() => setSelectedChecklist(null)} sx={{ mb: 2 }}>
                    Voltar para Checklists
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenBlockModal(true)}
                    sx={{ mb: 2 }}
                  >
                    Adicionar Novo Bloco
                  </Button>
                  <div className="nav-header"></div>
                  <Typography variant="h5" gutterBottom>
                    {selectedChecklist}
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(checklists[selectedChecklist]).map(
                      ([blocoId, questions]) => (
                        <Grid item xs={12} sm={6} md={4} key={blocoId}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">{blocoId}</Typography>
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
                      )
                    )}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Button onClick={() => setSelectedBloco(null)} sx={{ mb: 2 }}>
                    Voltar para Blocos
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenQuestionModal(true)}
                    sx={{ mb: 2 }}
                  >
                    Criar Pergunta
                  </Button>
                  <Typography variant="h5" gutterBottom>
                    {selectedChecklist} - {selectedBloco}
                  </Typography>
                  {/* Render active and inactive questions here */}
                </Box>
              )}
            </Box>
          </Container>
        </div>
      </div>

      {/* Modals for adding blocks and questions */}
      <AddBlock open={openBlockModal} handleClose={handleCloseModal} />
      <QuestionnaireForm
        open={openQuestionModal}
        handleClose={handleCloseModal}
        selectedChecklist={selectedChecklist}
        selectedBloco={selectedBloco}
      />
    </div>
  );
};

export default ChecklistManager;
