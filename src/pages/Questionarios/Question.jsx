import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Paper,
  Container,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  DragIndicator,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import firebase from "../../services/firebaseConnection";

const ChecklistManager = () => {
  const [checklists, setChecklists] = useState({});
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  const [expandedBloco, setExpandedBloco] = useState(null);

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
    setExpandedChecklist(
      expandedChecklist === checklistId ? null : checklistId
    );
    setExpandedBloco(null);
  };

  const handleBlocoClick = (blocoId) => {
    setExpandedBloco(expandedBloco === blocoId ? null : blocoId);
  };

  const moveQuestion = async (
    checklistId,
    blocoId,
    currentIndex,
    direction
  ) => {
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

    try {
      const checklistRef = firebase
        .firestore()
        .collection("question")
        .doc(checklistId);
      await checklistRef.update({
        [blocoId]: questions,
      });
    } catch (error) {
      console.error("Error updating question order:", error);
      setChecklists(checklists);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciador de Checklists
        </Typography>
        <Paper elevation={3}>
          <List>
            {Object.entries(checklists).map(([checklistId, checklist]) => (
              <React.Fragment key={checklistId}>
                <ListItem
                  button
                  onClick={() => handleChecklistClick(checklistId)}
                >
                  <ListItemText primary={checklistId} />
                  {expandedChecklist === checklistId ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  )}
                </ListItem>
                <Collapse
                  in={expandedChecklist === checklistId}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {Object.entries(checklist).map(([blocoId, questions]) => (
                      <React.Fragment key={blocoId}>
                        <ListItem
                          button
                          sx={{ pl: 4 }}
                          onClick={() => handleBlocoClick(blocoId)}
                        >
                          <ListItemText primary={blocoId} />
                          {expandedBloco === blocoId ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </ListItem>
                        <Collapse
                          in={expandedBloco === blocoId}
                          timeout="auto"
                          unmountOnExit
                        >
                          <List component="div" disablePadding>
                            {questions.map((question, index) => (
                              <ListItem
                                key={question.questionId}
                                sx={{ pl: 6 }}
                              >
                                <IconButton size="small" sx={{ mr: 1 }}>
                                  <DragIndicator />
                                </IconButton>
                                <ListItemText primary={question.question} />
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    moveQuestion(
                                      checklistId,
                                      blocoId,
                                      index,
                                      "up"
                                    )
                                  }
                                  disabled={index === 0}
                                >
                                  <ArrowUpward />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    moveQuestion(
                                      checklistId,
                                      blocoId,
                                      index,
                                      "down"
                                    )
                                  }
                                  disabled={index === questions.length - 1}
                                >
                                  <ArrowDownward />
                                </IconButton>
                              </ListItem>
                            ))}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default ChecklistManager;
