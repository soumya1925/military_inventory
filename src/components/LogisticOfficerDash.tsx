import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

interface InventoryItem {
  id: string;
  category: string;
  model: string;
  stock: number;
  transfer_in?: number;
  transfer_out?: number;
  net_movement?: number;
  current_stock?: number;
}

interface Consignment {
  ticket_id: string;
  from_base: string;
  to_base?: string;
  status?: string;
  updated_by?: string;
}

const LogisticsOfficerDash = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { base_id, name } = state || {};

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetching  inventory and consignments table data
  useEffect(() => {
    if (!base_id) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch inventory with all required fields related to the base or service_id of the officer
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("id, category, model, stock, transfer_in, transfer_out, net_movement, current_stock")
        .eq("base_id", base_id);

      if (inventoryError) console.error("Inventory fetch error:", inventoryError.message);
      else setInventory(inventoryData || []);

      // Fetching consignments data related to a particular base according to the service_id
      const { data: consignmentData, error: consignmentError } = await supabase
        .from("consignment")
        .select("ticket_id, from_base, to_base, status, updated_by")
        .eq("from_base", base_id);

      if (consignmentError) console.error("Consignment fetch error:", consignmentError.message);
      else setConsignments(consignmentData || []);

      setLoading(false);
    };

    fetchData();
  }, [base_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Welcome, {name}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Logistics Officer</p>
          <p className="text-gray-600 text-sm sm:text-base">service id:{state. service_id}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          Logout
        </button>
      </div>

      {/* Inventory  */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 mb-6 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Inventory</h2>
          <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {inventory.length} items
          </div>
        </div>

        {/*  Cards View (Mobile) */}
        <div className="block sm:hidden space-y-4">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="space-y-3">
               
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Category</p>
                    <p className="text-sm font-semibold text-gray-800">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Stock</p>
                    <p className="text-sm font-semibold text-gray-800">{item.stock}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 font-medium">Model</p>
                  <p className="text-sm text-gray-800">{item.model}</p>
                </div>

                {/* Functionable or editable  Fields */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Transfer In</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{item.transfer_in || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Transfer Out</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{item.transfer_out || 0}</p>
                  </div>
                </div>

                {/* Read-only Fields cannot be editted by this role */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Net Movement</p>
                    <p className="text-sm font-medium text-gray-800">
                      {item.net_movement || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Current Stock</p>
                    <p className={`text-sm font-medium ${
                      (item.current_stock || item.stock) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.current_stock || item.stock}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Tabular View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Category</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Model</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Stock</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Transfer In</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Transfer Out</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Net Movement</th>
                <th className="border-b px-4 py-3 text-gray-700 text-sm font-medium">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border-b px-4 py-3 text-gray-800 text-sm">{item.category}</td>
                  <td className="border-b px-4 py-3 text-gray-800 text-sm">{item.model}</td>
                  <td className="border-b px-4 py-3 text-gray-800 text-sm font-medium">{item.stock}</td>
                  <td className="border-b px-4 py-3 text-gray-800 text-sm">
                    {item.transfer_in || 0}
                  </td>
                  <td className="border-b px-4 py-3 text-gray-800 text-sm">
                    {item.transfer_out || 0}
                  </td>
                  <td className="border-b px-4 py-3 text-gray-800 text-sm font-medium">
                    {item.net_movement || 0}
                  </td>
                  <td className={`border-b px-4 py-3 text-sm font-medium ${
                    (item.current_stock || item.stock) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.current_stock || item.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consignment  */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Consignments</h2>
          <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {consignments.length} tickets
          </div>
        </div>

        <div className="space-y-4">
          {consignments.map((c) => (
            <div
              key={c.ticket_id}
              className="bg-gray-50 rounded-lg p-4 border hover:border-gray-300 transition"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ticket ID</p>
                    <p className="text-sm font-mono text-gray-800">{c.ticket_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <p className={`text-sm font-medium ${
                      c.status === 'delivered' ? 'text-green-600' :
                      c.status === 'damaged' ? 'text-red-600' :
                      c.status === 'expired' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {c.status || 'assigned'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">From Base</p>
                    <p className="text-sm text-gray-800">{c.from_base}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">To Base</p>
                    <p className="text-sm text-gray-800">{c.to_base || '—'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 font-medium">Updated By</p>
                  <p className="text-sm text-gray-800">{c.updated_by || '—'}</p>
                </div>
              </div>
            </div>
          ))}
          
          {consignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No consignments found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticsOfficerDash;