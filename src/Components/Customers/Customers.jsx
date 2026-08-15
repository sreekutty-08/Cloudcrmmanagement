import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const CUSTOMERS_TABLE = "customers";
const COMPANIES_TABLE = "companies";

function Customers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [ipAddresses, setIpAddresses] = useState([""]);

  const [formData, setFormData] = useState({
    customerId: "",
    companyName: "",
    accountManager: "",
    status: "ACTIVE",
    country: "",
    website: "",
    phone: "",
    email: "",
    contactPerson: "",
    companyDescription: "",
  });

  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

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

      // ========================================================
      // FETCH COMPANIES
      // ========================================================

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

      // ========================================================
      // COMBINE CUSTOMER + COMPANY
      // ========================================================

      const combinedCustomers = customerData.map(
        (customer) => {
          const company = companies.find(
            (item) => item.id === customer.company_id
          );

          return {
            ...customer,

            company: company || {},

            company_name:
              company?.company_name || "",

            country:
              company?.country || "",

            website:
              company?.website || "",

            email:
              company?.email || "",

            phone:
              company?.phone || "",

            contact_person:
              company?.contact_person || "",

            account_manager:
              company?.account_manager || "",

            company_status:
              company?.status || "",

            company_description:
              company?.company_description || "",
          };
        }
      );

      setCustomers(combinedCustomers);
    } catch (err) {
      console.error(
        "Failed to fetch customers:",
        err
      );

      setError(
        err?.message ||
          "Failed to load customers."
      );

      setShowErrorPopup(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // IP FUNCTIONS
  // ============================================================

  const addIpField = () => {
    setIpAddresses((prev) => [
      ...prev,
      "",
    ]);
  };

  const removeIpField = (index) => {
    if (ipAddresses.length === 1) {
      return;
    }

    setIpAddresses((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  const updateIp = (
    index,
    value
  ) => {
    setIpAddresses((prev) => {
      const updated = [...prev];

      updated[index] = value;

      return updated;
    });
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setFormData({
      customerId: "",
      companyName: "",
      accountManager: "",
      status: "ACTIVE",
      country: "",
      website: "",
      phone: "",
      email: "",
      contactPerson: "",
      companyDescription: "",
    });

    setIpAddresses([""]);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    resetForm();
  };

  // ============================================================
  // SAVE CUSTOMER
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      // ========================================================
      // VALIDATION
      // ========================================================

      if (!formData.customerId.trim()) {
        throw new Error(
          "Customer ID is required."
        );
      }

      if (!formData.companyName.trim()) {
        throw new Error(
          "Company name is required."
        );
      }

      // ========================================================
      // 1. CREATE COMPANY
      // ========================================================

      const companyData = {
        company_name:
          formData.companyName.trim(),

        country:
          formData.country.trim(),

        website:
          formData.website.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        contact_person:
          formData.contactPerson.trim(),

        account_manager:
          formData.accountManager.trim(),

        status:
          formData.status,

        company_description:
          formData.companyDescription.trim(),

        updated_at:
          new Date().toISOString(),
      };

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .insert([companyData])
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      // ========================================================
      // 2. CLEAN IP ADDRESSES
      // ========================================================

      const cleanIpAddresses =
        ipAddresses
          .map((ip) => ip.trim())
          .filter(Boolean);

      // ========================================================
      // 3. CREATE CUSTOMER
      // ========================================================

      const customerData = {
        customer_id:
          formData.customerId.trim(),

        company_id:
          company.id,

        ip_addresses:
          cleanIpAddresses,

        status:
          formData.status,

        updated_at:
          new Date().toISOString(),
      };

      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from(CUSTOMERS_TABLE)
        .insert([customerData])
        .select()
        .single();

      if (customerError) {
        // Remove company if customer creation failed
        await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", company.id);

        throw customerError;
      }

      console.log(
        "Customer created:",
        customer
      );

      setShowModal(false);

      resetForm();

      await fetchCustomers();
    } catch (err) {
      console.error(
        "Customer creation failed:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while adding the customer."
      );

      setShowErrorPopup(true);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredCustomers =
    customers.filter(
      (customer) => {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        const customerId =
          customer.customer_id
            ?.toLowerCase() || "";

        const companyName =
          customer.company_name
            ?.toLowerCase() || "";

        const accountManager =
          customer.account_manager
            ?.toLowerCase() || "";

        const contactPerson =
          customer.contact_person
            ?.toLowerCase() || "";

        const matchesSearch =
          customerId.includes(
            searchValue
          ) ||
          companyName.includes(
            searchValue
          ) ||
          accountManager.includes(
            searchValue
          ) ||
          contactPerson.includes(
            searchValue
          );

        const matchesStatus =
          statusFilter === "All" ||
          customer.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  // ============================================================
  // COUNTS
  // ============================================================

  const totalCustomers =
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        String(
          customer.status || ""
        ).toUpperCase() ===
        "ACTIVE"
    ).length;

  const inactiveCustomers =
    customers.filter(
      (customer) =>
        String(
          customer.status || ""
        ).toUpperCase() ===
        "INACTIVE"
    ).length;

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (
    status
  ) => {
    const normalized =
      String(
        status || ""
      ).toUpperCase();

    if (
      normalized === "ACTIVE"
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // ============================================================
  // ERROR POPUP
  // ============================================================

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">

        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-gray-800 font-semibold"
        >
          <span className="text-lg">
            ←
          </span>

          <span>
            CloudCRM
          </span>
        </Link>

        <div className="text-sm text-gray-500">
          Customer Management
        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">

        {/* ====================================================
            HEADER
        ==================================================== */}

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
            onClick={() => {
              setError("");
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <span className="text-lg">
              +
            </span>

            Add Customer
          </button>

        </div>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Customers
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-2">
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

            <h2 className="text-3xl font-bold text-green-600 mt-2">
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

            <h2 className="text-3xl font-bold text-gray-500 mt-2">
              {inactiveCustomers}
            </h2>

            <p className="text-xs text-gray-400 mt-2">
              Currently inactive accounts
            </p>

          </div>

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

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

          {/* SEARCH */}

          <div className="px-6 py-5 bg-gray-50/70 border-b border-gray-200">

            <div className="flex flex-col lg:flex-row gap-3">

              <div className="flex-1">

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search customer, company, account manager..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                />

              </div>

              <div className="lg:w-48">

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
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

            <table className="w-full min-w-[850px]">

              <thead className="bg-gray-50 border-b border-gray-200">

                <tr>

                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer ID
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company Name
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Manager
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >

                      <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />

                      <p className="text-sm text-gray-500">
                        Loading customers...
                      </p>

                    </td>

                  </tr>

                ) : filteredCustomers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >

                      <h3 className="font-semibold text-gray-900">
                        No customers found
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Try changing your search or status filter.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredCustomers.map(
                    (customer) => (

                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                      >

                        <td className="px-6 py-5">

                          <span className="font-medium text-gray-900">
                            {customer.customer_id ||
                              "-"}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <p className="font-semibold text-gray-900">
                            {customer.company_name ||
                              "-"}
                          </p>

                        </td>

                        <td className="px-6 py-5">

                          <span className="text-sm text-gray-700">
                            {customer.account_manager ||
                              "-"}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${getStatusStyle(
                              customer.status
                            )}`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                String(
                                  customer.status ||
                                    ""
                                ).toUpperCase() ===
                                "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {customer.status ||
                              "Unknown"}

                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <div className="flex justify-end">

                            <Link
                              to={`/customers/${encodeURIComponent(
                                customer.customer_id
                              )}`}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            >
                              Open
                              <span>
                                →
                              </span>
                            </Link>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

      {/* ======================================================
          ADD CUSTOMER MODAL
      ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="sticky top-0 z-20 bg-white border-b px-6 py-5 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Add Customer
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter the customer account information.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 text-2xl disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* =================================================
                  CUSTOMER INFORMATION
              ================================================= */}

              <div>

                <h3 className="text-lg font-semibold text-gray-900 mb-5">
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* CUSTOMER ID */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer ID *
                    </label>

                    <input
                      type="text"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      placeholder="CUST-0001"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* COMPANY NAME */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>

                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* ACCOUNT MANAGER */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Manager *
                    </label>

                    <input
                      type="text"
                      name="accountManager"
                      value={formData.accountManager}
                      onChange={handleChange}
                      placeholder="Enter account manager"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* STATUS */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-black"
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>

                    </select>

                  </div>

                  {/* COUNTRY */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>

                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* WEBSITE */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>

                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* CONTACT PERSON */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>

                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Enter contact person"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Description
                    </label>

                    <textarea
                      name="companyDescription"
                      value={
                        formData.companyDescription
                      }
                      onChange={handleChange}
                      rows="4"
                      placeholder="Enter company description..."
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-black"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  IP ADDRESSES
              ================================================= */}

              <div className="border-t mt-8 pt-7">

                <div className="flex items-center justify-between mb-5">

                  <div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      IP Addresses
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Add one or more customer IP addresses.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={addIpField}
                    disabled={saving}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    + Add IP
                  </button>

                </div>

                <div className="space-y-3">

                  {ipAddresses.map(
                    (ip, index) => (

                      <div
                        key={index}
                        className="flex gap-3"
                      >

                        <input
                          type="text"
                          value={ip}
                          onChange={(e) =>
                            updateIp(
                              index,
                              e.target.value
                            )
                          }
                          placeholder={`IP Address ${
                            index + 1
                          }`}
                          disabled={saving}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                        />

                        {ipAddresses.length >
                          1 && (

                          <button
                            type="button"
                            onClick={() =>
                              removeIpField(
                                index
                              )
                            }
                            disabled={saving}
                            className="px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                          >
                            Remove
                          </button>

                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          ERROR POPUP
      ====================================================== */}

      {showErrorPopup && (

        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">

                <span className="text-red-600 text-xl font-bold">
                  !
                </span>

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