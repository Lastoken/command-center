// 指挥台 (Command Center home page)
// Three modules: 项目任务 + 杂事 + 日历

const TODAY = '2026-05-12';

function fmtClock(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    }).format(date);
  } catch (e) {
    return '--:--';
  }
}

const HomeView = ({ openProject }) => {
  const { actions, looseTasks, quotes } = useStore();
  const projectTasks = actions.filter(a => !a.done)
    .sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
  const looseOpen = looseTasks.filter(t => !t.done).length;

  // Live clock — re-render every 30s so the Beijing time stays current.
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayIso = Store.todayIso();
  const quote = dailyPick(quotes, todayIso) || '今天也是值得期待的一天。';

  return (
    <div className="page">
      {/* Hero */}
      <div className="cmd-hero compact">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            title="鼓励语句 · 每日随机（在「工具」页面里编辑）"
            style={{ cursor: 'default' }}>
            {quote}
          </h1>
          <div className="meta-line">
            <span className="live">实时</span>
            <span style={{ fontWeight: 700, color: 'var(--fg-strong)' }}>
              北京 {fmtClock(now, 'Asia/Shanghai')}
            </span>
            <span>·</span>
            <span>2026 / 05 / 12 · 周二</span>
            <span>·</span>
            <span>第 20 周</span>
          </div>
        </div>
        <div className="hero-stats compact">
          <div className="cell">
            <div className="v">{projectTasks.length}</div>
            <div className="k">项目任务</div>
          </div>
          <div className="cell">
            <div className="v">{looseOpen}</div>
            <div className="k">杂事</div>
          </div>
          <div className="cell">
            <div className="v">{projectTasks.filter(a => a.due === TODAY).length + looseTasks.filter(t => t.due === TODAY && !t.done).length}</div>
            <div className="k">今天到期</div>
          </div>
        </div>
      </div>

      {/* Section 1: tasks (split) */}
      <div className="home-section">
        <div className="home-section-head">
          <h2>任务</h2>
          <span className="desc">项目类 · 杂事类</span>
        </div>
        <div className="home-grid equal">
          <ProjectTasksPanel openProject={openProject} />
          <LooseTasksPanel />
        </div>
      </div>

      {/* Section 2: calendar */}
      <div className="home-section">
        <div className="home-section-head">
          <h2>日历</h2>
          <span className="desc">任务时间安排 · 未来 14 天</span>
        </div>
        <CalendarPanel openProject={openProject} />
      </div>
    </div>
  );
};

/* ──────────────── Project tasks panel ──────────────── */
// Sort: undone first, then flagged-first inside each bucket, then by the
// project code A-Z (so PRJ-018 lines up before PRJ-022), then by due date.
const sortActions = (arr, projectMap) => arr.slice().sort((a, b) => {
  if (!!a.flagged !== !!b.flagged) return a.flagged ? -1 : 1;
  const pa = projectMap[a.project]?.code || '';
  const pb = projectMap[b.project]?.code || '';
  const codeCmp = pa.localeCompare(pb, 'zh-Hans-CN');
  if (codeCmp !== 0) return codeCmp;
  return (a.due || '9').localeCompare(b.due || '9');
});

const ProjectTasksPanel = ({ openProject }) => {
  const { actions, projects, projectMap } = useStore();
  const open = sortActions(actions.filter(t => !t.done), projectMap);
  const done = sortActions(actions.filter(t => t.done), projectMap);
  const list = [...open, ...done];

  const addPrompt = () => {
    if (projects.length === 0) {
      openModal(<Modal title="提示" onClose={closeModal}><div style={{ fontSize: 13 }}>请先新建一个项目。</div></Modal>);
      return;
    }
    openModal(<ActionFormModal />);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          <I.Flag size={14} />
          项目任务
          <span className="pcount">{open.length} 项 · 来自项目</span>
        </h2>
        <button className="btn ghost sm" onClick={addPrompt}><I.Plus size={11} /> 加一条</button>
      </div>
      <div className="panel-body">
        {list.length === 0 && (
          <div style={{ padding: '20px 16px', color: 'var(--fg-faint)', fontSize: 13 }}>
            暂无项目任务。点击右上角「加一条」开始。
          </div>
        )}
        {list.map(a => {
          const p = projectMap[a.project];
          if (!p) return null;
          const overdue = a.due && a.due < TODAY && !a.done;
          const isToday = a.due === TODAY;
          return (
            <div
              key={a.id}
              className={`action-row ${a.done ? 'done' : ''} ${a.flagged ? 'flagged' : ''}`}
              style={{ cursor: 'default' }}
            >
              <div
                className={`cb ${a.done ? 'checked' : ''}`}
                onClick={() => Store.toggleAction(a.id)}
                title={a.done ? '标记为未完成' : '标记为完成'}
              >
                <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
              </div>
              <span
                className="code"
                style={{ width: 56, flexShrink: 0, cursor: 'pointer' }}
                onClick={() => openProject(p.id)}
                title={`打开 ${p.name}`}>
                {p.code}
              </span>
              <span
                className="title"
                style={{ cursor: 'pointer' }}
                onClick={() => openProject(p.id)}
                title={`打开 ${p.name}`}>
                {a.title}
              </span>
              {a.waitingOn === 'external' && <span className="chip steel">外部</span>}
              {a.waitingOn === 'team' && <span className="chip dim">团队</span>}
              {a.waitingOn === 'me' && <span className="chip amber">ME</span>}
              <span className={`due ${overdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`}>
                {fmtDue(a.due, TODAY)}
              </span>
              <RowMenu
                flagged={a.flagged}
                onToggleFlag={() => Store.updateAction(a.id, { flagged: !a.flagged })}
                onEdit={() => openModal(<ActionFormModal actionId={a.id} />)}
                onDelete={() => openModal(<ConfirmDialog
                  title="删除行动项"
                  message={`确认删除"${a.title}"？`}
                  confirmLabel="删除" danger
                  onConfirm={() => Store.deleteAction(a.id)}
                  onClose={closeModal}
                />)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ──────────────── Loose tasks panel ──────────────── */
// Sort: undone first, then flagged-first inside each bucket, then tag A-Z
// (empty-tag last), then due date.
const sortLooseTasks = (arr) => arr.slice().sort((a, b) => {
  if (!!a.flagged !== !!b.flagged) return a.flagged ? -1 : 1;
  const ta = (a.tag || '').trim();
  const tb = (b.tag || '').trim();
  if (!ta && tb) return 1;
  if (ta && !tb) return -1;
  const tagCmp = ta.localeCompare(tb, 'zh-Hans-CN');
  if (tagCmp !== 0) return tagCmp;
  if (!a.due && b.due) return 1;
  if (a.due && !b.due) return -1;
  return (a.due || '').localeCompare(b.due || '');
});

const LooseTasksPanel = () => {
  const { looseTasks } = useStore();
  const open = sortLooseTasks(looseTasks.filter(t => !t.done));
  const done = sortLooseTasks(looseTasks.filter(t => t.done));
  const sorted = [...open, ...done];

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          <I.Check size={14} />
          杂事
          <span className="pcount">{open.length} 项 · 不属于任何项目</span>
        </h2>
        <button className="btn ghost sm" onClick={() => openModal(<LooseTaskFormModal />)}>
          <I.Plus size={11} /> 加一条
        </button>
      </div>
      <div className="panel-body">
        {sorted.length === 0 && (
          <div style={{ padding: '20px 16px', color: 'var(--fg-faint)', fontSize: 13 }}>
            暂无杂事。
          </div>
        )}
        {sorted.map(t => {
          const overdue = t.due && t.due < TODAY && !t.done;
          const isToday = t.due === TODAY;
          return (
            <div key={t.id} className={`loose-row ${t.done ? 'done' : ''} ${t.flagged ? 'flagged' : ''}`} onClick={() => Store.toggleLooseTask(t.id)}>
              <div className={`cb ${t.done ? 'checked' : ''}`}>
                <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
              </div>
              <span className="title">{t.title}</span>
              {t.tag && <span className="tag">{t.tag}</span>}
              <span className={`due ${overdue ? 'overdue' : ''} ${isToday ? 'today' : ''} ${!t.due ? 'someday' : ''}`}>
                {!t.due ? '有空' : fmtDue(t.due, TODAY)}
              </span>
              <RowMenu
                flagged={t.flagged}
                onToggleFlag={(e) => {
                  e.stopPropagation();
                  Store.updateLooseTask(t.id, { flagged: !t.flagged });
                }}
                onEdit={(e) => { e.stopPropagation(); openModal(<LooseTaskFormModal taskId={t.id} />); }}
                onDelete={(e) => {
                  e.stopPropagation();
                  openModal(<ConfirmDialog
                    title="删除杂事"
                    message={`确认删除"${t.title}"？`}
                    confirmLabel="删除" danger
                    onConfirm={() => Store.deleteLooseTask(t.id)}
                    onClose={closeModal}
                  />);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ──────────────── Inline row menu (⋯) ────────────────
   Uses position: fixed for the dropdown so it escapes the parent panel's
   overflow clipping. If there's not enough room below the button (e.g. the
   row is the last one in the list), it flips above. */
const RowMenu = ({ flagged, onToggleFlag, onEdit, onDelete }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);

  const itemCount = (onToggleFlag ? 1 : 0) + 1 /* edit */ + 1 /* delete */;
  const menuHeight = itemCount * 30 + 8; // ~30px per row + padding

  const computePos = React.useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const flipUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow;
    return {
      top: flipUp ? Math.max(8, r.top - menuHeight - 4) : r.bottom + 4,
      right: Math.max(8, window.innerWidth - r.right),
    };
  }, [menuHeight]);

  const openMenu = (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setPos(computePos());
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setPos(computePos());
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, computePos]);

  return (
    <span ref={ref} style={{ position: 'relative', marginLeft: 4, flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={openMenu}
        title="操作"
        style={{
          appearance: 'none', border: 'none', background: 'transparent',
          color: flagged ? 'var(--rust)' : 'var(--fg-faint)', cursor: 'pointer',
          width: 22, height: 22, borderRadius: 4,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <I.More size={13} />
      </button>
      {open && pos && (
        <div style={{
          position: 'fixed',
          top: pos.top, right: pos.right,
          background: 'var(--bg-elev)', border: '1px solid var(--line)',
          borderRadius: 6, padding: 4, minWidth: 110,
          boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
          zIndex: 500, fontSize: 12,
        }}>
          {onToggleFlag && (
            <div onClick={(e) => { setOpen(false); onToggleFlag(e); }}
                 style={{ padding: '6px 10px', cursor: 'pointer', color: flagged ? 'var(--fg)' : 'var(--rust)', borderRadius: 4 }}
                 onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {flagged ? '取消标红' : '标红'}
            </div>
          )}
          <div onClick={(e) => { setOpen(false); onEdit && onEdit(e); }}
               style={{ padding: '6px 10px', cursor: 'pointer', color: 'var(--fg)', borderRadius: 4 }}
               onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            编辑
          </div>
          <div onClick={(e) => { setOpen(false); onDelete && onDelete(e); }}
               style={{ padding: '6px 10px', cursor: 'pointer', color: 'var(--rust)', borderRadius: 4 }}
               onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            删除
          </div>
        </div>
      )}
    </span>
  );
};

/* ──────────────── Calendar panel (month grid) ──────────────── */
// Hard-coded lunar / solar-term / holiday labels for Apr–Jun 2026
const LUNAR = {
  '2026-04-27': '十一', '2026-04-28': '十二', '2026-04-29': '十三', '2026-04-30': '十四',
  '2026-05-01': '劳动节', '2026-05-02': '十六', '2026-05-03': '十七', '2026-05-04': '十八',
  '2026-05-05': '立夏', '2026-05-06': '二十', '2026-05-07': '廿一', '2026-05-08': '廿二',
  '2026-05-09': '廿三', '2026-05-10': '廿四', '2026-05-11': '廿五', '2026-05-12': '廿六',
  '2026-05-13': '廿七', '2026-05-14': '廿八', '2026-05-15': '廿九', '2026-05-16': '三十',
  '2026-05-17': '四月', '2026-05-18': '初二', '2026-05-19': '初三', '2026-05-20': '初四',
  '2026-05-21': '小满', '2026-05-22': '初六', '2026-05-23': '初七', '2026-05-24': '初八',
  '2026-05-25': '初九', '2026-05-26': '初十', '2026-05-27': '十一', '2026-05-28': '十二',
  '2026-05-29': '十三', '2026-05-30': '十四', '2026-05-31': '十五',
  '2026-06-01': '十六', '2026-06-02': '十七', '2026-06-03': '十八', '2026-06-04': '十九',
  '2026-06-05': '芒种', '2026-06-06': '廿一', '2026-06-07': '廿二',
};
const HOLIDAYS = new Set(['2026-05-01', '2026-05-05', '2026-05-21', '2026-06-05']);

const fmtIso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const CalendarPanel = ({ openProject }) => {
  const { actions, looseTasks, projectMap } = useStore();
  const [cursor, setCursor] = React.useState({ y: 2026, m: 5 }); // 1-indexed month
  const [selected, setSelected] = React.useState(TODAY);

  // Bucket tasks by due date
  const byDate = React.useMemo(() => {
    const map = {};
    actions.filter(a => !a.done && a.due).forEach(a => {
      (map[a.due] = map[a.due] || []).push({ kind: 'project', ...a });
    });
    looseTasks.filter(t => !t.done && t.due).forEach(t => {
      (map[t.due] = map[t.due] || []).push({ kind: 'loose', ...t });
    });
    return map;
  }, [actions, looseTasks]);

  // Build a 6-week grid starting from Monday of the week containing day 1
  const first = new Date(cursor.y, cursor.m - 1, 1);
  // JS getDay: 0=Sun..6=Sat. We want Mon-first. Monday offset:
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = fmtIso(d);
    cells.push({
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === cursor.m - 1,
      isToday: iso === TODAY,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      lunar: LUNAR[iso] || '',
      isHoliday: HOLIDAYS.has(iso),
      tasks: byDate[iso] || [],
    });
  }

  const move = (dir) => {
    let { y, m } = cursor;
    m += dir;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setCursor({ y, m });
  };

  const selectedTasks = byDate[selected] || [];
  const selectedDate = new Date(selected + 'T00:00:00');
  const selectedLabel = selected === TODAY
    ? `今天 · ${cursor.y}年${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`
    : `${selectedDate.getFullYear()}年${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`;

  return (
    <div className="panel calendar-panel">
      <div className="cal-month-head">
        <div className="cal-title">{cursor.y}年{cursor.m}月</div>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => move(-1)} aria-label="上个月">
            <svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button className="cal-nav-btn" onClick={() => move(1)} aria-label="下个月">
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button className="btn ghost sm" onClick={() => { setCursor({ y: 2026, m: 5 }); setSelected(TODAY); }}>今天</button>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-weekdays">
          {['一','二','三','四','五','六','日'].map(w => (
            <div key={w} className={`cal-wd ${w === '六' || w === '日' ? 'we' : ''}`}>{w}</div>
          ))}
        </div>
        <div className="cal-cells">
          {cells.map(c => {
            const sortedTasks = c.tasks.slice().sort((a, b) => {
              if (!!a.flagged !== !!b.flagged) return a.flagged ? -1 : 1;
              return 0;
            });
            const hasFlagged = sortedTasks.some(t => t.flagged);
            return (
            <div
              key={c.iso}
              className={[
                'cal-cell',
                c.inMonth ? '' : 'out',
                c.isToday ? 'today' : '',
                c.iso === selected ? 'selected' : '',
                c.isWeekend ? 'we' : '',
                c.tasks.length ? 'has-tasks' : '',
                hasFlagged ? 'has-flag' : '',
              ].join(' ')}
              onClick={() => setSelected(c.iso)}
            >
              <div className="d-num">{c.day}</div>
              <div className={`d-lun ${c.isHoliday ? 'holiday' : ''}`}>{c.lunar || ' '}</div>
              {sortedTasks.length > 0 && (
                <div className="d-dots">
                  {sortedTasks.slice(0, 3).map((t, i) => (
                    <span key={i} className={`dot ${t.flagged ? 'flag' : t.kind}`} />
                  ))}
                  {sortedTasks.length > 3 && <span className="dot more">+{sortedTasks.length - 3}</span>}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="cal-detail">
        <div className="cal-detail-head">
          <span className="lbl">{selectedLabel}</span>
          <span className="count">{selectedTasks.length} 项任务</span>
        </div>
        <div className="cal-detail-body">
          {selectedTasks.length === 0 ? (
            <div className="cal-empty">这一天没有安排</div>
          ) : (
            // Order day-detail rows the same way the home lists do:
            // flagged first, then by label (project code for actions, tag
            // for loose tasks), then by title.
            selectedTasks.slice().sort((a, b) => {
              if (!!a.flagged !== !!b.flagged) return a.flagged ? -1 : 1;
              const la = a.kind === 'project' ? (projectMap[a.project]?.code || '') : (a.tag || '');
              const lb = b.kind === 'project' ? (projectMap[b.project]?.code || '') : (b.tag || '');
              const cmp = la.localeCompare(lb, 'zh-Hans-CN');
              if (cmp !== 0) return cmp;
              return (a.title || '').localeCompare(b.title || '', 'zh-Hans-CN');
            }).map(item => (
              <CalRow key={item.kind + item.id} item={item} openProject={openProject} projectMap={projectMap} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FlagDot = () => (
  <span
    title="标红"
    style={{
      width: 8, height: 8, borderRadius: '50%',
      background: 'var(--rust)', flexShrink: 0,
      boxShadow: '0 0 0 2px rgba(178,80,60,0.18)',
    }}
  />
);

const CalRow = ({ item, openProject, projectMap }) => {
  if (item.kind === 'project') {
    const p = projectMap[item.project];
    if (!p) return null;
    return (
      <div className={`cal-row ${item.flagged ? 'flagged' : ''}`} onClick={() => openProject(p.id)}>
        {item.flagged && <FlagDot />}
        <span className={`cal-tag proj`}>项目</span>
        <span className="code">{p.code}</span>
        <span className="title">{item.title}</span>
        {item.waitingOn === 'me' && <span className="chip amber sm">ME</span>}
        {item.waitingOn === 'external' && <span className="chip steel sm">外部</span>}
        {item.waitingOn === 'team' && <span className="chip dim sm">团队</span>}
      </div>
    );
  }
  return (
    <div className={`cal-row ${item.flagged ? 'flagged' : ''}`}>
      {item.flagged && <FlagDot />}
      <span className={`cal-tag loose`}>杂事</span>
      <span className="title">{item.title}</span>
      {item.tag && <span className="chip dim sm">{item.tag}</span>}
    </div>
  );
};

function fmtDue(due, today) {
  if (!due) return '—';
  if (due === today) return '今日';
  if (due < today) {
    const d1 = new Date(today), d2 = new Date(due);
    const days = Math.round((d1 - d2) / 86400000);
    return `超期 ${days} 天`;
  }
  const d1 = new Date(today), d2 = new Date(due);
  const days = Math.round((d2 - d1) / 86400000);
  if (days === 1) return '明日';
  if (days <= 7) return `${days} 天后`;
  return due.slice(5);
}

window.HomeView = HomeView;
window.RowMenu = RowMenu;
window.fmtDue = fmtDue;
