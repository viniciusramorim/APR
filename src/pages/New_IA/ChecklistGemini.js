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
import { FiCamera, FiFile, FiTrash2, FiPlus } from 'react-icons/fi';

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

  useEffect(() => {
    const initImagens = {};
    const initPreviews = {};
    perguntasComFotos.forEach(p => {
      initImagens[p.campo] = [];
      initPreviews[p.campo] = [];
    });
    setImagens(initImagens);
    setPreviewUrls(initPreviews);
  }, []);

  const perguntasComFotos = [
    { 
      campo: 'medidorEnergia', 
      label: 'O medidor de energia possui grade de proteção com cadeado e porta cadeado tipo boca de lobo?',
      area: 'Segurança Perimetral Externa ou Interna',
      respGabarito: 'Sim'
    },
    { 
      campo: 'portaoFrontal', 
      label: 'Foi identificada avarias no portão do estacionamento e/ou de pedestres?',
      area: 'Acessos',
      respGabarito: 'Não'
    },
    { 
      campo: 'perimetro', 
      label: 'Foi identificada avarias nos muros ou alambrados?',
      area: 'Perímetro',
      respGabarito: 'Não'
    },
    { 
      campo: 'protecaoMuro', 
      label: 'Foi identificado a presença de cerca Elétrica, Concertina ou outros tipos de proteção?',
      area: 'Perímetro',
      respGabarito: 'Sim'
    },
    { 
      campo: 'fechadura', 
      label: 'A fechadura ou cadeado do portão está em boas condições e operante?',
      area: 'Acessos',
      respGabarito: 'Sim'
    }
  ];

  const perguntasSemFotos = [];

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
      const resumo = perguntasComFotos.map(pergunta => {
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
      <Typography variant="h6" gutterBottom>{label}</Typography>
      
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
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
            <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold' }}>Adicionar Foto</Typography>
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
            p: 2, 
            mb: 2, 
            bgcolor: '#fafafa', 
            borderLeft: `5px solid #1976d2`
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
      <Typography variant="h6">{label}</Typography>
      <RadioGroup row value={respostasTexto[campo] || ''} onChange={(e) => handleTextoChange(e, campo)}>
        <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
        <FormControlLabel value="Não" control={<Radio />} label="Não" />
        <FormControlLabel value="N/A" control={<Radio />} label="N/A" />
      </RadioGroup>
    </Box>
  );

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Checklist (Gemini)
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {perguntasComFotos.concat(perguntasSemFotos).map((pergunta, index) => (
          <Step key={pergunta.campo}>
            <StepLabel>{pergunta.label.split(':')[0]}</StepLabel>
            <StepContent>
              {perguntasComFotos.some(p => p.campo === pergunta.campo) ?
                renderInputImagem(pergunta.campo, pergunta.label) :
                renderInputRadio(pergunta.campo, pergunta.label)}
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Box>
                  {activeStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="contained"
                      sx={{ mr: 1 }}
                    >
                      Voltar
                    </Button>
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  {perguntasComFotos.some(p => p.campo === pergunta.campo) && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => analisarPergunta(pergunta, imagens[pergunta.campo])}
                      disabled={loadingIA[pergunta.campo] || !imagens[pergunta.campo] || imagens[pergunta.campo].filter(Boolean).length === 0}
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
                      (perguntasComFotos.some(p => p.campo === pergunta.campo) && (loadingIA[pergunta.campo] || !respostasIA[pergunta.campo])) ||
                      !respostasTexto[pergunta.campo]
                    }
                  >
                    {index === (perguntasComFotos.length + perguntasSemFotos.length - 1) ? 'Finalizar' : 'Próximo'}
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === (perguntasComFotos.length + perguntasSemFotos.length) && (
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
              onCapture={(file) => handleImagemSelecionada(file, modalSelecao.campo, modalSelecao.index)} 
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
                onChange={(e) => handleImagemSelecionada(e.target.files[0], modalSelecao.campo, modalSelecao.index)}
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
  );
}