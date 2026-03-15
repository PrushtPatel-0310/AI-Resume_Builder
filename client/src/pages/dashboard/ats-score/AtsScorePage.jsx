import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getAllResumeData, getHybridAtsScore, parseResumePdfFile } from "@/Services/resumeAPI";
import { Upload, FileText, X } from "lucide-react";

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "that",
  "this",
  "you",
  "your",
  "are",
  "have",
  "has",
  "our",
  "job",
  "role",
  "will",
  "into",
  "about",
  "years",
  "year",
  "using",
  "ability",
  "experience",
  "work",
  "team",
  "teams",
  "candidate",
  "strong",
  "knowledge",
]);

const normalizeSkill = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/react\.?js/g, "react")
    .replace(/express\.?js/g, "express")
    .replace(/node\.?js/g, "node")
    .replace(/c\s*\/\s*c\+\+/g, "c++")
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueList = (values) => [...new Set(values.filter(Boolean))];

const buildResumeTextFromParsed = (parsed) => {
  const personal = parsed?.personalDetail || {};
  const lines = [];

  lines.push(
    [
      personal?.firstName || parsed?.firstName,
      personal?.lastName || parsed?.lastName,
      personal?.jobTitle || parsed?.jobTitle,
      personal?.email || parsed?.email,
      personal?.phone || parsed?.phone,
    ]
      .filter(Boolean)
      .join(" | ")
  );

  if (parsed?.summary) {
    lines.push(`Summary: ${parsed.summary}`);
  }

  if (Array.isArray(parsed?.experience) && parsed.experience.length > 0) {
    lines.push(
      "Experience: " +
        parsed.experience
          .map((item) =>
            [item?.positionTitle || item?.title, item?.companyName, item?.summary || item?.workSummary]
              .filter(Boolean)
              .join(" - ")
          )
          .join(" | ")
    );
  }

  if (Array.isArray(parsed?.projects) && parsed.projects.length > 0) {
    lines.push(
      "Projects: " +
        parsed.projects
          .map((item) => [item?.projectName, item?.techStack, item?.summary || item?.projectSummary].filter(Boolean).join(" - "))
          .join(" | ")
    );
  }

  if (Array.isArray(parsed?.education) && parsed.education.length > 0) {
    lines.push(
      "Education: " +
        parsed.education
          .map((item) => [item?.degree, item?.major, item?.universityName || item?.schoolName, item?.grade].filter(Boolean).join(" - "))
          .join(" | ")
    );
  }

  if (Array.isArray(parsed?.skills) && parsed.skills.length > 0) {
    lines.push(
      `Skills: ${parsed.skills
        .map((skill) => (typeof skill === "string" ? skill : skill?.name || ""))
        .filter(Boolean)
        .join(", ")}`
    );
  }

  return lines.filter(Boolean).join("\n").trim();
};

const extractResumeSkills = (parsed) => {
  if (!Array.isArray(parsed?.skills)) return [];
  return uniqueList(
    parsed.skills
      .map((skill) => (typeof skill === "string" ? skill : skill?.name || ""))
      .map(normalizeSkill)
  );
};

const extractJobSkills = (jobDescription) => {
  const words = String(jobDescription || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && word.length > 2 && !STOP_WORDS.has(word));

  const frequencyMap = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);
};

const getDeterministicScoreAndMissing = (resumeSkills, jobSkills) => {
  if (!jobSkills.length) {
    return {
      deterministicMatchScore: 0,
      missingSkills: [],
    };
  }

  const normalizedResumeSkills = uniqueList(resumeSkills.map(normalizeSkill));
  const matchesSkill = (jobSkill) => {
    const normalizedJobSkill = normalizeSkill(jobSkill);
    return normalizedResumeSkills.some(
      (resumeSkill) =>
        resumeSkill === normalizedJobSkill ||
        resumeSkill.includes(normalizedJobSkill) ||
        normalizedJobSkill.includes(resumeSkill)
    );
  };

  const matchedSkills = jobSkills.filter((skill) => matchesSkill(skill));
  const missingSkills = jobSkills.filter((skill) => !matchesSkill(skill));
  const deterministicMatchScore = Number(((matchedSkills.length / jobSkills.length) * 100).toFixed(2));

  return {
    deterministicMatchScore,
    missingSkills,
  };
};

function AtsScorePage() {
  const fileInputRef = React.useRef(null);
  const [resumeFile, setResumeFile] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [savedResumes, setSavedResumes] = React.useState([]);
  const [selectedResumeId, setSelectedResumeId] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [loadingResumes, setLoadingResumes] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    const fetchSavedResumes = async () => {
      try {
        setLoadingResumes(true);
        const response = await getAllResumeData();
        setSavedResumes(response?.data || []);
      } catch (error) {
        toast(error?.message || "Failed to load saved resumes");
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchSavedResumes();
  }, []);

  const onSubmit = async () => {
    if (loading) return;

    if (!resumeFile && !selectedResumeId) {
      toast("Please upload a resume PDF or select a saved resume");
      return;
    }

    if (!jobDescription.trim()) {
      toast("Please enter a job description");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      let parsedResume = {};
      if (resumeFile) {
        const parseResponse = await parseResumePdfFile(resumeFile);
        parsedResume = parseResponse?.data || {};
      } else {
        const selectedResume = savedResumes.find((resume) => resume?._id === selectedResumeId);
        if (!selectedResume) {
          toast("Selected saved resume was not found");
          return;
        }
        parsedResume = selectedResume;
      }

      const resumeSkills = extractResumeSkills(parsedResume);
      const jobSkills = extractJobSkills(jobDescription);
      const { deterministicMatchScore, missingSkills } =
        getDeterministicScoreAndMissing(resumeSkills, jobSkills);

      const resumeText = buildResumeTextFromParsed(parsedResume);

      const scoreResponse = await getHybridAtsScore({
        resumeText,
        jobDescription,
        deterministicMatchScore,
        missingSkills,
      });

      setResult(scoreResponse?.data || null);
    } catch (error) {
      toast(error?.message || "Failed to generate ATS score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold text-slate-900">Check ATS Score</h1>
      <p className="mt-2 text-slate-600">Upload your resume and paste a job description to get hybrid ATS scoring.</p>

      <div className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Upload Resume (PDF)</label>
          {/* Drag-and-Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type === "application/pdf") {
                setResumeFile(file);
                setSelectedResumeId("");
              } else {
                toast("Please drop a PDF file");
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : resumeFile
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={loading}
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] || null);
                if (event.target.files?.[0]) {
                  setSelectedResumeId("");
                }
              }}
            />
            {resumeFile ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{resumeFile.name}</p>
                  <p className="text-xs text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResumeFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload className={`h-10 w-10 ${isDragging ? "text-indigo-500" : "text-slate-400"}`} />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Drag & drop your resume PDF here
                </p>
                <p className="mt-1 text-xs text-slate-400">or click to browse</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Or Choose Saved Resume</label>
          <select
            value={selectedResumeId}
            onChange={(event) => {
              const nextResumeId = event.target.value;
              setSelectedResumeId(nextResumeId);
              if (nextResumeId) {
                setResumeFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading || loadingResumes || savedResumes.length === 0}
          >
            <option value="">{loadingResumes ? "Loading saved resumes..." : "Select a saved resume"}</option>
            {savedResumes.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.title || "Untitled Resume"}
              </option>
            ))}
          </select>
          {selectedResumeId ? (
            <p className="mt-2 text-xs text-slate-500">
              Selected: {savedResumes.find((resume) => resume._id === selectedResumeId)?.title || "Saved resume"}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Job Description</label>
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={10}
            placeholder="Paste the complete job description here"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Checking..." : "Check ATS Score"}
          </Button>
        </div>
      </div>

      {result ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Result</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-slate-500">Final Score</p>
              <p className="text-2xl font-bold text-slate-900">{result.finalScore}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-slate-500">Deterministic Score</p>
              <p className="text-2xl font-bold text-slate-900">{result.deterministicMatchScore}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-slate-500">Semantic Score</p>
              <p className="text-2xl font-bold text-slate-900">{result.semanticScore}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Missing Skills</h3>
            <p className="mt-2 text-sm text-slate-600">
              {(result.missingSkills || []).length
                ? result.missingSkills.join(", ")
                : "No major missing skills detected by deterministic layer."}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Improvement Suggestions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(result.improvementSuggestions || []).map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AtsScorePage;