import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Navbar />
      <main className="pt-[var(--navbar-height)]">
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default MainLayout;
