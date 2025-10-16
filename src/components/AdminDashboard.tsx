import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../supabaseClient";


// Types
// ---------------------------
interface Base {
  id: string;
  name: string;
  code: string;
  location?: string | null;
}

interface UserRow {
  name: string;
  service_id: string;
  email: string;
  role: string;
  base_id: string;
}

interface InventoryRow {
  id: string;
  base_id: string;
  category: string;
  model: string;
  stock: number;
  metadata?: any;
  transfer_in?: number;
  transfer_out?: number;
  net_movement?: number;
  current_stock?: number;
}

interface ConsignmentRow {
  ticket_id: string;
  from_base: string;
  to_base?: string | null;
  authorized_by?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  updated_by?: string | null;
  purchase_orders?: number; 
}

type LocationState = {
  email?: string;
  role?: string;
  service_id?: string;
  base_id?: string;
  name?: string;
};


//  resolving  base id -> display (name or code)  from the base table

const useBaseMap = (bases: Base[]) => {
  return useMemo(() => {
    const m: Record<string, Base> = {};
    bases.forEach((b) => (m[b.id] = b));
    return m;
  }, [bases]);
};



// Helper: resolve service_id -> user name from the user table

const useUserMap = (users: UserRow[]) => {
  return useMemo(() => {
    const m: Record<string, UserRow> = {};
    users.forEach((u) => (m[u.service_id] = u));
    return m;
  }, [users]);
};





// Main Admin Dashboard

const AdminDashboard: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { email, role, service_id, base_id, name } = (state as LocationState) || {};

  // UI state
  const [activeTab, setActiveTab] = useState<"bases" | "users" | "inventory" | "consignment">("bases");

  // Data stores
  const [bases, setBases] = useState<Base[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [consignment, setConsignment] = useState<ConsignmentRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseMap = useBaseMap(bases);
  const userMap = useUserMap(users);


  const [inventoryEdits, setInventoryEdits] = useState<Record<string, Partial<InventoryRow>>>({});
  const [consignmentEdits, setConsignmentEdits] = useState<Record<string, Partial<ConsignmentRow>>>({});

  // fetching  all required tables(users,consignment,inventory and base)
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: basesData, error: basesError } = await supabase
          .from("bases")
          .select("id, name, code, location");
        if (basesError) throw basesError;
        setBases((basesData as Base[]) || []);

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("service_id, name, email, role, base_id");
        if (usersError) throw usersError;
        setUsers((usersData as UserRow[]) || []);

        const { data: invData, error: invError } = await supabase
          .from("inventory")
          .select(
            "id, base_id, category, model, stock, metadata, transfer_in, transfer_out, net_movement, current_stock"
          );
        if (invError) throw invError;
        setInventory((invData as InventoryRow[]) || []);

        const { data: ticketsData, error: ticketsError } = await supabase
          .from("consignment")
          .select(
            "ticket_id, from_base, to_base, authorized_by, assigned_to, status, updated_by, purchase_orders" // Added purchase_orders
          );
        if (ticketsError) throw ticketsError;
        setConsignment((ticketsData as ConsignmentRow[]) || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Function to fetch updated inventory data with delay,and  then calculating  current_stock
  //as net_movement = transfer_in - transfer_out , it is automatically updated in the table in 1 sec so
  //better to fetch net_movement  after some delay  which will be used in  current_stock calculation

  const fetchUpdatedInventory = async (delayMs: number = 1500, allowReorder: boolean = true) => {
    setTimeout(async () => {
      try {
        const { data: invData, error: invError } = await supabase
          .from("inventory")
          .select(
            "id, base_id, category, model, stock, metadata, transfer_in, transfer_out, net_movement, current_stock"
          );
        if (invError) throw invError;
  
        if (invData) {
          const updated = invData.map((inv) => ({
            ...inv,
            current_stock: (inv.stock ?? 0) + (inv.transfer_in ?? 0) - (inv.transfer_out ?? 0),
          }));
  
          for (const inv of updated) {
            await supabase
              .from("inventory")
              .update({ current_stock: inv.current_stock })
              .eq("id", inv.id);
          }
  
          // the order of the rows should not shuffle or should be preserved
          setInventory((prev) => {
            if (!allowReorder) {
              const map = Object.fromEntries(updated.map((u) => [u.id, u]));
              return prev.map((item) => map[item.id] ?? item);
            }
            return updated;
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch updated inventory:", err.message);
      }
    }, delayMs);
  };

  // logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    navigate("/");
  };

  // react-hook-form  for base creation

  const { register, handleSubmit, reset } = useForm<{ name: string; code: string; location?: string }>({
    defaultValues: { name: "", code: "", location: "" },
  });

  const onCreateBase = async (vals: { name: string; code: string; location?: string }) => {
    try {
      const { data, error } = await supabase.from("bases").insert([{ ...vals }]).select();
      if (error) throw error;
      if (data && data.length) {
        setBases((p) => [...p, data[0]]);
        reset();
        setActiveTab("bases");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create base");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );


  // Edititing feature or functionality in inventory 

  const startInventoryEdit = (inv: InventoryRow) => {
    setInventoryEdits((p) => ({
      ...p,
      [inv.id]: {
        stock: inv.stock ?? 0,
        transfer_in: inv.transfer_in ?? 0,
        transfer_out: inv.transfer_out ?? 0,
      },
    }));
  };

  const updateInventoryEditField = (id: string, field: keyof InventoryRow, value: number) => {
    setInventoryEdits((p) => ({
      ...p,
      [id]: {
        ...p[id],
        [field]: value,
      },
    }));
  };

  const saveInventory = async (id: string) => {
    const edit = inventoryEdits[id];
    if (!edit) return;
  
    const orig = inventory.find((i) => i.id === id);
    if (!orig) return;
  
    const stock = edit.stock ?? orig.stock ?? 0;
    const transfer_in = edit.transfer_in ?? orig.transfer_in ?? 0;
    const transfer_out = edit.transfer_out ?? orig.transfer_out ?? 0;
  
    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          stock,
          transfer_in,
          transfer_out,
        })
        .eq("id", id);
  
      if (error) throw error;
  
      //  Preserving original order by mapping over existing array
      setInventory((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, stock, transfer_in, transfer_out }
            : item
        )
      );
  
      // Fetch updated current_stock but preserve order as net_movement gets updated after a certain delay

      await fetchUpdatedInventory(0, false);
  
      // Clearing  edit state for this record which is necessary
      setInventoryEdits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      console.error("Inventory update error:", err.message);
    }
  };

  
  // Consignment table   status AND purchase_orders are now editable by the admin 
  
  const updateConsignmentField = (ticket_id: string, field: keyof ConsignmentRow, value: any) => {
    setConsignmentEdits((p) => ({
      ...p,
      [ticket_id]: {
        ...p[ticket_id],
        [field]: value,
      },
    }));
  };

  const startConsignmentEdit = (c: ConsignmentRow) => {
    setConsignmentEdits((p) => ({
      ...p,
      [c.ticket_id]: {
        status: c.status ?? null,
        purchase_orders: c.purchase_orders ?? 0,
      },
    }));
  };

  const saveConsignment = async (ticket_id: string) => {
    const edit = consignmentEdits[ticket_id];
    if (!edit) return;

    const orig = consignment.find((c) => c.ticket_id === ticket_id);
    if (!orig) return;

    const status = edit.status ?? orig.status ?? null;
    const purchase_orders = edit.purchase_orders ?? orig.purchase_orders ?? 0;

    try {
      const { error } = await supabase
        .from("consignment")
        .update({ 
          status, 
          purchase_orders,
          updated_by: name ?? null 
        })
        .eq("ticket_id", ticket_id);
      if (error) throw error;

      setConsignment((prev) =>
        prev.map((c) =>
          c.ticket_id === ticket_id ? { 
            ...c, 
            status, 
            purchase_orders,
            updated_by: name 
          } : c
        )
      );

      setConsignmentEdits((p) => {
        const copy = { ...p };
        delete copy[ticket_id];
        return copy;
      });
    } catch (err) {
      console.error("Consignment update error:", err);
    }
  };

  // function to display user name or service_id present in the user table 
  const displayUserName = (userId: string | null | undefined): string => {
    if (!userId) return "—";
    
    
    const user = userMap[userId];
    
    // Return the user's name if the service_id matche is  found, otherwise return the ID or fallback
    return user?.name || userId || "—";
  };

  
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">

      {/* Header part */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Welcome, {name || "User"}</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            {email} • {role} {service_id ? `• service id: ${service_id}` : ""}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm text-gray-700">
              Base: {base_id ? (baseMap[base_id]?.name ?? baseMap[base_id]?.code ?? base_id) : "—"}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

    
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-1">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {(["bases", "users", "inventory", "consignment"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`${
                activeTab === t 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              } flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap mx-1`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          Error: {error}
        </div>
      )}

     
      <div className="space-y-6">
      
        {activeTab === "bases" && (
          <section className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Bases</h2>
            </div>
            
            {/*  Cards View  (Mobile)*/}
            <div className="block sm:hidden p-4 space-y-4">
              {bases.map((b) => (
                <div key={b.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Name:</span>
                      <p className="font-medium">{b.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Code:</span>
                      <p className="font-medium">{b.code}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Location:</span>
                      <p className="font-medium">{b.location || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">ID:</span>
                      <p className="text-xs text-gray-600 font-mono">{b.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Tabular View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Code</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bases.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{b.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{b.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{b.location ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Base Form Creation */}
            <div className="p-4 border-t bg-gray-50">
              <h3 className="font-medium mb-3 text-gray-800">Create new base</h3>
              <form
                onSubmit={handleSubmit(onCreateBase)}
                className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3"
              >
                <input
                  {...register("name", { required: true })}
                  placeholder="Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  {...register("code", { required: true })}
                  placeholder="Code"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  {...register("location")}
                  placeholder="Location"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Create Base
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Users table */}
        {activeTab === "users" && (
          <section className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Users</h2>
            </div>
            
            {/*  Cards View (Mobile friendly UI) */}
            <div className="block sm:hidden p-4 space-y-4">
              {users.map((u) => (
                <div key={u.service_id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Name:</span>
                      <p className="font-medium">{u.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Email:</span>
                      <p className="text-sm">{u.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Role:</span>
                      <p className="text-sm">{u.role}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Service ID:</span>
                      <p className="text-sm font-mono">{u.service_id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Base:</span>
                      <p className="text-sm">{baseMap[u.base_id]?.name ?? baseMap[u.base_id]?.code ?? u.base_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Tabular  View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Role</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Service ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.service_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{u.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{u.service_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {baseMap[u.base_id]?.name ?? baseMap[u.base_id]?.code ?? u.base_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Inventory  Table*/}
        {activeTab === "inventory" && (
          <section className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Inventory</h2>
            </div>
            
            {/* Mobile Cards View */}
            <div className="block sm:hidden p-4 space-y-4">
              {inventory.map((inv) => {
                const edit = inventoryEdits[inv.id];
                return (
                  <div key={inv.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500">Base:</span>
                        <p className="font-medium">{baseMap[inv.base_id]?.name ?? baseMap[inv.base_id]?.code ?? inv.base_id}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Category:</span>
                        <p className="text-sm">{inv.category}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Model:</span>
                        <p className="text-sm">{inv.model}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500">Stock:</span>
                          {edit ? (
                            <input
                              type="number"
                              value={edit.stock ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "stock", parseInt(e.target.value))
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            <p className="text-sm font-medium">{inv.stock}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Transfer In:</span>
                          {edit ? (
                            <input
                              type="number"
                              value={edit.transfer_in ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "transfer_in", parseInt(e.target.value))
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            <p className="text-sm font-medium">{inv.transfer_in ?? 0}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Transfer Out:</span>
                          {edit ? (
                            <input
                              type="number"
                              value={edit.transfer_out ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "transfer_out", parseInt(e.target.value))
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            <p className="text-sm font-medium">{inv.transfer_out ?? 0}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Current Stock:</span>
                          <p className="text-sm font-medium">{inv.current_stock ?? 0}</p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        {edit ? (
                          <button
                            onClick={() => saveInventory(inv.id)}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                          >
                            Save Changes
                          </button>
                        ) : (
                          <button
                            onClick={() => startInventoryEdit(inv)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            Edit Inventory
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Tabular  View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Base</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Model</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Stock</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Transfer In</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Transfer Out</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Net Movement</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Current Stock</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.map((inv) => {
                    const edit = inventoryEdits[inv.id];
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {baseMap[inv.base_id]?.name ?? baseMap[inv.base_id]?.code ?? inv.base_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.model}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {edit ? (
                            <input
                              type="number"
                              value={edit.stock ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "stock", parseInt(e.target.value))
                              }
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            inv.stock
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {edit ? (
                            <input
                              type="number"
                              value={edit.transfer_in ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "transfer_in", parseInt(e.target.value))
                              }
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            inv.transfer_in ?? 0
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {edit ? (
                            <input
                              type="number"
                              value={edit.transfer_out ?? 0}
                              onChange={(e) =>
                                updateInventoryEditField(inv.id, "transfer_out", parseInt(e.target.value))
                              }
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            inv.transfer_out ?? 0
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.net_movement ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{inv.current_stock ?? 0}</td>
                        <td className="px-4 py-3 text-sm">
                          {edit ? (
                            <button
                              onClick={() => saveInventory(inv.id)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => startInventoryEdit(inv)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Consignment  TABLE*/}
        {activeTab === "consignment" && (
          <section className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Consignments</h2>
            </div>
            
            {/*  Cards View ( Mobile)*/}
            <div className="block sm:hidden p-4 space-y-4">
              {consignment.map((t) => {
                const edit = consignmentEdits[t.ticket_id];
                return (
                  <div key={t.ticket_id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500">Ticket ID:</span>
                        <p className="font-medium text-sm font-mono">{t.ticket_id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500">From Base:</span>
                          <p className="text-sm">{baseMap[t.from_base]?.name ?? baseMap[t.from_base]?.code ?? t.from_base}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">To Base:</span>
                          <p className="text-sm">{baseMap[t.to_base ?? ""]?.name ?? baseMap[t.to_base ?? ""]?.code ?? t.to_base ?? "—"}</p>
                        </div>
                      </div>
                      
                    
                      <div>
                        <span className="text-xs text-gray-500">Purchase Orders:</span>
                        {edit ? (
                          <input
                            type="number"
                            value={edit.purchase_orders ?? 0}
                            onChange={(e) =>
                              updateConsignmentField(t.ticket_id, "purchase_orders", parseInt(e.target.value) || 0)
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
                            min="0"
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{t.purchase_orders ?? 0}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-xs text-gray-500">Status:</span>
                        {edit ? (
                          <select
                            value={edit.status ?? t.status ?? "assigned"}
                            onChange={(e) =>
                              updateConsignmentField(t.ticket_id, "status", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
                          >
                            <option value="assigned">assigned</option>
                            <option value="expired">expired</option>
                            <option value="damaged">damaged</option>
                            <option value="delivered">delivered</option>
                          </select>
                        ) : (
                          <p className={`text-sm font-medium mt-1 ${
                            t.status === 'delivered' ? 'text-green-600' :
                            t.status === 'damaged' ? 'text-red-600' :
                            t.status === 'expired' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {t.status ?? "assigned"}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500">Authorized By:</span>
                          <p className="text-sm">{displayUserName(t.authorized_by)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Assigned To:</span>
                          <p className="text-sm">{displayUserName(t.assigned_to)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Updated By:</span>
                        <p className="text-sm">{displayUserName(t.updated_by)}</p>
                      </div>
                      
                      <div className="pt-2">
                        {edit ? (
                          <button
                            onClick={() => saveConsignment(t.ticket_id)}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                          >
                            Save Changes
                          </button>
                        ) : (
                          <button
                            onClick={() => startConsignmentEdit(t)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            Edit Consignment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Tabular View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Ticket ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">From Base</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">To Base</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purchase Orders</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Authorized By</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Assigned To</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Updated By</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consignment.map((t) => {
                    const edit = consignmentEdits[t.ticket_id];
                    return (
                      <tr key={t.ticket_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{t.ticket_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {baseMap[t.from_base]?.name ?? baseMap[t.from_base]?.code ?? t.from_base}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {baseMap[t.to_base ?? ""]?.name ?? baseMap[t.to_base ?? ""]?.code ?? t.to_base ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {edit ? (
                            <input
                              type="number"
                              value={edit.purchase_orders ?? 0}
                              onChange={(e) =>
                                updateConsignmentField(t.ticket_id, "purchase_orders", parseInt(e.target.value) || 0)
                              }
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              min="0"
                            />
                          ) : (
                            t.purchase_orders ?? 0
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{displayUserName(t.authorized_by)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{displayUserName(t.assigned_to)}</td>
                        <td className="px-4 py-3 text-sm">
                          {edit ? (
                            <select
                              value={edit.status ?? t.status ?? "assigned"}
                              onChange={(e) =>
                                updateConsignmentField(t.ticket_id, "status", e.target.value)
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="assigned">assigned</option>
                              <option value="expired">expired</option>
                              <option value="damaged">damaged</option>
                              <option value="delivered">delivered</option>
                            </select>
                          ) : (
                            <span className={`font-medium ${
                              t.status === 'delivered' ? 'text-green-600' :
                              t.status === 'damaged' ? 'text-red-600' :
                              t.status === 'expired' ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {t.status ?? "assigned"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{displayUserName(t.updated_by)}</td>
                        <td className="px-4 py-3 text-sm">
                          {edit ? (
                            <button
                              onClick={() => saveConsignment(t.ticket_id)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => startConsignmentEdit(t)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;