import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Modal from "react-modal";
import { FiCamera, FiCameraOff, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import "./new.scss";

const CameraComponent = ({ doc, indexA, onAddImage }) => {
  const webcamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleCamera = () => {
    setIsCameraOn((prevState) => !prevState);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURLtoBlob(imageSrc);
    if (!blob) {
      toast.warning("Não foi possível capturar a imagem. Tente novamente.");
      closeModal();
      return;
    }
    const file = new File([blob], "imagem" + Date.now() + ".jpg", {
      type: "image/jpeg",
    });
    onAddImage(indexA, doc.questionId, file);
    closeModal();
  };

  const dataURLtoBlob = (dataURL) => {
    if (!dataURL) {
      return null;
    }
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <>
      {isCameraOn ? (
        <button id="photo" onClick={openModal}>
          <FiCamera size={25} />
        </button>
      ) : (
        <button id="photo" onClick={toggleCamera}>
          <FiCameraOff size={25} />
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        className={"modalOverlay"}
      >
        {isCameraOn ? (
          <>
            <Webcam
              width={window.innerWidth}
              height={window.innerHeight}
              screenshotQuality={0.5}
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment", // Use 'user' para a câmera frontal
              }}
            />
            <span className="botoesCam">
              <button onClick={closeModal} data-check={"Cancel"}>
                <FiX size={25} />
              </button>
              <button onClick={capturePhoto} data-check={"Confirm"}>
                <FiCamera size={25} />
              </button>
            </span>
          </>
        ) : (
          <button onClick={toggleCamera}>Habilitar Câmera</button>
        )}
      </Modal>
    </>
  );
};

export default CameraComponent;
