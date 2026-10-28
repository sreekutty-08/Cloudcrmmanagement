import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient";

const RESOURCE_TABLE = "vendor_resources";
const VENDOR_TABLE = "vendors";
const COMPANY_TABLE = "companies";
const QUALITY_TABLE = "quality_descriptions";

function Vendorresource() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.success || ""
  );

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [qualityFilter, setQualityFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showViewVendor, setShowViewVendor] = useState(false);
  const [showEditVendor, setShowEditVendor] = useState(false);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    openUp: false,
  });

  const inputClass =
    "w-full h-10 border border-gray-300 rounded-md px-3 text-sm outline-none focus:border-gray-500";

  const selectClass =
    "w-full h-10 border border-gray-300 rounded-md px-3 text-sm bg-white outline-none focus:border-gray-500";

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        resourceResult,
        vendorResult,
        companyResult,
        qualityResult,
      ] = await Promise.all([
        supabase
          .from(RESOURCE_TABLE)
          .select(`
            id,
            vendor_id,
            buying_rate,
            star_rating,
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
          .order("id", { ascending: false }),

        supabase
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
          `),

        supabase
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
          `),

        supabase
          .from(QUALITY_TABLE)
          .select("id, description, country, status, created_at, updated_at")
          .order("id", { ascending: true }),
      ]);

      if (resourceResult.error) throw resourceResult.error;
      if (vendorResult.error) throw vendorResult.error;
      if (companyResult.error) throw companyResult.error;
      if (qualityResult.error) throw qualityResult.error;

      const vendorMap = new Map(
        (vendorResult.data || []).map((item) => [
          Number(item.id),
          item,
        ])
      );

      const companyMap = new Map(
        (companyResult.data || []).map((item) => [
          Number(item.id),
          item,
        ])
      );

      const qualityMap = new Map(
        (qualityResult.data || []).map((item) => [
          Number(item.id),
          item,
        ])
      );

      const formattedData = (resourceResult.data || []).map(
        (resource) => {
          const vendor = vendorMap.get(Number(resource.vendor_id));
          const company = vendor
            ? companyMap.get(Number(vendor.company_id))
            : null;

          const quality = resource.quality_description_id
            ? qualityMap.get(
                Number(resource.quality_description_id)
              )
            : null;

          return {
            id: resource.id,
            vendorDbId: resource.vendor_id,
            vendorId: vendor?.vendor_id || "",
            companyId: vendor?.company_id || null,
            company:
              company?.company_name ||
              vendor?.company_name ||
              "",
            accountManager:
              company?.account_manager ||
              vendor?.account_manager ||
              "",
            buyingRate: resource.buying_rate ?? "",
            starRating: Number(resource.star_rating ?? 0),
            ports: resource.ports ?? 0,
            credit: resource.credit ?? "",
            creditCurrency: resource.credit_currency || "",
            billingCycle: resource.billing_cycle || "",
            supportQuality: resource.support_quality || "GOOD",
            routeType: resource.route_type || "",
            qualityDescriptionId:
              resource.quality_description_id || null,
            qualityDescription: quality?.description || "",
            qualityCountry: quality?.country || "",
            status: resource.status || "ACTIVE",
            vendorCountry:
              vendor?.country || company?.country || "",
            website: vendor?.website || company?.website || "",
            contactPerson:
              vendor?.contact_person || company?.contact_person || "",
            phone: vendor?.phone || company?.phone || "",
            email: vendor?.email || company?.email || "",
            ipAddresses:
              vendor?.ip_addresses || company?.ip_addresses || [],
            companyDescription:
              company?.company_description || "",
            createdAt: resource.created_at || "",
            updatedAt: resource.updated_at || "",
          };
        }
      );

      setVendors(formattedData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load vendor resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const countries = useMemo(
    () => [
      ...new Set(
        vendors.map((item) => item.qualityCountry).filter(Boolean)
      ),
    ],
    [vendors]
  );

  const managers = useMemo(
    () => [
      ...new Set(
        vendors.map((item) => item.accountManager).filter(Boolean)
      ),
    ],
    [vendors]
  );

  const qualityDescriptionsFilter = useMemo(
    () => [
      ...new Set(
        vendors.map((item) => item.qualityDescription).filter(Boolean)
      ),
    ],
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return vendors.filter((vendor) => {
      const matchesSearch =
        !searchValue ||
        (vendor.company || "").toLowerCase().includes(searchValue) ||
        (vendor.vendorId || "").toLowerCase().includes(searchValue) ||
        (vendor.accountManager || "").toLowerCase().includes(searchValue) ||
        (vendor.qualityDescription || "").toLowerCase().includes(searchValue);

      return (
        matchesSearch &&
        (countryFilter === "All" ||
          vendor.qualityCountry === countryFilter) &&
        (qualityFilter === "All" ||
          vendor.qualityDescription === qualityFilter) &&
        (managerFilter === "All" ||
          vendor.accountManager === managerFilter) &&
        (statusFilter === "All" || vendor.status === statusFilter)
      );
    });
  }, [
    vendors,
    search,
    countryFilter,
    qualityFilter,
    managerFilter,
    statusFilter,
  ]);

  const groupedVendors = useMemo(() => {
    const groups = {};

    filteredVendors.forEach((vendor) => {
      const groupName =
        vendor.qualityDescription?.trim() ||
        "Quality Description Not Available";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(vendor);
    });

    return Object.entries(groups);
  }, [filteredVendors]);

  const totalVendors = useMemo(
    () =>
      new Set(
        filteredVendors.map((item) => item.vendorId).filter(Boolean)
      ).size,
    [filteredVendors]
  );

  const totalCapacity = useMemo(
    () =>
      filteredVendors.reduce(
        (total, item) => total + Number(item.ports || 0),
        0
      ),
    [filteredVendors]
  );

  const avgBuyingRate = useMemo(
    () =>
      filteredVendors.length
        ? (
            filteredVendors.reduce(
              (total, item) => total + Number(item.buyingRate || 0),
              0
            ) / filteredVendors.length
          ).toFixed(4)
        : "0.0000",
    [filteredVendors]
  );

  const healthWarnings = useMemo(
    () =>
      filteredVendors.filter(
        (item) =>
          item.supportQuality === "POOR" ||
          item.status === "INACTIVE"
      ).length,
    [filteredVendors]
  );

  const handleMenuClick = (event, vendorId) => {
    event.stopPropagation();

    if (openMenu === vendorId) {
      setOpenMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 150;
    const menuHeight = 82;

    let left = Math.max(8, rect.right - menuWidth);
    let top = rect.bottom + 4;
    let openUp = false;

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 4;
      openUp = true;
    }

    if (top < 8) {
      top = 8;
      openUp = false;
    }

    setMenuPosition({ top, left, openUp });
    setOpenMenu(vendorId);
  };

  useEffect(() => {
    if (openMenu === null) return;

    const closeMenu = () => setOpenMenu(null);

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenu]);

  const handleViewVendor = (vendor) => {
    setOpenMenu(null);
    setViewingVendor(vendor);
    setShowViewVendor(true);
  };

  const handleEditVendor = (vendor) => {
    setOpenMenu(null);
    setEditingVendor({ ...vendor });
    setShowEditVendor(true);
  };

  const handleUpdateVendor = async (event) => {
    event.preventDefault();

    if (!editingVendor?.id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let vendorDbId = editingVendor.vendorDbId;

      if (editingVendor.vendorId.trim()) {
        const { data: vendor, error: vendorError } = await supabase
          .from(VENDOR_TABLE)
          .select("id")
          .eq("vendor_id", editingVendor.vendorId.trim())
          .maybeSingle();

        if (vendorError) throw new Error(vendorError.message);

        if (!vendor) {
          throw new Error(
            "Vendor ID does not exist in the vendors table."
          );
        }

        vendorDbId = vendor.id;
      }

      let qualityDescriptionId =
        editingVendor.qualityDescriptionId || null;

      if (editingVendor.qualityDescription.trim()) {
        const { data: existingQuality, error: qualityLookupError } =
          await supabase
            .from(QUALITY_TABLE)
            .select("id")
            .ilike(
              "description",
              editingVendor.qualityDescription.trim()
            )
            .maybeSingle();

        if (qualityLookupError) throw qualityLookupError;

        if (existingQuality) {
          qualityDescriptionId = existingQuality.id;
        } else {
          const { data: createdQuality, error: qualityInsertError } =
            await supabase
              .from(QUALITY_TABLE)
              .insert([
                {
                  description:
                    editingVendor.qualityDescription.trim(),
                  country:
                    editingVendor.qualityCountry?.trim() || null,
                  status: "ACTIVE",
                },
              ])
              .select()
              .single();

          if (qualityInsertError) throw qualityInsertError;
          qualityDescriptionId = createdQuality.id;
        }
      }

      const updatedResource = {
        vendor_id: Number(vendorDbId),
        buying_rate:
          editingVendor.buyingRate === ""
            ? null
            : Number(editingVendor.buyingRate),
        star_rating: Number(editingVendor.starRating || 0),
        ports:
          editingVendor.ports === ""
            ? null
            : Number(editingVendor.ports),
        credit:
          editingVendor.credit === ""
            ? null
            : Number(editingVendor.credit),
        support_quality: editingVendor.supportQuality,
        quality_description_id: qualityDescriptionId,
        route_type: editingVendor.routeType?.trim() || null,
        billing_cycle: editingVendor.billingCycle?.trim() || null,
        status: editingVendor.status,
      };

      const { error: updateError } = await supabase
        .from(RESOURCE_TABLE)
        .update(updatedResource)
        .eq("id", editingVendor.id);

      if (updateError) throw updateError;

      setShowEditVendor(false);
      setEditingVendor(null);
      setSuccess("Vendor resource updated successfully.");
      await fetchVendors();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to update vendor resource.");
    } finally {
      setSaving(false);
    }
  };

  const handlePageClick = () => {
    if (openMenu !== null) setOpenMenu(null);
  };

  const closeView = () => {
    setShowViewVendor(false);
    setViewingVendor(null);
  };

  const closeEdit = () => {
    setShowEditVendor(false);
    setEditingVendor(null);
  };

  return (
    <div
      className="w-full min-h-full bg-[#f5f6f8] text-gray-900"
      onClick={handlePageClick}
    >
      <div
        className="bg-white border-b border-gray-200 px-5 py-3"
        onClick={(event) => event.stopPropagation()}
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="w-64 h-9 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm outline-none focus:border-gray-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/resource-management/vendors/add")
              }
              className="h-9 px-4 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
            >
              + Add Vendor
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="mx-5 mt-4 bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      <div className="px-5 py-5">
        <div className="mb-5">
          <div className="bg-white border border-gray-300 rounded-lg p-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                value={qualityFilter}
                onChange={(event) => setQualityFilter(event.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">All Quality Descriptions</option>
                {qualityDescriptionsFilter.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>

              <select
                value={managerFilter}
                onChange={(event) => setManagerFilter(event.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">All Managers</option>
                {managers.map((manager) => (
                  <option key={manager} value={manager}>
                    {manager}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-base text-gray-900 outline-none focus:border-gray-500"
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <SummaryCard label="Total Vendors" value={totalVendors} />
          <SummaryCard label="Total Capacity" value={`${totalCapacity} Ports`} />
          <SummaryCard label="Avg Buying Rate" value={avgBuyingRate} />
          <SummaryCard
            label="Vendor Warnings"
            value={healthWarnings}
            warning={healthWarnings > 0}
          />
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">
                Loading vendor resources...
              </p>
            </div>
          </div>
        ) : groupedVendors.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-12 text-center">
            <p className="text-sm text-gray-500">
              No vendor resources found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedVendors.map(([qualityDescription, groupData]) => (
              <div key={qualityDescription}>
                <div className="mb-2">
                  <h3 className="text-base font-medium text-gray-800">
                    <span className="font-normal">
                      {qualityDescription}
                    </span>
                  </h3>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
                  <div className="overflow-x-auto rounded-lg">
                    <table className="w-full min-w-[1150px] border-collapse">
                      <thead>
                        <tr className="bg-[#fafafa] border-b border-gray-200">
                          <TableHeading>Company</TableHeading>
                          <TableHeading className="hidden xl:table-cell">
                            Account Manager
                          </TableHeading>
                          <TableHeading>Vendor ID</TableHeading>
                          <TableHeading>Buying Rate</TableHeading>
                          <TableHeading>Rating</TableHeading>
                          <TableHeading>Ports</TableHeading>
                          <TableHeading className="hidden lg:table-cell">
                            Credit
                          </TableHeading>
                          <TableHeading className="hidden 2xl:table-cell">
                            Support Quality
                          </TableHeading>
                          <TableHeading>Status</TableHeading>
                          <th className="w-12 px-2" />
                        </tr>
                      </thead>

                      <tbody>
                        {groupData.map((vendor) => {
                          const inactive = vendor.status === "INACTIVE";
                          const cellClass = `px-3 py-2.5 text-sm whitespace-nowrap ${
                            inactive ? "text-red-700" : "text-gray-900"
                          }`;

                          return (
                            <tr
                              key={vendor.id}
                              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                            >
                              <td className={cellClass}>
                                {vendor.company || "-"}
                              </td>
                              <td className={`${cellClass} hidden xl:table-cell`}>
                                {vendor.accountManager || "-"}
                              </td>
                              <td className={cellClass}>
                                {vendor.vendorId || "-"}
                              </td>
                              <td className={cellClass}>
                                {vendor.buyingRate ?? "-"}
                              </td>
                              <td className={cellClass}>
                                <div
                                  className="flex items-center gap-1"
                                  aria-label={`Rating ${vendor.starRating || 0} out of 5`}
                                >
                                  <span className="text-amber-500 tracking-tight">
                                    {"★".repeat(Math.max(0, Math.min(5, Number(vendor.starRating || 0))))}
                                  </span>
                                  <span className="text-gray-300 tracking-tight">
                                    {"★".repeat(5 - Math.max(0, Math.min(5, Number(vendor.starRating || 0))))}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    {vendor.starRating || 0}/5
                                  </span>
                                </div>
                              </td>
                              <td className={cellClass}>
                                {vendor.ports ?? "-"}
                              </td>
                              <td className={`${cellClass} hidden lg:table-cell`}>
                                {vendor.credit ?? "-"}
                              </td>
                              <td className={`${cellClass} hidden 2xl:table-cell`}>
                                {vendor.supportQuality || "-"}
                              </td>
                              <td className={cellClass}>
                                {vendor.status || "-"}
                              </td>
                              <td
                                className="px-2 py-2.5 text-right"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleMenuClick(event, vendor.id)
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
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openMenu !== null &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-[150px] bg-white border border-gray-200 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const vendor = vendors.find(
                    (item) => item.id === openMenu
                  );
                  if (vendor) handleViewVendor(vendor);
                }}
                className="w-full h-[40px] px-4 flex items-center text-left text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-100"
              >
                View
              </button>

              <button
                type="button"
                onClick={() => {
                  const vendor = vendors.find(
                    (item) => item.id === openMenu
                  );
                  if (vendor) handleEditVendor(vendor);
                }}
                className="w-full h-[40px] px-4 flex items-center text-left text-sm text-gray-800 hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>,
          document.body
        )}

      {showViewVendor && viewingVendor && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
          onClick={closeView}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <ModalHeader
              title="Vendor Resource Details"
              subtitle="Complete vendor resource information"
              onClose={closeView}
            />

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Detail label="Company" value={viewingVendor.company} />
                <Detail label="Account Manager" value={viewingVendor.accountManager} />
                <Detail label="Vendor ID" value={viewingVendor.vendorId} />
                <Detail label="Buying Rate" value={viewingVendor.buyingRate} />
                <Detail label="Star Rating" value={`${viewingVendor.starRating || 0}/5 stars`} />
                <Detail label="Ports" value={viewingVendor.ports} />
                <Detail label="Credit" value={viewingVendor.credit} />
                <Detail label="Billing Cycle" value={viewingVendor.billingCycle} />
                <Detail label="Route Type" value={viewingVendor.routeType} />
                <Detail label="Quality Description" value={viewingVendor.qualityDescription} />
                <Detail label="Quality Country" value={viewingVendor.qualityCountry} />
                <Detail label="Support Quality" value={viewingVendor.supportQuality} />
                <Detail label="Status" value={viewingVendor.status} />
                <Detail label="Vendor Country" value={viewingVendor.vendorCountry} />
                <Detail label="Contact Person" value={viewingVendor.contactPerson} />
                <Detail label="Phone" value={viewingVendor.phone} />
                <Detail label="Email" value={viewingVendor.email} />
                <Detail label="Website" value={viewingVendor.website} />

                <div className="md:col-span-2">
                  <Detail
                    label="Company Description"
                    value={viewingVendor.companyDescription}
                  />
                </div>

                <div className="md:col-span-2">
                  <Detail
                    label="IP Addresses"
                    value={
                      Array.isArray(viewingVendor.ipAddresses)
                        ? viewingVendor.ipAddresses.join(", ")
                        : viewingVendor.ipAddresses
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeView}
                  className="h-10 px-5 border border-gray-300 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditVendor && editingVendor && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <ModalHeader
              title="Edit Vendor Resource"
              subtitle="Update the selected vendor resource."
              onClose={closeEdit}
            />

            <form onSubmit={handleUpdateVendor} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company">
                  <input
                    value={editingVendor.company}
                    readOnly
                    className={`${inputClass} bg-gray-100`}
                  />
                </FormField>

                <FormField label="Account Manager">
                  <input
                    value={editingVendor.accountManager}
                    readOnly
                    className={`${inputClass} bg-gray-100`}
                  />
                </FormField>

                <FormField label="Vendor ID">
                  <input
                    required
                    value={editingVendor.vendorId}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        vendorId: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Buying Rate">
                  <input
                    type="number"
                    step="0.0001"
                    value={editingVendor.buyingRate}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        buyingRate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

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
                          onClick={() =>
                            setEditingVendor({
                              ...editingVendor,
                              starRating: star,
                            })
                          }
                          className={`text-2xl leading-none ${
                            star <= Number(editingVendor.starRating || 0)
                              ? "text-amber-500"
                              : "text-gray-300"
                          }`}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          aria-pressed={Number(editingVendor.starRating || 0) === star}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {Number(editingVendor.starRating || 0)}/5
                    </span>
                  </div>
                </FormField>

                <FormField label="Ports">
                  <input
                    type="number"
                    value={editingVendor.ports}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        ports: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Credit">
                  <input
                    type="number"
                    step="0.01"
                    value={editingVendor.credit}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        credit: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Billing Cycle">
                  <input
                    value={editingVendor.billingCycle}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        billingCycle: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Route Type">
                  <input
                    value={editingVendor.routeType}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        routeType: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Quality Description">
                  <input
                    value={editingVendor.qualityDescription}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        qualityDescription: event.target.value,
                        qualityDescriptionId: null,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Quality Country">
                  <input
                    value={editingVendor.qualityCountry}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        qualityCountry: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Support Quality">
                  <select
                    value={editingVendor.supportQuality}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        supportQuality: event.target.value,
                      })
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
                    value={editingVendor.status}
                    onChange={(event) =>
                      setEditingVendor({
                        ...editingVendor,
                        status: event.target.value,
                      })
                    }
                    className={selectClass}
                  >
                    <option>ACTIVE</option>
                    <option>INACTIVE</option>
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="h-10 px-4 border border-gray-300 rounded-md text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 bg-gray-900 text-white rounded-md text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, warning = false }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
      <p className="text-sm text-gray-700">{label}</p>
      <p
        className={`text-2xl font-medium mt-1 ${
          warning ? "text-red-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TableHeading({ children, className = "" }) {
  return (
    <th
      className={`px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </th>
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

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-900 text-xl"
      >
        ×
      </button>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-md px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">
        {value !== null && value !== undefined && value !== ""
          ? value
          : "-"}
      </p>
    </div>
  );
}

export default Vendorresource;