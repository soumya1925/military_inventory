import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Modal from "react-modal";

interface InventoryItem {
  id: string;
  category: string;
  model: string;
  stock: number;
  metadata: any;
  transfer_in: number;
  transfer_out: number;
  net_movement: number;
  current_stock: number;
}

interface Base {
  id: string;
  code: string;
  name: string;
  location: string;
}

interface User {
  service_id: string;
  name: string;
  role: string;
}

Modal.setAppElement("#root"); 

const BaseCommanderDash = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { base_id,service_id, name } = state || {};

  const [bases, setBases] = useState<Base[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state creation (react-modal)

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toBase, setToBase] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all bases data from base table

      const { data: basesData, error: basesError } = await supabase.from("bases").select("*");
      if (basesError) console.error(basesError);
      else setBases(basesData || []);

      // Fetch  all the inventory field values for the  base belonging to BaseCommander

      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(
          "id, category, model, stock, metadata, transfer_in, transfer_out, net_movement, current_stock"
        )
        .eq("base_id", base_id);
      if (inventoryError) console.error(inventoryError);
      else setInventory(inventoryData || []);

      // Fetching  all users (for assigned_to dropdown  excluding base commanders)
      
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("service_id, name, role")
        .neq("role", "Base Commander");
      if (usersError) console.error(usersError);
      else setUsers(usersData || []);

      setLoading(false);
    };

    fetchData();
  }, [base_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setToBase("");
    setAssignedTo("");
    setPurchaseOrders(0);
  };

  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBase || !assignedTo || purchaseOrders <= 0) {
      alert("Please fill all fields correctly.");
      return;
    }

    const { error } = await supabase.from("consignment").insert([
      {
        from_base: base_id,
        to_base: toBase,
        authorized_by: service_id,
        assigned_to: assignedTo,
        purchase_orders: purchaseOrders,
        status: "assigned", 
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to create consignment.");
    } else {
      alert("Consignment created successfully!");
      closeModal();
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {name} (Base Commander)
        </h1>
        <div className="flex gap-2">
          <button
            onClick={openModal}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Create Consignment
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Bases */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Bases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {bases.map((b) => (
          <div key={b.id} className="bg-white shadow-md rounded-lg p-4">
            <p className="text-gray-500 font-medium">Code</p>
            <p className="text-gray-800 font-semibold mb-2">{b.code}</p>
            <p className="text-gray-500 font-medium">Name</p>
            <p className="text-gray-800 font-semibold mb-2">{b.name}</p>
            <p className="text-gray-500 font-medium">Location</p>
            <p className="text-gray-800 font-semibold">{b.location}</p>
          </div>
        ))}
      </div>

      {/* Inventory */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Inventory</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b px-6 py-3 text-gray-700">Category</th>
              <th className="border-b px-6 py-3 text-gray-700">Model</th>
              <th className="border-b px-6 py-3 text-gray-700">Stock</th>
              <th className="border-b px-6 py-3 text-gray-700">Metadata</th>
              <th className="border-b px-6 py-3 text-gray-700">Transfer In</th>
              <th className="border-b px-6 py-3 text-gray-700">Transfer Out</th>
              <th className="border-b px-6 py-3 text-gray-700">Net Movement</th>
              <th className="border-b px-6 py-3 text-gray-700">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="border-b px-4 py-2 text-gray-800">{item.category}</td>
                <td className="border-b px-4 py-2 text-gray-800">{item.model}</td>
                <td className="border-b px-4 py-2 text-gray-800">{item.stock}</td>
                <td className="border-b px-4 py-2 text-gray-800">
                  <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(item.metadata, null, 2)}</pre>
                </td>
                <td className="border-b px-4 py-2 text-gray-800">{item.transfer_in}</td>
                <td className="border-b px-4 py-2 text-gray-800">{item.transfer_out}</td>
                <td className="border-b px-4 py-2 text-gray-800">{item.net_movement}</td>
                <td className="border-b px-4 py-2 text-gray-800">{item.current_stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creating  Consignment  by the base commander  */}
      <Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  className="max-w-lg mx-auto mt-20 bg-white p-6 rounded shadow-lg outline-none"
  overlayClassName="fixed inset-0 flex justify-center items-start z-50 backdrop-blur-sm bg-white/10"
>
  <h2 className="text-xl font-semibold mb-4">Create Consignment</h2>
  <form onSubmit={handleCreateConsignment} className="space-y-4">
    {/*  Base Dropdown */}
    <div>
      <label className="block text-gray-600 mb-1">To Base</label>
      <select
        value={toBase}
        onChange={(e) => setToBase(e.target.value)}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      >
        <option value="">Select Base</option>
        {bases.filter((b) => b.id !== base_id).map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} - {b.name}
          </option>
        ))}
      </select>
    </div>

    {/* Assigned_to Dropdown  field of consignment_table linked with user table*/}
    <div>
      <label className="block text-gray-600 mb-1">Assign To</label>
      <select
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      >
        <option value="">Select Officer</option>
        {users.map((u) => (
          <option key={u.service_id} value={u.service_id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>

    {/* Purchase Orders */}
    
    <div>
      <label className="block text-gray-600 mb-1">Purchase Orders</label>
      <input
        type="number"
        min={1}
        value={purchaseOrders}
        onChange={(e) => setPurchaseOrders(Number(e.target.value))}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <button
        type="button"
        onClick={closeModal}
        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Create
      </button>
    </div>
  </form>
</Modal>
    </div>
  );
};

export default BaseCommanderDash;
