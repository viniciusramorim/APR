import { useState } from 'react';
import { Button, Input } from '@mui/material';
import firebase from '../../services/firebaseConnection';

export default function UploadJsonToFirestore() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      for (const [estado, municipios] of Object.entries(json)) {
        for (const [municipio, emails] of Object.entries(municipios)) {
          const docId = `${estado}-${municipio}`;
          await firebase.firestore().collection('contact_email').doc(docId).set({
            estado,
            municipio,
            email_oem: emails,
            email_patrimonial: [],
            email_predial: [],
          });
        }
      }

      alert('Dados enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      alert('Erro ao enviar dados. Verifique o console.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Upload de E-mails por Estado e Município</h2>
      <Input type="file" onChange={handleFileChange} />
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: 16 }}
        onClick={handleUpload}
      >
        Enviar para Firebase
      </Button>
    </div>
  );
}
