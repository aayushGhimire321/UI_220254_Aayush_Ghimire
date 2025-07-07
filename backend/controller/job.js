/* controllers/job.js */
const Job = require("../model/job");
const Application = require("../model/applications");

/* ─────────────────────────────────────────────
   ─────────────  HELPERS  ──────────────────────
   ───────────────────────────────────────────── */
const toNum = (v) => (v === "" || v === undefined ? undefined : Number(v));

const sendError = (res, code, message) =>
  res.status(code).json({ message });

/* ─────────────────────────────────────────────
   ─────────────  ADD JOB  ─────────────────────
   ───────────────────────────────────────────── */
const addJob = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.type !== "recruiter") {
      return sendError(res, 401, "You don't have permissions to add jobs");
    }

    const {
      title,
      maxApplicants,
      maxPositions,
      deadline,
      skillsets,
      jobType,
      duration,
      salary,
      description,
      location,
    } = req.body;

    /* Basic validation (you can extend / tighten this) */
    if (
      !title ||
      !deadline ||
      !Array.isArray(skillsets) ||
      skillsets.length === 0
    ) {
      return sendError(res, 400, "Missing required fields");
    }

    /* Build job doc */
    const job = new Job({
      userId: user._id,
      profile: user.profile,
      title: title.trim(),
      maxApplicants: toNum(maxApplicants),
      maxPositions: toNum(maxPositions),
      dateOfPosting: new Date(), // server‑side timestamp
      deadline,
      skillsets: skillsets.map((s) => s.toString()), // force string array
      jobType,
      duration: toNum(duration),
      salary: toNum(salary),
      rating: 0,
      description,
      location,
    });

    await job.save();
    return res.json({ message: "Job added successfully to the database" });
  } catch (err) {
    console.error("addJob error →", err); // full stack for dev
    return sendError(res, 400, err.message || "Failed to add job");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  GET JOB LIST  ────────────────
   ───────────────────────────────────────────── */
const getJobList = async (req, res) => {
  try {
    const findParams = {};
    const sortParams = {};

    if (req.query.q) {
      findParams.title = { $regex: new RegExp(req.query.q, "i") };
    }

    if (req.query.jobType) {
      const types = Array.isArray(req.query.jobType)
        ? req.query.jobType
        : [req.query.jobType];
      findParams.jobType = { $in: types };
    }

    if (req.query.salaryMin || req.query.salaryMax) {
      findParams.salary = {};
      if (req.query.salaryMin) findParams.salary.$gte = Number(req.query.salaryMin);
      if (req.query.salaryMax) findParams.salary.$lte = Number(req.query.salaryMax);
    }

    if (req.query.duration) {
      findParams.duration = { $lt: Number(req.query.duration) };
    }

    const addSort = (field, dir) =>
      (sortParams[field] = dir);

    if (req.query.asc) {
      (Array.isArray(req.query.asc) ? req.query.asc : [req.query.asc]).forEach((f) =>
        addSort(f, 1)
      );
    }
    if (req.query.desc) {
      (Array.isArray(req.query.desc) ? req.query.desc : [req.query.desc]).forEach((f) =>
        addSort(f, -1)
      );
    }

    const pipeline = [
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "userId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      { $match: findParams },
    ];
    if (Object.keys(sortParams).length) pipeline.push({ $sort: sortParams });

    const jobs = await Job.aggregate(pipeline);
    if (!jobs.length) {
      return sendError(res, 404, "No job found");
    }
    return res.json(jobs);
  } catch (err) {
    console.error("getJobList error →", err);
    return sendError(res, 400, err.message || "Failed to fetch jobs");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  GET JOB BY ID  ───────────────
   ───────────────────────────────────────────── */
const getJobId = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return sendError(res, 404, "Job does not exist");
    return res.json(job);
  } catch (err) {
    console.error("getJobId error →", err);
    return sendError(res, 400, "Error fetching job");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  UPDATE JOB  ──────────────────
   ───────────────────────────────────────────── */
const updateJobDetails = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.type !== "recruiter") {
      return sendError(res, 401, "You don't have permissions");
    }

    const updated = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return sendError(res, 404, "Job does not exist");

    return res.json({ message: "Job details updated", updatedJob: updated });
  } catch (err) {
    console.error("updateJobDetails error →", err);
    return sendError(res, 400, err.message || "Failed to update job");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  APPLY FOR JOB  ───────────────
   ───────────────────────────────────────────── */
const applyJob = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.type !== "applicant") {
      return sendError(res, 401, "You don't have permissions to apply");
    }

    const jobId = req.params.id;
    const { sop } = req.body;

    /* 1) block if already accepted one job */
    const hasAccepted = await Application.exists({
      userId: user._id,
      status: { $in: ["accepted", "finished"] },
    });
    if (hasAccepted)
      return sendError(
        res,
        400,
        "You already have an accepted/finished job, so you cannot apply"
      );

    /* 2) block duplicate applications */
    const alreadyApplied = await Application.exists({
      userId: user._id,
      jobId,
      status: { $in: ["applied", "shortlisted"] },
    });
    if (alreadyApplied)
      return sendError(res, 400, "You have already applied for this job");

    /* 3) check job existence & applicant limits */
    const job = await Job.findById(jobId);
    if (!job) return sendError(res, 404, "Job does not exist");

    const activeAppCount = await Application.countDocuments({
      jobId,
      status: { $nin: ["rejected", "deleted", "cancelled", "finished"] },
    });
    if (activeAppCount >= job.maxApplicants)
      return sendError(res, 400, "Application limit reached for this job");

    /* 4) check applicant's active apps < 10 */
    const myActive = await Application.countDocuments({
      userId: user._id,
      status: { $nin: ["rejected", "deleted", "cancelled", "finished"] },
    });
    if (myActive >= 10)
      return sendError(res, 400, "You already have 10 active applications");

    /* 5) create application */
    const application = new Application({
      userId: user._id,
      recruiterId: job.userId,
      jobId: job._id,
      status: "applied",
      sop,
    });
    await application.save();
    return res.json({ message: "Job application successful" });
  } catch (err) {
    console.error("applyJob error →", err);
    return sendError(res, 400, err.message || "Failed to apply");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  CHECK ACCEPTED  ──────────────
   ───────────────────────────────────────────── */
const checkApply = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.type !== "applicant") {
      return sendError(res, 400, "You don't have permissions");
    }

    const acceptedJob = await Application.exists({
      userId: user._id,
      status: { $in: ["accepted", "finished"] },
    });

    return res.json({ hasAcceptedJob: !!acceptedJob });
  } catch (err) {
    console.error("checkApply error →", err);
    return sendError(res, 500, "Internal server error");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  GET APPLICATIONS  ────────────
   ───────────────────────────────────────────── */
const getApplications = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.type !== "recruiter") {
      return sendError(res, 401, "You don't have permissions");
    }

    const findParams = {
      jobId: req.params.id,
      recruiterId: user._id,
    };
    if (req.query.status) findParams.status = req.query.status;

    const applications = await Application.find(findParams).sort({});
    return res.json(applications);
  } catch (err) {
    console.error("getApplications error →", err);
    return sendError(res, 400, err.message || "Failed to fetch applications");
  }
};

/* ─────────────────────────────────────────────
   ─────────────  DELETE JOB  ──────────────────
   ───────────────────────────────────────────── */
const deleteJob = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.type !== "recruiter" && user.type !== "admin")) {
      return sendError(res, 401, "You don't have permissions");
    }

    const deleted = await Job.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return sendError(res, 404, "Job not found");

    return res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("deleteJob error →", err);
    return sendError(res, 500, "Internal server error");
  }
};

/* ─────────────────────────────────────────────
               EXPORTS
───────────────────────────────────────────── */
module.exports = {
  addJob,
  getJobList,
  getJobId,
  updateJobDetails,
  applyJob,
  checkApply,
  getApplications,
  deleteJob,
};
