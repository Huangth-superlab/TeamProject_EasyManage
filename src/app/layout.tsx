import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '项目管理系统',
    template: '%s | 项目管理系统',
  },
  description: '企业级项目管理系统，统一管理项目信息、人员信息及项目动态。',
  authors: [{ name: 'Project Management Team' }],
  generator: 'Project Management System',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
