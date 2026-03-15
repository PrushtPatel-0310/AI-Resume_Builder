import { Router } from "express";
import {
  start,
  createResume,
  getALLResume,
  getResume,
  updateResume,
  removeResume,
  parseResumePdf,
  scoreResumeHybrid,
  generateAiContent,
} from "../controller/resume.controller.js";
import { isUserAvailable } from "../middleware/auth.js";
import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", start);
router.post("/createResume", isUserAvailable, createResume);
router.get("/getAllResume", isUserAvailable, getALLResume);
router.get("/getResume", isUserAvailable, getResume);
router.put("/updateResume", isUserAvailable, updateResume);
router.delete("/removeResume", isUserAvailable, removeResume);
router.post(
  "/parse",
  isUserAvailable,
  upload.single("file"),
  parseResumePdf
);
router.post("/ats-score", isUserAvailable, scoreResumeHybrid);
router.post("/ai-generate", isUserAvailable, generateAiContent);

export default router;
