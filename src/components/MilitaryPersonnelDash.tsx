import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // adjust path

interface InventoryItem {
  category: string;
  model: string;
  stock: number;
}

const MilitaryPersonnelDash = () => {
  const { state } = useLocation();
  const { base_id, role, service_id, name } = state || {};
  const navigate = useNavigate();

  const [baseInfo, setBaseInfo] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!base_id) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetching  base info
      const { data: bases, error: baseError } = await supabase
        .from("bases")
        .select("code, name, location")
        .eq("id", base_id)
        .single();

      if (baseError) console.error(baseError);
      else setBaseInfo(bases);

      // Fetching inventory table data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("category, model, stock")
        .eq("base_id", base_id);

      if (inventoryError) console.error(inventoryError);
      else setInventory(inventoryData || []);

      setLoading(false);
    };

    fetchData();
  }, [base_id]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      navigate("/"); // redirecting  to login page
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Welcome, {name}
          </h1>
          
          {/* Role & Service Information */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <div className="bg-white shadow-sm rounded-lg p-3 border">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Role</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{role}</p>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-3 border">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Service ID</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{service_id}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          Logout
        </button>
      </div>

      {/* Base Info from base table */}
      {baseInfo && (
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 mb-6 border">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
            Base Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Code</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{baseInfo.code}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Name</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{baseInfo.name}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Location</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{baseInfo.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory  */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Inventory</h2>
          <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {inventory.length} items
          </div>
        </div>

        {/*  Cards View (Mobile)*/}
        <div className="block sm:hidden space-y-3">
          {inventory.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="space-y-2">
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
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found
            </div>
          )}
        </div>

        {/* Desktop Tabular  View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b px-4 sm:px-6 py-3 text-gray-700 text-sm font-medium">Category</th>
                <th className="border-b px-4 sm:px-6 py-3 text-gray-700 text-sm font-medium">Model</th>
                <th className="border-b px-4 sm:px-6 py-3 text-gray-700 text-sm font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="border-b px-4 sm:px-6 py-3 text-gray-800 text-sm">{item.category}</td>
                  <td className="border-b px-4 sm:px-6 py-3 text-gray-800 text-sm">{item.model}</td>
                  <td className="border-b px-4 sm:px-6 py-3 text-gray-800 text-sm font-medium">{item.stock}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={3} className="border-b px-4 sm:px-6 py-8 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MilitaryPersonnelDash;