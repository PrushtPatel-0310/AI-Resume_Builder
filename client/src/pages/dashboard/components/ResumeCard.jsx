import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteThisResume, updateThisResume } from "@/Services/resumeAPI";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ResumePreview from "../edit-resume/components/PreviewPage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { handleDownload } from "@/lib/handleDownload";
import { MoreVertical, Pencil, Download, Trash2, Type, X, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResumeCard({ resume, refreshData, isFavorite = false, onToggleFavorite }) {
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [openAlert, setOpenAlert] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(resume?.title || "");
  const [previewScale, setPreviewScale] = React.useState(0.32);
  const previewViewportRef = React.useRef(null);
  const cardContainerRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const navigate = useNavigate();

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const element = previewViewportRef.current;
    if (!element) return;

    const A4_PREVIEW_WIDTH = 794;
    const setScale = () => {
      const nextScale = element.clientWidth / A4_PREVIEW_WIDTH;
      setPreviewScale(nextScale > 0 ? nextScale : 0.32);
    };

    setScale();
    const observer = new ResizeObserver(setScale);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteThisResume(resume._id);
      toast.success("Resume deleted");
      navigate("/my-resume", { replace: true });
    } catch (error) {
      console.error("Error deleting resume:", error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
      setOpenAlert(false);
      refreshData();
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      await updateThisResume(resume._id, { data: { title: renameValue.trim() } });
      toast.success("Resume renamed");
      refreshData();
    } catch (error) {
      toast.error(error?.message || "Failed to rename");
    } finally {
      setRenaming(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      setDownloading(true);
      setMenuOpen(false);
      const previewElement = cardContainerRef.current?.querySelector("#resume-preview");
      const scaledWrapper = previewElement?.closest("[style*='scale']");

      if (!previewElement) {
        toast.error("Resume preview not found");
        return;
      }

      let originalTransform = "";
      if (scaledWrapper) {
        originalTransform = scaledWrapper.style.transform;
        scaledWrapper.style.transform = "scale(1)";
      }

      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
      });

      if (scaledWrapper) {
        scaledWrapper.style.transform = originalTransform;
      }

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, imageHeight);
      if (imageHeight > pdfHeight) {
        let heightLeft = imageHeight - pdfHeight;
        let position = -pdfHeight;
        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imageData, "PNG", 0, position, pdfWidth, imageHeight);
          heightLeft -= pdfHeight;
          position -= pdfHeight;
        }
      }

      const pdfBlob = pdf.output("blob");
      const safeTitle = (resume?.title || "resume").trim().replace(/\s+/g, "-").toLowerCase();
      await handleDownload({
        data: pdfBlob,
        fileName: `${safeTitle || "resume"}.pdf`,
        mimeType: "application/pdf",
      });
      toast.success("Resume downloaded");
    } catch (error) {
      toast.error(error?.message || "Failed to download resume");
    } finally {
      setDownloading(false);
    }
  };

  const handleCardClick = (e) => {
    if (menuOpen || openAlert || renaming || loading || downloading) return;

    const interactiveTarget = e.target.closest(
      "button, input, textarea, a, [role='dialog']"
    );
    if (interactiveTarget) return;

    navigate(`/my-resume/view-resume/${resume._id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!onToggleFavorite || !resume?._id) return;
    onToggleFavorite(resume._id);
    if (!isFavorite) {
      toast.success("Added to favorite");
    } else {
      toast.success("Removed from favorite");
    }
  };

  return (
    <div
      ref={cardContainerRef}
      onClick={handleCardClick}
      className="group relative h-[380px] rounded-xl bg-white border-2 border-transparent shadow-md flex flex-col cursor-pointer transition-all duration-300 hover:shadow-none hover:border-indigo-400"
    >
      <button
        onClick={handleFavoriteClick}
        className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-colors duration-200 ${
          isFavorite
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-500"}`}
        />
      </button>

      {/* Meatball menu - top right */}
      <div
        ref={menuRef}
        className="absolute right-2 top-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-100"
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4 text-slate-600" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
            <button
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Type className="h-4 w-4 text-slate-400" />
              Rename
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/my-resume/edit-resume/${resume._id}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Pencil className="h-4 w-4 text-slate-400" />
              Edit
            </button>
            <button
              onClick={handleDownloadResume}
              disabled={downloading}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-slate-400" />
              {downloading ? "Downloading…" : "Download"}
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                setMenuOpen(false);
                setOpenAlert(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Title bar */}
      <div className="flex items-center justify-center px-4 py-3">
        {renaming ? (
          <div
            className="flex items-center gap-2 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={handleRename} className="h-8 px-2 text-indigo-600 hover:text-indigo-800">
              Save
            </Button>
            <button onClick={() => setRenaming(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h2 className="text-center font-semibold text-sm text-slate-800 truncate">
            {resume.title}
          </h2>
        )}
      </div>

      {/* Preview thumbnail */}
      <div className="mx-3 mb-3 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-1">
        <div ref={previewViewportRef} className="relative h-full w-full overflow-hidden">
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: "794px",
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
            }}
          >
            <ResumePreview resumeInfo={resume} />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              Resume and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ResumeCard;
