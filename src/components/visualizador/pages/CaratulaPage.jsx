/**
 * CaratulaPage.jsx - Página de carátula del expediente
 *
 * Muestra la información principal del equipo:
 * - Nombre del equipo
 * - Número de serie
 * - Número de factura
 * - Número de pedimento
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {Object} props.data - Datos del equipo para la carátula
 */
export const CaratulaPage = ({ data }) => {
  if (!data) return null;

  const {
    equipmentName,
    serialNumber,
    invoiceNumber,
    customsNumber,
    r1Number,
    manufacturer,
    model,
    origin
  } = data;

  return (
    <div className="w-full min-h-full flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-2xl my-8">
        {/* Contenedor principal con borde */}
        <div className="border-4 border-blue-800 p-8">
          {/* Título del equipo */}
          <div className="text-center mb-8 pb-6 border-b-2 border-blue-800">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 uppercase tracking-wide">
              {equipmentName}
            </h1>
            {manufacturer && (
              <p className="text-lg text-blue-700 mt-2">
                {manufacturer} {model && `- ${model}`}
              </p>
            )}
          </div>

          {/* Información de identificación */}
          <div className="space-y-6">
            {/* Marca */}
            {manufacturer && (
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-900 uppercase">MARCA</p>
                <p className="text-xl text-gray-800">{manufacturer}</p>
              </div>
            )}

            {/* Número de Serie */}
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-900 uppercase">Número de Serie</p>
              <p className="text-2xl font-bold text-gray-800">{serialNumber}</p>
            </div>

            {/* Caja de Factura */}
            <div className="border-2 border-gray-400 p-4 mt-8">
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-900 uppercase">Factura</p>
                <p className="text-2xl font-bold text-gray-800">
                  {invoiceNumber || 'N/A'}
                </p>
              </div>
            </div>

            {/* Caja de Pedimento */}
            <div className="border-2 border-gray-400 p-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-900 uppercase">Pedimento</p>
                <p className="text-2xl font-bold text-gray-800">
                  {customsNumber || 'N/A'}
                </p>
              </div>
            </div>

            {/* Caja de Folio R1 - Solo para equipos EXTRANJEROS */}
            {origin === 'EXTRANJERO' && (
              <div className="border-2 border-gray-400 p-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-900 uppercase">Folio R1</p>
                  {r1Number ? (
                    <p className="text-2xl font-bold text-gray-800">{r1Number}</p>
                  ) : (
                    <p className="text-lg font-medium text-amber-600 italic">
                      SIN RECTIFICACION DE PEDIMENTO
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaratulaPage;
