// frontend/src/components/Dashboard.jsx
import React from 'react';
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const Dashboard = ({ projectId }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Progresso complessivo</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">45%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Completati</p>
              <p className="text-3xl font-bold text-green-600 mt-2">18</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">In corso</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">12</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Problemi</p>
              <p className="text-3xl font-bold text-red-600 mt-2">3</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Phase Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Stato delle fasi
        </h2>
        <div className="space-y-3">
          {[
            { phase: 'Valutazione pre-consegna', progress: 100, status: 'Complete' },
            { phase: 'Trasferimento know-how', progress: 65, status: 'In Progress' },
            { phase: 'Test di accettazione', progress: 0, status: 'Pending' },
            { phase: 'Consegna ufficiale', progress: 0, status: 'Pending' }
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{item.phase}</span>
                <span className="text-gray-600">{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.status === 'Complete' ? 'bg-green-600' :
                    item.status === 'In Progress' ? 'bg-yellow-600' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Attività recenti
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Revisione del codice completata</p>
              <p className="text-gray-500 text-xs">2 ore fa</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Sessione di trasferimento know-how pianificata</p>
              <p className="text-gray-500 text-xs">5 ore fa</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Documentazione aggiornata</p>
              <p className="text-gray-500 text-xs">1 giorno fa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
