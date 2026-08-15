import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">

        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="text-xs text-gray-500 mt-0.5">
            CRM overview and business management
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-gray-800">
              Admin
            </p>

            <p className="text-xs text-gray-500">
              CRM Administrator
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            A
          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="p-6 md:p-8">

        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back 👋
          </h2>

          <p className="text-gray-500 mt-2">
            Manage your customers, leads, vendors, resources
            and routes from one place.
          </p>

        </div>


        {/* ===================================================
            QUICK STATISTICS
        =================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* CUSTOMERS */}

          <Link
            to="/customers"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Customers
                </p>

                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  —
                </h3>

                <p className="text-xs text-gray-400 mt-2">
                  Customer accounts
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                👥
              </div>

            </div>

          </Link>


          {/* LEADS */}

          <Link
            to="/leads"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-orange-300 transition"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Leads
                </p>

                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  —
                </h3>

                <p className="text-xs text-gray-400 mt-2">
                  Active opportunities
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
                🎯
              </div>

            </div>

          </Link>


          {/* VENDORS */}

          <Link
            to="/vendors"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Vendors
                </p>

                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  —
                </h3>

                <p className="text-xs text-gray-400 mt-2">
                  Vendor accounts
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                🏢
              </div>

            </div>

          </Link>


          {/* RESOURCES */}

          <Link
            to="/resource-management"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-green-300 transition"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Resources
                </p>

                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  —
                </h3>

                <p className="text-xs text-gray-400 mt-2">
                  Buying & selling resources
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl">
                📊
              </div>

            </div>

          </Link>

        </div>


        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">

            <div className="px-6 py-5 border-b border-gray-200">

              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Quickly access the most commonly used CRM areas.
              </p>

            </div>


            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">


              {/* ADD LEAD */}

              <Link
                to="/leads"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition"
              >

                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  +
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    Manage Leads
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Add and manage your leads
                  </p>

                </div>

              </Link>


              {/* CUSTOMERS */}

              <Link
                to="/customers"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition"
              >

                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  👥
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    Customers
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    View customer information
                  </p>

                </div>

              </Link>


              {/* VENDORS */}

              <Link
                to="/vendors"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition"
              >

                <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  🏢
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    Vendors
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Manage vendor information
                  </p>

                </div>

              </Link>


              {/* RESOURCES */}

              <Link
                to="/resource-management"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-green-50 hover:border-green-200 transition"
              >

                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  📊
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    Resources
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Manage buying & selling resources
                  </p>

                </div>

              </Link>


            </div>

          </div>


          {/* =================================================
              ROUTE SEARCH
          ================================================= */}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

            <div className="px-6 py-5 border-b border-gray-200">

              <h2 className="text-lg font-semibold text-gray-900">
                Route Search
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Find available telecom routes.
              </p>

            </div>

            <div className="p-6">

              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-5">
                🔍
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Search Routes
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-6">
                Search and compare available vendor routes,
                countries, quality and rates.
              </p>

              <Link
                to="/route-searching"
                className="inline-flex items-center justify-center w-full mt-6 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Open Route Searching →
              </Link>

            </div>

          </div>

        </div>


        {/* ===================================================
            MANAGEMENT OVERVIEW
        =================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-900">
              Management Overview
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Access the main areas of your CRM system.
            </p>

          </div>


          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">


            {/* RESOURCE */}

            <Link
              to="/resource-management"
              className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  📊
                </div>

                <h3 className="font-semibold text-gray-900">
                  Resource Management
                </h3>

              </div>

              <p className="text-sm text-gray-500 leading-6">
                Manage vendor buying resources and client
                selling resources.
              </p>

              <span className="inline-block mt-4 text-sm font-medium text-purple-600">
                Open Resources →
              </span>

            </Link>


            {/* CUSTOMERS */}

            <Link
              to="/customers"
              className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  👥
                </div>

                <h3 className="font-semibold text-gray-900">
                  Customer Management
                </h3>

              </div>

              <p className="text-sm text-gray-500 leading-6">
                View and manage customer company details,
                contacts and accounts.
              </p>

              <span className="inline-block mt-4 text-sm font-medium text-blue-600">
                Open Customers →
              </span>

            </Link>


            {/* VENDORS */}

            <Link
              to="/vendors"
              className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  🏢
                </div>

                <h3 className="font-semibold text-gray-900">
                  Vendor Management
                </h3>

              </div>

              <p className="text-sm text-gray-500 leading-6">
                Manage vendor accounts, contacts and
                vendor information.
              </p>

              <span className="inline-block mt-4 text-sm font-medium text-orange-600">
                Open Vendors →
              </span>

            </Link>


            {/* ALL DATA */}

            <Link
              to="/all-data"
              className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center">
                  🗂️
                </div>

                <h3 className="font-semibold text-gray-900">
                  All Data
                </h3>

              </div>

              <p className="text-sm text-gray-500 leading-6">
                View consolidated CRM information including
                customers, vendors, leads and resources.
              </p>

              <span className="inline-block mt-4 text-sm font-medium text-gray-700">
                Open All Data →
              </span>

            </Link>

          </div>

        </div>


        {/* ===================================================
            SYSTEM STATUS
        =================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-900">
              System Status
            </h2>

          </div>


          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="flex items-center gap-4">

              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                ✓
              </div>

              <div>

                <p className="font-medium text-gray-900">
                  CRM System
                </p>

                <p className="text-xs text-green-600">
                  Operational
                </p>

              </div>

            </div>


            <div className="flex items-center gap-4">

              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                ✓
              </div>

              <div>

                <p className="font-medium text-gray-900">
                  Database
                </p>

                <p className="text-xs text-green-600">
                  Connected
                </p>

              </div>

            </div>


            <div className="flex items-center gap-4">

              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                ✓
              </div>

              <div>

                <p className="font-medium text-gray-900">
                  Resources
                </p>

                <p className="text-xs text-green-600">
                  Available
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;