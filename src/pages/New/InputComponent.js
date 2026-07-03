import './new.scss'

import React from 'react';
import { FiUpload } from 'react-icons/fi';
import { Button } from '@mui/material';
import styled from '@emotion/styled';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const InputComponent = (item) => {

  function CapturePhoto(indexA, question, camCapture) {
    if (!camCapture) {
      return;
    }

    if (!item.questions[indexA] || !Array.isArray(item.questions[indexA][1])) {
      console.error("Estrutura de questions invalida no InputComponent:", {
        indexA,
        questions: item.questions,
      });
      return;
    }

    //se for imagem entao
    let imageArray = []
    let objIndex = item.questions[indexA][1].findIndex((obj => obj.questionId === question.questionId));

    if (objIndex === -1 || !item.questions[indexA][1][objIndex]) {
      console.error("Pergunta nao encontrada no InputComponent:", {
        indexA,
        questionId: question.questionId,
      });
      return;
    }

    if (!Array.isArray(item.questions[indexA][1][objIndex].images)) {
      item.questions[indexA][1][objIndex].images = [];
    }

    let arrayQuestion = item.questions[indexA][1][objIndex].images

    if (arrayQuestion.length >= 4) {
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

    if (item.saveIndexedDB) {
      item.saveIndexedDB();
    }
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
    <Button
      component="label"
      role={undefined}
      variant="contained"
      tabIndex={-1}
    >
      <FiUpload size={25}></FiUpload>
      <VisuallyHiddenInput
        type="file"
        accept="image/png, image/jpeg"
        onChange={(event) => CapturePhoto(item.indexA, item.doc, event.target.files[0])}
      />
    </Button>
  );
};

export default InputComponent;
