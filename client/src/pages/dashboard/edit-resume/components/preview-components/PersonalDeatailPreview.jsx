import React from "react";

function PersonalDeatailPreview({ resumeInfo }) {
  const linkedId = resumeInfo?.linked_id || resumeInfo?.linkedin;
  return (
    <div>
      <h2
        className="font-bold text-xl text-center"
        style={{
          color: resumeInfo?.themeColor,
        }}
      >
        {resumeInfo?.firstName} {resumeInfo?.lastName}
      </h2>
      <h2 className="text-center text-sm font-medium">
        {resumeInfo?.jobTitle}
      </h2>
      <h2
        className="text-center font-normal text-xs"
        style={{
          color: resumeInfo?.themeColor,
        }}
      >
        {resumeInfo?.address}
      </h2>

      <div className="flex justify-between">
        <h2
          className="font-normal text-xs"
          style={{
            color: resumeInfo?.themeColor,
          }}
        >
          {resumeInfo?.phone}
        </h2>
        <h2
          className="font-normal text-xs"
          style={{
            color: resumeInfo?.themeColor,
          }}
        >
          {resumeInfo?.email}
        </h2>
      </div>
      {linkedId ? (
        <h2
          className="text-center font-normal text-xs mt-1"
          style={{
            color: resumeInfo?.themeColor,
          }}
        >
          {linkedId}
        </h2>
      ) : null}
      <hr
        className="border-[1.5px] my-2"
        style={{
          borderColor: resumeInfo?.themeColor,
        }}
      />
    </div>
  );
}

export default PersonalDeatailPreview;
