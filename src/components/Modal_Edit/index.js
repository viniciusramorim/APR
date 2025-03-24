import React, { useState } from "react";
import {
  Grid,
  TextField,
  Modal,
  Button,
  Box,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import firebase from "../../services/firebaseConnection";
import { FiEdit } from "react-icons/fi";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  height: 500,
  overflowY: "scroll",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function ModalEdit(props) {
  const {
    id,
    areaIndex,
    questionIndex,
    checklistCompleto,
    loadApr,
    logSistem,
  } = props;

  const [open, setOpen] = useState(false);
  
  const [questionResp, setQuestionResp] = useState(
    checklistCompleto[areaIndex][1][questionIndex].resp
  );

  const [questionComentario, setQuestionComentario] = useState(
    checklistCompleto[areaIndex][1][questionIndex].respTextArea
  );

  const [uploading, setUploading] = useState(false);

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);

      const storageRef = firebase.storage().ref(`images/${id}/${file.name}`);
      storageRef.put(file).then(() => {
        storageRef.getDownloadURL().then((url) => {
          const updatedChecklist = [...checklistCompleto];
          if (!updatedChecklist[areaIndex][1][questionIndex].imagesURL) {
            updatedChecklist[areaIndex][1][questionIndex].imagesURL = [];
          }
          updatedChecklist[areaIndex][1][questionIndex].imagesURL.push(url);

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
    checklistCompleto[areaIndex][1][questionIndex].resp = questionResp;
    checklistCompleto[areaIndex][1][questionIndex].respTextArea =
      questionComentario;
    firebase
      .firestore()
      .collection("aprs-producao")
      .doc(id)
      .update({
        checklist: checklistCompleto,
      })
      .then(() => {
        console.log("update question");
        logSistem(
          `A QUESTÃO ${
            checklistCompleto[areaIndex][1][questionIndex].questionId
          } DO CHECKLIST ${checklistCompleto[
            areaIndex
          ][0].toUpperCase()} FOI ALTERADO `,
          id
        );
      })
      .catch((err) => console.log(err));
    loadApr();
    handleClose();
  };

  return (
    <>
      <label className="Edit">
        <a onClick={() => handleOpen()}>
          <FiEdit></FiEdit>{questionResp ? 'Editar' : 'Responder'}
        </a>
      </label>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{}}
      >
        <Box sx={style}>
          <Grid container spacing={2} textAlign={"right"}>
            <Grid item xs={12} md={12}>
              <Button
                size="small"
                color="error"
                variant="contained"
                onClick={handleClose}
              >
                X
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} marginTop={0.5}>
            <Grid item xs={12} md={12}>
              {checklistCompleto[areaIndex][1][questionIndex].question}
            </Grid>
            <Grid item xs={12} md={12}>
              <FormControl>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  value={questionResp}
                  onChange={(e) => setQuestionResp(e.target.value)}
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel
                    value="Sim"
                    control={<Radio />}
                    label="Sim"
                  />
                  <FormControlLabel
                    value="Não"
                    control={<Radio />}
                    label="Não"
                  />
                  <FormControlLabel value="N/A" control={<Radio />} label="N/A" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12}>
              {checklistCompleto[areaIndex][1][questionIndex]
                .respInputNumber && (
                <TextField
                  fullWidth
                  type="number"
                  label="Quantidade"
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
                />
              )}
            </Grid>
            <Grid item xs={12} md={12}>
              {checklistCompleto[areaIndex][1][questionIndex].imagesURL?.map(
                (image, index) => {
                  const imageUrl =
                    typeof image === "string" ? image : image.url;
                  return (
                    <div key={index}>
                      <img
                        src={imageUrl}
                        alt="Uploaded"
                        style={{ maxWidth: "200px" }}
                      />
                      <Button
                        color="error"
                        variant="contained"
                        size="small"
                        sx={{ marginTop: "-25px", marginLeft: "5px" }}
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
                      >
                        X
                      </Button>
                    </div>
                  );
                }
              )}
              <Grid item xs={12} md={12}>
                <input
                  accept="image/*"
                  id="upload-button"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleUploadImage}
                />
                <label htmlFor="upload-button">
                  <label htmlFor="upload-button">
                    <Button
                      component="span"
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      disabled={uploading}
                      sx={{ marginTop: "20px" }}
                    >
                      {uploading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Upload Imagem"
                      )}
                    </Button>
                  </label>
                </label>
              </Grid>
            </Grid>
            <Grid item xs={12} md={12}>
              <FormControl fullWidth>
                {checklistCompleto[areaIndex][1][questionIndex].optionList && (
                  <FormControl component="fieldset">
                    {checklistCompleto[areaIndex][1][
                      questionIndex
                    ].optionList.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        control={
                          <Checkbox
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
                      />
                    ))}
                  </FormControl>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                id="outlined-multiline-static"
                label="Comentario"
                multiline
                rows={4}
                value={questionComentario}
                onChange={(e) => setQuestionComentario(e.target.value)}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} marginTop={0.5} textAlign={"left"}>
            <Grid item xs={3} md={3}>
              <Button
                size="small"
                color="secondary"
                variant="outlined"
                onClick={concluirEdit}
              >
                Editar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
