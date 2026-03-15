import React, { useEffect, useState } from "react";
import {
  BtnBold,
  BtnBulletList,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnStrikeThrough,
  BtnUnderline,
  Editor,
  EditorProvider,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";
import { AIChatSession } from "@/Services/AiModel";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Sparkles, LoaderCircle } from "lucide-react";

const PROMPT = `For project "{projectName}" with tech stack "{techStack}", create a JSON object with the following fields:
- "projectName": A string representing the project name
- "techStack": A string representing the project tech stack
- "projectSummary": An array of strings, each representing a bullet point in HTML format describing relevant experience

Return ONLY valid JSON with no markdown code blocks, no explanations, just the JSON object. Use double quotes for all strings.`;
function SimpleRichTextEditor({ index, onRichTextEditorChange, resumeInfo }) {
  const [value, setValue] = useState(
    resumeInfo?.projects[index]?.projectSummary || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onRichTextEditorChange(value);
  }, [value]);

  const GenerateSummaryFromAI = async () => {
    if (loading) return;

    if (
      !resumeInfo?.projects[index]?.projectName ||
      !resumeInfo?.projects[index]?.techStack
    ) {
      toast("Add Project Name and Tech Stack to generate summary");
      return;
    }
    setLoading(true);

    const prompt = PROMPT.replace(
      "{projectName}",
      resumeInfo?.projects[index]?.projectName
    ).replace("{techStack}", resumeInfo?.projects[index]?.techStack);
    console.log("Prompt", prompt);
    
    try {
      const result = await AIChatSession.sendMessage(prompt);
      const responseText = result.response.text();
      
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n');
        // Remove first line (```json or ```)
        lines.shift();
        // Remove last line (```)
        if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
          lines.pop();
        }
        jsonText = lines.join('\n').trim();
      }
      
      // Try to parse JSON
      let resp;
      try {
        resp = JSON.parse(jsonText);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      
      console.log("Response", resp);
      await setValue(resp.projectSummary?.join("") || "");
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between my-2">
        <label className="text-xs">Summery</label>
        <Button
          variant="outline"
          size="sm"
          onClick={GenerateSummaryFromAI}
          disabled={loading}
          className="flex gap-2 border-primary text-primary"
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate from AI
            </>
          )}
        </Button>
      </div>
      <EditorProvider>
        <Editor
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onRichTextEditorChange(value);
          }}
        >
          <Toolbar>
            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <BtnStrikeThrough />
            <Separator />
            <BtnNumberedList />
            <BtnBulletList />
            <Separator />
            <BtnLink />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}

export default SimpleRichTextEditor;
