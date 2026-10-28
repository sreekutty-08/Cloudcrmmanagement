
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const CUSTOMERS_TABLE = "customers";
const COMPANIES_TABLE = "companies";

function Customers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accountManagerFilter, setAccountManagerFilter] = useState("All");
  const navigate = useNavigate();
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH CUSTOMERS
  const fetchCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from(CUSTOMERS_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (customerError) {
        throw customerError;
      }

      if (!customerData || customerData.length === 0) {
        setCustomers([]);
        return;
      }

      // FETCH COMPANIES
      const companyIds = [
        ...new Set(
          customerData
            .map((customer) => customer.company_id)
            .filter(Boolean)
        ),
      ];

      let companies = [];

      if (companyIds.length > 0) {
        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .select("*")
          .in("id", companyIds);

        if (companyError) {
          throw companyError;
        }

        companies = companyData || [];
      }

      // COMBINE CUSTOMER + COMPANY
      const combinedCustomers = customerData.map((customer) => {
        const company = companies.find(
          (item) => item.id === customer.company_id
        );

        return {
          ...customer,
          company: company || {},
          company_name: company?.company_name || "",
          country: company?.country || "",
          website: company?.website || "",
          email: company?.email || "",
          phone: company?.phone || "",
          contact_person: company?.contact_person || "",
          account_manager: company?.account_manager || "",
          company_status: company?.status || "",
          company_description: company?.company_description || "",
        };
      });

      setCustomers(combinedCustomers);
    } catch (err) {
      console.error("Failed to fetch customers:", err);

      setError(err?.message || "Failed to load customers.");
      setShowErrorPopup(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    fetchCustomers();
  }, []);

  // SEARCH + FILTER
  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.toLowerCase().trim();

    const customerId = customer.customer_id?.toLowerCase() || "";
    const companyName = customer.company_name?.toLowerCase() || "";
    const accountManager = customer.account_manager?.toLowerCase() || "";
    const contactPerson = customer.contact_person?.toLowerCase() || "";

    const matchesSearch =
      customerId.includes(searchValue) ||
      companyName.includes(searchValue) ||
      accountManager.includes(searchValue) ||
      contactPerson.includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || customer.status === statusFilter;

    const matchesAccountManager =
      accountManagerFilter === "All" ||
      customer.account_manager === accountManagerFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAccountManager
    );
  });

  // ACCOUNT MANAGERS
  const accountManagers = [
    ...new Set(
      customers
        .map((customer) => customer.account_manager)
        .filter(Boolean)
    ),
  ].sort();

  // COUNTS
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) =>
      String(customer.status || "").toUpperCase() === "ACTIVE"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) =>
      String(customer.status || "").toUpperCase() === "INACTIVE"
  ).length;

  // ERROR POPUP
  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-gray-800 font-semibold"
        >
          <span className="text-lg">←</span>
          <span>CloudCRM</span>
        </Link>

        <div className="text-sm text-gray-500">
          Customer Management
        </div>
      </header>

      {/* MAIN */}
      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customers
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your customer accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/customers/add")}
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <span className="text-lg">+</span>
            Add Customer
          </button>
        </div>

        {/* STATISTICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Customers
            </p>

            <h2 className="text-3xl font-default text-gray-900 mt-2">
              {totalCustomers}
            </h2>

            <p className="text-xs text-gray-400 mt-2">
              All customer accounts
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Customers
            </p>

            <h2 className="text-3xl font-default text-green-600 mt-2">
              {activeCustomers}
            </h2>

            <p className="text-xs text-gray-400 mt-2">
              Currently active accounts
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Inactive Customers
            </p>

            <h2 className="text-3xl font-default text-red-500 mt-2">
              {inactiveCustomers}
            </h2>

            <p className="text-xs text-gray-400 mt-2">
              Currently inactive accounts
            </p>
          </div>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Customer Overview
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  View and manage customer accounts.
                </p>
              </div>

              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredCustomers.length}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-gray-900">
                  {customers.length}
                </span>
                {" "}customers
              </div>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div className="px-6 py-5 bg-gray-50/70 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, company, account manager..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                />
              </div>

              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="ACTIVE">active</option>
                  <option value="INACTIVE">inactive</option>
                </select>
              </div>

              <div className="lg:w-56">
                <select
                  value={accountManagerFilter}
                  onChange={(e) =>
                    setAccountManagerFilter(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                >
                  <option value="All">All Account Managers</option>

                  {accountManagers.map((accountManager) => (
                    <option
                      key={accountManager}
                      value={accountManager}
                    >
                      {accountManager}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer ID
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company Name
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Manager
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />

                      <p className="text-sm text-gray-500">
                        Loading customers...
                      </p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center">
                      <h3 className="font-semibold text-gray-900">
                        No customers found
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Try changing your search or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isInactive =
                      String(customer.status || "").toUpperCase() ===
                      "INACTIVE";

                    return (
                      <tr
                        key={customer.id}
                        className={`border-b border-gray-100 last:border-b-0 transition ${
                          isInactive
                            ? "text-red-600 hover:bg-gray-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-3">
                          <span
                            className={`font-normal ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {customer.customer_id || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <p
                            className={`font-normal ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {customer.company_name || "-"}
                          </p>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`text-sm ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {customer.account_manager || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              String(customer.status || "").toUpperCase() ===
                              "ACTIVE"
                                ? "text-emerald-600"
                                : String(customer.status || "").toUpperCase() ===
                                  "INACTIVE"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {String(customer.status || "Unknown").toLowerCase() ===
                            "active"
                              ? "Active"
                              : String(
                                  customer.status || "Unknown"
                                ).toLowerCase() === "inactive"
                              ? "Inactive"
                              : "Unknown"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end">
                            <Link
                              to={`/customers/${encodeURIComponent(
                                customer.customer_id
                              )}`}
                              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            >
                              Open
                              <span>→</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ERROR POPUP */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Customer Operation Failed
                </h2>

                <p className="text-sm text-gray-500">
                  Supabase returned an error.
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 break-words">
                  {error}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button
                type="button"
                onClick={closeErrorPopup}
                className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
