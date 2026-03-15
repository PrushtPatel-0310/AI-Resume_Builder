import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Upload, LoaderCircle } from "lucide-react";
import { VITE_APP_URL } from "@/config/config";
import { createNewResume, updateThisResume } from "@/Services/resumeAPI";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addResumeData } from "@/features/resume/resumeFeatures";

const stripCodeFences = (value) => {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("```")) return text;

  const lines = text.split("\n");
  lines.shift();
  if (lines[lines.length - 1]?.trim() === "```") {
    lines.pop();
  }
  return lines.join("\n").trim();
};

const toParsedObject = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    const cleaned = stripCodeFences(value);
    try {
      return JSON.parse(cleaned);
    } catch {
      return { summary: cleaned };
    }
  }

  return {};
};

const pickArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const normalizeSkills = (skillsValue) => {
  if (Array.isArray(skillsValue)) {
    return skillsValue
      .map((skill) => {
        if (typeof skill === "string") return { name: skill.trim() };
        return { name: (skill?.name || skill?.skill || "").trim() };
      })
      .filter((skill) => skill.name);
  }

  if (typeof skillsValue === "string") {
    return skillsValue
      .split(/,|\||\n/) 
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  return [];
};

const hasValue = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
};

const hasStructuredData = (parsedData) => {
  const personal =
    parsedData?.personalDetail ||
    parsedData?.personalDetails ||
    parsedData?.personal_information ||
    parsedData?.basics ||
    {};

  const personalHasValue = [
    personal?.firstName,
    personal?.lastName,
    personal?.jobTitle,
    personal?.address,
    personal?.phone,
    personal?.email,
    personal?.first_name,
    personal?.last_name,
    personal?.title,
    personal?.location,
    personal?.phoneNumber,
  ].some(hasValue);

  const experienceHasValue = (parsedData?.experience || []).some((item) =>
    [item?.positionTitle, item?.title, item?.companyName, item?.summary].some(
      hasValue
    )
  );
  const projectsHasValue = (parsedData?.projects || []).some((item) =>
    [item?.projectName, item?.summary, item?.description].some(hasValue)
  );
  const educationHasValue = (parsedData?.education || []).some((item) =>
    [item?.degree, item?.major, item?.grade, item?.school].some(hasValue)
  );
  const normalizedSkills = normalizeSkills(parsedData?.skills);
  const skillsHasOnlyPlaceholderValues =
    normalizedSkills.length > 0 &&
    normalizedSkills.every((skill) => /^skill\d+$/i.test(skill.name || ""));
  const skillsHasValue =
    normalizedSkills.length > 0 && !skillsHasOnlyPlaceholderValues;

  return (
    personalHasValue ||
    experienceHasValue ||
    projectsHasValue ||
    educationHasValue ||
    skillsHasValue
  );
};

const shouldRepairFromSummary = (parsedData) => {
  const summaryText = parsedData?.summary;
  if (typeof summaryText !== "string" || !summaryText.trim()) return false;

  const looksLikeWholeResume = /SKILLS?|EDUCATION|PROJECTS?|EXPERIENCE|CGPA|GPA|@/i.test(
    summaryText
  );

  return looksLikeWholeResume && !hasStructuredData(parsedData);
};

const getSectionBlock = (text, key) => {
  const sectionPattern = new RegExp(
    `${key}\\s*[\\n:·-]*([\\s\\S]*?)(?=\\n\\s*(SKILLS?|EDUCATION|PROJECTS?|EXPERIENCE|WORK EXPERIENCE|SUMMARY|PROFILE|$))`,
    "i"
  );
  const match = text.match(sectionPattern);
  return match?.[1]?.trim() || "";
};

const parseFromSummaryBlob = (summaryText) => {
  if (!summaryText || typeof summaryText !== "string") return null;
  const text = summaryText.replace(/\r/g, " ");

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(\+?\d[\d\s()-]{8,}\d)/);

  const headText = text
    .split(/SKILLS?|EDUCATION|PROJECTS?|EXPERIENCE|WORK EXPERIENCE/i)[0]
    .trim();
  const headLine = headText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.includes("@"));

  const nameWords = (headLine || "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const personalDetail = {
    firstName: nameWords[0] || "",
    lastName: nameWords[1] || "",
    jobTitle: "",
    address: "",
    phone: phoneMatch?.[1]?.trim() || "",
    email: emailMatch?.[0] || "",
  };

  const skillsBlock = getSectionBlock(text, "SKILLS?");
  const skills = normalizeSkills(
    skillsBlock
      .replace(/[()]/g, " ")
      .replace(/\b(intermediate|advanced|beginner|proficient|expert)\b/gi, "")
  );

  const educationBlock = getSectionBlock(text, "EDUCATION");
  const cgpaMatch = educationBlock.match(/(?:CGPA|GPA)\s*[:\-]?\s*([0-9.]+)/i);
  const degreeMatch = educationBlock.match(
    /(Bachelor|Master|B\.?E\.?|B\.?Tech|M\.?Tech|Diploma)[^\n,]*/i
  );
  const majorMatch = educationBlock.match(
    /(Computer Science|Information Technology|Electronics|Mechanical|Civil)[^\n,]*/i
  );
  const education = educationBlock
    ? [
        {
          degree: degreeMatch?.[0] || "",
          major: majorMatch?.[0] || "",
          startDate: "",
          endDate: "",
          grade: cgpaMatch?.[1] || "",
          universityName:
            educationBlock
              .split(/CGPA|GPA|\(|\n/)[0]
              ?.replace(/^[-•\s]+/, "")
              .trim() || "",
        },
      ]
    : [];

  const projectsBlock = getSectionBlock(text, "PROJECTS?");
  const projectLines = projectsBlock
    .split("\n")
    .map((line) => line.replace(/^[-•❖\s]+/, "").trim())
    .filter(Boolean);
  const projects = projectLines.length
    ? [
        {
          projectName: projectLines[0] || "",
          techStack: "",
          summary: projectLines.slice(1).join(" ") || "",
        },
      ]
    : [];

  const experienceBlock = getSectionBlock(text, "(EXPERIENCE|WORK EXPERIENCE)");
  const experienceLines = experienceBlock
    .split("\n")
    .map((line) => line.replace(/^[-•❖\s]+/, "").trim())
    .filter(Boolean);
  const experience = experienceLines.length
    ? [
        {
          positionTitle: experienceLines[0] || "",
          companyName: "",
          city: "",
          state: "",
          startDate: "",
          endDate: "",
          summary: experienceLines.slice(1).join(" ") || "",
        },
      ]
    : [];

  const summary = getSectionBlock(text, "(SUMMARY|PROFILE)") || "";

  return {
    personalDetail,
    summary,
    experience,
    projects,
    education,
    skills: skills.map((item) => item.name),
  };
};

function UploadResume({ triggerVariant = "card" }) {
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const parseResponse = await axios.post(
        `${VITE_APP_URL}api/resume/parse`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const apiPayload = parseResponse?.data?.data || parseResponse?.data || {};
      const parsedData = toParsedObject(
        apiPayload?.parsedResume || apiPayload?.resume || apiPayload
      );
      let finalParsedData = parsedData;

      if (shouldRepairFromSummary(parsedData)) {
        const repaired = parseFromSummaryBlob(parsedData.summary);
        if (repaired) {
          finalParsedData = {
            ...parsedData,
            ...repaired,
          };
          console.log("AI Parsed Data Repaired From Summary:", finalParsedData);
        }
      }

      console.log("AI Parsed Data:", finalParsedData);

      const personalDetail =
        finalParsedData?.personalDetail ||
        finalParsedData?.personalDetails ||
        finalParsedData?.personal_information ||
        finalParsedData?.basics ||
        {};

      const summary =
        finalParsedData?.summary ||
        finalParsedData?.professionalSummary ||
        finalParsedData?.profileSummary ||
        "";

      const experience = pickArray(
        finalParsedData?.experience,
        finalParsedData?.experiences,
        finalParsedData?.workExperience,
        finalParsedData?.work_experience
      );

      const projects = pickArray(finalParsedData?.projects, finalParsedData?.project);
      const education = pickArray(
        finalParsedData?.education,
        finalParsedData?.educations,
        finalParsedData?.academic,
        finalParsedData?.academics
      );

      const skills = normalizeSkills(
        finalParsedData?.skills ||
          finalParsedData?.technicalSkills ||
          finalParsedData?.skill
      );

      const createdResumeResponse = await createNewResume({
        data: {
          title: `${file.name.replace(/\.pdf$/i, "")} (Imported)`,
          themeColor: "#000000",
          templateId: "default",
        },
      });

      const resumeId = createdResumeResponse?.data?.resume?._id;
      if (!resumeId) {
        throw new Error("Failed to create resume from uploaded file");
      }

      const mappedResumeData = {
        firstName:
          personalDetail?.firstName ||
          personalDetail?.first_name ||
          personalDetail?.givenName ||
          "",
        lastName:
          personalDetail?.lastName ||
          personalDetail?.last_name ||
          personalDetail?.familyName ||
          "",
        jobTitle:
          personalDetail?.jobTitle ||
          personalDetail?.title ||
          personalDetail?.headline ||
          "",
        address:
          personalDetail?.address ||
          personalDetail?.location ||
          personalDetail?.city ||
          "",
        phone:
          personalDetail?.phone ||
          personalDetail?.phoneNumber ||
          personalDetail?.mobile ||
          "",
        email: personalDetail?.email || personalDetail?.mail || "",
        linkedin:
          personalDetail?.linkedin ||
          personalDetail?.linkedIn ||
          personalDetail?.linkedinId ||
          personalDetail?.linkedinUrl ||
          "",
        summary: summary || "",
        experience: (experience || []).map((item) => ({
          title: item?.positionTitle || item?.title || item?.role || "",
          companyName: item?.companyName || "",
          city: item?.city || "",
          state: item?.state || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          currentlyWorking: "",
          workSummary: item?.summary || item?.description || "",
        })),
        projects: (projects || []).map((item) => ({
          projectName: item?.projectName || "",
          techStack: item?.techStack || "",
          projectSummary: item?.summary || item?.description || "",
        })),
        education: (education || []).map((item) => ({
          universityName: item?.universityName || item?.school || item?.college || "",
          degree: item?.degree || "",
          major: item?.major || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          grade: item?.grade || "",
        })),
        skills,
      };

      // If you manage section-level local state/context, map these directly:
      // setPersonalDetail(parsedData?.personalDetail || {});
      // setSummary(parsedData?.summary || "");
      // setExperience(parsedData?.experience || []);
      // setProjects(parsedData?.projects || []);
      // setEducation(parsedData?.education || []);
      // setSkills(parsedData?.skills || []);

      await updateThisResume(resumeId, {
        data: mappedResumeData,
      });

      dispatch(addResumeData({ ...mappedResumeData, _id: resumeId }));
      navigate(`/my-resume/edit-resume/${resumeId}`);
    } catch (error) {
      console.log("Error uploading/parsing resume", error?.message || error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFileSelect}
      />

      {triggerVariant === "button" ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="gap-2 border-slate-300 text-slate-700"
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {loading ? "Parsing resume with AI..." : "Upload"}
        </Button>
      ) : (
        <div className="p-6 border-2 bg-secondary rounded-lg h-[380px] hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {loading ? "Parsing resume with AI..." : "Upload Resume"}
          </Button>

          {loading && (
            <p className="text-sm text-muted-foreground">
              Parsing resume with AI...
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default UploadResume;
