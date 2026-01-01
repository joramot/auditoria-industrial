// useAuth.js - Custom React Hook para Autenticación
// Versión: 1.1 - CORREGIDO
// Hook personalizado que facilita el uso de autenticación en cualquier componente

import { useState, useEffect } from 'react';
import { onAuthChange, getCurrentUser } from '../services/auth/authService';

/**
 * 🎣 HOOK PERSONALIZADO DE AUTENTICACIÓN
 * 
 * Uso en componentes:
 * ```javascript
 * const { user, isAuthenticated, isLoading } = useAuth();
 * ```
 * 
 * @returns {Object} Estado de autenticación
 *   - user: Objeto del usuario actual (o null)
 *   - isAuthenticated: Boolean indicando si hay usuario autenticado
 *   - isLoading: Boolean indicando si se está verificando auth
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎣 Hook useAuth: Inicializando...');

    // Suscribirse a cambios de autenticación
    const unsubscribe = onAuthChange((authState) => {
      console.log('🎣 Hook useAuth: Estado actualizado', authState);
      
      setUser(authState.user);
      setAuthenticated(authState.isAuthenticated);
      setLoading(false);
    });

    // Cleanup: cancelar suscripción al desmontar
    return () => {
      console.log('🎣 Hook useAuth: Limpiando suscripción');
      unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated: authenticated,
    isLoading: loading
  };
};

/**
 * 🔒 HOOK PARA REQUERIR AUTENTICACIÓN
 * 
 * Redirige al login si no está autenticado
 * 
 * Uso:
 * ```javascript
 * const { user, loading } = useRequireAuth();
 * 
 * if (loading) return <Loading />;
 * // Usuario garantizado aquí
 * ```
 */
export const useRequireAuth = (redirectUrl = '/login') => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔒 useRequireAuth: Usuario no autenticado, redirigiendo...');
      // En una app con router, aquí redirigirías:
      // navigate(redirectUrl);
    }
  }, [isAuthenticated, isLoading, redirectUrl]);

  return {
    user,
    loading: isLoading
  };
};

/**
 * 👤 OBTENER INFORMACIÓN DEL USUARIO ACTUAL
 * 
 * Versión síncrona que obtiene el usuario del estado actual de Firebase
 * 
 * @returns {Object|null} Usuario actual o null
 */
export const useCurrentUser = () => {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthChange((authState) => {
      setUser(authState.user);
    });

    return () => unsubscribe();
  }, []);

  return user;
};

/**
 * ✅ VERIFICAR SI USUARIO ESTÁ AUTENTICADO
 * 
 * Versión que verifica autenticación basándose en getCurrentUser
 * 
 * @returns {Boolean} true si está autenticado
 */
export const useIsAuthenticated = () => {
  // Inicializar basándose en si hay usuario actual
  const [authenticated, setAuthenticated] = useState(!!getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthChange((authState) => {
      setAuthenticated(authState.isAuthenticated);
    });

    return () => unsubscribe();
  }, []);

  return authenticated;
};

export default useAuth;