import React from "react";
import SummeryPreview from "@/pages/dashboard/edit-resume/components/preview-components/SummaryPreview";
import ExperiencePreview from "@/pages/dashboard/edit-resume/components/preview-components/ExperiencePreview";
import EducationalPreview from "@/pages/dashboard/edit-resume/components/preview-components/EducationalPreview";
import SkillsPreview from "@/pages/dashboard/edit-resume/components/preview-components/SkillsPreview";
import ProjectPreview from "@/pages/dashboard/edit-resume/components/preview-components/ProjectPreview";

/**
 * TRUE Timeline Layout
 * Keeps your existing preview components (NO breaking changes)
 * Only adds timeline styling wrapper
 */

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold tracking-wide text-gray-700 mt-8 mb-4 uppercase">
    {children}
  </h2>
);

// Timeline wrapper
const TimelineBlock = ({ children }) => (
  <div className="relative pl-8 border-l-2 border-gray-300">
    {children}
  </div>
);

// Timeline dot
const Dot = () => (
  <span className="absolute -left-[6px] mt-2 w-3 h-3 bg-gray-800 rounded-full" />
);

const DEFAULT_SECTION_ORDER = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

export default function Timeline({ resumeInfo, sectionOrder }) {
  const linkedId = resumeInfo?.linked_id || resumeInfo?.linkedin;
  const orderedSections = (sectionOrder?.length
    ? sectionOrder
    : DEFAULT_SECTION_ORDER
  ).filter((section) => section !== "Personal Detail");

  const renderSection = (section) => {
    switch (section) {
      case "Summary":
        return (resumeInfo?.summary || resumeInfo?.summery) && (
          <div>
            <SectionTitle>Summary</SectionTitle>
            <SummeryPreview resumeInfo={resumeInfo} />
          </div>
        );
      case "Experience":
        return resumeInfo?.experience?.length > 0 ? (
          <div>
            <SectionTitle>EXPERIENCE</SectionTitle>

            <div className="relative border-l-2 border-gray-300 pl-8 space-y-6">
              {resumeInfo.experience.map((exp, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-10 top-1 w-4 h-4 bg-gray-800 rounded-full" />

                  <div className="flex gap-6">
                    <div className="w-40 text-xs text-gray-500">
                      {exp.startDate} - {exp.endDate}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p className="text-sm text-gray-600">{exp.companyName}</p>
                      <p className="text-sm text-gray-600 mt-1">{exp.workSummary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case "Projects":
        return resumeInfo?.projects?.length > 0 ? (
          <div>
            <SectionTitle>Projects</SectionTitle>
            <ProjectPreview resumeInfo={resumeInfo} />
          </div>
        ) : null;
      case "Skills":
        return resumeInfo?.skills?.length > 0 ? (
          <div>
            <SectionTitle>Skills</SectionTitle>
            <SkillsPreview resumeInfo={resumeInfo} />
          </div>
        ) : null;
      case "Education":
        return resumeInfo?.education?.length > 0 ? (
          <div>
            <SectionTitle>Education</SectionTitle>
            <div className="relative border-l-2 border-gray-300 pl-8 space-y-6">
              {resumeInfo.education.map((edu, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-10 top-1 w-4 h-4 bg-gray-800 rounded-full" />

                  <div className="flex gap-6">
                    <div className="w-40 text-xs text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{edu.universityName}</h3>
                      <p className="text-sm text-gray-600">{edu.degree}</p>
                      <p className="text-xs text-gray-500">CGPA - {edu.cgpa}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-lg p-10 text-gray-800 font-sans leading-relaxed"
    >
      {/* HEADER */}
      <div className="mb-6" data-section="personal">
        <h1 className="text-3xl font-bold tracking-wide uppercase">
          {[resumeInfo?.firstName, resumeInfo?.lastName]
            .filter(Boolean)
            .join(" ") || "Your Name"}
        </h1>

        <p className="text-sm text-gray-600 mt-1">
          {resumeInfo?.jobTitle || "Professional Title"}
        </p>

        <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {resumeInfo?.email && <span>{resumeInfo.email}</span>}
          {resumeInfo?.phone && <span>{resumeInfo.phone}</span>}
          {resumeInfo?.address && <span>{resumeInfo.address}</span>}
          {linkedId && <span className="break-all">{linkedId}</span>}
        </div>
      </div>

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
  );
}
