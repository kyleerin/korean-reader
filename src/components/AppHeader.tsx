import { UserMenu } from './UserMenu';

interface Props {
  title?: string;
  left?: React.ReactNode;
}

export function AppHeader({ title, left }: Props) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '0.25rem',
      }}
    >
      {left}
      {title && <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>{title}</h1>}
      <UserMenu />
    </header>
  );
}
