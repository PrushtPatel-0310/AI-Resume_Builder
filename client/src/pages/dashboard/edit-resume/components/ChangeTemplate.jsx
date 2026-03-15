import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { addResumeData } from "@/features/resume/resumeFeatures";
import { updateThisResume } from "@/Services/resumeAPI";
import ResumeTemplateGallery, {
  resumeTemplateMockData,
} from "@/components/custom/ResumeTemplateGallery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function ChangeTemplate({ resumeInfo }) {
  const dispatch = useDispatch();
  const { resume_id } = useParams();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizedResumeInfo = useMemo(() => {
    if (resumeInfo && typeof resumeInfo === "object") {
      return resumeInfo;
    }
    return {};
  }, [resumeInfo]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    normalizedResumeInfo?.templateId || "default"
  );

  useEffect(() => {
    setSelectedTemplateId(normalizedResumeInfo?.templateId || "default");
  }, [normalizedResumeInfo?.templateId]);

  const onTemplateSelect = async (templateId) => {
    if (!templateId || templateId === selectedTemplateId || saving) return;

    const previousTemplateId = normalizedResumeInfo?.templateId || "default";

    setSelectedTemplateId(templateId);
    dispatch(
      addResumeData({
        ...normalizedResumeInfo,
        templateId,
      })
    );

    if (!resume_id) {
      return;
    }

    setSaving(true);
    try {
      await updateThisResume(resume_id, {
        data: { templateId },
      });
      toast.success("Template updated");
      setOpen(false);
    } catch (error) {
      dispatch(
        addResumeData({
          ...normalizedResumeInfo,
          templateId: previousTemplateId,
        })
      );
      setSelectedTemplateId(previousTemplateId);
      toast.error(error.message || "Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate className="h-4 w-4" /> Change Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] p-0">
          <DialogHeader>
            <div className="p-6 pb-2">
              <DialogTitle>Change Resume Template</DialogTitle>
              <DialogDescription className="mt-1">
                Select a template to update your resume layout instantly.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
            <ResumeTemplateGallery
              templates={resumeTemplateMockData}
              selectedTemplateId={selectedTemplateId}
              onSelect={onTemplateSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChangeTemplate;
