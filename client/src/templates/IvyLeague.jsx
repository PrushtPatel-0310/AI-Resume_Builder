import React from "react";

const DEFAULT_SECTION_ORDER = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

export default function IvyLeague({ resumeInfo, sectionOrder }) {
  const linkedId = resumeInfo?.linked_id || resumeInfo?.linkedin;
  const summaryText = resumeInfo?.summary || resumeInfo?.summery || "";
  const experienceList = resumeInfo?.experience || [];
  const educationList = resumeInfo?.education || [];
  const projectList = resumeInfo?.projects || [];
  const skillsList = resumeInfo?.skills || [];
  const orderedSections = (sectionOrder?.length
    ? sectionOrder
    : DEFAULT_SECTION_ORDER
  ).filter((section) => section !== "Personal Detail");

  const renderSection = (section) => {
    switch (section) {
      case "Summary":
        return (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Summary</h2>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {summaryText || "Add your professional summary from the form."}
            </p>
          </div>
        );
      case "Experience":
        return experienceList.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Experience</h2>
            <div className="mt-3 space-y-4">
              {experienceList.map((experience, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {experience?.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {experience?.companyName}
                    {experience?.companyName && experience?.city ? ", " : ""}
                    {experience?.city}
                    {experience?.city && experience?.state ? ", " : ""}
                    {experience?.state}
                  </p>
                  {(experience?.startDate || experience?.endDate || experience?.currentlyWorking) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {experience?.startDate}
                      {experience?.startDate && (experience?.currentlyWorking || experience?.endDate)
                        ? " - "
                        : ""}
                      {experience?.currentlyWorking ? "Present" : experience?.endDate}
                    </p>
                  )}
                  {experience?.workSummary && (
                    <div
                      className="text-xs text-gray-700 mt-2"
                      dangerouslySetInnerHTML={{ __html: experience?.workSummary }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case "Projects":
        return projectList.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
            <div className="mt-3 space-y-4">
              {projectList.map((project, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {project?.projectName}
                  </h3>
                  {project?.techStack && (
                    <p className="text-xs text-gray-600 mt-1">{project?.techStack}</p>
                  )}
                  {project?.projectSummary && (
                    <div
                      className="text-xs text-gray-700 mt-2"
                      dangerouslySetInnerHTML={{ __html: project?.projectSummary }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case "Education":
        return educationList.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Education</h2>
            <div className="mt-3 space-y-4">
              {educationList.map((education, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {education?.universityName}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {education?.degree}
                    {education?.degree && education?.major ? " in " : ""}
                    {education?.major}
                  </p>
                  {(education?.startDate || education?.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {education?.startDate}
                      {education?.startDate && education?.endDate ? " - " : ""}
                      {education?.endDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case "Skills":
        return skillsList.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Skills</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {skillsList.map((skill, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-700 border border-gray-200 rounded px-2 py-1"
                >
                  {typeof skill === "string" ? skill : skill?.name}
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
    <div id="resume-preview" className="h-full shadow-lg bg-white p-10">
      <div data-section="personal">
        <h1 className="text-3xl font-bold text-gray-900 break-words">
          {resumeInfo?.firstName || "Your Name"}
        </h1>
        <p className="text-sm text-gray-600 mt-2 break-words">
          {resumeInfo?.jobTitle || "Professional Title"}
        </p>
        <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {resumeInfo?.email && <span className="break-all">{resumeInfo.email}</span>}
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
