import { Router } from "express";
import {
  getAnnouncement,
  saveAnnouncement,
  deleteAnnouncement,
  getAnnouncementHistory,
} from "../controllers/AnnouncementController.js";

const router = Router();

router.get("/announcement", getAnnouncement);
router.post("/announcement", saveAnnouncement);
router.delete("/announcement", deleteAnnouncement);
router.get("/announcement/history", getAnnouncementHistory);

export default router;
