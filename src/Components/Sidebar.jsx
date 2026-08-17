import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Leads",
      path: "/leads",
    },
    {
      name: "Customers",
      path: "/customers",
    },
    {
      name: "Vendors",
      path: "/vendors",
    },
    {
      name: "Resource Management",
      path: "/resource-management",
    },
    {
      name: "Testing",
      path: "/testing",
    },
    {
      name: "All Reports",
      path: "/route-searching",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-60 bg-white border-r border-gray-200 flex flex-col">

      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            CloudCRM
          </h1>

          <p className="text-xs text-gray-500 mt-0.5">
            Management System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        <p className="px-3 mb-2 text-xs font-medium text-gray-500">
          Main Menu
        </p>

        <div className="space-y-1">

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center w-full px-3 py-2.5 rounded-md text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

        </div>
      </nav>

      {/* Bottom User Section */}
      <div className="border-t border-gray-200 px-5 py-4 flex-shrink-0">

        <p className="text-sm font-medium text-gray-800">
          Admin
        </p>

        <p className="text-xs text-gray-500 mt-0.5">
          CRM Administrator
        </p>

      </div>

    </aside>
  );
}

export default Sidebar;