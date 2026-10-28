
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";

function Vendors() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accountManagerFilter, setAccountManagerFilter] = useState("All");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const showSupabaseError = useCallback((error, fallbackMessage) => {
    console.error("Supabase Error:", error);

    setLoadError({
      message: error?.message || fallbackMessage,
      details: error?.details || "",
      hint: error?.hint || "",
      code: error?.code || "",
    });

    setShowErrorModal(true);
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from(VENDORS_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (vendorError) throw vendorError;

      const { data: companyData, error: companyError } = await supabase
        .from(COMPANIES_TABLE)
        .select("*");

      if (companyError) throw companyError;

      const companiesMap = {};

      (companyData || []).forEach((company) => {
        companiesMap[String(company.id)] = company;
      });

      const combinedVendors = (vendorData || []).map((vendor) => {
        const company = companiesMap[String(vendor.company_id)] || {};

        return {
          ...vendor,
          company,
          company_name:
            vendor.company_name || company.company_name || "",
          account_manager:
            vendor.account_manager || company.account_manager || "",
          country: vendor.country || company.country || "",
          website: vendor.website || "",
          contact_person:
            vendor.contact_person || company.contact_person || "",
          phone: vendor.phone || company.phone || "",
          email: vendor.email || company.email || "",
          ip_addresses: vendor.ip_addresses || [],
          description: vendor.description || "",
        };
      });

      setVendors(combinedVendors);
    } catch (error) {
      showSupabaseError(
        error,
        "Failed to load vendor data from Supabase."
      );

      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [showSupabaseError]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const accountManagers = [
    ...new Set(
      vendors
        .map((vendor) =>
          String(vendor.account_manager || "").trim()
        )
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const searchValue = search.toLowerCase().trim();

  const filteredVendors = vendors.filter((vendor) => {
    const vendorId = String(vendor.vendor_id || "");
    const companyName = String(vendor.company_name || "");
    const accountManager = String(vendor.account_manager || "");
    const country = String(vendor.country || "");

    const matchesSearch =
      vendorId.toLowerCase().includes(searchValue) ||
      companyName.toLowerCase().includes(searchValue) ||
      accountManager.toLowerCase().includes(searchValue) ||
      country.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" ||
      String(vendor.status || "").toUpperCase() ===
        statusFilter.toUpperCase();

    const matchesAccountManager =
      accountManagerFilter === "All" ||
      accountManager.trim().toLowerCase() ===
        accountManagerFilter.trim().toLowerCase();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAccountManager
    );
  });

  const totalVendors = vendors.length;

  const activeVendors = vendors.filter(
    (vendor) =>
      String(vendor.status || "").toUpperCase() === "ACTIVE"
  ).length;

  const inactiveVendors = vendors.filter(
    (vendor) =>
      String(vendor.status || "").toUpperCase() === "INACTIVE"
  ).length;

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "ACTIVE") return "text-emerald-700";
    if (normalized === "INACTIVE") return "text-red-600";

    return "text-gray-600";
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "ACTIVE") return "Active";
    if (normalized === "INACTIVE") return "Inactive";

    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* HEADER */}

      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <div>
            <p className="text-sm font-semibold text-gray-900">
              CloudCRM
            </p>
            <p className="text-xs text-gray-400">
              Vendor Management
            </p>
          </div>
        </div>

        <span className="text-xs text-gray-400">Vendors</span>
      </header>

      {/* MAIN */}

      <main className="p-5 md:p-8 max-w-[1600px] mx-auto">
        {/* BREADCRUMB */}

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="hover:text-gray-700"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="text-gray-700 font-medium">
            Vendors
          </span>
        </div>

        {/* PAGE HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Vendors
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage and monitor your vendor accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/vendors/add")}
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
          >
            <span className="text-xl leading-none">+</span>
            Add Vendor
          </button>
        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Vendors
            </p>
            <p className="text-2xl font-default mt-2">
              {totalVendors}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-green-400">
              Active Vendors
            </p>
            <p className="text-2xl font-default text-black mt-2">
              {activeVendors}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-red-400">
              Inactive Vendors
            </p>
            <p className="text-2xl font-default text-gray-500 mt-2">
              {inactiveVendors}
            </p>
          </div>
        </div>

        {/* TABLE CONTAINER */}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* TOOLBAR */}

          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  Vendor Accounts
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  {filteredVendors.length} vendor
                  {filteredVendors.length === 1 ? "" : "s"} displayed
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                    />
                  </svg>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendors..."
                    className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white focus:border-gray-400"
                  />
                </div>

                <select
                  value={accountManagerFilter}
                  onChange={(e) =>
                    setAccountManagerFilter(e.target.value)
                  }
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none min-w-[190px]"
                >
                  <option value="All">All Account Managers</option>

                  {accountManagers.map((manager) => (
                    <option key={manager} value={manager}>
                      {manager}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Vendor ID
                  </th>

                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Company Name
                  </th>

                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Account Manager
                  </th>

                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3" />
                        <p className="text-sm text-gray-500">
                          Loading vendors...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {search ||
                        statusFilter !== "All" ||
                        accountManagerFilter !== "All"
                          ? "No vendors match your search or filter."
                          : "No vendors found."}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredVendors.map((vendor) => {
                    const isInactive =
                      String(vendor.status || "").toUpperCase() ===
                      "INACTIVE";

                    return (
                      <tr
                        key={vendor.id}
                        className={`hover:bg-gray-50 transition ${
                          isInactive ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        <td className="px-6 py-3">
                          <span
                            className={`text-sm ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {vendor.vendor_id || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`font-normal text-sm ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {vendor.company_name || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`text-sm ${
                              isInactive
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {vendor.account_manager || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              isInactive
                                ? "text-red-600"
                                : getStatusStyle(vendor.status)
                            }`}
                          >
                            {getStatusLabel(vendor.status)}
                          </span>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/vendors/${encodeURIComponent(
                                    vendor.vendor_id
                                  )}`
                                )
                              }
                              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border rounded-lg transition ${
                                isInactive
                                  ? "text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
                                  : "text-gray-700 border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900"
                              }`}
                            >
                              Open

                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ERROR MODAL */}

      {showErrorModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Vendor Operation Failed
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Supabase returned an error.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-800 break-words">
                  {loadError?.message ||
                    "Unable to complete the operation."}
                </p>
              </div>

              {loadError?.code && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Error Code
                  </p>
                  <p className="mt-1 text-sm font-mono">
                    {loadError.code}
                  </p>
                </div>
              )}

              {loadError?.details && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Details
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {loadError.details}
                  </p>
                </div>
              )}

              {loadError?.hint && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Hint
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {loadError.hint}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeErrorModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowErrorModal(false);
                    fetchVendors();
                  }}
                  className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
