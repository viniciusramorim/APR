import React, { useState } from 'react';

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

  const handleImagemSelecionada = (e, campo) => {
    const file = e.target.files[0];
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
        Object.values(imagens).map(async (file) => {
          if (!file) return null;
          const base64 = await converterParaBase64(file);
          return base64.replace(/^data:image\/[a-z]+;base64,/, '');
        })
      );

      const imagensValidas = base64Imagens.filter(Boolean);

      const payload = {
        imagens: imagensValidas,
        pergunta: `Com base nas imagens fornecidas, responda como um especialista em segurança telecom os seguintes itens de forma objetiva (Sim/Não/Necessita Avaliação) e 
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

  const renderInputImagem = (campo, label) => (
    <div style={{ marginBottom: '1rem' }}>
      <label>{label}</label><br />
      <input type="file" accept="image/*" onChange={(e) => handleImagemSelecionada(e, campo)} />
      {previewUrls[campo] && (
        <div style={{ marginTop: '0.5rem' }}>
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
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Checklist Automático com Imagens Orientadas (Gemini)</h2>

      {renderInputImagem('portaoFrontal', '1. Imagem do portão frontal:')}
      {renderInputImagem('protecaoPortao', '2. Imagem da proteção sobre o portão (altura/proteção):')}
      {renderInputImagem('perimetro', '3. Imagem do perímetro (muros/alambrados):')}
      {renderInputImagem('topoPerimetro', '4. Imagem da parte superior do muro/alambrado:')}

      <button
        onClick={enviarImagensParaChecklist}
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        {loading ? 'Analisando...' : 'Enviar para análise'}
      </button>

      <div style={{ marginTop: '2rem' }}>
        <h3>Resultado do Checklist:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{respostaChecklist}</pre>
      </div>
    </div>
  );
}
