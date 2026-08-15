import { useEffect, useMemo, useState } from "react";
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
  // FETCH ACTUAL SUPABASE DATA
  // =========================================================

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [leadResult, companyResult] =
        await Promise.all([
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

      const realLeads = Array.isArray(
        leadResult.data
      )
        ? leadResult.data
        : [];

      const realCompanies = Array.isArray(
        companyResult.data
      )
        ? companyResult.data
        : [];

      console.log(
        "REAL SUPABASE LEADS:",
        realLeads
      );

      console.log(
        "REAL SUPABASE COMPANIES:",
        realCompanies
      );

      setLeads(realLeads);
      setCompanies(realCompanies);
    } catch (err) {
      console.error(
        "Supabase fetch error:",
        err
      );

      setError(
        err?.message ||
          "Unable to fetch data from Supabase."
      );

      setLeads([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // COMPANY LOOKUP
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

  const getCompany = (lead) => {
    if (
      lead?.company_id === null ||
      lead?.company_id === undefined
    ) {
      return null;
    }

    return (
      companyMap[String(lead.company_id)] ||
      null
    );
  };

  // =========================================================
  // REAL FILTER OPTIONS FROM DATABASE
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
    ].sort((a, b) =>
      a.localeCompare(b)
    );
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
    ].sort((a, b) =>
      a.localeCompare(b)
    );
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
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [leads]);

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredLeads = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return leads.filter((lead) => {
      const company = getCompany(lead);

      const searchableValues = [
        // LEADS TABLE
        lead?.id,
        lead?.company_id,
        lead?.lead_id,
        lead?.lead_source,
        lead?.company_type,
        lead?.status,
        lead?.created_at,
        lead?.updated_at,

        // COMPANIES TABLE
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
        String(lead?.status ?? "")
          .toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesType =
        !typeFilter ||
        String(lead?.company_type ?? "")
          .toLowerCase() ===
          typeFilter.toLowerCase();

      const matchesSource =
        !sourceFilter ||
        String(lead?.lead_source ?? "")
          .toLowerCase() ===
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
    companies,
    search,
    statusFilter,
    typeFilter,
    sourceFilter,
    companyMap,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalLeads = leads.length;

  const activeCount = leads.filter(
    (lead) =>
      String(lead?.status ?? "")
        .toUpperCase() === "ACTIVE"
  ).length;

  const pendingCount = leads.filter(
    (lead) =>
      String(lead?.status ?? "")
        .toUpperCase() === "PENDING"
  ).length;

  const convertedCount = leads.filter(
    (lead) =>
      ["CUSTOMER", "VENDOR"].includes(
        String(
          lead?.company_type ?? ""
        ).toUpperCase()
      )
  ).length;

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    setCompanyName("");
    setLeadId("");
    setAccountManager("");
    setLeadSource("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
    setError("");
  };

  // =========================================================
  // COMPANY ID
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
      //
      // ONLY REAL COMPANIES COLUMNS
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
        "REAL CREATED COMPANY:",
        newCompany
      );

      // -------------------------------------------------------
      // CREATE LEAD
      //
      // company_type EXISTS HERE
      // -------------------------------------------------------

      const leadPayload = {
        company_id:
          newCompany.id,

        lead_id:
          leadIdValue,

        lead_source:
          sourceValue || null,

        company_type: "LEAD",

        status: "ACTIVE",
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
        // Roll back company
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
        "REAL CREATED LEAD:",
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
  // DELETE
  // =========================================================

  const handleDelete = async (lead) => {
    const confirmed =
      window.confirm(
        `Delete lead "${
          lead?.lead_id || lead?.id
        }"?`
      );

    if (!confirmed) return;

    setError("");

    try {
      const companyId =
        lead?.company_id;

      const {
        error: leadDeleteError,
      } = await supabase
        .from(LEADS_TABLE)
        .delete()
        .eq("id", lead.id);

      if (leadDeleteError) {
        throw leadDeleteError;
      }

      if (
        companyId !== null &&
        companyId !== undefined
      ) {
        const {
          data: otherLeads,
          error: otherLeadError,
        } = await supabase
          .from(LEADS_TABLE)
          .select("id")
          .eq(
            "company_id",
            companyId
          )
          .limit(1);

        if (otherLeadError) {
          console.error(
            "Company reference check failed:",
            otherLeadError
          );
        } else if (
          !otherLeads ||
          otherLeads.length === 0
        ) {
          const {
            error: companyDeleteError,
          } = await supabase
            .from(COMPANIES_TABLE)
            .delete()
            .eq(
              "id",
              companyId
            );

          if (companyDeleteError) {
            console.error(
              "Company delete error:",
              companyDeleteError
            );
          }
        }
      }

      await fetchData();
    } catch (err) {
      console.error(
        "Delete lead error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete lead."
      );
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
  // STYLES
  // =========================================================

  const getStatusStyle = (status) => {
    switch (
      String(status || "")
        .toUpperCase()
    ) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200";

      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      case "CONVERTED":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "CLOSED":
        return "bg-red-50 text-red-700 border-red-200";

      case "INACTIVE":
        return "bg-gray-50 text-gray-600 border-gray-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getTypeStyle = (type) => {
    switch (
      String(type || "")
        .toUpperCase()
    ) {
      case "CUSTOMER":
        return "bg-green-50 text-green-700 border-green-200";

      case "VENDOR":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "LEAD":
        return "bg-blue-50 text-blue-700 border-blue-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

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

        {/* SUMMARY */}

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

        {/* FILTERS */}

        <div className="bg-white border border-gray-300 rounded-md mb-4 p-3">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
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

        {/* TABLE */}

        <div className="bg-white border border-gray-300 rounded-md overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-[#f1f3f5] border-b-2 border-gray-400">

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Lead ID
                  </th>

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Company
                  </th>

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Account Manager
                  </th>

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Type
                  </th>

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Source
                  </th>

                  <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase text-gray-700">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-700">
                    Open
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      Loading actual Supabase data...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredLeads.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-12 text-center"
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

                {!loading &&
                  filteredLeads.map(
                    (lead, index) => {
                      const company =
                        getCompany(lead);

                      const type =
                        lead?.company_type ||
                        "—";

                      const status =
                        lead?.status ||
                        "—";

                      return (
                        <tr
                          key={lead.id}
                          className={`border-b border-gray-300 ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-[#fafafa]"
                          } hover:bg-blue-50`}
                        >

                          <td className="border-r border-gray-300 px-4 py-3">

                            <p className="font-semibold text-sm text-gray-900">
                              {lead?.lead_id ||
                                "—"}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-1">
                              DB ID:{" "}
                              {lead?.id}
                            </p>

                          </td>

                          <td className="border-r border-gray-300 px-4 py-3">

                            <p className="font-medium text-sm text-gray-900">
                              {company?.company_name ||
                                "—"}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {company?.company_id ||
                                "—"}
                            </p>

                          </td>

                          <td className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {company?.account_manager ||
                              "—"}
                          </td>

                          <td className="border-r border-gray-300 px-4 py-3">

                            <span
                              className={`inline-flex px-2.5 py-1 border rounded text-xs font-semibold ${getTypeStyle(
                                type
                              )}`}
                            >
                              {type}
                            </span>

                          </td>

                          <td className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {lead?.lead_source ||
                              "—"}
                          </td>

                          <td className="border-r border-gray-300 px-4 py-3">

                            <span
                              className={`inline-flex px-2.5 py-1 border rounded text-xs font-semibold ${getStatusStyle(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                          </td>

                          <td className="px-4 py-3 text-center">

                            <button
                              type="button"
                              onClick={() =>
                                openLeadDetails(
                                  lead
                                )
                              }
                              className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800"
                            >
                              Open
                            </button>

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