
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPages from "./Components/LoginPages";
import Dashboard from "./Components/Dashboard";
import Sidebar from "./Components/Sidebar";

// CUSTOMERS
import Customers from "./Components/Customers/Customers";
import CustomerDetails from "./Components/Customers/Customerdetails";
import AddCustomer from "./Components/Customers/AddCustomer.jsx";

// LEADS
import Leads from "./Components/Leads/Leads";
import AddLead from "./Components/Leads/AddLead";
import LeadDetails from "./Components/Leads/Leaddetails";

// VENDORS
import Vendors from "./Components/Vendors/Vendors";
import AddVendor from "./Components/Vendors/AddVendor.jsx";
import VendorDetails from "./Components/Vendors/Vendordetails";

// RESOURCE MANAGEMENT
import ResourceManagement from "./Components/ResourceManagement/ResourceManagement";
import Clientresource from "./Components/ResourceManagement/Clientresource";
import AddClientResource from "./Components/ResourceManagement/AddClientResource.jsx";
import AddVendorResource from "./Components/ResourceManagement/AddVendorResource.jsx";

// OTHER PAGES
import RouteSearching from "./Components/RouteSearching/RouteSearching";
import Testing from "./Components/Testing/Testing";

function CRMLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Routes>
          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* CUSTOMERS */}
          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/customers/add"
            element={<AddCustomer />}
          />

          <Route
            path="/customers/:customerId"
            element={<CustomerDetails />}
          />

          {/* LEADS */}
          <Route
            path="/leads"
            element={<Leads />}
          />

          <Route
            path="/leads/add"
            element={<AddLead />}
          />

          <Route
            path="/leads/:leadId"
            element={<LeadDetails />}
          />

          {/* VENDORS */}
          <Route
            path="/vendors"
            element={<Vendors />}
          />

          <Route
            path="/vendors/add"
            element={<AddVendor />}
          />

          <Route
            path="/vendors/:vendorId"
            element={<VendorDetails />}
          />

          {/* RESOURCE MANAGEMENT */}
          <Route
            path="/resource-management"
            element={<ResourceManagement />}
          />

          {/* CLIENT RESOURCE LIST */}
          <Route
            path="/resource-management/clients"
            element={<Clientresource />}
          />

          {/* ADD CLIENT RESOURCE */}
         <Route
  path="/resource-management/clients/add"
  element={<AddClientResource />}
/>

          {/* ADD VENDOR RESOURCE */}
          <Route
            path="/resource-management/vendors/add"
            element={<AddVendorResource />}
          />

          {/* OTHER PAGES */}
          <Route
            path="/testing"
            element={<Testing />}
          />

          <Route
            path="/route-searching"
            element={<RouteSearching />}
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={<LoginPages />}
        />

        {/* CRM LAYOUT */}
        <Route
          path="/*"
          element={<CRMLayout />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
