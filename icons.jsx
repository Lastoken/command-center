// Minimal line icons, dark-theme friendly

const Icon = ({ children, size = 16, stroke = 1.6, ...rest }) => (
  <svg
    className="nv-icon"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

const I = {
  Home:     (p) => <Icon {...p}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /></Icon>,
  Folder:   (p) => <Icon {...p}><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>,
  Note:     (p) => <Icon {...p}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path d="M8 9h8M8 13h8M8 17h5" /></Icon>,
  Compass:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-5 2 2-5z" /></Icon>,
  Wrench:   (p) => <Icon {...p}><path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8a3 3 0 0 1-4-4l8-8z" /></Icon>,
  Search:   (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>,
  Bell:     (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3z" /><path d="M10 19a2 2 0 0 0 4 0" /></Icon>,
  Plus:     (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Filter:   (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z" /></Icon>,
  Chevron:  (p) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>,
  ArrowL:   (p) => <Icon {...p}><path d="M15 6 9 12l6 6" /></Icon>,
  Decision: (p) => <Icon {...p}><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="3" /></Icon>,
  Clock:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Pulse:    (p) => <Icon {...p}><path d="M3 12h4l2-6 4 12 2-6h6" /></Icon>,
  Alert:    (p) => <Icon {...p}><path d="m12 3 10 18H2z" /><path d="M12 10v5M12 18v.1" /></Icon>,
  Flag:     (p) => <Icon {...p}><path d="M5 4v17" /><path d="M5 4h12l-2 4 2 4H5" /></Icon>,
  Check:    (p) => <Icon {...p}><path d="M5 12l5 5L20 7" /></Icon>,
  More:     (p) => <Icon {...p}><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></Icon>,
  Upload:   (p) => <Icon {...p}><path d="M12 4v12M6 10l6-6 6 6" /><path d="M4 20h16" /></Icon>,
  Sparkle:  (p) => <Icon {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></Icon>,
  Repeat:   (p) => <Icon {...p}><path d="M17 3l3 3-3 3" /><path d="M4 11V9a3 3 0 0 1 3-3h13" /><path d="M7 21l-3-3 3-3" /><path d="M20 13v2a3 3 0 0 1-3 3H4" /></Icon>,
  External: (p) => <Icon {...p}><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v6H4V4h6" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></Icon>,
  User:     (p) => <Icon {...p}><circle cx="12" cy="9" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></Icon>,
  Building: (p) => <Icon {...p}><path d="M4 21V5l8-2v18M12 9l8-2v14M16 21V11M4 21h16" /></Icon>,
  Cal:      (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Icon>,
  Cog:      (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>,
};

window.I = I;
window.Icon = Icon;
