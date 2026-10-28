
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const LEADS_TABLE = "leads";
const COMPANIES_TABLE = "companies";

function AddLead() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [leadId, setLeadId] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [leadSource, setLeadSource] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const generateCompanyId = (name) => {
    const clean = String(name || "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();

    const prefix = clean.substring(0, 3) || "COM";

    return `${prefix}${Date.now().toString().slice(-6)}`;
  };

  const handleAddLead = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    let newCompany = null;

    try {
      const companyNameValue = companyName.trim();
      const leadIdValue = leadId.trim();
      const managerValue = accountManager.trim();
      const sourceValue = leadSource.trim();

      if (!companyNameValue) {
        throw new Error("Company name is required.");
      }

      if (!leadIdValue) {
        throw new Error("Lead ID is required.");
      }

      if (!managerValue) {
        throw new Error("Account manager is required.");
      }

      // Check whether the Lead ID already exists.
      const {
        data: existingLead,
        error: duplicateError,
      } = await supabase
        .from(LEADS_TABLE)
        .select("id, lead_id")
        .eq("lead_id", leadIdValue)
        .maybeSingle();

      if (duplicateError) {
        throw new Error(
          `Duplicate check failed: ${duplicateError.message}`
        );
      }

      if (existingLead) {
        throw new Error(
          `Lead ID "${leadIdValue}" already exists.`
        );
      }

      // Create the company record.
      const companyPayload = {
        company_id: generateCompanyId(companyNameValue),
        company_name: companyNameValue,
        account_manager: managerValue,
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

      // Create the lead linked to the company.
      const leadPayload = {
        company_id: newCompany.id,
        lead_id: leadIdValue,
        lead_source: sourceValue || null,
        company_type: "LEAD",
        status: "ACTIVE",
      };

      const {
        error: leadError,
      } = await supabase
        .from(LEADS_TABLE)
        .insert([leadPayload])
        .select("*")
        .single();

      if (leadError) {
        // Best-effort rollback if lead creation fails.
        const { error: rollbackError } = await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", newCompany.id);

        if (rollbackError) {
          console.error(
            "Company rollback failed:",
            rollbackError
          );
        }

        throw new Error(
          `Lead creation failed: ${leadError.message}`
        );
      }

      // Return to the lead list after successful creation.
      navigate("/leads", {
        replace: true,
        state: {
          success: "Lead created successfully in Supabase.",
        },
      });
    } catch (err) {
      console.error("Create lead error:", err);
      setError(err?.message || "Unable to create lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Top header */}
      <header className="h-16 bg-white border-b border-gray-300 flex items-center px-6">
        <button
          type="button"
          onClick={() => navigate("/leads")}
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

      <main className="max-w-5xl mx-auto p-5 md:p-8">
        {/* Page heading */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/leads")}
            className="text-sm text-gray-600 hover:text-black mb-4"
          >
            ← Back to Leads
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Add New Lead
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Enter company information to create a new lead.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              Lead Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleAddLead} className="p-6">
            {error && (
              <div
                role="alert"
                className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>

            {/* Default record information */}
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-2 mb-6">
              <p className="text-sm font-semibold text-blue-800">
                Default Lead Settings
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-blue-600">
                    Company Status
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    ACTIVE
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-600">
                    Lead Type
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    LEAD
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-600">
                    Lead Status
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    ACTIVE
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-600">
                    Database
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    Supabase
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/leads")}
                disabled={saving}
                className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black disabled:bg-gray-100"
      />
    </div>
  );
}

export default AddLead;
