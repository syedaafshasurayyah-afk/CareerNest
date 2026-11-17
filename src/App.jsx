
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const suggestions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Software Engineer",
  "Doctor",
  "Data Analyst",
  "Business Analyst",
  "Digital Marketing",
  "UI/UX Designer",
  "Google",
  "Amazon",
  "Microsoft",
];

const countries = [
  "All locations",
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
  "Worldwide",
];

const countryCodes = {
  India: "IN",
  "United States": "US",
  "United Kingdom": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  Singapore: "SG",
};

function mapJob(job) {
  const restrictions = job.locationRestrictions || [];

  return {
    id: job.guid,
    title: job.title || "Untitled role",
    company: job.companyName || "Company",
    logo: (job.companyName || "C").charAt(0),
    location: restrictions.length
      ? restrictions.join(", ")
      : "Worldwide Remote",
    category: job.parentCategories?.[0] || job.categories?.[0] || "Other",
    type: job.employmentType || "Remote",
    salary:
      job.minSalary != null && job.maxSalary != null
        ? `${job.currency || ""} ${job.minSalary} - ${job.maxSalary} / ${job.salaryPeriod || "annual"}`
        : "Not disclosed",
    experience: Array.isArray(job.seniority)
      ? job.seniority.join(", ")
      : job.seniority || "Not specified",
    description:
      job.excerpt || "Open the original listing to read the full description.",
    skills: job.categories || [],
    posted: job.pubDate
      ? new Date(job.pubDate * 1000).toLocaleDateString()
      : "Recently listed",
    applicationLink: job.applicationLink,
    source: "Himalayas",
    isDemo: false,
  };
}

function createDemoJobs(keyword, country) {
  if (!keyword.trim()) return [];

  const title = keyword
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const place = country === "All locations" || country === "Worldwide"
    ? "Worldwide"
    : country;

  return [
    {
      id: `demo-${keyword}-1`,
      title: title,
      company: "CareerNest Demo Company",
      logo: "C",
      location: place,
      category: "General",
      type: "Full Time",
      salary: "Not disclosed",
      experience: "Entry level",
      description: `This is a sample ${title} opportunity created to demonstrate CareerNest search. This is not a verified vacancy.`,
      skills: [keyword],
      posted: "Demo listing",
      applicationLink: "",
      source: "CareerNest",
      isDemo: true,
    },
    {
      id: `demo-${keyword}-2`,
      title: `Junior ${title}`,
      company: "CareerNest Demo Careers",
      logo: "C",
      location: place,
      category: "General",
      type: "Internship",
      salary: "Not disclosed",
      experience: "Entry level",
      description: `Sample internship for ${title}. This is generated demo content, not a real job opening.`,
      skills: [keyword],
      posted: "Demo listing",
      applicationLink: "",
      source: "CareerNest",
      isDemo: true,
    },
  ];
}

function App() {
  const [theme, setTheme] = useState(() =>
    readStorage("career-theme-v2", "light")
  );

  const [profile, setProfile] = useState(() =>
    readStorage("career-profile", {
      name: "",
      email: "",
      phone: "",
    })
  );

  const [showWelcome, setShowWelcome] = useState(() =>
    !readStorage("career-profile", { name: "" }).name
  );

  const [welcomeName, setWelcomeName] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  const [page, setPage] = useState("Home");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [category, setCategory] = useState("All categories");
  const [jobType, setJobType] = useState("All types");

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState("");
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [savedJobs, setSavedJobs] = useState(() =>
    readStorage("career-saved", [])
  );

  const [applications, setApplications] = useState(() =>
    readStorage("career-applications", [])
  );

  const [selectedJob, setSelectedJob] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("career-theme-v2", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("career-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("career-saved", JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem(
      "career-applications",
      JSON.stringify(applications)
    );
  }, [applications]);

  const fetchJobs = async (keyword = search, selectedCountry = location) => {
    setLoadingJobs(true);
    setJobError("");
    setSearched(true);

    try {
      const params = new URLSearchParams();

      if (keyword.trim()) params.set("q", keyword.trim());

      if (
        selectedCountry !== "All locations" &&
        selectedCountry !== "Worldwide"
      ) {
        params.set("country", countryCodes[selectedCountry] || selectedCountry);
      }

      if (selectedCountry === "Worldwide") {
        params.set("worldwide", "true");
      }

      params.set("sort", "recent");

      const response = await fetch(
        `/himalayas/jobs/api/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Job service is currently unavailable.");
      }

      const data = await response.json();
      const realJobs = (data.jobs || []).map(mapJob);

      if (realJobs.length > 0) {
        setJobs(realJobs);
      } else {
        setJobs(createDemoJobs(keyword, selectedCountry));
      }
    } catch (error) {
      console.error(error);
      setJobs(createDemoJobs(keyword, selectedCountry));
      setJobError(
        "Live job service is unavailable. Showing clearly labeled demo results."
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs("", "All locations");
    // Initial job feed only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingSuggestions = useMemo(() => {
    if (!search.trim()) return [];

    return suggestions
      .filter((item) =>
        item.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 6);
  }, [search]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const categoryMatch =
        category === "All categories" ||
        job.category.toLowerCase().includes(category.toLowerCase());

      const typeMatch =
        jobType === "All types" ||
        job.type.toLowerCase().includes(jobType.toLowerCase());

      return categoryMatch && typeMatch;
    });
  }, [jobs, category, jobType]);

  const visibleJobs =
    page === "Saved Jobs"
      ? jobs.filter((job) => savedJobs.includes(job.id))
      : page === "Home" || page === "Find Jobs"
        ? filteredJobs
        : [];

  const openPage = (nextPage) => {
    setPage(nextPage);
    setSelectedJob(null);
    setEditingProfile(false);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitWelcome = (event) => {
    event.preventDefault();

    if (!welcomeName.trim()) return;

    const newProfile = {
      name: welcomeName.trim(),
      email: "",
      phone: "",
    };

    setProfile(newProfile);
    setEditForm(newProfile);
    setShowWelcome(false);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setProfile(editForm);
    setEditingProfile(false);
    setNotice("Your profile has been updated!");
  };

  const toggleSave = (id) => {
    setSavedJobs((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const applyForJob = (job) => {
    if (job.isDemo || !job.applicationLink) {
      setNotice("This is a demo listing. It has no real application link.");
      return;
    }

    const alreadyApplied = applications.some(
      (item) => item.jobId === job.id
    );

    if (alreadyApplied) {
      setNotice("You have already saved this application.");
      return;
    }

    setApplications((previous) => [
      ...previous,
      {
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        appliedAt: new Date().toLocaleDateString(),
        status: "Application link opened",
      },
    ]);

    window.open(job.applicationLink, "_blank", "noopener,noreferrer");
  };

  const startSearch = (value = search) => {
    setSearch(value);
    setShowSuggestions(false);
    setPage("Find Jobs");
    fetchJobs(value, location);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  if (showWelcome) {
    return (
      <div className="welcome-screen">
        <form className="welcome-card" onSubmit={submitWelcome}>
          <div className="welcome-logo">C</div>
          <span className="eyebrow">WELCOME TO CAREERNEST</span>
          <h1>Let's get started.</h1>
          <p>What should we call you?</p>
          <input
            value={welcomeName}
            onChange={(event) => setWelcomeName(event.target.value)}
            placeholder="Enter your name"
            autoFocus
            required
          />
          <button className="primary-button full" type="submit">
            Enter CareerNest →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#home" className="brand" onClick={() => openPage("Home")}>
          <span className="brand-icon">C</span>
          Career<span>Nest</span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle menu"
        >
          {mobileMenu ? "✕" : "☰"}
        </button>

        <nav className={mobileMenu ? "nav-links show" : "nav-links"}>
          {["Home", "Find Jobs", "Saved Jobs", "My Applications"].map(
            (item) => (
              <button
                key={item}
                className={page === item ? "nav-item active" : "nav-item"}
                onClick={() => openPage(item)}
              >
                {item}
              </button>
            )
          )}
        </nav>

        <div className="top-actions">
          <button
            className="theme-button"
            onClick={() =>
              setTheme((current) =>
                current === "dark" ? "light" : "dark"
              )
            }
            aria-label="Toggle theme"
            title="Change theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            className="profile-button"
            onClick={() => openPage("Profile")}
          >
            My Profile
          </button>
        </div>
      </header>

      <main>
        {page === "Home" && (
          <>
            <section className="hero">
              <div className="hero-orb"></div>

              <div className="hero-content">
                <span className="hero-label">
                  ✦ YOUR CAREER JOURNEY STARTS HERE
                </span>

                <h1>
                  Find work that
                  <br />
                  <span>moves you forward.</span>
                </h1>

                <p>
                  Welcome, {profile.name}! Discover opportunities and
                  take the next step in your professional journey.
                </p>

                <div className="hero-search search-wrapper">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") startSearch();
                      if (event.key === "Escape") setShowSuggestions(false);
                    }}
                    placeholder="Doctor, React, Google, Engineer..."
                  />
                  <button onClick={() => startSearch()}>
                    Search Jobs →
                  </button>

                  {showSuggestions && matchingSuggestions.length > 0 && (
                    <div className="suggestion-dropdown">
                      {matchingSuggestions.map((item) => (
                        <button
                          key={item}
                          onClick={() => startSearch(item)}
                        >
                          <span>⌕</span> {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hero-tags">
                  <span>Popular:</span>
                  {["React", "Frontend", "Doctor", "Marketing"].map(
                    (tag) => (
                      <button key={tag} onClick={() => startSearch(tag)}>
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="hero-side">
                <div className="floating-card">
                  <span className="floating-icon">✦</span>
                  <div>
                    <strong>New opportunities</strong>
                    <p>Find your next role</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="stats-section">
              <div>
                <strong>{jobs.length}+</strong>
                <span>Job listings loaded</span>
              </div>
              <div>
                <strong>{savedJobs.length}</strong>
                <span>Jobs saved by you</span>
              </div>
              <div>
                <strong>{applications.length}</strong>
                <span>Applications tracked</span>
              </div>
            </section>

            <section className="content-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">EXPLORE OPPORTUNITIES</span>
                  <h2>Featured jobs</h2>
                  <p>Explore available opportunities.</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => openPage("Find Jobs")}
                >
                  View all jobs →
                </button>
              </div>

              <div className="job-grid">
                {jobs.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={savedJobs.includes(job.id)}
                    onSave={() => toggleSave(job.id)}
                    onView={() => setSelectedJob(job)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {(page === "Find Jobs" || page === "Saved Jobs") && (
          <section className="content-section listing-page">
            <div className="section-title">
              <div>
                <span className="eyebrow">CAREER OPPORTUNITIES</span>
                <h2>{page}</h2>
                <p>{visibleJobs.length} opportunities available in this view.</p>
              </div>
            </div>

            {page === "Find Jobs" && (
              <div className="filter-bar">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") startSearch();
                  }}
                  placeholder="Search jobs or companies..."
                />

                <select
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    fetchJobs(search, event.target.value);
                  }}
                >
                  {countries.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>All categories</option>
                  <option>Engineering</option>
                  <option>Development</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Data</option>
                </select>

                <select
                  value={jobType}
                  onChange={(event) => setJobType(event.target.value)}
                >
                  <option>All types</option>
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>Contractor</option>
                  <option>Intern</option>
                </select>

                <button
                  className="clear-filters"
                  onClick={() => {
                    setSearch("");
                    setLocation("All locations");
                    setCategory("All categories");
                    setJobType("All types");
                    fetchJobs("", "All locations");
                  }}
                >
                  Clear
                </button>

                <button
                  className="primary-button"
                  onClick={() => fetchJobs(search, location)}
                >
                  Search
                </button>
              </div>
            )}

            {loadingJobs && <p>Loading job opportunities...</p>}
            {jobError && <p className="job-notice">{jobError}</p>}

            <div className="job-grid">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedJobs.includes(job.id)}
                  onSave={() => toggleSave(job.id)}
                  onView={() => setSelectedJob(job)}
                />
              ))}
            </div>

            {!loadingJobs && visibleJobs.length === 0 && (
              <EmptyState message="No matching jobs found. Try another keyword or location." />
            )}

            <p className="source-credit">
              Remote job listings powered by{" "}
              <a href="https://himalayas.app" target="_blank" rel="noreferrer">
                Himalayas
              </a>
              .
            </p>
          </section>
        )}

        {page === "My Applications" && (
          <section className="content-section listing-page">
            <span className="eyebrow">YOUR CAREER TRACKER</span>
            <h2>My Applications</h2>
            <p>Jobs whose application links you opened are tracked here.</p>

            {applications.length === 0 ? (
              <EmptyState message="Your tracked applications will appear here." />
            ) : (
              <div className="application-list">
                {applications.map((application) => (
                  <div className="application-row" key={application.jobId}>
                    <div className="company-logo">
                      {application.company?.charAt(0) || "C"}
                    </div>
                    <div className="application-info">
                      <h3>{application.title}</h3>
                      <p>
                        {application.company} · {application.location}
                      </p>
                      <span>Opened on {application.appliedAt}</span>
                    </div>
                    <span className="application-status">
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {page === "Profile" && (
          <section className="content-section profile-page">
            <span className="eyebrow">YOUR ACCOUNT</span>
            <h2>My Profile</h2>

            <div className="profile-card">
              <div className="profile-avatar">
                {getInitials(profile.name || "Career Nest")}
              </div>

              {!editingProfile ? (
                <>
                  <h3>{profile.name}</h3>
                  <p>{profile.email || "Add your email address"}</p>
                  <p>{profile.phone || "Add your mobile number"}</p>

                  <div className="profile-stats">
                    <div>
                      <strong>{savedJobs.length}</strong>
                      <span>Saved jobs</span>
                    </div>
                    <div>
                      <strong>{applications.length}</strong>
                      <span>Applications</span>
                    </div>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setEditForm(profile);
                      setEditingProfile(true);
                    }}
                  >
                    Edit Profile ✎
                  </button>
                </>
              ) : (
                <form className="profile-edit-form" onSubmit={saveProfile}>
                  <label>Your name</label>
                  <input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm({ ...editForm, name: event.target.value })
                    }
                    required
                  />

                  <label>Email address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({ ...editForm, email: event.target.value })
                    }
                    placeholder="Your email"
                  />

                  <label>Mobile number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm({ ...editForm, phone: event.target.value })
                    }
                    placeholder="Your mobile number"
                  />

                  <button className="primary-button full" type="submit">
                    Save Changes
                  </button>
                  <button
                    className="clear-filters"
                    type="button"
                    onClick={() => setEditingProfile(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}

              {!editingProfile && (
                <button
                  className="text-link"
                  onClick={() => openPage("My Applications")}
                >
                  View Applications →
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a className="brand" href="#home" onClick={() => openPage("Home")}>
          <span className="brand-icon">C</span>
          Career<span>Nest</span>
        </a>
        <p>Find your next opportunity. Build your future.</p>
        <span>© {new Date().getFullYear()} CareerNest</span>
      </footer>

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-close"
              onClick={() => setSelectedJob(null)}
            >
              ×
            </button>

            <div className="company-logo large">{selectedJob.logo}</div>
            <span className="eyebrow">
              {selectedJob.isDemo ? "DEMO OPPORTUNITY" : "JOB DETAILS"}
            </span>
            <h2>{selectedJob.title}</h2>
            <p className="modal-company">
              {selectedJob.company} · {selectedJob.location}
            </p>

            <div className="job-meta">
              <span>{selectedJob.type}</span>
              <span>{selectedJob.salary}</span>
              <span>{selectedJob.experience}</span>
            </div>

            <h3>About this role</h3>
            <p className="modal-description">{selectedJob.description}</p>

            <h3>Skills / Categories</h3>
            <div className="skill-tags">
              {selectedJob.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            {selectedJob.isDemo ? (
              <button
                className="primary-button full"
                onClick={() => setNotice("Demo listing only — no real application available.")}
              >
                Demo Listing — No Real Apply
              </button>
            ) : (
              <button
                className="primary-button full"
                onClick={() => applyForJob(selectedJob)}
              >
                Apply on Original Listing →
              </button>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="toast">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
    </div>
  );
}

function JobCard({ job, saved, onSave, onView }) {
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-logo">{job.logo}</div>
        <button
          className={saved ? "save-button saved" : "save-button"}
          onClick={onSave}
          aria-label={saved ? "Remove saved job" : "Save job"}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <span className="job-category">
        {job.isDemo ? "DEMO OPPORTUNITY" : job.category}
      </span>
      <h3>{job.title}</h3>
      <p className="company-name">{job.company}</p>

      <div className="job-information">
        <span>⌖ {job.location}</span>
        <span>◷ {job.type}</span>
      </div>

      <div className="job-card-bottom">
        <strong>{job.salary}</strong>
        <span>{job.posted}</span>
      </div>

      <button className="view-job-button" onClick={onView}>
        View Details →
      </button>
    </article>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <span>⌕</span>
      <h3>Nothing here yet</h3>
      <p>{message}</p>
    </div>
  );
}

export default App;
