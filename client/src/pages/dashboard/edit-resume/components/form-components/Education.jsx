import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";

const formFields = {
  universityName: "",
  degree: "",
  major: "",
  grade: "",
  gradeType: "CGPA",
  startDate: "",
  endDate: "",
  description: "",
};
function Education({ resumeInfo, enanbledNext }) {
  const [educationalList, setEducationalList] = React.useState(
    resumeInfo?.education || [{ ...formFields }]
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(addResumeData({ ...resumeInfo, education: educationalList }));
  }, [educationalList]);

  const AddNewEducation = () => {
    setEducationalList([...educationalList, { ...formFields }]);
  };

  const RemoveEducation = () => {
    setEducationalList((educationalList) => educationalList.slice(0, -1));
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...educationalList];
    const newListData = {
      ...list[index],
      [name]: value,
    };
    list[index] = newListData;
    setEducationalList(list);
  };

  return (
    <div
      className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
      onFocus={() => dispatch(setFocusedSection("education"))}
      onBlur={() => dispatch(setFocusedSection(null))}
    >
      <h2 className="font-bold text-lg">Education</h2>
      <p>Add Your educational details</p>

      <div>
        {educationalList.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-2 gap-3 border p-3 my-5 rounded-lg">
              <div className="col-span-2">
                <label>University Name</label>
                <Input
                  name="universityName"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.universityName}
                />
              </div>
              <div>
                <label>Degree</label>
                <Input
                  name="degree"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.degree}
                />
              </div>
              <div>
                <label>Major</label>
                <Input
                  name="major"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.major}
                />
              </div>
              <div>
                <label>Start Year</label>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="YYYY"
                  name="startDate"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.startDate}
                />
              </div>
              <div>
                <label>End Year</label>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="YYYY"
                  name="endDate"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.endDate}
                />
              </div>
              <div className="col-span-2">
                <label>Grade</label>
                <div className="flex justify-center items-center gap-4">
                  <select
                    name="gradeType"
                    className="py-2 px-4 rounded-md"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.gradeType}
                  >
                    <option value="CGPA">CGPA</option>
                    <option value="GPA">GPA</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                  <Input
                    type="text"
                    name="grade"
                    onChange={(e) => handleChange(e, index)}
                    defaultValue={item?.endDate}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label>Description</label>
                <Textarea
                  name="description"
                  onChange={(e) => handleChange(e, index)}
                  defaultValue={item?.description}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={AddNewEducation}
            className="text-indigo-600"
          >
            {" "}
            + Add More Education
          </Button>
          <Button
            variant="outline"
            onClick={RemoveEducation}
            className="text-indigo-600"
          >
            {" "}
            - Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Education;
