/**
 * LoadingScreen.jsx - Pantalla de carga reutilizable
 * 
 * Muestra diferentes tipos de pantallas de carga según el contexto:
 * - auth: Verificando autenticación
 * - role: Cargando perfil/rol
 * - default: Carga genérica
 * 
 * @version 1.0.0
 */

import React from "react";
import { Database, Loader, User as UserIcon } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.type - Tipo de loading: "auth" | "role" | "default"
 * @param {string} props.title - Título opcional personalizado
 * @param {string} props.subtitle - Subtítulo opcional personalizado
 */
export const LoadingScreen = ({
  type = "default",
  title,
  subtitle,
}) => {
  // Configuración por tipo
  const configs = {
    auth: {
      icon: Database,
      defaultTitle: "Auditoría Industrial",
      defaultSubtitle: "Verificando autenticación...",
    },
    role: {
      icon: UserIcon,
      defaultTitle: "Cargando perfil...",
      defaultSubtitle: "Detectando rol de usuario",
    },
    default: {
      icon: Database,
      defaultTitle: "Cargando...",
      defaultSubtitle: "Por favor espera",
    },
  };

  const config = configs[type] || configs.default;
  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displaySubtitle = subtitle || config.defaultSubtitle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center gap-3 justify-center mb-4">
          <IconComponent className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {displayTitle}
        </h2>
        <p className="text-gray-600">{displaySubtitle}</p>
        <div className="mt-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
