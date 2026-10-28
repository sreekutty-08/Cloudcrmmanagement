
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";

function AddVendor() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const initialFormData = {
    companyName: "",
    vendorId: "",
    accountManager: "",
    country: "",
    website: "",
    contactPerson: "",
    phone: "",
    email: "",
    ipAddresses: [""],
    description: "",
    vendorStatus: "ACTIVE",
  };

  const [formData, setFormData] = useState(initialFormData);

  const showSupabaseError = (error, fallbackMessage) => {
    console.error("Supabase Error:", error);

    setLoadError({
      message: error?.message || fallbackMessage,
      details: error?.details || "",
      hint: error?.hint || "",
      code: error?.code || "",
    });

    setShowErrorModal(true);
  };

  // HANDLE FORM CHANGE

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // HANDLE IP ADDRESS CHANGE

  const handleIpChange = (index, value) => {
    setFormData((previous) => {
      const updatedIpAddresses = [...previous.ipAddresses];
      updatedIpAddresses[index] = value;

      return {
        ...previous,
        ipAddresses: updatedIpAddresses,
      };
    });
  };

  // ADD IP ADDRESS FIELD

  const addIpAddressField = () => {
    setFormData((previous) => ({
      ...previous,
      ipAddresses: [...previous.ipAddresses, ""],
    }));
  };

  // REMOVE IP ADDRESS FIELD

  const removeIpAddressField = (index) => {
    setFormData((previous) => {
      const updatedIpAddresses = previous.ipAddresses.filter(
        (_, ipIndex) => ipIndex !== index
      );

      return {
        ...previous,
        ipAddresses:
          updatedIpAddresses.length > 0 ? updatedIpAddresses : [""],
      };
    });
  };

  // RESET FORM

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      ipAddresses: [""],
    });
  };

  // VALIDATION

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      throw new Error("Company Name is required.");
    }

    if (!formData.vendorId.trim()) {
      throw new Error("Vendor ID is required.");
    }

    if (!formData.accountManager.trim()) {
      throw new Error("Account Manager is required.");
    }

    if (!formData.country.trim()) {
      throw new Error("Country is required.");
    }

    if (!formData.contactPerson.trim()) {
      throw new Error("Contact Person is required.");
    }

    if (!formData.phone.trim()) {
      throw new Error("Phone is required.");
    }

    if (!formData.email.trim()) {
      throw new Error("Email is required.");
    }
  };

  // PARSE IP ADDRESSES

  const parseIpAddresses = (values) => {
    return values
      .map((ip) => String(ip || "").trim())
      .filter(Boolean);
  };

  // SAVE VENDOR

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    let createdCompanyId = null;
    let createdVendorId = null;

    try {
      validateForm();

      // CHECK DUPLICATE VENDOR ID

      const { data: existingVendors, error: duplicateError } =
        await supabase
          .from(VENDORS_TABLE)
          .select("id, vendor_id")
          .ilike("vendor_id", formData.vendorId.trim());

      if (duplicateError) throw duplicateError;

      const duplicateVendor = (existingVendors || []).find(
        (vendor) =>
          String(vendor.vendor_id || "").trim().toLowerCase() ===
          formData.vendorId.trim().toLowerCase()
      );

      if (duplicateVendor) {
        throw new Error(
          `Vendor ID "${formData.vendorId}" already exists.`
        );
      }

      const ipAddresses = parseIpAddresses(formData.ipAddresses);

      // COMPANY PAYLOAD
      // Website, IP addresses and description remain in vendors.

      const companyPayload = {
        company_name: formData.companyName.trim(),
        country: formData.country.trim(),
        contact_person: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        account_manager: formData.accountManager.trim(),
      };

      // CREATE COMPANY

      const { data: company, error: companyError } = await supabase
        .from(COMPANIES_TABLE)
        .insert(companyPayload)
        .select("*")
        .single();

      if (companyError) throw companyError;

      if (!company?.id) {
        throw new Error(
          "Company was created but no company ID was returned."
        );
      }

      createdCompanyId = company.id;

      // VENDOR PAYLOAD

      const vendorPayload = {
        company_id: company.id,
        vendor_id: formData.vendorId.trim(),
        status: formData.vendorStatus,
        website: formData.website.trim(),
        ip_addresses: ipAddresses,
        description: formData.description.trim(),
      };

      // CREATE VENDOR

      const { data: vendor, error: vendorError } = await supabase
        .from(VENDORS_TABLE)
        .insert(vendorPayload)
        .select("*")
        .single();

      if (vendorError) throw vendorError;

      if (!vendor?.id) {
        throw new Error(
          "Vendor was created but no vendor ID was returned."
        );
      }

      createdVendorId = vendor.id;

      // SUCCESS

      resetForm();
      navigate("/vendors");
    } catch (error) {
      console.error("Vendor creation failed:", error);

      // ROLLBACK VENDOR IF NEEDED

      if (createdVendorId) {
        const { error: rollbackVendorError } = await supabase
          .from(VENDORS_TABLE)
          .delete()
          .eq("id", createdVendorId);

        if (rollbackVendorError) {
          console.error("Vendor rollback failed:", rollbackVendorError);
        }
      }

      // ROLLBACK COMPANY IF NEEDED

      if (createdCompanyId) {
        const { error: rollbackCompanyError } = await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", createdCompanyId);

        if (rollbackCompanyError) {
          console.error("Company rollback failed:", rollbackCompanyError);
        }
      }

      showSupabaseError(
        error,
        "Something went wrong while creating the vendor."
      );
    } finally {
      setSaving(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* HEADER */}

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
              Vendor Management
            </p>
          </div>
        </div>

        <span className="text-xs text-gray-400">Add Vendor</span>
      </header>

      {/* MAIN */}

      <main className="p-5 md:p-8 max-w-[1600px] mx-auto">
        {/* BREADCRUMB */}

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
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

          <span className="text-gray-700 font-medium">Add Vendor</span>
        </div>

        {/* PAGE HEADER */}

        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Add Vendor
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Create a new vendor account.
          </p>
        </div>

        {/* FORM CONTAINER */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* FORM HEADER */}

          <div className="bg-white border-b px-7 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-xl font-semibold">
              +
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Vendor
              </h2>

              <p className="text-sm text-gray-500 mt-0.5">
                Enter the vendor account details below.
              </p>
            </div>
          </div>

          {/* FORM */}

          <form onSubmit={handleSubmit}>
            <div className="p-7">
              {/* COMPANY INFORMATION */}

              <div className="mb-8">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900">
                    Company Information
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Enter the basic information for the vendor company.
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
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
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
                      value={formData.vendorId}
                      onChange={handleChange}
                      placeholder="VEND-0001"
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
                      value={formData.accountManager}
                      onChange={handleChange}
                      placeholder="Account manager name"
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
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
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
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                    />
                  </div>

                  {/* CONTACT PERSON */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Person *
                    </label>

                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Contact person name"
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
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 234 567 890"
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
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="vendor@example.com"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                    />
                  </div>
                </div>
              </div>

              {/* NETWORK INFORMATION */}

              <div className="border-t border-gray-100 pt-7">
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Network Information
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Add the IP addresses associated with this vendor.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addIpAddressField}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
                    >
                      <span className="text-lg leading-none">+</span>
                      Add IP Address
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.ipAddresses.map((ipAddress, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          IP Address {index + 1}
                        </label>

                        <input
                          type="text"
                          value={ipAddress}
                          onChange={(e) =>
                            handleIpChange(index, e.target.value)
                          }
                          placeholder="192.168.1.10"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition font-mono text-sm"
                        />
                      </div>

                      <div className="pt-5">
                        <button
                          type="button"
                          onClick={() => removeIpAddressField(index)}
                          disabled={formData.ipAddresses.length === 1}
                          className="w-11 h-11 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove IP address"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h14"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Each IP address is saved separately inside the{" "}
                  <span className="font-mono text-gray-600">
                    vendors.ip_addresses
                  </span>{" "}
                  column.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="border-t border-gray-100 pt-7 mt-7">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900">
                    Vendor Description
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Add a description or notes about this vendor.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Enter vendor description..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition resize-none text-sm"
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    This description is saved to the{" "}
                    <span className="font-mono text-gray-600">
                      vendors.description
                    </span>{" "}
                    column.
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <div className="border-t border-gray-100 pt-7 mt-7">
                <div className="max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vendor Status
                  </label>

                  <select
                    name="vendorStatus"
                    value={formData.vendorStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-gray-400">
                Fields marked with * are required.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/vendors")}
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
                  {saving ? "Saving..." : "Save Vendor"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ERROR MODAL */}

      {showErrorModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">
                  !
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Vendor Operation Failed
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Supabase returned an error.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-800 break-words">
                  {loadError?.message ||
                    "Unable to complete the operation."}
                </p>
              </div>

              {loadError?.code && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Error Code
                  </p>
                  <p className="mt-1 text-sm font-mono">
                    {loadError.code}
                  </p>
                </div>
              )}

              {loadError?.details && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Details
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {loadError.details}
                  </p>
                </div>
              )}

              {loadError?.hint && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Hint
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {loadError.hint}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeErrorModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowErrorModal(false);
                    navigate("/vendors");
                  }}
                  className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
                >
                  Back to Vendors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddVendor;
