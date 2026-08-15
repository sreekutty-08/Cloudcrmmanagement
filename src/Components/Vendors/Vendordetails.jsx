import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";
const RESOURCES_TABLE = "vendor_resources";

function VendorDetails() {
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH VENDOR DETAILS
  // ============================================================

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError("");

    try {
      if (!vendorId) {
        throw new Error("Vendor ID was not provided.");
      }

      const decodedVendorId =
        decodeURIComponent(vendorId);

      // ========================================================
      // 1. FETCH VENDOR
      // ========================================================

      const {
        data: vendorData,
        error: vendorError,
      } = await supabase
        .from(VENDORS_TABLE)
        .select("*")
        .eq("vendor_id", decodedVendorId)
        .single();

      if (vendorError) {
        throw vendorError;
      }

      if (!vendorData) {
        throw new Error("Vendor was not found.");
      }

      // ========================================================
      // 2. FETCH COMPANY
      // ========================================================

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .select("*")
        .eq("id", vendorData.company_id)
        .single();

      if (companyError) {
        throw companyError;
      }

      // ========================================================
      // 3. FETCH VENDOR RESOURCES
      // ========================================================

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from(RESOURCES_TABLE)
        .select("*")
        .eq("vendor_id", vendorData.id)
        .order("created_at", {
          ascending: false,
        });

      if (resourceError) {
        throw resourceError;
      }

      // ========================================================
      // 4. COMBINE VENDOR + COMPANY
      // ========================================================

      const combinedVendor = {
        ...vendorData,

        company: companyData || {},

        company_name:
          companyData?.company_name || "",

        country:
          companyData?.country || "",

        email:
          companyData?.email || "",

        phone:
          companyData?.phone || "",

        contact_person:
          companyData?.contact_person || "",

        account_manager:
          companyData?.account_manager || "",

        company_status:
          companyData?.status || "",

        company_description:
          companyData?.company_description || "",

        // ======================================================
        // IMPORTANT
        // IP ADDRESS IS FROM vendors.ip_addresses
        // ======================================================

        ip_addresses:
          vendorData?.ip_addresses || [],
      };

      setVendor(combinedVendor);
      setResources(resourceData || []);
    } catch (err) {
      console.error(
        "Failed to fetch vendor details:",
        err
      );

      setError(
        err?.message ||
          "Failed to load vendor details."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchVendorDetails();
  }, [vendorId]);

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized = String(
      status || ""
    ).toUpperCase();

    if (normalized === "ACTIVE") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (normalized === "INACTIVE") {
      return "bg-gray-100 text-gray-600 border-gray-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // ============================================================
  // DETAIL FIELD
  // ============================================================

  const DetailField = ({ label, value }) => {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">
          {label}
        </p>

        <p className="text-sm font-medium text-gray-900 break-words">
          {value || "-"}
        </p>
      </div>
    );
  };

  // ============================================================
  // IP ADDRESS NORMALIZER
  // ============================================================

  const getIpAddresses = () => {
    const value = vendor?.ip_addresses;

    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((ip) => String(ip).trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(/[\n,]+/)
        .map((ip) => ip.trim())
        .filter(Boolean);
    }

    return [];
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
            Loading vendor details...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-gray-900">

        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">

          <button
            type="button"
            onClick={() => navigate("/vendors")}
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

          <div className="ml-4">

            <p className="text-sm font-semibold">
              CloudCRM
            </p>

            <p className="text-xs text-gray-400">
              Vendor Details
            </p>

          </div>

        </header>

        <main className="max-w-4xl mx-auto p-6 md:p-8">

          <div className="bg-white border border-red-200 rounded-xl p-6">

            <h1 className="text-lg font-bold text-gray-900">
              Unable to load vendor
            </h1>

            <p className="text-sm text-red-600 mt-2">
              {error || "Vendor was not found."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/vendors")}
              className="mt-5 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Back to Vendors
            </button>

          </div>

        </main>

      </div>
    );
  }

  const ipAddresses = getIpAddresses();

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
            onClick={() => navigate("/vendors")}
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
              Vendor Details
            </p>

          </div>

        </div>

        <span className="text-xs text-gray-400">
          Vendor
        </span>

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
              navigate("/vendors")
            }
            className="hover:text-gray-700"
          >
            Vendors
          </button>

          <span>/</span>

          <span className="text-gray-700 font-medium">
            {vendor.vendor_id}
          </span>

        </div>

        {/* PAGE HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

          <div>

            <div className="flex items-center gap-3 flex-wrap">

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {vendor.company_name ||
                  "Vendor"}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
                  vendor.status
                )}`}
              >

                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    String(
                      vendor.status || ""
                    ).toUpperCase() ===
                    "ACTIVE"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                />

                {vendor.status ||
                  "Unknown"}

              </span>

            </div>

            <p className="text-sm text-gray-500 mt-1">

              Vendor ID:{" "}

              <span className="font-medium text-gray-700">
                {vendor.vendor_id}
              </span>

            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/vendors")
            }
            className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition"
          >
            Back to Vendors
          </button>

        </div>

        {/* ====================================================
            COMPANY INFORMATION
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold text-gray-900">
              Company Information
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Company information associated with this vendor.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

              <DetailField
                label="Company Name"
                value={
                  vendor.company_name
                }
              />

              <DetailField
                label="Vendor ID"
                value={
                  vendor.vendor_id
                }
              />

              <DetailField
                label="Account Manager"
                value={
                  vendor.account_manager
                }
              />

              <DetailField
                label="Country"
                value={
                  vendor.country
                }
              />

              <DetailField
                label="Company Status"
                value={
                  vendor.company_status
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

            <h2 className="text-base font-semibold text-gray-900">
              Contact Person
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Primary contact information for this vendor.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

              <DetailField
                label="Contact Person"
                value={
                  vendor.contact_person
                }
              />

              <DetailField
                label="Phone"
                value={
                  vendor.phone
                }
              />

              <DetailField
                label="Email"
                value={
                  vendor.email
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

            <h2 className="text-base font-semibold text-gray-900">
              IP Addresses
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              IP addresses associated with this vendor.
            </p>

          </div>

          <div className="p-6">

            {ipAddresses.length > 0 ? (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {ipAddresses.map(
                  (ip, index) => (

                    <div
                      key={`${ip}-${index}`}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    >

                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 9l3-3 3 3m0 6l-3 3-3-3m3-6v12"
                          />
                        </svg>

                      </div>

                      <span className="text-sm font-mono font-medium text-gray-700">
                        {ip}
                      </span>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">

                <p className="text-sm text-gray-400">
                  No IP addresses available.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* ====================================================
            VENDOR RESOURCES
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b border-gray-200">

            <h2 className="text-base font-semibold text-gray-900">
              Vendor Resources
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Resource information associated with this vendor.
            </p>

          </div>

          <div className="overflow-x-auto">

            {resources.length === 0 ? (

              <div className="p-8 text-center">

                <p className="text-sm text-gray-400">
                  No vendor resources found.
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
                                  resource.status || ""
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

    </div>
  );
}

export default VendorDetails;