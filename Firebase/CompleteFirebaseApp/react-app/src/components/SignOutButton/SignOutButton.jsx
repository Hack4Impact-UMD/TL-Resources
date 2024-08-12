import { Button } from "@mui/material";
import { logOut } from "../../backend/AuthFunctions";
import styles from "./SignOutButton.module.css";
const SignOutButton = () => {
  return (
    <Button
      type="submit"
      variant="outlined"
      className={styles.submitButton}
      onClick={logOut}
    >
      Sign Out
    </Button>
  );
};
export default SignOutButton;
