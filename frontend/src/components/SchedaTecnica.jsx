import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { projectsAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MISURA_ROWS = [
  { key: 'errore_misura',  label: 'Errore di misura' },
  { key: 'raggio_min',     label: 'Raggio minimo misurabile [mm]' },
  { key: 'raggio_max',     label: 'Raggio massimo misurabile [mm]' },
  { key: 'dist_min',       label: 'Distanza minima Profilometro [mm]' },
  { key: 'dist_max',       label: 'Distanza massima Profilometro [mm]' },
  { key: 'corda_min',      label: 'Corda minima per misura affidabile [%]' },
  { key: 'angolo_max',     label: 'Angolo massimo corda rispetto bisettrice [°]' },
  { key: 'n_profilometri', label: 'N° profilometri gestiti' },
  { key: 'installazione',  label: 'Installazione meccanica' },
];

// All known machine models grouped
const ALL_MODELS = {
  hydraulic_3rolls: ['MAV', 'MAV/AER', 'MCO'],
  hydraulic_4rolls: ['MCA', 'MCB', 'MCB/PS'],
  mce: ['MCE-A', 'MCE-B'],
};
const ALL_MODELS_FLAT = [...ALL_MODELS.hydraulic_3rolls, ...ALL_MODELS.hydraulic_4rolls, ...ALL_MODELS.mce];

const SchedaTecnica = ({ projectId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const reportRes = await projectsAPI.getReport(projectId);

      const projectFetch = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!projectFetch.ok) throw new Error(`Project fetch failed: HTTP ${projectFetch.status}`);
      const projectRes = await projectFetch.json();

      let techSpecs = {};
      if (projectRes.specifiche_tecniche) {
        try {
          techSpecs = JSON.parse(projectRes.specifiche_tecniche);
        } catch (parseErr) {
          console.warn('Could not parse specifiche_tecniche:', parseErr);
        }
      }

      setData({ report: reportRes.data, techSpecs });
    } catch (err) {
      console.error('Error loading scheda tecnica:', err);
      setError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg p-8 flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="text-gray-700">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Chiudi</button>
        </div>
      </div>
    );
  }

  const { report, techSpecs } = data;
  const project = report.project;
  const features = report.features || [];

  // Parse tech spec selections
  const calSel = techSpecs.calender_technology || [];
  const guiSel = techSpecs.gui_interface || [];
  const pcSel = techSpecs.platform_compatibility || [];
  const hwSel = techSpecs.hardware_requirements || [];
  const osSel = techSpecs.os_compatibility || [];
  const powerSel = techSpecs.power_segmentation || [];
  const misura = techSpecs.specifiche_misura || {};

  // Section 3 - Segmenti compatibili
  const compatibleModels = ALL_MODELS_FLAT.filter(m => calSel.includes(m));
  const incompatibleModels = ALL_MODELS_FLAT.filter(m => !calSel.includes(m));

  const getModelSegments = (model) => {
    const segs = powerSel
      .filter(s => s.startsWith(model + '::'))
      .map(s => s.split('::')[1]);
    if (segs.length === 0) return 'Tutti i segmenti';
    return segs.join('+');
  };

  // PLC compatibility
  const compatiblePLC = [];
  const incompatiblePLC = [];
  if (pcSel.includes('PLC')) compatiblePLC.push('B&R (Emperor 8+)');
  else incompatiblePLC.push('B&R (Emperor 8+)');
  if (pcSel.includes('SoftPLC')) compatiblePLC.push('SoftPLC');
  else incompatiblePLC.push('SoftPLC (Pencuin Macaroni)');

  // Section 4 - System requirements
  const asemHw = hwSel.filter(h => h.startsWith('ASEM'));
  const hmiLabel = guiSel.length > 0 ? guiSel.join(' · ') : null;
  const osLabel = osSel.length > 0 ? osSel.join(' · ') : null;

  // Section 5 - Funzionalità from features
  const featureItems = features.filter(f => f.title || f.description);

  // Section 6 - Retrofit: compatible requirements derived from selections
  const retrofitCompatibleHW = compatibleModels.length > 0
    ? compatibleModels.map(m => {
        const segs = getModelSegments(m);
        return segs === 'Tutti i segmenti' ? m : `${m} (${segs})`;
      }).join(' · ')
    : null;

  const tdStyle = { border: '1px solid #cbd5e1', padding: '6px 10px', verticalAlign: 'top', fontSize: '12px' };
  const thStyle = { ...tdStyle, backgroundColor: '#f1f5f9', fontWeight: '600', fontSize: '11px' };
  const labelTdStyle = { ...tdStyle, backgroundColor: '#f8fafc', fontWeight: '500', width: '35%' };
  const subLabelTdStyle = { ...tdStyle, paddingLeft: '22px', color: '#475569' };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body * { visibility: hidden !important; }
          .scheda-doc, .scheda-doc * { visibility: visible !important; }
          .scheda-doc {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="no-print fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Stampa / Salva PDF
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow hover:bg-gray-50 text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Chiudi
        </button>
      </div>

      {/* Document */}
      <div className="scheda-print-root fixed inset-0 overflow-auto bg-gray-100 z-40 pt-16 pb-8 no-print-padding print:pt-0 print:pb-0 print:bg-white print:overflow-visible print:static">
        <div
          className="scheda-doc"
          style={{
            maxWidth: '210mm',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '20mm 18mm',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '12px',
            color: '#1e293b',
            lineHeight: '1.5',
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '3px solid #1e40af', paddingBottom: '10px', marginBottom: '18px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Scheda Tecnica — AI-Readius
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Sistema di Misura Raggio con Profilometro Laser
            </h1>
            {project.name && (
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                Progetto: <strong>{project.name}</strong>
                {project.machine_family && <> · {project.machine_family}</>}
              </div>
            )}
          </div>

          {/* Section 1 - Lavorazioni Supportate */}
          <Section title="1. Lavorazioni Supportate">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={labelTdStyle}>Tipo di lavorazione</td><td style={tdStyle}>Cilindrica Singolo Raggio</td></tr>
                <tr><td style={labelTdStyle}>Lavorazioni non supportate</td><td style={tdStyle}></td></tr>
                <tr><td style={subLabelTdStyle}>↳ Conica</td><td style={tdStyle}>Non supportata</td></tr>
                <tr><td style={subLabelTdStyle}>↳ Cilindrica Multiraggio</td><td style={tdStyle}>Non supportata</td></tr>
                <tr><td style={subLabelTdStyle}>↳ Altre</td><td style={tdStyle}>Non supportata</td></tr>
                <tr><td style={labelTdStyle}>Materiali</td><td style={tdStyle}></td></tr>
                <tr><td style={subLabelTdStyle}>↳ Tipo</td><td style={tdStyle}>Acciai · Alluminio · Altri</td></tr>
                <tr><td style={subLabelTdStyle}>↳ Materiali translucidi</td><td style={tdStyle}>Ammessi ¹</td></tr>
                <tr><td style={subLabelTdStyle}>↳ Presenza pellicola</td><td style={tdStyle}>Ammessa ¹</td></tr>
                <tr><td style={labelTdStyle}>Spessori</td><td style={tdStyle}>Qualsiasi</td></tr>
                <tr>
                  <td style={labelTdStyle}>Condizioni Ambientali</td>
                  <td style={tdStyle}>Assenza di luce abbagliante da fonte esterna diretta o riflessa da superficie rulli/lamiera in lavorazione sul lato del profilometro</td>
                </tr>
              </tbody>
            </table>
            {project.description && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                <em>Note progetto:</em> {project.description}
              </div>
            )}
          </Section>

          {/* Section 2 - Specifiche Tecniche */}
          <Section title="2. Specifiche Tecniche">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '44%' }}></th>
                  <th style={{ ...thStyle, width: '28%' }}>KEYENCE LJ-X8400</th>
                  <th style={{ ...thStyle, width: '28%' }}>KEYENCE LJ-X8900</th>
                </tr>
              </thead>
              <tbody>
                {MISURA_ROWS.map(row => {
                  const vals = misura[row.key] || { lj_x8400: '', lj_x8900: '' };
                  const empty = !vals.lj_x8400 && !vals.lj_x8900;
                  return (
                    <tr key={row.key}>
                      <td style={labelTdStyle}>{row.label}</td>
                      <td style={{ ...tdStyle, color: empty ? '#94a3b8' : '#1e293b' }}>{vals.lj_x8400 || '—'}</td>
                      <td style={{ ...tdStyle, color: empty ? '#94a3b8' : '#1e293b' }}>{vals.lj_x8900 || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          {/* Section 3 - Segmenti Macchine Supportati */}
          <Section title="3. Segmenti Macchine Supportati">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {/* Compatible HW */}
                <tr>
                  <td style={labelTdStyle}>Compatibilità HW</td>
                  <td style={tdStyle}>
                    {compatibleModels.length > 0
                      ? (() => {
                          const hydraulic4 = compatibleModels.filter(m => ALL_MODELS.hydraulic_4rolls.includes(m));
                          const hydraulic3 = compatibleModels.filter(m => ALL_MODELS.hydraulic_3rolls.includes(m));
                          const mce = compatibleModels.filter(m => ALL_MODELS.mce.includes(m));
                          const parts = [];
                          if (hydraulic4.length > 0) parts.push('Calandre idrauliche a 4 rulli');
                          if (hydraulic3.length > 0) parts.push('Calandre idrauliche a 3 rulli');
                          if (mce.length > 0) parts.push('Calandre elettriche MCE');
                          return parts.join(' · ') || '—';
                        })()
                      : '—'}
                  </td>
                </tr>
                {compatibleModels.map(m => (
                  <tr key={m}>
                    <td style={subLabelTdStyle}>↳ {m}</td>
                    <td style={tdStyle}>{getModelSegments(m)}</td>
                  </tr>
                ))}

                {/* Compatible PLC */}
                <tr>
                  <td style={labelTdStyle}>Compatibilità PLC</td>
                  <td style={tdStyle}>{compatiblePLC.length > 0 ? compatiblePLC.join(' · ') : '—'}</td>
                </tr>

                {/* Compatible SW */}
                <tr>
                  <td style={labelTdStyle}>Compatibilità SW</td>
                  <td style={tdStyle}>{guiSel.length > 0 ? guiSel.join(' · ') : '—'}</td>
                </tr>

                {/* Accessories */}
                <tr>
                  <td style={labelTdStyle}>Accessori supportati</td>
                  <td style={tdStyle}>Tutti ³⁴</td>
                </tr>

                {/* Not compatible HW */}
                {incompatibleModels.length > 0 && (
                  <>
                    <tr>
                      <td style={labelTdStyle}>Non compatibile HW</td>
                      <td style={tdStyle}></td>
                    </tr>
                    {incompatibleModels.map(m => (
                      <tr key={m}>
                        <td style={subLabelTdStyle}>↳ {m}</td>
                        <td style={tdStyle}>Nessun segmento</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={subLabelTdStyle}>↳ Curvaprofili (MCP | MC4P)</td>
                      <td style={tdStyle}>Nessun segmento</td>
                    </tr>
                  </>
                )}

                {/* Not compatible PLC */}
                {incompatiblePLC.length > 0 && (
                  <tr>
                    <td style={labelTdStyle}>Non compatibile PLC</td>
                    <td style={tdStyle}>{incompatiblePLC.join(' · ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          {/* Section 4 - Requisiti Minimi di Sistema */}
          <Section title="4. Requisiti Minimi di Sistema">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={labelTdStyle}>Sistema Operativo</td>
                  <td style={tdStyle}>{osLabel || '—'}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>PC-Box</td>
                  <td style={tdStyle}>{asemHw.length > 0 ? asemHw.join(' · ') : '—'}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>HMI</td>
                  <td style={tdStyle}>{hmiLabel || '—'}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Section 5 - Funzionalità */}
          <Section title="5. Funzionalità">
            {featureItems.length > 0 ? (
              <div>
                {featureItems.map((f, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    {f.title && <div style={{ fontWeight: '600', fontSize: '12px', color: '#1e293b' }}>{f.title}</div>}
                    {f.description && (
                      <div
                        style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}
                        dangerouslySetInnerHTML={{ __html: f.description.replace(/<[^>]+>/g, '') }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nessuna funzionalità definita per questo progetto.</p>
            )}
          </Section>

          {/* Section 6 - Retrofit */}
          <Section title="6. Retrofit">
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Costituzione del Sistema di Retrofitting</div>
              <ul style={{ margin: '0 0 0 16px', padding: 0, color: '#475569' }}>
                <li>Controllore B&R con AS4.12, alloggiato in un box elettrico indipendente</li>
                <li>Il box deve essere collegato al quadro elettrico generale della macchina da retrofittare sia per l'alimentazione che per lo scambio dati</li>
                <li>Il box include il processore KEYENCE per il controllo del profilometro ad esso collegato, fornito in dotazione con il box stesso</li>
              </ul>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Requisiti Minimi del Sistema da Retrofittare</div>
              <ul style={{ margin: '0 0 0 16px', padding: 0, color: '#475569' }}>
                {retrofitCompatibleHW
                  ? <li>Calandratura: {retrofitCompatibleHW}</li>
                  : <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nessun modello selezionato</li>
                }
                {hmiLabel && <li>HMI: {hmiLabel}</li>}
                {compatiblePLC.length > 0 && <li>PLC: {compatiblePLC.join(' · ')}</li>}
              </ul>
            </div>

            {incompatibleModels.length > 0 && (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Sistemi non supportati (non retrofittabili)</div>
                <ul style={{ margin: '0 0 0 16px', padding: 0, color: '#475569' }}>
                  {incompatibleModels.map(m => <li key={m}>{m}</li>)}
                  <li>Curvaprofili</li>
                  {incompatiblePLC.length > 0 && <li>PLC: {incompatiblePLC.join(', ')}</li>}
                </ul>
              </div>
            )}
          </Section>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '24px', paddingTop: '10px', fontSize: '10px', color: '#94a3b8' }}>
            <p>I campi contrassegnati con — sono in attesa di definizione e devono essere completati prima della pubblicazione del documento.</p>
            <p style={{ marginTop: '4px' }}>Documento generato da HMS · {new Date().toLocaleDateString('it-IT')}</p>
          </div>
        </div>
      </div>
    </>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2 style={{
      fontSize: '13px',
      fontWeight: '700',
      color: '#1e40af',
      borderBottom: '1.5px solid #bfdbfe',
      paddingBottom: '4px',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {title}
    </h2>
    {children}
  </div>
);

export default SchedaTecnica;
