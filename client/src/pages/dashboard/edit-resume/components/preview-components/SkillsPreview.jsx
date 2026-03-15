import React from "react";

function SkillsPreview({ resumeInfo }) {
  const skills = Array.isArray(resumeInfo?.skills)
    ? resumeInfo.skills.map((skill) =>
        typeof skill === "string" ? skill : skill?.name || ""
      )
    : [];

  return (
    <div className="my-6">
      {skills.length > 0 && (
        <div>
          <h2
            className="text-center font-bold text-sm mb-2"
            style={{
              color: resumeInfo?.themeColor,
            }}
          >
            Skills
          </h2>
          <hr
            style={{
              borderColor: resumeInfo?.themeColor,
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 my-4">
        {skills.map((skillName, index) => (
          <div key={index} className="flex items-center justify-between">
            <h2 className="text-xs">{skillName}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillsPreview;
