import React, { useEffect } from "react";
import logo from "/logo.svg";
import { Button } from "../ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserAccountMenu from "./UserAccountMenu";

function Header({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardPage = location.pathname === "/my-resume";
  const isFavoritePage = location.pathname === "/my-resume/favorites";
  const isAtsPage = location.pathname === "/my-resume/ats-score";

  useEffect(() => {
    if (user) {
      console.log("Printing From Header User Found");
    } else {
      console.log("Printing From Header User Not Found");
    }
  }, []);

  return (
    <div
      id="printHeader"
      className="flex h-20 items-center justify-between bg-white pl-0 pr-10 shadow-md"
    >
      <img src={logo} alt="logo" className="h-20 w-auto object-contain" />
      {user ? (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            disabled={isDashboardPage}
            className={
              isDashboardPage
                ? "bg-slate-200 text-slate-700 border-slate-300 cursor-not-allowed"
                : ""
            }
            onClick={() => navigate("/my-resume")}
          >
            My Resumes
          </Button>
          <Button
            variant="outline"
            disabled={isFavoritePage}
            className={
              isFavoritePage
                ? "bg-slate-200 text-slate-700 border-slate-300 cursor-not-allowed"
                : ""
            }
            onClick={() => navigate("/my-resume/favorites")}
          >
            Favorite Resumes
          </Button>
          <Button
            variant="outline"
            disabled={isAtsPage}
            className={
              isAtsPage
                ? "bg-slate-200 text-slate-700 border-slate-300 cursor-not-allowed"
                : ""
            }
            onClick={() => navigate("/my-resume/ats-score")}
          >
            Check ATS Score
          </Button>
          <UserAccountMenu user={user} />
        </div>
      ) : (
        <Link to="/auth/sign-in">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Login / Signup
          </Button>
        </Link>
      )}
    </div>
  );
}

export default Header;
