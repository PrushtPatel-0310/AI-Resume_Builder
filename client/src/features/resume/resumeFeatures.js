import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  resumeData: "",
  saveStatus: "saved", // "saved" | "saving" | "unsaved" | "error"
  focusedSection: null, // which form section is focused (for preview highlight)
};
export const resumeSlice = createSlice({
  name: "editResume",
  initialState,
  reducers: {
    addResumeData: (state, action) => {
      state.resumeData = action.payload;
    },
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload;
    },
    setFocusedSection: (state, action) => {
      state.focusedSection = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { addResumeData, setSaveStatus, setFocusedSection } = resumeSlice.actions;

export default resumeSlice.reducer;
