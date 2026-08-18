import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../supabaseClient";

const LEADS_TABLE = "leads";
const CUSTOMERS_TABLE = "customers";
const VENDORS_TABLE = "vendors";
const COMPANIES_TABLE = "companies";
const TESTING_TABLE = "testing";
const QUALITY_TABLE = "quality_descriptions";

const TESTING_STATUSES = [
  "PENDING",
  "TESTING",
  "TEST_SUCCESS",
  "TEST_FAILED",
  "TEST_TERMINATED",
];

const ENTITY_TYPES = [
  "LEAD",
  "CUSTOMER",
  "VENDOR",
];

function Testing() {
  // =========================================================
  // DATA
  // =========================================================

  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [testingRecords, setTestingRecords] = useState([]);
  const [qualityDescriptions, setQualityDescriptions] =
    useState([]);

  // =========================================================
  // UI
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const [selectedEntity, setSelectedEntity] =
    useState(null);

  const [selectedTesting, setSelectedTesting] =
    useState(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [openMenu, setOpenMenu] = useState(null);

  // =========================================================
  // NEW ADD / ENTITY SELECTION UI
  // =========================================================

  const [showAddSelector, setShowAddSelector] =
    useState(false);

  const [entityTypeToAdd, setEntityTypeToAdd] =
    useState("LEAD");

  const [entityIdInput, setEntityIdInput] =
    useState("");

  const [entitySearchError, setEntitySearchError] =
    useState("");

  // =========================================================
  // TESTING FORM
  // =========================================================

  const [testingType, setTestingType] =
    useState("ROUTE_TESTING");

  const [testingStatus, setTestingStatus] =
    useState("TESTING");

  const [testingDetails, setTestingDetails] =
    useState("");

  const [terminationReason, setTerminationReason] =
    useState("");

  const [qualityDescriptionId, setQualityDescriptionId] =
    useState("");

  // =========================================================
  // FETCH ALL DATA
  // =========================================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        leadsResult,
        customersResult,
        vendorsResult,
        companiesResult,
        testingResult,
        qualityResult,
      ] = await Promise.all([
        supabase
          .from(LEADS_TABLE)
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(CUSTOMERS_TABLE)
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(VENDORS_TABLE)
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

        supabase
          .from(TESTING_TABLE)
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(QUALITY_TABLE)
          .select("*")
          .eq("status", "ACTIVE")
          .order("description", {
            ascending: true,
          }),
      ]);

      if (leadsResult.error) {
        throw new Error(
          `Leads fetch failed: ${leadsResult.error.message}`
        );
      }

      if (customersResult.error) {
        throw new Error(
          `Customers fetch failed: ${customersResult.error.message}`
        );
      }

      if (vendorsResult.error) {
        throw new Error(
          `Vendors fetch failed: ${vendorsResult.error.message}`
        );
      }

      if (companiesResult.error) {
        throw new Error(
          `Companies fetch failed: ${companiesResult.error.message}`
        );
      }

      if (testingResult.error) {
        throw new Error(
          `Testing fetch failed: ${testingResult.error.message}`
        );
      }

      if (qualityResult.error) {
        throw new Error(
          `Quality descriptions fetch failed: ${qualityResult.error.message}`
        );
      }

      setLeads(leadsResult.data || []);
      setCustomers(customersResult.data || []);
      setVendors(vendorsResult.data || []);
      setCompanies(companiesResult.data || []);
      setTestingRecords(testingResult.data || []);
      setQualityDescriptions(
        qualityResult.data || []
      );
    } catch (err) {
      console.error(
        "Testing data fetch error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load testing data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
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
  // QUALITY MAP
  // =========================================================

  const qualityMap = useMemo(() => {
    const map = {};

    qualityDescriptions.forEach(
      (quality) => {
        if (
          quality?.id !== null &&
          quality?.id !== undefined
        ) {
          map[String(quality.id)] =
            quality;
        }
      }
    );

    return map;
  }, [qualityDescriptions]);

  // =========================================================
  // GET COMPANY
  // =========================================================

  const getCompany = useCallback(
    (record) => {
      if (!record) {
        return null;
      }

      if (
        record.company_id !== null &&
        record.company_id !== undefined
      ) {
        return (
          companyMap[
            String(record.company_id)
          ] || null
        );
      }

      return null;
    },
    [companyMap]
  );

  // =========================================================
  // BUILD UNIFIED ENTITIES
  // =========================================================

  const entities = useMemo(() => {
    const result = [];

    // -------------------------------------------------------
    // LEADS
    // -------------------------------------------------------

    leads.forEach((lead) => {
      const company =
        getCompany(lead);

      result.push({
        source: "LEAD",

        sourceId: lead.id,

        displayId:
          lead.lead_id ||
          lead.id,

        companyId:
          lead.company_id ||
          null,

        companyName:
          company?.company_name ||
          lead.company_name ||
          "—",

        accountManager:
          company?.account_manager ||
          lead.account_manager ||
          "—",

        original: lead,
      });
    });

    // -------------------------------------------------------
    // CUSTOMERS
    // -------------------------------------------------------

    customers.forEach((customer) => {
      const company =
        getCompany(customer);

      result.push({
        source: "CUSTOMER",

        sourceId: customer.id,

        displayId:
          customer.customer_id ||
          customer.id,

        companyId:
          customer.company_id ||
          null,

        companyName:
          company?.company_name ||
          customer.company_name ||
          "—",

        accountManager:
          company?.account_manager ||
          customer.account_manager ||
          "—",

        original: customer,
      });
    });

    // -------------------------------------------------------
    // VENDORS
    // -------------------------------------------------------

    vendors.forEach((vendor) => {
      const company =
        getCompany(vendor);

      result.push({
        source: "VENDOR",

        sourceId: vendor.id,

        displayId:
          vendor.vendor_id ||
          vendor.id,

        companyId:
          vendor.company_id ||
          null,

        companyName:
          company?.company_name ||
          vendor.company_name ||
          "—",

        accountManager:
          company?.account_manager ||
          vendor.account_manager ||
          "—",

        original: vendor,
      });
    });

    return result;
  }, [
    leads,
    customers,
    vendors,
    getCompany,
  ]);

  // =========================================================
  // TESTING MAP
  // =========================================================

  const testingMap = useMemo(() => {
    const map = {};

    testingRecords.forEach(
      (testing) => {
        const key = `${String(
          testing.entity_type
        ).toUpperCase()}-${String(
          testing.entity_id
        )}`;

        if (!map[key]) {
          map[key] = [];
        }

        map[key].push(testing);
      }
    );

    Object.keys(map).forEach(
      (key) => {
        map[key].sort(
          (a, b) =>
            new Date(
              b.created_at || 0
            ) -
            new Date(
              a.created_at || 0
            )
        );
      }
    );

    return map;
  }, [testingRecords]);

  // =========================================================
  // GET TESTING RECORDS
  // =========================================================

  const getTestingRecords = useCallback(
    (entity) => {
      if (!entity) {
        return [];
      }

      const key = `${entity.source}-${String(
        entity.sourceId
      )}`;

      return (
        testingMap[key] || []
      );
    },
    [testingMap]
  );

  // =========================================================
  // GET LATEST TESTING
  // =========================================================

  const getLatestTesting = useCallback(
    (entity) => {
      const records =
        getTestingRecords(
          entity
        );

      return records[0] || null;
    },
    [getTestingRecords]
  );

  // =========================================================
  // GET QUALITY DESCRIPTION
  // =========================================================

  const getQualityDescription =
    useCallback(
      (testing) => {
        if (
          !testing?.quality_description_id
        ) {
          return null;
        }

        return (
          qualityMap[
            String(
              testing.quality_description_id
            )
          ] || null
        );
      },
      [qualityMap]
    );

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const filteredEntities =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return entities.filter(
        (entity) => {
          const latestTesting =
            getLatestTesting(
              entity
            );

          const status =
            latestTesting?.status ||
            "NOT_REQUESTED";

          const quality =
            getQualityDescription(
              latestTesting
            );

          const searchableValues = [
            entity.source,
            entity.displayId,
            entity.sourceId,
            entity.companyName,
            entity.accountManager,
            status,
            quality?.description,
            quality?.country,
          ];

          const matchesSearch =
            !searchValue ||
            searchableValues.some(
              (value) =>
                String(
                  value ?? ""
                )
                  .toLowerCase()
                  .includes(
                    searchValue
                  )
            );

          const matchesStatus =
            !statusFilter ||
            status ===
              statusFilter;

          const matchesQuality =
            !qualityFilter ||
            String(
              latestTesting?.quality_description_id ||
                ""
            ) ===
              String(
                qualityFilter
              );

          const matchesEntity =
            !entityFilter ||
            entity.source ===
              entityFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesQuality &&
            matchesEntity
          );
        }
      );
    }, [
      entities,
      search,
      statusFilter,
      qualityFilter,
      entityFilter,
      getLatestTesting,
      getQualityDescription,
    ]);

  // =========================================================
  // SELECTED ENTITY ONLY / TESTING REQUESTS
  // =========================================================

  const displayedEntities =
    useMemo(() => {
      /*
       * If an entity has been selected, preserve the
       * original behavior and show only that entity.
       *
       * If no entity has been selected, show only entities
       * that already have at least one testing request.
       *
       * This is the only table-display behavior change.
       */
      if (selectedEntity) {
        return filteredEntities.filter(
          (entity) =>
            entity.source ===
              selectedEntity.source &&
            String(entity.sourceId) ===
              String(selectedEntity.sourceId)
        );
      }

      return filteredEntities.filter(
        (entity) =>
          getLatestTesting(entity)
      );
    }, [
      filteredEntities,
      selectedEntity,
      getLatestTesting,
    ]);

  // =========================================================
  // FIND ENTITY BY TYPED ID
  // =========================================================

  const findEntityByTypedId = () => {
    setEntitySearchError("");

    const typedId =
      entityIdInput.trim();

    if (!typedId) {
      setEntitySearchError(
        "Please enter an ID."
      );
      return;
    }

    const normalizedId =
      typedId.toLowerCase();

    let matchingEntity =
      null;

    if (entityTypeToAdd === "LEAD") {
      matchingEntity =
        entities.find(
          (entity) =>
            entity.source ===
              "LEAD" &&
            (
              String(
                entity.displayId
              ).toLowerCase() ===
                normalizedId ||
              String(
                entity.sourceId
              ).toLowerCase() ===
                normalizedId
            )
        );
    }

    if (
      entityTypeToAdd ===
      "CUSTOMER"
    ) {
      matchingEntity =
        entities.find(
          (entity) =>
            entity.source ===
              "CUSTOMER" &&
            (
              String(
                entity.displayId
              ).toLowerCase() ===
                normalizedId ||
              String(
                entity.sourceId
              ).toLowerCase() ===
                normalizedId
            )
        );
    }

    if (
      entityTypeToAdd ===
      "VENDOR"
    ) {
      matchingEntity =
        entities.find(
          (entity) =>
            entity.source ===
              "VENDOR" &&
            (
              String(
                entity.displayId
              ).toLowerCase() ===
                normalizedId ||
              String(
                entity.sourceId
              ).toLowerCase() ===
                normalizedId
            )
        );
    }

    if (!matchingEntity) {
      setEntitySearchError(
        `No ${entityTypeToAdd.toLowerCase()} found with ID "${typedId}".`
      );
      return;
    }

    // Only the selected entity will be displayed.
    setSelectedEntity(
      matchingEntity
    );

    setEntityIdInput("");
    setEntitySearchError("");
    setShowAddSelector(false);

    setSearch("");
    setStatusFilter("");
    setQualityFilter("");
    setEntityFilter("");

    setSuccess(
      `${matchingEntity.source} ${matchingEntity.displayId} selected successfully.`
    );
    setError("");
  };

  // =========================================================
  // CLEAR SELECTED ENTITY
  // =========================================================

  const clearSelectedEntity = () => {
    setSelectedEntity(null);
    setSelectedTesting(null);
    setShowAddSelector(false);
    setEntityIdInput("");
    setEntitySearchError("");
    setSearch("");
    setStatusFilter("");
    setQualityFilter("");
    setEntityFilter("");
    setSuccess("");
    setError("");
    setOpenMenu(null);
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const selectedTestingRecords =
    selectedEntity
      ? getTestingRecords(
          selectedEntity
        )
      : [];

  const totalRequests =
    selectedEntity
      ? selectedTestingRecords.length
      : 0;

  const testingCount =
    selectedTestingRecords.filter(
      (item) =>
        item.status ===
        "TESTING"
    ).length;

  const successCount =
    selectedTestingRecords.filter(
      (item) =>
        item.status ===
        "TEST_SUCCESS"
    ).length;

  const failedCount =
    selectedTestingRecords.filter(
      (item) =>
        item.status ===
        "TEST_FAILED"
    ).length;

  const terminatedCount =
    selectedTestingRecords.filter(
      (item) =>
        item.status ===
        "TEST_TERMINATED"
    ).length;

  // =========================================================
  // OPEN DETAILS
  // =========================================================

  const openDetails = (
    entity,
    testing = null
  ) => {
    setSelectedEntity(
      entity
    );

    setSelectedTesting(
      testing
    );

    setTestingType(
      testing?.testing_type ||
        "ROUTE_TESTING"
    );

    setTestingStatus(
      testing?.status ||
        "TESTING"
    );

    setTestingDetails(
      testing?.testing_details ||
        ""
    );

    setTerminationReason(
      testing?.termination_reason ||
        ""
    );

    setQualityDescriptionId(
      testing?.quality_description_id
        ? String(
            testing.quality_description_id
          )
        : ""
    );

    setError("");
    setSuccess("");
    setOpenMenu(null);

    setShowDetailsModal(
      true
    );
  };

  // =========================================================
  // REQUEST TESTING
  // =========================================================

  const requestTesting = (
    entity
  ) => {
    if (!entity) {
      return;
    }

    setSelectedEntity(
      entity
    );

    setSelectedTesting(
      null
    );

    setTestingType(
      "ROUTE_TESTING"
    );

    setTestingStatus(
      "TESTING"
    );

    setTestingDetails(
      ""
    );

    setTerminationReason(
      ""
    );

    setQualityDescriptionId(
      ""
    );

    setError("");
    setSuccess("");
    setOpenMenu(null);

    setShowDetailsModal(
      true
    );
  };

  // =========================================================
  // SAVE TESTING
  // =========================================================

  const handleSaveTesting =
    async (event) => {
      event.preventDefault();

      if (
        !selectedEntity
      ) {
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");

      try {
        if (
          testingStatus ===
            "TEST_TERMINATED" &&
          !terminationReason.trim()
        ) {
          throw new Error(
            "Please enter the reason for termination."
          );
        }

        const payload = {
          entity_type:
            selectedEntity.source,

          entity_id:
            selectedEntity.sourceId,

          status:
            testingStatus,

          testing_type:
            testingType ||
            null,

          quality_description_id:
            qualityDescriptionId
              ? Number(
                  qualityDescriptionId
                )
              : null,

          testing_details:
            testingDetails.trim() ||
            null,

          termination_reason:
            testingStatus ===
            "TEST_TERMINATED"
              ? terminationReason.trim()
              : null,

          requested_at:
            selectedTesting?.requested_at ||
            new Date().toISOString(),

          completed_at:
            [
              "TEST_SUCCESS",
              "TEST_FAILED",
              "TEST_TERMINATED",
            ].includes(
              testingStatus
            )
              ? new Date().toISOString()
              : null,

          updated_at:
            new Date().toISOString(),
        };

        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        if (
          selectedTesting
        ) {
          const {
            error: updateError,
          } = await supabase
            .from(TESTING_TABLE)
            .update(payload)
            .eq(
              "id",
              selectedTesting.id
            );

          if (updateError) {
            throw updateError;
          }

          setSuccess(
            "Testing details updated successfully."
          );
        }

        // -----------------------------------------------------
        // INSERT
        // -----------------------------------------------------

        else {
          const {
            error: insertError,
          } = await supabase
            .from(TESTING_TABLE)
            .insert([
              payload,
            ]);

          if (insertError) {
            throw insertError;
          }

          setSuccess(
            "Testing request created successfully."
          );
        }

        await fetchData();

        if (
          selectedTesting
        ) {
          setSelectedTesting({
            ...selectedTesting,
            ...payload,
          });
        }
      } catch (err) {
        console.error(
          "Testing save error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save testing details."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDeleteTesting =
    async (testing) => {
      if (!testing?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this testing record?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        const {
          error: deleteError,
        } = await supabase
          .from(TESTING_TABLE)
          .delete()
          .eq(
            "id",
            testing.id
          );

        if (deleteError) {
          throw deleteError;
        }

        setSuccess(
          "Testing record deleted successfully."
        );

        setOpenMenu(null);

        if (
          selectedTesting?.id ===
          testing.id
        ) {
          setShowDetailsModal(
            false
          );

          setSelectedTesting(
            null
          );
        }

        await fetchData();
      } catch (err) {
        console.error(
          "Delete testing error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete testing record."
        );
      }
    };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (
    status
  ) => {
    switch (
      status
    ) {
      case "TEST_SUCCESS":
        return "text-green-700 bg-green-50 border-green-200";

      case "TEST_FAILED":
        return "text-red-700 bg-red-50 border-red-200";

      case "TEST_TERMINATED":
        return "text-gray-700 bg-gray-100 border-gray-200";

      case "TESTING":
        return "text-blue-700 bg-blue-50 border-blue-200";

      case "PENDING":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";

      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  // =========================================================
  // ENTITY STYLE
  // =========================================================

  const getEntityStyle = (
    type
  ) => {
    switch (
      type
    ) {
      case "LEAD":
        return "text-blue-700";

      case "CUSTOMER":
        return "text-green-700";

      case "VENDOR":
        return "text-purple-700";

      default:
        return "text-gray-600";
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowDetailsModal(
      false
    );

    setSelectedTesting(
      null
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="h-16 bg-white border-b border-gray-300 flex items-center px-6">

        <div>
          <h1 className="text-base font-semibold text-gray-900">
            CloudCRM
          </h1>

          <p className="text-xs text-gray-500">
            Testing Management
          </p>
        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="p-6">

        {/* PAGE HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Testing
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage testing requests for leads,
              customers and vendors.
            </p>
          </div>

          {/* ADD BUTTON */}

          <button
            type="button"
            onClick={() => {
              setShowAddSelector(
                !showAddSelector
              );

              setEntitySearchError("");
              setEntityIdInput("");
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Add Testing
          </button>

        </div>

        {/* =====================================================
            ADD TESTING SELECTOR
        ===================================================== */}

        {showAddSelector && (
          <div className="bg-white border border-gray-300 rounded-lg p-5 mb-5 shadow-sm">

            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Add Testing
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Enter one Lead, Customer or Vendor ID
                  to load that record.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddSelector(false);
                  setEntityIdInput("");
                  setEntitySearchError("");
                }}
                className="w-8 h-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">

              {/* ENTITY TYPE */}

              <select
                value={
                  entityTypeToAdd
                }
                onChange={(e) => {
                  setEntityTypeToAdd(
                    e.target.value
                  );

                  setEntityIdInput("");
                  setEntitySearchError("");
                }}
                className="h-11 px-3 border border-gray-300 rounded-md bg-white text-sm outline-none focus:border-black"
              >

                {ENTITY_TYPES.map(
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

              {/* ID INPUT */}

              <input
                type="text"
                value={
                  entityIdInput
                }
                onChange={(e) => {
                  setEntityIdInput(
                    e.target.value
                  );

                  setEntitySearchError("");
                }}
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    e.preventDefault();
                    findEntityByTypedId();
                  }
                }}
                placeholder={`Enter ${entityTypeToAdd.toLowerCase()} ID...`}
                className="h-11 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
              />

              {/* FIND BUTTON */}

              <button
                type="button"
                onClick={
                  findEntityByTypedId
                }
                className="h-11 px-5 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800"
              >
                Add
              </button>

            </div>

            {entitySearchError && (
              <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {entitySearchError}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              Example: Enter the existing Lead ID,
              Customer ID or Vendor ID. Only that selected
              record will appear on this page.
            </div>

          </div>
        )}

        {/* =====================================================
            SELECTED ENTITY BAR
        ===================================================== */}

        {selectedEntity && (
          <div className="bg-white border border-gray-300 rounded-lg px-5 py-4 mb-5">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <span
                    className={`text-xs font-bold ${getEntityStyle(
                      selectedEntity.source
                    )}`}
                  >
                    {selectedEntity.source}
                  </span>

                  <span className="text-gray-300">
                    /
                  </span>

                  <span className="text-sm font-bold text-gray-900">
                    {selectedEntity.displayId}
                  </span>

                </div>

                <p className="text-sm text-gray-700 mt-1">
                  {selectedEntity.companyName}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Account Manager:{" "}
                  {selectedEntity.accountManager}
                </p>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowAddSelector(
                      true
                    );
                    setEntityTypeToAdd(
                      "LEAD"
                    );
                    setEntityIdInput("");
                    setEntitySearchError("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Change
                </button>

                <button
                  type="button"
                  onClick={
                    clearSelectedEntity
                  }
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Clear
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ALERT */}

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">

          <SummaryCard
            label="Total Requests"
            value={
              totalRequests
            }
          />

          <SummaryCard
            label="Testing"
            value={
              testingCount
            }
          />

          <SummaryCard
            label="Success"
            value={
              successCount
            }
          />

          <SummaryCard
            label="Failed"
            value={
              failedCount
            }
          />

          <SummaryCard
            label="Terminated"
            value={
              terminatedCount
            }
          />

        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="bg-white border border-gray-300 rounded-md p-3 mb-4">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            {/* SEARCH */}

            <input
              type="text"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search ID, company or manager..."
              className="h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-black"
            />

            {/* STATUS */}

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                All Testing Status
              </option>

              {TESTING_STATUSES.map(
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

            {/* QUALITY FILTER */}

            <select
              value={
                qualityFilter
              }
              onChange={(e) =>
                setQualityFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                All Quality Descriptions
              </option>

              {qualityDescriptions.map(
                (quality) => (
                  <option
                    key={
                      quality.id
                    }
                    value={
                      quality.id
                    }
                  >
                    {
                      quality.description
                    }
                  </option>
                )
              )}

            </select>

            {/* ENTITY */}

            <select
              value={
                entityFilter
              }
              onChange={(e) =>
                setEntityFilter(
                  e.target.value
                )
              }
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >

              <option value="">
                Lead / Customer / Vendor
              </option>

              {ENTITY_TYPES.map(
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

          </div>

        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible">

          {loading ? (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      ID
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Company
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Account Manager
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Testing Status
                    </th>

                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center"
                    >

                      <div className="w-7 h-7 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />

                      <p className="text-sm text-gray-500">
                        Loading leads, customers,
                        vendors and testing...
                      </p>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      ID
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Company
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Account Manager
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Testing Status
                    </th>

                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {!loading &&
                    displayedEntities.length ===
                      0 && (
                      <tr>

                        <td
                          colSpan="6"
                          className="px-5 py-12 text-center"
                        >

                          <p className="text-sm font-medium text-gray-700">
                            No testing request found
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Click Add Testing
                            to create one for a
                            Lead, Customer or Vendor.
                          </p>

                        </td>

                      </tr>
                    )}

                  {/* DATA */}

                  {!loading &&
                    displayedEntities.map(
                      (entity) => {
                        const latestTesting =
                          getLatestTesting(
                            entity
                          );

                        const status =
                          latestTesting?.status ||
                          "NOT_REQUESTED";

                        return (
                          <tr
                            key={`${entity.source}-${entity.sourceId}`}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >

                            {/* ID */}

                            <td className="px-5 py-4">

                              <p className="text-sm font-semibold text-gray-900">
                                {
                                  entity.displayId
                                }
                              </p>

                              <p className="text-[10px] text-gray-400 mt-1">
                                DB ID:{" "}
                                {
                                  entity.sourceId
                                }
                              </p>

                            </td>

                            {/* TYPE */}

                            <td className="px-5 py-4">

                              <span
                                className={`inline-flex px-2.5 py-1 text-xs font-semibold ${getEntityStyle(
                                  entity.source
                                )}`}
                              >
                                {
                                  entity.source
                                }
                              </span>

                            </td>

                            {/* COMPANY */}

                            <td className="px-5 py-4">

                              <p className="text-sm font-semibold text-gray-900">
                                {
                                  entity.companyName
                                }
                              </p>

                              {entity.companyId && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Company ID:{" "}
                                  {
                                    entity.companyId
                                  }
                                </p>
                              )}

                            </td>

                            {/* MANAGER */}

                            <td className="px-5 py-4">

                              <span className="text-sm text-gray-700">
                                {
                                  entity.accountManager
                                }
                              </span>

                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">

                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
                                  status
                                )}`}
                              >
                                {
                                  status
                                }
                              </span>

                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-4">

                              <div className="flex justify-end items-center gap-2 relative">

                                {/* REQUEST */}

                                {!latestTesting && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestTesting(
                                        entity
                                      )
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-black rounded-md hover:bg-gray-800"
                                  >
                                    Request Testing
                                  </button>
                                )}

                                {/* VIEW / UPDATE */}

                                {latestTesting && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openDetails(
                                        entity,
                                        latestTesting
                                      )
                                    }
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                                  >
                                    {status ===
                                    "TEST_SUCCESS"
                                      ? "View Success"
                                      : status ===
                                        "TEST_FAILED"
                                      ? "View Failed"
                                      : status ===
                                        "TEST_TERMINATED"
                                      ? "View Terminated"
                                      : "View Testing"}
                                  </button>
                                )}

                                {/* THREE DOT */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu ===
                                        `${entity.source}-${entity.sourceId}`
                                        ? null
                                        : `${entity.source}-${entity.sourceId}`
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600 text-lg"
                                >
                                  ⋮
                                </button>

                                {/* MENU */}

                                {openMenu ===
                                  `${entity.source}-${entity.sourceId}` && (
                                  <div className="absolute right-0 top-10 z-30 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">

                                    {!latestTesting && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          requestTesting(
                                            entity
                                          )
                                        }
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                      >
                                        Request Testing
                                      </button>
                                    )}

                                    {latestTesting && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openDetails(
                                              entity,
                                              latestTesting
                                            )
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                          Edit Testing
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openDetails(
                                              entity,
                                              latestTesting
                                            )
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                          View Details
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteTesting(
                                              latestTesting
                                            )
                                          }
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                          Delete Testing
                                        </button>
                                      </>
                                    )}

                                  </div>
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </main>

      {/* =====================================================
          DETAILS / REQUEST MODAL
      ===================================================== */}

      {showDetailsModal &&
        selectedEntity && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">

              {/* HEADER */}

              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-lg font-bold text-gray-900">

                    {selectedTesting
                      ? "Testing Details"
                      : "Request Testing"}

                  </h2>

                  <p className="text-xs text-gray-500 mt-1">

                    {
                      selectedEntity.source
                    }{" "}
                    ID:{" "}

                    {
                      selectedEntity.displayId
                    }

                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  ×
                </button>

              </div>

              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  <InfoItem
                    label={`${selectedEntity.source} ID`}
                    value={
                      selectedEntity.displayId
                    }
                  />

                  <InfoItem
                    label="Company"
                    value={
                      selectedEntity.companyName
                    }
                  />

                  <InfoItem
                    label="Account Manager"
                    value={
                      selectedEntity.accountManager
                    }
                  />

                  <InfoItem
                    label="Record Type"
                    value={
                      selectedEntity.source
                    }
                  />

                  <InfoItem
                    label="Company ID"
                    value={
                      selectedEntity.companyId
                    }
                  />

                  <InfoItem
                    label="Quality Description"
                    value={
                      qualityDescriptionId
                        ? qualityMap[
                            String(
                              qualityDescriptionId
                            )
                          ]?.description
                        : "Not selected"
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={
                  handleSaveTesting
                }
                className="p-6"
              >

                {/* TESTING TYPE */}

                <div className="mb-5">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Testing Type
                  </label>

                  <select
                    value={
                      testingType
                    }
                    onChange={(e) =>
                      setTestingType(
                        e.target.value
                      )
                    }
                    className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm bg-white outline-none focus:border-black"
                  >

                    <option value="ROUTE_TESTING">
                      Route Testing
                    </option>

                    <option value="CLI_TESTING">
                      CLI Testing
                    </option>

                    <option value="DID_TESTING">
                      DID Testing
                    </option>

                    <option value="VOICE_TESTING">
                      Voice Testing
                    </option>

                    <option value="GENERAL_TESTING">
                      General Testing
                    </option>

                  </select>

                </div>

                {/* QUALITY DESCRIPTION */}

                <div className="mb-5">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quality Description
                  </label>

                  <select
                    value={
                      qualityDescriptionId
                    }
                    onChange={(e) =>
                      setQualityDescriptionId(
                        e.target.value
                      )
                    }
                    className="w-full min-h-11 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white outline-none focus:border-black"
                  >

                    <option value="">
                      Select Quality Description
                    </option>

                    {qualityDescriptions.map(
                      (quality) => (
                        <option
                          key={
                            quality.id
                          }
                          value={
                            quality.id
                          }
                        >
                          {
                            quality.description
                          }

                          {quality.country
                            ? ` — ${quality.country}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                  {qualityDescriptionId &&
                    qualityMap[
                      String(
                        qualityDescriptionId
                      )
                    ] && (
                      <div className="mt-3 p-3 rounded-md border border-blue-200 bg-blue-50">

                        <p className="text-xs font-semibold text-blue-700">
                          Selected Quality
                        </p>

                        <p className="text-sm text-blue-900 mt-1">
                          {
                            qualityMap[
                              String(
                                qualityDescriptionId
                              )
                            ]
                              ?.description
                          }
                        </p>

                        {qualityMap[
                          String(
                            qualityDescriptionId
                          )
                        ]?.country && (
                          <p className="text-xs text-blue-600 mt-1">
                            Country:{" "}
                            {
                              qualityMap[
                                String(
                                  qualityDescriptionId
                                )
                              ]
                                ?.country
                            }
                          </p>
                        )}

                      </div>
                    )}

                </div>

                {/* STATUS */}

                <div className="mb-5">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Testing Status
                  </label>

                  <select
                    value={
                      testingStatus
                    }
                    onChange={(e) =>
                      setTestingStatus(
                        e.target.value
                      )
                    }
                    className="w-full h-11 px-3 border border-gray-300 rounded-md text-sm bg-white outline-none focus:border-black"
                  >

                    {TESTING_STATUSES.map(
                      (status) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {
                            status
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* TESTING DETAILS */}

                <div className="mb-5">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Testing Details
                  </label>

                  <textarea
                    value={
                      testingDetails
                    }
                    onChange={(e) =>
                      setTestingDetails(
                        e.target.value
                      )
                    }
                    rows="7"
                    placeholder="Enter testing details, route information, test results, observations, issues found, etc..."
                    className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm outline-none resize-none focus:border-black"
                  />

                </div>

                {/* TERMINATION REASON */}

                {testingStatus ===
                  "TEST_TERMINATED" && (
                  <div className="mb-5">

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Termination
                    </label>

                    <textarea
                      value={
                        terminationReason
                      }
                      onChange={(e) =>
                        setTerminationReason(
                          e.target.value
                        )
                      }
                      rows="4"
                      placeholder="Enter why this testing was terminated..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm outline-none resize-none focus:border-black"
                    />

                  </div>
                )}

                {/* CURRENT STATUS */}

                {selectedTesting && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Current Testing Status
                        </p>

                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {
                            testingStatus
                          }
                        </p>

                      </div>

                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-semibold ${getStatusStyle(
                          testingStatus
                        )}`}
                      >
                        {
                          testingStatus
                        }
                      </span>

                    </div>

                  </div>
                )}

                {/* BUTTONS */}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-gray-200">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                    className="px-5 py-2.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="px-6 py-2.5 bg-black text-white rounded-md text-sm font-semibold disabled:opacity-50"
                  >

                    {saving
                      ? "Saving..."
                      : selectedTesting
                      ? "Update Testing"
                      : "Request Testing"}

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
// INFO ITEM
// =============================================================

function InfoItem({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-900 mt-1">
        {value || "—"}
      </p>

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

export default Testing;