import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient";

const CLIENT_RESOURCE_TABLE = "client_resources";
const CUSTOMER_TABLE = "customers";
const COMPANY_TABLE = "companies";
const QUALITY_TABLE = "quality_descriptions";

function Clientresource() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [qualityDescriptionsData, setQualityDescriptionsData] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ============================================================
     FILTERS
  ============================================================ */

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [qualityDescriptionFilter, setQualityDescriptionFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ============================================================
     MODALS
  ============================================================ */

  const [showEditClient, setShowEditClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);

  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  /* ============================================================
     HELPER - QUALITY DESCRIPTION
  ============================================================ */

  const getQualityDescription = useCallback((quality) => {
    if (!quality) return "";

    return String(
      quality.description ??
        quality.quality_description ??
        quality.qualityDescription ??
        quality.name ??
        quality.title ??
        quality.label ??
        quality.quality ??
        ""
    ).trim();
  }, []);

  /* ============================================================
     HELPER - FORMAT CLIENT
  ============================================================ */

  const formatClient = useCallback(
    (resource, customer = null, company = null, quality = null) => {
      return {
        id: resource.id,

        customerResourceId: resource.customer_id ?? "",

        customerId:
          customer?.customer_id ??
          resource.customer_id ??
          "",

        company: company?.company_name ?? "",

        accountManager: company?.account_manager ?? "",

        country: company?.country ?? resource.country ?? "",

        sellingRate: resource.selling_rate ?? "",

        // STAR RATING
        starRating: Number(resource.star_rating ?? 0),

        ports: resource.ports ?? "",

        credit: resource.credit ?? "",

        supportQuality: resource.support_quality ?? "",

        qualityDescriptionId: resource.quality_description_id ?? "",

        qualityDescription: getQualityDescription(quality),

        routeType: resource.route_type ?? "",

        billingCycle: resource.billing_cycle ?? "",

        status: resource.status ?? "",

        createdAt: resource.created_at ?? "",

        updatedAt: resource.updated_at ?? "",
      };
    },
    [getQualityDescription]
  );

  /* ============================================================
     FETCH QUALITY DESCRIPTIONS
  ============================================================ */

  const fetchQualityDescriptions = useCallback(async () => {
    const {
      data,
      error: qualityError,
    } = await supabase
      .from(QUALITY_TABLE)
      .select("*")
      .order("id", { ascending: true });

    if (qualityError) {
      throw qualityError;
    }

    setQualityDescriptionsData(data || []);

    return data || [];
  }, []);

  /* ============================================================
     FETCH CLIENT RESOURCES
  ============================================================ */

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * STEP 1
       * Fetch resources from client_resources table.
       */

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from(CLIENT_RESOURCE_TABLE)
        .select("*")
        .order("id", { ascending: true });

      if (resourceError) {
        throw resourceError;
      }

      const resources = resourceData || [];

      /*
       * STEP 2
       * Fetch quality descriptions.
       */

      let qualities = [];

      try {
        qualities = await fetchQualityDescriptions();
      } catch (qualityError) {
        console.error(
          "Quality description fetch error:",
          qualityError
        );

        qualities = [];
        setQualityDescriptionsData([]);
      }

      /*
       * STEP 3
       * Get customers.
       */

      const customerIds = [
        ...new Set(
          resources
            .map((resource) => resource.customer_id)
            .filter(
              (value) =>
                value !== null &&
                value !== undefined &&
                value !== ""
            )
        ),
      ];

      let customers = [];

      if (customerIds.length > 0) {
        const {
          data: customerData,
          error: customerError,
        } = await supabase
          .from(CUSTOMER_TABLE)
          .select("id, customer_id, company_id, status")
          .in("id", customerIds);

        if (customerError) {
          throw customerError;
        }

        customers = customerData || [];
      }

      /*
       * STEP 4
       * Get companies.
       */

      const companyIds = [
        ...new Set(
          customers
            .map((customer) => customer.company_id)
            .filter(
              (value) =>
                value !== null &&
                value !== undefined &&
                value !== ""
            )
        ),
      ];

      let companies = [];

      if (companyIds.length > 0) {
        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from(COMPANY_TABLE)
          .select(
            "id, company_id, company_name, country, account_manager, status"
          )
          .in("id", companyIds);

        if (companyError) {
          throw companyError;
        }

        companies = companyData || [];
      }

      /*
       * STEP 5
       * Create lookup maps.
       */

      const customerMap = new Map();

      customers.forEach((customer) => {
        customerMap.set(String(customer.id), customer);
      });

      const companyMap = new Map();

      companies.forEach((company) => {
        companyMap.set(String(company.id), company);
      });

      const qualityMap = new Map();

      qualities.forEach((quality) => {
        qualityMap.set(String(quality.id), quality);
      });

      /*
       * STEP 6
       * Combine everything.
       */

      const formattedClients = resources.map((resource) => {
        const customer = customerMap.get(
          String(resource.customer_id)
        );

        const company = customer
          ? companyMap.get(String(customer.company_id))
          : null;

        const quality = resource.quality_description_id
          ? qualityMap.get(
              String(resource.quality_description_id)
            )
          : null;

        return formatClient(
          resource,
          customer,
          company,
          quality
        );
      });

      setClients(formattedClients);
    } catch (err) {
      console.error("Error fetching client resources:", err);

      setClients([]);

      setError(
        err?.message || "Unable to load client resources."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchQualityDescriptions, formatClient]);

  /* ============================================================
     INITIAL FETCH
  ============================================================ */

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* ============================================================
     FETCH COMPANY BY ID
     USED BY EDIT CLIENT
  ============================================================ */

  const fetchCompanyById = async (companyId) => {
    if (
      companyId === null ||
      companyId === undefined ||
      companyId === ""
    ) {
      return null;
    }

    const {
      data,
      error: companyError,
    } = await supabase
      .from(COMPANY_TABLE)
      .select(
        "id, company_id, company_name, country, account_manager, status"
      )
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      throw companyError;
    }

    return data || null;
  };

  /* ============================================================
     FILTER OPTIONS
  ============================================================ */

  const countries = useMemo(() => {
    return [
      ...new Set(
        clients
          .map((client) =>
            String(client.country || "").trim()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [clients]);

  const managers = useMemo(() => {
    return [
      ...new Set(
        clients
          .map((client) =>
            String(client.accountManager || "").trim()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [clients]);

  const qualityDescriptions = useMemo(() => {
    return [
      ...new Set(
        clients
          .map((client) =>
            String(client.qualityDescription || "").trim()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [clients]);

  /* ============================================================
     FILTER CLIENTS
  ============================================================ */

  const filteredClients = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return clients.filter((client) => {
      const matchesSearch =
        !searchValue ||
        String(client.customerId || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(client.company || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(client.accountManager || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(client.country || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesCountry =
        countryFilter === "All" ||
        client.country === countryFilter;

      const matchesManager =
        managerFilter === "All" ||
        client.accountManager === managerFilter;

      const matchesQuality =
        qualityDescriptionFilter === "All" ||
        client.qualityDescription ===
          qualityDescriptionFilter;

      const normalizedStatus = String(client.status || "")
        .trim()
        .toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        normalizedStatus === statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesCountry &&
        matchesManager &&
        matchesQuality &&
        matchesStatus
      );
    });
  }, [
    clients,
    search,
    countryFilter,
    managerFilter,
    qualityDescriptionFilter,
    statusFilter,
  ]);

  /* ============================================================
     SUMMARY
  ============================================================ */

  const totalClients = new Set(
    filteredClients
      .map((client) => client.customerId)
      .filter(Boolean)
  ).size;

  const totalCapacity = filteredClients.reduce(
    (total, client) =>
      total + Number(client.ports || 0),
    0
  );

  const avgSellingRate =
    filteredClients.length > 0
      ? (
          filteredClients.reduce(
            (total, client) =>
              total + Number(client.sellingRate || 0),
            0
          ) / filteredClients.length
        ).toFixed(6)
      : "0.000000";

  const healthWarnings = filteredClients.filter((client) => {
    const support = String(
      client.supportQuality || ""
    ).toLowerCase();

    const status = String(
      client.status || ""
    ).toLowerCase();

    return support === "poor" || status === "inactive";
  }).length;

  /* ============================================================
     FORMAT CREDIT
  ============================================================ */

  const formatCredit = (credit) => {
    if (
      credit === null ||
      credit === undefined ||
      credit === ""
    ) {
      return "-";
    }

    return String(credit);
  };

  /* ============================================================
     STAR RATING DISPLAY
  ============================================================ */

  const renderStars = (rating) => {
    const value = Math.max(
      0,
      Math.min(5, Number(rating) || 0)
    );

    return (
      <span className="inline-flex items-center whitespace-nowrap">
        <span className="text-amber-500">
          {"★".repeat(value)}
        </span>

        <span className="text-gray-300">
          {"★".repeat(5 - value)}
        </span>

        <span className="ml-1 text-xs text-gray-500">
          {value}/5
        </span>
      </span>
    );
  };

  /* ============================================================
     EDIT CLIENT
  ============================================================ */

  const handleEditClient = (client) => {
    setEditingClient({
      ...client,

      sellingRate:
        client.sellingRate === null ||
        client.sellingRate === undefined
          ? ""
          : String(client.sellingRate),

      starRating: Number(client.starRating || 0),

      ports:
        client.ports === null ||
        client.ports === undefined
          ? ""
          : String(client.ports),

      credit:
        client.credit === null ||
        client.credit === undefined
          ? ""
          : String(client.credit),

      routeType: client.routeType || "",

      supportQuality: client.supportQuality || "",

      status: client.status || "",

      qualityDescriptionId: client.qualityDescriptionId
        ? String(client.qualityDescriptionId)
        : "",

      country: client.country || "",
    });

    setOpenMenu(null);
    setMenuPosition(null);

    setShowEditClient(true);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     SAVE EDIT
  ============================================================ */

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingClient) return;

    setError("");
    setSuccess("");

    const sellingRate =
      editingClient.sellingRate === ""
        ? null
        : Number(editingClient.sellingRate);

    const starRating = Math.max(
      0,
      Math.min(5, Number(editingClient.starRating) || 0)
    );

    const ports =
      editingClient.ports === ""
        ? null
        : Number(editingClient.ports);

    const credit =
      editingClient.credit === ""
        ? null
        : Number(editingClient.credit);

    const qualityDescriptionId =
      editingClient.qualityDescriptionId === ""
        ? null
        : Number(editingClient.qualityDescriptionId);

    if (
      sellingRate !== null &&
      Number.isNaN(sellingRate)
    ) {
      setError("Selling rate must be a valid number.");
      return;
    }

    if (ports !== null && Number.isNaN(ports)) {
      setError("Ports must be a valid number.");
      return;
    }

    if (credit !== null && Number.isNaN(credit)) {
      setError("Credit must be a valid number.");
      return;
    }

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from(CLIENT_RESOURCE_TABLE)
        .update({
          customer_id:
            editingClient.customerResourceId,

          selling_rate: sellingRate,

          // SAVE STAR RATING
          star_rating: starRating,

          ports,

          credit,

          support_quality:
            editingClient.supportQuality || null,

          quality_description_id:
            qualityDescriptionId,

          route_type:
            editingClient.routeType || null,

          status:
            editingClient.status || null,

          updated_at: new Date().toISOString(),
        })
        .eq("id", editingClient.id)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      let customer = null;
      let company = null;

      if (editingClient.customerResourceId) {
        const {
          data: customerData,
          error: customerError,
        } = await supabase
          .from(CUSTOMER_TABLE)
          .select("id, customer_id, company_id, status")
          .eq("id", editingClient.customerResourceId)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        customer = customerData;

        if (customer) {
          company = await fetchCompanyById(
            customer.company_id
          );

          /*
           * Update country if changed in edit modal.
           */

          if (
            editingClient.country !== undefined &&
            customer.company_id
          ) {
            const enteredCountry = String(
              editingClient.country || ""
            ).trim();

            if (enteredCountry) {
              const {
                error: countryError,
              } = await supabase
                .from(COMPANY_TABLE)
                .update({
                  country: enteredCountry,
                })
                .eq("id", customer.company_id);

              if (countryError) {
                throw countryError;
              }

              company = {
                ...company,
                country: enteredCountry,
              };
            }
          }
        }
      }

      const quality =
        qualityDescriptionsData.find(
          (item) =>
            String(item.id) ===
            String(qualityDescriptionId)
        ) || null;

      const formatted = formatClient(
        data,
        customer,
        company,
        quality
      );

      setClients((previous) =>
        previous.map((client) =>
          client.id === formatted.id
            ? formatted
            : client
        )
      );

      setShowEditClient(false);
      setEditingClient(null);

      setSuccess(
        "Client resource updated successfully."
      );
    } catch (err) {
      console.error(
        "Error updating client resource:",
        err
      );

      setError(
        err?.message ||
          "Unable to update client resource."
      );
    }
  };

  /* ============================================================
     VIEW CLIENT
  ============================================================ */

  const handleViewClient = (client) => {
    setViewingClient(client);
    setOpenMenu(null);
    setMenuPosition(null);
    setShowViewClient(true);
  };

  /* ============================================================
     THREE DOT MENU
     FIXED POSITION - WILL NOT GO UNDER TABLE
  ============================================================ */

  const handleOpenMenu = (event, clientId) => {
    event.stopPropagation();

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 128;
    const menuHeight = 84;

    let left = buttonRect.right - menuWidth;
    let top = buttonRect.bottom + 6;

    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    if (left < 10) {
      left = 10;
    }

    if (top + menuHeight > window.innerHeight - 10) {
      top = buttonRect.top - menuHeight - 6;
    }

    if (top < 10) {
      top = 10;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenu((previous) =>
      previous === clientId ? null : clientId
    );
  };

  /* ============================================================
     PAGE CLICK
  ============================================================ */

  const handlePageClick = () => {
    if (openMenu !== null) {
      setOpenMenu(null);
      setMenuPosition(null);
    }
  };

  /* ============================================================
     MENU COMPONENT
  ============================================================ */

  const renderActionMenu = () => {
    if (openMenu === null || !menuPosition) {
      return null;
    }

    const client = clients.find(
      (item) => item.id === openMenu
    );

    if (!client) return null;

    return createPortal(
      <div
        className="fixed z-[9999] w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={() => handleViewClient(client)}
          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          View
        </button>

        <button
          type="button"
          onClick={() => handleEditClient(client)}
          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
      </div>,
      document.body
    );
  };

  /* ============================================================
     TABLE ROW CLASS
  ============================================================ */

  const getClientRowClass = (client) => {
    const isInactive =
      String(client.status || "")
        .trim()
        .toLowerCase() === "inactive";

    if (isInactive) {
      return "border-b last:border-b-0 bg-gray-50 text-red-700 border-gray-100 hover:bg-red-50";
    }

    return "border-b border-gray-100 last:border-b-0 text-gray-900 hover:bg-gray-50";
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="w-full min-h-full bg-[#f5f6f8] text-gray-900"
      onClick={handlePageClick}
    >
      {/* ======================================================
          TOP NAV
      ====================================================== */}

      <div
        className="bg-white border-b border-gray-200 px-5 py-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              to="/resource-management"
              className="px-4 py-2 rounded-md text-sm font-normal bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              Vendor Resources
            </Link>

            <Link
              to="/resource-management/clients"
              className="px-4 py-2 rounded-md text-sm font-normal bg-green-100 text-green-800 hover:bg-green-200"
            >
              Client Resources
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search..."
                className="w-64 h-9 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm outline-none focus:border-gray-500"
              />

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                navigate("/resource-management/clients/add");
              }}
              className="h-9 px-4 bg-gray-900 text-white rounded-md text-sm font-normal hover:bg-gray-800"
            >
              + Add Client
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <div className="px-5 py-5">
        {/* ERROR */}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-700 font-normal"
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-green-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-700 font-normal"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading client resources...
            </p>
          </div>
        ) : (
          <>
            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="mb-5">
              <div className="bg-white border border-gray-300 rounded-lg p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* COUNTRY */}

                  <select
                    value={countryFilter}
                    onChange={(event) =>
                      setCountryFilter(event.target.value)
                    }
                    className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
                  >
                    <option value="All">
                      All Countries
                    </option>

                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>

                  {/* MANAGER */}

                  <select
                    value={managerFilter}
                    onChange={(event) =>
                      setManagerFilter(event.target.value)
                    }
                    className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
                  >
                    <option value="All">
                      All Managers
                    </option>

                    {managers.map((manager) => (
                      <option key={manager} value={manager}>
                        {manager}
                      </option>
                    ))}
                  </select>

                  {/* QUALITY DESCRIPTION */}

                  <select
                    value={qualityDescriptionFilter}
                    onChange={(event) =>
                      setQualityDescriptionFilter(
                        event.target.value
                      )
                    }
                    className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
                  >
                    <option value="All">
                      All Quality Descriptions
                    </option>

                    {qualityDescriptions.map((quality) => (
                      <option key={quality} value={quality}>
                        {quality}
                      </option>
                    ))}
                  </select>

                  {/* STATUS */}

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
                  >
                    <option value="All">
                      All Status
                    </option>

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* TOTAL CLIENTS */}

              <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
                <p className="text-sm text-gray-700">
                  Total Clients
                </p>

                <p className="text-2xl font-normal mt-1">
                  {totalClients}
                </p>
              </div>

              {/* TOTAL CAPACITY */}

              <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
                <p className="text-sm text-gray-700">
                  Total Capacity
                </p>

                <p className="text-2xl font-normal mt-1">
                  {totalCapacity} Ports
                </p>
              </div>

              {/* AVG SELLING RATE */}

              <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
                <p className="text-sm text-gray-700">
                  Avg Selling Rate
                </p>

                <p className="text-2xl font-normal mt-1">
                  {avgSellingRate}
                </p>
              </div>

              {/* HEALTH */}

              <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
                <p className="text-sm text-gray-700">
                  Client Health Warnings
                </p>

                <p
                  className={`text-2xl font-normal mt-1 ${
                    healthWarnings > 0
                      ? "text-red-700"
                      : "text-gray-900"
                  }`}
                >
                  {healthWarnings}
                </p>
              </div>
            </div>

            {/* ==================================================
                CLIENT GROUPS
            ================================================== */}

            <div className="space-y-5">
              {qualityDescriptions.map((group) => {
                const groupData = filteredClients.filter(
                  (client) =>
                    client.qualityDescription === group
                );

                return (
                  <div key={group}>
                    <h3 className="text-base font-normal text-gray-800 mb-2">
                      <span className="font-normal">
                        {group}
                      </span>
                    </h3>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1150px] table-fixed border-collapse">
                          <colgroup>
                            <col className="w-[13%]" />
                            <col className="w-[15%]" />
                            <col className="w-[13%]" />
                            <col className="w-[10%]" />
                            <col className="w-[12%]" />
                            <col className="w-[7%]" />
                            <col className="w-[9%]" />
                            <col className="w-[8%]" />
                            <col className="w-[7%]" />
                            <col className="w-[6%]" />
                          </colgroup>

                          <thead>
                            <tr className="bg-[#fafafa] border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Customer ID
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Company Name
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Account Manager
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Selling Rate
                              </th>

                              {/* STAR RATING COLUMN */}
                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Star Rating
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Ports
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Credits
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Support Quality
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                                Status
                              </th>

                              <th></th>
                            </tr>
                          </thead>

                          <tbody>
                            {groupData.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={10}
                                  className="px-5 py-8 text-center text-sm text-gray-500"
                                >
                                  No client resources found.
                                </td>
                              </tr>
                            ) : (
                              groupData.map((client) => (
                                <tr
                                  key={client.id}
                                  className={getClientRowClass(
                                    client
                                  )}
                                >
                                  <td className="px-4 py-3 text-sm font-normal truncate">
                                    {client.customerId || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm truncate">
                                    {client.company || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm truncate">
                                    {client.accountManager || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm">
                                    {client.sellingRate ?? "-"}
                                  </td>

                                  {/* STAR RATING VALUE */}
                                  <td className="px-4 py-3 text-sm">
                                    {renderStars(client.starRating)}
                                  </td>

                                  <td className="px-4 py-3 text-sm">
                                    {client.ports ?? "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm">
                                    {formatCredit(client.credit)}
                                  </td>

                                  <td className="px-4 py-3 text-sm">
                                    {client.supportQuality || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm font-normal">
                                    {client.status || "-"}
                                  </td>

                                  <td
                                    className="px-2 py-3 text-center"
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) =>
                                        handleOpenMenu(
                                          event,
                                          client.id
                                        )
                                      }
                                      className="w-8 h-8 mx-auto flex items-center justify-center rounded-md hover:bg-black/5 text-gray-700 text-lg"
                                      aria-label="Client actions"
                                    >
                                      ⋮
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ==================================================
                  RESOURCES WITHOUT QUALITY DESCRIPTION
              ================================================== */}

              {filteredClients.some(
                (client) => !client.qualityDescription
              ) && (
                <div>
                  <h3 className="text-base font-normal text-gray-800 mb-2">
                    <span className="font-normal">
                      Unassigned
                    </span>
                  </h3>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[1150px] table-fixed border-collapse">
                        <colgroup>
                          <col className="w-[13%]" />
                          <col className="w-[15%]" />
                          <col className="w-[13%]" />
                          <col className="w-[10%]" />
                          <col className="w-[12%]" />
                          <col className="w-[7%]" />
                          <col className="w-[9%]" />
                          <col className="w-[8%]" />
                          <col className="w-[7%]" />
                          <col className="w-[6%]" />
                        </colgroup>

                        <thead>
                          <tr className="bg-[#fafafa] border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Customer ID
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Company Name
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Account Manager
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Selling Rate
                            </th>

                            {/* STAR RATING COLUMN */}
                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Star Rating
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Ports
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Credits
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Support Quality
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-normal whitespace-nowrap">
                              Status
                            </th>

                            <th></th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredClients
                            .filter(
                              (client) =>
                                !client.qualityDescription
                            )
                            .map((client) => (
                              <tr
                                key={client.id}
                                className={getClientRowClass(
                                  client
                                )}
                              >
                                <td className="px-4 py-3 text-sm font-normal truncate">
                                  {client.customerId || "-"}
                                </td>

                                <td className="px-4 py-3 text-sm truncate">
                                  {client.company || "-"}
                                </td>

                                <td className="px-4 py-3 text-sm truncate">
                                  {client.accountManager || "-"}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  {client.sellingRate ?? "-"}
                                </td>

                                {/* STAR RATING VALUE */}
                                <td className="px-4 py-3 text-sm">
                                  {renderStars(client.starRating)}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  {client.ports ?? "-"}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  {formatCredit(client.credit)}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  {client.supportQuality || "-"}
                                </td>

                                <td className="px-4 py-3 text-sm font-normal">
                                  {client.status || "-"}
                                </td>

                                <td
                                  className="px-2 py-3 text-center"
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      handleOpenMenu(
                                        event,
                                        client.id
                                      )
                                    }
                                    className="w-8 h-8 mx-auto flex items-center justify-center rounded-md hover:bg-black/5 text-gray-700 text-lg"
                                    aria-label="Client actions"
                                  >
                                    ⋮
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {filteredClients.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No client resources available.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ========================================================
          ACTION MENU PORTAL
      ======================================================== */}

      {renderActionMenu()}

      {/* ========================================================
          EDIT CLIENT MODAL
      ======================================================== */}

      {showEditClient && editingClient && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setShowEditClient(false);
            setEditingClient(null);
          }}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-normal text-gray-900">
                Edit Client Resource
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowEditClient(false);
                  setEditingClient(null);
                }}
                className="text-gray-500 hover:text-gray-900 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CUSTOMER ID */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Customer ID
                  </label>

                  <input
                    value={editingClient.customerId || ""}
                    readOnly
                    className="w-full h-10 border border-gray-200 bg-gray-50 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* COMPANY */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Company
                  </label>

                  <input
                    value={editingClient.company || ""}
                    readOnly
                    className="w-full h-10 border border-gray-200 bg-gray-50 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* ACCOUNT MANAGER */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Account Manager
                  </label>

                  <input
                    value={editingClient.accountManager || ""}
                    readOnly
                    className="w-full h-10 border border-gray-200 bg-gray-50 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* COUNTRY */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Country
                  </label>

                  <input
                    value={editingClient.country || ""}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        country: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* SELLING RATE */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Selling Rate
                  </label>

                  <input
                    required
                    type="number"
                    step="0.000001"
                    value={editingClient.sellingRate}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        sellingRate: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* STAR RATING EDIT OPTION */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Star Rating
                  </label>

                  <div className="h-10 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setEditingClient((previous) => ({
                              ...previous,
                              starRating: star,
                            }))
                          }
                          className={`text-2xl leading-none ${
                            star <=
                            Number(editingClient.starRating || 0)
                              ? "text-amber-500"
                              : "text-gray-300"
                          }`}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          aria-pressed={
                            Number(editingClient.starRating || 0) ===
                            star
                          }
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <span className="text-sm text-gray-500">
                      {Number(editingClient.starRating || 0)}/5
                    </span>
                  </div>
                </div>

                {/* PORTS */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Ports
                  </label>

                  <input
                    type="number"
                    value={editingClient.ports}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        ports: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* CREDIT */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Credit
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={editingClient.credit}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        credit: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* ROUTE TYPE */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Route Type
                  </label>

                  <input
                    value={editingClient.routeType || ""}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        routeType: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* SUPPORT QUALITY */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Support Quality
                  </label>

                  <input
                    value={editingClient.supportQuality || ""}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        supportQuality: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* STATUS */}

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Status
                  </label>

                  <input
                    value={editingClient.status || ""}
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none"
                  />
                </div>

                {/* QUALITY DESCRIPTION */}

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Quality Description
                  </label>

                  <select
                    value={
                      editingClient.qualityDescriptionId || ""
                    }
                    onChange={(event) =>
                      setEditingClient((previous) => ({
                        ...previous,
                        qualityDescriptionId:
                          event.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none bg-white"
                  >
                    <option value="">
                      Select quality description
                    </option>

                    {qualityDescriptionsData.map((quality) => (
                      <option
                        key={quality.id}
                        value={quality.id}
                      >
                        {getQualityDescription(quality) ||
                          `Quality #${quality.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClient(false);
                    setEditingClient(null);
                  }}
                  className="h-10 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW CLIENT MODAL
      ======================================================== */}

      {showViewClient && viewingClient && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowViewClient(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-lg shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-normal text-gray-900">
                  Client Details
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Complete client resource information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowViewClient(false)}
                className="text-gray-500 hover:text-gray-900 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {/* CUSTOMER ID */}

                <div>
                  <p className="text-xs text-gray-500">
                    Customer ID
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.customerId || "-"}
                  </p>
                </div>

                {/* COMPANY */}

                <div>
                  <p className="text-xs text-gray-500">
                    Company
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.company || "-"}
                  </p>
                </div>

                {/* ACCOUNT MANAGER */}

                <div>
                  <p className="text-xs text-gray-500">
                    Account Manager
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.accountManager || "-"}
                  </p>
                </div>

                {/* COUNTRY */}

                <div>
                  <p className="text-xs text-gray-500">
                    Country
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.country || "-"}
                  </p>
                </div>

                {/* SELLING RATE */}

                <div>
                  <p className="text-xs text-gray-500">
                    Selling Rate
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.sellingRate ?? "-"}
                  </p>
                </div>

                {/* STAR RATING */}

                <div>
                  <p className="text-xs text-gray-500">
                    Star Rating
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {renderStars(viewingClient.starRating)}
                  </p>
                </div>

                {/* PORTS */}

                <div>
                  <p className="text-xs text-gray-500">
                    Ports
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.ports ?? "-"}
                  </p>
                </div>

                {/* CREDIT */}

                <div>
                  <p className="text-xs text-gray-500">
                    Credit
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {formatCredit(viewingClient.credit)}
                  </p>
                </div>

                {/* ROUTE TYPE */}

                <div>
                  <p className="text-xs text-gray-500">
                    Route Type
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.routeType || "-"}
                  </p>
                </div>

                {/* SUPPORT QUALITY */}

                <div>
                  <p className="text-xs text-gray-500">
                    Support Quality
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.supportQuality || "-"}
                  </p>
                </div>

                {/* STATUS */}

                <div>
                  <p className="text-xs text-gray-500">
                    Status
                  </p>

                  <p
                    className={`text-sm font-normal mt-1 ${
                      String(viewingClient.status || "")
                        .trim()
                        .toLowerCase() === "inactive"
                        ? "text-red-700"
                        : "text-gray-900"
                    }`}
                  >
                    {viewingClient.status || "-"}
                  </p>
                </div>

                {/* QUALITY DESCRIPTION */}

                <div className="col-span-2">
                  <p className="text-xs text-gray-500">
                    Quality Description
                  </p>

                  <p className="text-sm font-normal text-gray-900 mt-1">
                    {viewingClient.qualityDescription || "-"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowViewClient(false)}
                  className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientresource;