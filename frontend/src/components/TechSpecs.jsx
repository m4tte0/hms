import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Server, HardDrive, Monitor, Save, Code2 } from 'lucide-react';

const TechSpecs = ({ projectId }) => {
  const [specs, setSpecs] = useState({
    dotnet_version: [],
    retrofit_compatibility: [],
    platform_compatibility: [],
    hardware_requirements: [],
    os_compatibility: []
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Badge definitions with colors and icons
  const categories = {
    dotnet_version: {
      title: 'Versione .NET',
      icon: Code2,
      color: 'purple',
      options: [
        '.NET 5',
        '.NET 6',
        '.NET 7',
        '.NET 8',
        '.NET Framework 4.8',
        '.NET Framework 4.7',
        '.NET Core 3.1'
      ]
    },
    retrofit_compatibility: {
      title: 'Compatibilità Retrofit',
      icon: RefreshCw,
      color: 'blue',
      options: [
        'Solo progetti legacy',
        'Solo nuovi progetti',
        'Entrambi'
      ]
    },
    platform_compatibility: {
      title: 'Compatibilità Piattaforma',
      icon: Server,
      color: 'green',
      options: [
        'SoftPLC',
        'B&R',
        'Entrambi',
        'Altro'
      ]
    },
    hardware_requirements: {
      title: 'Requisiti Hardware',
      icon: Cpu,
      color: 'orange',
      options: [
        'CPU ≥ 2 core',
        'CPU ≥ 4 core',
        'RAM ≥ 4GB',
        'RAM ≥ 8GB',
        'RAM ≥ 16GB',
        'Disco ≥ 100GB SSD'
      ]
    },
    os_compatibility: {
      title: 'Compatibilità OS',
      icon: Monitor,
      color: 'indigo',
      options: [
        'Windows 10',
        'Windows 11',
        'Windows Server 2019',
        'Windows Server 2022',
        'Linux'
      ]
    }
  };

  // Color mappings for professional look
  const colorStyles = {
    purple: {
      active: 'bg-purple-100 text-purple-800 border-purple-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-purple-50 hover:border-purple-300'
    },
    blue: {
      active: 'bg-blue-100 text-blue-800 border-blue-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-blue-50 hover:border-blue-300'
    },
    green: {
      active: 'bg-green-100 text-green-800 border-green-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-green-50 hover:border-green-300'
    },
    orange: {
      active: 'bg-orange-100 text-orange-800 border-orange-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-orange-50 hover:border-orange-300'
    },
    indigo: {
      active: 'bg-indigo-100 text-indigo-800 border-indigo-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-indigo-50 hover:border-indigo-300'
    }
  };

  useEffect(() => {
    if (projectId) {
      loadTechSpecs();
    }
  }, [projectId]);

  const loadTechSpecs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      // Parse the specifiche_tecniche JSON field
      if (data.specifiche_tecniche) {
        try {
          const parsedSpecs = JSON.parse(data.specifiche_tecniche);
          setSpecs(parsedSpecs);
        } catch (e) {
          console.log('No valid tech specs found, using defaults');
        }
      }
    } catch (error) {
      console.error('Error loading tech specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTechSpecs = async (updatedSpecs) => {
    try {
      setSaveStatus('saving');
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specifiche_tecniche: JSON.stringify(updatedSpecs)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving tech specs:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const toggleBadge = (category, option) => {
    const currentSelection = specs[category] || [];
    const isSelected = currentSelection.includes(option);

    const updatedSelection = isSelected
      ? currentSelection.filter(item => item !== option)
      : [...currentSelection, option];

    const updatedSpecs = {
      ...specs,
      [category]: updatedSelection
    };

    setSpecs(updatedSpecs);
    saveTechSpecs(updatedSpecs);
  };

  const isSelected = (category, option) => {
    return (specs[category] || []).includes(option);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Specifiche Tecniche</h2>
            <p className="text-sm text-gray-600 mt-1">
              Seleziona le caratteristiche tecniche del progetto cliccando sui badge
            </p>
          </div>
          {saveStatus && (
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Salvataggio...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">Salvato</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm font-medium text-red-600">Errore nel salvataggio</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Specification Categories */}
      <div className="space-y-6">
        {Object.entries(categories).map(([categoryKey, category]) => {
          const Icon = category.icon;
          const styles = colorStyles[category.color];

          return (
            <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${category.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-xs text-gray-500">
                    {(specs[categoryKey] || []).length > 0
                      ? `${(specs[categoryKey] || []).length} selezionato/i`
                      : 'Nessuna selezione'}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {category.options.map((option) => {
                  const selected = isSelected(categoryKey, option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleBadge(categoryKey, option)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                        selected
                          ? styles.active
                          : `${styles.inactive} ${styles.hover}`
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          Riepilogo Specifiche Selezionate
        </h3>
        <div className="space-y-2">
          {Object.entries(categories).map(([categoryKey, category]) => {
            const selections = specs[categoryKey] || [];
            if (selections.length === 0) return null;

            return (
              <div key={categoryKey} className="text-sm">
                <span className="font-medium text-gray-700">{category.title}:</span>{' '}
                <span className="text-gray-600">{selections.join(', ')}</span>
              </div>
            );
          })}
          {Object.values(specs).every(arr => arr.length === 0) && (
            <p className="text-sm text-gray-500 italic">Nessuna specifica selezionata</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechSpecs;
