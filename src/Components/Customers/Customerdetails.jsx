import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const CUSTOMERS_TABLE = "customers";
const COMPANIES_TABLE = "companies";
const RESOURCES_TABLE = "customer_resources";

function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [customer, setCustomer] =
    useState(null);

  const [resources, setResources] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showErrorPopup, setShowErrorPopup] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showDeletePopup, setShowDeletePopup] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [ipAddresses, setIpAddresses] =
    useState([""]);

  const [formData, setFormData] =
    useState({
      customerId: "",
      companyName: "",
      accountManager: "",
      status: "ACTIVE",
      country: "",
      website: "",
      email: "",
      phone: "",
      contactPerson: "",
      companyDescription: "",
    });

  // ============================================================
  // FETCH CUSTOMER DETAILS
  // ============================================================

  const fetchCustomerDetails =
    async () => {
      setLoading(true);
      setError("");

      try {
        if (!customerId) {
          throw new Error(
            "Customer ID was not provided."
          );
        }

        const decodedCustomerId =
          decodeURIComponent(
            customerId
          );

        // ======================================================
        // 1. FETCH CUSTOMER
        // ======================================================

        const {
          data: customerData,
          error: customerError,
        } = await supabase
          .from(CUSTOMERS_TABLE)
          .select("*")
          .eq(
            "customer_id",
            decodedCustomerId
          )
          .single();

        if (customerError) {
          throw customerError;
        }

        if (!customerData) {
          throw new Error(
            "Customer was not found."
          );
        }

        // ======================================================
        // 2. FETCH COMPANY
        // ======================================================

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .select("*")
          .eq(
            "id",
            customerData.company_id
          )
          .single();

        if (companyError) {
          throw companyError;
        }

        // ======================================================
        // 3. FETCH CUSTOMER RESOURCES
        // ======================================================

        const {
          data: resourceData,
          error: resourceError,
        } = await supabase
          .from(RESOURCES_TABLE)
          .select("*")
          .eq(
            "customer_id",
            customerData.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (resourceError) {
          throw resourceError;
        }

        // ======================================================
        // 4. COMBINE CUSTOMER + COMPANY
        // ======================================================

        const combinedCustomer = {
          ...customerData,

          company:
            companyData || {},

          company_name:
            companyData?.company_name ||
            "",

          country:
            companyData?.country ||
            "",

          website:
            companyData?.website ||
            "",

          email:
            companyData?.email ||
            "",

          phone:
            companyData?.phone ||
            "",

          contact_person:
            companyData?.contact_person ||
            "",

          account_manager:
            companyData?.account_manager ||
            "",

          company_status:
            companyData?.status ||
            "",

          company_description:
            companyData?.company_description ||
            "",
        };

        setCustomer(
          combinedCustomer
        );

        setResources(
          resourceData || []
        );

        setFormData({
          customerId:
            combinedCustomer.customer_id ||
            "",

          companyName:
            combinedCustomer.company_name ||
            "",

          accountManager:
            combinedCustomer.account_manager ||
            "",

          status:
            combinedCustomer.status ||
            "ACTIVE",

          country:
            combinedCustomer.country ||
            "",

          website:
            combinedCustomer.website ||
            "",

          email:
            combinedCustomer.email ||
            "",

          phone:
            combinedCustomer.phone ||
            "",

          contactPerson:
            combinedCustomer.contact_person ||
            "",

          companyDescription:
            combinedCustomer.company_description ||
            "",
        });

        setIpAddresses(
          Array.isArray(
            customerData.ip_addresses
          ) &&
          customerData.ip_addresses.length >
            0
            ? customerData.ip_addresses
            : [""]
        );
      } catch (err) {
        console.error(
          "Failed to fetch customer details:",
          err
        );

        setError(
          err?.message ||
            "Failed to load customer details."
        );

        setShowErrorPopup(true);
      } finally {
        setLoading(false);
      }
    };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

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

  const removeIpField = (
    index
  ) => {
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
  // OPEN EDIT
  // ============================================================

  const openEditModal = () => {
    if (!customer) {
      return;
    }

    setFormData({
      customerId:
        customer.customer_id || "",

      companyName:
        customer.company_name || "",

      accountManager:
        customer.account_manager || "",

      status:
        customer.status || "ACTIVE",

      country:
        customer.country || "",

      website:
        customer.website || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      contactPerson:
        customer.contact_person || "",

      companyDescription:
        customer.company_description ||
        "",
    });

    setIpAddresses(
      Array.isArray(
        customer.ip_addresses
      ) &&
      customer.ip_addresses.length > 0
        ? customer.ip_addresses
        : [""]
    );

    setShowEditModal(true);
  };

  // ============================================================
  // CLOSE EDIT
  // ============================================================

  const closeEditModal = () => {
    if (saving) {
      return;
    }

    setShowEditModal(false);
  };

  // ============================================================
  // UPDATE CUSTOMER
  // ============================================================

  const handleUpdate = async (
    e
  ) => {
    e.preventDefault();

    if (!customer) {
      return;
    }

    setSaving(true);

    try {
      const cleanIpAddresses =
        ipAddresses
          .map((ip) => ip.trim())
          .filter(Boolean);

      // ========================================================
      // 1. UPDATE COMPANY
      // ========================================================

      const updatedCompany = {
        company_name:
          formData.companyName.trim(),

        account_manager:
          formData.accountManager.trim(),

        status:
          formData.status,

        country:
          formData.country.trim(),

        website:
          formData.website.trim(),

        phone:
          formData.phone.trim(),

        email:
          formData.email.trim(),

        contact_person:
          formData.contactPerson.trim(),

        company_description:
          formData.companyDescription.trim(),

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .update(updatedCompany)
        .eq(
          "id",
          customer.company_id
        );

      if (companyError) {
        throw companyError;
      }

      // ========================================================
      // 2. UPDATE CUSTOMER
      // ========================================================

      const updatedCustomer = {
        status:
          formData.status,

        ip_addresses:
          cleanIpAddresses,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: customerError,
      } = await supabase
        .from(CUSTOMERS_TABLE)
        .update(updatedCustomer)
        .eq(
          "id",
          customer.id
        );

      if (customerError) {
        throw customerError;
      }

      setShowEditModal(false);

      await fetchCustomerDetails();
    } catch (err) {
      console.error(
        "Customer update failed:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while updating the customer."
      );

      setShowErrorPopup(true);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE CUSTOMER
  // ============================================================

  const handleDelete = async () => {
    if (!customer) {
      return;
    }

    setDeleting(true);

    try {
      // Customer resources are automatically
      // removed through ON DELETE CASCADE.

      const {
        error: customerError,
      } = await supabase
        .from(CUSTOMERS_TABLE)
        .delete()
        .eq(
          "id",
          customer.id
        );

      if (customerError) {
        throw customerError;
      }

      // Company is no longer needed after customer deletion.

      const {
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .delete()
        .eq(
          "id",
          customer.company_id
        );

      if (companyError) {
        console.error(
          "Company deletion error:",
          companyError
        );
      }

      setShowDeletePopup(false);

      navigate("/customers");
    } catch (err) {
      console.error(
        "Customer delete failed:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while deleting the customer."
      );

      setShowErrorPopup(true);
    } finally {
      setDeleting(false);
    }
  };

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
  // DETAIL FIELD
  // ============================================================

  const DetailField = ({
    label,
    value,
  }) => (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">
        {label}
      </p>

      <p className="text-sm font-medium text-gray-900 break-words">
        {value || "-"}
      </p>

    </div>
  );

  // ============================================================
  // ERROR POPUP
  // ============================================================

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">

        <div className="flex flex-col items-center">

          <div className="w-9 h-9 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />

          <p className="text-sm text-gray-500">
            Loading customer details...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // CUSTOMER NOT FOUND
  // ============================================================

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">

        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">

          <button
            type="button"
            onClick={() =>
              navigate("/customers")
            }
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100"
          >
            ←
          </button>

          <div className="ml-4">

            <p className="text-sm font-semibold">
              CloudCRM
            </p>

            <p className="text-xs text-gray-400">
              Customer Details
            </p>

          </div>

        </header>

        <main className="max-w-4xl mx-auto p-6 md:p-8">

          <div className="bg-white border border-red-200 rounded-xl p-6">

            <h1 className="text-lg font-bold text-gray-900">
              Unable to load customer
            </h1>

            <p className="text-sm text-red-600 mt-2">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/customers")
              }
              className="mt-5 px-4 py-2.5 bg-black text-white rounded-lg"
            >
              Back to Customers
            </button>

          </div>

        </main>

      </div>
    );
  }

  if (!customer) {
    return null;
  }

  // ============================================================
  // MAIN PAGE
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
              navigate("/customers")
            }
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            ←
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <div>

            <p className="text-sm font-semibold">
              CloudCRM
            </p>

            <p className="text-xs text-gray-400">
              Customer Details
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={openEditModal}
            className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white transition"
          >
            Edit Customer
          </button>

          <button
            type="button"
            onClick={() =>
              setShowDeletePopup(true)
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            Delete
          </button>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="max-w-[1400px] mx-auto p-5 md:p-8">

        {/* BREADCRUMB */}

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">

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

          <button
            type="button"
            onClick={() =>
              navigate("/customers")
            }
            className="hover:text-gray-700"
          >
            Customers
          </button>

          <span>/</span>

          <span className="text-gray-700 font-medium">
            {customer.customer_id}
          </span>

        </div>

        {/* PAGE HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {customer.company_name ||
                  "Customer"}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
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

            </div>

            <p className="text-sm text-gray-500 mt-1">

              Customer ID:{" "}

              <span className="font-medium text-gray-700">
                {customer.customer_id}
              </span>

            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/customers")
            }
            className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white transition"
          >
            Back to Customers
          </button>

        </div>

        {/* ====================================================
            COMPANY INFORMATION
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold">
              Company Information
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Company information associated with this customer.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

              <DetailField
                label="Company Name"
                value={
                  customer.company_name
                }
              />

              <DetailField
                label="Customer ID"
                value={
                  customer.customer_id
                }
              />

              <DetailField
                label="Account Manager"
                value={
                  customer.account_manager
                }
              />

              <DetailField
                label="Country"
                value={
                  customer.country
                }
              />

              <DetailField
                label="Website"
                value={
                  customer.website
                }
              />

              <DetailField
                label="Company Status"
                value={
                  customer.company_status
                }
              />

            </div>

          </div>

        </section>

        {/* ====================================================
            CONTACT INFORMATION
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold">
              Contact Person
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Primary contact information for this customer.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

              <DetailField
                label="Contact Person"
                value={
                  customer.contact_person
                }
              />

              <DetailField
                label="Phone"
                value={
                  customer.phone
                }
              />

              <DetailField
                label="Email"
                value={
                  customer.email
                }
              />

            </div>

          </div>

        </section>

        {/* ====================================================
            IP ADDRESSES
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold">
              IP Addresses
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Customer IP address information.
            </p>

          </div>

          <div className="p-6">

            {Array.isArray(
              customer.ip_addresses
            ) &&
            customer.ip_addresses.length >
              0 ? (

              <div className="flex flex-wrap gap-2">

                {customer.ip_addresses.map(
                  (ip, index) => (

                    <span
                      key={index}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
                    >
                      {ip}
                    </span>

                  )
                )}

              </div>

            ) : (

              <p className="text-sm text-gray-400">
                No IP address available.
              </p>

            )}

          </div>

        </section>

        {/* ====================================================
            CUSTOMER RESOURCES
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold">
              Customer Resources
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Resource information associated with this customer.
            </p>

          </div>

          <div className="overflow-x-auto">

            {resources.length ===
            0 ? (

              <div className="p-8 text-center">

                <p className="text-sm text-gray-400">
                  No customer resources found.
                </p>

              </div>

            ) : (

              <table className="w-full min-w-[900px]">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Buying Rate
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Ports
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Credit
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Support Quality
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Quality Description ID
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Route Type
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Billing Cycle
                    </th>

                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {resources.map(
                    (resource) => (

                      <tr
                        key={resource.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.buying_rate ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.ports ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.credit ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.support_quality ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.quality_description_id ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.route_type ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {resource.billing_cycle ||
                            "-"}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
                              resource.status
                            )}`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                String(
                                  resource.status ||
                                    ""
                                ).toUpperCase() ===
                                "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {resource.status ||
                              "Unknown"}

                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </main>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      {showEditModal && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="sticky top-0 z-20 bg-white border-b px-6 py-5 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Edit Customer
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Update customer information.
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdate}
              className="p-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>

                  <input
                    value={
                      formData.customerId
                    }
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>

                  <input
                    name="companyName"
                    value={
                      formData.companyName
                    }
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Manager *
                  </label>

                  <input
                    name="accountManager"
                    value={
                      formData.accountManager
                    }
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
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

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>

                  <input
                    name="country"
                    value={
                      formData.country
                    }
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>

                  <input
                    name="website"
                    value={
                      formData.website
                    }
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>

                  <input
                    name="contactPerson"
                    value={
                      formData.contactPerson
                    }
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

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
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-black"
                  />

                </div>

              </div>

              {/* IP ADDRESSES */}

              <div className="border-t mt-8 pt-7">

                <div className="flex items-center justify-between mb-5">

                  <div>

                    <h3 className="text-lg font-semibold">
                      IP Addresses
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Manage customer IP addresses.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={addIpField}
                    disabled={saving}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm"
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

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-5 py-3 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-black text-white rounded-lg"
                >
                  {saving
                    ? "Updating..."
                    : "Update Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          DELETE POPUP
      ====================================================== */}

      {showDeletePopup && (

        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b">

              <h2 className="text-xl font-bold">
                Delete Customer?
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone.
              </p>

            </div>

            <div className="px-6 py-5">

              <p className="text-gray-700">

                Are you sure you want to delete{" "}

                <span className="font-semibold">
                  {customer.company_name}
                </span>
                ?

              </p>

              <p className="text-sm text-red-600 mt-3">
                All customer information and associated resources will be removed.
              </p>

            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowDeletePopup(false)
                }
                disabled={deleting}
                className="px-5 py-2.5 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Customer"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          ERROR POPUP
      ====================================================== */}

      {showErrorPopup && (

        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">

                <span className="text-red-600 text-xl font-bold">
                  !
                </span>

              </div>

              <div>

                <h2 className="text-lg font-bold">
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
                className="px-5 py-2.5 bg-black text-white rounded-lg"
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

export default CustomerDetails;