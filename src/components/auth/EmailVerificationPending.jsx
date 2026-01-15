// EmailVerificationPending.jsx - Pantalla de verificación de email pendiente
// Versión: 1.0 - Componente de seguridad

import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  LogOut,
  Loader,
  Shield
} from 'lucide-react';
import {
  resendVerificationEmail,
  checkEmailVerified,
  logout
} from '../../services/auth/authService';

const EmailVerificationPending = ({ user, onVerified, onLogout }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Verificar estado cada 5 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await checkEmailVerified();
      if (result.verified) {
        onVerified();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onVerified]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setError(null);
    setMessage(null);

    try {
      const result = await checkEmailVerified();
      if (result.verified) {
        setMessage('Email verificado correctamente');
        setTimeout(() => onVerified(), 1000);
      } else {
        setError('El email aún no ha sido verificado. Revisa tu bandeja de entrada.');
      }
    } catch (err) {
      setError('Error al verificar. Intenta de nuevo.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        setMessage('Email de verificación enviado. Revisa tu bandeja de entrada.');
        setCooldown(60); // 60 segundos de cooldown
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al enviar email. Intenta más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-2xl shadow-lg">
          <div className="flex items-center gap-3 justify-center mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Verificación Requerida</h1>
          </div>
          <p className="text-blue-100 text-center text-sm">
            Por seguridad, necesitas verificar tu email
          </p>
        </div>

        {/* Content */}
        <div className="bg-white p-8 rounded-b-2xl shadow-lg">
          {/* Email icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Verifica tu email
            </h2>
            <p className="text-gray-600 text-sm">
              Hemos enviado un enlace de verificación a:
            </p>
            <p className="font-medium text-blue-600 mt-1">
              {user?.email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Instrucciones:</strong>
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside mt-2 space-y-1">
              <li>Abre tu bandeja de entrada</li>
              <li>Busca el email de "Firebase" o "noreply"</li>
              <li>Haz clic en el enlace de verificación</li>
              <li>Regresa aquí y presiona "Ya verifiqué"</li>
            </ol>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {/* Check verification button */}
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ya verifiqué mi email
                </span>
              )}
            </button>

            {/* Resend email button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full py-3 px-4 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Enviando...
                </span>
              ) : cooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Reenviar en {cooldown}s
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Reenviar email de verificación
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded-lg font-medium text-gray-500 hover:text-gray-700 transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                Usar otra cuenta
              </span>
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            ¿No recibiste el email? Revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;
