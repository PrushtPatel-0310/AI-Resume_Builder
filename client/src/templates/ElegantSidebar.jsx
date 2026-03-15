import React from "react";
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

export default function ElegantSidebar({ resumeInfo, sectionOrder }) {
  const linkedId = resumeInfo?.linked_id || resumeInfo?.linkedin;
  const orderedSections = (sectionOrder?.length
    ? sectionOrder
    : DEFAULT_SECTION_ORDER
  ).filter((section) => section !== "Personal Detail");

  const renderSection = (section) => {
    switch (section) {
      case "Summary":
        return <SummeryPreview resumeInfo={resumeInfo} />;
      case "Experience":
        return resumeInfo?.experience?.length > 0 ? (
          <ExperiencePreview resumeInfo={resumeInfo} />
        ) : null;
      case "Projects":
        return resumeInfo?.projects?.length > 0 ? (
          <ProjectPreview resumeInfo={resumeInfo} />
        ) : null;
      case "Education":
        return resumeInfo?.education?.length > 0 ? (
          <EducationalPreview resumeInfo={resumeInfo} />
        ) : null;
      case "Skills":
        return resumeInfo?.skills?.length > 0 ? <SkillsPreview resumeInfo={resumeInfo} /> : null;
      default:
        return null;
    }
  };

  return (
    <div id="resume-preview" className="h-full shadow-lg">
      <div className="flex h-full font-sans text-gray-800">
        
        {/* Sidebar */}
        <aside className="w-[26%] bg-[#134e4a] text-white p-7" data-section="personal">
          <h2 className="text-2xl font-bold tracking-wide leading-tight break-words">
            {resumeInfo?.firstName || "Your Name"}
          </h2>

          <p className="text-sm mt-1 opacity-90 break-words">
            {resumeInfo?.jobTitle || "Professional Title"}
          </p>

          <div className="mt-7 space-y-2 text-sm opacity-95">
            {resumeInfo?.email && <p className="break-all">{resumeInfo.email}</p>}
            {resumeInfo?.phone && <p>{resumeInfo.phone}</p>}
            {resumeInfo?.address && <p>{resumeInfo.address}</p>}
            {linkedId && <p className="break-all">{linkedId}</p>}
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-[74%] bg-white p-6">
          {orderedSections.map((section) => {
            const dataSection = { Summary: "summary", Experience: "experience", Projects: "projects", Education: "education", Skills: "skills" }[section];
            const content = renderSection(section);
            if (!content) return null;
            return (
              <div key={section} data-section={dataSection}>
                {content}
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}
