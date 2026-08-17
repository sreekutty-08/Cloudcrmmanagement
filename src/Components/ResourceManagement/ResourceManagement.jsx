import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient";

function Vendorresource() {
  // ============================================================
  // TABLES
  // ============================================================

  const RESOURCE_TABLE = "vendor_resources";
  const VENDOR_TABLE = "vendors";
  const COMPANY_TABLE = "companies";
  const QUALITY_TABLE = "quality_descriptions";

  // ============================================================
  // DATA
  // ============================================================

  const [vendors, setVendors] = useState([]);
  const [qualityDescriptions, setQualityDescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // FILTERS
  // ============================================================

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [routeFilter, setRouteFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [qualityFilter, setQualityFilter] = useState("All");

  // ============================================================
  // MODALS
  // ============================================================

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showViewVendor, setShowViewVendor] = useState(false);
  const [showEditVendor, setShowEditVendor] = useState(false);

  const [viewingVendor, setViewingVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);

  // ============================================================
  // THREE DOT MENU
  // ============================================================

  const [openMenu, setOpenMenu] = useState(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    openUp: false,
  });

  // ============================================================
  // ADD LOOKUP
  // ============================================================

  const [vendorLookupLoading, setVendorLookupLoading] =
    useState(false);

  const [vendorLookupMessage, setVendorLookupMessage] =
    useState("");

  // ============================================================
  // QUALITY MODE
  // ============================================================

  const [qualityMode, setQualityMode] = useState("SELECT");

  // ============================================================
  // EMPTY FORM
  // ============================================================

  const emptyVendor = {
    vendorId: "",
    vendorDbId: null,

    company: "",
    accountManager: "",

    buyingRate: "",
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

  const [newVendor, setNewVendor] = useState(emptyVendor);

  // ============================================================
  // FORM CLASSES
  // ============================================================

  const inputClass =
    "w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none focus:border-gray-500";

  const selectClass =
    "w-full h-10 border border-gray-300 rounded-md px-3 text-sm bg-white outline-none focus:border-gray-500";

  // ============================================================
  // FETCH EVERYTHING
  // ============================================================

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      // ----------------------------------------------------------
      // RESOURCE DATA
      // ----------------------------------------------------------

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from(RESOURCE_TABLE)
        .select(`
          id,
          vendor_id,
          buying_rate,
          ports,
          credit,
          credit_currency,
          support_quality,
          quality_description_id,
          route_type,
          billing_cycle,
          status,
          created_at,
          updated_at
        `)
        .order("id", { ascending: false });

      if (resourceError) {
        throw new Error(resourceError.message);
      }

      // ----------------------------------------------------------
      // VENDORS
      // ----------------------------------------------------------

      const {
        data: vendorData,
        error: vendorError,
      } = await supabase
        .from(VENDOR_TABLE)
        .select(`
          id,
          company_id,
          vendor_id,
          company_name,
          account_manager,
          country,
          website,
          contact_person,
          phone,
          email,
          ip_addresses,
          status
        `);

      if (vendorError) {
        throw new Error(vendorError.message);
      }

      // ----------------------------------------------------------
      // COMPANIES
      // ----------------------------------------------------------

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from(COMPANY_TABLE)
        .select(`
          id,
          company_id,
          company_name,
          country,
          email,
          contact_person,
          phone,
          account_manager,
          status,
          company_description,
          website,
          ip_addresses
        `);

      if (companyError) {
        throw new Error(companyError.message);
      }

      // ----------------------------------------------------------
      // QUALITY DESCRIPTIONS
      // ----------------------------------------------------------

      const {
        data: qualityData,
        error: qualityError,
      } = await supabase
        .from(QUALITY_TABLE)
        .select(`
          id,
          description,
          country,
          status,
          created_at,
          updated_at
        `)
        .order("id", { ascending: true });

      if (qualityError) {
        throw new Error(qualityError.message);
      }

      setQualityDescriptions(qualityData || []);

      // ----------------------------------------------------------
      // MAP DATA
      // ----------------------------------------------------------

      const vendorsMap = new Map();

      (vendorData || []).forEach((vendor) => {
        vendorsMap.set(Number(vendor.id), vendor);
      });

      const companiesMap = new Map();

      (companyData || []).forEach((company) => {
        companiesMap.set(Number(company.id), company);
      });

      const qualityMap = new Map();

      (qualityData || []).forEach((quality) => {
        qualityMap.set(Number(quality.id), quality);
      });

      // ----------------------------------------------------------
      // FORMAT DATA
      // ----------------------------------------------------------

      const formattedData = (resourceData || []).map(
        (resource) => {
          const vendor = vendorsMap.get(
            Number(resource.vendor_id)
          );

          const company = vendor
            ? companiesMap.get(
                Number(vendor.company_id)
              )
            : null;

          const quality = resource.quality_description_id
            ? qualityMap.get(
                Number(resource.quality_description_id)
              )
            : null;

          const companyName =
            company?.company_name ||
            vendor?.company_name ||
            "";

          const accountManager =
            company?.account_manager ||
            vendor?.account_manager ||
            "";

          return {
            id: resource.id,

            vendorDbId: resource.vendor_id,

            vendorId: vendor?.vendor_id || "",

            companyId:
              vendor?.company_id || null,

            company: companyName,

            accountManager,

            buyingRate:
              resource.buying_rate ?? "",

            ports:
              resource.ports ?? 0,

            credit:
              resource.credit ?? "",

            creditCurrency:
              resource.credit_currency || "",

            billingCycle:
              resource.billing_cycle || "",

            supportQuality:
              resource.support_quality || "GOOD",

            routeType:
              resource.route_type || "",

            qualityDescriptionId:
              resource.quality_description_id || null,

            qualityDescription:
              quality?.description || "",

            qualityCountry:
              quality?.country || "",

            status:
              resource.status || "ACTIVE",

            vendorCountry:
              vendor?.country ||
              company?.country ||
              "",

            website:
              vendor?.website ||
              company?.website ||
              "",

            contactPerson:
              vendor?.contact_person ||
              company?.contact_person ||
              "",

            phone:
              vendor?.phone ||
              company?.phone ||
              "",

            email:
              vendor?.email ||
              company?.email ||
              "",

            ipAddresses:
              vendor?.ip_addresses ||
              company?.ip_addresses ||
              [],

            companyDescription:
              company?.company_description ||
              "",

            createdAt:
              resource.created_at || "",

            updatedAt:
              resource.updated_at || "",
          };
        }
      );

      setVendors(formattedData);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load vendor resources."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchVendors();
  }, []);

  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  const countries = useMemo(() => {
    return [
      ...new Set(
        vendors
          .map((item) => item.qualityCountry)
          .filter(Boolean)
      ),
    ];
  }, [vendors]);

  const managers = useMemo(() => {
    return [
      ...new Set(
        vendors
          .map((item) => item.accountManager)
          .filter(Boolean)
      ),
    ];
  }, [vendors]);

  const routeTypes = useMemo(() => {
    return [
      ...new Set(
        vendors
          .map((item) => item.routeType)
          .filter(Boolean)
      ),
    ];
  }, [vendors]);

  // ============================================================
  // QUALITY DESCRIPTION FILTER OPTIONS
  // ============================================================

  const qualityFilters = useMemo(() => {
    return [
      ...new Set(
        vendors
          .map((item) => item.qualityDescription)
          .filter(Boolean)
      ),
    ];
  }, [vendors]);

  // ============================================================
  // FILTER DATA
  // ============================================================

  const filteredVendors = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    return vendors.filter((vendor) => {
      const matchesSearch =
        !searchValue ||
        vendor.company
          .toLowerCase()
          .includes(searchValue) ||
        vendor.vendorId
          .toLowerCase()
          .includes(searchValue) ||
        vendor.accountManager
          .toLowerCase()
          .includes(searchValue) ||
        vendor.qualityDescription
          .toLowerCase()
          .includes(searchValue);

      const matchesCountry =
        countryFilter === "All" ||
        vendor.qualityCountry === countryFilter;

      const matchesRoute =
        routeFilter === "All" ||
        vendor.routeType === routeFilter;

      const matchesManager =
        managerFilter === "All" ||
        vendor.accountManager === managerFilter;

      const matchesQuality =
        qualityFilter === "All" ||
        vendor.qualityDescription === qualityFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesRoute &&
        matchesManager &&
        matchesQuality
      );
    });
  }, [
    vendors,
    search,
    countryFilter,
    routeFilter,
    managerFilter,
    qualityFilter,
  ]);

  // ============================================================
  // GROUP BY QUALITY
  // ============================================================

  const groupedVendors = useMemo(() => {
    const groups = {};

    filteredVendors.forEach((vendor) => {
      const groupName =
        vendor.qualityDescription?.trim() ||
        "Quality Description Not Available";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(vendor);
    });

    return Object.entries(groups);
  }, [filteredVendors]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalVendors = new Set(
    filteredVendors
      .map((item) => item.vendorId)
      .filter(Boolean)
  ).size;

  const totalCapacity = filteredVendors.reduce(
    (total, item) =>
      total + Number(item.ports || 0),
    0
  );

  const avgBuyingRate =
    filteredVendors.length > 0
      ? (
          filteredVendors.reduce(
            (total, item) =>
              total +
              Number(item.buyingRate || 0),
            0
          ) / filteredVendors.length
        ).toFixed(4)
      : "0.0000";

  const healthWarnings =
    filteredVendors.filter(
      (item) =>
        item.supportQuality === "POOR" ||
        item.status === "INACTIVE"
    ).length;

  // ============================================================
  // THREE DOT MENU POSITION
  // ============================================================

  const handleMenuClick = (event, vendorId) => {
    event.stopPropagation();

    if (openMenu === vendorId) {
      setOpenMenu(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 82;

    let left =
      buttonRect.right - menuWidth;

    let top =
      buttonRect.bottom + 4;

    let openUp = false;

    if (left < 8) {
      left = 8;
    }

    if (
      left + menuWidth >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        menuWidth -
        8;
    }

    if (
      top + menuHeight >
      window.innerHeight - 8
    ) {
      top =
        buttonRect.top -
        menuHeight -
        4;

      openUp = true;
    }

    if (top < 8) {
      top = 8;
      openUp = false;
    }

    setMenuPosition({
      top,
      left,
      openUp,
    });

    setOpenMenu(vendorId);
  };

  // ============================================================
  // CLOSE MENU ON SCROLL / RESIZE
  // ============================================================

  useEffect(() => {
    if (openMenu === null) {
      return;
    }

    const closeMenu = () => {
      setOpenMenu(null);
    };

    window.addEventListener(
      "scroll",
      closeMenu,
      true
    );

    window.addEventListener(
      "resize",
      closeMenu
    );

    return () => {
      window.removeEventListener(
        "scroll",
        closeMenu,
        true
      );

      window.removeEventListener(
        "resize",
        closeMenu
      );
    };
  }, [openMenu]);

  // ============================================================
  // LOOKUP VENDOR
  // ============================================================

  const handleVendorIdLookup = async (value) => {
    setNewVendor((previous) => ({
      ...previous,
      vendorId: value,
      vendorDbId: null,
      company: "",
      accountManager: "",
    }));

    setVendorLookupMessage("");

    if (!value.trim()) {
      return;
    }

    try {
      setVendorLookupLoading(true);

      const {
        data: vendor,
        error: vendorError,
      } = await supabase
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
        setVendorLookupMessage(
          vendorError.message
        );

        return;
      }

      if (!vendor) {
        setVendorLookupMessage(
          "Vendor ID not found."
        );

        return;
      }

      let companyName =
        vendor.company_name || "";

      let accountManager =
        vendor.account_manager || "";

      if (vendor.company_id) {
        const {
          data: company,
        } = await supabase
          .from(COMPANY_TABLE)
          .select(`
            id,
            company_name,
            account_manager
          `)
          .eq(
            "id",
            vendor.company_id
          )
          .maybeSingle();

        if (company) {
          companyName =
            company.company_name ||
            companyName;

          accountManager =
            company.account_manager ||
            accountManager;
        }
      }

      setNewVendor((previous) => ({
        ...previous,

        vendorId:
          vendor.vendor_id ||
          value.trim(),

        vendorDbId: vendor.id,

        company: companyName,

        accountManager,
      }));

      if (!companyName) {
        setVendorLookupMessage(
          "Vendor found, but company information is empty."
        );
      } else {
        setVendorLookupMessage(
          "Vendor details loaded successfully."
        );
      }
    } catch (err) {
      console.error(err);

      setVendorLookupMessage(
        "Unable to fetch vendor details."
      );
    } finally {
      setVendorLookupLoading(false);
    }
  };

  // ============================================================
  // QUALITY DESCRIPTION CHANGE
  // ============================================================

  const handleQualityDescriptionChange = (
    value
  ) => {
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

    const selected =
      qualityDescriptions.find(
        (item) =>
          String(item.id) ===
          String(value)
      );

    if (!selected) {
      return;
    }

    setQualityMode("SELECT");

    setNewVendor((previous) => ({
      ...previous,

      qualityDescriptionId:
        selected.id,

      qualityDescription:
        selected.description || "",

      qualityCountry:
        selected.country || "",
    }));
  };

  // ============================================================
  // CREATE QUALITY IF NEEDED
  // ============================================================

  const createQualityDescriptionIfNeeded =
    async () => {
      if (
        newVendor.qualityDescriptionId
      ) {
        return newVendor.qualityDescriptionId;
      }

      if (
        !newVendor.qualityDescription.trim()
      ) {
        return null;
      }

      const {
        data: existing,
      } = await supabase
        .from(QUALITY_TABLE)
        .select(
          "id, description, country"
        )
        .ilike(
          "description",
          newVendor.qualityDescription.trim()
        )
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      const {
        data: created,
        error: createError,
      } = await supabase
        .from(QUALITY_TABLE)
        .insert([
          {
            description:
              newVendor.qualityDescription.trim(),

            country:
              newVendor.qualityCountry.trim() ||
              null,

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

  // ============================================================
  // ADD VENDOR
  // ============================================================

  const handleAddVendor = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!newVendor.vendorId.trim()) {
        setError(
          "Please enter a Vendor ID."
        );

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

      if (
        newVendor.qualityDescription.trim()
      ) {
        qualityDescriptionId =
          await createQualityDescriptionIfNeeded();
      }

      const resourceToInsert = {
        vendor_id:
          Number(newVendor.vendorDbId),

        buying_rate:
          newVendor.buyingRate === ""
            ? null
            : Number(
                newVendor.buyingRate
              ),

        ports:
          newVendor.ports === ""
            ? null
            : Number(
                newVendor.ports
              ),

        credit:
          newVendor.credit === ""
            ? null
            : Number(
                newVendor.credit
              ),

        support_quality:
          newVendor.supportQuality ||
          "GOOD",

        quality_description_id:
          qualityDescriptionId,

        route_type:
          newVendor.routeType.trim() ||
          null,

        billing_cycle:
          newVendor.billingCycle.trim() ||
          null,

        status:
          newVendor.status || "ACTIVE",
      };

      const {
        error: insertError,
      } = await supabase
        .from(RESOURCE_TABLE)
        .insert([resourceToInsert])
        .select()
        .single();

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      setShowAddVendor(false);
      setNewVendor(emptyVendor);
      setQualityMode("SELECT");
      setVendorLookupMessage("");

      setSuccess(
        "Vendor resource added successfully."
      );

      await fetchVendors();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to add vendor resource."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleViewVendor = (vendor) => {
    setOpenMenu(null);
    setViewingVendor(vendor);
    setShowViewVendor(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEditVendor = (vendor) => {
    setOpenMenu(null);

    setEditingVendor({
      ...vendor,
    });

    setShowEditVendor(true);
  };

  // ============================================================
  // UPDATE
  // ============================================================

  const handleUpdateVendor = async (e) => {
    e.preventDefault();

    if (!editingVendor?.id) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let vendorDbId =
        editingVendor.vendorDbId;

      if (
        editingVendor.vendorId.trim()
      ) {
        const {
          data: vendor,
          error: vendorError,
        } = await supabase
          .from(VENDOR_TABLE)
          .select("id")
          .eq(
            "vendor_id",
            editingVendor.vendorId.trim()
          )
          .maybeSingle();

        if (vendorError) {
          throw new Error(
            vendorError.message
          );
        }

        if (!vendor) {
          throw new Error(
            "Vendor ID does not exist in the vendors table."
          );
        }

        vendorDbId = vendor.id;
      }

      let qualityDescriptionId =
        editingVendor.qualityDescriptionId ||
        null;

      if (
        editingVendor.qualityDescription.trim()
      ) {
        const {
          data: existingQuality,
        } = await supabase
          .from(QUALITY_TABLE)
          .select("id")
          .ilike(
            "description",
            editingVendor.qualityDescription.trim()
          )
          .maybeSingle();

        if (existingQuality) {
          qualityDescriptionId =
            existingQuality.id;
        } else {
          const {
            data: createdQuality,
            error: qualityInsertError,
          } = await supabase
            .from(QUALITY_TABLE)
            .insert([
              {
                description:
                  editingVendor.qualityDescription.trim(),

                country:
                  editingVendor.qualityCountry
                    ?.trim() || null,

                status: "ACTIVE",
              },
            ])
            .select()
            .single();

          if (qualityInsertError) {
            throw new Error(
              qualityInsertError.message
            );
          }

          qualityDescriptionId =
            createdQuality.id;
        }
      }

      const updatedResource = {
        vendor_id:
          Number(vendorDbId),

        buying_rate:
          editingVendor.buyingRate === ""
            ? null
            : Number(
                editingVendor.buyingRate
              ),

        ports:
          editingVendor.ports === ""
            ? null
            : Number(
                editingVendor.ports
              ),

        credit:
          editingVendor.credit === ""
            ? null
            : Number(
                editingVendor.credit
              ),

        support_quality:
          editingVendor.supportQuality,

        quality_description_id:
          qualityDescriptionId,

        route_type:
          editingVendor.routeType
            ?.trim() || null,

        billing_cycle:
          editingVendor.billingCycle
            ?.trim() || null,

        status:
          editingVendor.status,
      };

      const {
        error: updateError,
      } = await supabase
        .from(RESOURCE_TABLE)
        .update(updatedResource)
        .eq(
          "id",
          editingVendor.id
        );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setShowEditVendor(false);
      setEditingVendor(null);

      setSuccess(
        "Vendor resource updated successfully."
      );

      await fetchVendors();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to update vendor resource."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // PAGE CLICK
  // ============================================================

  const handlePageClick = () => {
    if (openMenu !== null) {
      setOpenMenu(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="w-full min-h-full bg-[#f5f6f8] text-gray-900"
      onClick={handlePageClick}
    >
      {/* ======================================================
          TOP NAVIGATION
      ======================================================= */}

      <div
        className="bg-white border-b border-gray-200 px-5 py-3"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search..."
                className="w-64 h-9 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm outline-none focus:border-gray-500"
              />

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
            </div>

            <button
              onClick={() => {
                setShowAddVendor(true);
                setNewVendor(emptyVendor);
                setQualityMode("SELECT");
                setVendorLookupMessage("");
                setError("");
              }}
              className="h-9 px-4 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
            >
              + Add Vendor
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          ALERTS
      ======================================================= */}

      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-5 mt-4 bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>{success}</span>

            <button
              onClick={() =>
                setSuccess("")
              }
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN
      ======================================================= */}

      <div className="px-5 py-5">

        {/* ====================================================
            FILTERS
        ===================================================== */}

        <div className="mb-5">
          <div className="bg-white border border-gray-300 rounded-lg p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

              {/* COUNTRY */}

              <select
                value={countryFilter}
                onChange={(e) =>
                  setCountryFilter(e.target.value)
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">
                  All Countries
                </option>

                {countries.map((country) => (
                  <option
                    key={country}
                    value={country}
                  >
                    {country}
                  </option>
                ))}
              </select>

              {/* ROUTE TYPE */}

              <select
                value={routeFilter}
                onChange={(e) =>
                  setRouteFilter(e.target.value)
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">
                  All Route Types
                </option>

                {routeTypes.map((route) => (
                  <option
                    key={route}
                    value={route}
                  >
                    {route}
                  </option>
                ))}
              </select>

              {/* MANAGER */}

              <select
                value={managerFilter}
                onChange={(e) =>
                  setManagerFilter(e.target.value)
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">
                  All Managers
                </option>

                {managers.map((manager) => (
                  <option
                    key={manager}
                    value={manager}
                  >
                    {manager}
                  </option>
                ))}
              </select>

              {/* QUALITY DESCRIPTION */}

              <select
                value={qualityFilter}
                onChange={(e) =>
                  setQualityFilter(e.target.value)
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">
                  All Quality Descriptions
                </option>

                {qualityFilters.map((quality) => (
                  <option
                    key={quality}
                    value={quality}
                  >
                    {quality}
                  </option>
                ))}
              </select>

            </div>
          </div>
        </div>

        {/* ====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

          <div className="bg-white border border-gray-200 square-lg px-4 py-4">
            <p className="text-sm text-gray-700">
              Total Vendors
            </p>

            <p className="text-2xl font-medium mt-1">
              {totalVendors}
            </p>
          </div>

          <div className="bg-white border border-gray-200 square-lg px-4 py-4">
            <p className="text-sm text-gray-700">
              Total Capacity
            </p>

            <p className="text-2xl font-medium mt-1">
              {totalCapacity} Ports
            </p>
          </div>

          <div className="bg-white border border-gray-200 square-lg px-4 py-4">
            <p className="text-sm text-gray-700">
              Avg Buying Rate
            </p>

            <p className="text-2xl font-medium mt-1">
              {avgBuyingRate}
            </p>
          </div>

          <div className="bg-white border border-gray-200 square-lg px-4 py-4">
            <p className="text-sm text-gray-700">
              Vendor Warnings
            </p>

            <p
              className={`text-2xl font-medium mt-1 ${
                healthWarnings > 0
                  ? "text-red-700"
                  : "text-gray-900"
              }`}
            >
              {healthWarnings}
            </p>
          </div>
        </div>

        {/* ====================================================
            TABLES
        ===================================================== */}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-12 text-center">
            <p className="text-sm text-gray-500">
              Loading vendor resources...
            </p>
          </div>
        ) : groupedVendors.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-12 text-center">
            <p className="text-sm text-gray-500">
              No vendor resources found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {groupedVendors.map(
              ([
                qualityDescription,
                groupData,
              ]) => (
                <div
                  key={
                    qualityDescription
                  }
                >

                  {/* GROUP TITLE */}

                  <div className="mb-2">
                    <h3 className="text-base font-medium text-gray-800">
                      <span className="font-normal">
                        {
                          qualityDescription
                        }
                      </span>
                    </h3>
                  </div>

                  {/* TABLE */}

                  <div className="bg-white border border-gray-200 square-lg overflow-visible">

                    <div className="overflow-x-auto rounded-lg">

                      <table className="w-full min-w-[1050px] border-collapse">

                        <thead>
                          <tr className="bg-[#fafafa] border-b border-gray-200">

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap">
                              Company
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap hidden xl:table-cell">
                              Account Manager
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap">
                              Vendor ID
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap">
                              Buying Rate
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap">
                              Ports
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap hidden lg:table-cell">
                              Credit
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap hidden 2xl:table-cell">
                              Support Quality
                            </th>

                            <th className="px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap">
                              Status
                            </th>

                            <th className="w-12 px-2"></th>

                          </tr>
                        </thead>

                        <tbody>

                          {groupData.map(
                            (vendor) => {
                              const inactive =
                                vendor.status ===
                                "INACTIVE";

                              return (
                                <tr
                                  key={
                                    vendor.id
                                  }
                                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                >

                                  {/* COMPANY */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.company ||
                                      "-"}
                                  </td>

                                  {/* MANAGER */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap hidden xl:table-cell ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.accountManager ||
                                      "-"}
                                  </td>

                                  {/* VENDOR ID */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.vendorId ||
                                      "-"}
                                  </td>

                                  {/* BUYING RATE */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.buyingRate ??
                                      "-"}
                                  </td>

                                  {/* PORTS */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.ports ??
                                      "-"}
                                  </td>

                                  {/* CREDIT */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap hidden lg:table-cell ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.credit ??
                                      "-"}
                                  </td>

                                  {/* SUPPORT QUALITY */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap hidden 2xl:table-cell ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.supportQuality ||
                                      "-"}
                                  </td>

                                  {/* STATUS */}

                                  <td
                                    className={`px-3 py-2.5 text-sm whitespace-nowrap ${
                                      inactive
                                        ? "text-red-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {vendor.status ||
                                      "-"}
                                  </td>

                                  {/* THREE DOT */}

                                  <td
                                    className="px-2 py-2.5 text-right"
                                    onClick={(e) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={(
                                        e
                                      ) =>
                                        handleMenuClick(
                                          e,
                                          vendor.id
                                        )
                                      }
                                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                                      aria-label="Vendor actions"
                                    >
                                      <span className="text-[20px] leading-none font-medium">
                                        ⋮
                                      </span>
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
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          THREE DOT MENU
      ======================================================= */}

      {openMenu !== null &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              className="w-[150px] bg-white border border-gray-200 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  const vendor =
                    vendors.find(
                      (item) =>
                        item.id ===
                        openMenu
                    );

                  if (vendor) {
                    handleViewVendor(
                      vendor
                    );
                  }
                }}
                className="w-full h-[40px] px-4 flex items-center text-left text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-100"
              >
                View
              </button>

              <button
                type="button"
                onClick={() => {
                  const vendor =
                    vendors.find(
                      (item) =>
                        item.id ===
                        openMenu
                    );

                  if (vendor) {
                    handleEditVendor(
                      vendor
                    );
                  }
                }}
                className="w-full h-[40px] px-4 flex items-center text-left text-sm text-gray-800 hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================
          ADD VENDOR MODAL
      ======================================================= */}

      {showAddVendor && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onClick={() =>
            setShowAddVendor(false)
          }
        >
          <div
            className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">
                  Add Vendor Resource
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter a Vendor ID to automatically load company information.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddVendor(false)
                }
                className="text-gray-500 hover:text-gray-900 text-xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleAddVendor
              }
              className="p-5"
            >

              {/* VENDOR ID */}

              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1.5">
                  Vendor ID
                </label>

                <input
                  required
                  value={
                    newVendor.vendorId
                  }
                  onChange={(e) =>
                    handleVendorIdLookup(
                      e.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Enter Vendor ID"
                />

                {vendorLookupLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fetching vendor details...
                  </p>
                )}

                {!vendorLookupLoading &&
                  vendorLookupMessage && (
                    <p
                      className={`text-xs mt-1 ${
                        vendorLookupMessage.includes(
                          "successfully"
                        )
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {
                        vendorLookupMessage
                      }
                    </p>
                  )}
              </div>

              {/* COMPANY DETAILS */}

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5">
                <h3 className="text-sm font-medium mb-3">
                  Company Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Company
                    </label>

                    <input
                      value={
                        newVendor.company
                      }
                      readOnly
                      className={`${inputClass} bg-gray-100`}
                      placeholder="Automatically fetched"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Account Manager
                    </label>

                    <input
                      value={
                        newVendor.accountManager
                      }
                      readOnly
                      className={`${inputClass} bg-gray-100`}
                      placeholder="Automatically fetched"
                    />
                  </div>

                </div>
              </div>

              {/* RESOURCE DATA */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* BUYING RATE */}

                <FormField
                  label="Buying Rate"
                >
                  <input
                    required
                    type="number"
                    step="0.0001"
                    value={
                      newVendor.buyingRate
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        buyingRate:
                          e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="0.0125"
                  />
                </FormField>

                {/* PORTS */}

                <FormField label="Ports">
                  <input
                    required
                    type="number"
                    value={
                      newVendor.ports
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        ports:
                          e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="40"
                  />
                </FormField>

                {/* CREDIT */}

                <FormField label="Credit">
                  <input
                    type="number"
                    step="0.01"
                    value={
                      newVendor.credit
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        credit:
                          e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="300"
                  />
                </FormField>

                {/* BILLING */}

                <FormField label="Billing Cycle">
                  <input
                    value={
                      newVendor.billingCycle
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        billingCycle:
                          e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="30 Days"
                  />
                </FormField>

                {/* ROUTE */}

                <FormField label="Route Type">
                  <input
                    value={
                      newVendor.routeType
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        routeType:
                          e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="CLI"
                  />
                </FormField>

                {/* QUALITY */}

                <FormField label="Quality Description">
                  <select
                    value={
                      qualityMode ===
                      "MANUAL"
                        ? "MANUAL"
                        : newVendor.qualityDescriptionId ||
                          ""
                    }
                    onChange={(e) =>
                      handleQualityDescriptionChange(
                        e.target.value
                      )
                    }
                    className={
                      selectClass
                    }
                  >
                    <option value="">
                      Select Quality Description
                    </option>

                    {qualityDescriptions
                      .filter(
                        (item) =>
                          item.status !==
                          "INACTIVE"
                      )
                      .map(
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

                    <option value="MANUAL">
                      Not available — Enter manually
                    </option>
                  </select>
                </FormField>

                {/* MANUAL QUALITY */}

                {qualityMode ===
                  "MANUAL" && (
                  <FormField label="Enter Quality Description">
                    <input
                      required
                      value={
                        newVendor.qualityDescription
                      }
                      onChange={(e) =>
                        setNewVendor({
                          ...newVendor,
                          qualityDescription:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                      placeholder="Type quality description manually"
                    />
                  </FormField>
                )}

                {/* COUNTRY */}

                <FormField label="Quality Country">
                  <input
                    value={
                      newVendor.qualityCountry
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        qualityCountry:
                          e.target.value,
                      })
                    }
                    className={
                      qualityMode ===
                      "SELECT"
                        ? `${inputClass} bg-gray-100`
                        : inputClass
                    }
                    readOnly={
                      qualityMode ===
                      "SELECT"
                    }
                    placeholder={
                      qualityMode ===
                      "SELECT"
                        ? "Automatically loaded from quality description"
                        : "Enter quality country"
                    }
                  />
                </FormField>

                {/* SUPPORT */}

                <FormField label="Support Quality">
                  <select
                    value={
                      newVendor.supportQuality
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        supportQuality:
                          e.target.value,
                      })
                    }
                    className={
                      selectClass
                    }
                  >
                    <option>
                      GOOD
                    </option>
                    <option>
                      MEDIUM
                    </option>
                    <option>
                      POOR
                    </option>
                  </select>
                </FormField>

                {/* STATUS */}

                <FormField label="Status">
                  <select
                    value={
                      newVendor.status
                    }
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        status:
                          e.target.value,
                      })
                    }
                    className={
                      selectClass
                    }
                  >
                    <option>
                      ACTIVE
                    </option>
                    <option>
                      INACTIVE
                    </option>
                  </select>
                </FormField>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddVendor(false)
                  }
                  className="h-10 px-4 border border-gray-300 rounded-md text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    vendorLookupLoading
                  }
                  className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm disabled:opacity-50"
                >
                  {saving
                    ? "Adding..."
                    : "Add Vendor"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          VIEW MODAL
      ======================================================= */}

      {showViewVendor &&
        viewingVendor && (
          <div
            className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
            onClick={() => {
              setShowViewVendor(false);
              setViewingVendor(null);
            }}
          >
            <div
              className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">
                    Vendor Resource Details
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Complete vendor resource information
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowViewVendor(
                      false
                    );
                    setViewingVendor(
                      null
                    );
                  }}
                  className="text-gray-500 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Detail
                    label="Company"
                    value={
                      viewingVendor.company
                    }
                  />

                  <Detail
                    label="Account Manager"
                    value={
                      viewingVendor.accountManager
                    }
                  />

                  <Detail
                    label="Vendor ID"
                    value={
                      viewingVendor.vendorId
                    }
                  />

                  <Detail
                    label="Buying Rate"
                    value={
                      viewingVendor.buyingRate
                    }
                  />

                  <Detail
                    label="Ports"
                    value={
                      viewingVendor.ports
                    }
                  />

                  <Detail
                    label="Credit"
                    value={
                      viewingVendor.credit
                    }
                  />

                  <Detail
                    label="Billing Cycle"
                    value={
                      viewingVendor.billingCycle
                    }
                  />

                  <Detail
                    label="Route Type"
                    value={
                      viewingVendor.routeType
                    }
                  />

                  <Detail
                    label="Quality Description"
                    value={
                      viewingVendor.qualityDescription
                    }
                  />

                  <Detail
                    label="Quality Country"
                    value={
                      viewingVendor.qualityCountry
                    }
                  />

                  <Detail
                    label="Support Quality"
                    value={
                      viewingVendor.supportQuality
                    }
                  />

                  <Detail
                    label="Status"
                    value={
                      viewingVendor.status
                    }
                  />

                  <Detail
                    label="Vendor Country"
                    value={
                      viewingVendor.vendorCountry
                    }
                  />

                  <Detail
                    label="Contact Person"
                    value={
                      viewingVendor.contactPerson
                    }
                  />

                  <Detail
                    label="Phone"
                    value={
                      viewingVendor.phone
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      viewingVendor.email
                    }
                  />

                  <Detail
                    label="Website"
                    value={
                      viewingVendor.website
                    }
                  />

                  <div className="md:col-span-2">
                    <Detail
                      label="Company Description"
                      value={
                        viewingVendor.companyDescription
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Detail
                      label="IP Addresses"
                      value={
                        Array.isArray(
                          viewingVendor.ipAddresses
                        )
                          ? viewingVendor.ipAddresses.join(
                              ", "
                            )
                          : viewingVendor.ipAddresses
                      }
                    />
                  </div>

                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowViewVendor(
                        false
                      );
                      setViewingVendor(
                        null
                      );
                    }}
                    className="h-10 px-5 border border-gray-300 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ======================================================
          EDIT MODAL
      ======================================================= */}

      {showEditVendor &&
        editingVendor && (
          <div
            className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
            onClick={() => {
              setShowEditVendor(false);
              setEditingVendor(null);
            }}
          >
            <div
              className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-medium">
                    Edit Vendor Resource
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Update the selected vendor resource.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowEditVendor(
                      false
                    );
                    setEditingVendor(
                      null
                    );
                  }}
                  className="text-gray-500 text-xl"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleUpdateVendor
                }
                className="p-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <FormField label="Company">
                    <input
                      value={
                        editingVendor.company
                      }
                      readOnly
                      className={`${inputClass} bg-gray-100`}
                    />
                  </FormField>

                  <FormField label="Account Manager">
                    <input
                      value={
                        editingVendor.accountManager
                      }
                      readOnly
                      className={`${inputClass} bg-gray-100`}
                    />
                  </FormField>

                  <FormField label="Vendor ID">
                    <input
                      required
                      value={
                        editingVendor.vendorId
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          vendorId:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Buying Rate">
                    <input
                      type="number"
                      step="0.0001"
                      value={
                        editingVendor.buyingRate
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          buyingRate:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Ports">
                    <input
                      type="number"
                      value={
                        editingVendor.ports
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          ports:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Credit">
                    <input
                      type="number"
                      step="0.01"
                      value={
                        editingVendor.credit
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          credit:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Billing Cycle">
                    <input
                      value={
                        editingVendor.billingCycle
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          billingCycle:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Route Type">
                    <input
                      value={
                        editingVendor.routeType
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          routeType:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Quality Description">
                    <input
                      value={
                        editingVendor.qualityDescription
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          qualityDescription:
                            e.target.value,
                          qualityDescriptionId:
                            null,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Quality Country">
                    <input
                      value={
                        editingVendor.qualityCountry
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          qualityCountry:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </FormField>

                  <FormField label="Support Quality">
                    <select
                      value={
                        editingVendor.supportQuality
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          supportQuality:
                            e.target.value,
                        })
                      }
                      className={
                        selectClass
                      }
                    >
                      <option>
                        GOOD
                      </option>
                      <option>
                        MEDIUM
                      </option>
                      <option>
                        POOR
                      </option>
                    </select>
                  </FormField>

                  <FormField label="Status">
                    <select
                      value={
                        editingVendor.status
                      }
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          status:
                            e.target.value,
                        })
                      }
                      className={
                        selectClass
                      }
                    >
                      <option>
                        ACTIVE
                      </option>
                      <option>
                        INACTIVE
                      </option>
                    </select>
                  </FormField>

                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">

                  <button
                    type="button"
                    onClick={() => {
                      setShowEditVendor(
                        false
                      );
                      setEditingVendor(
                        null
                      );
                    }}
                    className="h-10 px-4 border border-gray-300 rounded-md text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  children,
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">
        {label}
      </label>

      {children}
    </div>
  );
}

// ============================================================
// DETAIL
// ============================================================

function Detail({
  label,
  value,
}) {
  return (
    <div className="border border-gray-200 rounded-md px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">
        {label}
      </p>

      <p className="text-sm text-gray-900 break-words">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "-"}
      </p>
    </div>
  );
}

export default Vendorresource;