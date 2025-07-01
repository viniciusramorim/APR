import React, { useState } from 'react';

export default function EnvioGemini() {
  const [imagem, setImagem] = useState(null);
  const [resposta, setResposta] = useState('');
  const [loading, setLoading] = useState(false);

  const handleArquivoSelecionado = (e) => {
    setImagem(e.target.files[0]);
  };

  const enviarImagemParaGemini = async () => {
    if (!imagem) {
      alert('Selecione uma imagem antes de enviar.');
      return;
    }

    try {
      setLoading(true);
      setResposta('');

      const base64 = await converterParaBase64(imagem);
      const base64Limpo = base64.replace(/^data:image\/[a-z]+;base64,/, '');

      const payload = {
        imagens: [base64Limpo]
      };

      const response = await fetch('https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/analisarImagensErb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setResposta(data.resposta || 'Resposta vazia');
    } catch (err) {
      console.error(err);
      setResposta('Erro: ' + err.message);
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

  return (
    <div>
      <h2>Enviar imagem para análise (Gemini)</h2>
      <input type="file" accept="image/*" onChange={handleArquivoSelecionado} />
      <button onClick={enviarImagemParaGemini} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>

      <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{resposta}</pre>
    </div>
  );
}
