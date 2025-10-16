import { Route,Routes } from "react-router-dom"
import Login from "./components/Login"
import MilitaryPersonnelDash from "./components/MilitaryPersonnelDash"
import LogisticsOfficerDash from "./components/LogisticOfficerDash"
import BaseCommanderDash from "./components/BaseCommanderdash"
import AdminDashboard from "./components/AdminDashboard"
function App() {

  return (
    <>

      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/military-dashboard" element={<MilitaryPersonnelDash />} />
        <Route path="/logistics-dashboard" element={<LogisticsOfficerDash />} />
        <Route path="/commander-dashboard" element={<BaseCommanderDash />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>


    </>
  )
}

export default App
