import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";

function Vendors() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [loadError, setLoadError] = useState(null);

  // ============================================================
  // FORM DATA
  // ============================================================

  const initialFormData = {
    companyName: "",
    vendorId: "",
    accountManager: "",
    country: "",
    website: "",
    contactPerson: "",
    phone: "",
    email: "",
    ipAddresses: "",
    vendorStatus: "ACTIVE",
  };

  const [formData, setFormData] = useState(initialFormData);

  // ============================================================
  // ERROR HANDLER
  // ============================================================

  const showSupabaseError = useCallback(
    (error, fallbackMessage) => {
      console.error("Supabase Error:", error);

      setLoadError({
        message: error?.message || fallbackMessage,
        details: error?.details || "",
        hint: error?.hint || "",
        code: error?.code || "",
      });

      setShowErrorModal(true);
    },
    []
  );

  // ============================================================
  // FETCH VENDORS
  // ============================================================

  const fetchVendors = useCallback(async () => {
    setLoading(true);

    try {
      // ========================================================
      // 1. FETCH VENDORS
      // ========================================================

      const {
        data: vendorData,
        error: vendorError,
      } = await supabase
        .from(VENDORS_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (vendorError) {
        throw vendorError;
      }

      // ========================================================
      // 2. FETCH COMPANIES
      // ========================================================

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .select("*");

      if (companyError) {
        throw companyError;
      }

      // ========================================================
      // 3. COMPANY MAP
      // ========================================================

      const companiesMap = {};

      (companyData || []).forEach((company) => {
        companiesMap[String(company.id)] = company;
      });

      // ========================================================
      // 4. COMBINE DATA
      // ========================================================

      const combinedVendors = (vendorData || []).map(
        (vendor) => {
          const company =
            companiesMap[String(vendor.company_id)] || {};

          return {
            ...vendor,

            company,

            company_name:
              company.company_name || "",

            account_manager:
              company.account_manager || "",

            country:
              company.country || "",

            contact_person:
              company.contact_person || "",

            phone:
              company.phone || "",

            email:
              company.email || "",

            // IMPORTANT:
            // IP ADDRESS COMES FROM vendors.ip_addresses
            ip_addresses:
              vendor.ip_addresses || [],
          };
        }
      );

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

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setFormData(initialFormData);
  };

  // ============================================================
  // OPEN MODAL
  // ============================================================

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // ============================================================
  // CLOSE ERROR MODAL
  // ============================================================

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      throw new Error("Company Name is required.");
    }

    if (!formData.vendorId.trim()) {
      throw new Error("Vendor ID is required.");
    }

    if (!formData.accountManager.trim()) {
      throw new Error("Account Manager is required.");
    }

    if (!formData.country.trim()) {
      throw new Error("Country is required.");
    }

    if (!formData.contactPerson.trim()) {
      throw new Error("Contact Person is required.");
    }

    if (!formData.phone.trim()) {
      throw new Error("Phone is required.");
    }

    if (!formData.email.trim()) {
      throw new Error("Email is required.");
    }

    const duplicateVendor = vendors.find(
      (vendor) =>
        String(vendor.vendor_id || "")
          .trim()
          .toLowerCase() ===
        formData.vendorId
          .trim()
          .toLowerCase()
    );

    if (duplicateVendor) {
      throw new Error(
        `Vendor ID "${formData.vendorId}" already exists.`
      );
    }
  };

  // ============================================================
  // PARSE IP ADDRESSES
  // ============================================================

  const parseIpAddresses = (value) => {
    return value
      .split(/[\n,]+/)
      .map((ip) => ip.trim())
      .filter(Boolean);
  };

  // ============================================================
  // SAVE VENDOR
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    let createdCompanyId = null;
    let createdVendorId = null;

    try {
      validateForm();

      const ipAddresses = parseIpAddresses(
        formData.ipAddresses
      );

      // ========================================================
      // COMPANY PAYLOAD
      //
      // IMPORTANT:
      // NO website
      // NO ip_addresses
      //
      // Because those columns do not exist in companies.
      // ========================================================

      const companyPayload = {
        company_name:
          formData.companyName.trim(),

        country:
          formData.country.trim(),

        contact_person:
          formData.contactPerson.trim(),

        phone:
          formData.phone.trim(),

        email:
          formData.email.trim(),

        account_manager:
          formData.accountManager.trim(),
      };

      console.log(
        "Company Payload:",
        companyPayload
      );

      // ========================================================
      // CREATE COMPANY
      // ========================================================

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .insert(companyPayload)
        .select("*")
        .single();

      if (companyError) {
        throw companyError;
      }

      if (!company?.id) {
        throw new Error(
          "Company was created but no company ID was returned."
        );
      }

      createdCompanyId = company.id;

      // ========================================================
      // VENDOR PAYLOAD
      //
      // IMPORTANT:
      // ip_addresses belongs to vendors.
      // ========================================================

      const vendorPayload = {
        company_id: company.id,

        vendor_id:
          formData.vendorId.trim(),

        status:
          formData.vendorStatus,

        ip_addresses:
          ipAddresses,
      };

      console.log(
        "Vendor Payload:",
        vendorPayload
      );

      // ========================================================
      // CREATE VENDOR
      // ========================================================

      const {
        data: vendor,
        error: vendorError,
      } = await supabase
        .from(VENDORS_TABLE)
        .insert(vendorPayload)
        .select("*")
        .single();

      if (vendorError) {
        throw vendorError;
      }

      if (!vendor?.id) {
        throw new Error(
          "Vendor was created but no vendor ID was returned."
        );
      }

      createdVendorId = vendor.id;

      // ========================================================
      // SUCCESS
      // ========================================================

      setShowModal(false);

      resetForm();

      await fetchVendors();
    } catch (error) {
      console.error(
        "Vendor creation failed:",
        error
      );

      // ========================================================
      // ROLLBACK VENDOR
      // ========================================================

      if (createdVendorId) {
        const {
          error: rollbackVendorError,
        } = await supabase
          .from(VENDORS_TABLE)
          .delete()
          .eq("id", createdVendorId);

        if (rollbackVendorError) {
          console.error(
            "Vendor rollback failed:",
            rollbackVendorError
          );
        }
      }

      // ========================================================
      // ROLLBACK COMPANY
      // ========================================================

      if (createdCompanyId) {
        const {
          error: rollbackCompanyError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", createdCompanyId);

        if (rollbackCompanyError) {
          console.error(
            "Company rollback failed:",
            rollbackCompanyError
          );
        }
      }

      showSupabaseError(
        error,
        "Something went wrong while creating the vendor."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const searchValue = search
    .toLowerCase()
    .trim();

  const filteredVendors = vendors.filter(
    (vendor) => {
      const vendorId = String(
        vendor.vendor_id || ""
      );

      const companyName = String(
        vendor.company_name || ""
      );

      const accountManager = String(
        vendor.account_manager || ""
      );

      const country = String(
        vendor.country || ""
      );

      const matchesSearch =
        vendorId
          .toLowerCase()
          .includes(searchValue) ||
        companyName
          .toLowerCase()
          .includes(searchValue) ||
        accountManager
          .toLowerCase()
          .includes(searchValue) ||
        country
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        String(vendor.status || "")
          .toUpperCase() ===
        statusFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  // ============================================================
  // COUNTS
  // ============================================================

  const totalVendors =
    vendors.length;

  const activeVendors =
    vendors.filter(
      (vendor) =>
        String(vendor.status || "")
          .toUpperCase() === "ACTIVE"
    ).length;

  const inactiveVendors =
    vendors.filter(
      (vendor) =>
        String(vendor.status || "")
          .toUpperCase() === "INACTIVE"
    ).length;

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized =
      String(status || "")
        .toUpperCase();

    if (normalized === "ACTIVE") {
      return "text-emerald-700";
    }

    if (normalized === "INACTIVE") {
      return "text-gray-600";
    }

    return "text-gray-600";
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
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

        <span className="text-xs text-gray-400">
          Vendors
        </span>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="p-5 md:p-8 max-w-[1600px] mx-auto">

        {/* BREADCRUMB */}

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
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
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
          >

            <span className="text-xl leading-none">
              +
            </span>

            Add Vendor

          </button>

        </div>

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Vendors
            </p>

            <p className="text-2xl font-bold mt-2">
              {totalVendors}
            </p>

          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Active Vendors
            </p>

            <p className="text-2xl font-bold text-black mt-2">
              {activeVendors}
            </p>

          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Inactive Vendors
            </p>

            <p className="text-2xl font-bold text-gray-500 mt-2">
              {inactiveVendors}
            </p>

          </div>

        </div>

        {/* ======================================================
            TABLE
        ====================================================== */}

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
                  {filteredVendors.length === 1
                    ? ""
                    : "s"}{" "}
                  displayed

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
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search vendors..."
                    className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white focus:border-gray-400"
                  />

                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none"
                >

                  <option value="All">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

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

                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >

                      <div className="flex flex-col items-center">

                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3" />

                        <p className="text-sm text-gray-500">
                          Loading vendors...
                        </p>

                      </div>

                    </td>

                  </tr>

                )}

                {!loading &&
                  filteredVendors.length === 0 && (

                    <tr>

                      <td
                        colSpan="5"
                        className="px-6 py-16 text-center"
                      >

                        <p className="text-sm font-medium text-gray-700">

                          {search ||
                          statusFilter !== "All"
                            ? "No vendors match your search or filter."
                            : "No vendors found."}

                        </p>

                      </td>

                    </tr>

                  )}

                {!loading &&
                  filteredVendors.map(
                    (vendor) => (

                      <tr
                        key={vendor.id}
                        className="hover:bg-gray-50 transition"
                      >

                        {/* CHANGED ONLY: py-5 → py-3 */}

                        <td className="px-6 py-3">

                          <span className="font-medium text-sm text-gray-700">
                            {vendor.vendor_id || "-"}
                          </span>

                        </td>

                        <td className="px-6 py-3">

                          <span className="font-semibold text-sm text-gray-900">
                            {vendor.company_name || "-"}
                          </span>

                        </td>

                        <td className="px-6 py-3">

                          <span className="text-sm text-gray-600">
                            {vendor.account_manager || "-"}
                          </span>

                        </td>

                        {/* STATUS CHANGED TO TEXT ONLY */}

                        <td className="px-6 py-3">

                          <span
                            className={`text-xs font-semibold ${getStatusStyle(
                              vendor.status
                            )}`}
                          >

                            {vendor.status ||
                              "Unknown"}

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
                              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition"
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

                    )
                  )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

      {/* ======================================================
          ADD VENDOR MODAL
      ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden">

            {/* MODAL HEADER */}

            <div className="bg-white border-b px-7 py-5 flex items-center justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-xl font-semibold">
                    +
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      Add Vendor
                    </h2>

                    <p className="text-sm text-gray-500 mt-0.5">
                      Create a new vendor account.
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 text-2xl transition disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto max-h-[calc(92vh-90px)]"
            >

              <div className="p-7">

                {/* COMPANY INFORMATION */}

                <div className="mb-8">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-gray-900">
                      Company Information
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Enter the basic information for the vendor company.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* COMPANY NAME */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name *
                      </label>

                      <input
                        type="text"
                        name="companyName"
                        value={
                          formData.companyName
                        }
                        onChange={handleChange}
                        placeholder="Enter company name"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* VENDOR ID */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Vendor ID *
                      </label>

                      <input
                        type="text"
                        name="vendorId"
                        value={
                          formData.vendorId
                        }
                        onChange={handleChange}
                        placeholder="VEND-0001"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* ACCOUNT MANAGER */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Account Manager *
                      </label>

                      <input
                        type="text"
                        name="accountManager"
                        value={
                          formData.accountManager
                        }
                        onChange={handleChange}
                        placeholder="Account manager name"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* COUNTRY */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Country *
                      </label>

                      <input
                        type="text"
                        name="country"
                        value={
                          formData.country
                        }
                        onChange={handleChange}
                        placeholder="Enter country"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* WEBSITE */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Website
                      </label>

                      <input
                        type="url"
                        name="website"
                        value={
                          formData.website
                        }
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                      <p className="text-[11px] text-gray-400 mt-1.5">
                        Website is currently kept in the form only because the
                        companies table does not have a website column.
                      </p>

                    </div>

                    {/* CONTACT PERSON */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Person *
                      </label>

                      <input
                        type="text"
                        name="contactPerson"
                        value={
                          formData.contactPerson
                        }
                        onChange={handleChange}
                        placeholder="Contact person name"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* PHONE */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone *
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        value={
                          formData.phone
                        }
                        onChange={handleChange}
                        placeholder="+1 234 567 890"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          formData.email
                        }
                        onChange={handleChange}
                        placeholder="vendor@example.com"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                  </div>

                </div>

                {/* NETWORK INFORMATION */}

                <div className="border-t border-gray-100 pt-7">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-gray-900">
                      Network Information
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Add the IP addresses associated with this vendor.
                    </p>

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      IP Addresses
                    </label>

                    <textarea
                      name="ipAddresses"
                      value={
                        formData.ipAddresses
                      }
                      onChange={handleChange}
                      rows="5"
                      placeholder={`192.168.1.10
192.168.1.20
10.0.0.15

You can also separate IPs with commas.`}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition resize-none font-mono text-sm"
                    />

                    <p className="text-xs text-gray-400 mt-2">
                      These values are saved to the{" "}
                      <span className="font-mono text-gray-600">
                        vendors.ip_addresses
                      </span>{" "}
                      column.
                    </p>

                  </div>

                </div>

                {/* STATUS */}

                <div className="border-t border-gray-100 pt-7 mt-7">

                  <div className="max-w-sm">

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vendor Status
                    </label>

                    <select
                      name="vendorStatus"
                      value={
                        formData.vendorStatus
                      }
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>

                    </select>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <p className="text-xs text-gray-400">
                  Fields marked with * are required.
                </p>

                <div className="flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-5 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50 min-w-[130px]"
                  >

                    {saving
                      ? "Saving..."
                      : "Save Vendor"}

                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          ERROR MODAL
      ====================================================== */}

      {showErrorModal && (

        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b flex items-center gap-4">

              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">

                <span className="text-red-600 text-xl font-bold">
                  !
                </span>

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