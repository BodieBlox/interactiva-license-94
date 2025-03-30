import { SideNav } from './SideNav';

export const Sidebar = () => {
  return (
    <div className="hidden lg:block w-[280px] flex-shrink-0 transition-all duration-300 ease-in-out">
      <SideNav />
    </div>
  );
};
