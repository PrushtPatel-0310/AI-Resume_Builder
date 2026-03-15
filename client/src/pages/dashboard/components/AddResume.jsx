import React from "react";

import { useState } from "react";
import { CopyPlus, Loader, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewResume } from "@/Services/resumeAPI";
import { useNavigate } from "react-router-dom";
import ResumeTemplateGallery, {
  resumeTemplateMockData,
} from "@/components/custom/ResumeTemplateGallery";

function AddResume({ triggerVariant = "card" }) {
  const [isDialogOpen, setOpenDialog] = useState(false);
  const [resumetitle, setResumetitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    resumeTemplateMockData[0]?.id || ""
  );
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Choose Template, 2 = Name Resume

  const Navigate = useNavigate();

  const createResume = async () => {
    setLoading(true);
    if (resumetitle === "") {
      setLoading(false);
      return console.log("Please add a title to your resume");
    }
    const data = {
      data: {
        title: resumetitle,
        themeColor: "#000000",
        templateId: selectedTemplateId,
      },
    };
    console.log(`Creating Resume ${resumetitle}`);
    createNewResume(data)
      .then((res) => {
        console.log("Prinitng From AddResume Respnse of Create Resume", res);
        Navigate(`/my-resume/edit-resume/${res.data.resume._id}`);
      })
      .finally(() => {
        setLoading(false);
        setResumetitle("");
        setSelectedTemplateId(resumeTemplateMockData[0]?.id || "");
        setStep(1);
      });
  };

  const handleOpen = () => {
    setStep(1);
    setOpenDialog(true);
  };

  return (
    <>
      {triggerVariant === "button" ? (
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          onClick={handleOpen}
        >
          <CopyPlus size={16} /> Create New
        </Button>
      ) : (
        <div
          className="p-14 py-24 flex items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-xl h-[380px] hover:border-indigo-400 transition-all duration-300 cursor-pointer hover:shadow-md"
          onClick={handleOpen}
        >
          <CopyPlus className="text-slate-400 transition-transform duration-300" />
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setOpenDialog}>
        <DialogContent
          setOpenDialog={setOpenDialog}
          className="max-w-[95vw] md:max-w-5xl max-h-[90vh] p-0"
        >
          <DialogHeader>
            <div className="p-6 pb-2">
              <DialogTitle>
                {step === 1 ? "Step 1: Choose a Template" : "Step 2: Name Your Resume"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {step === 1
                  ? "Select a template to start with. You can change it later."
                  : "Give your resume a title to help you identify it."}
              </DialogDescription>
            </div>

            {step === 1 && (
              <div className="px-6 pb-4 overflow-y-auto max-h-[58vh]">
                <ResumeTemplateGallery
                  templates={resumeTemplateMockData}
                  selectedTemplateId={selectedTemplateId}
                  onSelect={(id) => setSelectedTemplateId(id)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="px-6 pb-4">
                <Input
                  className="mt-2"
                  type="text"
                  placeholder="Ex: Backend Resume"
                  value={resumetitle}
                  autoFocus
                  onChange={(e) => setResumetitle(e.target.value.trimStart())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && resumetitle && selectedTemplateId) {
                      createResume();
                    }
                  }}
                />
              </div>
            )}

            <div className="gap-2 flex justify-between border-t px-6 py-4">
              <div>
                {step === 2 && (
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                {step === 1 ? (
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedTemplateId}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={createResume}
                    disabled={!resumetitle || !selectedTemplateId || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? <Loader className="animate-spin" /> : "Create Resume"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddResume;
