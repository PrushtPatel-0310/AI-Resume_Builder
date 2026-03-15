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

export default function Classic({ resumeInfo, sectionOrder }) {
  const linkedId = resumeInfo?.linked_id || resumeInfo?.linkedin;
  const orderedSections = (sectionOrder?.length
    ? sectionOrder
    : DEFAULT_SECTION_ORDER
  ).filter((section) => section !== "Personal Detail");

  const renderSection = (section) => {
    switch (section) {
      case "Summary":
        return (
          <section className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Summary
            </h2>
            <SummeryPreview resumeInfo={resumeInfo} />
          </section>
        );
      case "Experience":
        return resumeInfo?.experience?.length > 0 ? (
          <section className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Experience
            </h2>
            <ExperiencePreview resumeInfo={resumeInfo} />
          </section>
        ) : null;
      case "Projects":
        return resumeInfo?.projects?.length > 0 ? (
          <section className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Projects
            </h2>
            <ProjectPreview resumeInfo={resumeInfo} />
          </section>
        ) : null;
      case "Education":
        return resumeInfo?.education?.length > 0 ? (
          <section className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Education
            </h2>
            <EducationalPreview resumeInfo={resumeInfo} />
          </section>
        ) : null;
      case "Skills":
        return resumeInfo?.skills?.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Skills
            </h2>
            <SkillsPreview resumeInfo={resumeInfo} />
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div id="resume-preview" className="h-full shadow-lg bg-[#f5f5f5] p-6">
      <div className="max-w-[900px] mx-auto bg-white p-8 font-sans text-gray-800">
        {/* Header */}
        <header className="border-b pb-4 mb-5" data-section="personal">
          <h1 className="text-2xl font-bold tracking-tight break-words">
            {resumeInfo?.firstName || "Your Name"}
          </h1>

          <p className="text-sm text-gray-600 mt-1 break-words">
            {resumeInfo?.jobTitle || "Professional Title"}
          </p>

          <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {resumeInfo?.email && <span className="break-all">{resumeInfo.email}</span>}
            {resumeInfo?.phone && <span>{resumeInfo.phone}</span>}
            {resumeInfo?.address && <span>{resumeInfo.address}</span>}
            {linkedId && <span className="break-all">{linkedId}</span>}
          </div>
        </header>

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
      </div>
    </div>
  );
}
