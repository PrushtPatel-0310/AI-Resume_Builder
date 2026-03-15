import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import PersonalDetails from "./form-components/PersonalDetails";
import Summary from "./form-components/Summary";
import Experience from "./form-components/Experience";
import Education from "./form-components/Education";
import Skills from "./form-components/Skills";
import Project from "./form-components/Project";
import { ArrowLeft, ArrowRight, HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeColor from "./ThemeColor";
import ChangeTemplate from "./ChangeTemplate";
import ProgressBar from "./ProgressBar";
import SaveStatusIndicator from "@/components/custom/SaveStatusIndicator";

function ResumeForm({ sectionOrder = [], setSectionOrder, handleDragEnd }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [enanbledNext, setEnabledNext] = useState(true);
  const [enanbledPrev, setEnabledPrev] = useState(true);
  const resumeInfo = useSelector((state) => state.editResume.resumeData);

  const totalSteps = sectionOrder.length;
  const currentSection = sectionOrder[currentIndex];

  useEffect(() => {
    if (currentIndex === 0) {
      setEnabledPrev(false);
    } else {
      setEnabledPrev(true);
    }

    if (currentIndex === totalSteps - 1) {
      setEnabledNext(false);
    } else {
      setEnabledNext(true);
    }
  }, [currentIndex, totalSteps]);

  useEffect(() => {
    if (currentIndex > totalSteps - 1) {
      setCurrentIndex(Math.max(totalSteps - 1, 0));
    }
  }, [totalSteps, currentIndex]);

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "Personal Detail":
        return (
          <PersonalDetails
            resumeInfo={resumeInfo}
            enanbledNext={setEnabledNext}
          />
        );
      case "Summary":
        return (
          <Summary
            resumeInfo={resumeInfo}
            enanbledNext={setEnabledNext}
            enanbledPrev={setEnabledPrev}
          />
        );
      case "Experience":
        return (
          <Experience
            resumeInfo={resumeInfo}
            enanbledNext={setEnabledNext}
            enanbledPrev={setEnabledPrev}
          />
        );
      case "Projects":
        return (
          <Project
            resumeInfo={resumeInfo}
            setEnabledNext={setEnabledNext}
            setEnabledPrev={setEnabledPrev}
          />
        );
      case "Education":
        return (
          <Education
            resumeInfo={resumeInfo}
            enanbledNext={setEnabledNext}
            enabledPrev={setEnabledPrev}
          />
        );
      case "Skills":
        return (
          <Skills
            resumeInfo={resumeInfo}
            enanbledNext={setEnabledNext}
            enanbledPrev={setEnabledNext}
          />
        );
      default:
        return null;
    }
  };

  // To Add Dummy Data
  // useEffect(() => {
  //   dispatch(addResumeData(data));
  // }, []);

  return (
    <div>
      <ProgressBar
        currentStep={currentIndex + 1}
        sectionOrder={sectionOrder}
        setSectionOrder={setSectionOrder}
        onDragEnd={handleDragEnd}
        onStepClick={(stepNumber) => {
          if (stepNumber < 1 || stepNumber > totalSteps) return;
          setCurrentIndex(stepNumber - 1);
        }}
      />
      <div className="mt-6 flex justify-between">
        <div className="flex gap-2 items-center">
          <Link to="/my-resume">
            <Button>
              <HomeIcon />
            </Button>
          </Link>
          <ThemeColor resumeInfo={resumeInfo}/>
          <ChangeTemplate resumeInfo={resumeInfo} />
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator />
          {currentIndex > 0 && (
            <Button
              size="sm"
              className="text-sm gap-2"
              disabled={!enanbledPrev}
              onClick={() => {
                if (currentIndex === 0) return;
                setCurrentIndex(currentIndex - 1);
              }}
            >
              <ArrowLeft /> Prev
            </Button>
          )}
          {currentIndex < totalSteps - 1 && (
            <Button
              size="sm"
              className="gap-2"
              disabled={!enanbledNext}
              onClick={() => {
                if (currentIndex >= totalSteps - 1) return;
                setCurrentIndex(currentIndex + 1);
              }}
            >
              Next <ArrowRight className="text-sm" />
            </Button>
          )}
        </div>
      </div>
      {renderCurrentSection()}
    </div>
  );
}

export default ResumeForm;
