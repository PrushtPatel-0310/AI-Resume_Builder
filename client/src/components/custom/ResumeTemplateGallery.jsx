import React from "react";
import { CheckCircle2 } from "lucide-react";

export const resumeTemplateMockData = [
  {
    id: "default",
    name: "Default",
    thumbnailUrl: "/default-preview.png",
  },
  {
    id: "ivy",
    name: "Ivy League",
    thumbnailUrl: "/ivy-league-preview.png",
  },
  {
    id: "elegant",
    name: "Elegant",
    thumbnailUrl: "/elegant-preview.png",
  },
  {
    id: "classic",
    name: "Classic",
    thumbnailUrl: "/classic-preview.png",
  },
  {
    id: "timeline",
    name: "Timeline",
    thumbnailUrl: "/timeline-preview.png",
  },
];

function ResumeTemplateGallery({
  templates = resumeTemplateMockData,
  selectedTemplateId,
  onSelect,
}) {
  const handleSelect = (templateId) => {
    if (onSelect) {
      onSelect(templateId);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              className={`group text-left rounded-xl border bg-white p-3 shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/30"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={template.thumbnailUrl}
                  alt={`${template.name} template preview`}
                  className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {isSelected && (
                  <div className="absolute right-3 top-3 rounded-full bg-white p-1 shadow">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                )}
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-800">{template.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ResumeTemplateGallery;
