const express = require("express");
const jobCtrl = require("../controller/job");
const jwtAuth = require("../middleware/jwtAuth");

const router = express.Router();

router.post("/", jwtAuth, jobCtrl.addJob);
router.get("/", jwtAuth, jobCtrl.getJobList); // ✅ FIXED LINE
router.get("/:id", jobCtrl.getJobId);
router.get("/:id/applications", jwtAuth, jobCtrl.getApplications);
router.put("/:id", jwtAuth, jobCtrl.updateJobDetails);
router.post("/:id/applications", jwtAuth, jobCtrl.applyJob);
router.get("/:id/check-accepted", jwtAuth, jobCtrl.checkApply);
router.delete("/:id", jwtAuth, jobCtrl.deleteJob);

module.exports = router;
