import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Resume from "../models/resume.model.js";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_SECTION_ORDER = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

const RESUME_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    personalDetail: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        jobTitle: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
      },
      required: ["firstName", "lastName", "jobTitle", "address", "phone", "email"],
    },
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          positionTitle: { type: "string" },
          companyName: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          summary: { type: "string" },
        },
        required: [
          "positionTitle",
          "companyName",
          "city",
          "state",
          "startDate",
          "endDate",
          "summary",
        ],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          projectName: { type: "string" },
          techStack: { type: "string" },
          summary: { type: "string" },
        },
        required: ["projectName", "techStack", "summary"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          universityName: { type: "string" },
          degree: { type: "string" },
          major: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          grade: { type: "string" },
        },
        required: ["degree", "major", "startDate", "endDate", "grade"],
      },
    },
    skills: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "personalDetail",
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
  ],
};

const DEFAULT_PARSED_RESUME = {
  personalDetail: {
    firstName: "",
    lastName: "",
    jobTitle: "",
    address: "",
    phone: "",
    email: "",
  },
  summary: "",
  experience: [],
  projects: [],
  education: [],
  skills: [],
};

const pickSection = (text, sectionName, nextSections = []) => {
  const nextPattern = nextSections.length
    ? `(?=\\n\\s*(?:${nextSections.join("|")})\\b|$)`
    : "$";
  const pattern = new RegExp(
    `(?:^|\\n)\\s*${sectionName}\\b[\\s:\\-]*([\\s\\S]*?)${nextPattern}`,
    "i"
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() || "";
};

const parseResumeHeuristically = (rawText) => {
  const text = (rawText || "").replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(\+?\d[\d\s()-]{8,}\d)/)?.[1]?.trim() || "";

  const topLines = lines.slice(0, 8);
  const nameCandidate = topLines.find(
    (line) =>
      !line.includes("@") &&
      !line.match(/\d{4}|\+\d|skills|education|project|experience/i)
  );
  const nameWords = (nameCandidate || "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const skillsBlock = pickSection(text, "SKILLS?", ["EDUCATION", "PROJECTS?", "EXPERIENCE", "SUMMARY"]);
  const skills = (skillsBlock || "")
    .replace(/[()]/g, " ")
    .replace(/\b(intermediate|advanced|beginner|proficient|expert|core)\b/gi, "")
    .split(/,|\||\n|•|-/)
    .map((item) => item.trim())
    .filter((item) => item && item.length <= 40)
    .slice(0, 30);

  const educationBlock = pickSection(text, "EDUCATION", ["PROJECTS?", "EXPERIENCE", "SUMMARY", "SKILLS?"]);
  const degree =
    educationBlock.match(/(Bachelor[^\n,]*|Master[^\n,]*|B\.?E\.?[^\n,]*|B\.?Tech[^\n,]*|M\.?Tech[^\n,]*|Diploma[^\n,]*)/i)?.[0] || "";
  const major =
    educationBlock.match(/(Computer Science[^\n,]*|Information Technology[^\n,]*|Electronics[^\n,]*|Mechanical[^\n,]*|Civil[^\n,]*)/i)?.[0] || "";
  const grade = educationBlock.match(/(?:CGPA|GPA|Percentage)\s*[:\-]?\s*([0-9.]+%?)/i)?.[1] || "";
  const universityName =
    educationBlock
      .split(/CGPA|GPA|Percentage|\(|\n/i)[0]
      ?.replace(/^[-•❖\s]+/, "")
      .trim() || "";

  const projectsBlock = pickSection(text, "PROJECTS?", ["EXPERIENCE", "EDUCATION", "SUMMARY", "SKILLS?"]);
  const projectLines = projectsBlock
    .split("\n")
    .map((line) => line.replace(/^[-•❖\s]+/, "").trim())
    .filter(Boolean);
  const projectName = projectLines.find((line) => line.length > 3 && line.length < 90) || "";
  const projectSummary = projectLines.filter((line) => line !== projectName).join(" ");

  const experienceBlock = pickSection(text, "(EXPERIENCE|WORK EXPERIENCE)", ["PROJECTS?", "EDUCATION", "SUMMARY", "SKILLS?"]);
  const experienceLines = experienceBlock
    .split("\n")
    .map((line) => line.replace(/^[-•❖\s]+/, "").trim())
    .filter(Boolean);

  const summaryBlock = pickSection(text, "(SUMMARY|PROFILE)", ["EXPERIENCE", "PROJECTS?", "EDUCATION", "SKILLS?"]);

  return normalizeParsedResume({
    personalDetail: {
      firstName: nameWords[0] || "",
      lastName: nameWords[1] || "",
      jobTitle: "",
      address: "",
      phone,
      email,
    },
    summary: summaryBlock || "",
    experience: experienceLines.length
      ? [
          {
            positionTitle: experienceLines[0] || "",
            companyName: "",
            city: "",
            state: "",
            startDate: "",
            endDate: "",
            summary: experienceLines.slice(1).join(" "),
          },
        ]
      : [],
    projects: projectName
      ? [
          {
            projectName,
            techStack: "",
            summary: projectSummary,
          },
        ]
      : [],
    education: degree || universityName
      ? [
          {
            degree,
            major,
            startDate: "",
            endDate: "",
            grade,
            universityName,
          },
        ]
      : [],
    skills,
  });
};

const isLowQualityParsed = (parsed, rawText = "") => {
  const data = normalizeParsedResume(parsed);

  const personal = data.personalDetail || {};
  const personalScore = [
    personal.firstName,
    personal.lastName,
    personal.email,
    personal.phone,
    personal.jobTitle,
  ].filter((item) => item?.trim()).length;

  const skillsArePlaceholders =
    data.skills.length > 0 && data.skills.every((skill) => /^skill\d+$/i.test(skill));

  const summaryLooksLikeRawDump =
    (data.summary || "").length > 600 &&
    /SKILLS?|EDUCATION|PROJECTS?|EXPERIENCE|@/i.test(data.summary || "");

  const structuredItemsCount =
    data.experience.length + data.projects.length + data.education.length + data.skills.length;

  const hasVeryLowSignal = personalScore === 0 && structuredItemsCount <= 2;

  const tooCloseToRawText =
    data.summary && rawText
      ? data.summary.replace(/\s+/g, " ").trim() === rawText.replace(/\s+/g, " ").trim().slice(0, data.summary.length)
      : false;

  return (
    skillsArePlaceholders ||
    summaryLooksLikeRawDump ||
    hasVeryLowSignal ||
    tooCloseToRawText
  );
};

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

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
};

const extractJsonObjectText = (text = "") => {
  const source = String(text || "").trim();
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    return null;
  }

  return source.slice(first, last + 1);
};

const buildFallbackSuggestions = (missingSkills = []) => {
  const prioritized = (Array.isArray(missingSkills) ? missingSkills : [])
    .map((skill) => String(skill || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const skillsText = prioritized.length
    ? prioritized.join(", ")
    : "the most important skills from the job description";

  return [
    `Update your summary to align with the role and mention ${skillsText} in a clear, outcome-focused sentence.`,
    `Strengthen experience bullet points with measurable impact (numbers, scale, and results) and naturally include ${skillsText}.`,
    "Add or expand one project that mirrors this role’s responsibilities, highlighting tools used, your ownership, and business impact.",
  ];
};

const parseHybridAtsResponse = (raw) => {
  const cleaned = stripCodeFences(raw);
  let parsed = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const extracted = extractJsonObjectText(cleaned);
    if (extracted) {
      parsed = JSON.parse(extracted);
    } else {
      throw new Error("Gemini response is not valid JSON");
    }
  }

  const semanticScore = clampScore(parsed?.semanticScore);
  const suggestions = Array.isArray(parsed?.improvementSuggestions)
    ? parsed.improvementSuggestions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    semanticScore,
    improvementSuggestions: suggestions,
  };
};

const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;
  return typeof key === "string" ? key.trim() : "";
};

const DEFAULT_GEMINI_MODEL_CANDIDATES = [
  { apiVersion: "v1", modelName: "gemini-2.5-flash" },
  { apiVersion: "v1", modelName: "gemini-2.0-flash" },
  { apiVersion: "v1", modelName: "gemini-1.5-flash" },
  { apiVersion: "v1beta", modelName: "gemini-2.5-flash" },
  { apiVersion: "v1beta", modelName: "gemini-2.0-flash" },
  { apiVersion: "v1beta", modelName: "gemini-1.5-flash-latest" },
];

const generateGeminiContentWithModelFallback = async (
  apiKey,
  contents,
  generationConfig = {}
) => {
  let lastError = null;
  let sawQuotaError = false;

  for (const candidate of DEFAULT_GEMINI_MODEL_CANDIDATES) {
    try {
      const url = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const errorMessage =
          errorPayload?.error?.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (raw.trim()) {
        return {
          raw,
          apiVersion: candidate.apiVersion,
          modelName: candidate.modelName,
        };
      }
    } catch (error) {
      lastError = error;

      if (isGeminiQuotaError(error)) {
        sawQuotaError = true;
        continue;
      }

      const message = String(error?.message || "").toLowerCase();
      const shouldTryNextModel =
        String(error?.status || "") === "404" ||
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("not supported") ||
        message.includes("permission_denied") ||
        message.includes("invalid_argument");

      if (!shouldTryNextModel) {
        throw error;
      }
    }
  }

  if (sawQuotaError) {
    throw new Error("Gemini quota exceeded for all ATS model candidates");
  }

  throw lastError || new Error("No supported Gemini model available for ATS scoring");
};

const generateAtsContentWithModelFallback = async (apiKey, promptText) => {
  const result = await generateGeminiContentWithModelFallback(
    apiKey,
    [{ parts: [{ text: promptText }] }],
    {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
    }
  );

  console.log(
    `Gemini ATS scoring used ${result.apiVersion}/${result.modelName}`
  );

  return result.raw;
};

const formatGeminiErrorMessage = (error) => {
  const message = String(error?.message || "").trim();
  if (!message) return "Unknown Gemini error";
  return message.split("\n")[0].slice(0, 220);
};

const isGeminiQuotaError = (error) => {
  const message = String(error?.message || "");
  return (
    message.includes("429") ||
    message.toLowerCase().includes("quota exceeded") ||
    message.toLowerCase().includes("rate limit") ||
    message.includes("generate_content_free_tier")
  );
};

const normalizeParsedResume = (parsed) => {
  const data = parsed && typeof parsed === "object" ? parsed : {};

  return {
    personalDetail: {
      firstName: data?.personalDetail?.firstName || "",
      lastName: data?.personalDetail?.lastName || "",
      jobTitle: data?.personalDetail?.jobTitle || "",
      address: data?.personalDetail?.address || "",
      phone: data?.personalDetail?.phone || "",
      email: data?.personalDetail?.email || "",
    },
    summary: data?.summary || "",
    experience: Array.isArray(data?.experience)
      ? data.experience.map((item) => ({
          positionTitle: item?.positionTitle || "",
          companyName: item?.companyName || "",
          city: item?.city || "",
          state: item?.state || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          summary: item?.summary || "",
        }))
      : [],
    projects: Array.isArray(data?.projects)
      ? data.projects.map((item) => ({
          projectName: item?.projectName || "",
          techStack: item?.techStack || "",
          summary: item?.summary || "",
        }))
      : [],
    education: Array.isArray(data?.education)
      ? data.education.map((item) => ({
          universityName: item?.universityName || "",
          degree: item?.degree || "",
          major: item?.major || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          grade: item?.grade || "",
        }))
      : [],
    skills: Array.isArray(data?.skills)
      ? data.skills
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [],
  };
};

/* const parseTextWithAI = async (rawText) => {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;

  if (!geminiApiKey) {
    return {
      ...DEFAULT_PARSED_RESUME,
      summary: rawText?.slice(0, 1500) || "",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const modelCandidates = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
            const apiModelCandidates = [
              { apiVersion: "v1", modelName: "gemini-2.5-flash" },
              { apiVersion: "v1", modelName: "gemini-2.0-flash" },
              { apiVersion: "v1", modelName: "gemini-1.5-flash" },
              { apiVersion: "v1beta", modelName: "gemini-2.5-flash" },
              { apiVersion: "v1beta", modelName: "gemini-2.0-flash" },
              { apiVersion: "v1beta", modelName: "gemini-1.5-flash-latest" },
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              let sawQuotaError = false;
              temperature: 0.1,
              for (const candidate of apiModelCandidates) {
              topK: 40,
                  const url = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${geminiApiKey}`;
                  const response = await fetch(url, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: promptText }] }],
                      generationConfig: {
          });

          const result = await model.generateContent(promptText);
          const raw = result?.response?.text?.() || "";
                        responseSchema,
                      },
                    }),
          if (raw?.trim()) {
            return raw;
                  if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    const errorMessage =
                      errorPayload?.error?.message || `API Error: ${response.status}`;
                    const error = new Error(errorMessage);
                    error.status = response.status;
                    throw error;
                  }

                  const data = await response.json();
                  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          lastError = error;

                    console.log(
                      `Gemini parsing used ${candidate.apiVersion}/${candidate.modelName}`
                    );
          if (isGeminiQuotaError(error)) {
            continue;
          }

          const message = String(error?.message || "");
          const shouldTryNextModel =
                    sawQuotaError = true;
            message.includes("404") ||
            message.includes("not found") ||
            message.includes("not supported") ||
            message.includes("PERMISSION_DENIED") ||
            message.includes("INVALID_ARGUMENT");
                    String(error?.status || "") === "404" ||

          if (!shouldTryNextModel) {
            throw error;
          }
        }
      }

      throw lastError || new Error("No supported Gemini model available");
    };

    const aiInputText = (rawText || "").slice(0, 18000);

              if (sawQuotaError) {
                throw new Error("429 quota exceeded for all available Gemini model candidates");
              }

    const prompt = `You are an expert resume parser for ATS-style resumes.

TASK:
            const raw = await generateWithCandidates(prompt, RESUME_RESPONSE_SCHEMA);

              const retryRaw = await generateWithCandidates(
                retryPrompt,
                RESUME_RESPONSE_SCHEMA
              );
{
  "personalDetail": { "firstName": "", "lastName": "", "jobTitle": "", "address": "", "phone": "", "email": "" },
  "summary": "",
  "experience": [{ "positionTitle": "", "companyName": "", "city": "", "state": "", "startDate": "", "endDate": "", "summary": "" }],
  "projects": [{ "projectName": "", "techStack": "", "summary": "" }],
  "education": [{ "universityName": "", "degree": "", "major": "", "startDate": "", "endDate": "", "grade": "" }],
  "skills": []
}

HARD RULES:
- Never return markdown or code fences.
- Never dump full resume text into any single field.
- "summary" must be only professional profile summary text (2-5 lines max), not skills/projects/education blocks.
- Parse each section into its own array/object.
- Use factual text from resume only. Do not invent content.
- If a value is unavailable, use empty string "".
- If a section is unavailable, return [].
- Keep dates as plain strings exactly as found.
- skills must be an array of strings only.
- For projects: each project in separate array item; put bullet points in that project's summary.
- For education: degree/major/grade must be extracted if present.
- Extract contact details into personalDetail.email and personalDetail.phone.

QUALITY CHECK BEFORE OUTPUT:
1) Ensure personalDetail is not all empty if email/phone/name exists in text.
2) Ensure summary length is under 700 characters.
3) Ensure placeholder values like "skill1" are not returned unless truly unknown (prefer []).

Resume text:
${aiInputText}`;

    const raw = await generateWithCandidates(prompt);
    let parsed = normalizeParsedResume(JSON.parse(stripCodeFences(raw)));

    if (isLowQualityParsed(parsed, rawText)) {
      const retryPrompt = `Your previous parsing was low quality.
Re-parse the same resume text and strictly fix these issues:
- Do not place section blocks into summary.
- Extract real skills list, no placeholders.
- Fill personalDetail from header/contact lines.
- Split projects and experience into proper array objects.
Return ONLY JSON in the exact required schema.

Resume text:
${aiInputText}`;

      const retryRaw = await generateWithCandidates(retryPrompt);
      const retryParsed = normalizeParsedResume(
        JSON.parse(stripCodeFences(retryRaw))
      );

      parsed = isLowQualityParsed(retryParsed, rawText)
        ? parseResumeHeuristically(rawText)
        : retryParsed;
    }

    return parsed;
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      console.warn("Gemini quota exceeded. Using deterministic fallback parser.");
    } else {
      console.error("Gemini parsing failed, using fallback:", error?.message || error);
    }
    return parseResumeHeuristically(rawText);
  }
};

}; */

const parseTextWithAI = async (rawText) => {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;

  if (!geminiApiKey) {
    return {
      ...DEFAULT_PARSED_RESUME,
      summary: rawText?.slice(0, 1500) || "",
    };
  }

  const apiModelCandidates = [
    { apiVersion: "v1", modelName: "gemini-2.5-flash" },
    { apiVersion: "v1", modelName: "gemini-2.0-flash" },
    { apiVersion: "v1", modelName: "gemini-1.5-flash" },
    { apiVersion: "v1beta", modelName: "gemini-2.5-flash" },
    { apiVersion: "v1beta", modelName: "gemini-2.0-flash" },
    { apiVersion: "v1beta", modelName: "gemini-1.5-flash-latest" },
  ];

  const generateWithCandidates = async (promptText) => {
    let lastError = null;
    let sawQuotaError = false;

    for (const candidate of apiModelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              topK: 40,
            },
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const errorMessage =
            errorPayload?.error?.message || `API Error: ${response.status}`;
          const error = new Error(errorMessage);
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (raw?.trim()) {
          console.log(
            `Gemini parsing used ${candidate.apiVersion}/${candidate.modelName}`
          );
          return raw;
        }
      } catch (error) {
        lastError = error;

        if (isGeminiQuotaError(error)) {
          sawQuotaError = true;
          continue;
        }

        const message = String(error?.message || "");
        const shouldTryNextModel =
          String(error?.status || "") === "404" ||
          message.includes("404") ||
          message.includes("not found") ||
          message.includes("not supported") ||
          message.includes("PERMISSION_DENIED") ||
          message.includes("INVALID_ARGUMENT");

        if (!shouldTryNextModel) {
          throw error;
        }
      }
    }

    if (sawQuotaError) {
      throw new Error("429 quota exceeded for all available Gemini model candidates");
    }

    throw lastError || new Error("No supported Gemini model available");
  };

  try {
    const aiInputText = (rawText || "").slice(0, 18000);

    const prompt = `You are an expert resume parser for ATS-style resumes.

TASK:
Extract structured resume data ONLY from the provided text and return STRICT JSON.

OUTPUT FORMAT (exact keys, do not rename):
{
  "personalDetail": { "firstName": "", "lastName": "", "jobTitle": "", "address": "", "phone": "", "email": "" },
  "summary": "",
  "experience": [{ "positionTitle": "", "companyName": "", "city": "", "state": "", "startDate": "", "endDate": "", "summary": "" }],
  "projects": [{ "projectName": "", "techStack": "", "summary": "" }],
  "education": [{ "universityName": "", "degree": "", "major": "", "startDate": "", "endDate": "", "grade": "" }],
  "skills": []
}

HARD RULES:
- Never return markdown or code fences.
- Never dump full resume text into any single field.
- "summary" must be only professional profile summary text (2-5 lines max), not skills/projects/education blocks.
- Parse each section into its own array/object.
- Use factual text from resume only. Do not invent content.
- If a value is unavailable, use empty string "".
- If a section is unavailable, return [].
- Keep dates as plain strings exactly as found.
- skills must be an array of strings only.
- For projects: each project in separate array item; put bullet points in that project's summary.
- For education: degree/major/grade must be extracted if present.
- Extract contact details into personalDetail.email and personalDetail.phone.

QUALITY CHECK BEFORE OUTPUT:
1) Ensure personalDetail is not all empty if email/phone/name exists in text.
2) Ensure summary length is under 700 characters.
3) Ensure placeholder values like "skill1" are not returned unless truly unknown (prefer []).

Resume text:
${aiInputText}`;

    const raw = await generateWithCandidates(prompt);
    let parsed = normalizeParsedResume(JSON.parse(stripCodeFences(raw)));

    if (isLowQualityParsed(parsed, rawText)) {
      const retryPrompt = `Your previous parsing was low quality.
Re-parse the same resume text and strictly fix these issues:
- Do not place section blocks into summary.
- Extract real skills list, no placeholders.
- Fill personalDetail from header/contact lines.
- Split projects and experience into proper array objects.
Return ONLY JSON in the exact required schema.

Resume text:
${aiInputText}`;

      const retryRaw = await generateWithCandidates(retryPrompt);
      const retryParsed = normalizeParsedResume(
        JSON.parse(stripCodeFences(retryRaw))
      );

      parsed = isLowQualityParsed(retryParsed, rawText)
        ? parseResumeHeuristically(rawText)
        : retryParsed;
    }

    return parsed;
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      console.warn("Gemini quota exceeded. Using deterministic fallback parser.");
    } else {
      console.error("Gemini parsing failed, using fallback:", error?.message || error);
    }
    return parseResumeHeuristically(rawText);
  }
};

const start = async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Welcome to Resume Builder API"));
};

const createResume = async (req, res) => {
  const { title, themeColor, templateId } = req.body;

  // Validate that the title and themeColor are provided
  if (!title || !themeColor) {
    return res
      .status(400)
      .json(new ApiError(400, "Title and themeColor are required."));
  }

  try {
    // Create a new resume with empty fields for other attributes
    const resume = await Resume.create({
      title,
      themeColor,
      templateId: templateId || "default",
      user: req.user._id, // Set the user ID from the authenticated user
      firstName: "",
      lastName: "",
      email: "",
      summary: "",
      jobTitle: "",
      phone: "",
      address: "",
      experience: [],
      education: [], // Initialize as an empty array
      skills: [],
      projects: [],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { resume }, "Resume created successfully"));
  } catch (error) {
    console.error("Error creating resume:", error);
    return res
      .status(500)
      .json(
        new ApiError(500, "Internal Server Error", [error.message], error.stack)
      );
  }
};

const getALLResume = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user });
    return res
      .status(200)
      .json(new ApiResponse(200, resumes, "Resumes fetched successfully"));
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], error.stack));
  }
};

const getResume = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json(new ApiError(400, "Resume ID is required."));
    }

    // Find the resume by ID
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json(new ApiError(404, "Resume not found."));
    }

    // Check if the resume belongs to the current user
    if (resume.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(
          new ApiError(403, "You are not authorized to access this resume.")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, resume, "Resume fetched successfully"));
  } catch (error) {
    console.error("Error fetching resume:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], error.stack));
  }
};

const updateResume = async (req, res) => {
  console.log("Resume update request received:");
  const id = req.query.id;

  try {
    // Find and update the resume with the provided ID and user ID
    console.log("Database update request started");
    const updatedResume = await Resume.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: req.body, $currentDate: { updatedAt: true } }, // Set updatedAt to current date
      { new: true } // Return the modified document
    );

    if (!updatedResume) {
      console.log("Resume not found or unauthorized");
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Resume not found or unauthorized"));
    }

    console.log("Resume updated successfully:");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedResume, "Resume updated successfully"));
  } catch (error) {
    console.error("Error updating resume:", error);
    return res
      .status(500)
      .json(
        new ApiError(500, "Internal Server Error", [error.message], error.stack)
      );
  }

  // return res.status(200).json({ message: "Hello World" });
};

const removeResume = async (req, res) => {
  const id = req.query.id;

  try {
    // Check if the resume exists and belongs to the current user
    const resume = await Resume.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!resume) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Resume not found or not authorized to delete this resume"
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Resume deleted successfully"));
  } catch (error) {
    console.error("Error while deleting resume:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
};

const parseResumePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(new ApiError(400, "PDF file is required."));
    }

    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData?.text || "";
    const parsedResume = await parseTextWithAI(rawText);

    return res
      .status(200)
      .json(new ApiResponse(200, parsedResume, "Resume parsed successfully"));
  } catch (error) {
    console.error("Error parsing resume PDF:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to parse resume PDF", [], error.stack));
  }
};

const scoreResumeHybrid = async (req, res) => {
  try {
    const {
      resumeText,
      jobDescription,
      deterministicMatchScore,
      missingSkills = [],
    } = req.body || {};

    if (!resumeText || !jobDescription) {
      return res
        .status(400)
        .json(new ApiError(400, "resumeText and jobDescription are required."));
    }

    const deterministicScore = clampScore(deterministicMatchScore);
    if (!Number.isFinite(Number(deterministicMatchScore))) {
      return res
        .status(400)
        .json(new ApiError(400, "deterministicMatchScore must be a number."));
    }

    const normalizedMissingSkills = Array.isArray(missingSkills)
      ? missingSkills
          .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
          .filter(Boolean)
      : [];

    const geminiApiKey = getGeminiApiKey();

    if (!geminiApiKey) {
      return res
        .status(500)
        .json(new ApiError(500, "Gemini API key is not configured."));
    }

    const prompt = `You are an expert ATS system and a seasoned technical recruiter. Your task is to analyze a candidate's resume against a job description.
Instructions:
Semantic Score: Evaluate the resume's overall quality, soft skills, project impact, and general role relevance (excluding specific keyword matches, which are handled separately). Provide a semanticScore out of 100 based on this qualitative assessment.

Improvement Suggestions: Provide 3 actionable and specific suggestions to improve the resume for this job description. Crucially, consider the following skills identified as missing by a prior keyword analysis: ${normalizedMissingSkills.join(", ")}. Focus your suggestions on how the candidate can better articulate their experience, add relevant projects, or rephrase sections to address these missing areas.

Format: Return your response STRICTLY as a JSON object with the following keys:

semanticScore: (number 0-100)

improvementSuggestions: (array of 3 strings)

Resume:
${String(resumeText || "").slice(0, 16000)}

Job Description:
${String(jobDescription || "").slice(0, 12000)}`;

    let semanticScore = deterministicScore;
    let improvementSuggestions = buildFallbackSuggestions(normalizedMissingSkills);

    try {
      const raw = await generateAtsContentWithModelFallback(geminiApiKey, prompt);

      const parsedAi = parseHybridAtsResponse(raw);
      semanticScore = parsedAi.semanticScore;
      improvementSuggestions = parsedAi.improvementSuggestions;
    } catch (aiError) {
      const prefix = isGeminiQuotaError(aiError)
        ? "Gemini ATS scoring fallback used (quota):"
        : "Gemini ATS scoring fallback used:";
      console.warn(prefix, formatGeminiErrorMessage(aiError));
    }

    if (!Array.isArray(improvementSuggestions) || improvementSuggestions.length < 3) {
      improvementSuggestions = buildFallbackSuggestions(normalizedMissingSkills);
    }

    const finalScore = Number(
      (deterministicScore * 0.4 + semanticScore * 0.6).toFixed(2)
    );

    const payload = {
      finalScore,
      deterministicMatchScore: deterministicScore,
      semanticScore,
      missingSkills: normalizedMissingSkills,
      improvementSuggestions,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, payload, "Hybrid ATS score generated successfully"));
  } catch (error) {
    console.error("Error generating hybrid ATS score:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to generate hybrid ATS score", [error.message], error.stack));
  }
};

const generateAiContent = async (req, res) => {
  try {
    const { contents } = req.body || {};

    if (!Array.isArray(contents) || contents.length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, "contents must be a non-empty array."));
    }

    const geminiApiKey = getGeminiApiKey();

    if (!geminiApiKey) {
      return res
        .status(500)
        .json(new ApiError(500, "Gemini API key is not configured."));
    }

    const result = await generateGeminiContentWithModelFallback(
      geminiApiKey,
      contents,
      {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          text: result.raw,
          apiVersion: result.apiVersion,
          modelName: result.modelName,
        },
        "AI content generated successfully"
      )
    );
  } catch (error) {
    console.error("Error generating AI content:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to generate AI content", [error.message], error.stack));
  }
};

export {
  start,
  createResume,
  getALLResume,
  getResume,
  updateResume,
  removeResume,
  parseResumePdf,
  scoreResumeHybrid,
  generateAiContent,
};
