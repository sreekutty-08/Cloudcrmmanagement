
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const LEADS_TABLE = "leads";
const COMPANIES_TABLE = "companies";

const STATUS_STYLES = {
  NEW: "bg-blue-50 text-blue-700",
  HOT: "bg-red-50 text-red-700",
  CURRENT: "bg-green-50 text-green-700",
  OLD: "bg-gray-100 text-gray-600",
  SPAM: "bg-orange-50 text-orange-700",
  "NOT WORKING": "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-50 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
};

function getStatusStyle(status) {
  const normalized = String(status || "NEW").toUpperCase();
  return STATUS_STYLES[normalized] || "bg-gray-100 text-gray-600";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();

  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const success = location.state?.success || "";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [leadsResult, companiesResult] = await Promise.all([
        supabase
          .from(LEADS_TABLE)
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from(COMPANIES_TABLE)
          .select("*"),
      ]);

      if (leadsResult.error) {
        throw leadsResult.error;
      }

      if (companiesResult.error) {
        throw companiesResult.error;
      }

      setLeads(leadsResult.data || []);
      setCompanies(companiesResult.data || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err.message || "Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const companyById = useMemo(() => {
    const map = new Map();

    companies.forEach((company) => {
      map.set(String(company.id), company);
    });

    return map;
  }, [companies]);

  const enrichedLeads = useMemo(() => {
    return leads.map((lead) => {
      const company = companyById.get(String(lead.company_id));

      return {
        ...lead,
        company_name:
          lead.company_name ||
          company?.company_name ||
          company?.name ||
          "—",
        account_manager:
          lead.account_manager ||
          company?.account_manager ||
          "—",
      };
    });
  }, [leads, companyById]);

  const filteredLeads = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return enrichedLeads.filter((lead) => {
      const matchesSearch =
        !searchValue ||
        [
          lead.company_name,
          lead.lead_id,
          lead.account_manager,
          lead.lead_source,
          lead.status,
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchValue)
        );

      const normalizedStatus = String(lead.status || "NEW").toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enrichedLeads, search, statusFilter]);

  const summary = useMemo(() => {
    const statuses = enrichedLeads.map((lead) =>
      String(lead.status || "NEW").toUpperCase()
    );

    return {
      total: enrichedLeads.length,
      newLeads: statuses.filter((status) => status === "NEW").length,
      hotLeads: statuses.filter((status) => status === "HOT").length,
      activeLeads: statuses.filter(
        (status) => status === "ACTIVE" || status === "CURRENT"
      ).length,
    };
  }, [enrichedLeads]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Leads
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage, track, and follow up with your business leads.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/leads/add")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Lead
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                navigate(location.pathname, {
                  replace: true,
                  state: {},
                })
              }
              className="font-medium text-green-800 hover:text-green-950"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchLeads}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Leads"
            value={loading ? "—" : summary.total}
            description="All recorded leads"
          />

          <SummaryCard
            title="New Leads"
            value={loading ? "—" : summary.newLeads}
            description="Leads marked as new"
          />

          <SummaryCard
            title="Hot Leads"
            value={loading ? "—" : summary.hotLeads}
            description="Leads requiring attention"
          />

          <SummaryCard
            title="Active Leads"
            value={loading ? "—" : summary.activeLeads}
            description="Active or current leads"
          />
        </div>

        {/* Leads table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                All Leads
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? "Loading leads..."
                  : `${filteredLeads.length} lead${
                      filteredLeads.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search leads..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Filter leads by status"
              >
                <option value="ALL">All statuses</option>
                <option value="NEW">New</option>
                <option value="HOT">Hot</option>
                <option value="CURRENT">Current</option>
                <option value="OLD">Old</option>
                <option value="SPAM">Spam</option>
                <option value="NOT WORKING">Not Working</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Lead ID
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Manager
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Lead Source
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >
                      Loading leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-medium text-gray-700">
                        No leads found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or add a new lead.
                      </p>

                      <button
                        type="button"
                        onClick={() => navigate("/leads/add")}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        + Add Lead
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {lead.company_name}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {lead.company_type || "LEAD"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {lead.lead_id || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {lead.account_manager || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {lead.lead_source || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            lead.status
                          )}`}
                        >
                          {lead.status || "NEW"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDate(lead.created_at)}
                      </td>

                      
<td className="px-5 py-4 text-right">
  <button
    type="button"
    onClick={() => navigate(`/leads/${lead.id}`)}
    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
  >
    Open
    <span aria-hidden="true">→</span>
  </button>
</td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && filteredLeads.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-5 py-3">
              <p className="text-xs text-gray-500">
                Showing {filteredLeads.length} of {leads.length} leads
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
