const SignUp = async (req, res) => {
  try {
    const data = req.body;

    // Create new User instance
    let user = new User({
      email: data.email,
      password: data.password,
      type: data.type,
      _id: data._id,
    });

    // Save user
    await user.save();

    // Create user details document depending on user type
    let userDetails;
    if (user.type === "recruiter") {
      userDetails = new Recruiter({
        userId: user._id,
        name: data.name,
        contactNumber: data.contactNumber,
        bio: data.bio,
        profile: data.profile,
      });
    } else {
      userDetails = new JobApplicant({
        userId: user._id,
        name: data.name,
        education: data.education,
        skills: data.skills,
        rating: data.rating,
        resume: data.resume,
        profile: data.profile,
      });
    }

    // Save user details
    await userDetails.save();

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);

    // Send response
    res.json({
      token,
      type: user.type,
      _id: user._id,
    });
  } catch (err) {
    // If user details saving failed after user saved, delete user to avoid orphan user record
    if (err.name === "ValidationError" || err.name === "MongoError") {
      try {
        // Check if user was created, then delete
        if (req.body && req.body.email) {
          const user = await User.findOne({ email: req.body.email });
          if (user) {
            await user.deleteOne();
          }
        }
      } catch (delErr) {
        console.error("Error deleting user after failure:", delErr);
      }
    }

    console.error("Signup error:", err);
    res.status(400).json({ error: err.message || err });
  }
};
