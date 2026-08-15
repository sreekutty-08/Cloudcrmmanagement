import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { supabase } from "../../supabaseClient";

const LEADS_TABLE = "leads";
const COMPANIES_TABLE = "companies";

function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // FETCH LEAD + COMPANY
  // =========================================================

  const fetchLead = useCallback(async () => {
    if (!leadId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // -------------------------------------------------------
      // 1. FETCH LEAD
      // -------------------------------------------------------

      const {
        data: leadData,
        error: leadError,
      } = await supabase
        .from(LEADS_TABLE)
        .select("*")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError) {
        throw leadError;
      }

      if (!leadData) {
        setLead(null);
        setCompany(null);
        return;
      }

      console.log(
        "REAL SUPABASE LEAD:",
        leadData
      );

      setLead(leadData);

      // -------------------------------------------------------
      // 2. FETCH RELATED COMPANY
      // -------------------------------------------------------

      if (
        leadData.company_id !== null &&
        leadData.company_id !== undefined
      ) {
        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .select("*")
          .eq(
            "id",
            leadData.company_id
          )
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        console.log(
          "REAL SUPABASE COMPANY:",
          companyData
        );

        setCompany(
          companyData || null
        );
      } else {
        setCompany(null);
      }
    } catch (err) {
      console.error(
        "Lead details fetch error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load lead details."
      );
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  // =========================================================
  // STYLES
  // =========================================================

  const getTypeStyle = (type) => {
    switch (
      String(type || "")
        .toUpperCase()
    ) {
      case "CUSTOMER":
        return "bg-green-100 text-green-700 border-green-200";

      case "VENDOR":
        return "bg-purple-100 text-purple-700 border-purple-200";

      case "LEAD":
        return "bg-blue-100 text-blue-700 border-blue-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusStyle = (status) => {
    switch (
      String(status || "")
        .toUpperCase()
    ) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "CONVERTED":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "CLOSED":
        return "bg-red-100 text-red-700 border-red-200";

      case "INACTIVE":
        return "bg-gray-100 text-gray-700 border-gray-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // =========================================================
  // CONVERT LEAD
  // =========================================================

  const convertLead = async (
    conversionType
  ) => {
    if (!lead) {
      return;
    }

    const target =
      conversionType === "CUSTOMER"
        ? "Customer"
        : "Vendor";

    const confirmed =
      window.confirm(
        `Convert this lead to ${target}?`
      );

    if (!confirmed) {
      return;
    }

    setConverting(true);
    setError("");
    setSuccess("");

    try {
      // -------------------------------------------------------
      // 1. UPDATE LEAD
      //
      // company_type EXISTS IN LEADS
      // -------------------------------------------------------

      const {
        data: updatedLead,
        error: leadUpdateError,
      } = await supabase
        .from(LEADS_TABLE)
        .update({
          company_type:
            conversionType,

          status: "CONVERTED",

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", lead.id)
        .select("*")
        .single();

      if (leadUpdateError) {
        throw leadUpdateError;
      }

      // -------------------------------------------------------
      // 2. UPDATE COMPANY
      //
      // companies DOES NOT HAVE company_type
      // -------------------------------------------------------

      if (
        lead.company_id !== null &&
        lead.company_id !== undefined
      ) {
        const {
          data: updatedCompany,
          error: companyUpdateError,
        } = await supabase
          .from(COMPANIES_TABLE)
          .update({
            status: "ACTIVE",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            lead.company_id
          )
          .select("*")
          .single();

        if (companyUpdateError) {
          throw new Error(
            `Lead converted, but company update failed: ${companyUpdateError.message}`
          );
        }

        console.log(
          "REAL UPDATED COMPANY:",
          updatedCompany
        );

        setCompany(
          updatedCompany
        );
      }

      setLead(updatedLead);

      setSuccess(
        `Lead successfully converted to ${target}.`
      );

      // Reload actual Supabase data
      await fetchLead();
    } catch (err) {
      console.error(
        "Lead conversion error:",
        err
      );

      setError(
        err?.message ||
          "Unable to convert lead."
      );
    } finally {
      setConverting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="h-16 bg-white border-b flex items-center px-6">
          <Link
            to="/leads"
            className="font-semibold text-gray-900"
          >
            ← Leads
          </Link>
        </header>

        <main className="max-w-6xl mx-auto p-8">

          <div className="bg-white border rounded-xl p-16 text-center">

            <p className="text-gray-500">
              Loading actual Supabase data...
            </p>

          </div>

        </main>

      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="h-16 bg-white border-b flex items-center px-6">

          <Link
            to="/leads"
            className="font-semibold text-gray-900"
          >
            ← Leads
          </Link>

        </header>

        <main className="max-w-6xl mx-auto p-8">

          <div className="bg-white border rounded-xl p-16 text-center">

            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold">
              !
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mt-5">
              Lead Not Found
            </h1>

            <p className="text-gray-500 mt-2">
              Supabase returned no lead for:
            </p>

            <p className="font-semibold text-gray-900 mt-2 break-all">
              {leadId}
            </p>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <Link
              to="/leads"
              className="inline-flex mt-6 px-5 py-3 bg-black text-white rounded-lg"
            >
              Back to Leads
            </Link>

          </div>

        </main>

      </div>
    );
  }

  // =========================================================
  // CURRENT TYPE
  // =========================================================

  const currentType =
    String(
      lead.company_type || "LEAD"
    ).toUpperCase();

  const isLead =
    currentType === "LEAD";

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="h-16 bg-white border-b sticky top-0 z-40">

        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">

          <Link
            to="/leads"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black"
          >

            <span className="text-xl">
              ←
            </span>

            Back to Leads

          </Link>

          <div className="font-semibold text-gray-900">
            CloudCRM
          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-6xl mx-auto p-6 lg:p-8">

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-5 py-4">

            <p className="font-medium">
              Error
            </p>

            <p className="text-sm mt-1 break-words">
              {error}
            </p>

          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg px-5 py-4">

            <p className="font-medium">
              Success
            </p>

            <p className="text-sm mt-1">
              {success}
            </p>

          </div>
        )}

        {/* ===================================================
            TITLE
        =================================================== */}

        <div className="mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Lead Details
              </p>

              <h1 className="text-3xl font-bold text-gray-900 mt-1">

                {lead.lead_id ||
                  `Lead #${lead.id}`}

              </h1>

              <p className="text-xs text-gray-400 mt-2">

                Database ID: {lead.id}

              </p>

            </div>

            <span
              className={`inline-flex w-fit px-4 py-2 rounded-lg border text-sm font-semibold ${getTypeStyle(
                currentType
              )}`}
            >
              {currentType}
            </span>

          </div>

        </div>

        {/* ===================================================
            CONVERSION
        =================================================== */}

        {isLead && (
          <section className="bg-white border rounded-xl shadow-sm mb-6">

            <div className="px-6 py-5 border-b">

              <h2 className="text-lg font-bold text-gray-900">
                Convert Lead
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Convert this lead into a customer or vendor.
              </p>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CUSTOMER */}

                <button
                  type="button"
                  disabled={converting}
                  onClick={() =>
                    convertLead(
                      "CUSTOMER"
                    )
                  }
                  className="border border-green-200 rounded-xl p-6 text-left hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >

                  <p className="text-xs font-semibold uppercase text-green-600">
                    Customer
                  </p>

                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    Convert to Customer
                  </h3>

                  <p className="text-sm text-gray-500 mt-2">
                    Sets leads.company_type to CUSTOMER and changes the lead status to CONVERTED.
                  </p>

                </button>

                {/* VENDOR */}

                <button
                  type="button"
                  disabled={converting}
                  onClick={() =>
                    convertLead(
                      "VENDOR"
                    )
                  }
                  className="border border-purple-200 rounded-xl p-6 text-left hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >

                  <p className="text-xs font-semibold uppercase text-purple-600">
                    Vendor
                  </p>

                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    Convert to Vendor
                  </h3>

                  <p className="text-sm text-gray-500 mt-2">
                    Sets leads.company_type to VENDOR and changes the lead status to CONVERTED.
                  </p>

                </button>

              </div>

              {converting && (
                <p className="text-center text-sm text-gray-500 mt-5">
                  Updating Supabase...
                </p>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            LEAD INFORMATION
        =================================================== */}

        <section className="bg-white border rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b">

            <h2 className="text-lg font-bold text-gray-900">
              Lead Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Information stored in the leads table.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-gray-200 rounded-lg overflow-hidden">

              <InfoCell
                label="Lead ID"
                value={lead.lead_id}
              />

              <InfoCell
                label="Database ID"
                value={lead.id}
              />

              <InfoCell
                label="Company Database ID"
                value={lead.company_id}
              />

              <InfoCell
                label="Lead Source"
                value={lead.lead_source}
              />

              <InfoCell
                label="Lead Type"
                value={currentType}
                badge
                badgeClass={getTypeStyle(
                  currentType
                )}
              />

              <InfoCell
                label="Status"
                value={lead.status}
                badge
                badgeClass={getStatusStyle(
                  lead.status
                )}
              />

              <InfoCell
                label="Created At"
                value={formatDate(
                  lead.created_at
                )}
              />

              <InfoCell
                label="Updated At"
                value={formatDate(
                  lead.updated_at
                )}
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            COMPANY INFORMATION
        =================================================== */}

        <section className="bg-white border rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b">

            <h2 className="text-lg font-bold text-gray-900">
              Company Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Company information linked through leads.company_id.
            </p>

          </div>

          <div className="p-6">

            {company ? (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-gray-200 rounded-lg overflow-hidden">

                <InfoCell
                  label="Company Database ID"
                  value={company.id}
                />

                <InfoCell
                  label="Company ID"
                  value={company.company_id}
                />

                <InfoCell
                  label="Company Name"
                  value={company.company_name}
                />

                <InfoCell
                  label="Account Manager"
                  value={company.account_manager}
                />

                <InfoCell
                  label="Status"
                  value={company.status}
                  badge
                  badgeClass={getStatusStyle(
                    company.status
                  )}
                />

                <InfoCell
                  label="Country"
                  value={company.country}
                />

                <InfoCell
                  label="Website"
                  value={company.website}
                />

                <InfoCell
                  label="Email"
                  value={company.email}
                />

                <InfoCell
                  label="Phone"
                  value={company.phone}
                />

                <InfoCell
                  label="Contact Person"
                  value={company.contact_person}
                />

                <InfoCell
                  label="Description"
                  value={
                    company.company_description
                  }
                />

                <InfoCell
                  label="Created At"
                  value={formatDate(
                    company.created_at
                  )}
                />

                <InfoCell
                  label="Updated At"
                  value={formatDate(
                    company.updated_at
                  )}
                />

              </div>

            ) : (

              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-5">

                <p className="font-semibold text-yellow-800">
                  Company record not found
                </p>

                <p className="text-sm text-yellow-700 mt-1">
                  Lead company_id:{" "}
                  {lead.company_id || "NULL"}
                </p>

                <p className="text-xs text-yellow-600 mt-2">
                  The lead exists, but no matching record was found in the companies table.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* ===================================================
            CONVERTED STATUS
        =================================================== */}

        {!isLead && (
          <section className="bg-white border rounded-xl shadow-sm mb-6">

            <div className="p-6">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  ✓
                </div>

                <div>

                  <h2 className="font-bold text-gray-900">
                    Lead Converted
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">

                    This lead is now a{" "}

                    <strong>
                      {currentType}
                    </strong>
                    .

                  </p>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            DATABASE INFORMATION
        =================================================== */}

        <section className="bg-white border rounded-xl shadow-sm mb-6">

          <div className="px-6 py-5 border-b">

            <h2 className="text-lg font-bold text-gray-900">
              Database Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Raw relationship information used by CloudCRM.
            </p>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="border border-gray-200 rounded-lg p-4">

                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">
                  Lead Table
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {LEADS_TABLE}
                </p>

              </div>

              <div className="border border-gray-200 rounded-lg p-4">

                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">
                  Company Table
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {COMPANIES_TABLE}
                </p>

              </div>

              <div className="border border-gray-200 rounded-lg p-4">

                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">
                  Lead Database ID
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-2 break-all">
                  {lead.id}
                </p>

              </div>

              <div className="border border-gray-200 rounded-lg p-4">

                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">
                  Related Company Database ID
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-2 break-all">
                  {lead.company_id || "NULL"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            BACK BUTTON
        =================================================== */}

        <div className="pb-8">

          <button
            type="button"
            onClick={() =>
              navigate("/leads")
            }
            className="px-5 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Leads
          </button>

        </div>

      </main>

    </div>
  );
}

// =============================================================
// INFO CELL
// =============================================================

function InfoCell({
  label,
  value,
  badge = false,
  badgeClass = "",
}) {
  const displayValue =
    value !== null &&
    value !== undefined &&
    value !== ""
      ? String(value)
      : "—";

  return (
    <div className="border-b border-r border-gray-200 px-5 py-5 min-h-[85px]">

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-2">

        {badge &&
        displayValue !== "—" ? (

          <span
            className={`inline-flex px-3 py-1 rounded-md border text-xs font-semibold ${badgeClass}`}
          >
            {displayValue}
          </span>

        ) : (

          <p
            className={`text-sm ${
              displayValue === "—"
                ? "text-gray-300"
                : "font-semibold text-gray-900"
            }`}
          >
            {displayValue}
          </p>

        )}

      </div>

    </div>
  );
}

// =============================================================
// DATE FORMAT
// =============================================================

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

export default LeadDetails;