import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, Card, CardContent, Stepper, Step, StepLabel, StepContent, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import CameraComponent from './CameraComponentIA';
import ReactMarkdown from 'react-markdown';

export default function ChecklistGemini() {
  const [imagens, setImagens] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [respostaChecklist, setRespostaChecklist] = useState('');
  const [respostasTexto, setRespostasTexto] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const perguntasComFotos = [
    { campo: 'portaoFrontal', label: '1. Imagem do portão frontal:' },
    { campo: 'protecaoPortao', label: '2. Imagem da proteção sobre o portão (altura/proteção):' },
    { campo: 'perimetro', label: '3. Imagem do perímetro (muros/alambrados):' },
    { campo: 'topoPerimetro', label: '4. Imagem da parte superior do muro/alambrado:' },
    { campo: 'fechaduraPortao', label: '5. Imagem da fechadura ou cadeado do portão:' },
    { campo: 'portaoPedestres', label: '6. Imagem do portão de pedestres:' },
  ];

  const perguntasSemFotos = [];

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

  const handleTextoChange = (e, campo) => {
    const novasRespostasTexto = { ...respostasTexto };
    novasRespostasTexto[campo] = e.target.value;
    setRespostasTexto(novasRespostasTexto);
  };

  const enviarImagensParaChecklist = async () => {
    const imagensSelecionadas = Object.values(imagens).flat().filter(Boolean);

    const imagensCompletas = perguntasComFotos.every(pergunta => imagens[pergunta.campo] && imagens[pergunta.campo][0]);
    if (!imagensCompletas) {
      alert('Envie pelo menos uma imagem para cada pergunta obrigatória.');
      return;
    }

    const textosCompletos = perguntasSemFotos.every(pergunta => respostasTexto[pergunta.campo]);
    if (!textosCompletos) {
      alert('Responda todas as perguntas obrigatórias.');
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
        perguntasTexto: perguntasSemFotos.map(pergunta => ({
          question: pergunta.label,
          answer: respostasTexto[pergunta.campo] || 'N/A'
        })),
        pergunta: `Com base nas imagens fornecidas, responda como um especialista em segurança telecom os seguintes itens de forma objetiva: Sim/Não/Necessita Avaliação
        Necessário que a resposta venha em formato de objeto json como o exemplo: {
          "question": "",
          "resposta": "",
          "comentario": "",
        }.
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

      const response = await fetch(
        'https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/analisarImagensErb',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!data.resposta) {
        throw new Error('A resposta da API está indefinida ou é null.');
      }

      const respostaFormatada = JSON.stringify(data.resposta, null, 2);
      setRespostaChecklist(respostaFormatada);

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
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            id={`upload-button-${campo}-${index}`}
            onChange={(e) => handleImagemSelecionada(e.target.files[0], campo, index)}
          />
          <CameraComponent onCapture={(file) => handleImagemSelecionada(file, campo, index)} />
          <label htmlFor={`upload-button-${campo}-${index}`}>
            <Button variant="contained" component="span">
              Escolher Arquivo
            </Button>
          </label>
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
              {pergunta.campo in respostasTexto ?
                renderInputRadio(pergunta.campo, pergunta.label) :
                renderInputImagem(pergunta.campo, pergunta.label)}
              <Box display="flex" justifyContent="space-between" mt={2}>
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    variant="contained"
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={pergunta.campo in respostasTexto && !respostasTexto[pergunta.campo]}
                >
                  {index === (perguntasComFotos.length + perguntasSemFotos.length - 1) ? 'Finalizar' : 'Próximo'}
                </Button>
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
    </Box>
  );
}