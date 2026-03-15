import React from "react";
import { useDispatch } from "react-redux";
import { addResumeData, setFocusedSection } from "@/features/resume/resumeFeatures";
import { Input } from "@/components/ui/input";

function PersonalDetails({ resumeInfo, enanbledNext }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = React.useState({
    firstName: resumeInfo?.firstName || "",
    lastName: resumeInfo?.lastName || "",
    jobTitle: resumeInfo?.jobTitle || "",
    address: resumeInfo?.address || "",
    phone: resumeInfo?.phone || "",
    email: resumeInfo?.email || "",
    linkedin: resumeInfo?.linkedin || "",
  });

  React.useEffect(() => {
    setFormData({
      firstName: resumeInfo?.firstName || "",
      lastName: resumeInfo?.lastName || "",
      jobTitle: resumeInfo?.jobTitle || "",
      address: resumeInfo?.address || "",
      phone: resumeInfo?.phone || "",
      email: resumeInfo?.email || "",
      linkedin: resumeInfo?.linkedin || "",
    });
  }, [
    resumeInfo?.firstName,
    resumeInfo?.lastName,
    resumeInfo?.jobTitle,
    resumeInfo?.address,
    resumeInfo?.phone,
    resumeInfo?.email,
    resumeInfo?.linkedin,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextData = {
      ...formData,
      [name]: value,
    };

    dispatch(
      addResumeData({
        ...resumeInfo,
        ...nextData,
      })
    );
    setFormData(nextData);
  };

  return (
    <div
      className="p-5 shadow-lg rounded-lg border-t-indigo-500 border-t-4 mt-10"
      onFocus={() => dispatch(setFocusedSection("personal"))}
      onBlur={() => dispatch(setFocusedSection(null))}
    >
      <h2 className="font-bold text-lg">Personal Detail</h2>
      <p>Get Started with the basic information</p>

      <div className="grid grid-cols-2 mt-5 gap-3">
        <div>
          <label className="text-sm">First Name</label>
          <Input
            name="firstName"
            value={formData.firstName}
            required
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="text-sm">Last Name</label>
          <Input
            name="lastName"
            required
            onChange={handleInputChange}
            value={formData.lastName}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm">Job Title</label>
          <Input
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm">Address</label>
          <Input
            name="address"
            required
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="text-sm">Phone</label>
          <Input
            name="phone"
            required
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <Input
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm">LinkedIn ID</label>
          <Input
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="linkedin.com/in/your-id"
          />
        </div>
      </div>
    </div>
  );
}

export default PersonalDetails;
