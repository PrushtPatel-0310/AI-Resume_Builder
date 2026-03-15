import React, { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AIChatSession } from "@/Services/AiModel";

const prompt =
  "Job Title: {jobTitle}. Generate a list of summaries for 3 experience levels: Senior Level, Mid Level, and Fresher level. Each summary should be 3-4 lines. Return ONLY valid JSON array format with no markdown code blocks, no explanations, just the JSON. Each object must have 'summary' and 'experience_level' fields. Example format: [{\"summary\":\"...\",\"experience_level\":\"Senior Level\"},{\"summary\":\"...\",\"experience_level\":\"Mid Level\"},{\"summary\":\"...\",\"experience_level\":\"Fresher Level\"}]";
function Summary({ resumeInfo, enanbledNext, enanbledPrev }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(resumeInfo?.summary || "");
  const [aiGeneratedSummeryList, setAiGenerateSummeryList] = useState(null);
  const { resume_id } = useParams();

  const handleInputChange = (e) => {
    dispatch(
      addResumeData({
        ...resumeInfo,
        [e.target.name]: e.target.value,
      })
    );
    setSummary(e.target.value);
  };

  const setSummery = (summary) => {
    dispatch(
      addResumeData({
        ...resumeInfo,
        summary: summary,
      })
    );
    setSummary(summary);
  };

  const GenerateSummeryFromAI = async () => {
    if (loading) return;
    setLoading(true);
    console.log("Generate Summery From AI for", resumeInfo?.jobTitle);
    if (!resumeInfo?.jobTitle) {
      toast("Please Add Job Title");
      setLoading(false);
      return;
    }
    const PROMPT = prompt.replace("{jobTitle}", resumeInfo?.jobTitle);
    try {
      const result = await AIChatSession.sendMessage(PROMPT);
      const responseText = result.response.text();
      
      let jsonText = responseText.trim();
      
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n');
        lines.shift();
        if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
          lines.pop();
        }
        jsonText = lines.join('\n').trim();
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}. Response: ${jsonText.substring(0, 200)}`);
      }
      
      console.log(parsedData);
      setAiGenerateSummeryList(parsedData);
      toast("Summery Generated", "success");
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
        onFocus={() => dispatch(setFocusedSection("summary"))}
        onBlur={() => dispatch(setFocusedSection(null))}
      >
        <h2 className="font-bold text-lg">Summary</h2>
        <p>Add Summary for your job title</p>

        <div className="mt-7">
          <div className="flex justify-between items-end">
            <label>Add Summery</label>
            <Button
              variant="outline"
              onClick={() => GenerateSummeryFromAI()}
              type="button"
              size="sm"
              disabled={loading}
              className="border-purple-500 text-purple-600 flex gap-2 hover:bg-purple-50"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Generating..." : "Generate from AI"}
            </Button>
          </div>
          <Textarea
            name="summary"
            className="mt-5"
            required
            value={summary ? summary : resumeInfo?.summary}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {aiGeneratedSummeryList && (
        <div className="my-5">
          <h2 className="font-bold text-lg">Suggestions</h2>
          {aiGeneratedSummeryList?.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                setSummery(item?.summary);
              }}
              className="p-5 shadow-lg my-4 rounded-lg cursor-pointer hover:bg-indigo-50 transition"
            >
              <h2 className="font-bold my-1 text-indigo-600">
                Level: {item?.experience_level}
              </h2>
              <p>{item?.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Summary;
