
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const EMPTY_CLIENT = {
  customerId: "",
  sellingRate: "",
  ports: "",
  credit: "",
  routeType: "",
  supportQuality: "",
  status: "ACTIVE",
  qualityDescriptionId: "",
  manualQualityDescription: "",
  country: "",
  starRating: 0,
};

const AddClientResource = () => {
  const navigate = useNavigate();

  const [newClient, setNewClient] = useState(EMPTY_CLIENT);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [qualityDescriptions, setQualityDescriptions] = useState([]);
  const [useManualQualityDescription, setUseManualQualityDescription] =
    useState(false);

  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // Fetch quality descriptions
  // --------------------------------------------------
  useEffect(() => {
    const fetchQualityDescriptions = async () => {
      const { data, error } = await supabase
        .from("quality_descriptions")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching quality descriptions:", error);
        return;
      }

      setQualityDescriptions(data || []);
    };

    fetchQualityDescriptions();
  }, []);

  // --------------------------------------------------
  // Update form fields
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setNewClient((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // Update star rating
  // --------------------------------------------------
  const handleStarRatingChange = (rating) => {
    setNewClient((previous) => ({
      ...previous,
      starRating: rating,
    }));

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // Search customers
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const searchCustomers = async () => {
      const searchValue = customerSearch.trim();

      if (!searchValue) {
        setCustomerSuggestions([]);
        return;
      }

      setCustomerLookupLoading(true);

      try {
        const { data, error } = await supabase
          .from("customers")
          .select(`
            id,
            customer_id,
            company_id,
            companies (
              id,
              company_name,
              country
            )
          `)
          .ilike("customer_id", `%${searchValue}%`)
          .limit(10);

        if (cancelled) return;

        if (error) {
          console.error("Customer search error:", error);
          setCustomerSuggestions([]);
          return;
        }

        setCustomerSuggestions(data || []);
      } catch (searchError) {
        if (!cancelled) {
          console.error("Customer search error:", searchError);
          setCustomerSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setCustomerLookupLoading(false);
        }
      }
    };

    const timeout = setTimeout(searchCustomers, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [customerSearch]);

  // --------------------------------------------------
  // Find customer by ID
  // --------------------------------------------------
  const fetchCustomerById = async (customerId) => {
    const value = customerId.trim();

    if (!value) {
      setError("Please enter a Customer ID.");
      return null;
    }

    setCustomerLookupLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          customer_id,
          company_id,
          companies (
            id,
            company_name,
            country
          )
        `)
        .eq("customer_id", value)
        .maybeSingle();

      if (error) {
        console.error("Customer lookup error:", error);
        setError(error.message || "Unable to find the customer.");
        return null;
      }

      if (!data) {
        setSelectedCustomer(null);

        setNewClient((previous) => ({
          ...previous,
          customerId: value,
          country: "",
        }));

        setError("Customer ID not found. Please check the ID.");
        return null;
      }

      setSelectedCustomer(data);

      setNewClient((previous) => ({
        ...previous,
        customerId: data.customer_id || value,
        country: data.companies?.country || "",
      }));

      setCustomerSearch(data.customer_id || value);
      setCustomerSuggestions([]);
      setError("");

      return data;
    } catch (lookupError) {
      console.error("Customer lookup error:", lookupError);
      setError("Something went wrong while looking up the customer.");
      return null;
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  // --------------------------------------------------
  // Select customer from search results
  // --------------------------------------------------
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);

    setNewClient((previous) => ({
      ...previous,
      customerId: customer.customer_id || "",
      country: customer.companies?.country || "",
    }));

    setCustomerSearch(customer.customer_id || "");
    setCustomerSuggestions([]);
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // Submit Add Client Resource form
  // --------------------------------------------------
  const handleAddClient = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (saving) return;

    const enteredCustomerId = newClient.customerId.trim();

    if (!enteredCustomerId) {
      setError("Please select or enter a Customer ID.");
      return;
    }

    // Keep the actual customer returned from lookup.
    let customerToSave = selectedCustomer;

    // Resolve the customer again if no customer is selected
    // or if the entered Customer ID no longer matches.
    if (
      !customerToSave ||
      customerToSave.customer_id !== enteredCustomerId
    ) {
      customerToSave = await fetchCustomerById(enteredCustomerId);

      if (!customerToSave) {
        return;
      }
    }

    if (
      useManualQualityDescription &&
      !newClient.manualQualityDescription.trim()
    ) {
      setError("Please enter the quality description.");
      return;
    }

    if (
      !useManualQualityDescription &&
      !newClient.qualityDescriptionId
    ) {
      setError("Please select a quality description.");
      return;
    }

    setSaving(true);

    try {
      let qualityDescriptionId = newClient.qualityDescriptionId;

      // Create a quality description if manually entered.
      if (useManualQualityDescription) {
        const { data: qualityData, error: qualityError } =
          await supabase
            .from("quality_descriptions")
            .insert([
              {
                description:
                  newClient.manualQualityDescription.trim(),
              },
            ])
            .select()
            .single();

        if (qualityError) {
          throw qualityError;
        }

        qualityDescriptionId = qualityData.id;
      }

      // Update company country when provided.
      if (customerToSave.company_id && newClient.country.trim()) {
        const { error: companyError } = await supabase
          .from("companies")
          .update({
            country: newClient.country.trim(),
          })
          .eq("id", customerToSave.company_id);

        if (companyError) {
          throw companyError;
        }
      }

      // Create the client resource.
      // Assumes client_resources.customer_id references customers.id.
      const payload = {
        customer_id: customerToSave.id,
        selling_rate:
          newClient.sellingRate === ""
            ? null
            : Number(newClient.sellingRate),
        ports:
          newClient.ports === ""
            ? null
            : Number(newClient.ports),
        credit:
          newClient.credit === ""
            ? null
            : Number(newClient.credit),
        route_type: newClient.routeType || null,
        support_quality: newClient.supportQuality || null,
        status: newClient.status || "ACTIVE",
        quality_description_id: qualityDescriptionId || null,

        // Save selected star rating (0 to 5).
        star_rating: Number(newClient.starRating || 0),
      };

      const { error: insertError } = await supabase
        .from("client_resources")
        .insert([payload]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Client resource added successfully.");

      setTimeout(() => {
        navigate("/resource-management/clients");
      }, 800);
    } catch (submitError) {
      console.error("Error adding client resource:", submitError);

      setError(
        submitError.message ||
          "Failed to add client resource. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Page UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Add Client Resource
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter the client resource details below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/resource-management/clients")}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <span className="mr-2">←</span>
            Back to Client Resources
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Client Resource Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select the customer and provide the resource configuration.
            </p>
          </div>

          <form onSubmit={handleAddClient} className="p-5 sm:p-6">
            {/* Customer Selection */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Customer Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="relative">
                  <label
                    htmlFor="customerSearch"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Customer ID <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="customerSearch"
                      type="text"
                      value={customerSearch}
                      onChange={(event) => {
                        const value = event.target.value;

                        setCustomerSearch(value);
                        setSelectedCustomer(null);

                        setNewClient((previous) => ({
                          ...previous,
                          customerId: value,
                          country: "",
                        }));

                        setError("");
                        setSuccess("");
                      }}
                      placeholder="Search by Customer ID"
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
 
                    <button
                      type="button"
                      onClick={() => fetchCustomerById(customerSearch)}
                      disabled={customerLookupLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {customerLookupLoading ? "..." : "Find"}
                    </button>
                  </div>

                  {customerSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {customerSuggestions.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-blue-50"
                        >
                          <span className="block text-sm font-medium text-gray-800">
                            {customer.customer_id}
                          </span>

                          <span className="mt-1 block text-xs text-gray-500">
                            {customer.companies?.company_name ||
                              "Company name unavailable"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {customerLookupLoading && (
                    <p className="mt-1 text-xs text-gray-500">
                      Searching customers...
                    </p>
                  )}

                  {selectedCustomer && (
                    <p className="mt-2 text-sm font-medium text-green-600">
                      Customer selected: {selectedCustomer.customer_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Country
                  </label>

                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={newClient.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {selectedCustomer?.companies?.company_name && (
                <div className="mt-4 rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    Selected Company
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {selectedCustomer.companies.company_name}
                  </p>
                </div>
              )}
            </div>

            <div className="my-6 border-t border-gray-200" />

            {/* Resource Configuration */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Resource Configuration
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="sellingRate"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Selling Rate
                  </label>

                  <input
                    id="sellingRate"
                    name="sellingRate"
                    type="number"
                    step="any"
                    min="0"
                    value={newClient.sellingRate}
                    onChange={handleChange}
                    placeholder="Enter selling rate"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ports"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Ports
                  </label>

                  <input
                    id="ports"
                    name="ports"
                    type="number"
                    min="0"
                    value={newClient.ports}
                    onChange={handleChange}
                    placeholder="Enter ports"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="credit"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Credit
                  </label>

                  <input
                    id="credit"
                    name="credit"
                    type="number"
                    step="any"
                    value={newClient.credit}
                    onChange={handleChange}
                    placeholder="Enter credit"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="routeType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Route Type
                  </label>

                  <select
                    id="routeType"
                    name="routeType"
                    value={newClient.routeType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select route type</option>
                    <option value="CLI">CLI</option>
                    <option value="NON-CLI">NON-CLI</option>
                    <option value="CC">CC</option>
                    <option value="P2P">P2P</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="supportQuality"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Support Quality
                  </label>

                  <select
                    id="supportQuality"
                    name="supportQuality"
                    value={newClient.supportQuality}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select support quality</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="GOOD">Good</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={newClient.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Star Rating */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Star Rating
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex items-center gap-1"
                      role="group"
                      aria-label="Select a rating from 1 to 5 stars"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarRatingChange(star)}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          aria-pressed={newClient.starRating === star}
                          className={`text-3xl leading-none transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded ${
                            star <= newClient.starRating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <span className="text-sm font-medium text-gray-600">
                      {newClient.starRating > 0
                        ? `${newClient.starRating}/5`
                        : "Not rated"}
                    </span>

                    {newClient.starRating > 0 && (
                      <button
                        type="button"
                        onClick={() => handleStarRatingChange(0)}
                        className="ml-2 text-xs font-medium text-gray-500 underline hover:text-red-600"
                      >
                        Clear rating
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Select between 1 and 5 stars. This rating is optional.
                  </p>
                </div>
              </div>
            </div>

            <div className="my-6 border-t border-gray-200" />

            {/* Quality Description */}
            <div className="mb-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Quality Description
                </h3>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={useManualQualityDescription}
                    onChange={(event) => {
                      setUseManualQualityDescription(event.target.checked);

                      setNewClient((previous) => ({
                        ...previous,
                        qualityDescriptionId: "",
                        manualQualityDescription: "",
                      }));

                      setError("");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  Enter a new description
                </label>
              </div>

              {useManualQualityDescription ? (
                <div>
                  <label
                    htmlFor="manualQualityDescription"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    New Quality Description{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="manualQualityDescription"
                    name="manualQualityDescription"
                    rows={4}
                    value={newClient.manualQualityDescription}
                    onChange={handleChange}
                    placeholder="Enter quality description"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="qualityDescriptionId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Select Quality Description{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="qualityDescriptionId"
                    name="qualityDescriptionId"
                    value={newClient.qualityDescriptionId}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select quality description</option>

                    {qualityDescriptions.map((quality) => (
                      <option key={quality.id} value={quality.id}>
                        {quality.description ||
                          quality.quality_description ||
                          quality.name ||
                          `Description ${quality.id}`}
                      </option>
                    ))}
                  </select>

                  {qualityDescriptions.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      No saved quality descriptions were found. You can
                      enable “Enter a new description” to add one.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Feedback */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/resource-management/clients")}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || customerLookupLoading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Client Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientResource;
