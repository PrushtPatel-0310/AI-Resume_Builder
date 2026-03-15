import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllResumeData } from "@/Services/resumeAPI";
import AddResume from "./components/AddResume";
import ResumeCard from "./components/ResumeCard";
import UploadResume from "./components/UploadResume";
import { Link, useLocation } from "react-router-dom";
import { CopyPlus } from "lucide-react";

function Dashboard() {
  const user = useSelector((state) => state.editUser.userData);
  const [resumes, setResumes] = React.useState([]);
  const [favoriteResumeIds, setFavoriteResumeIds] = React.useState(() => {
    try {
      const stored = localStorage.getItem("favoriteResumeIds");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const dispatch = useDispatch();
  const location = useLocation();
  const showFavoritesOnly = location.pathname === "/my-resume/favorites";

  const favoriteIdSet = React.useMemo(
    () => new Set(favoriteResumeIds),
    [favoriteResumeIds]
  );

  const visibleResumes = React.useMemo(() => {
    if (!showFavoritesOnly) return resumes;
    return resumes.filter((resume) => favoriteIdSet.has(resume._id));
  }, [resumes, showFavoritesOnly, favoriteIdSet]);

  const fetchAllResumeData = async () => {
    try {
      const resumes = await getAllResumeData();
      console.log(
        `Printing from DashBoard List of Resumes got from Backend`,
        resumes.data
      );
      setResumes(resumes.data || []);
    } catch (error) {
      console.log("Error from dashboard", error.message);
    }
  };

  useEffect(() => {
    fetchAllResumeData();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("favoriteResumeIds", JSON.stringify(favoriteResumeIds));
  }, [favoriteResumeIds]);

  useEffect(() => {
    if (resumes.length === 0) return;
    setFavoriteResumeIds((prev) => {
      const existingIds = new Set(resumes.map((resume) => resume._id));
      const cleaned = prev.filter((id) => existingIds.has(id));
      return cleaned.length === prev.length ? prev : cleaned;
    });
  }, [resumes]);

  const toggleFavoriteResume = (resumeId) => {
    setFavoriteResumeIds((prev) => {
      if (prev.includes(resumeId)) {
        return prev.filter((id) => id !== resumeId);
      }
      return [...prev, resumeId];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 px-6 py-4 md:grid-cols-3 md:gap-0 md:px-10 lg:px-16">
          <div className="hidden md:block" />

          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              {showFavoritesOnly ? "Favorite Resumes" : "My Resumes"}
            </h2>
            <p className="text-sm text-slate-600">Manage your AI resumes</p>
          </div>

          {resumes.length > 0 ? (
            <div className="flex items-center justify-center gap-3 md:justify-end">
              <AddResume triggerVariant="button" />
              <UploadResume triggerVariant="button" />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 md:justify-end">
              <Link
                to="/my-resume"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                My Resumes
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-16">
        {resumes.length === 0 ? (
          <div className="flex min-h-[68vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <CopyPlus size={38} />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              Start your first AI Resume
            </h3>
            <p className="mt-3 max-w-md text-slate-600">
              Create a resume from scratch or upload your existing resume and
              let AI organize it.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <AddResume triggerVariant="button" />
              <UploadResume triggerVariant="button" />
            </div>
          </div>
        ) : visibleResumes.length === 0 ? (
          <div className="flex min-h-[68vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              No favorite resumes yet
            </h3>
            <p className="mt-3 max-w-md text-slate-600">
              Click the heart icon on a resume card to add it to favorites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleResumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                resume={resume}
                refreshData={fetchAllResumeData}
                isFavorite={favoriteIdSet.has(resume._id)}
                onToggleFavorite={toggleFavoriteResume}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
