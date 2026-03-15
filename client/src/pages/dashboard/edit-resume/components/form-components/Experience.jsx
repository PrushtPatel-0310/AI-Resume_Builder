import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import RichTextEditor from "@/components/custom/RichTextEditor";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";

const getDateParts = (value) => {
  if (!value) return { month: "", year: "" };

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, monthNumber] = value.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = Number(monthNumber) - 1;
    return {
      month: monthNames[monthIndex] || "",
      year: year || "",
    };
  }

  const match = value.match(/^(.*?)(?:\s+)?(\d{4})$/);
  if (match) {
    return {
      month: (match[1] || "").trim(),
      year: match[2] || "",
    };
  }

  return { month: value, year: "" };
};

const formatMonthYear = (month, year) => {
  const cleanMonth = (month || "").trim();
  const cleanYear = (year || "").trim();
  return [cleanMonth, cleanYear].filter(Boolean).join(" ");
};

const normalizeExperienceEntry = (entry = {}) => {
  const startParts = getDateParts(entry?.startDate);
  const endParts = getDateParts(entry?.endDate);

  return {
    ...formFields,
    ...entry,
    startMonth: entry?.startMonth ?? startParts.month,
    startYear: entry?.startYear ?? startParts.year,
    endMonth: entry?.endMonth ?? endParts.month,
    endYear: entry?.endYear ?? endParts.year,
  };
};

const yearOptions = Array.from(
  { length: new Date().getFullYear() - 1949 },
  (_, index) => String(new Date().getFullYear() - index)
);

const formFields = {
  title: "",
  companyName: "",
  city: "",
  state: "",
  startDate: "",
  endDate: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  currentlyWorking: "",
  workSummary: "",
};
function Experience({ resumeInfo, enanbledNext, enanbledPrev }) {
  const [experienceList, setExperienceList] = React.useState(
    (resumeInfo?.experience || []).map((item) => normalizeExperienceEntry(item))
  );
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      dispatch(addResumeData({ ...resumeInfo, experience: experienceList }));
    } catch (error) {
      console.log("error in experience context update", error.message);
    }
  }, [experienceList]);

  const addExperience = () => {
    if (!experienceList) {
      setExperienceList([{ ...formFields }]);
      return;
    }
    setExperienceList([...experienceList, { ...formFields }]);
  };

  const removeExperience = (index) => {
    const list = [...experienceList];
    const newList = list.filter((item, i) => {
      if (i !== index) return true;
    });
    setExperienceList(newList);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...experienceList];
    const newListData = {
      ...list[index],
      [name]: value,
    };
    list[index] = newListData;
    setExperienceList(list);
  };

  const handleMonthYearChange = (index, key, value) => {
    const list = [...experienceList];
    const item = { ...list[index], [key]: value };

    item.startDate = formatMonthYear(item.startMonth, item.startYear);
    item.endDate = formatMonthYear(item.endMonth, item.endYear);

    list[index] = item;
    setExperienceList(list);
  };

  const handleRichTextEditor = (value, name, index) => {
    const list = [...experienceList];
    const newListData = {
      ...list[index],
      [name]: value,
    };
    list[index] = newListData;
    setExperienceList(list);
  };

  return (
    <div>
      <div
        className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
        onFocus={() => dispatch(setFocusedSection("experience"))}
        onBlur={() => dispatch(setFocusedSection(null))}
      >
        <h2 className="font-bold text-lg">Experience</h2>
        <p>Add Your Previous Job Experience</p>
        <div>
          {experienceList?.map((experience, index) => (
            <div key={index}>
              <div className="flex justify-between my-2">
                <h3 className="font-bold text-lg">Experience {index + 1}</h3>
                <Button
                  variant="outline"
                  className="text-red-500"
                  onClick={(e) => {
                    removeExperience(index);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 border p-3 my-5 rounded-lg">
                <div>
                  <label className="text-xs">Position Tittle</label>
                  <Input
                    type="text"
                    name="title"
                    value={experience?.title}
                    onChange={(e) => {
                      handleChange(e, index);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">Company Name</label>
                  <Input
                    type="text"
                    name="companyName"
                    value={experience?.companyName}
                    onChange={(e) => {
                      handleChange(e, index);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">City</label>
                  <Input
                    type="text"
                    name="city"
                    value={experience?.city}
                    onChange={(e) => {
                      handleChange(e, index);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">State</label>
                  <Input
                    type="text"
                    name="state"
                    value={experience?.state}
                    onChange={(e) => {
                      handleChange(e, index);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">Start Month</label>
                  <Input
                    type="text"
                    name="startMonth"
                    placeholder="e.g. January"
                    value={experience?.startMonth || ""}
                    onChange={(e) => {
                      handleMonthYearChange(index, "startMonth", e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">Start Year</label>
                  <select
                    name="startYear"
                    value={experience?.startYear || ""}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onChange={(e) => {
                      handleMonthYearChange(index, "startYear", e.target.value);
                    }}
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs">End Month</label>
                  <Input
                    type="text"
                    name="endMonth"
                    placeholder="e.g. March"
                    value={experience?.endMonth || ""}
                    onChange={(e) => {
                      handleMonthYearChange(index, "endMonth", e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">End Year</label>
                  <select
                    name="endYear"
                    value={experience?.endYear || ""}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onChange={(e) => {
                      handleMonthYearChange(index, "endYear", e.target.value);
                    }}
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <RichTextEditor
                    index={index}
                    defaultValue={experience?.workSummary}
                    onRichTextEditorChange={(event) =>
                      handleRichTextEditor(event, "workSummary", index)
                    }
                    resumeInfo={resumeInfo}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between py-2">
          <Button
            onClick={addExperience}
            variant="outline"
            className="text-indigo-600"
          >
            + Add {resumeInfo?.experience?.length > 0 ? "more" : null}{" "}
            Experience
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Experience;
