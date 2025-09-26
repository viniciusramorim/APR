import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  Backdrop,
} from '@mui/material';
import { 
  FiInfo, 
  FiEdit, 
  FiSave, 
  FiX, 
  FiUpload, 
  FiImage,
  FiSquare,
  FiMapPin,
  FiMaximize2
} from 'react-icons/fi';
import firebase from "../../services/firebaseConnection";
import { toast } from 'react-toastify';

export default function ModalInfoSiteAPR({ sigla, estado }) {
  const [open, setOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState('');
  
  const [editPerimetro, setEditPerimetro] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editImagem, setEditImagem] = useState('');
  
  const fileInputRef = useRef(null);
  const [siteDocId, setSiteDocId] = useState(null);

  // Adicionar event listener para paste quando em modo de edição
  useEffect(() => {
    const handlePasteGlobal = (e) => {
      if (editMode && open) {
        handlePaste(e);
      }
    };

    if (editMode && open) {
      document.addEventListener('paste', handlePasteGlobal);
    }

    return () => {
      document.removeEventListener('paste', handlePasteGlobal);
    };
  }, [editMode, open]);

  const loadSiteInfo = async () => {
    if (!sigla || !estado) {
      toast.error("Sigla ou estado não encontrados.");
      return;
    }
    
    setLoading(true);
    try {
      const snapshot = await firebase.firestore().collection('sites')
        .where('Sigla', '==', sigla)
        .where('Estado', '==', estado)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const siteData = doc.data();
        setSiteInfo(siteData);
        setSiteDocId(doc.id);
        
        setEditPerimetro(siteData.perimetro || '');
        setEditArea(siteData.area || '');
        setEditImagem(siteData.imagem || '');
      } else {
        setSiteInfo(null);
        toast.info("Nenhuma informação encontrada para este site.");
      }
    } catch (error) {
      console.error("Erro ao buscar informações do site:", error);
      toast.error("Erro ao buscar informações do site.");
      setSiteInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setUploading(true);

    try {
      const storageRef = firebase.storage().ref(`sites-images/${siteDocId}/${file.name}`);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();
      setEditImagem(url);
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUploadImage(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleUploadImage(file);
        toast.info('Imagem colada detectada, fazendo upload...');
        break;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadImage(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSave = async () => {
    if (!siteDocId) {
      toast.error('ID do site não encontrado.');
      return;
    }

    try {
      await firebase.firestore().collection('sites').doc(siteDocId).update({
        perimetro: parseFloat(editPerimetro) || 0,
        area: parseFloat(editArea) || 0,
        imagem: editImagem,
      });

      setSiteInfo({
        ...siteInfo,
        perimetro: editPerimetro,
        area: editArea,
        imagem: editImagem,
      });

      setEditMode(false);
      toast.success('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar as informações.');
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
    loadSiteInfo();
  };

  const handleClose = () => {
    setOpen(false);
    setSiteInfo(null);
    setEditMode(false);
    setEditPerimetro('');
    setEditArea('');
    setEditImagem('');
    setDragOver(false);
  };

  const toggleEditMode = () => {
    if (editMode) {
      setEditPerimetro(siteInfo?.perimetro || '');
      setEditArea(siteInfo?.area || '');
      setEditImagem(siteInfo?.imagem || '');
    }
    setEditMode(!editMode);
  };

  const handleImageClick = (imageSrc) => {
    setViewingImage(imageSrc);
    setImageViewOpen(true);
  };

  const handleImageViewClose = () => {
    setImageViewOpen(false);
    setViewingImage('');
  };

  const InfoField = ({ label, value, icon, unit = '' }) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: '#9c27b0', mr: 1, display: 'flex' }}>
            {icon}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {label}
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          sx={{ 
            color: value ? 'text.primary' : 'text.secondary',
            fontStyle: value ? 'normal' : 'italic',
            fontWeight: value ? 500 : 400
          }}
        >
          {value ? `${value}${unit}` : `Não possui informação de ${label.toLowerCase()}`}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
        <Button 
          variant="outlined" 
          onClick={handleClickOpen}
        
        >
          Área / Perímetro
        </Button>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiMapPin size={24} color="#9c27b0" />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#9c27b0' }}>
              {sigla}-{estado}
            </Typography>
          </Box>
          
          <Tooltip title="Fechar" arrow>
            <IconButton
              onClick={handleClose}
              sx={{
                color: '#9c27b0',
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.08)'
                }
              }}
            >
              <FiX size={20} />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6
            }}>
              <CircularProgress size={40} sx={{ mb: 2, color: '#9c27b0' }} />
              <Typography variant="body1" color="text.secondary">
                Carregando informações...
              </Typography>
            </Box>
          ) : siteInfo ? (
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ marginTop: '15px' }}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Perímetro"
                      type="number"
                      value={editPerimetro}
                      onChange={(e) => setEditPerimetro(e.target.value)}
                      placeholder="Digite o perímetro"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><FiMapPin color="#9c27b0" /></InputAdornment>,
                        endAdornment: <InputAdornment position="end">metros</InputAdornment>,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9c27b0',
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#9c27b0',
                        }
                      }}
                    />
                  ) : (
                    <InfoField 
                      label="Perímetro" 
                      value={siteInfo.perimetro} 
                      icon={<FiMapPin size={18} />}
                      unit=" metros"
                    />
                  )}
                </Box>

                <Box sx={{ marginTop: '15px' }}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Área"
                      type="number"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      placeholder="Digite a área"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><FiSquare color="#9c27b0" /></InputAdornment>,
                        endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9c27b0',
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#9c27b0',
                        }
                      }}
                    />
                  ) : (
                    <InfoField 
                      label="Área" 
                      value={siteInfo.area} 
                      icon={<FiSquare size={18} />}
                      unit=" m²"
                    />
                  )}
                </Box>
              </Box>

              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: '#9c27b0', mr: 1, display: 'flex' }}>
                      <FiImage size={18} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Imagem do Site
                    </Typography>
                  </Box>
                  
                  {editMode ? (
                    <Box>
                      <Paper
                        elevation={0}
                        sx={{
                          border: `2px dashed ${dragOver ? '#9c27b0' : '#e0e0e0'}`,
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          mb: 2,
                          backgroundColor: dragOver ? 'rgba(156, 39, 176, 0.05)' : uploading ? 'grey.50' : 'transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: '#9c27b0',
                            backgroundColor: 'rgba(156, 39, 176, 0.05)'
                          }
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <Box>
                            <CircularProgress size={32} sx={{ mb: 1, color: '#9c27b0' }} />
                            <Typography variant="body2" color="text.secondary">
                              Fazendo upload...
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <FiUpload size={32} color={dragOver ? '#9c27b0' : '#666'} />
                            <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                              Clique ou arraste uma imagem
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ou pressione Ctrl+V para colar uma imagem
                            </Typography>
                          </Box>
                        )}
                      </Paper>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />

                      {editImagem && (
                        <Fade in={!!editImagem}>
                          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                              <img
                                src={editImagem}
                                alt="Site"
                                style={{ 
                                  width: '100%',
                                  maxHeight: '240px',
                                  objectFit: 'cover',
                                  display: 'block',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleImageClick(editImagem)}
                              />
                              <Tooltip title="Visualizar em tamanho completo" arrow>
                                <IconButton
                                  size="small"
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    left: 8,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.8)'
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(editImagem);
                                  }}
                                >
                                  <FiMaximize2 size={16} />
                                </IconButton>
                              </Tooltip>
                            </Paper>
                            <Tooltip title="Remover imagem" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 8, 
                                  right: 8,
                                  backgroundColor: 'white',
                                  boxShadow: 2,
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'white'
                                  }
                                }}
                                onClick={() => setEditImagem('')}
                              >
                                <FiX size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Fade>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      {siteInfo.imagem ? (
                        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                          <img
                            src={siteInfo.imagem}
                            alt="Site"
                            style={{ 
                              width: '100%',
                              maxHeight: '240px',
                              objectFit: 'cover',
                              display: 'block',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleImageClick(siteInfo.imagem)}
                          />
                          <Tooltip title="Visualizar em tamanho completo" arrow>
                            <IconButton
                              size="small"
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.8)'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(siteInfo.imagem);
                              }}
                            >
                              <FiMaximize2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ) : (
                        <Box 
                          sx={{ 
                            py: 4, 
                            textAlign: 'center',
                            backgroundColor: 'grey.50',
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'grey.300'
                          }}
                        >
                          <FiImage size={32} color="#999" />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Não possui imagem
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'grey.300'
            }}>
              <FiInfo size={48} color="#9c27b0" />
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                Nenhuma informação encontrada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Não foi possível encontrar dados para este site
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0, justifyContent:'right', paddingTop: '10px' }}>
          {siteInfo && !editMode && (
            <Tooltip title="Editar informações" arrow>
              <Button
                onClick={toggleEditMode}
                startIcon={<FiEdit />}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  backgroundColor: '#9c27b0',
                  '&:hover': {
                    backgroundColor: '#7b1fa2'
                  }
                }}
              >
                Editar
              </Button>
            </Tooltip>
          )}
          
          {editMode && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={toggleEditMode}
                startIcon={<FiX />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  borderColor: '#9c27b0',
                  color: '#9c27b0',
                  '&:hover': {
                    borderColor: '#7b1fa2',
                    backgroundColor: 'rgba(156, 39, 176, 0.04)'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<FiSave />}
                disabled={uploading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#45a049'
                  }
                }}
              >
                Salvar Alterações
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={imageViewOpen}
        onClose={handleImageViewClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Backdrop
          open={imageViewOpen}
          onClick={handleImageViewClose}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1
          }}
        >
          <Box
            sx={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '95vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingImage}
              alt="Visualização completa"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8
              }}
            />
            <Tooltip title="Fechar" arrow>
              <IconButton
                onClick={handleImageViewClose}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                  }
                }}
              >
                <FiX size={24} />
              </IconButton>
            </Tooltip>
          </Box>
        </Backdrop>
      </Dialog>
    </>
  );
}