// LoginScreen.jsx - Pantalla de Login (Versión Mejorada)
// Versión: 2.0 - Con recuperación de contraseña integrada
// Componente de autenticación con todas las funcionalidades

import React, { useState } from 'react';
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
  KeyRound
} from 'lucide-react';
import { login, register } from '../../services/auth/authService';
import PasswordRecovery from './PasswordRecovery';

const LoginScreen = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  /**
   * Manejar login con email/password
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        setSuccess('Â¡Login exitoso!');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesiÃ³n');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar registro de nuevo usuario
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await register(email, password, displayName);

      if (result.success) {
        setSuccess('Â¡Registro exitoso! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error inesperado al registrar usuario');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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

  /**
   * Cambiar entre login y registro
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

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
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Juan PÃ©rez"
                    required={!isLogin}
                    disabled={isLoading}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@example.com"
                  required
                  disabled={isLoading}
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
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
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-1">
                    MÃ­nimo 6 caracteres
                  </p>
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

              {/* Mensajes de error/éxito */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                  isLoading
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