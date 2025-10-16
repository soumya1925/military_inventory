import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // <-- Ensure your path is correct

type Role = "Logistics Officer" | "Military Personnel" | "Base Commander" | "System Admin";

interface IFormInput {
  email: string;
  password: string;
  role: Role | "";
  service_id: string 
  base_id: string ,
  name:string
}

const roles: Role[] = ["Logistics Officer", "Military Personnel", "Base Commander", "System Admin"];

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    setLoginError("");
    setLoading(true);

    if (!data.role) {
      setLoginError("Please select a role");
      setLoading(false);
      return;
    }

    try {
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      
        if (authError) {
          setLoginError(authError.message);
          setLoading(false);
          return;
        }
      
        console.log("Login success:", authData);
      
        //  Fetching  user data  from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, role, service_id, base_id,name',)
          .eq('email', data.email)
          .single();
      
        if (userError || !userData) {
          setLoginError("No user record found.");
          setLoading(false);
          return;
        }
      
        // 3. Comparing  roles to  authenticate login
        if (userData.role !== data.role) {
          setLoginError(`You are not assigned the role "${data.role}".`);
          setLoading(false);
          return;
        }
      
        // 4. Redirectind to dashBoard  based on actual role
        switch (userData.role) {
            case "System Admin":
              navigate("/admin-dashboard", {
                state: {
                  service_id: userData.service_id,
                  role: userData.role,
                  base_id: userData.base_id,
                  name:userData.name,
                },
              });
              break;
          
            case "Base Commander":
              navigate("/commander-dashboard", {
                state: {
                  service_id: userData.service_id,
                  role: userData.role,
                  base_id: userData.base_id,
                  name: userData.name,
                },
              });
              break;
          
            case "Logistics Officer":
              navigate("/logistics-dashboard", {
                state: {
                  service_id: userData.service_id,
                  role: userData.role,
                  base_id: userData.base_id,
                  name: userData.name,
                },
              });
              break;
          
            case "Military Personnel":
              navigate("/military-dashboard", {
                state: {
                  service_id: userData.service_id,
                  role: userData.role,
                  base_id: userData.base_id,
                  name: userData.name,
                },
              });
              break;
          
            default:
              navigate("/");
            
          }
      
        setLoading(false);
      
      } catch (err: any) {
        setLoading(false);
        setLoginError(err.message || "Unexpected error occurred");
      }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Military Asset Management Login
        </h1>

        {loginError && (
          <p className="bg-red-100 text-red-700 p-2 mb-4 rounded">{loginError}</p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-red-500 mt-1 text-sm">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-red-500 mt-1 text-sm">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Role</label>
            <select
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
              {...register("role", { required: "Role is required" })}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.role && <p className="text-red-500 mt-1 text-sm">{errors.role.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-500 text-center mt-6 text-sm">
          &copy; 2025 Military Asset Management System
        </p>
      </div>
    </div>
  );
}
