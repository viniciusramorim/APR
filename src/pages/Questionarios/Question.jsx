import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  AddRounded,
  ArrowBackRounded,
  ArrowDownward,
  ArrowUpward,
  CategoryRounded,
  CheckCircleRounded,
  ChecklistRounded,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  DragIndicatorRounded,
  Edit as EditIcon,
  RadioButtonUncheckedRounded,
  TaskAltRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import ChecklistModal from "../../components/Question/ChecklistModal";
import BlocoModal from "../../components/Question/BlocoModal";
import QuestionModal from "../../components/Question/QuestionModal";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter";
import "./Question.scss";

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
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const maxTitleLength = 20;

  const showAlert = (message, severity = "success") => {
    setAlert({ open: true, message, severity });
  };

  const fetchChecklists = useCallback(async () => {
    try {
      const value = await getUser(user.uid);
      const userChecklistPermission = value.data().checklist || [];
      const snapshot = await firebase.firestore().collection("question").get();
      const data = {};

      snapshot.forEach((doc) => {
        if (userChecklistPermission.includes(doc.id)) {
          data[doc.id] = doc.data();
        }
      });

      setChecklists(data);
    } catch (error) {
      console.error("Erro ao buscar checklists:", error);
      showAlert("Erro ao buscar checklists.", "error");
    }
  }, [getUser, user.uid]);

  useEffect(() => {
    addBodyClass("page-questions");
  }, []);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const clearFields = () => {
    setEditingChecklist(null);
    setEditingBloco(null);
    setEditingQuestion(null);
    setSelectedBloco(null);
    setSelectedBlocoTitle("");
  };

  const exportChecklistReportXLSX = (checklistId) => {
    try {
      const checklist = checklists[checklistId];
      if (!checklist) {
        showAlert("Checklist nao encontrado.", "error");
        return;
      }

      const worksheetData = [
        [
          "Checklist",
          "Bloco",
          "Pergunta",
          "Peso",
          "Area",
          "Tipo",
          "Opcoes",
          "Area Responsavel",
          "Estados",
          "Option List",
          "Valor Estoque Min",
          "Valor Estoque Max",
          "Valor Sinistro Min",
          "Valor Sinistro Max",
          "Valor Armazenamento Min",
          "Valor Armazenamento Max",
          "Valor Transporte Min",
          "Valor Transporte Max",
          "Ultima Atualizacao",
        ],
      ];

      Object.entries(checklist).forEach(([key, value]) => {
        if (key === "title" || key === "ativo") {
          return;
        }

        const blocoTitle = value.title || key;

        if (Array.isArray(value)) {
          value.forEach((question) => {
            worksheetData.push([
              checklist.title || checklistId,
              blocoTitle,
              question.question || "",
              question.peso || "",
              question.area || "",
              question.type || "",
              question.options ? question.options.join(", ") : "",
              question.areaResposavel ? question.areaResposavel.toString() : "",
              question.estados ? question.estados.toString() : "",
              question.optionList ? question.optionList.toString() : "",
              question.valorEstoque ? question.valorEstoque.min : "",
              question.valorEstoque ? question.valorEstoque.max : "",
              question.valorSinistro ? question.valorSinistro.min : "",
              question.valorSinistro ? question.valorSinistro.max : "",
              question.valorArmazenado ? question.valorArmazenado.min : "",
              question.valorArmazenado ? question.valorArmazenado.max : "",
              question.valorTransporte ? question.valorTransporte.min : "",
              question.valorTransporte ? question.valorTransporte.max : "",
              question.lastUpdate
                ? new Date(question.lastUpdate.seconds * 1000).toLocaleString("pt-BR")
                : "",
            ]);
          });
        }
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Checklist");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `checklist_${checklistId}_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Checklist ${checklistId} exportado com sucesso.`);
      logSistem(`Relatorio do checklist "${checklistId}" foi exportado em XLSX`);
    } catch (error) {
      console.error("Erro ao exportar relatorio XLSX:", error);
      showAlert("Erro ao exportar relatorio XLSX.", "error");
    }
  };

  const exportAllChecklistsReportXLSX = () => {
    try {
      const worksheetData = [
        [
          "Checklist",
          "Status",
          "Bloco",
          "Pergunta",
          "Area",
          "Tipo",
          "Opcoes",
          "Valor Estoque Min",
          "Valor Estoque Max",
          "Valor Sinistro Min",
          "Valor Sinistro Max",
          "Valor Armazenamento Min",
          "Valor Armazenamento Max",
          "Valor Transporte Min",
          "Valor Transporte Max",
          "Ultima Atualizacao",
        ],
      ];

      Object.entries(checklists).forEach(([checklistId, checklist]) => {
        Object.entries(checklist).forEach(([key, value]) => {
          if (key === "title" || key === "ativo") {
            return;
          }

          const blocoTitle = value.title || key;

          if (Array.isArray(value)) {
            value.forEach((question) => {
              worksheetData.push([
                checklist.title || checklistId,
                checklist.ativo ? "Ativo" : "Inativo",
                blocoTitle,
                question.question || "",
                question.area || "",
                question.type || "",
                question.options ? question.options.join(", ") : "",
                question.valorEstoque ? question.valorEstoque.min : "",
                question.valorEstoque ? question.valorEstoque.max : "",
                question.valorSinistro ? question.valorSinistro.min : "",
                question.valorSinistro ? question.valorSinistro.max : "",
                question.valorArmazenado ? question.valorArmazenado.min : "",
                question.valorArmazenado ? question.valorArmazenado.max : "",
                question.valorTransporte ? question.valorTransporte.min : "",
                question.valorTransporte ? question.valorTransporte.max : "",
                question.lastUpdate
                  ? new Date(question.lastUpdate.seconds * 1000).toLocaleString("pt-BR")
                  : "",
              ]);
            });
          }
        });
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Checklists");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_completo_checklists_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert("Relatorio completo exportado com sucesso.");
      logSistem("Relatorio completo de todos os checklists foi exportado em XLSX");
    } catch (error) {
      console.error("Erro ao exportar relatorio completo XLSX:", error);
      showAlert("Erro ao exportar relatorio completo XLSX.", "error");
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
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
      showAlert(
        "Checklist e bloco devem ser selecionados antes de adicionar uma pergunta.",
        "warning"
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
    const blocoTitle = checklists[selectedChecklist]?.[blocoId]?.title || blocoId;
    setSelectedBloco(blocoId);
    setSelectedBlocoTitle(blocoTitle);
  };

  const handleSaveChecklist = async (checklist) => {
    try {
      const checklistId = checklist.title
        ? checklist.title.replace(/-/g, " ").toUpperCase().slice(0, maxTitleLength)
        : "NOME_PADRAO";

      const checklistRef = firebase.firestore().collection("question").doc(checklistId);
      const checklistData = { title: checklist.title };

      if (editingChecklist) {
        Object.entries(checklists[editingChecklist.id]).forEach(([blocoId, blocoData]) => {
          if (blocoId !== "title") {
            checklistData[blocoId] = blocoData;
          }
        });
      }

      await checklistRef.set(checklistData, { merge: true });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: checklistData,
      }));

      setOpenChecklistModal(false);
      clearFields();
      showAlert(editingChecklist ? "Checklist atualizado." : "Checklist criado com sucesso.");
      logSistem(
        editingChecklist
          ? `Checklist "${checklistId}" foi atualizado`
          : `Checklist "${checklistId}" foi criado`
      );
    } catch (error) {
      console.error("Erro ao salvar o checklist:", error);
      showAlert("Erro ao salvar o checklist.", "error");
    }
  };

  const handleSaveQuestion = async (question) => {
    try {
      if (!selectedChecklist || !selectedBloco) {
        showAlert(
          "Checklist e bloco devem ser selecionados antes de adicionar uma pergunta.",
          "warning"
        );
        return;
      }

      if (
        !question.question ||
        question.question.trim() === "" ||
        !question.area ||
        question.area.trim() === ""
      ) {
        showAlert("A pergunta e a area nao podem estar vazias.", "warning");
        return;
      }

      const checklistRef = firebase.firestore().collection("question").doc(selectedChecklist);
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
      showAlert(editingQuestion ? "Pergunta atualizada." : "Pergunta criada com sucesso.");
      logSistem(
        `Pergunta "${question.question}" foi editada no bloco "${selectedBloco}" do checklist "${selectedChecklist}"`
      );
    } catch (error) {
      console.error("Erro ao salvar a pergunta:", error);
      showAlert("Erro ao salvar a pergunta.", "error");
    }
  };

  const handleDeleteBloco = async (blocoId) => {
    try {
      if (!selectedChecklist || !blocoId) {
        showAlert("Checklist ou bloco invalido.", "warning");
        return;
      }

      const checklistRef = firebase.firestore().collection("question").doc(selectedChecklist);
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
      showAlert("Bloco removido com sucesso.");
      logSistem(`Bloco "${blocoId}" foi excluido do checklist "${selectedChecklist}"`);
    } catch (error) {
      console.error("Erro ao excluir o bloco:", error);
      showAlert("Erro ao excluir o bloco.", "error");
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setOpenQuestionModal(true);
  };

  const handleDeleteQuestion = async (checklistId, blocoId, questionId) => {
    try {
      const updatedBlocoData = checklists[checklistId][blocoId].filter(
        (q) => q.questionId !== questionId
      );

      const checklistRef = firebase.firestore().collection("question").doc(checklistId);
      await checklistRef.update({ [blocoId]: updatedBlocoData });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: updatedBlocoData,
        },
      }));

      showAlert("Pergunta excluida com sucesso.");
      logSistem(
        `Pergunta "${questionId}" foi excluida do bloco "${blocoId}" do checklist "${checklistId}"`
      );
    } catch (error) {
      console.error("Erro ao excluir a pergunta:", error);
      showAlert("Erro ao excluir a pergunta.", "error");
    }
  };

  const moveQuestion = async (checklistId, blocoId, currentIndex, direction) => {
    try {
      let blocoData = [...checklists[checklistId][blocoId]];
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= blocoData.length) {
        return;
      }

      [blocoData[currentIndex], blocoData[newIndex]] = [
        blocoData[newIndex],
        blocoData[currentIndex],
      ];

      blocoData = blocoData.map((q, index) => ({ ...q, order: index + 1 }));

      const checklistRef = firebase.firestore().collection("question").doc(checklistId);
      await checklistRef.update({ [blocoId]: blocoData });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: {
          ...prevChecklists[checklistId],
          [blocoId]: blocoData,
        },
      }));

      showAlert(`Pergunta movida para ${direction === "up" ? "cima" : "baixo"}.`);
    } catch (error) {
      console.error("Erro ao mover a pergunta:", error);
      showAlert("Erro ao mover a pergunta.", "error");
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este checklist? Essa acao e irreversivel."
      )
    ) {
      return;
    }

    try {
      await firebase.firestore().collection("question").doc(checklistId).delete();

      setChecklists((prevChecklists) => {
        const updatedChecklists = { ...prevChecklists };
        delete updatedChecklists[checklistId];
        return updatedChecklists;
      });

      clearFields();
      showAlert("Checklist excluido com sucesso.");
      logSistem(`Checklist (${checklistId}) foi excluido`);
    } catch (error) {
      console.error("Erro ao excluir o checklist:", error);
      showAlert("Erro ao excluir o checklist.", "error");
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
        ? bloco.title.toUpperCase().slice(0, maxTitleLength)
        : "BLOCO PADRAO";

      const checklistRef = firebase.firestore().collection("question").doc(selectedChecklist);
      const blocoData = checklists[selectedChecklist]?.[editingBloco?.id] || [];

      if (editingBloco) {
        await checklistRef.update({
          [editingBloco.id]: firebase.firestore.FieldValue.delete(),
        });
      }

      await checklistRef.set({ [blocoTitle]: blocoData }, { merge: true });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [selectedChecklist]: {
          ...prevChecklists[selectedChecklist],
          [blocoTitle]: blocoData,
        },
      }));

      setOpenBlocoModal(false);
      clearFields();
      showAlert(editingBloco ? "Bloco atualizado." : "Bloco criado com sucesso.");
      logSistem(
        `Bloco "${blocoTitle}" foi ${editingBloco ? "editado" : "criado"} no checklist "${selectedChecklist}"`
      );
    } catch (error) {
      console.error("Erro ao salvar o bloco:", error);
      showAlert("Erro ao salvar o bloco.", "error");
    }
  };

  const handleEditChecklist = (checklistId) => {
    const checklistData = checklists[checklistId];
    setEditingChecklist({ id: checklistId, ...checklistData });
    setOpenChecklistModal(true);
  };

  const handleActivateChecklist = async (checklistId) => {
    try {
      const checklistRef = firebase.firestore().collection("question").doc(checklistId);
      await checklistRef.update({ ativo: true });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: { ...prevChecklists[checklistId], ativo: true },
      }));

      showAlert("Checklist ativado.");
      logSistem(`Checklist "${checklistId}" foi ativado`);
    } catch (error) {
      console.error("Erro ao ativar o checklist:", error);
      showAlert("Erro ao ativar o checklist.", "error");
    }
  };

  const handleDeactivateChecklist = async (checklistId) => {
    try {
      const checklistRef = firebase.firestore().collection("question").doc(checklistId);
      await checklistRef.update({ ativo: false });

      setChecklists((prevChecklists) => ({
        ...prevChecklists,
        [checklistId]: { ...prevChecklists[checklistId], ativo: false },
      }));

      showAlert("Checklist desativado.");
      logSistem(`Checklist "${checklistId}" foi desativado`);
    } catch (error) {
      console.error("Erro ao desativar o checklist:", error);
      showAlert("Erro ao desativar o checklist.", "error");
    }
  };

  const checklistEntries = Object.entries(checklists);
  const totalChecklists = checklistEntries.length;
  const totalBlocks = checklistEntries.reduce(
    (acc, [, checklist]) =>
      acc +
      Object.keys(checklist).filter((key) => key !== "title" && key !== "ativo").length,
    0
  );
  const totalQuestions = checklistEntries.reduce((acc, [, checklist]) => {
    const checklistQuestionCount = Object.entries(checklist)
      .filter(([key]) => key !== "title" && key !== "ativo")
      .reduce(
        (sum, [, blocoData]) => sum + (Array.isArray(blocoData) ? blocoData.length : 0),
        0
      );

    return acc + checklistQuestionCount;
  }, 0);

  const currentChecklist = selectedChecklist ? checklists[selectedChecklist] : null;
  const currentChecklistTitle =
    currentChecklist?.title || selectedChecklist || "Questionarios";
  const currentBlocks = currentChecklist
    ? Object.entries(currentChecklist).filter(
        ([key]) => key !== "title" && key !== "ativo"
      )
    : [];
  const currentQuestions =
    selectedChecklist &&
    selectedBloco &&
    Array.isArray(checklists[selectedChecklist]?.[selectedBloco])
      ? checklists[selectedChecklist][selectedBloco]
      : [];

  return (
    <div className="apr-digital">
      <Header
        name="Questionarios"
        subtitle="Gerencie checklists, blocos e perguntas da plataforma"
      />

      <div className="content">
        <Container maxWidth="xl" className="questions-shell">
          <section className="questions-hero">
            <div className="questions-hero-copy">
              <span className="questions-eyebrow">APR DIGITAL</span>
              <h1 className="questions-title">Central de questionarios</h1>
              <p className="questions-subtitle">
                Organize checklists, estruture blocos e mantenha as perguntas da operacao
                em um fluxo mais claro, enxuto e profissional.
              </p>
            </div>

            <div className="questions-hero-aside">
              <Chip
                className="questions-chip-primary"
                icon={<ChecklistRounded />}
                label={`${totalChecklists} checklist(s)`}
              />
              <Chip icon={<CategoryRounded />} label={`${totalBlocks} bloco(s)`} />
              <Chip icon={<TaskAltRounded />} label={`${totalQuestions} pergunta(s)`} />
            </div>
          </section>

          <section className="questions-toolbar">
            <div className="questions-toolbar-copy">
              <h2 className="questions-section-title">
                {!selectedChecklist
                  ? "Gerenciar estrutura"
                  : !selectedBloco
                  ? currentChecklistTitle
                  : selectedBlocoTitle}
              </h2>
              <p className="questions-section-subtitle">
                {!selectedChecklist
                  ? "Crie novos checklists, acompanhe a ativacao e exporte a estrutura cadastrada."
                  : !selectedBloco
                  ? "Selecione um bloco para administrar as perguntas e ajustar a organizacao."
                  : "Revise o texto, a ordem e os metadados de cada pergunta deste bloco."}
              </p>

              {(selectedChecklist || selectedBloco) && (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  className="questions-breadcrumb"
                >
                  <Chip size="small" label="Checklists" onClick={() => setSelectedChecklist(null)} />
                  {selectedChecklist && (
                    <Chip size="small" color="secondary" label={currentChecklistTitle} />
                  )}
                  {selectedBloco && (
                    <Chip
                      size="small"
                      color="secondary"
                      variant="outlined"
                      label={selectedBlocoTitle}
                    />
                  )}
                </Stack>
              )}
            </div>

            <div className="questions-toolbar-actions">
              <Button
                variant="contained"
                className="questions-primary-button"
                startIcon={<AddRounded />}
                onClick={
                  selectedChecklist
                    ? selectedBloco
                      ? handleAddQuestion
                      : handleAddBloco
                    : handleAddChecklist
                }
              >
                {!selectedChecklist
                  ? "Novo checklist"
                  : !selectedBloco
                  ? "Novo bloco"
                  : "Nova pergunta"}
              </Button>

              <Button
                variant="outlined"
                className="questions-secondary-button"
                startIcon={
                  selectedChecklist || selectedBloco ? <ArrowBackRounded /> : <DownloadIcon />
                }
                onClick={
                  selectedBloco
                    ? () => setSelectedBloco(null)
                    : selectedChecklist
                    ? () => setSelectedChecklist(null)
                    : handleExportMenuOpen
                }
              >
                {selectedBloco
                  ? "Voltar para blocos"
                  : selectedChecklist
                  ? "Voltar para checklists"
                  : "Opcoes de exportacao"}
              </Button>

              <Button
                variant="outlined"
                className="questions-secondary-button"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  selectedChecklist
                    ? exportChecklistReportXLSX(selectedChecklist)
                    : exportAllChecklistsReportXLSX()
                }
              >
                {selectedChecklist ? "Exportar checklist" : "Exportar tudo"}
              </Button>
            </div>

            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem
                onClick={() => {
                  exportAllChecklistsReportXLSX();
                  handleExportMenuClose();
                }}
              >
                Exportar todos os checklists (XLSX)
              </MenuItem>
            </Menu>
          </section>

          {!selectedChecklist ? (
            <section className="questions-board">
              <Grid container spacing={2.5}>
                {checklistEntries.map(([checklistId, checklist]) => {
                  const blockEntries = Object.entries(checklist).filter(
                    ([key]) => key !== "title" && key !== "ativo"
                  );
                  const questionCount = blockEntries.reduce(
                    (sum, [, blocoData]) => sum + (Array.isArray(blocoData) ? blocoData.length : 0),
                    0
                  );

                  return (
                    <Grid size={{ xs: 12, md: 6, xl: 4 }} key={checklistId}>
                      <Card className="questions-card">
                        <CardContent className="questions-card-content">
                          <div className="questions-card-top">
                            <div>
                              <Typography className="questions-card-title" variant="h6">
                                {checklist.title || checklistId}
                              </Typography>
                              <Typography className="questions-card-id" variant="body2">
                                ID: {checklistId}
                              </Typography>
                            </div>
                            <Chip
                              size="small"
                              className={
                                checklist.ativo
                                  ? "questions-status-chip is-active"
                                  : "questions-status-chip is-inactive"
                              }
                              icon={
                                checklist.ativo ? (
                                  <CheckCircleRounded />
                                ) : (
                                  <RadioButtonUncheckedRounded />
                                )
                              }
                              label={checklist.ativo ? "Ativo" : "Inativo"}
                            />
                          </div>

                          <div className="questions-stat-grid">
                            <div className="questions-stat-item">
                              <span className="questions-stat-label">Blocos</span>
                              <strong>{blockEntries.length}</strong>
                            </div>
                            <div className="questions-stat-item">
                              <span className="questions-stat-label">Perguntas</span>
                              <strong>{questionCount}</strong>
                            </div>
                          </div>
                        </CardContent>

                        <Divider />

                        <Box className="questions-card-actions">
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<VisibilityRounded />}
                            onClick={() => handleChecklistClick(checklistId)}
                          >
                            Abrir
                          </Button>
                          <IconButton
                            aria-label="exportar checklist"
                            onClick={() => exportChecklistReportXLSX(checklistId)}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            aria-label="editar checklist"
                            onClick={() => handleEditChecklist(checklistId)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            aria-label="excluir checklist"
                            color="error"
                            onClick={() => handleDeleteChecklist(checklistId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <Button
                            size="small"
                            variant={checklist.ativo ? "outlined" : "contained"}
                            color={checklist.ativo ? "warning" : "success"}
                            onClick={() =>
                              checklist.ativo
                                ? handleDeactivateChecklist(checklistId)
                                : handleActivateChecklist(checklistId)
                            }
                          >
                            {checklist.ativo ? "Desativar" : "Ativar"}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </section>
          ) : !selectedBloco ? (
            <section className="questions-board">
              <div className="questions-context-header">
                <div>
                  <h3 className="questions-context-title">{currentChecklistTitle}</h3>
                  <p className="questions-context-subtitle">
                    {currentBlocks.length} bloco(s) disponivel(is) neste checklist.
                  </p>
                </div>
                <Chip icon={<CategoryRounded />} label={`${currentBlocks.length} bloco(s)`} />
              </div>

              <Grid container spacing={2.5}>
                {currentBlocks.map(([blocoId, blocoData]) => (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={blocoId}>
                    <Card className="questions-card">
                      <CardContent className="questions-card-content">
                        <Typography className="questions-card-title" variant="h6">
                          {blocoData.title || blocoId}
                        </Typography>
                        <Typography className="questions-card-id" variant="body2">
                          Chave: {blocoId}
                        </Typography>

                        <div className="questions-stat-grid single">
                          <div className="questions-stat-item">
                            <span className="questions-stat-label">Perguntas</span>
                            <strong>{Array.isArray(blocoData) ? blocoData.length : 0}</strong>
                          </div>
                        </div>
                      </CardContent>

                      <Divider />

                      <Box className="questions-card-actions">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityRounded />}
                          onClick={() => handleBlocoClick(blocoId)}
                        >
                          Ver perguntas
                        </Button>
                        <IconButton aria-label="editar bloco" onClick={() => handleEditBloco(blocoId)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="excluir bloco"
                          color="error"
                          onClick={() => handleDeleteBloco(blocoId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </section>
          ) : (
            <section className="questions-board">
              <div className="questions-context-header">
                <div>
                  <h3 className="questions-context-title">{selectedBlocoTitle}</h3>
                  <p className="questions-context-subtitle">
                    {currentQuestions.length} pergunta(s) cadastrada(s) neste bloco.
                  </p>
                </div>
                <Chip icon={<TaskAltRounded />} label={`${currentQuestions.length} pergunta(s)`} />
              </div>

              <div className="questions-list">
                {currentQuestions.map((question, index) => (
                  <article key={question.questionId} className="questions-list-item">
                    <div className="questions-list-order">
                      <DragIndicatorRounded fontSize="small" />
                      <span>{index + 1}</span>
                    </div>

                    <div className="questions-list-content">
                      <div className="questions-list-heading">
                        <h4>{question.question}</h4>
                        <div className="questions-list-meta">
                          {question.area && <Chip size="small" label={question.area} />}
                          {question.type && (
                            <Chip size="small" variant="outlined" label={question.type} />
                          )}
                          {question.isRequired && (
                            <Chip
                              size="small"
                              color="warning"
                              variant="outlined"
                              label="Obrigatoria"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="questions-list-actions">
                      <IconButton
                        aria-label="editar pergunta"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="mover pergunta para cima"
                        onClick={() =>
                          moveQuestion(selectedChecklist, selectedBloco, index, "up")
                        }
                        disabled={index === 0}
                      >
                        <ArrowUpward />
                      </IconButton>
                      <IconButton
                        aria-label="mover pergunta para baixo"
                        onClick={() =>
                          moveQuestion(selectedChecklist, selectedBloco, index, "down")
                        }
                        disabled={index === currentQuestions.length - 1}
                      >
                        <ArrowDownward />
                      </IconButton>
                      <IconButton
                        aria-label="excluir pergunta"
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
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </Container>
      </div>

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

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ChecklistManager;
