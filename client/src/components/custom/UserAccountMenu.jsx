import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/Services/login";
import { addUserData } from "@/features/user/userFeatures";
import { LogOut } from "lucide-react";

function UserAccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logoutUser();
      if (response?.statusCode == 200) {
        dispatch(addUserData(""));
        navigate("/");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const initial = (user?.fullName || user?.firstName || user?.name || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 ring-2 ring-indigo-200 transition hover:ring-indigo-400 focus:outline-none"
        aria-label="User menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.fullName || user?.firstName || user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || ""}
            </p>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserAccountMenu;
