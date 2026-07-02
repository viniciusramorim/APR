import React, { useState } from "react";
import {
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  OutlinedInput,
  Divider,
  Paper,
  IconButton,
  Stack,
  alpha,
} from "@mui/material";
import { Close as CloseIcon, Edit as EditIcon, Image as ImageIcon } from "@mui/icons-material";
import firebase from "../../services/firebaseConnection";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-toastify";

const areasDisponiveis = ['oem', 'patrimonio', 'CMC', 'comercial', 'logistica']; 

export default function ModalEdit(props) {
  const {
    id,
    areaIndex,
    questionIndex,
    questionId,
    checklistCompleto,
    loadApr,
    logSistem,
  } = props;

  const [open, setOpen] = useState(false);
  const [questionResp, setQuestionResp] = useState(
    checklistCompleto[areaIndex][1][questionIndex].resp
  );
  const [questionAnswers, setQuestionAnswers] = useState(
    checklistCompleto[areaIndex][1][questionIndex].answers
  );
  const [questionComentario, setQuestionComentario] = useState(
    checklistCompleto[areaIndex][1][questionIndex].respTextArea
  );
  const [questionArea, setQuestionArea] = useState(
    checklistCompleto[areaIndex][1][questionIndex].areaResposavel || []
  );
  const [uploading, setUploading] = useState(false);

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const today = new Date();
      const threeDaysAgo = new Date(today.setDate(today.getDate() - 3));

      if (!file.lastModifiedDate || file.lastModifiedDate < threeDaysAgo) {
        toast.error('A imagem tem mais de 3 dias ou não possui data válida.');
        return;
      }

      setUploading(true);

      const storageRef = firebase.storage().ref(`images/${id}/${[areaIndex]}/${questionId}/${file.name}`);
      storageRef.put(file).then(() => {
        storageRef.getDownloadURL().then((url) => {
          const updatedChecklist = [...checklistCompleto];
          if (!updatedChecklist[areaIndex][1][questionIndex].imagesURL) {
            updatedChecklist[areaIndex][1][questionIndex].imagesURL = [];
          }
          updatedChecklist[areaIndex][1][questionIndex].imagesURL.push({
            ref: storageRef.fullPath,
            url: url
          });

          firebase
            .firestore()
            .collection("aprs-producao")
            .doc(id)
            .update({
              checklist: updatedChecklist,
            })
            .then(() => {
              loadApr();
              setUploading(false);
            })
            .catch((err) => {
              console.log(err);
              setUploading(false);
            });
        });
      });
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const concluirEdit = () => {
    // Agora faz as alterações
    checklistCompleto[areaIndex][1][questionIndex].resp = questionResp;
    checklistCompleto[areaIndex][1][questionIndex].respTextArea = questionComentario;
    checklistCompleto[areaIndex][1][questionIndex].areaResposavel = questionArea;

    firebase
      .firestore()
      .collection("aprs-producao")
      .doc(id)
      .update({
        checklist: checklistCompleto,
      })
      .then(() => {
        toast.success("Update na questão realizado com sucesso!");
        logSistem(
          `A QUESTÃO ${checklistCompleto[areaIndex][1][questionIndex].questionId} DO CHECKLIST ${checklistCompleto[areaIndex][0].toUpperCase()} FOI ALTERADO `,
          id
        );
      })
      .catch((err) => console.log("Erro no update:", err));

    loadApr();
    handleClose();
  };

  return (
    <>
      <label className="Edit">
        <a onClick={() => handleOpen()}>
          <FiEdit></FiEdit>Editar
        </a>
        <a>{`( ${questionArea} )`}</a>
      </label>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#ffffff",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EditIcon />
            Editar Questão
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, backgroundColor: "#ffffff" }}>
          <Stack spacing={3}>
            {/* Título da Questão */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                Questão
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha("#667eea", 0.05),
                  borderLeft: "4px solid #667eea",
                }}
              >
                <Typography variant="body1">
                  {checklistCompleto[areaIndex][1][questionIndex].question}
                </Typography>
              </Paper>
            </Box>

            <Divider />

            {/* Resposta Radio Group */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: 1.5,
                }}
              >
                Resposta
              </Typography>
              <FormControl>
                <RadioGroup
                  row
                  value={questionResp}
                  onChange={(e) => setQuestionResp(e.target.value)}
                  sx={{ gap: 2 }}
                >
                  <FormControlLabel
                    value="Sim"
                    control={<Radio size="small" />}
                    label="Sim"
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    value="Não"
                    control={<Radio size="small" />}
                    label="Não"
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    value="N/A"
                    control={<Radio size="small" />}
                    label="N/A"
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    value=""
                    control={<Radio size="small" />}
                    label="Remover"
                    sx={{ m: 0 }}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Input de Quantidade */}
            {checklistCompleto[areaIndex][1][questionIndex]
              .respInputNumber && (
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                size="small"
                value={
                  checklistCompleto[areaIndex][1][questionIndex]
                    .respInputNumber
                }
                onChange={(e) => {
                  const updatedChecklist = [...checklistCompleto];
                  updatedChecklist[areaIndex][1][
                    questionIndex
                  ].respInputNumber = e.target.value;
                  firebase
                    .firestore()
                    .collection("aprs-producao")
                    .doc(id)
                    .update({
                      checklist: updatedChecklist,
                    })
                    .then(() => {
                      console.log("update respInputNumber");
                      loadApr();
                    });
                }}
                variant="outlined"
              />
            )}

            {/* Imagens */}
            {checklistCompleto[areaIndex][1][questionIndex].imagesURL &&
              checklistCompleto[areaIndex][1][questionIndex].imagesURL.length >
                0 && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "text.secondary",
                      mb: 1.5,
                    }}
                  >
                    Imagens Anexadas
                  </Typography>
                  <Grid container spacing={1}>
                    {checklistCompleto[areaIndex][1][questionIndex].imagesURL.map(
                      (image, index) => {
                        const imageUrl =
                          typeof image === "string" ? image : image.url;
                        return (
                          <Grid item xs={6} key={index}>
                            <Paper
                              elevation={2}
                              sx={{
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: 1,
                                aspectRatio: "1",
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt="Uploaded"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={async () => {
                                  try {
                                    const storageRef = firebase
                                      .storage()
                                      .refFromURL(imageUrl);
                                    await storageRef.delete();

                                    const updatedChecklist = [...checklistCompleto];
                                    updatedChecklist[areaIndex][1][
                                      questionIndex
                                    ].imagesURL = updatedChecklist[areaIndex][1][
                                      questionIndex
                                    ].imagesURL.filter((_, i) => i !== index);

                                    await firebase
                                      .firestore()
                                      .collection("aprs-producao")
                                      .doc(id)
                                      .update({
                                        checklist: updatedChecklist,
                                      });

                                    console.log("Image deleted");
                                    loadApr();
                                  } catch (err) {
                                    console.error("Error deleting image:", err);
                                  }
                                }}
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  "&:hover": {
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                  },
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          </Grid>
                        );
                      }
                    )}
                  </Grid>
                </Box>
              )}

            {/* Upload Imagem */}
            <Box>
              <input
                accept="image/png, image/jpeg"
                id="upload-button"
                type="file"
                style={{ display: "none" }}
                onChange={handleUploadImage}
              />
              <label htmlFor="upload-button" style={{ width: "100%" }}>
                <Button
                  component="span"
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={
                    uploading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ImageIcon />
                    )
                  }
                  disabled={uploading}
                  sx={{ textTransform: "none" }}
                >
                  {uploading ? "Enviando..." : "Upload Imagem"}
                </Button>
              </label>
            </Box>

            {/* Option List Checkboxes */}
            {checklistCompleto[areaIndex][1][questionIndex].optionList && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1.5,
                  }}
                >
                  Opções
                </Typography>
                <FormControl component="fieldset">
                  <Stack spacing={1}>
                    {checklistCompleto[areaIndex][1][
                      questionIndex
                    ].optionList.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        control={
                          <Checkbox
                            size="small"
                            checked={
                              Array.isArray(
                                checklistCompleto[areaIndex][1][questionIndex]
                                  .optionListResp
                              )
                                ? checklistCompleto[areaIndex][1][
                                  questionIndex
                                ].optionListResp.includes(option)
                                : false
                            }
                            onChange={(e) => {
                              const updatedChecklist = [...checklistCompleto];
                              const currentOptions =
                                updatedChecklist[areaIndex][1][questionIndex]
                                  .optionListResp || [];

                              if (e.target.checked) {
                                updatedChecklist[areaIndex][1][
                                  questionIndex
                                ].optionListResp = [...currentOptions, option];
                              } else {
                                updatedChecklist[areaIndex][1][
                                  questionIndex
                                ].optionListResp = currentOptions.filter(
                                  (item) => item !== option
                                );
                              }

                              firebase
                                .firestore()
                                .collection("aprs-producao")
                                .doc(id)
                                .update({
                                  checklist: updatedChecklist,
                                })
                                .then(() => {
                                  console.log("Opção da lista atualizada");
                                  loadApr();
                                });
                            }}
                          />
                        }
                        label={option}
                        sx={{ m: 0 }}
                      />
                    ))}
                  </Stack>
                </FormControl>
              </Box>
            )}

            <Divider />

            {/* Comentário */}
            <TextField
              fullWidth
              label="Comentário"
              multiline
              rows={4}
              value={questionComentario}
              onChange={(e) => setQuestionComentario(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="Adicione um comentário aqui..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                },
              }}
            />

            {/* Área Responsável */}
            <FormControl fullWidth size="small">
              <InputLabel id="area-label">Área Responsável</InputLabel>
              <Select
                labelId="area-label"
                id="area-select"
                multiple
                value={questionArea}
                onChange={(e) => setQuestionArea(e.target.value)}
                input={<OutlinedInput id="select-multiple-chip" label="Área Responsável" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        variant="outlined"
                        sx={{
                          textTransform: "capitalize",
                          backgroundColor: alpha("#667eea", 0.1),
                          borderColor: "#667eea",
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {areasDisponiveis.map((area) => (
                  <MenuItem
                    sx={{ textTransform: "capitalize" }}
                    key={area}
                    value={area}
                  >
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={concluirEdit}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}