import { useState, useContext, useEffect } from "react";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { AuthContext } from "../../contexts/auth";
import "./signin.scss";
import logo from "../../assets/logoaprdigital-removebg.png";
import { toast } from "react-toastify";
import {
  Box,
  Card,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loadingAuth, setupRecaptcha, resetPassword } = useContext(AuthContext);

  useEffect(() => {
    document.body.classList.remove("page-apply-apr", "page-new", "page-oem", "page-sites");
    addBodyClass("page-signin");
    setupRecaptcha();

    return () => {
      document.body.classList.remove("page-signin");
    };
  }, [setupRecaptcha]);

  function handleSubmit(e) {
    e.preventDefault();

    if (email !== "" && password !== "") {
      signIn(email.replaceAll(" ", ""), password.replaceAll(" ", ""));
    }
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  function handleResetPassword() {
    if (email !== "") {
      resetPassword(email.replaceAll(" ", ""));
    } else {
      toast.error(
        "Por favor, insira seu e-mail antes de tentar redefinir a senha."
      );
    }
  }

  return (
    <Box className="signin-container">
      {/* Decorative background elements */}
      <Box className="signin-blob signin-blob-1" />
      <Box className="signin-blob signin-blob-2" />
      <Box className="signin-blob signin-blob-3" />
      <Box className="signin-blob signin-blob-4" />
      
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            py: 2,
            position: "relative",
            zIndex: 10,
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: "24px",
              padding: "56px 40px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,245,255,0.99) 100%)",
              backdropFilter: "blur(30px)",
              boxShadow: "0 25px 70px 0 rgba(155, 89, 182, 0.2), 0 0 2px 0 rgba(155, 89, 182, 0.3)",
              border: "1px solid rgba(155, 89, 182, 0.2)",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                textAlign: "center",
                marginBottom: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  animation: "logoGlow 5s ease-in-out infinite",
                  "@keyframes logoGlow": {
                    "0%, 100%": {
                      filter: "drop-shadow(0 0 15px rgba(155, 89, 182, 0.4))",
                    },
                    "50%": {
                      filter: "drop-shadow(0 0 25px rgba(155, 89, 182, 0.7))",
                    },
                  },
                }}
              >
                <img
                  src={logo}
                  alt="APR Digital"
                  style={{
                    width: "200px",
                    height: "auto",
                    objectFit: "contain",
                    filter: "brightness(1.1) contrast(1.15)",
                  }}
                />
              </Box>
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              sx={{
                textAlign: "center",
                fontWeight: 800,
                color: "#2d1b4e",
                marginBottom: "8px",
                fontSize: "32px",
                background: "linear-gradient(135deg, #9b59b6 0%, #7d3c98 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Bem-vindo
            </Typography>

            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "#8e7fa3",
                marginBottom: "36px",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              Acesse sua conta para continuar
            </Typography>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                fullWidth
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    backgroundColor: "rgba(155, 89, 182, 0.04)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: "rgba(155, 89, 182, 0.08)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(155, 89, 182, 0.05)",
                      boxShadow: "0 0 0 5px rgba(155, 89, 182, 0.15)",
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(155, 89, 182, 0.25)",
                    borderWidth: "1.5px",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(155, 89, 182, 0.4)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#9b59b6",
                    borderWidth: "2px",
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(155, 89, 182, 0.4)",
                    opacity: 1,
                  },
                  "& .MuiInputLabel-root": {
                    color: "#9b59b6",
                    fontWeight: 600,
                    fontSize: "15px",
                    "&.Mui-focused": {
                      color: "#9b59b6",
                      fontWeight: 700,
                    },
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{
                          color: "#9b59b6",
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor: "rgba(155, 89, 182, 0.12)",
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    backgroundColor: "rgba(155, 89, 182, 0.04)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: "rgba(155, 89, 182, 0.08)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(155, 89, 182, 0.05)",
                      boxShadow: "0 0 0 5px rgba(155, 89, 182, 0.15)",
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(155, 89, 182, 0.25)",
                    borderWidth: "1.5px",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(155, 89, 182, 0.4)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#9b59b6",
                    borderWidth: "2px",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#9b59b6",
                    fontWeight: 600,
                    fontSize: "15px",
                    "&.Mui-focused": {
                      color: "#9b59b6",
                      fontWeight: 700,
                    },
                  },
                }}
              />

              {/* Login Button */}
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loadingAuth}
                sx={{
                  py: 1.8,
                  mb: 2.5,
                  borderRadius: "14px",
                  textTransform: "none",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  background: "linear-gradient(135deg, #9b59b6 0%, #7d3c98 100%)",
                  boxShadow: "0 8px 24px 0 rgba(155, 89, 182, 0.4)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: "0 12px 32px 0 rgba(155, 89, 182, 0.55)",
                    transform: "translateY(-2px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  "&:disabled": {
                    background: "rgba(155, 89, 182, 0.4)",
                    boxShadow: "none",
                  },
                }}
              >
                {loadingAuth ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "Acessar"
                )}
              </Button>

              {/* reCAPTCHA Container */}
              <Box
                id="recaptcha-container"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                }}
              />

              {/* Forgot Password Link */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  component="span"
                  onClick={handleResetPassword}
                  sx={{
                    fontSize: "14px",
                    color: "#9b59b6",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      color: "#7d3c98",
                      textDecoration: "underline",
                      textDecorationThickness: "2px",
                      textUnderlineOffset: "4px",
                    },
                  }}
                >
                  Esqueci minha senha
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
