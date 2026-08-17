import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const LEADS_TABLE = "leads";
const COMPANIES_TABLE = "companies";

function Leads() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [leadId, setLeadId] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [leadSource, setLeadSource] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // =========================================================
  // FETCH DATA FROM NEW SUPABASE DATABASE
  // =========================================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [leadResult, companyResult] = await Promise.all([
        supabase
          .from(LEADS_TABLE)
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(COMPANIES_TABLE)
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (leadResult.error) {
        throw new Error(
          `Leads fetch failed: ${leadResult.error.message}`
        );
      }

      if (companyResult.error) {
        throw new Error(
          `Companies fetch failed: ${companyResult.error.message}`
        );
      }

      const realLeads = Array.isArray(leadResult.data)
        ? leadResult.data
        : [];

      const realCompanies = Array.isArray(companyResult.data)
        ? companyResult.data
        : [];

      console.log("NEW DATABASE - LEADS:", realLeads);
      console.log("NEW DATABASE - COMPANIES:", realCompanies);

      setLeads(realLeads);
      setCompanies(realCompanies);
    } catch (err) {
      console.error("Supabase fetch error:", err);

      setError(
        err?.message ||
          "Unable to fetch data from Supabase."
      );

      setLeads([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL FETCH
  // =========================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================================
  // COMPANY MAP
  // =========================================================

  const companyMap = useMemo(() => {
    const map = {};

    companies.forEach((company) => {
      if (
        company?.id !== null &&
        company?.id !== undefined
      ) {
        map[String(company.id)] = company;
      }
    });

    return map;
  }, [companies]);

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const statusOptions = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead) => lead?.status)
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ""
          )
          .map((value) => String(value))
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const typeOptions = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead) => lead?.company_type)
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ""
          )
          .map((value) => String(value))
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const sourceOptions = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead) => lead?.lead_source)
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ""
          )
          .map((value) => String(value))
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [leads]);

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredLeads = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const company =
        companyMap[String(lead?.company_id)] || null;

      const searchableValues = [
        // LEADS
        lead?.id,
        lead?.company_id,
        lead?.lead_id,
        lead?.lead_source,
        lead?.company_type,
        lead?.status,
        lead?.created_at,
        lead?.updated_at,

        // COMPANIES
        company?.id,
        company?.company_id,
        company?.company_name,
        company?.country,
        company?.email,
        company?.contact_person,
        company?.phone,
        company?.account_manager,
        company?.status,
        company?.company_description,
        company?.created_at,
        company?.updated_at,
      ];

      const matchesSearch =
        !searchValue ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchValue)
        );

      const matchesStatus =
        !statusFilter ||
        String(lead?.status ?? "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesType =
        !typeFilter ||
        String(lead?.company_type ?? "").toLowerCase() ===
          typeFilter.toLowerCase();

      const matchesSource =
        !sourceFilter ||
        String(lead?.lead_source ?? "").toLowerCase() ===
          sourceFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesSource
      );
    });
  }, [
    leads,
    companyMap,
    search,
    statusFilter,
    typeFilter,
    sourceFilter,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalLeads = leads.length;

  const activeCount = leads.filter(
    (lead) =>
      String(lead?.status ?? "").toUpperCase() ===
      "ACTIVE"
  ).length;

  const pendingCount = leads.filter(
    (lead) =>
      String(lead?.status ?? "").toUpperCase() ===
      "PENDING"
  ).length;

  const convertedCount = leads.filter((lead) =>
    ["CUSTOMER", "VENDOR"].includes(
      String(
        lead?.company_type ?? ""
      ).toUpperCase()
    )
  ).length;

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setCompanyName("");
    setLeadId("");
    setAccountManager("");
    setLeadSource("");
  };

  // =========================================================
  // OPEN MODAL
  // =========================================================

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
    setError("");
  };

  // =========================================================
  // GENERATE COMPANY ID
  // =========================================================

  const generateCompanyId = (name) => {
    const clean = String(name || "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();

    const prefix =
      clean.substring(0, 3) || "COM";

    return `${prefix}${Date.now()
      .toString()
      .slice(-6)}`;
  };

  // =========================================================
  // CREATE LEAD
  // =========================================================

  const handleAddLead = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    let newCompany = null;

    try {
      const companyNameValue =
        companyName.trim();

      const leadIdValue =
        leadId.trim();

      const managerValue =
        accountManager.trim();

      const sourceValue =
        leadSource.trim();

      if (!companyNameValue) {
        throw new Error(
          "Company name is required."
        );
      }

      if (!leadIdValue) {
        throw new Error(
          "Lead ID is required."
        );
      }

      if (!managerValue) {
        throw new Error(
          "Account manager is required."
        );
      }

      // -------------------------------------------------------
      // CHECK DUPLICATE LEAD
      // -------------------------------------------------------

      const {
        data: existingLead,
        error: duplicateError,
      } = await supabase
        .from(LEADS_TABLE)
        .select("id, lead_id")
        .eq("lead_id", leadIdValue)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (existingLead) {
        throw new Error(
          `Lead ID "${leadIdValue}" already exists.`
        );
      }

      // -------------------------------------------------------
      // CREATE COMPANY
      // -------------------------------------------------------

      const companyPayload = {
        company_id:
          generateCompanyId(
            companyNameValue
          ),

        company_name:
          companyNameValue,

        account_manager:
          managerValue,

        status: "ACTIVE",
      };

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .insert([companyPayload])
        .select("*")
        .single();

      if (companyError) {
        throw new Error(
          `Company creation failed: ${companyError.message}`
        );
      }

      newCompany = companyData;

      console.log(
        "NEW DATABASE - CREATED COMPANY:",
        newCompany
      );

      // -------------------------------------------------------
      // CREATE LEAD
      // -------------------------------------------------------

      const leadPayload = {
        company_id:
          newCompany.id,

        lead_id:
          leadIdValue,

        lead_source:
          sourceValue || null,

        company_type:
          "LEAD",

        status:
          "ACTIVE",
      };

      const {
        data: newLead,
        error: leadError,
      } = await supabase
        .from(LEADS_TABLE)
        .insert([leadPayload])
        .select("*")
        .single();

      if (leadError) {
        // Rollback company
        await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq(
            "id",
            newCompany.id
          );

        throw new Error(
          `Lead creation failed: ${leadError.message}`
        );
      }

      console.log(
        "NEW DATABASE - CREATED LEAD:",
        newLead
      );

      setSuccess(
        "Lead created successfully in Supabase."
      );

      setShowModal(false);
      resetForm();

      await fetchData();
    } catch (err) {
      console.error(
        "Create lead error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create lead."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // OPEN DETAILS
  // =========================================================

  const openLeadDetails = (lead) => {
    if (!lead?.id) return;

    navigate(
      `/leads/${encodeURIComponent(
        String(lead.id)
      )}`
    );
  };

  // =========================================================
  // STATUS TEXT STYLE
  // =========================================================

  const getStatusTextStyle = (status) => {
    switch (
      String(status || "").toUpperCase()
    ) {
      case "ACTIVE":
        return "text-green-600";

      case "PENDING":
        return "text-yellow-600";

      case "CONVERTED":
        return "text-blue-600";

      case "CLOSED":
        return "text-red-600";

      case "INACTIVE":
        return "text-gray-500";

      default:
        return "text-gray-500";
    }
  };

  // =========================================================
  // TYPE TEXT STYLE
  // =========================================================

  const getTypeTextStyle = (type) => {
    switch (
      String(type || "").toUpperCase()
    ) {
      case "CUSTOMER":
        return "text-green-600";

      case "VENDOR":
        return "text-purple-600";

      case "LEAD":
        return "text-blue-600";

      default:
        return "text-gray-500";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="h-16 bg-white border-b border-gray-300 flex items-center px-6">

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
          className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100"
        >
          ←
        </button>

        <div className="ml-4">

          <h1 className="text-base font-semibold text-gray-900">
            CloudCRM
          </h1>

          <p className="text-xs text-gray-500">
            Lead Management
          </p>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="p-6">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              Leads
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage actual lead records from Supabase.
            </p>

          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800"
          >
            + Add Lead
          </button>

        </div>

        {/* ALERTS */}

        {error && !showModal && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <SummaryCard
            label="Total Leads"
            value={totalLeads}
          />

          <SummaryCard
            label="Active"
            value={activeCount}
          />

          <SummaryCard
            label="Pending"
            value={pendingCount}
          />

          <SummaryCard
            label="Converted"
            value={convertedCount}
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="bg-white border border-gray-300 rounded-md mb-4 p-3">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search database..."
              className="h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                All Status
              </option>

              {statusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                All Types
              </option>

              {typeOptions.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}

            </select>

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                All Sources
              </option>

              {sourceOptions.map(
                (source) => (
                  <option
                    key={source}
                    value={source}
                  >
                    {source}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead className="bg-gray-50 border-b border-gray-200">

                <tr>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Lead ID
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Manager
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Source
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* LOADING */}

                {loading && (
                  <tr>

                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center"
                    >

                      <div className="w-7 h-7 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />

                      <p className="text-sm text-gray-500">
                        Loading actual Supabase data...
                      </p>

                    </td>

                  </tr>
                )}

                {/* EMPTY */}

                {!loading &&
                  filteredLeads.length === 0 && (
                    <tr>

                      <td
                        colSpan="7"
                        className="px-5 py-10 text-center"
                      >

                        <p className="text-sm font-medium text-gray-700">
                          No leads found
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {leads.length === 0
                            ? "No lead records were returned by Supabase."
                            : "No records match the selected filters."}
                        </p>

                      </td>

                    </tr>
                  )}

                {/* DATA */}

                {!loading &&
                  filteredLeads.map(
                    (lead) => {

                      const company =
                        companyMap[
                          String(
                            lead?.company_id
                          )
                        ] || null;

                      const type =
                        lead?.company_type ||
                        "—";

                      const status =
                        lead?.status ||
                        "—";

                      return (
                        <tr
                          key={lead.id}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                        >

                          {/* LEAD ID */}

                          <td className="px-5 py-3">

                            <span className="font-medium text-sm text-gray-900">
                              {lead?.lead_id ||
                                "—"}
                            </span>

                            <p className="text-[10px] text-gray-400 mt-0.5">
                              DB ID:{" "}
                              {lead?.id}
                            </p>

                          </td>

                          {/* COMPANY */}

                          <td className="px-5 py-3">

                            <p className="font-semibold text-sm text-gray-900">
                              {company?.company_name ||
                                "—"}
                            </p>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {company?.company_id ||
                                "—"}
                            </p>

                          </td>

                          {/* ACCOUNT MANAGER */}

                          <td className="px-5 py-3">

                            <span className="text-sm text-gray-700">
                              {company?.account_manager ||
                                "—"}
                            </span>

                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-3">

                            <span
                              className={`text-xs font-semibold ${getTypeTextStyle(
                                type
                              )}`}
                            >
                              {type}
                            </span>

                          </td>

                          {/* SOURCE */}

                          <td className="px-5 py-3">

                            <span className="text-sm text-gray-700">
                              {lead?.lead_source ||
                                "—"}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-3">

                            <span
                              className={`text-xs font-semibold ${getStatusTextStyle(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                          </td>

                          {/* OPEN */}

                          <td className="px-5 py-3">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  openLeadDetails(
                                    lead
                                  )
                                }
                                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
                              >
                                Open
                                <span>
                                  →
                                </span>
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

      {/* =====================================================
          ADD LEAD MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl">

            {/* MODAL HEADER */}

            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Add New Lead
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Creates a company and lead record directly in Supabase.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleAddLead}
              className="p-6"
            >

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <FormInput
                label="Company Name"
                value={companyName}
                onChange={setCompanyName}
                placeholder="Enter company name"
                disabled={saving}
                required
              />

              <FormInput
                label="Lead ID"
                value={leadId}
                onChange={setLeadId}
                placeholder="Example: TGW1001"
                disabled={saving}
                required
              />

              <FormInput
                label="Account Manager"
                value={accountManager}
                onChange={setAccountManager}
                placeholder="Enter account manager"
                disabled={saving}
                required
              />

              <FormInput
                label="Lead Source"
                value={leadSource}
                onChange={setLeadSource}
                placeholder="Website, Referral, LinkedIn..."
                disabled={saving}
              />

              <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mb-6">

                <p className="text-xs font-semibold text-blue-700">
                  New records start as LEAD
                </p>

                <p className="text-xs text-blue-600 mt-1">
                  The LEAD type is stored in the leads.company_type column.
                </p>

              </div>

              <div className="flex justify-end gap-3 pt-5 border-t">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-black text-white rounded-md text-sm font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Lead"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

// =============================================================
// FORM INPUT
// =============================================================

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
}) {
  return (
    <div className="mb-5">

      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
      />

    </div>
  );
}

// =============================================================
// SUMMARY CARD
// =============================================================

function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-md px-5 py-4">

      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-1">
        {value}
      </p>

    </div>
  );
}

export default Leads;