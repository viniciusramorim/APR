import React, { useState, useContext } from 'react';
import Modal from 'react-modal';
import firebase from '../../services/firebaseConnection';
import { IconButton } from '@mui/material';
import { Info } from '@mui/icons-material';
import { AuthContext } from '../../contexts/auth';
import '../Modal_Logs/ModalLogs.scss';

Modal.setAppElement('#root');

export default function ModalSiteLogs({ siteId }) {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { logSistem } = useContext(AuthContext);

  const isMobile = window.innerWidth < 600;
  const customStyles = {
    content: {
      top: isMobile ? '50%' : '0%',
      left: isMobile ? '220px' : '70%',
      bottom: isMobile ? 'auto' : '0%',
      right: isMobile ? '-150px' : '0',
      marginRight: '0px',
      transform: isMobile ? 'translate(-50%, -50%)' : 'translate(0%, 0%)',
      backgroundColor: '#F6F2FA',
      border: '1px solid #ddd',
      boxShadow: '-8px 0px 10px -5px rgba(0,0,0,0.09)',
      zIndex: '999'
    },
  };

  const fetchLogs = async () => {
    try {
      const snapshot = await firebase
        .firestore()
        .collection('log')
        .orderBy('data', 'asc')
        .where('chamado', '==', siteId)
        .get();

      let logsList = [];
      snapshot.forEach((doc) => {
        logsList.push(doc.data());
      });
      setLogs(logsList);
    } catch (error) {
      console.log("Erro ao buscar logs:", error.message);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    fetchLogs();
  };

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <IconButton onClick={openModal} aria-label="Ver logs">
        <Info />
      </IconButton>
      <div className='modal-logs'>
        <Modal
          isOpen={isOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Registros de alterações no site"
        >
          <div className="tela-logs">
            <div className="titulo-logs">
              <h1>REGISTRO DE ALTERAÇÕES NO SITE</h1>
            </div>
            <div className="card-group">
              {logs.length > 0 ? (
                <div>
                  {logs.map((log, index) => (
                    <div key={index} className="card">
                      <div className="card-header">
                        <h4>{log.event}</h4>
                      </div>
                      <div className="card-body">
                        <p><strong>Usuário: </strong>{log.user}</p>
                        <div className="Elemento">
                          <h5><strong>Data: </strong>{log.data.toDate().toLocaleString()}</h5>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="Vazio">
                  <p>Nenhum registro de alteração encontrado para este site</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
} 
