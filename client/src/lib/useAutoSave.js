import { useRef, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateThisResume } from "@/Services/resumeAPI";
import { setSaveStatus } from "@/features/resume/resumeFeatures";

const DEBOUNCE_MS = 1500;

const FORM_FIELDS = [
  "firstName", "lastName", "jobTitle", "address", "phone", "email", "linkedin",
  "summary", "themeColor", "templateId", "sectionOrder",
  "experience", "education", "projects", "skills",
];

function buildPayload(data) {
  const payload = {};
  for (const key of FORM_FIELDS) {
    if (data[key] !== undefined) {
      payload[key] = data[key];
    }
  }
  return payload;
}

/**
 * Auto-save hook: debounces changes to resumeData and persists to DB.
 * Skips the very first render (initial fetch from server) so we don't
 * immediately re-save what we just loaded.
 */
export function useAutoSave(resumeId, resumeData) {
  const dispatch = useDispatch();
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isInitialLoad = useRef(true);
  const latestDataRef = useRef(resumeData);

  // Always keep the latest data available for the unmount flush
  useEffect(() => {
    latestDataRef.current = resumeData;
  }, [resumeData]);

  const save = useCallback(
    async (data) => {
      if (!resumeId || !data) return;

      const payload = buildPayload(data);
      const serialized = JSON.stringify(payload);

      // Skip if nothing changed since last successful save
      if (serialized === lastSavedRef.current) {
        dispatch(setSaveStatus("saved"));
        return;
      }

      dispatch(setSaveStatus("saving"));

      try {
        await updateThisResume(resumeId, { data: payload });
        lastSavedRef.current = serialized;
        dispatch(setSaveStatus("saved"));
      } catch (error) {
        console.error("Auto-save failed:", error?.message);
        dispatch(setSaveStatus("error"));
      }
    },
    [resumeId, dispatch]
  );

  useEffect(() => {
    if (!resumeId || !resumeData) return;

    // On very first data load (from server), just snapshot it — don't save
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastSavedRef.current = JSON.stringify(buildPayload(resumeData));
      dispatch(setSaveStatus("saved"));
      return;
    }

    dispatch(setSaveStatus("unsaved"));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      save(resumeData);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeData, resumeId, save, dispatch]);

  // Reset initial-load flag when resumeId changes (navigating to different resume)
  useEffect(() => {
    isInitialLoad.current = true;
    lastSavedRef.current = null;
  }, [resumeId]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        save(latestDataRef.current);
      }
    };
  }, [save]);
}
