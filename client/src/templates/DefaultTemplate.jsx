import React from "react";
import PersonalDeatailPreview from "@/pages/dashboard/edit-resume/components/preview-components/PersonalDeatailPreview";
import SummeryPreview from "@/pages/dashboard/edit-resume/components/preview-components/SummaryPreview";
import ExperiencePreview from "@/pages/dashboard/edit-resume/components/preview-components/ExperiencePreview";
import EducationalPreview from "@/pages/dashboard/edit-resume/components/preview-components/EducationalPreview";
import SkillsPreview from "@/pages/dashboard/edit-resume/components/preview-components/SkillsPreview";
import ProjectPreview from "@/pages/dashboard/edit-resume/components/preview-components/ProjectPreview";

const DEFAULT_SECTION_ORDER = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

export default function DefaultTemplate({ resumeInfo, sectionOrder }) {
  const orderedSections = (sectionOrder?.length
    ? sectionOrder
    : DEFAULT_SECTION_ORDER
  ).filter((section) => section !== "Personal Detail");

  const SECTION_DATA_MAP = {
    Summary: "summary",
    Experience: "experience",
    Projects: "projects",
    Education: "education",
    Skills: "skills",
  };

  const renderSection = (section) => {
    switch (section) {
      case "Summary":
        return <SummeryPreview resumeInfo={resumeInfo} />;
      case "Experience":
        return resumeInfo?.experience ? (
          <ExperiencePreview resumeInfo={resumeInfo} />
        ) : null;
      case "Projects":
        return resumeInfo?.projects ? <ProjectPreview resumeInfo={resumeInfo} /> : null;
      case "Education":
        return resumeInfo?.education ? (
          <EducationalPreview resumeInfo={resumeInfo} />
        ) : null;
      case "Skills":
        return resumeInfo?.skills ? <SkillsPreview resumeInfo={resumeInfo} /> : null;
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-preview"
      className={`shadow-lg h-full p-14 border-t-[20px]`}
      style={{
        borderColor: resumeInfo?.themeColor ? resumeInfo.themeColor : "#000000",
      }}
    >
      <div data-section="personal">
        <PersonalDeatailPreview resumeInfo={resumeInfo} />
      </div>
      {orderedSections.map((section) => {
        const content = renderSection(section);
        if (!content) return null;
        return (
          <div key={section} data-section={SECTION_DATA_MAP[section]}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
