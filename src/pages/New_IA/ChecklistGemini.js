import React, { useState, useEffect } from 'react';
import {
  Typography, Button, CircularProgress, Box, Card, CardContent,
  Stepper, Step, StepLabel, StepContent, Radio, RadioGroup,
  FormControlLabel, Chip, Paper, Divider, TextField,
  Dialog, DialogTitle, DialogContent, List, ListItem, ListItemIcon, ListItemText,
  IconButton
} from '@mui/material';
import CameraComponent from './CameraComponentIA';
import ReactMarkdown from 'react-markdown';
import { FiCamera, FiFile, FiTrash2, FiPlus, FiClipboard } from 'react-icons/fi';
import Header from '../../components/Header';
import Title from '../../components/Title';
import firebase from '../../services/firebaseConnection';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export default function ChecklistGemini() {
  const [imagens, setImagens] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [respostaChecklist, setRespostaChecklist] = useState('');
  const [respostasTexto, setRespostasTexto] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [respostasIA, setRespostasIA] = useState({});
  const [loadingIA, setLoadingIA] = useState({});
  const [comentariosIA, setComentariosIA] = useState({});
  const [modalSelecao, setModalSelecao] = useState({ open: false, campo: null, index: null });
  const [listChecklists, setListChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [started, setStarted] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);

  useEffect(() => {
    async function fetchChecklists() {
      try {
        const collections = await firebase.firestore().collection("question").get();
        // Filtrar apenas checklists ativos se houver a propriedade
        const checklists = collections.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chk => chk.ativo !== false && ["CT", "ERB", "PCI", "INDOOR", "OUTDOOR"].includes(chk.id));
        setListChecklists(checklists);
      } catch (error) {
        console.error("Erro ao buscar checklists:", error);
      }
    }
    fetchChecklists();
  }, []);

  const handleSelectChecklist = async (id) => {
    setLoading(true);
    try {
      setSelectedChecklist(id);
      const doc = await firebase.firestore().collection("question").doc(id).get();
      const data = doc.data();

      const { ativo, ...areas } = data;
      const orderedAreas = Object.entries(areas).sort((a, b) => a[0].localeCompare(b[0]));

      const allQuestionsList = [];
      let lastArea = null;
      orderedAreas.forEach(([areaName, areaQuestions]) => {
        if (Array.isArray(areaQuestions)) {
          areaQuestions.forEach(q => {
            allQuestionsList.push({
              ...q,
              area: areaName,
              campo: q.questionId,
              label: q.question,
              respGabarito: q.respGabarito || 'Sim',
              isFirstOfArea: areaName !== lastArea
            });
            lastArea = areaName;
          });
        }
      });

      setAllQuestions(allQuestionsList);

      const initImagens = {};
      const initPreviews = {};
      allQuestionsList.forEach(p => {
        if (p.inputImages === true) {
          initImagens[p.campo] = [];
          initPreviews[p.campo] = [];
        }
      });
      setImagens(initImagens);
      setPreviewUrls(initPreviews);
      setStarted(true);
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleImagemSelecionada = (file, campo, index) => {
    if (!file) return;

    setImagens(prev => {
      const current = [...(prev[campo] || [])];
      current[index] = file;
      return { ...prev, [campo]: current };
    });

    setPreviewUrls(prev => {
      const current = [...(prev[campo] || [])];
      if (current[index] && typeof current[index] === 'string' && current[index].startsWith('blob:')) {
        URL.revokeObjectURL(current[index]);
      }
      current[index] = URL.createObjectURL(file);
      return { ...prev, [campo]: current };
    });

    setModalSelecao({ open: false, campo: null, index: null });
  };

  const handleRemoverImagem = (campo, index) => {
    setImagens(prev => {
      const current = [...(prev[campo] || [])];
      current.splice(index, 1);
      return { ...prev, [campo]: current };
    });
    setPreviewUrls(prev => {
      const current = [...(prev[campo] || [])];
      if (current[index] && typeof current[index] === 'string' && current[index].startsWith('blob:')) {
        URL.revokeObjectURL(current[index]);
      }
      current.splice(index, 1);
      return { ...prev, [campo]: current };
    });
  };

  const analisarPergunta = async (pergunta, files) => {
    const key = pergunta.campo;
    try {
      setLoadingIA(prev => ({ ...prev, [key]: true }));

      const base64Array = await Promise.all(
        files.filter(Boolean).map(async (file) => {
          const base64 = await converterParaBase64(file);
          return base64.replace(/^data:image\/[a-z]+;base64,/, '');
        })
      );

      if (base64Array.length === 0) return;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "pergunta": {
          "area": pergunta.area,
          "question": pergunta.label,
          "resp": "",
          "respGabarito": pergunta.respGabarito,
          "respTextArea": ""
        },
        "imagesbase64": base64Array
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch("https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/process_security_question", requestOptions);
      const result = await response.text();

      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        parsedResult = { resp: result };
      }

      setRespostasIA(prev => ({ ...prev, [key]: parsedResult }));
      setComentariosIA(prev => ({ ...prev, [key]: parsedResult.respTextArea || "" }));

      // Preencher automaticamente a resposta manual baseada na análise da IA
      const respIA = (parsedResult.resp || parsedResult.resposta || "").toLowerCase();
      if (respIA.includes('sim')) {
        setRespostasTexto(prev => ({ ...prev, [key]: 'Sim' }));
      } else if (respIA.includes('não') || respIA.includes('nao')) {
        setRespostasTexto(prev => ({ ...prev, [key]: 'Não' }));
      }
    } catch (error) {
      console.error("Erro na análise da IA:", error);
      setRespostasIA(prev => ({ ...prev, [key]: { error: "Erro na análise" } }));
    } finally {
      setLoadingIA(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTextoChange = (e, campo) => {
    const novasRespostasTexto = { ...respostasTexto };
    novasRespostasTexto[campo] = e.target.value;
    setRespostasTexto(novasRespostasTexto);
  };

  const handleComentarioChange = (e, campo) => {
    setComentariosIA(prev => ({ ...prev, [campo]: e.target.value }));
  };

  const enviarImagensParaChecklist = async () => {
    try {
      setLoading(true);
      setRespostaChecklist('');

      // Consolidar as respostas da IA e manuais (editáveis)
      const resumo = allQuestions.map(pergunta => {
        const resManual = respostasTexto[pergunta.campo];
        const comManual = comentariosIA[pergunta.campo];

        return `### ${pergunta.label}
**Resposta:** ${resManual || 'Não respondido'}
**Justificativa:** ${comManual || 'Sem justificativa'}
`;
      }).join('\n---\n');

      setRespostaChecklist(resumo);

    } catch (err) {
      console.error(err);
      setRespostaChecklist('Erro ao consolidar resultados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const converterParaBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderInputImagem = (campo, label) => (
    <Box mb={2}>

      <Box display="flex" flexWrap="wrap" gap={{ xs: 1.5, sm: 2 }} mb={2}>
        {previewUrls[campo] && previewUrls[campo].map((url, index) => (
          url && (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: '120px',
                height: '120px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemoverImagem(campo, index)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  '&:hover': { bgcolor: '#ff4444', color: 'white' }
                }}
              >
                <FiTrash2 size={16} />
              </IconButton>
            </Box>
          )
        ))}

        {(!imagens[campo] || imagens[campo].filter(Boolean).length < 2) && (
          <Box
            onClick={() => setModalSelecao({ open: true, campo, index: (imagens[campo]?.length || 0) })}
            sx={{
              width: '120px',
              height: '120px',
              border: '2px dashed #aaa',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#666',
              '&:hover': { borderColor: '#1976d2', color: '#1976d2', bgcolor: '#f0f7ff' }
            }}
          >
            <FiPlus size={32} />
            <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold', textAlign: 'center', width: '100%', px: 1, display: 'block' }}>Adicionar Foto</Typography>
          </Box>
        )}
      </Box>

      {loadingIA[campo] && (
        <Box mb={2} display="flex" alignItems="center">
          <CircularProgress size={24} />
          <Typography variant="caption" ml={1}>Analisando pergunta...</Typography>
        </Box>
      )}

      {(loadingIA[campo] || respostasIA[campo]) && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            bgcolor: '#fafafa',
            borderLeft: `5px solid #1976d2`,
            borderRadius: '8px'
          }}
        >
          <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
              ANÁLISE E RESPOSTA
            </Typography>
            {loadingIA[campo] ? (
              <Chip icon={<CircularProgress size={16} />} label="ANALISANDO..." size="small" />
            ) : (
              <Chip label="CONCLUÍDO" color="success" size="small" variant="outlined" />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Resposta:
          </Typography>
          <RadioGroup
            row
            value={respostasTexto[campo] || ''}
            onChange={(e) => handleTextoChange(e, campo)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="Sim" control={<Radio color="success" />} label="Sim" />
            <FormControlLabel value="Não" control={<Radio color="error" />} label="Não" />
            <FormControlLabel value="N/A" control={<Radio />} label="N/A" />
          </RadioGroup>

          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Justificativa / Observação:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            size="small"
            value={comentariosIA[campo] || ''}
            onChange={(e) => handleComentarioChange(e, campo)}
            placeholder="A IA preencherá este campo, mas você pode editar..."
          />
        </Paper>
      )}
    </Box>
  );

  const renderInputRadio = (campo, label) => (
    <Box mb={2}>
      <RadioGroup row value={respostasTexto[campo] || ''} onChange={(e) => handleTextoChange(e, campo)}>
        <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
        <FormControlLabel value="Não" control={<Radio />} label="Não" />
        <FormControlLabel value="N/A" control={<Radio />} label="N/A" />
      </RadioGroup>
    </Box>
  );

  return (
    <div>
      <Header />
      <div className="content">
        <Title name="Checklist IA">
          <FiClipboard size={25} />
        </Title>
        <Box className="container" sx={{ maxWidth: '600px', width: '100%', margin: '0 auto', padding: { xs: '12px 8px', sm: '16px' } }}>

          {!started ? (
            <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Selecione o tipo de Checklist
              </Typography>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>Checklist</InputLabel>
                  <Select
                    value={selectedChecklist}
                    label="Checklist"
                    onChange={(e) => handleSelectChecklist(e.target.value)}
                    sx={{ borderRadius: '8px' }}
                  >
                    {listChecklists.map((chk) => (
                      <MenuItem key={chk.id} value={chk.id}>
                        {chk.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {loading && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress size={32} />
                  </Box>
                )}
              </Paper>
            </Box>
          ) : (
            <>
              <Stepper activeStep={activeStep} orientation="vertical">
                {allQuestions.map((pergunta, index) => (
                  <Step key={pergunta.campo}>
                    <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 600 } }}>
                      {pergunta.isFirstOfArea && (
                        <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                          {pergunta.area}
                        </Typography>
                      )}
                      {pergunta.label.split(':')[0]}
                    </StepLabel>
                    <StepContent sx={{ pr: { xs: 0, sm: 2 } }}>
                      {pergunta.inputImages === true ?
                        renderInputImagem(pergunta.campo, pergunta.label) :
                        renderInputRadio(pergunta.campo, pergunta.label)}
                      <Box
                        display="flex"
                        flexDirection={{ xs: 'column-reverse', sm: 'row' }}
                        justifyContent="space-between"
                        gap={{ xs: 1.5, sm: 2 }}
                        mt={3}
                      >
                        <Box display="flex" width={{ xs: '100%', sm: 'auto' }}>
                          {activeStep > 0 && (
                            <Button
                              onClick={handleBack}
                              variant="contained"
                              fullWidth
                            >
                              Voltar
                            </Button>
                          )}
                        </Box>
                        <Box
                          display="flex"
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          gap={1.5}
                          width={{ xs: '100%', sm: 'auto' }}
                        >
                          {pergunta.inputImages === true && (
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() => analisarPergunta(pergunta, imagens[pergunta.campo])}
                              disabled={loadingIA[pergunta.campo] || respostasIA[pergunta.campo] || !imagens[pergunta.campo] || imagens[pergunta.campo].filter(Boolean).length === 0}
                              fullWidth
                            >
                              {loadingIA[pergunta.campo] ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                              Analisar com IA
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            disabled={
                              (pergunta.inputImages === true && (loadingIA[pergunta.campo] || !respostasIA[pergunta.campo])) ||
                              !respostasTexto[pergunta.campo]
                            }
                            fullWidth
                          >
                            {index === (allQuestions.length - 1) ? 'Finalizar' : 'Próximo'}
                          </Button>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {activeStep === allQuestions.length && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Todas as perguntas foram respondidas. Enviar para análise.
                  </Typography>
                  <Button
                    onClick={enviarImagensParaChecklist}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    style={{ marginTop: '1rem' }}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Enviar para análise'}
                  </Button>
                </Box>
              )}

              {respostaChecklist && (
                <Box mt={4}>
                  <Typography variant="h5" gutterBottom>
                    Resultado do Checklist:
                  </Typography>
                  <Card>
                    <CardContent>
                      <Typography variant="body1" component="pre" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        <ReactMarkdown>{respostaChecklist}</ReactMarkdown>
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </>
          )}

          {/* Modal de Seleção de Origem da Imagem */}
          <Dialog
            open={modalSelecao.open}
            onClose={() => setModalSelecao({ ...modalSelecao, open: false })}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              Adicionar Imagem
            </DialogTitle>
            <DialogContent>
              <List sx={{ pt: 0 }}>
                <CameraComponent
                  onCapture={(file) => {
                    handleImagemSelecionada(file, modalSelecao.campo, modalSelecao.index);
                    setModalSelecao(prev => ({ ...prev, open: false }));
                  }}
                >
                  <ListItem
                    button
                    sx={{
                      py: 2,
                      border: '1px solid #eee',
                      borderRadius: 2,
                      mb: 1.5,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#1976d2', minWidth: 45 }}>
                      <FiCamera size={24} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tirar Foto"
                      secondary="Usar a câmera do dispositivo"
                    />
                  </ListItem>
                </CameraComponent>

                <label htmlFor="upload-button-modal" style={{ width: '100%', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="upload-button-modal"
                    onChange={(e) => {
                      handleImagemSelecionada(e.target.files[0], modalSelecao.campo, modalSelecao.index);
                      setModalSelecao(prev => ({ ...prev, open: false }));
                    }}
                  />
                  <ListItem
                    button
                    component="div"
                    sx={{
                      py: 2,
                      border: '1px solid #eee',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#4caf50', minWidth: 45 }}>
                      <FiFile size={24} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Escolher Arquivo"
                      secondary="Selecionar da galeria ou arquivos"
                    />
                  </ListItem>
                </label>
              </List>
            </DialogContent>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button onClick={() => setModalSelecao({ ...modalSelecao, open: false })} color="inherit">
                Cancelar
              </Button>
            </Box>
          </Dialog>
        </Box>
      </div>
    </div>
  );
}