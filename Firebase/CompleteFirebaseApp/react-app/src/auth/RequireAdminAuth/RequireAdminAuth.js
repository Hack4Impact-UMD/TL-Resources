import { Navigate } from "react-router-dom";
import Loading from "../../components/LoadingScreen/Loading";
import { AuthProvider, useAuth } from "../AuthProvider";
import styles from "./RequireAdminAuth.module.css";

const RequireAdminAuth = ({ children }) => {
  const authContext = useAuth();
  if (authContext.loading) {
    return <Loading />;
  } else if (!authContext.user) {
    return (
      <Navigate to="/signin" state={{ redir: window.location.pathname }} />
    );
  } else if (authContext.token?.claims?.role.toLowerCase() != "admin") {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.errorMessage}>
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <AuthProvider>{children}</AuthProvider>;
};

export default RequireAdminAuth;
