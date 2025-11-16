// UserProfile.jsx - Componente de Perfil de Usuario
// Versión: 1.0
// Muestra información del usuario y permite editar perfil

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Edit2, 
  Save, 
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { getCurrentUser, logout } from './authService';
import { updateProfile } from 'firebase/auth';
import { auth } from './firebaseConfig';

const UserProfile = ({ onClose, onLogout }) => {
  const currentUser = getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No hay usuario autenticado</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      setMessage({ type: 'success', text: '¡Perfil actualizado!' });
      setIsEditing(false);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage({ type: 'error', text: 'Error al actualizar perfil' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      const result = await logout();
      if (result.success && onLogout) {
        onLogout();
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-blue-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        
        <div className="text-center">
          {/* Avatar */}
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
            <span className="text-3xl font-bold">
              {getInitials(currentUser.displayName || currentUser.email)}
            </span>
          </div>

          {/* Nombre */}
          {!isEditing ? (
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {currentUser.displayName || 'Usuario'}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-100 hover:text-white flex items-center gap-1 mx-auto"
              >
                <Edit2 className="w-4 h-4" />
                Editar nombre
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-gray-800 text-center font-medium"
                placeholder="Tu nombre"
                disabled={isLoading}
              />
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(currentUser.displayName || '');
                }}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Mensaje de éxito/error */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Información del Usuario */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-gray-800 font-medium">
                {currentUser.email || 'Usuario anónimo'}
              </p>
            </div>
          </div>

          {/* UID */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">ID de Usuario</p>
              <p className="text-gray-800 font-mono text-xs break-all">
                {currentUser.uid}
              </p>
            </div>
          </div>

          {/* Tipo de Cuenta */}
          {currentUser.isAnonymous && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <User className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-yellow-600 mb-1">Cuenta Anónima</p>
                <p className="text-sm text-yellow-700">
                  Tu sesión se perderá al cerrar el navegador
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Sistema de Auditoría Industrial v2.0
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
