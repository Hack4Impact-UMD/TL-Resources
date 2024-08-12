import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAdminAuth from "./auth/RequireAdminAuth/RequireAdminAuth";
import RequireAuth from "./auth/RequireAuth/RequireAuth";
import SignIn from "./pages/signin/SignIn";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          {/*Auth Restricted Page*/}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Hello!</div>
              </RequireAuth>
            }
          />
          {/*Admin Auth Restricted Page*/}
          <Route
            path="/dashboard2"
            element={
              <RequireAdminAuth>
                <div>Hello admin!</div>
              </RequireAdminAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
