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

const InputComponent = ({ doc, indexA, onAddImage }) => {
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
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onAddImage(indexA, doc.questionId, file);
          }
          event.target.value = "";
        }}
      />
    </Button>
  );
};

export default InputComponent;
