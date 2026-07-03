import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Modal from "react-modal";
import { FiCamera, FiX } from "react-icons/fi";
import { IconButton, Box } from '@mui/material';

const CameraComponent = ({ onCapture, children }) => {
  const webcamRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setIsCameraOn(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], `imagem_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    onCapture(file);
    closeModal();
  };

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(",")[1]);
    if (!dataURL) {
      return null;
    }
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const modalStyles = {
    content: {
      width: '100%',
      height: '100%',
      margin: 'auto',
      padding: '20px',
      borderRadius: '10px',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      inset: '0px',        
      overflow: 'unset', 
      zIndex: 2000,
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 2000,
    }
  };

  const buttonStyles = {
    button: {
      backgroundColor: '#fff',
      border: 'none',
      padding: '10px',
      borderRadius: '50%',
      margin: '10px',
      color: '#000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer'
    },
    buttonClose: {
      backgroundColor: '#f44336',
      color: '#fff',
    },
    buttonCapture: {
      backgroundColor: '#4caf50',
      color: '#fff',
    }
  };

  return (
    <>
      {children ? (
        <div onClick={openModal} style={{ cursor: 'pointer', width: '100%', height: '100%' }}>
          {children}
        </div>
      ) : (
        <IconButton onClick={openModal} color="primary">
          <FiCamera size={25} />
        </IconButton>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={modalStyles}
      >
        {isCameraOn && (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: '100%', borderRadius: '10px', marginBottom: '20px' }}
            />
            <Box sx={{display: 'flex', flexDirection: 'row !important', width: '100%'}}>
              <button style={{ ...buttonStyles.button, ...buttonStyles.buttonClose }} onClick={closeModal}>
                <FiX size={25} />
              </button>
              <button style={{ ...buttonStyles.button, ...buttonStyles.buttonCapture }} onClick={capturePhoto}>
                <FiCamera size={25} />
              </button>
            </Box>
          </>
        )}
      </Modal>
    </>
  );
};

export default CameraComponent;