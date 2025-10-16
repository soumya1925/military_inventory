import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type Role = "Logistics Officer" | "Military Personnel" | "Base Commander" | "System Admin";

interface IFormInput {
  email: string;
  password: string;
  role: Role | "";
  service_id: string;
  base_id: string;
  name: string;
}

interface DemoUser {
  email: string;
  password: string;
  role: Role;
}

const roles: Role[] = ["Logistics Officer", "Military Personnel", "Base Commander", "System Admin"];


//Demo users for the ease of logging in into the desired role 
const demoUsers: DemoUser[] = [
  {
    email: "sysadmin1@defensehq.mil",
    password: "hashed_pw",
    role: "System Admin" as Role,
   
  },
  {
    email: "e.johansen@baseironclad.mil",
    password: "hashed_pw",
    role: "Base Commander" as Role,
  },
  {
    email: "l.park@campsentinel.mil",
    password: "hashed_pw",
    role: "Military Personnel" as Role,
   
  },
  {
    email: "o.saleh@outpostfalcon.mil",
    password: "hashed_pw",
    role: "Logistics Officer" as Role,
  }
];

export default function Login() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<IFormInput>();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const navigate = useNavigate();

  const fillDemoCredentials = (user: DemoUser) => {
    setValue("email", user.email);
    setValue("password", user.password);
    setValue("role", user.role);
    setLoginError(""); 
  };

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

      // Fetching user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, role, service_id, base_id, name')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        setLoginError("No user record found.");
        setLoading(false);
        return;
      }

      // Comparing roles to authenticate login

      if (userData.role !== data.role) {
        setLoginError(`You are not assigned the role "${data.role}".`);
        setLoading(false);
        return;
      }

      // Redirecting to dashboard based on actual role

      switch (userData.role) {
        case "System Admin":
          navigate("/admin-dashboard", {
            state: {
              service_id: userData.service_id,
              role: userData.role,
              base_id: userData.base_id,
              name: userData.name,
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

  const currentEmail = watch("email");
  const currentRole = watch("role");

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
          Military Asset Management Login
        </h1>

        {loginError && (
          <p className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm">{loginError}</p>
        )}

        {/* Demo Users Toggle  */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowDemoUsers(!showDemoUsers)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <span>Demo Login Credentials</span>
            <svg
              className={`w-4 h-4 transition-transform ${showDemoUsers ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDemoUsers && (
            <div className="mt-3 space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => fillDemoCredentials(user)}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                    currentEmail === user.email 
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs opacity-75">{user.role}</div>
                  </div>
                  {currentEmail === user.email && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Email field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
              }`}
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-red-500 mt-1 text-sm">{errors.email.message}</p>}
          </div>

          {/* Password  field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
              }`}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-red-500 mt-1 text-sm">{errors.password.message}</p>}
          </div>

          {/* Role field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Role</label>
            <select
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.role ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Current Selection Display */}
        
        {(currentEmail || currentRole) && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Selection:</h3>
            {currentEmail && (
              <p className="text-sm text-blue-700">
                <span className="font-medium">Email:</span> {currentEmail}
              </p>
            )}
            {currentRole && (
              <p className="text-sm text-blue-700">
                <span className="font-medium">Role:</span> {currentRole}
              </p>
            )}
          </div>
        )}

        <p className="text-gray-500 text-center mt-6 text-sm">
          &copy; 2025 Military Asset Management System
        </p>
      </div>
    </div>
  );
}
