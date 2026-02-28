// PasswordStrengthIndicator.jsx - Indicador de fortaleza de contraseña
// Versión: 1.0 - Componente de seguridad visual

import React, { useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { validatePasswordStrength } from '../../services/security/securityService';

/**
 * Componente visual para mostrar la fortaleza de una contraseña
 * @param {string} password - Contraseña a evaluar
 * @param {boolean} showRequirements - Mostrar lista de requisitos
 */
const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const analysis = useMemo(() => {
    if (!password) {
      return {
        strength: 0,
        strengthLabel: 'Sin contraseña',
        errors: [],
        isValid: false
      };
    }
    return validatePasswordStrength(password);
  }, [password]);

  // Colores según la fortaleza
  const getStrengthColor = (strength) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    if (strength === 4) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getTextColor = (strength) => {
    if (strength <= 1) return 'text-red-600';
    if (strength === 2) return 'text-orange-600';
    if (strength === 3) return 'text-yellow-600';
    if (strength === 4) return 'text-lime-600';
    return 'text-green-600';
  };

  const getIcon = (strength) => {
    if (strength <= 1) return <ShieldX className="w-4 h-4" />;
    if (strength <= 2) return <ShieldAlert className="w-4 h-4" />;
    if (strength <= 3) return <Shield className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  // No mostrar nada si no hay contraseña
  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de fortaleza */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(analysis.strength)}`}
            style={{ width: `${(analysis.strength / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium flex items-center gap-1 ${getTextColor(analysis.strength)}`}>
          {getIcon(analysis.strength)}
          {analysis.strengthLabel}
        </span>
      </div>

      {/* Lista de requisitos */}
      {showRequirements && analysis.errors.length > 0 && (
        <ul className="text-xs space-y-1">
          {analysis.errors.map((error) => (
            <li key={error} className="text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              {error}
            </li>
          ))}
        </ul>
      )}

      {/* Mensaje de éxito */}
      {analysis.isValid && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Contraseña segura
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
