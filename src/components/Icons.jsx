// Lightweight stroke icon set (24px viewBox), styled via currentColor.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Icon({ children, size = 20, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} {...rest}>
      {children}
    </svg>
  );
}

export const HomeIcon = (p) => (
  <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></Icon>
);

export const StudentsIcon = (p) => (
  <Icon {...p}><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" /><path d="M22 9v5" /></Icon>
);

export const TeachersIcon = (p) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c.6-3.4 3.2-5.4 6.5-5.4s5.9 2 6.5 5.4" /><circle cx="17.5" cy="9.5" r="2.6" /><path d="M15.6 14.6c2.9.1 5.2 1.9 5.9 4.9" /></Icon>
);

export const WalletIcon = (p) => (
  <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M15.5 14.5h2" /></Icon>
);

export const ScaleIcon = (p) => (
  <Icon {...p}><path d="M12 3v18" /><path d="M8 21h8" /><path d="M4 7h16" /><path d="M6.5 7 4 13a2.8 2.8 0 0 0 5 0L6.5 7ZM17.5 7 15 13a2.8 2.8 0 0 0 5 0l-2.5-6Z" /></Icon>
);

export const ReportIcon = (p) => (
  <Icon {...p}><path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 16.5h6" /></Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);

export const EditIcon = (p) => (
  <Icon {...p}><path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Icon>
);

export const TrashIcon = (p) => (
  <Icon {...p}><path d="M4 7h16" /><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" /><path d="M6.5 7 7.5 20a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-13" /></Icon>
);

export const BackIcon = (p) => (
  <Icon {...p}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></Icon>
);

export const PhoneIcon = (p) => (
  <Icon {...p}><path d="M6.5 3h3l1.5 4.5-2 1.5a12.5 12.5 0 0 0 6 6l1.5-2L21 14.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3Z" /></Icon>
);

export const MailIcon = (p) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
);

export const PinIcon = (p) => (
  <Icon {...p}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></Icon>
);

export const DownloadIcon = (p) => (
  <Icon {...p}><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 20h16" /></Icon>
);

export const UploadIcon = (p) => (
  <Icon {...p}><path d="M12 15V4" /><path d="m7.5 7.5 4.5-4.5 4.5 4.5" /><path d="M4 20h16" /></Icon>
);

export const PrintIcon = (p) => (
  <Icon {...p}><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="8" rx="1.5" /><path d="M7 13h10v8H7v-8Z" /></Icon>
);

export const SyncIcon = (p) => (
  <Icon {...p}><path d="M20 11a8 8 0 0 0-14.9-3" /><path d="M4 3v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3" /><path d="M20 21v-5h-5" /></Icon>
);

export const RupeeIcon = (p) => (
  <Icon {...p}><path d="M7 4h10M7 8.5h10" /><path d="M7 4h3a4.5 4.5 0 0 1 0 9H7l7 7" /></Icon>
);

export const CloseIcon = (p) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
);

export const UserIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.8-4 3.9-6.2 7.5-6.2s6.7 2.2 7.5 6.2" /></Icon>
);

export const LogoutIcon = (p) => (
  <Icon {...p}><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 12h10" /><path d="m13 8-4 4 4 4" /></Icon>
);

export const SettingsIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.6M12 18.9v2.6M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9" /></Icon>
);

export const CalendarIcon = (p) => (
  <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /></Icon>
);
