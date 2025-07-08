import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, Card, CardContent, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import CameraComponent from './CameraComponentIA'; // Presume que CameraComponentIA está no mesmo diretório

export default function ChecklistGemini() {
  const [imagens, setImagens] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [respostaChecklist, setRespostaChecklist] = useState('');
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const perguntas = [
    { campo: 'portaoFrontal', label: '1. Imagem do portão frontal:' },
    { campo: 'protecaoPortao', label: '2. Imagem da proteção sobre o portão (altura/proteção):' },
    { campo: 'perimetro', label: '3. Imagem do perímetro (muros/alambrados):' },
    { campo: 'topoPerimetro', label: '4. Imagem da parte superior do muro/alambrado:' },
    { campo: 'fechaduraPortao', label: '5. Imagem da fechadura ou cadeado do portão:' },
    { campo: 'portaoPedestres', label: '6. Imagem do portão de pedestres:' },
  ];

  const handleImagemSelecionada = (file, campo, index) => {
    const novasImagens = { ...imagens };
    if (!novasImagens[campo]) novasImagens[campo] = [];
    novasImagens[campo][index] = file;

    setImagens(novasImagens);

    const novosPreviewUrls = { ...previewUrls };
    if (!novosPreviewUrls[campo]) novosPreviewUrls[campo] = [];
    novosPreviewUrls[campo][index] = URL.createObjectURL(file);

    setPreviewUrls(novosPreviewUrls);
  };

  const enviarImagensParaChecklist = async () => {
    const imagensSelecionadas = Object.values(imagens).flat().filter(Boolean);

    // Verifica se existe pelo menos uma imagem por pergunta
    const imagensCompletas = perguntas.every(pergunta => imagens[pergunta.campo] && imagens[pergunta.campo][0]);
    if (!imagensCompletas) {
      alert('Envie pelo menos uma imagem para cada pergunta.');
      return;
    }

    try {
      setLoading(true);
      setRespostaChecklist('');
      setResultadoFinal(null);

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
        pergunta: `Com base nas imagens fornecidas, responda como um especialista em segurança telecom os seguintes itens de forma objetiva: Sim/Não/Necessita Avaliação
        1. Caso a fechadura/cadeado seja de responsabilidade da Segurança Empresarial Vivo, ao realizar teste junto a CMC, foi constatado o trancamento operante?
        2. Foi identificada avarias no portão do estacionamento e/ou de pedestres?
        3. Foi identificada avarias nos muros ou alambrados?
        4. Foi identificado a presença de cerca Elétrica, Concertina ou outros tipos de proteção, instalados sobre a área cercada do perímetro?
        5. No caso de cabine primária externa, as portas possuem proteção e/ou porta cadeado tipo boca de lobo?
        6. O portão do estacionamento e o de pedestres é confeccionado em chapa galvanizada ou alambrado? (Descrever o tipo no campo “comentários”)
        7. O portão do estacionamento e o de pedestres é dotado de fechamento automatizado eletrônico?
        8. O prédio avaliado é somente técnico ou adm e técnico? (Descreva os demais andares no caso de ambiente ADM)
        9. Os muros de alvenaria e/ou alambrados, que cercam o perímetro, têm a altura mínima de 3,50m em conjunto com a proteção instalada sobre a edificação (concertina, arame farpado e/ou outro tipo de proteção)?`
      };

      console.log(payload);

      const response = await fetch(
        'https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/analisarImagensErb',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      // Estruturando a resposta no formato desejado
      const resultado = {
        nomeBloco: payload.pergunta.split('\n').slice(1, 10).map((pergunta, index) => ({
          question: pergunta.trim(),
          resposta: data.respostas ? data.respostas[index].resposta : 'N/A',
          comentario: data.respostas ? data.respostas[index].comentario : 'N/A',
          recomendacao: data.respostas ? data.respostas[index].recomendacao : 'N/A'
        }))
      };

      setRespostaChecklist(JSON.stringify(data.resposta, null, 2));
      setResultadoFinal(resultado);

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

  const handleAddImage = (campo) => {
    const novasImagens = { ...imagens };
    if (!novasImagens[campo]) novasImagens[campo] = [];
    novasImagens[campo].push(null);
    setImagens(novasImagens);

    const novosPreviewUrls = { ...previewUrls };
    if (!novosPreviewUrls[campo]) novosPreviewUrls[campo] = [];
    novosPreviewUrls[campo].push(null);
    setPreviewUrls(novosPreviewUrls);
  };

  const renderInputImagem = (campo, label) => (
    <Box mb={2}>
      {imagens[campo] && imagens[campo].map((_, index) => (
        <Box key={index} mb={1} display="flex" alignItems="center">
          <CameraComponent onCapture={(file) => handleImagemSelecionada(file, campo, index)} />
          {previewUrls[campo] && previewUrls[campo][index] && (
            <Box ml={1} display="flex" justifyContent="center">
              <img
                src={previewUrls[campo][index]}
                alt={`Preview ${campo} ${index + 1}`}
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
      ))}
      {(!imagens[campo] || imagens[campo].length < 2) && (
        <Button
          variant="outlined"
          onClick={() => handleAddImage(campo)}
          style={{ marginTop: '0.5rem' }}
        >
          Adicionar Imagem
        </Button>
      )}
    </Box>
  );

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Checklist (Gemini)
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
                {(previewUrls[pergunta.campo] && previewUrls[pergunta.campo][0]) && (
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

          {resultadoFinal && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Resultado Estruturado:
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="body1" component="pre" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {JSON.stringify(resultadoFinal, null, 2)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}