// Data layer — localStorage-backed reactive store + minimal form/modal helpers.
// All slices live under commandcenter_* keys. Seed defaults are written on
// first load so the prototype boots populated.

const STAGE = {
  research:  { id: 'research',  label: '调研',  order: 1 },
  decide:    { id: 'decide',    label: '决策',  order: 2 },
  execute:   { id: 'execute',   label: '推进',  order: 3 },
  verify:    { id: 'verify',    label: '验收',  order: 4 },
  done:      { id: 'done',      label: '完成',  order: 5 },
  parked:    { id: 'parked',    label: '搁置',  order: 6 },
};
const STAGE_LIST = ['research','decide','execute','verify','done','parked'];

// Sticky-note palette. Each entry has a pastel `bg` (the chip body) and a
// slightly darker `border`. `sky` is reserved for loose tasks (杂事) so don't
// use it as a default project-kind color.
const KIND_COLORS = [
  { id: 'cream',    label: '米黄',   bg: '#fef3c7', border: '#f4d976' },
  { id: 'apricot',  label: '杏色',   bg: '#fed7aa', border: '#fbb074' },
  { id: 'mint',     label: '薄荷',   bg: '#bbf7d0', border: '#86e3a8' },
  { id: 'sky',      label: '天蓝',   bg: '#bfdbfe', border: '#84b6f7' },
  { id: 'sage',     label: '鼠尾草', bg: '#d1d5db', border: '#a1abb6' },
  { id: 'pink',     label: '樱粉',   bg: '#fbcfe8', border: '#f190c6' },
  { id: 'lavender', label: '薰衣草', bg: '#e0d7f8', border: '#b9a4ea' },
  { id: 'coral',    label: '浅珊瑚', bg: '#fecaca', border: '#f88e8e' },
];
const LOOSE_COLOR_ID = 'sky'; // 杂事 (loose tasks) always use 天蓝, not configurable.

// KIND is now seeded into localStorage and editable. The const stays as a
// fallback so old code referring to `KIND[p.kind]` still resolves common ids
// even if a user wiped their list. Live data flows through useStore().kinds.
const KIND = {
  capital:    { id: 'capital',    label: '资产/投资', color: 'apricot' },
  process:    { id: 'process',    label: '流程优化',  color: 'mint' },
  diagnose:   { id: 'diagnose',   label: '经营诊断',  color: 'coral' },
  business:   { id: 'business',   label: '商务/客户', color: 'pink' },
  compliance: { id: 'compliance', label: '合规',     color: 'sage' },
  org:        { id: 'org',        label: '组织/人员', color: 'lavender' },
};
const DEFAULT_KINDS = Object.values(KIND);

const DEFAULT_PROJECTS = [
  {
    id: 'p1', code: 'PRJ-024', name: 'CNC 加工中心换代',
    kind: 'capital', stage: 'decide',
    priority: 'high', waitingOn: 'me',
    startedAt: '2026-03-12', lastUpdate: '2026-05-11 16:40',
    deadline: '2026-06-30',
    summary: '替换两台 2014 年的旧 CNC，预算 180–240 万。候选三家：海德威、恒昌、上海精机。决策点：性价比 vs 服务半径 vs 交期。',
    tags: ['车间', '设备', '180–240万'],
    progress: 0.45,
    risk: null,
    stuckDays: 6,
  },
  {
    id: 'p2', code: 'PRJ-023', name: '三号产线良率下滑诊断',
    kind: 'diagnose', stage: 'execute',
    priority: 'high', waitingOn: 'external',
    startedAt: '2026-04-22', lastUpdate: '2026-05-12 09:15',
    deadline: '2026-05-25',
    summary: '4 月下旬良率从 96.8% 跌到 92.4%。已排除模具因素，怀疑原料批次或注塑温度曲线。等供应商化验报告。',
    tags: ['品质', '3号线', '良率'],
    progress: 0.62,
    risk: 'medium',
    stuckDays: 0,
  },
  {
    id: 'p3', code: 'PRJ-022', name: '报价高于同行 15% 原因排查',
    kind: 'diagnose', stage: 'research',
    priority: 'high', waitingOn: 'me',
    startedAt: '2026-04-08', lastUpdate: '2026-05-09 11:20',
    deadline: null,
    summary: '丢了两个老客户，对方反馈我们报价高 12–18%。需要拆成本结构对比：原料、人工、能耗、损耗、管理费。',
    tags: ['经营', '成本', '客户流失'],
    progress: 0.30,
    risk: 'high',
    stuckDays: 3,
  },
  {
    id: 'p4', code: 'PRJ-021', name: '注塑车间能耗优化',
    kind: 'process', stage: 'execute',
    priority: 'medium', waitingOn: 'team',
    startedAt: '2026-02-18', lastUpdate: '2026-05-10 17:30',
    deadline: '2026-07-31',
    summary: '老李牵头改造冷却系统 + 错峰用电方案。一期已完成，电费同比降 8%。二期 6 月启动。',
    tags: ['能耗', '降本', '老李'],
    progress: 0.55,
    risk: null,
    stuckDays: 0,
  },
  {
    id: 'p5', code: 'PRJ-020', name: '华东汽配厂新客户开发',
    kind: 'business', stage: 'decide',
    priority: 'high', waitingOn: 'external',
    startedAt: '2026-03-25', lastUpdate: '2026-05-08 14:00',
    deadline: '2026-05-20',
    summary: '对方采购总监周三来厂参观。需要准备样品 + 报价方案 + 产能承诺函。年化预估 800–1200 万。',
    tags: ['客户', '汽配', '高潜'],
    progress: 0.70,
    risk: null,
    stuckDays: 0,
  },
  {
    id: 'p6', code: 'PRJ-019', name: '仓储 WMS 系统选型',
    kind: 'capital', stage: 'research',
    priority: 'medium', waitingOn: 'me',
    startedAt: '2026-04-30', lastUpdate: '2026-05-07 10:00',
    deadline: null,
    summary: '现行 Excel + 纸单管理，月底盘点对账要 3 天。已联系 3 家厂商，等周五前给完整方案对比。',
    tags: ['信息化', '仓储'],
    progress: 0.15,
    risk: null,
    stuckDays: 5,
  },
  {
    id: 'p7', code: 'PRJ-018', name: 'ISO9001 复审准备',
    kind: 'compliance', stage: 'verify',
    priority: 'medium', waitingOn: 'team',
    startedAt: '2026-03-01', lastUpdate: '2026-05-11 09:00',
    deadline: '2026-06-15',
    summary: '内审已完成 2 次，整改项闭环 18/22。剩余 4 项主要是记录追溯问题，周工负责。',
    tags: ['合规', 'ISO', '周工'],
    progress: 0.82,
    risk: null,
    stuckDays: 0,
  },
  {
    id: 'p8', code: 'PRJ-017', name: '二期厂房装修推进',
    kind: 'capital', stage: 'parked',
    priority: 'low', waitingOn: 'me',
    startedAt: '2026-01-15', lastUpdate: '2026-04-02 15:00',
    deadline: null,
    summary: '原计划 Q2 启动，因订单不及预期暂缓。重启信号：H1 营收恢复至去年同期 90% 以上。',
    tags: ['基建', '二期'],
    progress: 0.20,
    risk: null,
    stuckDays: 40,
  },
];

const DEFAULT_DECISIONS = [
  {
    id: 'd1', project: 'p1', when: '2026-05-11',
    status: 'pending',
    title: 'CNC 选型最终定档',
    options: [
      { name: '海德威 HD-850i', price: '218 万', delivery: '90 天', service: '上海，2h 到场', score: 'A-' },
      { name: '恒昌 CHM-X9',   price: '189 万', delivery: '120 天', service: '苏州，半天到场', score: 'B+' },
      { name: '上海精机 SP-7M', price: '232 万', delivery: '60 天', service: '本地，1h 到场', score: 'A' },
    ],
    leaning: '上海精机 SP-7M',
    reasoning: '交期最短，服务最近。多花 14 万换 30 天产能差不多打平。但需要再确认核心丝杠是否原装。',
  },
  {
    id: 'd2', project: 'p1', when: '2026-04-18',
    status: 'done',
    title: '替换数量：先 1 台还是直接 2 台',
    choice: '先 1 台试运行 3 个月，再决定第二台',
    reasoning: '现金流压力 + 操作工培训周期。试运行能验证我们对参数的判断，避免一次踩坑两次。',
  },
  {
    id: 'd3', project: 'p3', when: '2026-05-09',
    status: 'pending',
    title: '成本对标：要不要花钱买行业报告',
    options: [
      { name: '中商产业报告', price: '2.8 万', delivery: '1 周', score: '中' },
      { name: '咨询前同事拿内部数据', price: '0', delivery: '不确定', score: '高（但欠人情）' },
      { name: '自己拆 + 找 2 家同行交换', price: '人力', delivery: '2 周', score: '中-' },
    ],
    leaning: '咨询前同事 + 自己拆',
    reasoning: '报告太宽泛，对我们这个细分品类没什么用。',
  },
  {
    id: 'd4', project: 'p5', when: '2026-05-08',
    status: 'pending',
    title: '华东汽配年度报价策略',
    options: [
      { name: '按现行价 -5% 切入', price: '让利 40 万/年', delivery: '稳', score: 'B' },
      { name: '现行价 + 阶梯返利', price: '约 25 万/年', delivery: '需谈', score: 'A-' },
      { name: '现行价持平，强调交期 + 品质', price: '0', delivery: '风险高', score: 'B-' },
    ],
    leaning: '阶梯返利',
    reasoning: '不主动让出底价，把锚定权留给我们。返利和量绑定，对方有动力。',
  },
  {
    id: 'd5', project: 'p4', when: '2026-03-20',
    status: 'done',
    title: '能耗改造一期范围',
    choice: '冷却系统 + 错峰用电，不动主机变频',
    reasoning: '主机变频投入大，回本周期 4 年以上。先做轻量改造看效果。事后看是对的，8% 已经超预期。',
  },
];

const DEFAULT_ACTIONS = [
  { id: 'a1',  project: 'p1', title: '约上海精机张工现场看丝杠规格', due: '2026-05-13', done: false, waitingOn: 'me', priority: 'high' },
  { id: 'a2',  project: 'p1', title: '让陈会计做 3 个方案 5 年 NPV', due: '2026-05-14', done: false, waitingOn: 'team', priority: 'high' },
  { id: 'a3',  project: 'p2', title: '催供应商化验报告（已超 2 天）', due: '2026-05-12', done: false, waitingOn: 'external', priority: 'high' },
  { id: 'a4',  project: 'p2', title: '老李整理 4 月温度曲线数据', due: '2026-05-13', done: false, waitingOn: 'team', priority: 'medium' },
  { id: 'a5',  project: 'p3', title: '拉过去 6 个月成本明细', due: '2026-05-14', done: false, waitingOn: 'me', priority: 'high' },
  { id: 'a6',  project: 'p3', title: '约老同事吃饭，问内部数据', due: '2026-05-16', done: false, waitingOn: 'me', priority: 'medium' },
  { id: 'a7',  project: 'p5', title: '准备样品 + 产能承诺函', due: '2026-05-14', done: false, waitingOn: 'team', priority: 'high' },
  { id: 'a8',  project: 'p5', title: '接待路线 + 餐饮安排', due: '2026-05-13', done: true,  waitingOn: 'team', priority: 'medium' },
  { id: 'a9',  project: 'p6', title: '催 3 家 WMS 厂商完整方案', due: '2026-05-15', done: false, waitingOn: 'external', priority: 'medium' },
  { id: 'a10', project: 'p7', title: '周工闭环最后 4 项记录追溯', due: '2026-05-20', done: false, waitingOn: 'team', priority: 'medium' },
  { id: 'a11', project: 'p4', title: '二期方案评审会', due: '2026-05-22', done: false, waitingOn: 'team', priority: 'medium' },
  { id: 'a12', project: 'p1', title: '让财务确认 Q3 现金流空间', due: '2026-05-15', done: false, waitingOn: 'team', priority: 'medium' },
];

const DEFAULT_NOTES = [
  { id: 'n1', project: 'p1', when: '2026-05-11 16:40', kind: 'meeting', title: '上海精机现场参观纪要',
    body: '看了 SP-7M 的演示。主轴 12000 转，三轴定位精度 0.005。陈工说丝杠是台湾 HIWIN 原装，但需要他书面确认。\n服务承诺：上海本地，2h 内响应；他们在我们隔壁工业园有客户，可以去打听口碑。\n报价 232 万含税含运含调试，培训 3 天。可以再砍 5–8 万。' },
  { id: 'n2', project: 'p1', when: '2026-05-09 10:20', kind: 'research', title: '海德威 vs 恒昌初步对比',
    body: '海德威：进口品牌国产化，参数漂亮但服务半径在上海，远；售后据说一般。\n恒昌：本土品牌，性价比高，但同行老周用过两年说精度衰减偏快。\n初步淘汰恒昌，主比海德威和上海精机。' },
  { id: 'n3', project: 'p1', when: '2026-04-18 14:30', kind: 'decision', title: '决策：先 1 台试运行',
    body: '和陈会计算了下，2 台一起上现金流要紧到 7 月。1 台试 3 个月，跑通后再追加，安全得多。\n如果试运行良率没明显提升，可能就不追加了。' },
  { id: 'n4', project: 'p2', when: '2026-05-12 09:15', kind: 'insight', title: '又催了一次化验报告',
    body: '供应商说今天下午一定给。如果还不给，下午我亲自打总经理电话。\n备选方案：让本地第三方机构平行做一次，2 天出。多花 3000 块但拿回主动权。' },
  { id: 'n5', project: 'p2', when: '2026-05-06 17:00', kind: 'meeting', title: '车间复盘良率问题',
    body: '排除：模具刚保养过，操作工没换人。\n剩余可能：① 原料批次差异（4/20 起换了批号）② 温度曲线漂移 ③ 环境温湿度。\n老李负责拉温度数据，周工负责盯下一批生产做对照实验。' },
  { id: 'n6', project: 'p3', when: '2026-05-09 11:20', kind: 'insight', title: '客户反馈整理',
    body: '客户 A：我们价高 12%，对方还能给 30 天账期，我们只能 15 天。\n客户 B：我们价高 18%，但坦白说他们对方质量"凑合"。\n判断：A 是真的卷不过，B 是质量+价格组合输。先解 A 这条线。' },
  { id: 'n7', project: 'p5', when: '2026-05-08 14:00', kind: 'meeting', title: '内部对接会',
    body: '小王做样品，周三前出 3 件。\n林工出产能承诺函，需要写到月产能 + 加急能力。\n我亲自接待，餐饮订在老地方，下午看车间。' },
  { id: 'n8', project: 'p4', when: '2026-05-10 17:30', kind: 'insight', title: '一期电费对账',
    body: '4 月电费同比降 7.8%，达到预期下限。老李说错峰那部分还可以再优化，他在排下一轮。\n二期主机变频暂不做，等一期完整跑满半年再评估。' },
  { id: 'n9', project: 'p4', when: '2026-03-20 11:00', kind: 'decision', title: '一期范围拍板',
    body: '不动主机变频。冷却系统改造 + 错峰用电先做。预算 28 万，老李 4 月底前完成。' },
  { id: 'n10', project: 'p7', when: '2026-05-11 09:00', kind: 'meeting', title: '内审第二轮总结',
    body: '剩 4 项整改：3.1 文件版本控制、4.2 不合格品追溯、6.1 培训记录、7.3 校准记录。\n周工说本周内全部闭环。外审定在 6/10。' },
  { id: 'n11', project: 'p6', when: '2026-05-07 10:00', kind: 'research', title: 'WMS 厂商初筛',
    body: '联系了 3 家：富勒（大厂、贵）、科箭（中等、行业方案多）、网仓（轻量、本地服务）。\n我们规模不大，倾向科箭或网仓。等他们周五完整方案 + 案例。' },
];

const DEFAULT_LOOSE_TASKS = [
  { id: 't1', title: '提醒小王交上个月的报销',         due: '2026-05-12', done: false, tag: '人事' },
  { id: 't2', title: '周五前回老张电话',                due: '2026-05-15', done: false, tag: '人情' },
  { id: 't3', title: '订下周三去深圳的高铁',           due: '2026-05-12', done: false, tag: '行程' },
  { id: 't4', title: '问会计 4 月增值税申报情况',      due: '2026-05-13', done: false, tag: '财务' },
  { id: 't5', title: '把车送去 4S 店做保养',           due: '2026-05-18', done: false, tag: '生活' },
  { id: 't6', title: '银行结息单签字',                   due: '2026-05-11', done: true,  tag: '财务' },
  { id: 't7', title: '续签厂区保安公司合同',           due: '2026-05-20', done: false, tag: '行政' },
  { id: 't8', title: '想想下个月去哪里见见客户 B',     due: null,         done: false, tag: '想法' },
];

const DEFAULT_QUOTES = [
  '今天也是值得期待的一天。',
  '稳住，我们能赢。',
  '做难而正确的事。',
  '专注当下，结果自然来。',
  '慢慢来，比较快。',
  '已经在路上了，就别回头算账。',
  '问题越大，越要从最小的一步开始。',
  '今天不必完美，只要不停下。',
  '能搞定的，毕竟是你。',
  '一次只做一件事，做完它。',
  '保持松弛，但不松懈。',
  '决策疲劳时，先去喝杯水。',
];

const DEFAULT_RECENT = [
  { when: '14:32', project: 'p2', text: '催供应商化验报告（行动项更新）', kind: 'action' },
  { when: '09:15', project: 'p2', text: '新增笔记：又催了一次化验报告', kind: 'note' },
  { when: '昨 16:40', project: 'p1', text: '新增笔记：上海精机现场参观纪要', kind: 'note' },
  { when: '昨 09:00', project: 'p7', text: '行动项完成：内审第二轮', kind: 'action' },
  { when: '前天 17:30', project: 'p4', text: '一期电费对账：同比降 7.8%', kind: 'note' },
  { when: '前天 11:20', project: 'p3', text: '阶段：调研 → 仍在调研', kind: 'stage' },
  { when: '05-09', project: 'p1', text: '新增决策：成本对标方式', kind: 'decision' },
  { when: '05-08', project: 'p5', text: '新增决策：年度报价策略', kind: 'decision' },
];

const COMMANDS = [
  { group: '快速操作', items: [
    { id: 'c1', label: '新建项目', ext: '⌘ N' },
    { id: 'c2', label: '在当前项目记一条笔记', ext: '⌘ J' },
    { id: 'c3', label: '新建决策记录', ext: '⌘ D' },
    { id: 'c4', label: '上传对比表', ext: '⌘ U' },
  ]},
  { group: '跳转', items: [
    { id: 'c5', label: '指挥台', ext: 'G H' },
    { id: 'c6', label: '项目', ext: 'G P' },
    { id: 'c7', label: '笔记', ext: 'G N' },
    { id: 'c8', label: '回顾', ext: 'G R' },
    { id: 'c9', label: '工具', ext: 'G T' },
  ]},
];

/* ─────────────────────────── Store ─────────────────────────── */

const SK = {
  projects:   'commandcenter_projects',
  decisions:  'commandcenter_decisions',
  notes:      'commandcenter_notes',
  actions:    'commandcenter_actions',
  looseTasks: 'commandcenter_loose_tasks',
  recent:     'commandcenter_recent',
  quotes:     'commandcenter_quotes',
  kinds:      'commandcenter_kinds',
};

const Store = (function () {
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return fallback;
      return parsed;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  const state = {
    projects:   load(SK.projects,   DEFAULT_PROJECTS),
    decisions:  load(SK.decisions,  DEFAULT_DECISIONS),
    notes:      load(SK.notes,      DEFAULT_NOTES),
    actions:    load(SK.actions,    DEFAULT_ACTIONS),
    looseTasks: load(SK.looseTasks, DEFAULT_LOOSE_TASKS),
    recent:     load(SK.recent,     DEFAULT_RECENT),
    quotes:     load(SK.quotes,     DEFAULT_QUOTES),
    kinds:      load(SK.kinds,      DEFAULT_KINDS),
  };
  // Persist seeds on first run so subsequent reads round-trip.
  Object.keys(SK).forEach(k => save(SK[k], state[k]));

  const subs = new Set();
  const notify = () => subs.forEach(fn => fn());

  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function nowStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function genId(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function persist(key) { save(SK[key], state[key]); }

  function touchProject(pid) {
    if (!pid) return;
    state.projects = state.projects.map(p => p.id === pid ? { ...p, lastUpdate: nowStamp() } : p);
    persist('projects');
  }

  return {
    getState: () => state,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    nowStamp, todayIso, genId,

    // ─────── Projects ───────
    addProject(input) {
      const max = state.projects.reduce((m, p) => {
        const n = parseInt(String(p.code || '').replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      const p = {
        id: genId('p'),
        code: input.code || `PRJ-${String(max + 1).padStart(3, '0')}`,
        name: input.name || '未命名项目',
        kind: input.kind || 'process',
        stage: input.stage || 'research',
        priority: input.priority || 'medium',
        waitingOn: input.waitingOn || 'me',
        startedAt: input.startedAt || todayIso(),
        lastUpdate: nowStamp(),
        deadline: input.deadline || null,
        summary: input.summary || '',
        tags: Array.isArray(input.tags) ? input.tags : [],
        progress: typeof input.progress === 'number' ? input.progress : 0,
        risk: input.risk || null,
        stuckDays: 0,
      };
      state.projects = [p, ...state.projects];
      persist('projects');
      notify();
      return p.id;
    },
    updateProject(id, patch) {
      state.projects = state.projects.map(p => p.id === id ? { ...p, ...patch, lastUpdate: nowStamp() } : p);
      persist('projects');
      notify();
    },
    deleteProject(id) {
      state.projects   = state.projects.filter(p => p.id !== id);
      state.decisions  = state.decisions.filter(d => d.project !== id);
      state.notes      = state.notes.filter(n => n.project !== id);
      state.actions    = state.actions.filter(a => a.project !== id);
      persist('projects'); persist('decisions'); persist('notes'); persist('actions');
      notify();
    },

    // ─────── Decisions ───────
    addDecision(input) {
      const d = {
        id: genId('d'),
        project: input.project,
        when: input.when || todayIso(),
        status: input.status || 'pending',
        title: input.title || '',
        options: Array.isArray(input.options) ? input.options : [],
        leaning: input.leaning || null,
        reasoning: input.reasoning || '',
      };
      if (input.choice) d.choice = input.choice;
      state.decisions = [d, ...state.decisions];
      persist('decisions');
      touchProject(d.project);
      notify();
      return d.id;
    },
    updateDecision(id, patch) {
      let pid = null;
      state.decisions = state.decisions.map(d => {
        if (d.id !== id) return d;
        pid = d.project;
        return { ...d, ...patch };
      });
      persist('decisions');
      touchProject(pid);
      notify();
    },
    deleteDecision(id) {
      const d = state.decisions.find(x => x.id === id);
      state.decisions = state.decisions.filter(x => x.id !== id);
      persist('decisions');
      if (d) touchProject(d.project);
      notify();
    },
    addDecisionOption(id, option) {
      let pid = null;
      state.decisions = state.decisions.map(d => {
        if (d.id !== id) return d;
        pid = d.project;
        return { ...d, options: [...(d.options || []), option] };
      });
      persist('decisions');
      touchProject(pid);
      notify();
    },
    resolveDecision(id, choice, reasoning) {
      let pid = null;
      state.decisions = state.decisions.map(d => {
        if (d.id !== id) return d;
        pid = d.project;
        return {
          ...d,
          status: 'done',
          choice,
          reasoning: reasoning != null && reasoning !== '' ? reasoning : d.reasoning,
        };
      });
      persist('decisions');
      touchProject(pid);
      notify();
    },

    // ─────── Notes ───────
    addNote(input) {
      const n = {
        id: genId('n'),
        project: input.project,
        when: input.when || nowStamp(),
        kind: input.kind || 'insight',
        title: input.title || '',
        body: input.body || '',
      };
      // linkedTo: { kind: 'action' | 'decision', id: string } — optional.
      // Stored only when present so older notes round-trip cleanly.
      if (input.linkedTo && input.linkedTo.kind && input.linkedTo.id) {
        n.linkedTo = { kind: input.linkedTo.kind, id: input.linkedTo.id };
      }
      state.notes = [n, ...state.notes];
      persist('notes');
      touchProject(n.project);
      notify();
      return n.id;
    },
    updateNote(id, patch) {
      let pid = null;
      state.notes = state.notes.map(n => {
        if (n.id !== id) return n;
        pid = (patch && patch.project) || n.project;
        return { ...n, ...patch };
      });
      persist('notes');
      touchProject(pid);
      notify();
    },
    deleteNote(id) {
      const n = state.notes.find(x => x.id === id);
      state.notes = state.notes.filter(x => x.id !== id);
      persist('notes');
      if (n) touchProject(n.project);
      notify();
    },

    // ─────── Actions ───────
    addAction(input) {
      const a = {
        id: genId('a'),
        project: input.project,
        title: input.title || '',
        due: input.due || null,
        done: !!input.done,
        waitingOn: input.waitingOn || 'me',
        priority: input.priority || 'medium',
      };
      state.actions = [...state.actions, a];
      persist('actions');
      touchProject(a.project);
      notify();
      return a.id;
    },
    updateAction(id, patch) {
      let pid = null;
      state.actions = state.actions.map(a => {
        if (a.id !== id) return a;
        pid = a.project;
        return { ...a, ...patch };
      });
      persist('actions');
      touchProject(pid);
      notify();
    },
    toggleAction(id) {
      let pid = null;
      state.actions = state.actions.map(a => {
        if (a.id !== id) return a;
        pid = a.project;
        return { ...a, done: !a.done };
      });
      persist('actions');
      touchProject(pid);
      notify();
    },
    deleteAction(id) {
      const a = state.actions.find(x => x.id === id);
      state.actions = state.actions.filter(x => x.id !== id);
      persist('actions');
      if (a) touchProject(a.project);
      notify();
    },

    // ─────── Loose tasks ───────
    addLooseTask(input) {
      const t = {
        id: genId('t'),
        title: input.title || '',
        due: input.due || null,
        done: !!input.done,
        tag: input.tag || '',
      };
      state.looseTasks = [...state.looseTasks, t];
      persist('looseTasks');
      notify();
      return t.id;
    },
    updateLooseTask(id, patch) {
      state.looseTasks = state.looseTasks.map(t => t.id === id ? { ...t, ...patch } : t);
      persist('looseTasks');
      notify();
    },
    toggleLooseTask(id) {
      state.looseTasks = state.looseTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
      persist('looseTasks');
      notify();
    },
    deleteLooseTask(id) {
      state.looseTasks = state.looseTasks.filter(t => t.id !== id);
      persist('looseTasks');
      notify();
    },

    // ─────── Kinds (project categories) ───────
    addKind(label, color) {
      const trimmed = String(label || '').trim();
      if (!trimmed) return null;
      const id = 'k-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const k = { id, label: trimmed, color: color || 'cream' };
      state.kinds = [...state.kinds, k];
      persist('kinds');
      notify();
      return id;
    },
    updateKind(id, patch) {
      // Accept either a label string (back-compat) or a patch object.
      const p = typeof patch === 'string' ? { label: patch } : (patch || {});
      if ('label' in p) {
        const t = String(p.label || '').trim();
        if (!t) return;
        p.label = t;
      }
      state.kinds = state.kinds.map(k => k.id === id ? { ...k, ...p } : k);
      persist('kinds');
      notify();
    },
    deleteKind(id) {
      state.kinds = state.kinds.filter(k => k.id !== id);
      persist('kinds');
      notify();
    },

    // ─────── Quotes ───────
    setQuotes(arr) {
      state.quotes = Array.isArray(arr) ? arr.slice() : [];
      persist('quotes');
      notify();
    },

    // ─────── Export / Import / Reset ───────
    exportAll() {
      return {
        version: 1,
        exportedAt: nowStamp(),
        projects:   state.projects,
        decisions:  state.decisions,
        notes:      state.notes,
        actions:    state.actions,
        looseTasks: state.looseTasks,
        recent:     state.recent,
        quotes:     state.quotes,
        kinds:      state.kinds,
      };
    },
    importAll(data) {
      if (!data || typeof data !== 'object') throw new Error('数据格式不正确');
      ['projects','decisions','notes','actions','looseTasks','recent','quotes','kinds'].forEach(k => {
        if (Array.isArray(data[k])) {
          state[k] = data[k];
          persist(k);
        }
      });
      notify();
    },
    resetToDefaults() {
      state.projects   = DEFAULT_PROJECTS.slice();
      state.decisions  = DEFAULT_DECISIONS.slice();
      state.notes      = DEFAULT_NOTES.slice();
      state.actions    = DEFAULT_ACTIONS.slice();
      state.looseTasks = DEFAULT_LOOSE_TASKS.slice();
      state.recent     = DEFAULT_RECENT.slice();
      state.quotes     = DEFAULT_QUOTES.slice();
      state.kinds      = DEFAULT_KINDS.slice();
      Object.keys(SK).forEach(k => persist(k));
      notify();
    },
    clearAll() {
      state.projects = []; state.decisions = []; state.notes = [];
      state.actions = []; state.looseTasks = []; state.recent = [];
      // Keep quotes — they're user-customized encouragement, not data
      Object.keys(SK).forEach(k => persist(k));
      notify();
    },
  };
})();

function useStore() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => Store.subscribe(force), []);
  const s = Store.getState();
  const projectMap = React.useMemo(
    () => Object.fromEntries(s.projects.map(p => [p.id, p])),
    [s.projects],
  );
  const kindMap = React.useMemo(
    () => Object.fromEntries((s.kinds || []).map(k => [k.id, k])),
    [s.kinds],
  );
  return {
    projects:   s.projects,
    decisions:  s.decisions,
    notes:      s.notes,
    actions:    s.actions,
    looseTasks: s.looseTasks,
    recent:     s.recent,
    quotes:     s.quotes,
    kinds:      s.kinds,
    projectMap,
    kindMap,
  };
}

// Resolve a kind id to its current label, preferring user-edited kinds and
// falling back to the static defaults so historical projects always render.
function kindLabel(kindId, liveKinds) {
  const arr = Array.isArray(liveKinds) ? liveKinds : Store.getState().kinds || [];
  const hit = arr.find(k => k.id === kindId);
  if (hit) return hit.label;
  if (KIND[kindId]) return KIND[kindId].label;
  return kindId;
}

// Resolve a kind id to its current color entry (one of KIND_COLORS).
// Same fallback chain as kindLabel; returns `cream` as the final default.
function kindColor(kindId, liveKinds) {
  const arr = Array.isArray(liveKinds) ? liveKinds : Store.getState().kinds || [];
  const hit = arr.find(k => k.id === kindId);
  let colorId = (hit && hit.color) || (KIND[kindId] && KIND[kindId].color) || 'cream';
  return KIND_COLORS.find(c => c.id === colorId) || KIND_COLORS[0];
}
function looseColor() {
  return KIND_COLORS.find(c => c.id === LOOSE_COLOR_ID) || KIND_COLORS[0];
}

/* ───────────────────── Gist sync ─────────────────────
   Personal cloud via a GitHub Gist:
     - User generates a Personal Access Token with `gist` scope (one-time).
     - Token + gistId live in localStorage on each device.
     - Push: PATCH the Gist with full exportAll() JSON.
     - Pull: GET the Gist, call importAll() with the contents.
     - Auto-push (optional): subscribe to store changes, debounce 2s, push.
   "Last write wins" — there's no merge. The cloud copy is whatever was
   written most recently. The pulled-or-pushed timestamps are stored so the
   UI can tell the user what happened. */

const SYNC_KEYS = {
  token:    'commandcenter_sync_token',
  gistId:   'commandcenter_sync_gist_id',
  auto:     'commandcenter_sync_auto',
  lastPush: 'commandcenter_sync_last_push',
  lastPull: 'commandcenter_sync_last_pull',
  lastErr:  'commandcenter_sync_last_err',
};

const GistSync = (function () {
  function read(k, fallback) {
    try { const v = localStorage.getItem(k); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) {}
  }

  function getConfig() {
    return {
      token:    read(SYNC_KEYS.token, ''),
      gistId:   read(SYNC_KEYS.gistId, ''),
      auto:     read(SYNC_KEYS.auto, '0') === '1',
      lastPush: read(SYNC_KEYS.lastPush, ''),
      lastPull: read(SYNC_KEYS.lastPull, ''),
      lastErr:  read(SYNC_KEYS.lastErr, ''),
    };
  }
  function setConfig(patch) {
    if ('token'  in patch) write(SYNC_KEYS.token,  patch.token);
    if ('gistId' in patch) write(SYNC_KEYS.gistId, patch.gistId);
    if ('auto'   in patch) write(SYNC_KEYS.auto,   patch.auto ? '1' : '0');
    if ('lastPush' in patch) write(SYNC_KEYS.lastPush, patch.lastPush);
    if ('lastPull' in patch) write(SYNC_KEYS.lastPull, patch.lastPull);
    if ('lastErr'  in patch) write(SYNC_KEYS.lastErr,  patch.lastErr || '');
    syncSubs.forEach(fn => { try { fn(getConfig()); } catch (e) {} });
  }

  const syncSubs = new Set();
  function subscribeConfig(fn) { syncSubs.add(fn); return () => syncSubs.delete(fn); }

  function fileName() { return 'commandcenter.json'; }

  async function push() {
    const cfg = getConfig();
    if (!cfg.token) throw new Error('未配置 GitHub Token');
    const payload = Store.exportAll();
    const body = {
      description: 'CommandCenter sync',
      files: { [fileName()]: { content: JSON.stringify(payload, null, 2) } },
    };
    const headers = {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    let res;
    if (cfg.gistId) {
      res = await fetch('https://api.github.com/gists/' + cfg.gistId, {
        method: 'PATCH', headers, body: JSON.stringify(body),
      });
    } else {
      res = await fetch('https://api.github.com/gists', {
        method: 'POST', headers, body: JSON.stringify({ ...body, public: false }),
      });
    }
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('GitHub ' + res.status + '：' + txt.slice(0, 200));
    }
    const json = await res.json();
    setConfig({
      gistId: json.id || cfg.gistId,
      lastPush: Store.nowStamp(),
      lastErr: '',
    });
    return json.id || cfg.gistId;
  }

  async function pull() {
    const cfg = getConfig();
    if (!cfg.token) throw new Error('未配置 GitHub Token');
    if (!cfg.gistId) throw new Error('还没有 Gist ID — 先推送一次创建云端备份');
    const headers = {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json',
    };
    const res = await fetch('https://api.github.com/gists/' + cfg.gistId, { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('GitHub ' + res.status + '：' + txt.slice(0, 200));
    }
    const json = await res.json();
    const file = json.files && json.files[fileName()];
    if (!file) throw new Error('Gist 里没找到 ' + fileName());
    let content = file.content;
    // GitHub truncates very large files; fetch raw_url in that case.
    if (file.truncated && file.raw_url) {
      const raw = await fetch(file.raw_url);
      content = await raw.text();
    }
    const parsed = JSON.parse(content);
    Store.importAll(parsed);
    setConfig({ lastPull: Store.nowStamp(), lastErr: '' });
    return parsed;
  }

  // Auto-push: subscribe to Store changes, debounce pushes by 2s.
  let pendingTimer = null;
  let pendingPromise = null;
  let suppressUntil = 0;

  function maybeAutoPush() {
    const cfg = getConfig();
    if (!cfg.auto || !cfg.token) return;
    // Pull operations call Store.importAll which would re-trigger us; suppress
    // for a short window after every push/pull so we don't ping-pong.
    if (Date.now() < suppressUntil) return;
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      pendingPromise = push().catch(e => {
        setConfig({ lastErr: String(e.message || e) });
      }).finally(() => {
        suppressUntil = Date.now() + 1500;
        pendingPromise = null;
      });
    }, 2000);
  }

  // Wrap the Store callbacks so importAll doesn't trigger an immediate push.
  function withSuppression(fn) {
    return (...args) => {
      suppressUntil = Date.now() + 3000;
      return fn(...args);
    };
  }

  function start() {
    Store.subscribe(maybeAutoPush);
  }

  return {
    getConfig, setConfig, subscribeConfig,
    push, pull, start,
    withSuppression,
  };
})();

// Kick off auto-push subscription once data layer is ready.
GistSync.start();

function useSyncConfig() {
  const [cfg, setCfg] = React.useState(() => GistSync.getConfig());
  React.useEffect(() => GistSync.subscribeConfig(setCfg), []);
  return cfg;
}
window.useSyncConfig = useSyncConfig;

// Pick a deterministic item from arr based on the given date string.
// Same date → same pick; different date → likely different pick.
function dailyPick(arr, dateIso) {
  if (!arr || !arr.length) return '';
  let h = 5381;
  const s = String(dateIso || '');
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return arr[Math.abs(h) % arr.length];
}

// Fuzzy match: every char of token appears in str in order (whitespace ignored).
function fuzzyMatch(token, str) {
  const t = String(token || '').replace(/\s+/g, '').toLowerCase();
  const s = String(str || '').replace(/\s+/g, '').toLowerCase();
  if (!t) return true;
  let i = 0;
  for (const c of s) {
    if (c === t[i]) i++;
    if (i >= t.length) return true;
  }
  return false;
}

/* ─────────────────────────── Modal portal ─────────────────────────── */
// Global setter wired up by App. Components call openModal(<node/>) to show.
let __setModal = () => {};
function openModal(node) { __setModal(node); }
function closeModal() { __setModal(null); }
function registerModalSetter(fn) { __setModal = fn; }

function Modal({ title, onClose, children, footer, width = 480 }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose && onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 18, 22, 0.42)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh', paddingBottom: '4vh',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          width, maxWidth: '92vw', maxHeight: '86vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        }}>
        <div style={{
          padding: '13px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)' }}>{title}</div>
          <button className="btn ghost sm" onClick={onClose}>关闭</button>
        </div>
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Form primitives ─────────────────────────── */
const FIELD_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '7px 9px',
  fontSize: 13,
  background: 'var(--bg-elev)',
  color: 'var(--fg)',
  fontFamily: 'inherit',
  outline: 'none',
};
const TEXTAREA_STYLE = { ...FIELD_STYLE, minHeight: 80, resize: 'vertical', lineHeight: 1.55 };

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10.5, color: 'var(--fg-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
        fontFamily: 'var(--font-mono)',
      }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus, type = 'text' }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={FIELD_STYLE}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={TEXTAREA_STYLE}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value == null ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...FIELD_STYLE, cursor: 'pointer' }}>
      {options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={String(v)} value={v}>{l}</option>;
      })}
    </select>
  );
}

function ConfirmDialog({ title, message, confirmLabel = '确认', danger, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={400}
      footer={
        <>
          <button className="btn sm" onClick={onClose}>取消</button>
          <button
            className={danger ? 'btn sm' : 'btn primary sm'}
            style={danger ? { color: '#fff', background: 'var(--rust)', borderColor: 'var(--rust)' } : null}
            onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </>
      }>
      <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.6 }}>{message}</div>
    </Modal>
  );
}

Object.assign(window, {
  STAGE, STAGE_LIST, KIND, COMMANDS, KIND_COLORS, LOOSE_COLOR_ID,
  Store, useStore, fuzzyMatch, dailyPick, kindLabel, kindColor, looseColor,
  GistSync,
  openModal, closeModal, registerModalSetter,
  Modal, Field, TextInput, TextArea, Select, ConfirmDialog,
  FIELD_STYLE, TEXTAREA_STYLE,
});
