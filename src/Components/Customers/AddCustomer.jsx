
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../supabaseClient";

const CUSTOMERS_TABLE = "customers";
const COMPANIES_TABLE = "companies";

function AddCustomer() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [error, setError] = useState("");
  const [ipAddresses, setIpAddresses] = useState([""]);

  const [formData, setFormData] = useState({
    customerId: "",
    companyName: "",
    accountManager: "",
    status: "ACTIVE",
    country: "",
    website: "",
    phone: "",
    email: "",
    contactPerson: "",
    companyDescription: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addIpField = () => {
    setIpAddresses((prev) => [...prev, ""]);
  };

  const removeIpField = (index) => {
    if (ipAddresses.length === 1) return;

    setIpAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIp = (index, value) => {
    setIpAddresses((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!formData.customerId.trim()) {
        throw new Error("Customer ID is required.");
      }

      if (!formData.companyName.trim()) {
        throw new Error("Company name is required.");
      }

      // CREATE COMPANY
      const companyData = {
        company_name: formData.companyName.trim(),
        country: formData.country.trim(),
        website: formData.website.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        contact_person: formData.contactPerson.trim(),
        account_manager: formData.accountManager.trim(),
        status: formData.status,
        company_description: formData.companyDescription.trim(),
        updated_at: new Date().toISOString(),
      };

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from(COMPANIES_TABLE)
        .insert([companyData])
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      // CLEAN IP ADDRESSES
      const cleanIpAddresses = ipAddresses
        .map((ip) => ip.trim())
        .filter(Boolean);

      // CREATE CUSTOMER
      const customerData = {
        customer_id: formData.customerId.trim(),
        company_id: company.id,
        ip_addresses: cleanIpAddresses,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from(CUSTOMERS_TABLE)
        .insert([customerData])
        .select()
        .single();

      if (customerError) {
        // Remove the newly created company if customer creation fails.
        await supabase
          .from(COMPANIES_TABLE)
          .delete()
          .eq("id", company.id);

        throw customerError;
      }

      console.log("Customer created:", customer);

      navigate("/customers", {
        replace: true,
        state: {
          success: "Customer added successfully.",
        },
      });
    } catch (err) {
      console.error("Customer creation failed:", err);

      setError(
        err?.message ||
          "Something went wrong while adding the customer."
      );

      setShowErrorPopup(true);
    } finally {
      setSaving(false);
    }
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
        <Link
          to="/customers"
          className="flex items-center gap-2 text-gray-800 font-semibold"
        >
          <span className="text-lg">←</span>
          <span>CloudCRM</span>
        </Link>

        <div className="text-sm text-gray-500">
          Customer Management
        </div>
      </header>

      {/* MAIN */}
      <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="text-sm text-gray-600 hover:text-black mb-4"
          >
            ← Back to Customers
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Add Customer
          </h1>

          <p className="text-gray-500 mt-1">
            Enter the customer account information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 lg:p-8"
        >
          {/* CUSTOMER INFORMATION */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Customer Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer ID *
                </label>

                <input
                  type="text"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  placeholder="CUST-0001"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Manager *
                </label>

                <input
                  type="text"
                  name="accountManager"
                  value={formData.accountManager}
                  onChange={handleChange}
                  placeholder="Enter account manager"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass} bg-white`}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>

                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>

                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter contact person"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>

                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter company description..."
                  disabled={saving}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* IP ADDRESSES */}
          <div className="border-t mt-8 pt-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  IP Addresses
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add one or more customer IP addresses.
                </p>
              </div>

              <button
                type="button"
                onClick={addIpField}
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                + Add IP
              </button>
            </div>

            <div className="space-y-3">
              {ipAddresses.map((ip, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => updateIp(index, e.target.value)}
                    placeholder={`IP Address ${index + 1}`}
                    disabled={saving}
                    className={`flex-1 ${inputClass}`}
                  />

                  {ipAddresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIpField(index)}
                      disabled={saving}
                      className="px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              disabled={saving}
              className="px-5 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </main>

      {/* ERROR POPUP */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">
                  !
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
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
                className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
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

export default AddCustomer;
