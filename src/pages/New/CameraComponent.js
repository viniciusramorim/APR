import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Modal from 'react-modal';
import { FiCamera, FiCameraOff, FiX } from 'react-icons/fi';

import './new.css'

const CameraComponent = (item) => {
  const webcamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const toggleCamera = () => {
    setIsCameraOn(prevState => !prevState);
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
    const file = new File([blob], 'imagem'+Date.now()+'.jpg', { type: 'image/jpeg' });
    CapturePhoto(item.indexA, item.doc, file)
    closeModal()
  };

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  function CapturePhoto(indexA, question, camCapture) {
    //se for imagem entao
    let imageArray = []
    let objIndex = item.questions[indexA][1].findIndex((obj => obj.questionId == question.questionId));
    let arrayQuestion = item.questions[indexA][1][objIndex].images

    if (item.questions[indexA][1][objIndex].images.length >= 4) {
      return;
    }

    arrayQuestion.forEach((file) => {
      imageArray.push(file)
    })

    imageArray.push(camCapture)

    item.questions[indexA][1][objIndex].images = imageArray;

    var ul = document.getElementById("inputimg_" + question.questionId + "_" + indexA);
    var li = document.createElement("li");
    var i = document.createElement("i");


    var children = ul.children.length + 1

    li.setAttribute("id", objIndex + "_image_" + children);
    li.setAttribute('style', `background:url(${URL.createObjectURL(camCapture)}) round !important`);
    i.setAttribute("id", objIndex + "_removeimg_" + children);

    // cria o botao remover e atribui uma função
    i.addEventListener("click", (e) => {
      e.preventDefault()
      li.remove()
      removeImg(indexA, objIndex, camCapture)
    })

    i.appendChild(document.createTextNode('X'));

    ul.appendChild(li);
    li.appendChild(i);
  }

  function removeImg(indexA, objIndex, file) {
    let imageArray = []
    let arrayQuestion = item.questions[indexA][1][objIndex]
    let index = arrayQuestion.images.findIndex((obj => obj.name === file.name));

    delete arrayQuestion.images[index]

    arrayQuestion.images.forEach((file) => {
      imageArray.push(file)
    })

    item.questions[indexA][1][objIndex].images = imageArray;
  }

  return (
    <>
      {isCameraOn ? (
        <button id='photo' onClick={openModal}><FiCamera size={25} /></button>
      ) : (
        <button id='photo' onClick={toggleCamera}><FiCameraOff size={25} /></button>
      )}

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} ariaHideApp={false} className={'modalOverlay'}>
        {isCameraOn ? (
          <>
            <Webcam
              width={dimensions.width}
              height={dimensions.height}
              screenshotQuality={0.5}
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment', // Use 'user' para a câmera frontal
              }}
            />
            <span className='botoesCam'>
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
