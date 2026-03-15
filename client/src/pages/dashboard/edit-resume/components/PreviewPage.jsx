import React from "react";
import { useSelector } from "react-redux";
import { TEMPLATE_MAP } from "@/templates/templateRegistry";

function PreviewPage({ resumeInfo, sectionOrder }) {
  const storeResumeData = useSelector((state) => state.editResume.resumeData);
  const resumeData = resumeInfo || storeResumeData;
  const effectiveSectionOrder = sectionOrder || resumeData?.sectionOrder;

  const selectedTemplateId = resumeData?.templateId || "default";
  const Template = TEMPLATE_MAP[selectedTemplateId] || TEMPLATE_MAP.default;

  return <Template resumeInfo={resumeData} sectionOrder={effectiveSectionOrder} />;
}

export default PreviewPage;
