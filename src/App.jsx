import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Activity, FileText, CheckCircle, ExternalLink, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ActionButton from './components/ActionButton';
import Card from './components/Card';
import FeedItem from './components/FeedItem';
import HotspotMap from './components/HotspotMap';
import ReportForm from './components/ReportForm';
import AuthorityDashboard from './components/AuthorityDashboard';
import CommunityHub from './components/CommunityHub';
import SettingsView from './components/SettingsView';
import CaseIdTicker from './components/CaseIdTicker';
import { StatDisplay, CardItem } from './primitives';

const TAB_TITLES = {
  dashboard: 'Recent filings',
  map: 'Territorial register',
  verify: 'Land verification',
  authority: 'Authority dossier',
  community: 'Community hub',
  settings: 'Platform settings',
};

const TAB_EYEBROWS = {
  dashboard: '§ I.',
  map: '§ II.',
  verify: '§ III.',
  community: '§ IV.',
  authority: '§ V.',
  settings: '§ VI.',
};

const SectionCaption = ({ tab }) => (
  <p
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.28em',
      color: 'var(--granite)',
      textTransform: 'uppercase',
      margin: 0,
    }}
  >
    {TAB_EYEBROWS[tab]} Chapter · {TAB_TITLES[tab]}
  </p>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);

  return (
    <div
      className="paper-grain"
      data-low-data={lowDataMode ? 'true' : undefined}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--paper)',
        color: 'var(--ink)',
      }}
    >
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={TAB_TITLES[activeTab] ?? 'BIGMAMA$'}
          setShowReportModal={setShowReportModal}
          caseCount={1247}
        />

        <div style={{ flex: 1, padding: '40px 40px 24px', position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
            >
              {activeTab === 'dashboard' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="dashboard" />
                  <hr className="rule-double" />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: 'var(--space-lg)',
                    }}
                  >
                    <Card
                      eyebrow="Alert § 01"
                      title="Crisis alert"
                      subtitle="High-intensity hotspot detected."
                      icon={AlertTriangle}
                      color="var(--stamp)"
                    >
                      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
                        Large-scale illegal land clearing reported in{' '}
                        <em>Harare North Sector</em>. Evidence submitted by three
                        independent citizens within the last 48 hours.
                      </p>
                    </Card>

                    <Card
                      eyebrow="Campaign § 02"
                      title="Digital activism"
                      subtitle="Anti-land-baron petition."
                      icon={Activity}
                      color="var(--dambo)"
                    >
                      <div className="bm-stack-sm">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            letterSpacing: '0.08em',
                            color: 'var(--ink)',
                          }}
                        >
                          <span>Signatures</span>
                          <span>84%</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={84}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          style={{
                            height: 8,
                            background: 'var(--paper-warm)',
                            border: '1px solid var(--ink)',
                          }}
                        >
                          <div
                            style={{
                              width: '84%',
                              height: '100%',
                              background: 'var(--dambo)',
                            }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Card
                      eyebrow="Education § 03"
                      title="Education hub"
                      subtitle="Latest guides."
                      icon={FileText}
                      color="var(--ochre-deep)"
                    >
                      <div className="bm-stack-sm" style={{ fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckCircle color="var(--dambo)" size={14} aria-hidden="true" />
                          Legal acquisition process
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AlertTriangle color="var(--stamp)" size={14} aria-hidden="true" />
                          Common land scams, 2026
                        </div>
                      </div>
                    </Card>
                  </div>

                  <section
                    className="dossier"
                    style={{ padding: '24px 28px', position: 'relative' }}
                  >
                    <header
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: 16,
                        paddingBottom: 12,
                        borderBottom: '1px solid var(--ink)',
                        marginBottom: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            letterSpacing: '0.28em',
                            textTransform: 'uppercase',
                            color: 'var(--granite)',
                            margin: '0 0 4px',
                          }}
                        >
                          Live register · Unverified
                        </p>
                        <h3
                          className="caption"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontVariationSettings: '"opsz" 144, "wght" 500',
                            fontSize: 28,
                            margin: 0,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          Incoming incidents
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <ActionButton icon={AlertTriangle} onClick={() => setShowReportModal(true)}>
                          File incident
                        </ActionButton>
                        <button
                          type="button"
                          onClick={() => setActiveTab('map')}
                          className="btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          View map <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </header>

                    <div className="bm-stack-md">
                      {[1, 2, 3].map((item) => (
                        <FeedItem
                          key={item}
                          id={item}
                          title={`Illegal stand sale · ZR-${1000 + item}`}
                          time={`${item}h ago`}
                          description={`Evidence suggests fraudulent documents being shared for Plot ${22 + item} in Borrowdale East.`}
                          tags={[
                            { label: 'Urgent', color: 'var(--stamp)' },
                            { label: 'Unverified', color: 'var(--baobab)' },
                          ]}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'map' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="map" />
                  <hr className="rule-double" />

                  <HotspotMap />

                  <section className="dossier" style={{ padding: '24px 28px' }}>
                    <header
                      style={{
                        paddingBottom: 12,
                        marginBottom: 16,
                        borderBottom: '1px solid var(--ink)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--granite)',
                          margin: '0 0 4px',
                        }}
                      >
                        Plate I · Regional figures
                      </p>
                      <h3
                        className="caption"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontVariationSettings: '"opsz" 144, "wght" 500',
                          fontSize: 26,
                          margin: 0,
                        }}
                      >
                        Regional statistics
                      </h3>
                    </header>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 'var(--space-lg)',
                      }}
                    >
                      {[
                        { label: 'Total area scanned', value: '4,280', trend: 'hectares', color: 'sky' },
                        { label: 'Active hotspots', value: '12', trend: 'open cases', color: 'magenta' },
                        { label: 'Resolved cases', value: '86', trend: 'closed', color: 'purple' },
                        { label: 'Verification rate', value: '92%', trend: 'confirmed', color: 'green' },
                      ].map((s) => (
                        <CardItem key={s.label}>
                          <StatDisplay
                            label={s.label}
                            value={s.value}
                            trend={s.trend}
                            accent={s.color}
                          />
                        </CardItem>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'verify' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="verify" />
                  <hr className="rule-double" />

                  <section className="dossier" style={{ padding: '32px 28px' }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        color: 'var(--granite)',
                        margin: '0 0 6px',
                      }}
                    >
                      Instrument § III.a
                    </p>
                    <h3
                      className="caption"
                      style={{
                        fontSize: 28,
                        margin: '0 0 8px',
                      }}
                    >
                      Land verification tool
                    </h3>
                    <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)', marginBottom: 24 }}>
                      Check property legitimacy against state records.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        type="text"
                        placeholder="Enter stand number / property ID…"
                        className="bm-form-input"
                        style={{ flex: 1 }}
                      />
                      <button className="btn-primary" type="button">
                        Verify property
                      </button>
                    </div>
                  </section>

                  <section className="dossier" style={{ padding: '24px 28px' }}>
                    <header
                      style={{
                        paddingBottom: 12,
                        marginBottom: 16,
                        borderBottom: '1px solid var(--ink)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--granite)',
                          margin: '0 0 4px',
                        }}
                      >
                        Log · Recent lookups
                      </p>
                      <h3 className="caption" style={{ fontSize: 24, margin: 0 }}>
                        Search results
                      </h3>
                    </header>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 'var(--space-md)',
                      }}
                    >
                      {[
                        { id: 'ST-2931', status: 'Legitimate', owner: 'State land',  stamp: 'dambo' },
                        { id: 'ST-1102', status: 'Fraudulent', owner: 'Unknown',      stamp: 'danger' },
                        { id: 'ST-4492', status: 'Disputed',   owner: 'Joint venture', stamp: 'ochre' },
                      ].map((res) => (
                        <div
                          key={res.id}
                          style={{
                            padding: 18,
                            border: '1px solid var(--ink)',
                            background: 'var(--paper)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: 10,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                letterSpacing: '0.14em',
                                color: 'var(--granite)',
                              }}
                            >
                              ID · {res.id}
                            </span>
                            <span className={`stamp stamp--${res.stamp}`}>{res.status}</span>
                          </div>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontVariationSettings: '"opsz" 36, "wght" 500',
                              fontSize: 18,
                              margin: 0,
                            }}
                          >
                            {res.owner}
                          </p>
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 10,
                              borderTop: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              letterSpacing: '0.14em',
                              color: 'var(--granite)',
                            }}
                          >
                            <span>Checked 10m ago</span>
                            <ExternalLink size={14} aria-hidden="true" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'authority' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="authority" />
                  <hr className="rule-double" />
                  <AuthorityDashboard />
                </div>
              )}

              {activeTab === 'community' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="community" />
                  <hr className="rule-double" />
                  <CommunityHub />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bm-page-stack">
                  <SectionCaption tab="settings" />
                  <hr className="rule-double" />
                  <SettingsView lowDataMode={lowDataMode} setLowDataMode={setLowDataMode} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <CaseIdTicker />
        <Footer />

        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(26, 24, 21, 0.72)',
                zIndex: 100,
                display: 'grid',
                placeItems: 'center',
                padding: 20,
              }}
            >
              <ReportForm onClose={() => setShowReportModal(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
