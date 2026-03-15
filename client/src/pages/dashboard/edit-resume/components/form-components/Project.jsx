import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import SimpleRichTextEditor from "@/components/custom/SimpleRichTextEditor";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";

const formFields = {
  projectName: "",
  techStack: "",
  projectSummary: "",
};
function Project({ resumeInfo, setEnabledNext, setEnabledPrev }) {
  const [projectList, setProjectList] = useState(resumeInfo?.projects || []);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(addResumeData({ ...resumeInfo, projects: projectList }));
  }, [projectList]);

  const addProject = () => {
    setProjectList([...projectList, formFields]);
  };

  const removeProject = (index) => {
    const list = [...projectList];
    const newList = list.filter((item, i) => {
      if (i !== index) return true;
    });
    setProjectList(newList);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...projectList];
    const newListData = {
      ...list[index],
      [name]: value,
    };
    list[index] = newListData;
    setProjectList(list);
  };

  const handleRichTextEditor = (value, name, index) => {
    const list = [...projectList];
    const newListData = {
      ...list[index],
      [name]: value,
    };
    list[index] = newListData;
    setProjectList(list);
  };

  return (
    <div
      className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
      onFocus={() => dispatch(setFocusedSection("projects"))}
      onBlur={() => dispatch(setFocusedSection(null))}
    >
      <h2 className="font-bold text-lg">Project</h2>
      <p>Add your projects</p>
      <div>
        {projectList?.map((project, index) => (
          <div key={index}>
            <div className="flex justify-between my-2">
              <h3 className="font-bold text-lg">Project {index + 1}</h3>
              <Button
                variant="outline"
                className="text-red-500"
                onClick={(e) => {
                  removeProject(index);
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 border p-3 my-5 rounded-lg">
              <div>
                <label className="text-xs">Project Name</label>
                <Input
                  type="text"
                  name="projectName"
                  value={project?.projectName}
                  onChange={(e) => {
                    handleChange(e, index);
                  }}
                />
              </div>
              <div>
                <label className="text-xs">Tech Stack</label>
                <Input
                  type="text"
                  name="techStack"
                  value={project?.techStack}
                  placeholder="e.g., MERN, Next.js, Python"
                  onChange={(e) => {
                    handleChange(e, index);
                  }}
                />
              </div>
              <div className="col-span-2">
                <SimpleRichTextEditor
                  index={index}
                  defaultValue={project?.projectSummary}
                  onRichTextEditorChange={(event) =>
                    handleRichTextEditor(event, "projectSummary", index)
                  }
                  resumeInfo={resumeInfo}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between py-2">
        <Button onClick={addProject} variant="outline" className="text-indigo-600">
          + Add {resumeInfo?.experience?.length > 0 ? "more" : null} project
        </Button>
      </div>
    </div>
  );
}

export default Project;
