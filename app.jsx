// App shell — top bar + sidebar + active view, plus global modal portal,
// command palette (⌘K), and quick-add parser.

const App = () => {
  const [view, setView] = React.useState('home');
  const [projectId, setProjectId] = React.useState(null);
  const [modalNode, setModalNode] = React.useState(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const store = useStore();

  // Hook up the global modal setter so any component can call openModal().
  React.useEffect(() => { registerModalSetter(setModalNode); }, []);

  // Mobile drawer state — toggle a body class so CSS can react.
  React.useEffect(() => {
    if (sidebarOpen) document.body.classList.add('sidebar-open');
    else document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  // Close drawer on outside click (CSS ::after backdrop catches the click).
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const onDown = (e) => {
      const sb = document.querySelector('.sidebar');
      if (sb && !sb.contains(e.target)) setSidebarOpen(false);
    };
    // Use mousedown so click on backdrop closes before any other handler fires.
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [sidebarOpen]);

  const openProject = React.useCallback((id) => {
    setView('projects');
    setProjectId(id);
    setSidebarOpen(false);
  }, []);

  // ⌘K / Ctrl+K opens the palette globally.
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const crumbs = (() => {
    if (view === 'home') return ['指挥台'];
    if (view === 'projects') {
      if (projectId) return ['项目', store.projectMap[projectId]?.name];
      return ['项目'];
    }
    if (view === 'notes')  return ['笔记'];
    if (view === 'review') return ['回顾'];
    if (view === 'tools')  return ['工具'];
    return [];
  })();

  let body;
  if (view === 'home') {
    body = <HomeView openProject={openProject} />;
  } else if (view === 'projects' && projectId) {
    body = <ProjectDetail projectId={projectId} back={() => setProjectId(null)} />;
  } else if (view === 'projects') {
    body = <ProjectsView openProject={openProject} />;
  } else if (view === 'notes') {
    body = <NotesView openProject={openProject} />;
  } else if (view === 'review') {
    body = <ReviewView />;
  } else if (view === 'tools') {
    body = <ToolsView />;
  }

  const navigate = (v, pid) => {
    setView(v);
    setProjectId(pid != null ? pid : null);
  };

  return (
    <div className="app">
      <Sidebar
        view={view}
        setView={(v) => { setView(v); setSidebarOpen(false); }}
        projectId={projectId}
        setProject={setProjectId}
      />
      <div className="main">
        <div className="topbar">
          <button
            className="tb-icon-btn mobile-only"
            aria-label="菜单"
            onClick={() => setSidebarOpen(o => !o)}
            style={{ marginRight: 4 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="crumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                <span className={i === crumbs.length - 1 ? 'head' : ''}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="tb-spacer" />
          <button className="tb-search" onClick={() => setPaletteOpen(true)}>
            <I.Search size={13} />
            <span>搜索项目、笔记、行动项…</span>
            <span className="kbd-mini">⌘K</span>
          </button>
          <button className="tb-icon-btn"><I.Bell size={15} /></button>
          <button className="tb-icon-btn"><I.User size={15} /></button>
        </div>

        {body}

        <QuickAddBar
          currentProjectId={view === 'projects' ? projectId : null}
        />
      </div>

      {modalNode}

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          navigate={navigate}
          currentProjectId={view === 'projects' ? projectId : null}
        />
      )}
    </div>
  );
};

/* ────────────── Quick-add bar ──────────────
   Parses:
     • "@projectFuzzy 笔记内容..."  → adds a note to the matched project
     • "其他文字"                   → adds a loose task
   ⌘↵ / Ctrl↵ / ↵ all submit.                          */
const QuickAddBar = ({ currentProjectId }) => {
  const [text, setText] = React.useState('');
  const [flash, setFlash] = React.useState(null);
  const store = useStore();
  const inputRef = React.useRef(null);

  const submit = () => {
    const raw = text.trim();
    if (!raw) return;
    let result = null;

    if (raw.startsWith('@')) {
      const m = raw.match(/^@(\S+)\s+([\s\S]+)$/);
      if (m) {
        const token = m[1];
        const content = m[2].trim();
        const proj = store.projects.find(p => fuzzyMatch(token, p.name) || fuzzyMatch(token, p.code));
        if (proj) {
          const firstLine = content.split('\n')[0];
          const title = firstLine.length > 28 ? firstLine.slice(0, 28) + '…' : firstLine;
          Store.addNote({ project: proj.id, title, body: content, kind: 'insight' });
          result = `✓ 已记到「${proj.name}」`;
        } else {
          result = `× 未找到匹配 "${token}" 的项目`;
        }
      } else {
        result = '× 用法：@项目名 笔记内容';
      }
    } else {
      Store.addLooseTask({ title: raw });
      result = '✓ 已加入杂事';
    }

    if (result.startsWith('✓')) setText('');
    setFlash(result);
    window.setTimeout(() => setFlash(null), 2000);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const ctxName = currentProjectId ? store.projectMap[currentProjectId]?.name : null;
  const placeholder = ctxName
    ? `快速记一条：直接输入 → 杂事；@${ctxName.slice(0, 6)}… 内容 → 项目笔记`
    : `快速记一条：'@CNC换代 上海精机张工说丝杠是 HIWIN 原装，待书面确认'`;

  return (
    <div className="quick-bar">
      <I.Plus size={14} />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {flash && (
        <span style={{
          fontSize: 11.5,
          color: flash.startsWith('✓') ? 'var(--moss)' : 'var(--rust)',
          fontFamily: 'var(--font-mono)',
          marginRight: 8,
          whiteSpace: 'nowrap',
        }}>{flash}</span>
      )}
      <span className="hint">
        <span className="kbd">⌘</span>
        <span className="kbd">↵</span>
        添加
      </span>
    </div>
  );
};

/* ────────────── Command palette ──────────────
   Searches projects / notes / actions. Enter → jump.                 */
const CommandPalette = ({ onClose, navigate, currentProjectId }) => {
  const store = useStore();
  const [q, setQ] = React.useState('');
  const [cursor, setCursor] = React.useState(0);

  const results = React.useMemo(() => {
    const norm = q.trim().toLowerCase();
    const out = [];

    // Static actions first (always shown when no query, or fuzzy-matched).
    const actions = [
      { kind: 'action', id: 'new-project', label: '新建项目', hint: '项目', run: () => {
        onClose();
        openProject_NewProjectModal();
      }},
      { kind: 'action', id: 'new-note', label: currentProjectId ? '在当前项目记一条笔记' : '记一条笔记…', hint: '笔记', run: () => {
        onClose();
        openModal(<NoteFormModal projectId={currentProjectId} />);
      }},
      { kind: 'jump', id: 'jump-home',     label: '跳转 · 指挥台',  hint: 'G H', run: () => { onClose(); navigate('home'); } },
      { kind: 'jump', id: 'jump-projects', label: '跳转 · 项目',    hint: 'G P', run: () => { onClose(); navigate('projects'); } },
      { kind: 'jump', id: 'jump-notes',    label: '跳转 · 笔记',    hint: 'G N', run: () => { onClose(); navigate('notes'); } },
      { kind: 'jump', id: 'jump-review',   label: '跳转 · 回顾',    hint: 'G R', run: () => { onClose(); navigate('review'); } },
      { kind: 'jump', id: 'jump-tools',    label: '跳转 · 工具',    hint: 'G T', run: () => { onClose(); navigate('tools'); } },
    ];

    if (!norm) {
      return actions;
    }

    // Projects
    store.projects.forEach(p => {
      const hay = `${p.code} ${p.name} ${(p.tags || []).join(' ')}`.toLowerCase();
      if (hay.includes(norm) || fuzzyMatch(norm, p.name)) {
        out.push({
          kind: 'project', id: p.id, label: p.name, hint: p.code,
          sub: STAGE[p.stage]?.label,
          run: () => { onClose(); navigate('projects', p.id); },
        });
      }
    });

    // Notes
    store.notes.forEach(n => {
      const hay = `${n.title} ${n.body}`.toLowerCase();
      if (hay.includes(norm)) {
        const p = store.projectMap[n.project];
        out.push({
          kind: 'note', id: n.id, label: n.title || '(无标题笔记)',
          hint: p ? p.code : '—',
          sub: n.when,
          run: () => { onClose(); navigate('projects', n.project); },
        });
      }
    });

    // Actions
    store.actions.forEach(a => {
      if (a.title.toLowerCase().includes(norm)) {
        const p = store.projectMap[a.project];
        out.push({
          kind: 'action', id: a.id, label: a.title,
          hint: p ? p.code : '—',
          sub: a.done ? '已完成' : (a.due || '无期限'),
          run: () => { onClose(); navigate('projects', a.project); },
        });
      }
    });

    // Loose tasks
    store.looseTasks.forEach(t => {
      if (t.title.toLowerCase().includes(norm)) {
        out.push({
          kind: 'loose', id: t.id, label: t.title,
          hint: '杂事', sub: t.tag,
          run: () => { onClose(); navigate('home'); },
        });
      }
    });

    return out;
  }, [q, store, navigate, onClose, currentProjectId]);

  React.useEffect(() => { setCursor(0); }, [q]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(results.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[cursor];
      if (hit) hit.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(15, 18, 22, 0.42)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          width: 560, maxWidth: '92vw', maxHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}>
        <div style={{
          padding: '11px 14px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <I.Search size={14} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜索项目 / 笔记 / 行动项…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--fg)',
              fontSize: 14, fontFamily: 'inherit',
            }}
          />
          <span className="kbd-mini">ESC</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {results.length === 0 && (
            <div style={{ padding: '24px 18px', color: 'var(--fg-faint)', fontSize: 13 }}>
              无匹配结果
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={r.kind + ':' + r.id}
              onMouseEnter={() => setCursor(i)}
              onClick={() => r.run()}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                background: i === cursor ? 'var(--bg-hover)' : 'transparent',
                borderLeft: i === cursor ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10, color: 'var(--fg-faint)',
                width: 48, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{r.kind}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
              {r.sub && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{r.sub}</span>
              )}
              {r.hint && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{r.hint}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--line)',
          fontSize: 11, color: 'var(--fg-faint)',
          fontFamily: 'var(--font-mono)',
          display: 'flex', gap: 18,
        }}>
          <span><span className="kbd">↑</span><span className="kbd">↓</span> 选择</span>
          <span><span className="kbd">↵</span> 打开</span>
          <span><span className="kbd">ESC</span> 关闭</span>
        </div>
      </div>
    </div>
  );
};

// Small helper used by the palette's "新建项目" command. Defined inline so the
// palette doesn't need to import the form lazily.
function openProject_NewProjectModal() {
  openModal(<ProjectFormModal />);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
