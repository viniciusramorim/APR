import React, { useState } from 'react';
import Modal from 'react-modal';
import firebase from '../../services/firebaseConnection';
import { FiInfo } from 'react-icons/fi';

Modal.setAppElement('#root');

export default function ModalLog(props) {
    const { chamadoId } = props;
    const [logs, setLogs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const isMobile = window.innerWidth < 600; // Define a largura máxima para considerar como um dispositivo móvel
    const customStyles = {
        content: {
            top: isMobile ? '50%' : '0%',
            left: isMobile ? '190px' : '69%',
            bottom: isMobile ? 'auto' : '0%',
            right: isMobile ? '-150px' : '0',
            marginRight: '0px',
            transform: isMobile ? 'translate(-50%, -50%)' : 'translate(0%, 0%)',
            backgroundColor: '#F6F2FA',
            border: '1px solid #ddd',
            boxShadow: '-8px 0px 10px -5px rgba(0,0,0,0.09)'
        },
    };

    const fetchLogs = async (chamadoId) => {
        try {
            // Order by date in descending order (most recent first)
            const snapshot = await firebase.firestore().collection("log")
                .where('chamado', '==', chamadoId)
                .orderBy('data', 'desc') // Use 'date' as your date field name
                .get();

            const logsList = snapshot.docs.map(doc => doc.data());
            console.log(logsList)
            setLogs(logsList);
        } catch (error) {
            console.error("Error fetching logs:", error.message); // Use console.error for more detailed logging
        }
    };

    const openModal = () => {
        setIsOpen(true);
        fetchLogs();
    };



    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <div className='modal-logs'>
            <a onClick={openModal} ><FiInfo color="#FFF" size={17} /></a>
            <Modal
                isOpen={isOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="Registros de log para chamado"

            >
                <div className="tela-logs">
                    <div className="titulo-logs">
                        <h1>REGISTRO DE LOG</h1>
                    </div>
                    <div className="card-group">
                        {logs.length > 0 && (
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
                        )}

                        {logs.length === 0 && <div className="Vazio">
                            <p>
                                Nenhum registro de log encontrado para este chamado
                            </p>
                        </div>}
                    </div>
                </div>
            </Modal>
        </div>
    );
}