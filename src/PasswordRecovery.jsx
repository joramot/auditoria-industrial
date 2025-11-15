// PasswordRecovery.jsx - Componente de Recuperación de Contraseña
// Versión: 1.0
// Componente modal para recuperar contraseña olvidada

import React, { useState } from 'react';
import { Mail, X, Loader, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from './authService';

/**
 * 📧 COMPONENTE DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Permite a los usuarios recuperar su contraseña mediante email
 * 
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Function} onSuccess - Función que se ejecuta después del envío exitoso
 */
const PasswordRecovery = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error inesperado al enviar email de recuperación');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-blue-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Recuperar Contraseña</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Ingresa tu email y te enviaremos instrucciones
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {!success ? (
            <>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enviaremos un enlace de recuperación a este email
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                    isLoading || !email
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="w-5 h-5" />
                      Enviar Email de Recuperación
                    </span>
                  )}
                </button>
              </form>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full mt-3 py-2 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Login
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                ¡Email Enviado!
              </h3>
              <p className="text-gray-600 mb-4">
                Revisa tu bandeja de entrada en <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Sigue las instrucciones del email para recuperar tu contraseña.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Cerrando en 3 segundos...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            ¿No recibes el email? Revisa tu carpeta de spam o intenta de nuevo
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecovery;
