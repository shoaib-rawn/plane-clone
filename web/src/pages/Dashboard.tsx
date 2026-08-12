import type { RootState } from "../store/store";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const userName = useSelector((state: RootState) => state.auth.userName);
  return (
    <>
      <h1>welcom back {userName}</h1>
    </>
  );
};

export default Dashboard;
