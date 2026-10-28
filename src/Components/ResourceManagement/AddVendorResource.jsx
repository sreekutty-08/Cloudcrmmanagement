import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const RESOURCE_TABLE = "vendor_resources";
const VENDOR_TABLE = "vendors";
const COMPANY_TABLE = "companies";
const QUALITY_TABLE = "quality_descriptions";

const emptyVendor = {
  vendorId: "",
  vendorDbId: null,
  company: "",
  accountManager: "",
  buyingRate: "",
  starRating: 0,
  ports: "",
  credit: "",
  billingCycle: "",
  routeType: "",
  qualityDescriptionId: null,
  qualityDescription: "",
  qualityCountry: "",
  supportQuality: "GOOD",
  status: "ACTIVE",
};

const inputClass =
  "w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none focus:border-gray-500";

const selectClass =
  "w-full h-10 border border-gray-300 rounded-md px-3 text-sm bg-white outline-none focus:border-gray-500";

function AddVendorResource() {
  const navigate = useNavigate();

  const [newVendor, setNewVendor] = useState({ ...emptyVendor });
  const [qualityDescriptions, setQualityDescriptions] = useState([]);
  const [qualityMode, setQualityMode] = useState("SELECT");

  const [vendorLookupLoading, setVendorLookupLoading] = useState(false);
  const [vendorLookupMessage, setVendorLookupMessage] = useState("");

  const [loadingQuality, setLoadingQuality] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQualityDescriptions = async () => {
      try {
        setLoadingQuality(true);

        const { data, error: qualityError } = await supabase
          .from(QUALITY_TABLE)
          .select("id, description, country, status")
          .order("id", { ascending: true });

        if (qualityError) throw qualityError;

        setQualityDescriptions(data || []);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Unable to load quality descriptions."
        );
      } finally {
        setLoadingQuality(false);
      }
    };

    fetchQualityDescriptions();
  }, []);

  const updateField = (field, value) => {
    setNewVendor((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleVendorIdLookup = async (value) => {
    setNewVendor((previous) => ({
      ...previous,
      vendorId: value,
      vendorDbId: null,
      company: "",
      accountManager: "",
    }));

    setVendorLookupMessage("");

    if (!value.trim()) return;

    try {
      setVendorLookupLoading(true);

      const { data: vendor, error: vendorError } = await supabase
        .from(VENDOR_TABLE)
        .select(`
          id,
          company_id,
          vendor_id,
          company_name,
          account_manager
        `)
        .eq("vendor_id", value.trim())
        .maybeSingle();

      if (vendorError) {
        setVendorLookupMessage(vendorError.message);
        return;
      }

      if (!vendor) {
        setVendorLookupMessage("Vendor ID not found.");
        return;
      }

      let companyName = vendor.company_name || "";
      let accountManager = vendor.account_manager || "";

      if (vendor.company_id) {
        const { data: company, error: companyError } =
          await supabase
            .from(COMPANY_TABLE)
            .select("id, company_name, account_manager")
            .eq("id", vendor.company_id)
            .maybeSingle();

        if (companyError) {
          console.error(companyError);
        }

        if (company) {
          companyName = company.company_name || companyName;
          accountManager =
            company.account_manager || accountManager;
        }
      }

      setNewVendor((previous) => ({
        ...previous,
        vendorId: vendor.vendor_id || value.trim(),
        vendorDbId: vendor.id,
        company: companyName,
        accountManager,
      }));

      setVendorLookupMessage(
        companyName
          ? "Vendor details loaded successfully."
          : "Vendor found, but company information is empty."
      );
    } catch (err) {
      console.error(err);
      setVendorLookupMessage("Unable to fetch vendor details.");
    } finally {
      setVendorLookupLoading(false);
    }
  };

  const handleQualityDescriptionChange = (value) => {
    if (value === "MANUAL") {
      setQualityMode("MANUAL");

      setNewVendor((previous) => ({
        ...previous,
        qualityDescriptionId: null,
        qualityDescription: "",
        qualityCountry: "",
      }));

      return;
    }

    if (!value) {
      setQualityMode("SELECT");

      setNewVendor((previous) => ({
        ...previous,
        qualityDescriptionId: null,
        qualityDescription: "",
        qualityCountry: "",
      }));

      return;
    }

    const selected = qualityDescriptions.find(
      (item) => String(item.id) === String(value)
    );

    if (!selected) return;

    setQualityMode("SELECT");

    setNewVendor((previous) => ({
      ...previous,
      qualityDescriptionId: selected.id,
      qualityDescription: selected.description || "",
      qualityCountry: selected.country || "",
    }));
  };

  const createQualityDescriptionIfNeeded = async () => {
    if (newVendor.qualityDescriptionId) {
      return newVendor.qualityDescriptionId;
    }

    if (!newVendor.qualityDescription.trim()) {
      return null;
    }

    const { data: existing, error: lookupError } = await supabase
      .from(QUALITY_TABLE)
      .select("id, description, country")
      .ilike(
        "description",
        newVendor.qualityDescription.trim()
      )
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from(QUALITY_TABLE)
      .insert([
        {
          description: newVendor.qualityDescription.trim(),
          country: newVendor.qualityCountry.trim() || null,
          status: "ACTIVE",
        },
      ])
      .select()
      .single();

    if (createError) {
      throw new Error(
        `Quality Description: ${createError.message}`
      );
    }

    return created.id;
  };

  const handleAddVendor = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!newVendor.vendorId.trim()) {
        setError("Please enter a Vendor ID.");
        return;
      }

      if (!newVendor.vendorDbId) {
        setError(
          "Please enter a valid Vendor ID and wait for the company details to load."
        );
        return;
      }

      if (!newVendor.company.trim()) {
        setError(
          "Company could not be found from the selected Vendor ID."
        );
        return;
      }

      let qualityDescriptionId = null;

      if (newVendor.qualityDescription.trim()) {
        qualityDescriptionId =
          await createQualityDescriptionIfNeeded();
      }

      const resourceToInsert = {
        vendor_id: Number(newVendor.vendorDbId),
        buying_rate:
          newVendor.buyingRate === ""
            ? null
            : Number(newVendor.buyingRate),
        star_rating: Number(newVendor.starRating || 0),
        ports:
          newVendor.ports === ""
            ? null
            : Number(newVendor.ports),
        credit:
          newVendor.credit === ""
            ? null
            : Number(newVendor.credit),
        support_quality: newVendor.supportQuality || "GOOD",
        quality_description_id: qualityDescriptionId,
        route_type: newVendor.routeType.trim() || null,
        billing_cycle: newVendor.billingCycle.trim() || null,
        status: newVendor.status || "ACTIVE",
      };

      const { error: insertError } = await supabase
        .from(RESOURCE_TABLE)
        .insert([resourceToInsert])
        .select()
        .single();

      if (insertError) throw insertError;

      navigate("/resource-management/vendors", {
        state: {
          success: "Vendor resource added successfully.",
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to add vendor resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-[#f5f6f8] text-gray-900">
      {/* TOP NAVIGATION */}
      <div className="bg-white border-b border-gray-200 px-5 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              to="/resource-management/vendors"
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white"
            >
              Vendor Resources
            </Link>

            <Link
              to="/resource-management/clients"
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Client Resources
            </Link>
          </div>

          <Link
            to="/resource-management/vendors"
            className="h-9 px-4 flex items-center border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            ← Back to Vendor Resources
          </Link>
        </div>
      </div>

      <div className="px-5 py-5">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">
              Add Vendor Resource
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter a Vendor ID to automatically load company information.
            </p>
          </div>

          <form onSubmit={handleAddVendor} className="p-5">
            {/* VENDOR ID */}
            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-1.5">
                Vendor ID
              </label>

              <input
                required
                value={newVendor.vendorId}
                onChange={(event) =>
                  handleVendorIdLookup(event.target.value)
                }
                className={inputClass}
                placeholder="Enter Vendor ID"
              />

              {vendorLookupLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  Fetching vendor details...
                </p>
              )}

              {!vendorLookupLoading && vendorLookupMessage && (
                <p
                  className={`text-xs mt-1 ${
                    vendorLookupMessage.includes("successfully")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {vendorLookupMessage}
                </p>
              )}
            </div>

            {/* COMPANY DETAILS */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5">
              <h3 className="text-sm font-medium mb-3">
                Company Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company">
                  <input
                    value={newVendor.company}
                    readOnly
                    className={`${inputClass} bg-gray-100`}
                    placeholder="Automatically fetched"
                  />
                </FormField>

                <FormField label="Account Manager">
                  <input
                    value={newVendor.accountManager}
                    readOnly
                    className={`${inputClass} bg-gray-100`}
                    placeholder="Automatically fetched"
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Buying Rate">
                <input
                  required
                  type="number"
                  step="0.0001"
                  value={newVendor.buyingRate}
                  onChange={(event) =>
                    updateField("buyingRate", event.target.value)
                  }
                  className={inputClass}
                  placeholder="0.0125"
                />
              </FormField>

              {/* STAR RATING */}
              <FormField label="Star Rating">
                <div className="h-10 flex items-center gap-2">
                  <div
                    className="flex items-center gap-1"
                    role="radiogroup"
                    aria-label="Star rating"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateField("starRating", star)}
                        className={`text-2xl leading-none ${
                          star <= Number(newVendor.starRating || 0)
                            ? "text-amber-500"
                            : "text-gray-300"
                        }`}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        aria-pressed={
                          Number(newVendor.starRating || 0) === star
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <span className="text-sm text-gray-500">
                    {Number(newVendor.starRating || 0)}/5
                  </span>
                </div>
              </FormField>

              <FormField label="Ports">
                <input
                  required
                  type="number"
                  value={newVendor.ports}
                  onChange={(event) =>
                    updateField("ports", event.target.value)
                  }
                  className={inputClass}
                  placeholder="40"
                />
              </FormField>

              <FormField label="Credit">
                <input
                  type="number"
                  step="0.01"
                  value={newVendor.credit}
                  onChange={(event) =>
                    updateField("credit", event.target.value)
                  }
                  className={inputClass}
                  placeholder="300"
                />
              </FormField>

              <FormField label="Billing Cycle">
                <input
                  value={newVendor.billingCycle}
                  onChange={(event) =>
                    updateField("billingCycle", event.target.value)
                  }
                  className={inputClass}
                  placeholder="30 Days"
                />
              </FormField>

              <FormField label="Route Type">
                <input
                  value={newVendor.routeType}
                  onChange={(event) =>
                    updateField("routeType", event.target.value)
                  }
                  className={inputClass}
                  placeholder="CLI"
                />
              </FormField>

              <FormField label="Quality Description">
                <select
                  value={
                    qualityMode === "MANUAL"
                      ? "MANUAL"
                      : newVendor.qualityDescriptionId || ""
                  }
                  onChange={(event) =>
                    handleQualityDescriptionChange(event.target.value)
                  }
                  className={selectClass}
                  disabled={loadingQuality}
                >
                  <option value="">
                    {loadingQuality
                      ? "Loading quality descriptions..."
                      : "Select Quality Description"}
                  </option>

                  {qualityDescriptions
                    .filter((item) => item.status !== "INACTIVE")
                    .map((quality) => (
                      <option key={quality.id} value={quality.id}>
                        {quality.description}
                      </option>
                    ))}

                  <option value="MANUAL">
                    Not available — Enter manually
                  </option>
                </select>
              </FormField>

              {qualityMode === "MANUAL" && (
                <FormField label="Enter Quality Description">
                  <input
                    required
                    value={newVendor.qualityDescription}
                    onChange={(event) =>
                      updateField(
                        "qualityDescription",
                        event.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="Type quality description manually"
                  />
                </FormField>
              )}

              <FormField label="Quality Country">
                <input
                  value={newVendor.qualityCountry}
                  onChange={(event) =>
                    updateField("qualityCountry", event.target.value)
                  }
                  className={
                    qualityMode === "SELECT"
                      ? `${inputClass} bg-gray-100`
                      : inputClass
                  }
                  readOnly={qualityMode === "SELECT"}
                  placeholder={
                    qualityMode === "SELECT"
                      ? "Automatically loaded from quality description"
                      : "Enter quality country"
                  }
                />
              </FormField>

              <FormField label="Support Quality">
                <select
                  value={newVendor.supportQuality}
                  onChange={(event) =>
                    updateField("supportQuality", event.target.value)
                  }
                  className={selectClass}
                >
                  <option>GOOD</option>
                  <option>MEDIUM</option>
                  <option>POOR</option>
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={newVendor.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  className={selectClass}
                >
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </FormField>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() =>
                  navigate("/resource-management/vendors")
                }
                className="h-10 px-4 border border-gray-300 rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || vendorLookupLoading}
                className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Vendor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default AddVendorResource;