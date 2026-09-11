import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cpu, 
  Layers, 
  Network, 
  CheckCircle2, 
  Copy, 
  Check, 
  Play, 
  Terminal, 
  ShieldCheck,
  Zap,
  Radio,
  FileCode,
  Lock
} from 'lucide-react';
import { Language, PaymentProviderStatus } from '../types';
import { translations } from '../utils/translations';
import { apiClient } from '../services/apiClient';

interface ArchitectureInspectorProps {
  language: Language;
}

export const ArchitectureInspector: React.FC<ArchitectureInspectorProps> = ({
  language
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'SCHEMA' | 'BIOMETRICS' | 'PROVIDERS' | 'API'>('SCHEMA');
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [providers, setProviders] = useState<PaymentProviderStatus[]>([]);
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string>('Bonyeza endpoint yoyote kujaribu REST API...');
  const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const schemaData = await apiClient.getDatabaseSchema();
      setSchemaSql(schemaData.schemaSql);
      const providerData = await apiClient.getProvidersStatus();
      setProviders(providerData);
    } catch (err) {
      console.error('Failed to load architecture data:', err);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testEndpoint = async (url: string) => {
    setLoadingEndpoint(url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponse(`Error: ${err.message}`);
    } finally {
      setLoadingEndpoint(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title & Overview */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {t.architecture.title}
            </h2>
            <p className="text-xs text-slate-400">
              {t.architecture.subtitle}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            id="tab-schema-btn"
            onClick={() => setActiveTab('SCHEMA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SCHEMA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t.architecture.schemaTab}</span>
          </button>

          <button
            id="tab-biometrics-btn"
            onClick={() => setActiveTab('BIOMETRICS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'BIOMETRICS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t.architecture.biometricsTab}</span>
          </button>

          <button
            id="tab-providers-btn"
            onClick={() => setActiveTab('PROVIDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PROVIDERS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{t.architecture.providersTab}</span>
          </button>

          <button
            id="tab-api-btn"
            onClick={() => setActiveTab('API')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'API'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{t.architecture.apiTab}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POSTGRESQL SCHEMA DDL */}
      {activeTab === 'SCHEMA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                PostgreSQL 16 Schema Definition (DDL)
              </h3>
            </div>
            <button
              id="copy-sql-btn"
              onClick={handleCopySchema}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy DDL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Complies with the Bank of Tanzania (BOT) National Payment Systems (NPS) Act 2015, Cybercrimes Act, and NIDA biometric tokenization guidelines.
          </p>

          <pre className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] scrollbar-thin">
            {schemaSql || '-- Loading PostgreSQL DDL...'}
          </pre>
        </div>
      )}

      {/* TAB 2: BIOMETRIC VERIFICATION ENGINE PIPELINE */}
      {activeTab === 'BIOMETRICS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Modular Biometric Verification Pipeline
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Zero-knowledge face verification architecture: Raw camera images are converted to 512-dimensional mathematical feature vectors and irreversibly tokenized. The server never stores reconstructible photo assets on disk.
          </p>

          {/* Pipeline Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'Capture & Alignment',
                tech: 'Browser MediaDevices API',
                desc: 'Streams 60fps HD feed with biometric oval bounding box and lighting consistency validation.'
              },
              {
                step: '02',
                title: 'Anti-Spoofing & Liveness',
                tech: 'AI Depth & Motion Engine',
                desc: 'Enforces random micro-challenges (smile curve, eyelid blink interval, 3D reflection analysis).'
              },
              {
                step: '03',
                title: 'Vector Feature Extraction',
                tech: '512D Normalized Embedding',
                desc: 'Extracts 68 key facial landmarks (inter-pupillary distance, jawline curve, nasal bridge).'
              },
              {
                step: '04',
                title: 'Cosine Similarity Match',
                tech: 'Sub-millisecond Euclidean Math',
                desc: 'Compares vector against registered NIDA cryptographic hash with a strict 85.0% confidence gate.'
              },
              {
                step: '05',
                title: 'Token Authorization',
                tech: 'HMAC-SHA256 Auth Token',
                desc: 'Generates a single-use, 60-second biometric authorization token passed to the TIPS payment switch.'
              },
              {
                step: '06',
                title: 'Audit Trail & Non-Repudiation',
                tech: 'PostgreSQL biometric_audit_logs',
                desc: 'Stores immutable verification metadata, confidence scores, and IP signatures for fraud forensics.'
              }
            ].map(item => (
              <div key={item.step} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    STEP {item.step}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ACTIVE</span>
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <div className="text-[11px] font-mono text-emerald-300/80">{item.tech}</div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MODULAR PAYMENT PROVIDER ADAPTERS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Tanzanian Payment Provider Adapters (Strategy Pattern)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
              TIPS Interoperability Switch
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Real-time status of Tanzania Instant Payment System (TIPS) interbank switch, mobile network operators (Vodacom M-Pesa, Tigo Pesa, Airtel Money), and commercial banks (CRDB, NMB).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => (
              <div key={provider.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">
                    {provider.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {provider.endpointStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">LATENCY</span>
                    <span className="text-emerald-400 font-bold">{provider.latencyMs} ms</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">SUCCESS RATE</span>
                    <span className="text-white font-bold">{provider.successRate}%</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Protocol:</span>
                  <span className="text-slate-200">{provider.apiProtocol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REST API EXPLORER */}
      {activeTab === 'API' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Backend REST API Testbed
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Interactive endpoints running on Node.js/Express server with live responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'GET /api/health', url: '/api/health' },
              { label: 'GET /api/user/profile', url: '/api/user/profile' },
              { label: 'GET /api/merchants', url: '/api/merchants' },
              { label: 'GET /api/transactions', url: '/api/transactions' },
            ].map(ep => (
              <button
                key={ep.url}
                onClick={() => testEndpoint(ep.url)}
                disabled={loadingEndpoint === ep.url}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-mono text-emerald-300 border border-slate-800 transition-colors"
              >
                <span>{ep.label}</span>
                <Play className="w-3 h-3 text-emerald-400" />
              </button>
            ))}
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Response Payload (JSON)
            </span>
            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-mono text-slate-200 max-h-72 overflow-y-auto scrollbar-thin">
              {apiResponse}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
