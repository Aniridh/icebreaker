import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import LinkedInAuth from "@/pages/LinkedInAuth";
import { Dashboard } from "@/pages/Dashboard";
import ScannerPage from "@/pages/ScannerPage";

export default function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/linkedin" element={<LinkedInAuth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<ScannerPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}
