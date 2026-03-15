import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { handleDownload } from "@/lib/handleDownload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return [{ name: "" }];
  return skills.map((skill) => {
    if (typeof skill === "string") {
      return { name: skill };
    }

    return {
      name: skill?.name || "",
    };
  });
};

function Skills({ resumeInfo, enanbledNext }) {
  const [downloading, setDownloading] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [skillsList, setSkillsList] = React.useState(
    normalizeSkills(resumeInfo?.skills)
  );
  const dispatch = useDispatch();
  const { resume_id } = useParams();

  const syncSkillsToStore = (nextSkillsList) => {
    try {
      dispatch(addResumeData({ ...(resumeInfo || {}), skills: nextSkillsList }));
    } catch (error) {
      console.log("error in skills context update", error);
    }
  };

  const AddNewSkills = () => {
    const nextList = [...skillsList, { name: "" }];
    setSkillsList(nextList);
    syncSkillsToStore(nextList);
  };

  const RemoveSkills = () => {
    const nextList = skillsList.slice(0, -1);
    setSkillsList(nextList);
    syncSkillsToStore(nextList);
  };

  const handleChange = (index, value) => {
    const list = [...skillsList];
    const newListData = {
      ...list[index],
      name: value,
    };
    list[index] = newListData;
    setSkillsList(list);
    syncSkillsToStore(list);
  };

  const onDownload = async () => {
    try {
      setDownloading(true);
      const previewElement = document.getElementById("resume-preview");
      if (!previewElement) {
        toast("Resume preview not found");
        return;
      }

      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
      });
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
      await handleDownload({
        data: pdfBlob,
        fileName: `resume-${resume_id || "draft"}.pdf`,
        mimeType: "application/pdf",
      });
      toast("Resume downloaded");
    } catch (error) {
      toast(error?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const onClear = () => {
    setClearing(true);
    const clearedData = {
      firstName: "",
      lastName: "",
      jobTitle: "",
      address: "",
      phone: "",
      email: "",
      linkedin: "",
      themeColor: "#000000",
      summary: "",
      experience: [],
      education: [],
      projects: [],
      skills: [{ name: "" }],
    };

    setSkillsList(clearedData.skills);
    dispatch(addResumeData(clearedData));
    toast("Form cleared");
    setClearing(false);
  };

  return (
    <div
      className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
      onFocus={() => dispatch(setFocusedSection("skills"))}
      onBlur={() => dispatch(setFocusedSection(null))}
    >
      <h2 className="font-bold text-lg">Skills</h2>
      <p>Add Your top professional key skills</p>

      <div>
        {skillsList.map((item, index) => (
          <div
            key={index}
            className="mb-2 border rounded-lg p-3"
          >
            <div className="w-full">
              <label className="text-xs">Name</label>
              <Input
                className="w-full"
                value={item.name || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={AddNewSkills}
            className="text-indigo-600"
          >
            {" "}
            + Add More Skill
          </Button>
          <Button
            variant="outline"
            onClick={RemoveSkills}
            className="text-indigo-600"
          >
            {" "}
            - Remove
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button type="button" variant="secondary" disabled={downloading} onClick={onDownload}>
          {downloading ? <LoaderCircle className="animate-spin" /> : "Download"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={clearing}>
              {clearing ? <LoaderCircle className="animate-spin" /> : "Clear"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all resume data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all form values across the resume builder. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onClear}
              >
                Yes, Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default Skills;
