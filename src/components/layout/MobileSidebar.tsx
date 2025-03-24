
import { SideNav } from './SideNav';

export const MobileSidebar = () => {
  return (
    <div className="drawer drawer-side md:hidden">
      <input id="mobile-sidebar-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content here */}
      </div>
      <div className="drawer-side">
        <label htmlFor="mobile-sidebar-drawer" className="drawer-overlay"></label>
        <div className="bg-background w-64 h-full">
          <SideNav />
        </div>
      </div>
    </div>
  );
};
