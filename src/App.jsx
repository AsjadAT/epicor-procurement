import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Requisitions from "./components/Requisitions";
import RequisitionHeader from "./components/RequisitionHeader";
import AppLayout from "./components/AppLayout"; // Import AppLayout
import POApproval from "./components/POApproval";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Wrap your authenticated routes with AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/requisitions" element={<Requisitions />} />
          <Route path="/requisition/:reqNum" element={<RequisitionHeader />} />
          <Route path="po-approval" element={<POApproval />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;