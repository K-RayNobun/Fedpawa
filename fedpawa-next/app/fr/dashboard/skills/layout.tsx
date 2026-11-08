import type { Metadata } from 'next';

export const metadata = {
  title: 'Skills',
  description: 'Skills Management Page',
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <h2>Skills Management</h2>
      {children}
    </section>
  );
}
