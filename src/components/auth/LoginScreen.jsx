// LoginScreen.jsx - Pantalla de Login (Versión Segura)
// Versión: 3.0 - Con validaciones de seguridad mejoradas
// Incluye: sanitización, rate limiting, indicador de fortaleza

import React, { useState, useCallback } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  CheckCircle,
  Database,
  User,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { login, register } from '../../services/auth/authService';
import PasswordRecovery from './PasswordRecovery';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import EmailVerificationPending from './EmailVerificationPending';
import {
  sanitizeInput,
  checkRateLimit,
  validatePasswordStrength
} from '../../services/security/securityService';

const LoginScreen = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState([]); // Lista de errores múltiples
  const [success, setSuccess] = useState(null);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // Sanitizar inputs en tiempo real
  const handleEmailChange = useCallback((e) => {
    const value = e.target.value.toLowerCase().trim();
    setEmail(value);
    setError(null);
    setErrors([]);
  }, []);

  const handleNameChange = useCallback((e) => {
    const value = sanitizeInput(e.target.value);
    setDisplayName(value);
    setError(null);
    setErrors([]);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setError(null);
    setErrors([]);
  }, []);

  /**
   * Manejar login con email/password
   * Incluye verificación de rate limiting
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors([]);
    setSuccess(null);

    // Verificar rate limiting antes de enviar
    const rateCheck = checkRateLimit(email);
    if (rateCheck.isBlocked) {
      setIsRateLimited(true);
      setRateLimitMessage(rateCheck.message);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        setIsRateLimited(false);
        setSuccess('Acceso concedido');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 500);
      } else {
        if (result.isRateLimited) {
          setIsRateLimited(true);
          setRateLimitMessage(result.error);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar registro de nuevo usuario
   * Incluye validación de contraseña fuerte y verificación de email
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors([]);
    setSuccess(null);

    // Validar contraseña en frontend primero
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      setErrors(passwordValidation.errors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(email, password, displayName);

      if (result.success) {
        if (result.requiresVerification) {
          // Mostrar pantalla de verificación pendiente
          setSuccess('Cuenta creada. Verifica tu email para continuar.');
          setPendingUser(result.user);
          setPendingVerification(true);
        } else {
          setSuccess('Cuenta creada exitosamente');
          setTimeout(() => {
            onLoginSuccess(result.user);
          }, 1000);
        }
      } else {
        if (result.allErrors && result.allErrors.length > 0) {
          setErrors(result.allErrors);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar verificación completada
  const handleVerificationComplete = () => {
    setPendingVerification(false);
    if (pendingUser) {
      onLoginSuccess({ ...pendingUser, emailVerified: true });
    }
  };

  // Manejar logout desde verificación
  const handleVerificationLogout = () => {
    setPendingVerification(false);
    setPendingUser(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  /**
   * Manejar login anónimo (para testing)
   * NOTA: Deshabilitado temporalmente - se puede habilitar después
   */
  /*
  const handleAnonymousLogin = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await loginAnonymously();

      if (result.success) {
        setSuccess('¡Acceso anónimo exitoso!');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión anónima');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  */

  // Mostrar pantalla de verificación pendiente
  if (pendingVerification && pendingUser) {
    return (
      <EmailVerificationPending
        user={pendingUser}
        onVerified={handleVerificationComplete}
        onLogout={handleVerificationLogout}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 rounded-t-2xl shadow-lg">
            <div className="flex items-center gap-3 justify-center mb-2">
              <Database className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Auditoría Industrial</h1>
            </div>
            <p className="text-blue-100 text-center text-sm">
              Sistema de Gestión de Equipos
            </p>
          </div>

          {/* Card de Login/Registro */}
          <div className="bg-white p-8 rounded-b-2xl shadow-lg">
            {/* Tabs: Login / Registro */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Registrarse
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={isLogin ? handleEmailLogin : handleRegister}>
              {/* Campo: Nombre (solo en registro) */}
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={handleNameChange}
                    placeholder="Juan Pérez"
                    required={!isLogin}
                    disabled={isLoading}
                    maxLength={100}
                    autoComplete="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              )}

              {/* Campo: Email */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="usuario@example.com"
                  required
                  disabled={isLoading || isRateLimited}
                  maxLength={254}
                  autoComplete="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Campo: Contraseña */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    disabled={isLoading || isRateLimited}
                    minLength={8}
                    maxLength={128}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Indicador de fortaleza solo en registro */}
                {!isLogin && (
                  <PasswordStrengthIndicator
                    password={password}
                    showRequirements={true}
                  />
                )}
              </div>

              {/* Link de recuperación de contraseña (solo en login) */}
              {isLogin && (
                <div className="mb-4 text-right">
                  <button
                    type="button"
                    onClick={() => setShowPasswordRecovery(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
                    disabled={isLoading}
                  >
                    <KeyRound className="w-4 h-4" />
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Alerta de Rate Limiting */}
              {isRateLimited && (
                <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{rateLimitMessage}</span>
                </div>
              )}

              {/* Mensajes de error */}
              {error && !isRateLimited && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Lista de errores múltiples */}
              {errors.length > 0 && !isRateLimited && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Por favor corrige los siguientes errores:</span>
                  </div>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-7">
                    {errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={isLoading || isRateLimited}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                  isLoading || isRateLimited
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Procesando...
                  </span>
                ) : isLogin ? (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </span>
                )}
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm">o</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Login Anónimo (para testing) - DESHABILITADO TEMPORALMENTE */}
            {/*
            <button
              onClick={handleAnonymousLogin}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium border-2 border-gray-300 text-gray-700 transition-all ${
                isLoading
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Acceso Rápido (Anónimo)
              </span>
            </button>
            */}

            <p className="text-xs text-gray-500 text-center mt-4">
              {isLogin ? (
                <>¿No tienes cuenta? Haz clic en "Registrarse"</>
              ) : (
                <>¿Ya tienes cuenta? Haz clic en "Iniciar Sesión"</>
              )}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Sistema de Auditorí­a Industrial v2.0</p>
            <p className="text-xs text-gray-500 mt-1">
              Powered by Firebase Authentication
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {showPasswordRecovery && (
        <PasswordRecovery
          onClose={() => setShowPasswordRecovery(false)}
          onSuccess={() => {
            setSuccess('Email de recuperación enviado. Revisa tu bandeja de entrada.');
            setShowPasswordRecovery(false);
          }}
        />
      )}
    </>
  );
};

export default LoginScreen;