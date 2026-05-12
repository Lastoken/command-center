// Projects, ProjectDetail, Notes, Review, Tools views + form modals.

/* ─────────── InlineCheckbox — small clickable check for compact lists ─────────── */
const InlineCheckbox = ({ checked, priorityHigh, onClick }) => (
  <span
    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    title={checked ? '标记为未完成' : '标记为完成'}
    style={{
      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
      border: '1px solid ' + (checked ? 'var(--accent)' : (priorityHigh ? 'var(--amber)' : 'var(--line-strong)')),
      background: checked ? 'var(--accent)' : (priorityHigh ? 'var(--amber-bg)' : 'transparent'),
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
    {checked && (
      <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, stroke: '#fff', strokeWidth: 3, fill: 'none' }}>
        <path d="M5 12l5 5L20 7" />
      </svg>
    )}
  </span>
);

/* ════════════════════════════════════════════════════════════════════════
   FORM MODALS
   Each form supports both "create" (no id prop) and "edit" (id prop).
   ════════════════════════════════════════════════════════════════════════ */

/* ─────────── Project form ─────────── */
const ProjectFormModal = ({ projectId }) => {
  const { projects, kinds } = useStore();
  const existing = projectId ? projects.find(p => p.id === projectId) : null;
  const [form, setForm] = React.useState(() => existing
    ? { ...existing, tags: (existing.tags || []).join(', ') }
    : {
        name: '', code: '',
        kind: (kinds && kinds[0] && kinds[0].id) || 'process',
        stage: 'research',
        priority: 'medium', waitingOn: 'me',
        startedAt: Store.todayIso(), deadline: '', summary: '', tags: '',
        progress: 0, risk: '',
      }
  );
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return;
    const data = {
      ...form,
      tags: typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : form.tags,
      progress: Number(form.progress) || 0,
      deadline: form.deadline || null,
      risk: form.risk || null,
    };
    if (projectId) Store.updateProject(projectId, data);
    else Store.addProject(data);
    closeModal();
  };

  // If the current form.kind no longer exists (user deleted it), fall back to
  // the first available kind so the <select> stays in a valid state.
  const kindOptions = (kinds && kinds.length > 0 ? kinds : [{ id: form.kind, label: form.kind }]);
  const kindMissing = !kindOptions.some(k => k.id === form.kind);

  return (
    <Modal
      title={projectId ? '编辑项目' : '新建项目'}
      onClose={closeModal}
      width={520}
      footer={
        <>
          {projectId && (
            <button
              className="btn sm"
              style={{ color: 'var(--rust)', marginRight: 'auto' }}
              onClick={() => openModal(<ConfirmDialog
                title="删除项目"
                message={`项目"${existing.name}"及其所有笔记 / 行动项都会被删除，无法恢复。`}
                confirmLabel="删除" danger
                onConfirm={() => Store.deleteProject(projectId)}
                onClose={closeModal}
              />)}>
              删除项目
            </button>
          )}
          <button className="btn sm" onClick={closeModal}>取消</button>
          <button className="btn primary sm" onClick={save}>{projectId ? '保存' : '创建'}</button>
        </>
      }>
      <Field label="项目名"><TextInput value={form.name} onChange={(v) => set('name', v)} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="编号"><TextInput value={form.code} onChange={(v) => set('code', v)} placeholder="自动生成" /></Field>
        <Field label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            类别
            <button
              type="button"
              className="btn ghost sm"
              style={{ padding: '0 6px', fontSize: 10, lineHeight: 1.4 }}
              onClick={() => openModal(<KindsEditorModal />)}>
              管理
            </button>
          </span>
        }>
          <Select
            value={kindMissing ? '' : form.kind}
            onChange={(v) => set('kind', v)}
            options={[
              ...(kindMissing ? [{ value: '', label: `（原:${form.kind}）已删除` }] : []),
              ...kindOptions.map(k => ({ value: k.id, label: k.label })),
            ]} />
        </Field>
        <Field label="优先级" hint={form.priority === 'high' ? '高优 → 自动置顶 + 红标' : null}>
          <Select value={form.priority} onChange={(v) => set('priority', v)}
                  options={[
                    { value: 'high', label: '高' },
                    { value: 'medium', label: '中' },
                    { value: 'low', label: '低' },
                  ]} />
        </Field>
        <Field label="等待方">
          <Select value={form.waitingOn} onChange={(v) => set('waitingOn', v)}
                  options={[
                    { value: 'me', label: '等我' },
                    { value: 'team', label: '等团队' },
                    { value: 'external', label: '等外部' },
                  ]} />
        </Field>
        <Field label="风险">
          <Select value={form.risk || ''} onChange={(v) => set('risk', v)}
                  options={[
                    { value: '', label: '无' },
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' },
                  ]} />
        </Field>
        <Field label="启动日"><TextInput type="date" value={form.startedAt || ''} onChange={(v) => set('startedAt', v)} /></Field>
        <Field label="截止日"><TextInput type="date" value={form.deadline || ''} onChange={(v) => set('deadline', v)} /></Field>
      </div>
      <Field label="进度（0–1）">
        <TextInput type="number" value={form.progress} onChange={(v) => set('progress', v)} />
      </Field>
      <Field label="标签（逗号分隔）"><TextInput value={form.tags} onChange={(v) => set('tags', v)} placeholder="车间, 设备" /></Field>
      <Field label="概要"><TextArea value={form.summary} onChange={(v) => set('summary', v)} rows={4} /></Field>
    </Modal>
  );
};

/* ─────────── Kinds editor (项目类别管理) ─────────── */
// 8-swatch picker for choosing a category's sticky-note color. `sky` is the
// reserved color for 杂事 (loose tasks) — disabled here so categories can't
// collide with the universal loose-task color.
const KindColorPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
    {KIND_COLORS.map(c => {
      const reserved = c.id === LOOSE_COLOR_ID;
      const selected = value === c.id;
      return (
        <button
          key={c.id}
          type="button"
          title={reserved ? `${c.label}（杂事专用）` : c.label}
          disabled={reserved}
          onClick={() => onChange(c.id)}
          style={{
            width: 18, height: 18, borderRadius: 4, padding: 0,
            background: c.bg,
            border: '2px solid ' + (selected ? '#1a1d23' : c.border),
            cursor: reserved ? 'not-allowed' : 'pointer',
            opacity: reserved ? 0.35 : 1,
            flexShrink: 0,
          }}
        />
      );
    })}
  </div>
);

const KindsEditorModal = () => {
  const { kinds, projects } = useStore();
  const [adding, setAdding] = React.useState('');
  const [addingColor, setAddingColor] = React.useState('cream');
  const usage = React.useMemo(() => {
    const m = {};
    projects.forEach(p => { m[p.kind] = (m[p.kind] || 0) + 1; });
    return m;
  }, [projects]);

  const add = () => {
    const v = adding.trim();
    if (!v) return;
    Store.addKind(v, addingColor);
    setAdding('');
    setAddingColor('cream');
  };

  return (
    <Modal
      title="项目类别 · 管理"
      onClose={closeModal}
      width={560}
      footer={<button className="btn primary sm" onClick={closeModal}>完成</button>}>
      <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginBottom: 10 }}>
        颜色 = 这个类别的"便签纸"颜色，会显示在日历上。天蓝色保留给"杂事"，不可用。
      </div>
      <div style={{ marginBottom: 14 }}>
        {kinds.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--fg-faint)', padding: '8px 0' }}>暂无类别，下方添加一个。</div>
        )}
        {kinds.map(k => (
          <div key={k.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0', borderBottom: '1px solid var(--line-faint)',
          }}>
            <KindColorPicker value={k.color || 'cream'} onChange={(c) => Store.updateKind(k.id, { color: c })} />
            <input
              type="text"
              value={k.label}
              onChange={(e) => Store.updateKind(k.id, { label: e.target.value })}
              style={{ ...FIELD_STYLE, flex: 1, minWidth: 0 }}
            />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: usage[k.id] ? 'var(--fg-muted)' : 'var(--fg-faint)',
              minWidth: 48, textAlign: 'right',
            }}>
              {usage[k.id] ? `${usage[k.id]} 项` : '未使用'}
            </span>
            <button
              className="btn ghost sm"
              title="删除"
              style={{ color: 'var(--rust)' }}
              onClick={() => {
                if (usage[k.id]) {
                  openModal(<ConfirmDialog
                    title="删除类别"
                    message={`"${k.label}" 还有 ${usage[k.id]} 个项目在用。删除后这些项目仍会显示原类别名，但选择器里就没了。`}
                    confirmLabel="仍要删除" danger
                    onConfirm={() => Store.deleteKind(k.id)}
                    onClose={() => openModal(<KindsEditorModal />)}
                  />);
                } else {
                  Store.deleteKind(k.id);
                }
              }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <KindColorPicker value={addingColor} onChange={setAddingColor} />
        <input
          type="text"
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="新类别名 · 回车添加"
          style={{ ...FIELD_STYLE, flex: 1, minWidth: 0 }}
        />
        <button className="btn primary sm" onClick={add}>添加</button>
      </div>
    </Modal>
  );
};

/* ─────────── Note form ─────────── */
const NoteFormModal = ({ noteId, projectId, linkedTo }) => {
  const { notes, projects, actions } = useStore();
  const existing = noteId ? notes.find(n => n.id === noteId) : null;
  const initialLink = existing ? (existing.linkedTo || null) : (linkedTo || null);
  const [form, setForm] = React.useState(() => existing
    ? { ...existing, linkedTo: existing.linkedTo || null }
    : {
        project: projectId || (linkedTo && linkedTo.kind === 'action' && (() => {
          const a = (Store.getState().actions || []).find(x => x.id === linkedTo.id);
          return a ? a.project : null;
        })()) || (projects[0] && projects[0].id) || '',
        kind: 'insight', title: '', body: '',
        when: Store.nowStamp(),
        linkedTo: linkedTo || null,
      }
  );
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.project) return;
    if (!form.title.trim() && !form.body.trim()) return;
    const title = form.title.trim() || form.body.trim().split('\n')[0].slice(0, 30);
    const data = { ...form, title };
    if (!data.linkedTo) delete data.linkedTo;
    if (noteId) Store.updateNote(noteId, data);
    else Store.addNote(data);
    closeModal();
  };

  // Link options are scoped to the currently selected project.
  const projActions = actions.filter(a => a.project === form.project);
  const linkValue = form.linkedTo ? `${form.linkedTo.kind}:${form.linkedTo.id}` : '';

  return (
    <Modal
      title={noteId ? '编辑笔记' : '新建笔记'}
      onClose={closeModal}
      width={520}
      footer={
        <>
          {noteId && (
            <button className="btn sm" style={{ color: 'var(--rust)', marginRight: 'auto' }}
                    onClick={() => openModal(<ConfirmDialog
                      title="删除笔记" message={`确认删除"${existing.title}"？`}
                      confirmLabel="删除" danger
                      onConfirm={() => Store.deleteNote(noteId)} onClose={closeModal}
                    />)}>
              删除
            </button>
          )}
          <button className="btn sm" onClick={closeModal}>取消</button>
          <button className="btn primary sm" onClick={save}>{noteId ? '保存' : '创建'}</button>
        </>
      }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="所属项目">
          <Select value={form.project} onChange={(v) => {
            // If switching projects, also clear an irrelevant link.
            set('project', v);
            if (form.linkedTo) set('linkedTo', null);
          }}
                  options={projects.map(p => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
        </Field>
        <Field label="类型">
          <Select value={form.kind} onChange={(v) => set('kind', v)}
                  options={[
                    { value: 'meeting', label: '会议' },
                    { value: 'insight', label: '洞察' },
                    { value: 'research', label: '调研' },
                    { value: 'decision', label: '决策' },
                  ]} />
        </Field>
      </div>
      <Field
        label="关联到"
        hint={initialLink && !form.linkedTo ? '已清除原关联' : null}>
        <Select
          value={linkValue}
          onChange={(v) => {
            if (!v) return set('linkedTo', null);
            const [kind, id] = v.split(':');
            set('linkedTo', { kind, id });
          }}
          options={[
            { value: '', label: '不关联' },
            ...projActions.map(a => ({ value: `action:${a.id}`, label: `行动项 · ${a.title}` })),
          ]} />
      </Field>
      <Field label="标题"><TextInput value={form.title} onChange={(v) => set('title', v)} autoFocus /></Field>
      <Field label="正文"><TextArea value={form.body} onChange={(v) => set('body', v)} rows={6} /></Field>
    </Modal>
  );
};

/* ─────────── Linked badge for note rows ─────────── */
const LinkedBadge = ({ note }) => {
  const { actions } = useStore();
  if (!note.linkedTo) return null;
  let label = null;
  if (note.linkedTo.kind === 'action') {
    const a = actions.find(x => x.id === note.linkedTo.id);
    label = a ? `行动项 · ${a.title}` : '行动项（已删除）';
  }
  // Legacy notes linked to decisions just render no badge — the feature is gone.
  if (!label) return null;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10.5,
      padding: '1px 6px', borderRadius: 3,
      color: 'var(--accent)',
      border: '1px solid var(--accent-line)',
      background: 'var(--accent-bg)',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis',
      maxWidth: 240,
    }} title={label}>
      ↪ {label}
    </span>
  );
};

/* ─────────── Action form ─────────── */
const ActionFormModal = ({ actionId, projectId }) => {
  const { actions, projects } = useStore();
  const existing = actionId ? actions.find(a => a.id === actionId) : null;
  const [form, setForm] = React.useState(() => existing
    ? { ...existing }
    : {
        project: projectId || (projects[0] && projects[0].id) || '',
        title: '', due: '', waitingOn: 'me', priority: 'medium', done: false,
      }
  );
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.project || !form.title.trim()) return;
    const data = { ...form, due: form.due || null };
    if (actionId) Store.updateAction(actionId, data);
    else Store.addAction(data);
    closeModal();
  };

  return (
    <Modal
      title={actionId ? '编辑行动项' : '新建行动项'}
      onClose={closeModal}
      width={480}
      footer={
        <>
          {actionId && (
            <button className="btn sm" style={{ color: 'var(--rust)', marginRight: 'auto' }}
                    onClick={() => openModal(<ConfirmDialog
                      title="删除行动项" message={`确认删除"${existing.title}"？`}
                      confirmLabel="删除" danger
                      onConfirm={() => Store.deleteAction(actionId)} onClose={closeModal}
                    />)}>
              删除
            </button>
          )}
          <button className="btn sm" onClick={closeModal}>取消</button>
          <button className="btn primary sm" onClick={save}>{actionId ? '保存' : '创建'}</button>
        </>
      }>
      <Field label="所属项目">
        <Select value={form.project} onChange={(v) => set('project', v)}
                options={projects.map(p => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
      </Field>
      <Field label="标题"><TextInput value={form.title} onChange={(v) => set('title', v)} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="截止日"><TextInput type="date" value={form.due || ''} onChange={(v) => set('due', v)} /></Field>
        <Field label="优先级">
          <Select value={form.priority} onChange={(v) => set('priority', v)}
                  options={[
                    { value: 'high', label: '高' },
                    { value: 'medium', label: '中' },
                    { value: 'low', label: '低' },
                  ]} />
        </Field>
        <Field label="等待方">
          <Select value={form.waitingOn} onChange={(v) => set('waitingOn', v)}
                  options={[
                    { value: 'me', label: '等我' },
                    { value: 'team', label: '等团队' },
                    { value: 'external', label: '等外部' },
                  ]} />
        </Field>
      </div>
    </Modal>
  );
};

/* ─────────── Loose task form ─────────── */
const LooseTaskFormModal = ({ taskId }) => {
  const { looseTasks } = useStore();
  const existing = taskId ? looseTasks.find(t => t.id === taskId) : null;
  const [form, setForm] = React.useState(() => existing
    ? { ...existing }
    : { title: '', due: '', tag: '', done: false }
  );
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.title.trim()) return;
    const data = { ...form, due: form.due || null };
    if (taskId) Store.updateLooseTask(taskId, data);
    else Store.addLooseTask(data);
    closeModal();
  };

  return (
    <Modal
      title={taskId ? '编辑杂事' : '新建杂事'}
      onClose={closeModal}
      width={440}
      footer={
        <>
          <button className="btn sm" onClick={closeModal}>取消</button>
          <button className="btn primary sm" onClick={save}>{taskId ? '保存' : '创建'}</button>
        </>
      }>
      <Field label="标题"><TextInput value={form.title} onChange={(v) => set('title', v)} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="截止日"><TextInput type="date" value={form.due || ''} onChange={(v) => set('due', v)} /></Field>
        <Field label="标签"><TextInput value={form.tag} onChange={(v) => set('tag', v)} placeholder="财务 / 行政 …" /></Field>
      </div>
    </Modal>
  );
};


/* ─────────── Cloud sync (GitHub Gist) ─────────── */
const SyncSettingsModal = () => {
  const cfg = useSyncConfig();
  const [token, setToken] = React.useState(cfg.token || '');
  const [gistId, setGistId] = React.useState(cfg.gistId || '');
  const [auto, setAuto] = React.useState(!!cfg.auto);
  const [busy, setBusy] = React.useState(null); // 'push' | 'pull' | null
  const [msg, setMsg] = React.useState(null);

  const saveConfig = (patch) => {
    GistSync.setConfig(patch);
  };

  const doPush = async () => {
    // Persist edits first so push uses the latest values.
    saveConfig({ token: token.trim(), gistId: gistId.trim() });
    setBusy('push'); setMsg(null);
    try {
      const id = await GistSync.push();
      setGistId(id || '');
      setMsg({ ok: true, text: '已推送到云端' });
    } catch (e) {
      setMsg({ ok: false, text: String(e.message || e) });
    } finally {
      setBusy(null);
    }
  };

  const doPull = async () => {
    saveConfig({ token: token.trim(), gistId: gistId.trim() });
    setBusy('pull'); setMsg(null);
    try {
      await GistSync.pull();
      setMsg({ ok: true, text: '已从云端拉取并覆盖本机' });
    } catch (e) {
      setMsg({ ok: false, text: String(e.message || e) });
    } finally {
      setBusy(null);
    }
  };

  const toggleAuto = (v) => {
    setAuto(v);
    saveConfig({ token: token.trim(), gistId: gistId.trim(), auto: v });
  };

  return (
    <Modal
      title="云端同步 · GitHub Gist"
      onClose={closeModal}
      width={520}
      footer={
        <>
          <button className="btn sm" onClick={closeModal}>关闭</button>
        </>
      }>
      <div style={{
        fontSize: 12.5, lineHeight: 1.7, color: 'var(--fg-muted)',
        padding: '10px 12px', marginBottom: 14,
        border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg)',
      }}>
        手机和电脑同步用法：
        <div style={{ marginTop: 6 }}>
          1. 去 <a href="https://github.com/settings/tokens/new?scopes=gist&description=CommandCenter" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>github.com/settings/tokens</a> 生成一个 Token（勾选 <code style={{ background: 'var(--bg-hover)', padding: '0 4px', borderRadius: 3 }}>gist</code> 权限）
        </div>
        <div>2. 把 Token 粘进下面，点「推送到云端」→ 自动创建一个私有 Gist</div>
        <div>3. 在另一台设备（手机 / 另一台电脑）打开本页，粘同一个 Token + Gist ID，点「从云端拉取」</div>
        <div style={{ marginTop: 6, color: 'var(--fg-faint)' }}>说明：Token 仅存在你这台设备的 localStorage 里，不会上传到任何第三方服务器。同步策略是"最后写入获胜"，没有合并。</div>
      </div>

      <Field label="GitHub Token" hint="一次性生成，只勾 gist 权限即可">
        <TextInput value={token} onChange={setToken} placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" />
      </Field>
      <Field label="Gist ID" hint="首次推送会自动创建并填回这里；另一端粘进来即可拉取">
        <TextInput value={gistId} onChange={setGistId} placeholder="留空 = 首次推送自动创建" />
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => toggleAuto(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span>保存后自动推送（2 秒防抖）</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button
          className="btn primary sm"
          disabled={!token || busy != null}
          onClick={doPush}
          style={{ opacity: (!token || busy != null) ? 0.5 : 1 }}>
          {busy === 'push' ? '推送中…' : '推送到云端'}
        </button>
        <button
          className="btn sm"
          disabled={!token || !gistId || busy != null}
          onClick={() => openModal(<ConfirmDialog
            title="从云端覆盖本机数据"
            message="拉取后本机当前数据会被云端版本完全覆盖。确认继续？"
            confirmLabel="覆盖" danger
            onConfirm={doPull}
            onClose={() => openModal(<SyncSettingsModal />)}
          />)}
          style={{ opacity: (!token || !gistId || busy != null) ? 0.5 : 1 }}>
          {busy === 'pull' ? '拉取中…' : '从云端拉取'}
        </button>
      </div>

      {msg && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
          color: msg.ok ? 'var(--moss)' : 'var(--rust)',
          background: msg.ok ? 'rgba(110,163,106,0.10)' : 'rgba(178,80,60,0.08)',
          border: '1px solid ' + (msg.ok ? 'rgba(110,163,106,0.25)' : 'rgba(178,80,60,0.20)'),
        }}>{msg.text}</div>
      )}

      <div style={{
        marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--fg-faint)', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div>最近推送：{cfg.lastPush || '—'}</div>
        <div>最近拉取：{cfg.lastPull || '—'}</div>
        {cfg.lastErr && <div style={{ color: 'var(--rust)' }}>上次错误：{cfg.lastErr}</div>}
      </div>
    </Modal>
  );
};

/* ─────────── Quotes editor ─────────── */
const QuotesEditorModal = () => {
  const { quotes } = useStore();
  const [text, setText] = React.useState(() => (quotes || []).join('\n'));
  const todayIso = Store.todayIso();
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const preview = lines.length > 0 ? dailyPick(lines, todayIso) : '';

  const save = () => {
    Store.setQuotes(lines);
    closeModal();
  };

  return (
    <Modal
      title="编辑鼓励语句"
      onClose={closeModal}
      width={520}
      footer={
        <>
          <button className="btn sm" onClick={closeModal}>取消</button>
          <button className="btn primary sm" onClick={save}>保存</button>
        </>
      }>
      <Field label="今日预览">
        <div style={{
          padding: '10px 12px',
          border: '1px solid var(--line)',
          borderRadius: 6,
          background: 'var(--bg)',
          color: 'var(--fg-strong)',
          fontSize: 14,
          minHeight: 20,
        }}>
          {preview || <span style={{ color: 'var(--fg-faint)' }}>列表为空</span>}
        </div>
      </Field>
      <Field label="语句列表（每行一条）" hint={`共 ${lines.length} 条 · 每天按日期确定显示哪一条`}>
        <TextArea value={text} onChange={setText} rows={12} placeholder="今天也是值得期待的一天。" />
      </Field>
    </Modal>
  );
};


/* ════════════════════════════════════════════════════════════════════════
   PROJECTS LIST
   ════════════════════════════════════════════════════════════════════════ */
const ProjectsView = ({ openProject }) => {
  const { projects, actions, notes, kinds } = useStore();
  // Sort order:
  //   1. Active projects before done/parked.
  //   2. Within each group, priority=high pinned to top.
  //   3. Then by lastUpdate desc.
  const sorted = [...projects].sort((a, b) => {
    const aDone = a.stage === 'done' || a.stage === 'parked';
    const bDone = b.stage === 'done' || b.stage === 'parked';
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aHi = a.priority === 'high';
    const bHi = b.priority === 'high';
    if (aHi !== bHi) return aHi ? -1 : 1;
    return a.lastUpdate < b.lastUpdate ? 1 : -1;
  });

  const [expanded, setExpanded] = React.useState(() => new Set([sorted[0]?.id].filter(Boolean)));
  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const active = projects.filter(p => p.stage !== 'done' && p.stage !== 'parked').length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>项目</h1>
          <div className="sub">{projects.length} 总计 · {active} 推进中 · 按最近更新排序</div>
        </div>
        <div className="right">
          <button className="btn"><I.Filter size={12} /> 筛选</button>
          <button className="btn primary" onClick={() => openModal(<ProjectFormModal />)}>
            <I.Plus size={12} /> 新建项目
          </button>
        </div>
      </div>

      <div className="project-list">
        {sorted.length === 0 && (
          <div style={{ padding: 24, color: 'var(--fg-faint)', fontSize: 13, textAlign: 'center' }}>
            还没有项目。点击右上角「新建项目」开始。
          </div>
        )}
        {sorted.map(p => {
          const isOpen = expanded.has(p.id);
          const isDormant = p.stage === 'done' || p.stage === 'parked';
          // Show all actions (done + undone). Done sinks to the bottom and is
          // rendered with strikethrough so the user can re-check it off if needed.
          const pActionsAll = actions.filter(a => a.project === p.id);
          const pActionsOpen = pActionsAll.filter(a => !a.done);
          const pActionsDone = pActionsAll.filter(a => a.done);
          const pActionsDisplay = [...pActionsOpen, ...pActionsDone];
          const pNotes = notes.filter(n => n.project === p.id);
          return (
            <div key={p.id} className={`pl-item ${isOpen ? 'open' : ''} ${isDormant ? 'dormant' : ''}`}>
              <div className="pl-head" onClick={() => toggle(p.id)}>
                <span className={`pl-caret ${isOpen ? 'open' : ''}`}>
                  <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
                </span>
                <span style={{ ...projectCodeChipStyle(p, kinds), flexShrink: 0 }}>{p.code}</span>
                <span className="pl-name">{p.name}</span>
                {p.priority === 'high' && !isDormant && (
                  <span className="chip rust" title="高优先级">高优</span>
                )}
                <span className="chip dim">{kindLabel(p.kind, kinds)}</span>
                {p.waitingOn === 'me' && !isDormant && <span className="chip amber">等我</span>}
                {p.stuckDays >= 5 && !isDormant && <span className="chip rust">卡 {p.stuckDays}d</span>}
                {isDormant && <span className="chip dim">{STAGE[p.stage].label}</span>}
                <div className="pl-spacer" />
                <span className="pl-meta">{pActionsOpen.length} 待办 / {pActionsAll.length} 任务 · {pNotes.length} 笔记</span>
                <span className="pl-meta mono">更新 {p.lastUpdate.slice(5, 10)}</span>
                {p.deadline && <span className="pl-meta mono">截止 {p.deadline.slice(5)}</span>}
              </div>

              {isOpen && (
                <div className="pl-body">
                  <div className="pl-summary">{p.summary}</div>

                  <div className="pl-grid">
                    <div className="pl-block">
                      <div className="pl-block-h">行动项</div>
                      {pActionsDisplay.length === 0 ? (
                        <div className="pl-empty">无行动项</div>
                      ) : pActionsDisplay.slice(0, 6).map(a => (
                        <div
                          key={a.id}
                          className="pl-mini-row"
                          style={{ alignItems: 'center', display: 'flex', gap: 8 }}
                          onClick={(e) => e.stopPropagation()}>
                          <InlineCheckbox
                            checked={a.done}
                            priorityHigh={a.priority === 'high'}
                            onClick={() => Store.toggleAction(a.id)}
                          />
                          <span
                            className="t"
                            style={a.done
                              ? { flex: 1, minWidth: 0, textDecoration: 'line-through', color: 'var(--fg-faint)' }
                              : { flex: 1, minWidth: 0 }}>
                            {a.title}
                          </span>
                          <span className="d mono" style={a.done ? { color: 'var(--fg-faint)' } : null}>
                            {a.due ? a.due.slice(5) : '—'}
                          </span>
                          <button
                            className="btn ghost sm"
                            title="为此行动项记一条笔记"
                            onClick={() => openModal(<NoteFormModal projectId={p.id} linkedTo={{ kind: 'action', id: a.id }} />)}
                            style={{ padding: '2px 6px', fontSize: 11 }}>
                            <I.Plus size={10} /> 记一条
                          </button>
                          <button
                            className="btn ghost sm"
                            title="编辑"
                            onClick={() => openModal(<ActionFormModal actionId={a.id} />)}
                            style={{ padding: '2px 6px', fontSize: 11 }}>
                            编辑
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="pl-block">
                      <div className="pl-block-h">最近笔记</div>
                      {pNotes.length === 0 && <div className="pl-empty">无</div>}
                      {pNotes.slice(0, 4).map(n => (
                        <div key={n.id} className="pl-mini-row">
                          <span className={`nkind ${n.kind}`} style={{ marginRight: 6 }}>{n.kind}</span>
                          <span className="t">{n.title}</span>
                          <span className="d mono">{n.when.slice(5, 10)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pl-actions">
                    <button className="btn primary sm" onClick={(e) => { e.stopPropagation(); openProject(p.id); }}>
                      查看详情 →
                    </button>
                    <button className="btn sm" onClick={(e) => { e.stopPropagation(); openModal(<NoteFormModal projectId={p.id} />); }}>
                      <I.Plus size={11} /> 记一条
                    </button>
                    <button className="btn sm" onClick={(e) => { e.stopPropagation(); openModal(<ActionFormModal projectId={p.id} />); }}>
                      <I.Flag size={11} /> 加行动项
                    </button>
                    <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); openModal(<ProjectFormModal projectId={p.id} />); }}>
                      编辑
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   PROJECT DETAIL
   ════════════════════════════════════════════════════════════════════════ */
const ProjectDetail = ({ projectId, back }) => {
  const { projectMap, actions, notes, kinds } = useStore();
  const p = projectMap[projectId];
  const [tab, setTab] = React.useState('overview');
  if (!p) {
    return (
      <div className="page">
        <button className="btn ghost sm" onClick={back}><I.ArrowL size={12} /> 项目列表</button>
        <div style={{ padding: 24, color: 'var(--fg-faint)' }}>项目不存在或已删除。</div>
      </div>
    );
  }

  const pActions   = actions.filter(a => a.project === projectId);
  const pNotes     = notes.filter(n => n.project === projectId)
                          .sort((a, b) => (a.when < b.when ? 1 : -1));

  const curOrder = STAGE[p.stage].order;

  return (
    <div className="page proj-detail">
      {/* Header */}
      <div>
        <button className="btn ghost sm" onClick={back} style={{ marginBottom: 14 }}>
          <I.ArrowL size={12} /> 项目列表
        </button>

        <div className="proj-header">
          <div style={{ ...projectCodeChipStyle(p, kinds), padding: '4px 10px', fontSize: 12 }}>{p.code}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{p.name}</h1>
            <div className="meta">
              {p.priority === 'high' && <span className="chip rust">高优</span>}
              <span className="chip dim">{kindLabel(p.kind, kinds)}</span>
              <span className="chip" style={{ color: stageColor(p.stage), borderColor: 'currentColor' }}>
                <span className="dot" /> {STAGE[p.stage].label}
              </span>
              {p.waitingOn === 'me' && <span className="chip amber">等我决策</span>}
              {p.waitingOn === 'external' && <span className="chip steel">等外部</span>}
              {p.waitingOn === 'team' && <span className="chip dim">等团队</span>}
              <span>启动 {p.startedAt}</span>
              <span>·</span>
              <span>最后更新 {p.lastUpdate}</span>
              {p.deadline && (<><span>·</span><span>截止 {p.deadline}</span></>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <ProjectActionsMenu p={p} onAfterDelete={back} />
            <button className="btn primary sm" onClick={() => openModal(<NoteFormModal projectId={p.id} />)}>
              <I.Plus size={12} /> 记一条
            </button>
          </div>
        </div>
      </div>

      {/* Stage timeline — click to switch */}
      <div className="stage-line">
        {['research','decide','execute','verify','done'].map(s => {
          const o = STAGE[s].order;
          const isCur = s === p.stage;
          const isPass = o < curOrder;
          return (
            <div
              key={s}
              className={`seg ${isCur ? 'current' : ''} ${isPass ? 'passed' : ''}`}
              onClick={() => { if (!isCur) Store.updateProject(p.id, { stage: s }); }}
              style={{ cursor: 'pointer' }}
              title={`切换到「${STAGE[s].label}」`}>
              <div className="name">{STAGE[s].label}</div>
              <div className="state">
                {isCur ? '进行中' : isPass ? '✓ 已完成' : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="panel">
        <div className="panel-head">
          <h3>项目概要</h3>
          <button className="btn ghost sm" onClick={() => openModal(<ProjectFormModal projectId={p.id} />)}>编辑</button>
        </div>
        <div className="panel-body padded" style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--fg)' }}>
          {p.summary || <span style={{ color: 'var(--fg-faint)' }}>暂无概要。</span>}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="tabs">
          {[
            { id: 'overview',  label: '总览' },
            { id: 'notes',     label: '笔记', num: pNotes.length },
            { id: 'actions',   label: '行动项', num: pActions.length },
            { id: 'compare',   label: '对比表' },
          ].map(t => (
            <div
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}{t.num != null && <span className="num">{t.num}</span>}
            </div>
          ))}
        </div>

        <div className="panel" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
          {tab === 'overview' && <ProjectOverview p={p} pNotes={pNotes} pActions={pActions} />}
          {tab === 'notes' && (
            <div className="panel-body">
              <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn ghost sm" onClick={() => openModal(<NoteFormModal projectId={p.id} />)}>
                  <I.Plus size={11} /> 新增笔记
                </button>
              </div>
              {pNotes.length === 0 && (
                <div style={{ padding: '20px 16px', color: 'var(--fg-faint)', fontSize: 13 }}>暂无笔记。</div>
              )}
              {pNotes.map(n => (
                <div key={n.id} className="note-item">
                  <div className="nh">
                    <span className={`nkind ${n.kind}`}>{n.kind}</span>
                    <span className="ntitle">{n.title}</span>
                    <LinkedBadge note={n} />
                    <span className="when">{n.when}</span>
                    <RowMenu
                      onEdit={() => openModal(<NoteFormModal noteId={n.id} />)}
                      onDelete={() => openModal(<ConfirmDialog
                        title="删除笔记" message={`确认删除"${n.title}"？`}
                        confirmLabel="删除" danger
                        onConfirm={() => Store.deleteNote(n.id)} onClose={closeModal}
                      />)}
                    />
                  </div>
                  <div className="nbody">{n.body}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'actions' && (
            <div className="panel-body">
              <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn ghost sm" onClick={() => openModal(<ActionFormModal projectId={p.id} />)}>
                  <I.Plus size={11} /> 新增行动项
                </button>
              </div>
              {pActions.length === 0 && (
                <div style={{ padding: '20px 16px', color: 'var(--fg-faint)', fontSize: 13 }}>暂无行动项。</div>
              )}
              {pActions.map(a => {
                const overdue = a.due && a.due < '2026-05-12' && !a.done;
                const linkedNotes = pNotes.filter(n => n.linkedTo && n.linkedTo.kind === 'action' && n.linkedTo.id === a.id);
                return (
                  <div key={a.id} className={`action-row ${a.done ? 'done' : ''}`}>
                    <div className={`cb ${a.done ? 'checked' : ''}`} onClick={() => Store.toggleAction(a.id)}>
                      <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
                    </div>
                    <span className="title">{a.title}</span>
                    {a.waitingOn === 'external' && <span className="chip steel">外部</span>}
                    {a.waitingOn === 'team' && <span className="chip dim">团队</span>}
                    {a.waitingOn === 'me' && <span className="chip amber">ME</span>}
                    {linkedNotes.length > 0 && (
                      <span className="chip accent" title={`${linkedNotes.length} 条关联笔记`}>
                        {linkedNotes.length} 笔记
                      </span>
                    )}
                    <span className={`due ${overdue ? 'overdue' : ''}`}>
                      {a.due ? a.due.slice(5) : '—'}
                    </span>
                    <button
                      className="btn ghost sm"
                      title="为此行动项记一条笔记"
                      onClick={() => openModal(<NoteFormModal projectId={p.id} linkedTo={{ kind: 'action', id: a.id }} />)}
                      style={{ padding: '2px 8px', fontSize: 11 }}>
                      <I.Plus size={10} /> 记一条
                    </button>
                    <RowMenu
                      onEdit={() => openModal(<ActionFormModal actionId={a.id} />)}
                      onDelete={() => openModal(<ConfirmDialog
                        title="删除行动项" message={`确认删除"${a.title}"？`}
                        confirmLabel="删除" danger
                        onConfirm={() => Store.deleteAction(a.id)} onClose={closeModal}
                      />)}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {tab === 'compare' && <CompareTab />}
        </div>
      </div>
    </div>
  );
};

const ProjectActionsMenu = ({ p, onAfterDelete }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', onDoc);
    return () => window.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <span ref={ref} style={{ position: 'relative' }}>
      <button className="btn sm" onClick={() => setOpen(o => !o)}><I.More size={12} /></button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: 'var(--bg-elev)', border: '1px solid var(--line)',
          borderRadius: 6, padding: 4, minWidth: 140,
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          zIndex: 50, fontSize: 12,
        }}>
          <MenuItem onClick={() => { setOpen(false); openModal(<ProjectFormModal projectId={p.id} />); }}>编辑项目</MenuItem>
          <MenuItem onClick={() => { setOpen(false); openModal(<NoteFormModal projectId={p.id} />); }}>新建笔记</MenuItem>
          <MenuItem onClick={() => { setOpen(false); openModal(<ActionFormModal projectId={p.id} />); }}>新建行动项</MenuItem>
          <MenuItem
            danger
            onClick={() => {
              setOpen(false);
              openModal(<ConfirmDialog
                title="删除项目"
                message={`项目"${p.name}"及其所有笔记 / 行动项都会被删除，无法恢复。`}
                confirmLabel="删除" danger
                onConfirm={() => { Store.deleteProject(p.id); onAfterDelete && onAfterDelete(); }}
                onClose={closeModal}
              />);
            }}>
            删除项目
          </MenuItem>
        </div>
      )}
    </span>
  );
};

const MenuItem = ({ onClick, danger, children }) => (
  <div onClick={onClick}
       onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
       onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
       style={{
         padding: '6px 10px', cursor: 'pointer', borderRadius: 4,
         color: danger ? 'var(--rust)' : 'var(--fg)',
       }}>
    {children}
  </div>
);

const ProjectOverview = ({ p, pNotes, pActions }) => {
  const nextActions = pActions.filter(a => !a.done).slice(0, 5);
  const latestNote  = pNotes[0];

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {/* Next actions */}
      <div>
        <div className="lab" style={{ marginBottom: 10 }}>下一步动作</div>
        {nextActions.length === 0 && <div style={{ color: 'var(--fg-faint)', fontSize: 12.5 }}>暂无</div>}
        {nextActions.map(a => (
          <div key={a.id} style={{
            padding: '8px 0',
            borderBottom: '1px solid var(--line-faint)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: a.priority === 'high' ? 'var(--amber)' : 'var(--fg-faint)',
            }} />
            <span style={{ flex: 1, fontSize: 13 }}>{a.title}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{a.due ? a.due.slice(5) : '—'}</span>
          </div>
        ))}
      </div>

      {/* Latest note */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="lab" style={{ marginBottom: 10 }}>最近一条笔记</div>
        {latestNote ? (
          <div style={{
            padding: 14,
            border: '1px solid var(--line)',
            borderRadius: 6,
            background: 'var(--bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className={`nkind ${latestNote.kind}`} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px',
                borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: noteKindColor(latestNote.kind),
                border: `1px solid ${noteKindColor(latestNote.kind, true)}`,
                background: noteKindColor(latestNote.kind, false, true),
              }}>{latestNote.kind}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-strong)' }}>{latestNote.title}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{latestNote.when}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{latestNote.body}</div>
          </div>
        ) : (
          <div style={{ color: 'var(--fg-faint)' }}>暂无笔记</div>
        )}
      </div>
    </div>
  );
};

function noteKindColor(kind, line, bg) {
  const map = {
    meeting:  ['var(--steel)',  'rgba(111,140,176,0.30)', 'rgba(111,140,176,0.10)'],
    insight:  ['var(--moss)',   'rgba(110,163,106,0.30)', 'rgba(110,163,106,0.10)'],
    research: ['var(--violet)', 'rgba(158,138,196,0.30)', 'rgba(158,138,196,0.10)'],
    decision: ['var(--amber)',  'rgba(210,138,58,0.30)',  'rgba(210,138,58,0.10)'],
  };
  const v = map[kind] || ['var(--fg-muted)', 'var(--line)', 'transparent'];
  if (line) return v[1];
  if (bg)   return v[2];
  return v[0];
}


const CompareTab = () => (
  <div className="panel-body padded" style={{ padding: '32px 16px' }}>
    <div style={{
      border: '1px dashed var(--line-strong)',
      borderRadius: 8,
      padding: '40px 20px',
      textAlign: 'center',
      color: 'var(--fg-muted)',
    }}>
      <I.Upload size={28} style={{ color: 'var(--fg-faint)', margin: '0 auto 12px' }} />
      <div style={{ fontSize: 13.5, marginBottom: 6, color: 'var(--fg)' }}>把对比表截图拖到这里</div>
      <div style={{ fontSize: 12, color: 'var(--fg-faint)' }}>
        Excel 里做好的对比表 / 报价单 / 参数表，截图上传即可<br />
        支持 PNG / JPG / PDF · 单文件 ≤ 20MB
      </div>
      <button className="btn sm" style={{ marginTop: 14 }}>
        <I.Upload size={11} /> 上传文件
      </button>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
   NOTES (aggregated across projects)
   ════════════════════════════════════════════════════════════════════════ */
const NotesView = ({ openProject }) => {
  const { notes, projectMap, projects, kinds } = useStore();
  const byProject = {};
  notes.forEach(n => {
    if (!byProject[n.project]) byProject[n.project] = [];
    byProject[n.project].push(n);
  });
  Object.values(byProject).forEach(arr => arr.sort((a, b) => (a.when < b.when ? 1 : -1)));

  const projIds = Object.keys(byProject).sort((a, b) => {
    const la = byProject[a][0].when;
    const lb = byProject[b][0].when;
    return la < lb ? 1 : -1;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>笔记</h1>
          <div className="sub">{notes.length} 条 · 跨 {projIds.length} 个项目 · 写在项目里，自动汇总到此</div>
        </div>
        <div className="right">
          <button className="btn"><I.Filter size={12} /> 类型</button>
          <button className="btn"><I.Search size={12} /> 搜索</button>
          <button className="btn primary" onClick={() => {
            if (projects.length === 0) return;
            openModal(<NoteFormModal />);
          }}>
            <I.Plus size={12} /> 新建笔记
          </button>
        </div>
      </div>

      <div className="notes-grid">
        {projIds.length === 0 && (
          <div style={{ padding: 24, color: 'var(--fg-faint)', fontSize: 13, textAlign: 'center' }}>
            还没有笔记。
          </div>
        )}
        {projIds.map(pid => {
          const p = projectMap[pid];
          if (!p) return null;
          return (
            <div key={pid} className="notes-project-section">
              <div className="nps-head" onClick={() => openProject(pid)} style={{ cursor: 'pointer' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: stageColor(p.stage),
                }} />
                <span style={{ ...projectCodeChipStyle(p, kinds), flexShrink: 0 }}>{p.code}</span>
                <span className="pname">{p.name}</span>
                <span className="chip dim" style={{ marginLeft: 8 }}>{STAGE[p.stage].label}</span>
                <span className="pcount">{byProject[pid].length} 条笔记</span>
              </div>
              <div>
                {byProject[pid].map(n => (
                  <div key={n.id} className="note-item">
                    <div className="nh">
                      <span className={`nkind ${n.kind}`}>{n.kind}</span>
                      <span className="ntitle">{n.title}</span>
                      <LinkedBadge note={n} />
                      <span className="when">{n.when}</span>
                      <RowMenu
                        onEdit={() => openModal(<NoteFormModal noteId={n.id} />)}
                        onDelete={() => openModal(<ConfirmDialog
                          title="删除笔记" message={`确认删除"${n.title}"？`}
                          confirmLabel="删除" danger
                          onConfirm={() => Store.deleteNote(n.id)} onClose={closeModal}
                        />)}
                      />
                    </div>
                    <div className="nbody">{n.body}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   REVIEW
   ════════════════════════════════════════════════════════════════════════ */
const ReviewView = () => {
  const { projects, notes, actions, kinds } = useStore();
  const notesThisMonth = notes.filter(n => n.when >= '2026-05-01').length;
  const actionsClosed = actions.filter(a => a.done).length;
  const stuckCount = projects.filter(p => p.stuckDays >= 3 && p.stage !== 'done' && p.stage !== 'parked').length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>回顾</h1>
          <div className="sub">2026 / 05 · 第 18–20 周</div>
        </div>
        <div className="right">
          <button className="btn sm">本周</button>
          <button className="btn sm" style={{ background: 'var(--bg-elev-2)' }}>本月</button>
          <button className="btn sm">本季</button>
        </div>
      </div>

      <div className="review-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="lbl">推进中项目</div>
          <div className="v">{projects.filter(p => p.stage !== 'done' && p.stage !== 'parked').length}</div>
          <div className="delta">较上月 持平</div>
        </div>
        <div className="stat-card">
          <div className="lbl">本月新笔记</div>
          <div className="v">{notesThisMonth}</div>
          <div className="delta up">本月新增</div>
        </div>
        <div className="stat-card">
          <div className="lbl">完成行动项</div>
          <div className="v">{actionsClosed}<span style={{ fontSize: 18, color: 'var(--fg-faint)' }}> / {actions.length}</span></div>
          <div className="delta">完成率 {actions.length ? Math.round(actionsClosed / actions.length * 100) : 0}%</div>
        </div>
        <div className="stat-card">
          <div className="lbl">卡住项目</div>
          <div className="v" style={{ color: stuckCount > 2 ? 'var(--rust)' : 'var(--fg-strong)' }}>{stuckCount}</div>
          <div className="delta down">需重点关注</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>本月推进总览</h2>
          <button className="btn sm"><I.Sparkle size={11} /> 让 Claude 总结</button>
        </div>
        <div className="panel-body">
          {projects.filter(p => p.stage !== 'parked').map(p => (
            <div key={p.id} style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--line-faint)',
              display: 'grid',
              gridTemplateColumns: '90px 1fr 280px 120px',
              gap: 14,
              alignItems: 'center',
            }}>
              <span style={{ ...projectCodeChipStyle(p, kinds), flexShrink: 0 }}>{p.code}</span>
              <div>
                <div style={{ fontSize: 13.5, color: 'var(--fg-strong)' }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {kindLabel(p.kind, kinds)} · 最后更新 {p.lastUpdate.slice(5, 10)}
                </div>
              </div>
              <div>
                <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.progress || 0) * 100}%`, background: stageColor(p.stage) }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 4 }}>
                  进度 {Math.round((p.progress || 0) * 100)}%
                </div>
              </div>
              <span className="chip" style={{ color: stageColor(p.stage), borderColor: 'currentColor' }}>
                <span className="dot" /> {STAGE[p.stage].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   TOOLS — JSON export/import lives here
   ════════════════════════════════════════════════════════════════════════ */
const ToolsView = () => {
  const fileRef = React.useRef(null);

  const doExport = () => {
    const data = Store.exportAll();
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandcenter-backup-${Store.todayIso()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        openModal(<ConfirmDialog
          title="导入备份"
          message="导入会覆盖当前所有数据（项目 / 笔记 / 行动项 / 杂事）。确认继续？"
          confirmLabel="导入并覆盖" danger
          onConfirm={() => {
            try { Store.importAll(data); }
            catch (e) { window.alert('导入失败：' + (e.message || e)); }
          }}
          onClose={closeModal}
        />);
      } catch (e) {
        window.alert('JSON 解析失败：' + e.message);
      }
    };
    reader.readAsText(file);
  };

  const doReset = () => {
    openModal(<ConfirmDialog
      title="恢复示例数据"
      message="当前所有数据会被丢弃，恢复到内置的示例数据。"
      confirmLabel="恢复" danger
      onConfirm={() => Store.resetToDefaults()}
      onClose={closeModal}
    />);
  };

  const doClear = () => {
    openModal(<ConfirmDialog
      title="清空全部数据"
      message="所有项目、笔记、行动项、杂事都会被清空，无法恢复。"
      confirmLabel="清空" danger
      onConfirm={() => Store.clearAll()}
      onClose={closeModal}
    />);
  };

  const tools = [
    {
      icon: 'External', title: '云端同步 · Gist',
      desc: '用一个私有 GitHub Gist 当云盘。手机和电脑配同一个 Token + Gist ID 就能互相同步。',
      tag: '配置同步', onClick: () => openModal(<SyncSettingsModal />),
    },
    {
      icon: 'Sparkle', title: '鼓励语句',
      desc: '每天在指挥台首页随机显示一条。点开可以加 / 减 / 改语句，每行一条。',
      tag: '编辑列表', onClick: () => openModal(<QuotesEditorModal />),
    },
    {
      icon: 'Folder', title: '项目类别',
      desc: '管理新建项目时可选的类别。可加、可改、可删；已使用的类别删除时会提示。',
      tag: '编辑类别', onClick: () => openModal(<KindsEditorModal />),
    },
    { icon: 'Sparkle', title: '从 Claude 对话批量导入', desc: '把对话里的"建议项 / 任务清单"粘贴进来，结构化后一键导入到对应项目。', tag: '已配置' },
    { icon: 'Upload',  title: 'AI 总结导出', desc: '把指定项目 / 时间段的笔记 + 行动项打包成结构化报告，复制给 Claude 做进度分析或下一步建议。', tag: '常用' },
    { icon: 'Repeat',  title: '重复任务', desc: '每日 / 每周自动生成的固定动作（如周一对账、月初盘点、季度复盘）。', tag: '5 条已启用' },
    {
      icon: 'Upload', title: '导出 JSON 备份',
      desc: '把当前全部数据导出为 JSON 文件，可备份或在另一台机器导入。',
      tag: '点击导出', onClick: doExport,
    },
    {
      icon: 'Upload', title: '从 JSON 导入',
      desc: '选择之前导出的 JSON 文件，恢复全部数据（会覆盖当前内容）。',
      tag: '选择文件', onClick: () => fileRef.current && fileRef.current.click(),
    },
    {
      icon: 'Repeat', title: '恢复示例数据',
      desc: '丢弃当前所有数据，回到内置示例数据状态（用于演示）。',
      tag: '重置', onClick: doReset,
    },
    {
      icon: 'Cog', title: '清空全部数据',
      desc: '把所有项目、笔记、行动项、杂事清空。',
      tag: '危险操作', danger: true, onClick: doClear,
    },
    { icon: 'Building',title: '相关人 / 供应商名册', desc: '统一管理项目里出现过的联系人、供应商、客户。', tag: '32 人' },
    { icon: 'Cog',     title: '偏好设置', desc: '深浅色、字号、阶段命名、提醒规则。', tag: '' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>工具</h1>
          <div className="sub">辅助功能 · 不参与日常推进</div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) doImport(f);
          e.target.value = '';
        }}
      />
      <div className="tools-grid">
        {tools.map((t, i) => {
          const Ic = I[t.icon];
          const clickable = !!t.onClick;
          return (
            <div
              key={i}
              className="tool-card"
              onClick={t.onClick}
              style={clickable ? { cursor: 'pointer' } : null}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Ic size={18} style={{ color: t.danger ? 'var(--rust)' : 'var(--amber)' }} />
                <h3 style={{ flex: 1 }}>{t.title}</h3>
                <I.External size={13} style={{ color: 'var(--fg-faint)' }} />
              </div>
              <div className="desc">{t.desc}</div>
              {t.tag && <div className="tag" style={t.danger ? { color: 'var(--rust)' } : null}>{t.tag}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, {
  ProjectsView, ProjectDetail, NotesView, ReviewView, ToolsView,
  ProjectFormModal, NoteFormModal, ActionFormModal, LooseTaskFormModal,
  QuotesEditorModal, KindsEditorModal, SyncSettingsModal,
  InlineCheckbox, LinkedBadge,
});
