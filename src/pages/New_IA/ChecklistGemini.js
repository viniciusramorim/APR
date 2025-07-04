import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, InputLabel, Card, CardContent, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import CameraComponent from './CameraComponentIA'; // Presume que CameraComponentIA está no mesmo diretório

export default function ChecklistGemini() {
  const [imagens, setImagens] = useState({
    portaoFrontal: null,
    protecaoPortao: null,
    perimetro: null,
    topoPerimetro: null
  });

  const [previewUrls, setPreviewUrls] = useState({});
  const [respostaChecklist, setRespostaChecklist] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const perguntas = [
    { campo: 'portaoFrontal', label: '1. Imagem do portão frontal:' },
    { campo: 'protecaoPortao', label: '2. Imagem da proteção sobre o portão (altura/proteção):' },
    { campo: 'perimetro', label: '3. Imagem do perímetro (muros/alambrados):' },
    { campo: 'topoPerimetro', label: '4. Imagem da parte superior do muro/alambrado:' }
  ];

  const handleImagemSelecionada = (file, campo) => {
    if (file) {
      setImagens((prev) => ({ ...prev, [campo]: file }));
      setPreviewUrls((prev) => ({ ...prev, [campo]: URL.createObjectURL(file) }));
    }
  };

  const enviarImagensParaChecklist = async () => {
    const imagensSelecionadas = Object.values(imagens).filter(Boolean);

    if (imagensSelecionadas.length < 2) {
      alert('Envie pelo menos 2 imagens para a análise.');
      return;
    }

    try {
      setLoading(true);
      setRespostaChecklist('');

      const base64Imagens = await Promise.all(
        imagensSelecionadas.map(async (file) => {
          if (!file) return null;
          const base64 = await converterParaBase64(file);
          return base64.replace(/^data:image\/[a-z]+;base64,/, '');
        })
      );

      const imagensValidas = base64Imagens.filter(Boolean);

      const payload = {
        imagens: imagensValidas,
        perguntas: `Com base nas imagens fornecidas, responda como um especialista em segurança telecom os seguintes itens de forma objetiva (Sim/Não/Necessita Avaliação) e 
        com justificativa breve:
        1. O portão principal é feito de chapa galvanizada?
        2. Há proteção instalada sobre o portão (concertina, arame farpado etc.) com altura total mínima de 2,50m?
        3. Existem avarias visíveis no portão?
        4. O sistema de trancamento do portão está danificado?
        5. O perímetro é cercado por muros ou alambrados?
        6. Há proteção adicional (concertina, arame etc.) sobre o perímetro?
        7. A altura total do perímetro com proteção é de, no mínimo, 2,50m?
        8. Existem avarias nos muros ou alambrados?`
      };

      const response = await fetch(
        'https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/analisarImagensErb',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      setRespostaChecklist(data.resposta || 'Resposta vazia da IA');
    } catch (err) {
      console.error(err);
      setRespostaChecklist('Erro: ' + err.message);
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

  const handleReset = () => {
    setActiveStep(0);
  };

  const renderInputImagem = (campo, label) => (
    <Box mb={2}>
      <CameraComponent onCapture={(file) => handleImagemSelecionada(file, campo)} />
      {previewUrls[campo] && (
        <Box mt={1} display="flex" justifyContent="center">
          <img
            src={previewUrls[campo]}
            alt={`Preview ${campo}`}
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Checklist Automático com Imagens Orientadas (Gemini)
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {perguntas.map((pergunta, index) => (
          <Step key={pergunta.campo}>
            <StepLabel>{pergunta.label.split(':')[0]}</StepLabel>
            <StepContent>
              {renderInputImagem(pergunta.campo, pergunta.label)}
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="contained"
                >
                  Voltar
                </Button>
                {previewUrls[pergunta.campo] && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    {index === perguntas.length - 1 ? 'Finalizar' : 'Próximo'}
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === perguntas.length && (
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Todas as imagens foram capturadas. Enviar para análise.
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
                {respostaChecklist}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}