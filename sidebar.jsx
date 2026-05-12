// Left sidebar — navigation

const Sidebar = ({ view, setView, projectId, setProject }) => {
  const { projects, actions, notes } = useStore();

  const counts = {
    home: actions.filter(a => !a.done && a.due && a.due <= '2026-05-18').length,
    projects: projects.filter(p => p.stage !== 'done' && p.stage !== 'parked').length,
    notes: notes.length,
    review: null,
    tools: null,
  };

  const nav = [
    { id: 'home',     label: '指挥台', icon: 'Compass', count: counts.home },
    { id: 'projects', label: '项目',   icon: 'Folder',  count: counts.projects },
    { id: 'notes',    label: '笔记',   icon: 'Note',    count: counts.notes },
    { id: 'review',   label: '回顾',   icon: 'Pulse' },
    { id: 'tools',    label: '工具',   icon: 'Wrench' },
  ];

  const active = projects.filter(p => p.stage !== 'done' && p.stage !== 'parked');
  const recent = active
    .slice()
    .sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1))
    .slice(0, 5);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <div className="b-mark">CMD-01</div>
          <div className="b-name">你好，VINC</div>
        </div>
        <div className="b-sub">v3</div>
      </div>

      {nav.map(n => {
        const Ic = I[n.icon];
        return (
          <div
            key={n.id}
            className={`nav-item ${view === n.id ? 'active' : ''}`}
            onClick={() => { setView(n.id); setProject(null); }}
          >
            <Ic size={15} />
            <span>{n.label}</span>
            {n.count != null && (
              <span className={`nv-count ${n.urgent ? 'urgent' : ''}`}>{n.count}</span>
            )}
          </div>
        );
      })}

      <div className="nav-group-label">活跃项目</div>
      {recent.map(p => (
        <div
          key={p.id}
          className={`nav-item ${projectId === p.id ? 'active' : ''}`}
          onClick={() => { setView('projects'); setProject(p.id); }}
          title={p.name}
        >
          <span
            className="nv-icon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16, height: 16,
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: stageColor(p.stage),
              }}
            />
          </span>
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontSize: 12.5,
          }}>{p.name}</span>
          {p.waitingOn === 'me' && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--amber)',
              letterSpacing: '0.1em',
            }}>ME</span>
          )}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-clock">
          <div className="time">14:32</div>
          <div className="date">2026 / 05 / 12 · 周二</div>
        </div>
        <div
          className="nav-item"
          style={{ fontSize: 12, color: 'var(--fg-faint)' }}
          onClick={() => { setView('tools'); setProject(null); }}
        >
          <I.Settings size={14} />
          <span>设置</span>
        </div>
      </div>
    </aside>
  );
};

function stageColor(stage) {
  return {
    research: 'var(--steel)',
    decide:   'var(--amber)',
    execute:  'var(--moss)',
    verify:   'var(--violet)',
    done:     'var(--fg-faint)',
    parked:   'var(--fg-dim)',
  }[stage] || 'var(--fg-faint)';
}

window.Sidebar = Sidebar;
window.stageColor = stageColor;
