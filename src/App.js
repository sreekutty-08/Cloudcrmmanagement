import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPages from "./Components/LoginPages";
import Dashboard from "./Components/Dashboard";
import Sidebar from "./Components/Sidebar";

import Customers from "./Components/Customers/Customers";
import CustomerDetails from "./Components/Customers/Customerdetails";

import Leads from "./Components/Leads/Leads";
import LeadDetails from "./Components/Leads/Leaddetails";

import Vendors from "./Components/Vendors/Vendors";
import VendorDetails from "./Components/Vendors/Vendordetails";

import ResourceManagement from "./Components/ResourceManagement/ResourceManagement";

import Clientresource from "./Components/ResourceManagement/Clientresource";

import RouteSearching from "./Components/RouteSearching/RouteSearching";


/* =========================================================
   CRM LAYOUT
========================================================= */

function CRMLayout() {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <Sidebar />

      {/* PAGE CONTENT */}
      <div className="ml-64">

        <Routes>

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* =================================================
              CUSTOMERS
          ================================================= */}

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/customers/:customerId"
            element={<CustomerDetails />}
          />


          {/* =================================================
              LEADS
          ================================================= */}

          <Route
            path="/leads"
            element={<Leads />}
          />

          <Route
            path="/leads/:leadId"
            element={<LeadDetails />}
          />


          {/* =================================================
              VENDORS
          ================================================= */}

          <Route
            path="/vendors"
            element={<Vendors />}
          />

          <Route
            path="/vendors/:vendorId"
            element={<VendorDetails />}
          />


          {/* =================================================
              RESOURCE MANAGEMENT
          ================================================= */}

          {/* Optional old resource-management page */}
          <Route
            path="/resource-management"
            element={<ResourceManagement />}
          />


          {/* =================================================
              VENDOR BUYING RESOURCE PAGE
          ================================================= */}

        


          {/* =================================================
              CLIENT SELLING RESOURCE PAGE
          ================================================= */}

          <Route
            path="/resource-management/clients"
            element={<Clientresource />}
          />


          {/* =================================================
              ROUTE SEARCHING
          ================================================= */}

          <Route
            path="/route-searching"
            element={<RouteSearching />}
          />


          {/* =================================================
              UNKNOWN ROUTE
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </div>

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={<LoginPages />}
        />

        {/* CRM */}
        <Route
          path="/*"
          element={<CRMLayout />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;