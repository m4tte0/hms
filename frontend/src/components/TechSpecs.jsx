import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Server, HardDrive, Monitor, Save, Code2, Layout } from 'lucide-react';

const TechSpecs = ({ projectId }) => {
  const [specs, setSpecs] = useState({
    dotnet_version: [],
    gui_interface: [],
    retrofit_compatibility: [],
    platform_compatibility: [],
    calender_technology: [],
    hardware_requirements: [],
    os_compatibility: []
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Badge definitions with colors and icons
  const categories = {
    calender_technology: {
      title: 'Tecnologia di Calandratura',
      icon: HardDrive,
      color: 'rose',
      options: [
        'Hydraulic',
        'MCE (Electric)'
      ]
    },
    platform_compatibility: {
      title: 'Process Control',
      icon: Server,
      color: 'green',
      options: [
        'SoftPLC',
        'PLC'
      ]
    },
    gui_interface: {
      title: 'Graphic User Interface',
      icon: Layout,
      color: 'teal',
      options: [
        'iRoll Performance',
        'iRoll eXtreme',
        'iRoll Easy',
        'iRoll Plus',
        'iRoll Aided',
        'iRoll Aided Plus'
      ]
    },
    dotnet_version: {
      title: 'Versione .NET',
      icon: Code2,
      color: 'purple',
      options: [
        '.NET 5',
        '.NET 8'
      ]
    },
    retrofit_compatibility: {
      title: 'Compatibilità Retrofit',
      icon: RefreshCw,
      color: 'blue',
      options: [
        'Solo progetti legacy',
        'Solo nuovi progetti',
        'Entrambi',
        'MCE',
        '3-Rolls',
        '4-Rolls',
        'MAV /AER',
        'Hydraulic',
        'All Segments'
      ]
    },
    hardware_requirements: {
      title: 'Requisiti Hardware',
      icon: Cpu,
      color: 'orange',
      options: [
        'ASEM :: PB5600',
        'ASEM :: BM100',
        'B&R :: CP1686'
      ]
    },
    os_compatibility: {
      title: 'Compatibilità OS',
      icon: Monitor,
      color: 'indigo',
      options: [
        'Win10 IoT Ent.',
        'Win11 IoT Ent.',
        'LTSC 2019',
        'LTSC 2021',
        'LTSC 2024'
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
    teal: {
      active: 'bg-teal-100 text-teal-800 border-teal-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-teal-50 hover:border-teal-300'
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
    },
    rose: {
      active: 'bg-rose-100 text-rose-800 border-rose-400',
      inactive: 'bg-gray-100 text-gray-500 border-gray-300',
      hover: 'hover:bg-rose-50 hover:border-rose-300'
    }
  };

  useEffect(() => {
    if (projectId) {
      // Reset specs to empty state before loading new project
      setSpecs({
        dotnet_version: [],
        gui_interface: [],
        retrofit_compatibility: [],
        platform_compatibility: [],
        calender_technology: [],
        hardware_requirements: [],
        os_compatibility: []
      });
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
          // Ensure all expected fields exist in parsed data
          setSpecs({
            dotnet_version: parsedSpecs.dotnet_version || [],
            gui_interface: parsedSpecs.gui_interface || [],
            retrofit_compatibility: parsedSpecs.retrofit_compatibility || [],
            platform_compatibility: parsedSpecs.platform_compatibility || [],
            hardware_requirements: parsedSpecs.hardware_requirements || [],
            os_compatibility: parsedSpecs.os_compatibility || []
          });
        } catch (e) {
          console.log('No valid tech specs found, using defaults');
          // Reset to empty if parsing fails
          setSpecs({
            dotnet_version: [],
            gui_interface: [],
            retrofit_compatibility: [],
            platform_compatibility: [],
            hardware_requirements: [],
            os_compatibility: []
          });
        }
      } else {
        // No tech specs in database, use empty defaults
        setSpecs({
          dotnet_version: [],
          gui_interface: [],
          retrofit_compatibility: [],
          platform_compatibility: [],
          hardware_requirements: [],
          os_compatibility: []
        });
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
      {/* Header + Summary - Merged Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Summary Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Riepilogo Specifiche Selezionate
          </h3>
          <div className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2">
            {Object.entries(categories).map(([categoryKey, category]) => {
              const selections = specs[categoryKey] || [];
              if (selections.length === 0) return null;

              return (
                <React.Fragment key={categoryKey}>
                  <div className="text-sm font-semibold text-gray-700">{category.title}:</div>
                  <div className="text-sm text-gray-600">{selections.join(', ')}</div>
                </React.Fragment>
              );
            })}
            {Object.values(specs).every(arr => arr.length === 0) && (
              <p className="text-sm text-gray-500 italic col-span-2">Nessuna specifica selezionata</p>
            )}
          </div>
        </div>
      </div>

      {/* Specification Categories */}
      <div className="space-y-6">
        {/* Tecnologia di Calandratura - Hierarchical Selection */}
        {(() => {
          const category = categories.calender_technology;
          const Icon = category.icon;
          const styles = colorStyles[category.color];
          const selections = specs.calender_technology || [];

          const hydraulicSelected = selections.includes('Hydraulic');
          const mceSelected = selections.includes('MCE (Electric)');
          const threeRollsSelected = selections.includes('3-Rolls');
          const fourRollsSelected = selections.includes('4-Rolls');

          // Hierarchy definition
          const level2 = {
            'Hydraulic': ['3-Rolls', '4-Rolls', 'Smart Line'],
            'MCE (Electric)': ['MCE-A', 'MCE-B']
          };
          const level3 = {
            '3-Rolls': ['MAV', 'MAV/AER', 'MCO'],
            '4-Rolls': ['MCA', 'MCB']
          };

          // MCE branch options
          const mceBranch = new Set(['MCE (Electric)', 'MCE-A', 'MCE-B']);
          const roseStyles = colorStyles['rose'];
          const blueStyles = colorStyles['blue'];

          const renderBadge = (option, enabled) => {
            const selected = isSelected('calender_technology', option);
            const branchStyles = mceBranch.has(option) ? blueStyles : roseStyles;
            return (
              <button
                key={option}
                onClick={() => enabled && toggleBadge('calender_technology', option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                  !enabled
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : selected
                      ? branchStyles.active
                      : `${branchStyles.inactive} ${branchStyles.hover}`
                }`}
                disabled={!enabled}
              >
                {option}
              </button>
            );
          };

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tecnologia di Calandratura */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-xs text-gray-500">
                      {selections.length > 0
                        ? `${selections.length} selezionato/i`
                        : 'Nessuna selezione'}
                    </p>
                  </div>
                </div>

                {/* Level 1: Technology */}
                <div className="flex flex-wrap gap-2">
                  {category.options.map((option) => renderBadge(option, true))}
                </div>

                {/* Level 2: Machine Family */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${(hydraulicSelected || mceSelected) ? 'text-gray-500' : 'text-gray-400'}`}>Machine Family</p>
                  <div className="flex flex-wrap gap-2">
                    {[...level2['Hydraulic'], ...level2['MCE (Electric)']].map((option) => {
                      const enabled = (level2['Hydraulic'].includes(option) && hydraulicSelected) ||
                                      (level2['MCE (Electric)'].includes(option) && mceSelected);
                      return renderBadge(option, enabled);
                    })}
                  </div>
                </div>

                {/* Level 3: Model */}
                {(hydraulicSelected || threeRollsSelected || fourRollsSelected) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${(threeRollsSelected || fourRollsSelected) ? 'text-gray-500' : 'text-gray-400'}`}>Model</p>
                    <div className="flex flex-wrap gap-2">
                      {[...level3['3-Rolls'], ...level3['4-Rolls']].map((option) => {
                        const enabled = (level3['3-Rolls'].includes(option) && threeRollsSelected) ||
                                        (level3['4-Rolls'].includes(option) && fourRollsSelected);
                        return renderBadge(option, enabled);
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Process Control - side by side */}
              {(() => {
                const pcCategory = categories.platform_compatibility;
                const PcIcon = pcCategory.icon;
                const pcStyles = colorStyles[pcCategory.color];
                return (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <PcIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{pcCategory.title}</h3>
                        <p className="text-xs text-gray-500">
                          {(specs.platform_compatibility || []).length > 0
                            ? `${(specs.platform_compatibility || []).length} selezionato/i`
                            : 'Nessuna selezione'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pcCategory.options.map((option) => {
                        const selected = isSelected('platform_compatibility', option);
                        return (
                          <button
                            key={option}
                            onClick={() => toggleBadge('platform_compatibility', option)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                              selected
                                ? pcStyles.active
                                : `${pcStyles.inactive} ${pcStyles.hover}`
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* Remaining categories */}
        {Object.entries(categories)
          .filter(([key]) => key !== 'calender_technology' && key !== 'platform_compatibility')
          .map(([categoryKey, category]) => {
            const Icon = category.icon;
            const styles = colorStyles[category.color];

            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
    </div>
  );
};

export default TechSpecs;
