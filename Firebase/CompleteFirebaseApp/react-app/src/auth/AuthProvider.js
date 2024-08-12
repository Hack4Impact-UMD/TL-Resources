import {
  browserSessionPersistence,
  getAuth,
  onIdTokenChanged,
  setPersistence,
} from "@firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import app from "../config/firebase";

// The AuthContext that other components may subscribe to.
const AuthContext = createContext(null);

// Updates the AuthContext and re-renders children when the user changes.
// See onIdTokenChanged for what events trigger a change.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // The loading state is used by RequireAuth/RequireAdminAuth
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    onIdTokenChanged(auth, async (newUser) => {
      // More about persistance here: https://firebase.google.com/docs/auth/web/auth-state-persistence
      await setPersistence(auth, browserSessionPersistence);
      setUser(newUser);
      if (newUser != null) {
        await newUser
          .getIdTokenResult()
          .then((newToken) => {
            setToken(newToken);
          })
          .catch(() => {});
      }

      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
