import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";
const RESOURCES_TABLE = "vendor_resources";
const QUALITY_DESCRIPTIONS_TABLE = "quality_descriptions";

function VendorDetails() {
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [resources, setResources] = useState([]);
  const [qualityDescriptions, setQualityDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // EDIT / DELETE STATE
  // ============================================================

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    companyName: "",
    vendorId: "",
    accountManager: "",
    country: "",
    website: "",
    contactPerson: "",
    phone: "",
    email: "",
    description: "",
    vendorStatus: "ACTIVE",
  });

  // ============================================================
  // FETCH VENDOR DETAILS
  // ============================================================

  const fetchVendorDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!vendorId) {
        throw new Error("Vendor ID was not provided.");
      }

      const decodedVendorId = decodeURIComponent(vendorId);

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
      // 4. FETCH QUALITY DESCRIPTION DETAILS
      //
      // Gets only the quality descriptions actually used by
      // this vendor's resources.
      // ========================================================

      const qualityDescriptionIds = [
        ...new Set(
          (resourceData || [])
            .map(
              (resource) =>
                resource.quality_description_id
            )
            .filter(
              (id) =>
                id !== null &&
                id !== undefined &&
                String(id).trim() !== ""
            )
            .map((id) => String(id))
        ),
      ];

      let qualityDescriptionData = [];

      if (qualityDescriptionIds.length > 0) {
        const {
          data: descriptionData,
          error: descriptionError,
        } = await supabase
          .from(QUALITY_DESCRIPTIONS_TABLE)
          .select("*")
          .in(
            "id",
            qualityDescriptionIds
          );

        if (descriptionError) {
          throw descriptionError;
        }

        qualityDescriptionData =
          descriptionData || [];
      }

      // ========================================================
      // 5. COMBINE VENDOR + COMPANY
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
      setQualityDescriptions(
        qualityDescriptionData
      );
    } catch (err) {
      console.error(
        "Failed to fetch vendor details:",
        err
      );

      setError(
        err?.message ||
          "Failed to load vendor details."
      );

      setQualityDescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchVendorDetails();
  }, [fetchVendorDetails]);

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
  // QUALITY DESCRIPTION HELPER
  // ============================================================

  const getQualityDescription = (
    qualityDescriptionId
  ) => {
    if (
      qualityDescriptionId === null ||
      qualityDescriptionId === undefined ||
      qualityDescriptionId === ""
    ) {
      return null;
    }

    return (
      qualityDescriptions.find(
        (description) =>
          String(description.id) ===
          String(qualityDescriptionId)
      ) || null
    );
  };

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const openEditModal = () => {
    if (!vendor) return;

    setEditFormData({
      companyName:
        vendor.company_name || "",

      vendorId:
        vendor.vendor_id || "",

      accountManager:
        vendor.account_manager || "",

      country:
        vendor.country || "",

      website:
        vendor.company?.website || "",

      contactPerson:
        vendor.contact_person || "",

      phone:
        vendor.phone || "",

      email:
        vendor.email || "",

      description:
        vendor.company_description || "",

      vendorStatus:
        vendor.status || "ACTIVE",
    });

    setShowEditModal(true);
  };

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
  };

  // ============================================================
  // HANDLE EDIT FORM CHANGE
  // ============================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE EDITED VENDOR
  // ============================================================

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      if (!vendor?.id) {
        throw new Error(
          "Vendor information is unavailable."
        );
      }

      if (!vendor?.company_id) {
        throw new Error(
          "Company information is unavailable."
        );
      }

      if (!editFormData.companyName.trim()) {
        throw new Error(
          "Company Name is required."
        );
      }

      if (!editFormData.vendorId.trim()) {
        throw new Error(
          "Vendor ID is required."
        );
      }

      if (!editFormData.accountManager.trim()) {
        throw new Error(
          "Account Manager is required."
        );
      }

      if (!editFormData.country.trim()) {
        throw new Error(
          "Country is required."
        );
      }

      if (!editFormData.contactPerson.trim()) {
        throw new Error(
          "Contact Person is required."
        );
      }

      if (!editFormData.phone.trim()) {
        throw new Error(
          "Phone is required."
        );
      }

      if (!editFormData.email.trim()) {
        throw new Error(
          "Email is required."
        );
      }

      // ========================================================
      // UPDATE COMPANY
      // ========================================================

      const companyPayload = {
        company_name:
          editFormData.companyName.trim(),

        country:
          editFormData.country.trim(),

        contact_person:
          editFormData.contactPerson.trim(),

        phone:
          editFormData.phone.trim(),

        email:
          editFormData.email.trim(),

        account_manager:
          editFormData.accountManager.trim(),

        company_description:
          editFormData.description.trim(),
      };

      console.log(
        "Updated Company Payload:",
        companyPayload
      );

      const {
        error: companyUpdateError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .update(companyPayload)
        .eq("id", vendor.company_id);

      if (companyUpdateError) {
        throw companyUpdateError;
      }

      // ========================================================
      // UPDATE VENDOR
      // ========================================================

      const vendorPayload = {
        vendor_id:
          editFormData.vendorId.trim(),

        status:
          editFormData.vendorStatus,
      };

      console.log(
        "Updated Vendor Payload:",
        vendorPayload
      );

      const {
        error: vendorUpdateError,
      } = await supabase
        .from(VENDORS_TABLE)
        .update(vendorPayload)
        .eq("id", vendor.id);

      if (vendorUpdateError) {
        throw vendorUpdateError;
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      setShowEditModal(false);

      await fetchVendorDetails();
    } catch (err) {
      console.error(
        "Failed to update vendor:",
        err
      );

      setError(
        err?.message ||
          "Failed to update vendor."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // OPEN DELETE MODAL
  // ============================================================

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // ============================================================
  // CLOSE DELETE MODAL
  // ============================================================

  const closeDeleteModal = () => {
    if (deleting) return;

    setShowDeleteModal(false);
  };

  // ============================================================
  // DELETE VENDOR
  // ============================================================

  const handleDeleteVendor = async () => {
    if (deleting) return;

    if (!vendor?.id) {
      setError(
        "Vendor information is unavailable."
      );

      return;
    }

    setDeleting(true);
    setError("");

    try {
      // ========================================================
      // DELETE VENDOR RESOURCES FIRST
      // ========================================================

      const {
        error: resourceDeleteError,
      } = await supabase
        .from(RESOURCES_TABLE)
        .delete()
        .eq("vendor_id", vendor.id);

      if (resourceDeleteError) {
        throw resourceDeleteError;
      }

      // ========================================================
      // DELETE VENDOR
      // ========================================================

      const {
        error: vendorDeleteError,
      } = await supabase
        .from(VENDORS_TABLE)
        .delete()
        .eq("id", vendor.id);

      if (vendorDeleteError) {
        throw vendorDeleteError;
      }

      // ========================================================
      // DELETE COMPANY
      // ========================================================

      if (vendor.company_id) {
        const {
          error: companyDeleteError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", vendor.company_id);

        if (companyDeleteError) {
          throw companyDeleteError;
        }
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      setShowDeleteModal(false);

      navigate("/vendors");
    } catch (err) {
      console.error(
        "Failed to delete vendor:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete vendor."
      );
    } finally {
      setDeleting(false);
    }
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

        {/* ====================================================
            BREADCRUMB
        ==================================================== */}

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="hover:text-gray-700"
          >
            Dashboard
          </button>

          <span>/</span>

          <button
            type="button"
            onClick={() => navigate("/vendors")}
            className="hover:text-gray-700"
          >
            Vendors
          </button>

          <span>/</span>

          <span className="text-gray-700 font-medium">
            {vendor.vendor_id}
          </span>

        </div>

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

          <div>

            <div className="flex items-center gap-3 flex-wrap">

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {vendor.company_name || "Vendor"}
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
                    ).toUpperCase() === "ACTIVE"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                />

                {vendor.status || "Unknown"}

              </span>

            </div>

            <p className="text-sm text-gray-500 mt-1">
              Vendor ID:{" "}
              <span className="font-medium text-gray-700">
                {vendor.vendor_id}
              </span>
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* EDIT BUTTON */}

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
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
                  d="M16.862 4.487l1.65-1.65a2.121 2.121 0 013 3l-1.65 1.65M16.862 4.487L7.5 13.85 6.75 17.25l3.4-.75 9.362-9.363M16.862 4.487l2.65 2.65"
                />
              </svg>

              Edit
            </button>

            {/* DELETE BUTTON */}

            <button
              type="button"
              onClick={openDeleteModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white rounded-lg text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 012-2h2a2 2 0 012 2v3m-9 0h12"
                />
              </svg>

              Delete
            </button>

            <button
              type="button"
              onClick={() => navigate("/vendors")}
              className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition"
            >
              Back to Vendors
            </button>

          </div>

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
                value={vendor.company_name}
              />

              <DetailField
                label="Vendor ID"
                value={vendor.vendor_id}
              />

              <DetailField
                label="Account Manager"
                value={vendor.account_manager}
              />

              <DetailField
                label="Country"
                value={vendor.country}
              />

              <DetailField
                label="Company Status"
                value={vendor.company_status}
              />

            </div>

            {/* ==================================================
                COMPANY DESCRIPTION
            ================================================== */}

            <div className="border-t border-gray-100 mt-7 pt-6">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                Description
              </p>

              {vendor.company_description ? (

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">

                  <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap break-words">
                    {vendor.company_description}
                  </p>

                </div>

              ) : (

                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">

                  <p className="text-sm text-gray-400">
                    No description available.
                  </p>

                </div>

              )}

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
                value={vendor.contact_person}
              />

              <DetailField
                label="Phone"
                value={vendor.phone}
              />

              <DetailField
                label="Email"
                value={vendor.email}
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

                {ipAddresses.map((ip, index) => (

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

                ))}

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
            QUALITY DESCRIPTION SHOWCASE
        ==================================================== */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">

          {/* SECTION HEADER */}

          <div className="px-6 py-5 border-b border-gray-200">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

              <div>

                <h2 className="text-base font-semibold text-gray-900">
                  Quality Description Details
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Detailed quality information associated with this
                  vendor's resources.
                </p>

              </div>

              {qualityDescriptions.length > 0 && (

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">

                  <span className="w-2 h-2 rounded-full bg-emerald-500" />

                  <span className="text-xs font-semibold text-gray-600">
                    {qualityDescriptions.length}{" "}
                    {qualityDescriptions.length === 1
                      ? "Description"
                      : "Descriptions"}
                  </span>

                </div>

              )}

            </div>

          </div>

          {/* QUALITY DESCRIPTION CONTENT */}

          <div className="p-6">

            {qualityDescriptions.length === 0 ? (

              <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center">

                <div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h4m-6 4h10a2 2 0 002-2V6a2 2 0 00-2-2h-4.586a1 1 0 01-.707-.293l-.828-.828A1 1 0 0010.172 2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>

                </div>

                <p className="text-sm font-medium text-gray-500">
                  No quality description details found.
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Quality descriptions linked to this vendor's
                  resources will appear here.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {qualityDescriptions.map(
                  (description, index) => (

                    <article
                      key={description.id}
                      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200"
                    >

                      {/* TOP ACCENT */}

                      <div className="h-1 bg-gray-900" />

                      <div className="p-6">

                        {/* DESCRIPTION HEADER */}

                        <div className="flex items-start justify-between gap-4 mb-5">

                          <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0">

                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h4m-6-8h6m5 12H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l3.828 3.828A1 1 0 0117 8.828V18a2 2 0 01-2 2z"
                                />
                              </svg>

                            </div>

                            <div>

                              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Quality Description
                              </p>

                              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                                Description #
                                {description.id || index + 1}
                              </h3>

                            </div>

                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${getStatusStyle(
                              description.status
                            )}`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                String(
                                  description.status ||
                                    ""
                                ).toUpperCase() ===
                                "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {description.status ||
                              "Unknown"}

                          </span>

                        </div>

                        {/* DESCRIPTION */}

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">

                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Description
                          </p>

                          <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap break-words">
                            {description.description ||
                              "No description available."}
                          </p>

                        </div>

                        {/* DESCRIPTION FOOTER */}

                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          <div className="flex items-center gap-2">

                            <span className="text-xs text-gray-400">
                              Description ID
                            </span>

                            <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono font-semibold text-gray-700">
                              {description.id || "-"}
                            </span>

                          </div>

                          <div className="text-xs text-gray-400">
                            Quality information
                          </div>

                        </div>

                      </div>

                    </article>

                  )
                )}

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

                  {resources.map((resource) => (

                    <tr
                      key={resource.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.buying_rate || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.ports || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.credit || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.support_quality || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">

                        <span
                          title={
                            getQualityDescription(
                              resource.quality_description_id
                            )?.description || ""
                          }
                        >
                          {resource.quality_description_id ||
                            "-"}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.route_type || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {resource.billing_cycle || "-"}
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
                              ).toUpperCase() === "ACTIVE"
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                            }`}
                          />

                          {resource.status ||
                            "Unknown"}

                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </main>

      {/* ======================================================
          EDIT VENDOR MODAL
      ====================================================== */}

      {showEditModal && (

        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden">

            {/* EDIT HEADER */}

            <div className="bg-white border-b border-gray-200 px-7 py-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Edit Vendor
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Update the vendor and company information.
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 text-2xl transition disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* EDIT FORM */}

            <form
              onSubmit={handleEditSubmit}
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
                      Update the company information associated with this vendor.
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
                          editFormData.companyName
                        }
                        onChange={handleEditChange}
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
                          editFormData.vendorId
                        }
                        onChange={handleEditChange}
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
                          editFormData.accountManager
                        }
                        onChange={handleEditChange}
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
                          editFormData.country
                        }
                        onChange={handleEditChange}
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
                          editFormData.website
                        }
                        onChange={handleEditChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                      <p className="text-[11px] text-gray-400 mt-1.5">
                        Website is currently displayed in the form only because the
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
                          editFormData.contactPerson
                        }
                        onChange={handleEditChange}
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
                          editFormData.phone
                        }
                        onChange={handleEditChange}
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
                          editFormData.email
                        }
                        onChange={handleEditChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                      />

                    </div>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="border-t border-gray-100 pt-7">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-gray-900">
                      Vendor Description
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Add or update a description for this vendor.
                    </p>

                  </div>

                  <textarea
                    name="description"
                    value={
                      editFormData.description
                    }
                    onChange={handleEditChange}
                    rows="6"
                    placeholder="Enter vendor description..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition resize-none"
                  />

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
                        editFormData.vendorStatus
                      }
                      onChange={handleEditChange}
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

                {error && (

                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

                    <p className="text-sm text-red-700">
                      {error}
                    </p>

                  </div>

                )}

              </div>

              {/* EDIT FOOTER */}

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <p className="text-xs text-gray-400">
                  Update the required information and save your changes.
                </p>

                <div className="flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeEditModal}
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
                      : "Save Changes"}

                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-4">

              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 012-2h2a2 2 0 012 2v3m-9 0h12"
                  />
                </svg>

              </div>

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Delete Vendor
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  This action cannot be undone.
                </p>

              </div>

            </div>

            <div className="p-6">

              <p className="text-sm text-gray-700 leading-6">

                Are you sure you want to delete{" "}

                <span className="font-semibold text-gray-900">
                  {vendor.company_name || "this vendor"}
                </span>

                ?

              </p>

              <p className="text-sm text-gray-500 mt-3 leading-6">
                The vendor account, associated resources, and
                linked company record will be deleted.
              </p>

              {error && (

                <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">

                  <p className="text-sm text-red-700">
                    {error}
                  </p>

                </div>

              )}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteVendor}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 min-w-[120px]"
                >

                  {deleting
                    ? "Deleting..."
                    : "Delete Vendor"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default VendorDetails;