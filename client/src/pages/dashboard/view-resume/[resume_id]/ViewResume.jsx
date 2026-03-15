import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getResumeData } from "@/Services/resumeAPI";
import ResumePreview from "../../edit-resume/components/PreviewPage";
import { useDispatch } from "react-redux";
import { addResumeData } from "@/features/resume/resumeFeatures";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function ViewResume() {
  const { resume_id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchResumeInfo();
  }, []);
  const fetchResumeInfo = async () => {
    const response = await getResumeData(resume_id);
    dispatch(addResumeData(response.data));
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <div id="noPrint">
          <div className="my-10 mx-10 md:mx-20 lg:mx-36">
            <div className="mb-6 flex justify-start">
              <Link to="/my-resume">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </Link>
            </div>
            <h2 className="text-center text-2xl font-medium">
              Congrats! Your Ultimate AI generated Resume is ready !{" "}
            </h2>
          </div>
        </div>
        <div
          className=" bg-white rounded-lg p-8 print-area"
          style={{ width: "210mm", height: "297mm" }}
        >
          <div className="print">
            <ResumePreview />
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewResume;
