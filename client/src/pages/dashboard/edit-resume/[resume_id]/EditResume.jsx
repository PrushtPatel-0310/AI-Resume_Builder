import React, { useEffect } from "react";
import ResumeForm from "../components/ResumeForm";
import PreviewPage from "../components/PreviewPage";
import { useParams } from "react-router-dom";
import { getResumeData, updateThisResume } from "@/Services/resumeAPI";
import { useDispatch, useSelector } from "react-redux";
import { addResumeData } from "@/features/resume/resumeFeatures";
import { useAutoSave } from "@/lib/useAutoSave";

const DEFAULT_SECTION_ORDER = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

export function EditResume() {
  const { resume_id } = useParams();
  const dispatch = useDispatch();
  const resumeInfo = useSelector((state) => state.editResume.resumeData);
  const [sectionOrder, setSectionOrder] = React.useState(DEFAULT_SECTION_ORDER);

  // Auto-save: watches resumeInfo and persists after 1.5s idle
  useAutoSave(resume_id, resumeInfo);

  const handleDragEnd = (result) => {
    const { source, destination } = result || {};

    if (!destination) return;
    if (source.index === destination.index) return;

    setSectionOrder((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev;

      const fixed = prev[0];
      const reorderable = [...prev.slice(1)];
      const [moved] = reorderable.splice(source.index, 1);
      reorderable.splice(destination.index, 0, moved);

      const nextOrder = [fixed, ...reorderable];

      dispatch(addResumeData({ ...(resumeInfo || {}), sectionOrder: nextOrder }));

      return nextOrder;
    });
  };

  useEffect(() => {
    dispatch(addResumeData({}));
    setSectionOrder(DEFAULT_SECTION_ORDER);

    getResumeData(resume_id).then((data) => {
      dispatch(addResumeData(data.data));
      if (
        Array.isArray(data?.data?.sectionOrder) &&
        data.data.sectionOrder.length > 0
      ) {
        setSectionOrder(data.data.sectionOrder);
      } else {
        setSectionOrder(DEFAULT_SECTION_ORDER);
      }
    });
  }, [resume_id]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-10">
        <ResumeForm
          key={`form-${resume_id}`}
          sectionOrder={sectionOrder}
          setSectionOrder={setSectionOrder}
          handleDragEnd={handleDragEnd}
        />
        <PreviewPage key={`preview-${resume_id}`} sectionOrder={sectionOrder} />
      </div>
    </div>
  );
}

export default EditResume;
