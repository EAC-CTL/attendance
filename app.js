(function () {
  "use strict";

  const steps = window.attendanceSimulationSteps || [];
  const config = window.attendanceSimulationConfig || {};

  const portalData = {
    instructorName: "Training Faculty",
    terms: [
      { id: "2026FA", label: "Fall 2026" },
      { id: "2026SU", label: "Summer 2026" },
      { id: "2026SP", label: "Spring 2026" }
    ],
    courses: [
      {
        id: "ART145-U1023",
        termId: "2026SU",
        course: "ART145",
        title: "Beginning Watercolor I",
        section: "U1023",
        dates: "5/26/2026 to 7/31/2026",
        dayTime: "M 12:00PM-5:00P..",
        place: "Thatcher Sou..",
        rostersDue: 4,
        attendanceDue: 4,
        startDate: "5/26/2026",
        endDate: "7/31/2026",
        attendanceType: "Time Present-All",
        classLength: "300 Minutes",
        crossListed: ""
      },
      {
        id: "ART161-U2045",
        termId: "2026SU",
        course: "ART161",
        title: "Beginning Ceramics I",
        section: "U2045",
        dates: "5/26/2026 to 7/31/2026",
        dayTime: "W 12:00PM-5:00P..",
        place: "Thatcher Sou..",
        rostersDue: 4,
        attendanceDue: 4,
        startDate: "5/26/2026",
        endDate: "7/31/2026",
        attendanceType: "Time Present-All",
        classLength: "300 Minutes",
        crossListed: "ART161-U2045"
      }
    ],
    students: [
      { id: "901204", pronouns: "", name: "Hackett, Kenny" },
      { id: "901317", pronouns: "", name: "Wood-Belate, Susan" },
      { id: "901428", pronouns: "", name: "Toorun, Aaron" },
      { id: "901536", pronouns: "", name: "Tendance, Pete" },
      { id: "901649", pronouns: "", name: "Peckmark, Kevin" },
      { id: "901752", pronouns: "", name: "Rollenson, Gary" }
    ]
  };

  const state = {
    started: false,
    mode: "guided", // "guided" | "practice"
    page: "entry",
    signInEmail: "training.faculty@eac.example",
    classesExpanded: false,
    selectedTerm: "2026FA",
    selectedCourseId: null,
    selectedDate: null,
    attendanceMode: "view",
    attendanceSaved: false,
    saveStatus: "idle",
    savedAt: "",
    saveRequestId: 0,
    currentStepIndex: 0,
    feedbackText: "",
    feedbackTone: "error", // "error" | "info"
    wrongCount: 0,
    attendance: {},
    reasons: {}
  };

  const main = document.querySelector("#mainContent");
  const coach = document.querySelector("#coach");
  const coachProgress = document.querySelector("#coachProgress");
  const coachTitle = document.querySelector("#coachTitle");
  const coachBody = document.querySelector("#coachBody");
  const coachChecklist = document.querySelector("#coachChecklist");
  const coachFeedback = document.querySelector("#coachFeedback");
  const coachActions = document.querySelector("#coachActions");
  const coachClose = document.querySelector("#coachClose");
  const toast = document.querySelector("#toast");
  const navMyClasses = document.querySelector("#navMyClasses");
  const subnav = document.querySelector("#myClassesSubnav");
  const gradebookLink = document.querySelector("#gradebookLink");
  const introOverlay = document.querySelector("#introOverlay");
  const startGuided = document.querySelector("#startGuided");
  const startPractice = document.querySelector("#startPractice");
  const spotlight = document.querySelector("#spotlight");
  const spotlightPath = document.querySelector("#spotlightPath");
  const connector = document.querySelector("#connector");
  const connectorLine = document.querySelector("#connectorLine");
  const connectorDot = document.querySelector("#connectorDot");

  let scrollRaf = 0;

  /* ---------------------------------------------------------------- setup */

  function init() {
    resetRoster();

    navMyClasses.addEventListener("click", onMyClassesClick);
    gradebookLink.addEventListener("click", onGradebookClick);
    document.addEventListener("click", onDocumentClick);
    coach.addEventListener("click", onCoachAction);
    window.addEventListener("resize", positionCoach);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });

    startGuided.addEventListener("click", () => startSim("guided"));
    startPractice.addEventListener("click", () => startSim("practice"));

    showIntro();
    render();
    focusEl(startGuided);
  }

  function resetRoster() {
    portalData.students.forEach((student) => {
      state.attendance[student.id] = "Present";
      state.reasons[student.id] = "";
    });
  }

  function resetProgress() {
    state.page = "entry";
    state.classesExpanded = false;
    state.selectedTerm = "2026FA";
    state.selectedCourseId = null;
    state.selectedDate = null;
    state.attendanceMode = "view";
    state.attendanceSaved = false;
    state.saveStatus = "idle";
    state.savedAt = "";
    state.saveRequestId += 1;
    state.currentStepIndex = 0;
    state.feedbackText = "";
    state.feedbackTone = "error";
    state.wrongCount = 0;
    resetRoster();
  }

  function showIntro() {
    state.started = false;
    introOverlay.hidden = false;
    document.body.classList.add("intro-active");
  }

  function startSim(mode) {
    state.mode = mode;
    state.started = true;
    introOverlay.hidden = true;
    document.body.classList.remove("intro-active");
    resetProgress();
    render();
  }

  function backToIntro() {
    resetProgress();
    showIntro();
    render();
    focusEl(startGuided);
  }

  function onCoachAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    event.stopPropagation();
    const action = button.dataset.action;
    if (action === "practice") {
      state.mode = "practice";
      resetProgress();
      render();
    } else if (action === "intro") {
      backToIntro();
    }
  }

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      positionCoach();
    });
  }

  /* --------------------------------------------------------- navigation */

  function onMyClassesClick(event) {
    if (event) event.stopPropagation();
    state.classesExpanded = !state.classesExpanded;
    const step = currentStep();

    if (state.classesExpanded && step.id === "expand-my-classes" && attemptAction("expand-my-classes")) {
      completeObjective();
    } else if (step.id !== "expand-my-classes" && step.action !== "done") {
      showStepFeedback();
    }
    render();
  }

  function onGradebookClick(event) {
    if (event) event.stopPropagation();
    if (!attemptAction("open-gradebook")) return;
    state.page = "gradebook";
    state.classesExpanded = true;
    completeObjective();
    render();
  }

  function updateNavigation() {
    const inWorkflow = state.started && state.page !== "front" && state.page !== "entry" && state.page !== "signin";
    navMyClasses.classList.toggle("active", state.classesExpanded || inWorkflow);
    navMyClasses.setAttribute("aria-expanded", String(state.classesExpanded));
    subnav.hidden = !state.classesExpanded;
    gradebookLink.classList.toggle("active", inWorkflow);
  }

  /* -------------------------------------------------------------- render */

  function render() {
    updateNavigation();
    main.innerHTML = "";
    document.body.classList.toggle("entry-active", state.page === "entry");
    document.body.classList.toggle("signin-active", state.page === "signin");
    document.body.classList.toggle("auth-stage-active", state.page === "entry" || state.page === "signin");

    if (state.page === "entry") renderPortalEntryPage();
    if (state.page === "signin") renderSignInPage();
    if (state.page === "front") renderFrontPage();
    if (state.page === "gradebook") renderGradebookPage();
    if (state.page === "course") renderCourseDetailsPage();
    if (state.page === "attendance") renderAttendancePage();

    bindPageEvents();
    renderCoach();
  }

  function renderFrontPage() {
    main.innerHTML = `
      <section class="front-grid" aria-label="Faculty Portal front page">
        <article class="front-card">
          <div class="center-note">
            <div>
              <div>Next Class</div>
              <div>6/24/2026 12:00:00 PM</div>
              <div>ART161 U2045</div>
            </div>
          </div>
          <h2>My Calendar</h2>
        </article>

        <article class="front-card">
          <p>EAC Campus Events...</p>
          <a href="#" data-neutral aria-label="More campus events">more</a>
          <h2>News Center</h2>
        </article>

        <article class="front-card large">
          <div class="class-mini">
            <div><strong>Term:</strong> 2026SU</div>
            <div><strong>Course:</strong> <a href="#" data-neutral>ART161</a></div>
            <div><strong>Section:</strong> U2045</div>
            <div><strong>Post/Assign/Exam:</strong> <a href="#" data-neutral>0</a> <span aria-hidden="true">▧</span></div>
            <div><strong>Attendance due:</strong> <a href="#" data-neutral>4</a> <img class="appointment-icon" src="assets/icon_appts.gif" alt="" aria-hidden="true"></div>
            <div><strong>Print Roster:</strong> <span aria-hidden="true">▤</span></div>
          </div>
          <h2>Classes</h2>
        </article>

        <article class="front-card large">
          <div class="center-note" style="color:#b13d3d;">There are no tasks to display.</div>
          <h2>Task</h2>
        </article>
      </section>
    `;
  }

  function renderPortalEntryPage() {
    main.innerHTML = `
      <section class="entry-screen" aria-label="my.eac.edu Self-Service Portal">
        <header class="entry-logo">
          <img src="assets/logo.png" alt="Eastern Arizona College">
        </header>

        <div class="entry-content">
          <h1>Self-Service Portal</h1>
          <div class="entry-rule" aria-hidden="true"></div>
          <p>Log into the portal to view your academic information, receive personalized communication, and use our self-service tools.</p>

          <div class="entry-cards" aria-label="Portal choices">
            <button class="entry-card student-card" type="button">
              ${entryIcon("student")}
              <span class="entry-card-title">Student Portal<br>Homepage</span>
              <span class="entry-card-note">Current Students Login Here</span>
            </button>

            <button class="entry-card faculty-card" id="facultyPortalCard" type="button">
              ${entryIcon("faculty")}
              <span class="entry-card-title">Faculty Portal<br>Homepage</span>
              <span class="entry-card-note">Faculty Login Here</span>
            </button>

            <button class="entry-card schedule-card" type="button">
              ${entryIcon("schedule")}
              <span class="entry-card-title">Course Schedule</span>
              <span class="entry-card-note">&nbsp;</span>
            </button>
          </div>
        </div>

        <footer class="entry-footer">
          <span>Version: 26.1.1.15</span>
        </footer>
      </section>
    `;
  }

  function entryIcon(type) {
    if (type === "student") {
      return `
        <svg class="entry-icon student-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M4 22 32 8l28 14-28 14L4 22Z"></path>
          <path d="M16 30v13c5 8 27 8 32 0V30L32 38 16 30Z"></path>
          <path d="M54 25v18"></path>
          <circle cx="54" cy="48" r="3"></circle>
        </svg>
      `;
    }

    if (type === "faculty") {
      return `
        <svg class="entry-icon faculty-icon" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="16" cy="18" r="6"></circle>
          <path d="M9 56V36c0-6 4-11 10-11h5l10 8"></path>
          <path d="M25 12h31v24H33"></path>
          <path d="M39 20h10M39 28h10"></path>
          <path d="M26 56 33 35"></path>
        </svg>
      `;
    }

    return `
      <svg class="entry-icon schedule-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 13h36a4 4 0 0 1 4 4v33a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z"></path>
        <path d="M10 24h44M20 8v11M44 8v11"></path>
        <circle cx="40" cy="42" r="10"></circle>
        <path d="M40 36v7l5 3"></path>
      </svg>
    `;
  }

  function renderSignInPage() {
    main.innerHTML = `
      <section class="signin-screen" aria-label="Faculty Portal sign-in simulation">
        <div class="signin-stack">
          <form class="signin-box" id="signInForm">
            <img class="signin-banner" src="assets/signin-banner-logo.png" alt="Eastern Arizona College">
            <h1>Sign in</h1>
            <label class="signin-label" for="signInEmail">Email, phone, or Skype</label>
            <input
              id="signInEmail"
              class="signin-input"
              autocomplete="off"
              readonly
              value="${escapeHtml(state.signInEmail)}"
              aria-describedby="signInHelp"
              data-neutral
            >
            <a href="#" id="signInHelp" data-neutral>Can't access your account?</a>
            <div class="signin-actions">
              <button class="ms-next-button" id="signInNext" type="submit">Next</button>
            </div>
          </form>

          <button class="signin-options" type="button" data-neutral>
            <img src="assets/signin-options.svg" alt="" aria-hidden="true">
            <span>Sign-in options</span>
          </button>
        </div>
        <div class="signin-footer">
          <a href="#" data-neutral>Terms of use</a>
          <a href="#" data-neutral>Privacy &amp; cookies</a>
          <button type="button" aria-label="More options" data-neutral>...</button>
        </div>
        <div class="signin-progress" aria-hidden="true"></div>
      </section>
    `;
  }

  function renderGradebookPage() {
    const courses = portalData.courses.filter((course) => course.termId === state.selectedTerm);
    const termOptions = portalData.terms
      .map((term) => `<option value="${term.id}" ${term.id === state.selectedTerm ? "selected" : ""}>${term.label}</option>`)
      .join("");

    main.innerHTML = `
      ${pageHeading("Gradebook")}
      <div class="note-box">
        <strong>Note:</strong> This page may default to a future term. Be sure to select the correct term under <strong>"View Course List for Term"</strong> before <strong>reporting attendance</strong> or <strong>entering grades</strong>.
      </div>

      <section class="panel" aria-labelledby="courseListTitle">
        <div class="term-row">
          <label for="termSelect">View Course List for Term</label>
          <select id="termSelect">${termOptions}</select>
          <p class="term-help">Please ensure you have selected the correct term before proceeding.</p>
        </div>

        <h2 class="section-title" id="courseListTitle">Primary Course List</h2>
        <div class="section-line"></div>
        <p>Below are all courses to which you are assigned as the Primary Instructor</p>

        ${courses.length ? renderCourseTable(courses) : renderNoCourses()}
      </section>
    `;
  }

  function renderNoCourses() {
    return `
      <div class="empty-results">
        No primary courses are available for the selected term. Switch the term to ${escapeHtml(config.termLabel)} to find this class.
      </div>
    `;
  }

  function renderCourseTable(courses) {
    const rows = courses
      .map((course) => `
        <tr>
          <td>${course.course}</td>
          <td><button class="course-link" type="button" data-course-id="${course.id}">${course.title}</button></td>
          <td>${course.section} <span class="fa fa-envelope fa-lg mail-icon" aria-label="Email available"></span></td>
          <td>${course.dates}</td>
          <td>${course.dayTime}</td>
          <td>${course.place}</td>
          <td>${course.rostersDue} <img class="appointment-icon" src="assets/icon_appts.gif" alt="" aria-hidden="true"></td>
          <td class="icon-cell"><span class="fa fa-lg fa-eye eye-icon" aria-label="View students"></span></td>
        </tr>
      `)
      .join("");

    return `
      <div class="table-tools">
        <span>Showing 1 to ${courses.length} of ${courses.length} entries</span>
        <label class="search-box">Search <input type="search" aria-label="Search course list" data-neutral></label>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Course Title</th>
              <th>Class Section Availability</th>
              <th>Course Start/End Date</th>
              <th>Day/Time</th>
              <th>Place</th>
              <th>Rosters Due</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="table-footer">
        <span>Show <select aria-label="Rows per page" data-neutral><option>10</option></select> entries</span>
        <span class="paging">Previous <span class="page-num">1</span> Next</span>
        <span>Showing 1 to ${courses.length} of ${courses.length} entries</span>
      </div>
    `;
  }

  function renderCourseDetailsPage() {
    const course = selectedCourse();
    main.innerHTML = `
      ${pageHeading("Gradebook")}
      <h2 class="course-detail-heading">Course Details - ${course.title}<br>(${course.section})</h2>

      <section class="panel" aria-label="Course details">
        <div class="details-grid">
          <div>
            ${detailPair("Course Code", course.course)}
            ${detailPair("Start Date", course.startDate)}
            ${detailPair("End Date", course.endDate)}
            ${detailPair("Assignments & Exams", "0 ungraded")}
            <p>This Section is Cross Listed.</p>
          </div>
          <div>
            ${detailPair("Secondary Section", "Not Available")}
            ${detailPair("Last Posted Attendance", state.attendanceSaved ? config.meetingDateLabel : "Not Available")}
            ${detailPair("Attendance Due", `${course.attendanceDue} days`)}
            <p>${course.crossListed}</p>
          </div>
        </div>
        <div class="center-actions">
          <button class="yellow-button" type="button" id="backToGradebook">Back</button>
        </div>
      </section>

      <section class="panel calendar-section" aria-labelledby="classAttendanceTitle">
        <div class="tabs" role="tablist" aria-label="Gradebook detail tabs">
          <button class="tab active" type="button" role="tab" aria-selected="true" data-neutral>Attendance</button>
          <button class="tab" type="button" role="tab" aria-selected="false" data-neutral>Midterm Grades</button>
          <button class="tab" type="button" role="tab" aria-selected="false" data-neutral>Final Grades</button>
        </div>
        <h2 class="calendar-heading" id="classAttendanceTitle">Class Attendance</h2>
        <div class="section-line"></div>
        <div class="calendar-nav">
          <a href="#" data-neutral aria-label="Previous Month">‹ Previous Month</a>
          <a href="#" data-neutral aria-label="Next Month">Next Month ›</a>
        </div>
        <p class="calendar-help">Click on a day within the calendar to view complete attendance details</p>
        <div class="calendar-pair">
          ${renderJuneCalendar()}
          ${renderJulyCalendar()}
        </div>
        ${renderLegend()}
      </section>
    `;
  }

  function renderAttendancePage() {
    const course = selectedCourse();
    const editMode = state.attendanceMode === "edit";
    const saved = state.attendanceSaved;
    const saving = state.saveStatus === "saving";

    main.innerHTML = `
      ${pageHeading("View & Post Attendance")}
      <p class="attendance-intro">Here you post attendance for the date you selected, and view previously posted attendance details</p>

      <h2 class="class-info-title">Class Information - ${course.title} (${course.section})</h2>
      <section class="panel class-info-card" aria-label="Class Information">
        <dl class="info-list">
          <dt>Class Length</dt><dd>${course.classLength}</dd>
          <dt>Class Meeting Date</dt><dd>${formatSelectedDate()}</dd>
          <dt>Attendance Type</dt><dd>${course.attendanceType}</dd>
        </dl>
        <button class="yellow-button back-button" type="button" id="backToCourse">Back</button>
      </section>

      <div class="student-heading-row">
        <h2>Student Attendance</h2>
        <a href="#" data-neutral>Help</a>
      </div>

      ${saving ? renderSavingMessage() : ""}
      ${saved ? renderSuccessMessage() : ""}
      ${saved ? renderCompletionPanel() : ""}

      <section class="panel attendance-card" aria-label="Student Attendance">
        <label class="active-only"><input type="checkbox" checked data-neutral> Only show active students</label>
        <div class="table-scroll">
          <table class="data-table" id="attendanceTable">
            <thead>
              ${editMode ? renderAttendanceEditHeader() : renderAttendanceReadHeader(saved)}
            </thead>
            <tbody>
              ${editMode ? renderAttendanceEditRows() : renderAttendanceReadRows(saved)}
            </tbody>
          </table>
        </div>
        <div class="attendance-buttons">
          <div class="left-actions">
            <button class="table-action" type="button" data-neutral><span class="printer-icon" aria-hidden="true">▤</span> Print Roster</button>
            <button class="table-action" type="button" data-neutral><span class="fa fa-envelope mail-icon" aria-hidden="true"></span> Email Class</button>
          </div>
          <div class="right-actions">
            ${
              editMode
                ? `<button class="table-action" type="button" id="cancelEditButton" ${saving ? "disabled" : ""}>Cancel</button><button class="table-action" type="button" id="updateAttendanceButton" ${saving ? "disabled" : ""}>${saving ? "Updating..." : "Update"}</button>`
                : `<button class="table-action" type="button" id="editAttendanceButton">Edit</button>`
            }
          </div>
        </div>
      </section>
    `;
  }

  function renderAttendanceEditHeader() {
    return `
      <tr>
        <th>Student ID</th>
        <th>Pronouns</th>
        <th>Name</th>
        <th>Status</th>
        <th>Time Present</th>
        <th>Course Absent</th>
        <th>Reason</th>
      </tr>
    `;
  }

  function renderAttendanceReadHeader() {
    return `
      <tr>
        <th>Student ID</th>
        <th>Pronouns</th>
        <th>Name</th>
        <th>Status</th>
        <th>Time Present</th>
        <th>Course Absent</th>
        <th>Excused?</th>
        <th>Reason</th>
      </tr>
    `;
  }

  function renderAttendanceEditRows() {
    return portalData.students
      .map((student) => {
        const value = state.attendance[student.id];
        const absent = value === "Present" ? "0.00%" : "100.00%";
        return `
          <tr>
            <td>${student.id}</td>
            <td>${student.pronouns}</td>
            <td>${student.name}</td>
            <td>Scheduled</td>
            <td>
              <select class="attendance-select" data-student-id="${student.id}" aria-label="Time Present for ${niceName(student)}">
                ${["Present", "Absent", "Excused"].map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </td>
            <td data-absent-for="${student.id}">${absent}</td>
            <td><input type="text" class="reason-input" data-reason-id="${student.id}" value="${escapeHtml(state.reasons[student.id])}" aria-label="Reason for ${niceName(student)}"></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderAttendanceReadRows(saved) {
    return portalData.students
      .map((student) => {
        const value = saved ? state.attendance[student.id] : "Not Posted";
        const isExcused = saved && state.attendance[student.id] === "Excused";
        const absent = saved && state.attendance[student.id] !== "Present" ? "100.00%" : "0.00%";
        const timePresent = saved && state.attendance[student.id] === "Present" ? "300 mins" : value;
        return `
          <tr>
            <td>${student.id}</td>
            <td>${student.pronouns}</td>
            <td>${student.name}</td>
            <td>${saved ? "Current" : "Scheduled"}</td>
            <td>${timePresent}</td>
            <td>${absent}</td>
            <td>${isExcused ? "Yes" : ""}</td>
            <td>${escapeHtml(state.reasons[student.id])}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSavingMessage() {
    return `
      <div class="save-message">
        <span class="save-spinner" aria-hidden="true"></span>
        <span>Updating attendance for ${config.meetingDateLabel}...</span>
      </div>
    `;
  }

  function renderSuccessMessage() {
    return `
      <div class="success-message">
        <span class="success-icon" aria-hidden="true">✓</span>
        <span>Attendance was successfully updated for ${config.courseTitle} (${config.courseSection}), ${config.meetingDateLabel}.</span>
      </div>
    `;
  }

  function renderCompletionPanel() {
    return `
      <div class="completion-panel" id="completionPanel" tabindex="-1">
        <span class="success-icon" aria-hidden="true">✓</span>
        <div>
          <h3>Attendance posted</h3>
          <p>Saved by ${escapeHtml(portalData.instructorName)}${state.savedAt ? ` at ${escapeHtml(state.savedAt)}` : ""}. Course Details now lists ${config.meetingDateLabel} as the last posted attendance.</p>
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------- page events */

  function bindPageEvents() {
    const facultyPortalCard = document.querySelector("#facultyPortalCard");
    if (facultyPortalCard) {
      facultyPortalCard.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!attemptAction("open-faculty-portal")) return;
        state.page = "signin";
        completeObjective();
        render();
      });
    }

    const signInForm = document.querySelector("#signInForm");
    if (signInForm) {
      signInForm.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!attemptAction("signin-next")) return;
        state.page = "front";
        state.classesExpanded = false;
        completeObjective();
        render();
      });
    }

    const termSelect = document.querySelector("#termSelect");
    if (termSelect) {
      termSelect.addEventListener("change", (event) => {
        state.selectedTerm = event.target.value;
        if (currentStep().id === "select-term") {
          if (attemptAction("select-term", { termId: state.selectedTerm })) {
            completeObjective();
          }
        }
        render();
      });
    }

    document.querySelectorAll("[data-course-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!attemptAction("choose-course", { courseId: button.dataset.courseId })) return;
        state.selectedCourseId = button.dataset.courseId;
        state.page = "course";
        completeObjective();
        render();
      });
    });

    document.querySelectorAll("[data-attendance-date]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!attemptAction("choose-date", { date: button.dataset.attendanceDate })) return;
        state.selectedDate = button.dataset.attendanceDate;
        state.page = "attendance";
        state.attendanceMode = "view";
        completeObjective();
        render();
      });
    });

    const editButton = document.querySelector("#editAttendanceButton");
    if (editButton) {
      editButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!attemptAction("click-edit")) return;
        state.attendanceMode = "edit";
        completeObjective();
        render();
      });
    }

    document.querySelectorAll(".attendance-select").forEach((select) => {
      select.addEventListener("change", (event) => {
        const studentId = event.target.dataset.studentId;
        state.attendance[studentId] = event.target.value;
        const absentCell = document.querySelector(`[data-absent-for="${studentId}"]`);
        if (absentCell) {
          absentCell.textContent = event.target.value === "Present" ? "0.00%" : "100.00%";
        }
        if (currentStep().id === "mark-attendance") {
          checkAttendanceProgress();
        } else if (currentStep().id === "update-attendance" && !rosterStatus().ready) {
          // They broke a roster that was already complete, so step back to marking.
          goToObjective("mark-attendance");
          applyFeedback(rosterStatus().message, "info");
          renderCoach();
        }
      });
    });

    document.querySelectorAll(".reason-input").forEach((input) => {
      input.addEventListener("input", (event) => {
        state.reasons[event.target.dataset.reasonId] = event.target.value;
      });
    });

    const updateButton = document.querySelector("#updateAttendanceButton");
    if (updateButton) {
      updateButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const status = rosterStatus();
        if (!status.ready) {
          applyFeedback(status.message, "info");
          return;
        }
        if (currentStep().id === "mark-attendance") {
          completeObjective();
        }
        if (!attemptAction("update-attendance")) return;
        submitAttendance();
      });
    }

    const cancelButton = document.querySelector("#cancelEditButton");
    if (cancelButton) {
      cancelButton.addEventListener("click", (event) => {
        event.stopPropagation();
        state.attendanceMode = "view";
        if (currentStep().id === "mark-attendance" || currentStep().id === "update-attendance") {
          goToObjective("click-edit");
        }
        applyFeedback("No problem, your edits were cleared. Select Edit again when you're ready.", "info");
        render();
      });
    }

    const backToGradebook = document.querySelector("#backToGradebook");
    if (backToGradebook) {
      backToGradebook.addEventListener("click", (event) => {
        event.stopPropagation();
        state.page = "gradebook";
        if (currentStep().id !== "complete") {
          goToObjective("choose-course");
        }
        showToast("Back to the course list.");
        render();
      });
    }

    const backToCourse = document.querySelector("#backToCourse");
    if (backToCourse) {
      backToCourse.addEventListener("click", (event) => {
        event.stopPropagation();
        state.page = "course";
        if (currentStep().id !== "complete") {
          goToObjective("choose-date");
        }
        showToast("Back to course details.");
        render();
      });
    }
  }

  /* --------------------------------------------------------- validation */

  function attemptAction(actionName, details = {}) {
    const step = currentStep();
    if (!step || step.action === "done") return true;

    if (step.action !== actionName) {
      if (details.message) {
        showStepFeedback(details.message);
      } else {
        showStepFeedback();
      }
      return false;
    }

    if (actionName === "select-term" && details.termId !== config.termId) {
      showStepFeedback(`This meeting is in ${config.termLabel}. Switch the term to ${config.termLabel} to load the right courses.`);
      return false;
    }

    if (actionName === "choose-course" && details.courseId !== config.courseId) {
      showStepFeedback(`Open ${config.courseTitle} (${config.courseSection}) for this practice.`);
      return false;
    }

    if (actionName === "choose-date" && details.date !== config.meetingDateISO) {
      showStepFeedback(`That's a different meeting. For this practice, open Wednesday, ${config.meetingDateLabel}.`);
      return false;
    }

    if (actionName === "update-attendance" && !rosterStatus().ready) {
      showStepFeedback(rosterStatus().message);
      return false;
    }

    return true;
  }

  function completeObjective() {
    const step = currentStep();
    applyFeedback("", "info");
    state.wrongCount = 0;
    if (step && step.success && step.action !== "done") {
      showToast(fill(step.success));
    }
    advanceStep();
  }

  function goToObjective(id) {
    const index = steps.findIndex((step) => step.id === id);
    if (index >= 0) {
      state.currentStepIndex = index;
      state.wrongCount = 0;
      applyFeedback("", "info");
    }
  }

  function submitAttendance() {
    if (state.saveStatus === "saving") return;
    state.saveStatus = "saving";
    state.saveRequestId += 1;
    const saveRequestId = state.saveRequestId;
    render();
    window.setTimeout(() => {
      if (saveRequestId !== state.saveRequestId) return;
      state.attendanceSaved = true;
      state.attendanceMode = "view";
      state.saveStatus = "saved";
      state.savedAt = nowStamp();
      completeObjective();
      render();
    }, 650);
  }

  function checkAttendanceProgress() {
    if (currentStep().id !== "mark-attendance") return;
    const status = rosterStatus();
    if (status.ready) {
      completeObjective();
      renderCoach();
    } else {
      applyFeedback(status.message, "info");
      renderCoach();
    }
  }

  function rosterStatus() {
    const issues = [];
    (config.targets || []).forEach((target) => {
      if (state.attendance[target.studentId] !== target.status) {
        issues.push(`${target.display} should be ${target.status}`);
      }
    });
    portalData.students.forEach((student) => {
      const target = (config.targets || []).find((t) => t.studentId === student.id);
      if (!target && state.attendance[student.id] !== "Present") {
        issues.push(`${niceName(student)} should stay Present`);
      }
    });
    if (!issues.length) {
      return { ready: true, message: "That matches. Go ahead and post." };
    }
    return { ready: false, message: issues.join("; ") + "." };
  }

  function targetsSentence() {
    const parts = (config.targets || []).map((target) => `${target.display} to ${target.status}`);
    if (parts.length <= 1) return parts[0] || "";
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }

  function markBody() {
    return `Everyone starts Present for the full class. Change only the students who differ: ${targetsSentence()}. You can add a Reason in that row if your campus requires one.`;
  }

  function practiceObjective() {
    return `Post attendance for the ${meetingWeekday()} ${config.meetingDateLabel} meeting of ${config.courseTitle} (${config.courseSection}). Most students were present, so change only the exceptions (${targetsSentence()}), then post it with Update.`;
  }

  function onDocumentClick(event) {
    if (!state.started) return;
    const step = currentStep();
    if (!step || step.action === "done") return;
    if (event.target.closest("#coach") || event.target.closest("#introOverlay")) return;
    if (event.target.closest("[data-neutral]")) return;
    if (step.target && event.target.closest(step.target)) return;

    if (event.target.closest("button, a, select, input, textarea")) {
      showStepFeedback();
    }
  }

  /* -------------------------------------------------------------- coach */

  function renderCoach() {
    clearHighlights();

    if (!state.started) {
      coach.hidden = true;
      coach.classList.remove("tour", "practice");
      coachClose.hidden = true;
      hideSpotlight();
      hideConnector();
      return;
    }

    const step = currentStep();
    if (!step) {
      coach.hidden = true;
      hideSpotlight();
      hideConnector();
      return;
    }

    coach.hidden = false;
    const isDone = step.action === "done";
    const practice = state.mode === "practice";
    const guidedStep = !practice && !isDone;

    coach.classList.toggle("tour", guidedStep);
    coach.classList.toggle("practice", practice);
    coachClose.hidden = !guidedStep;

    if (guidedStep) {
      coachProgress.hidden = true;
      coachProgress.textContent = "";
    } else {
      coachProgress.hidden = false;
      coachProgress.textContent = isDone ? (practice ? "Practice complete" : "All done") : "Practice, no hints";
    }

    if (isDone) {
      coachTitle.textContent = fill(step.title);
      coachBody.textContent = fill(step.body);
      coachChecklist.hidden = true;
    } else if (practice) {
      coachTitle.textContent = "Your task";
      coachBody.textContent = practiceObjective();
      renderChecklist();
      coachChecklist.hidden = false;
    } else {
      coachTitle.textContent = fill(step.title);
      coachBody.textContent = step.id === "mark-attendance" ? markBody() : fill(step.body);
      coachChecklist.hidden = true;
    }

    applyFeedback(state.feedbackText, state.feedbackTone);

    if (isDone) {
      coachActions.innerHTML = actionsHtml(true, practice);
    } else if (practice) {
      coachActions.innerHTML = `<button class="coach-link" data-action="intro" type="button">Start over</button>`;
    } else {
      const total = steps.filter((s) => s.action !== "done").length;
      const num = Math.min(state.currentStepIndex + 1, total);
      coachActions.innerHTML = `<span class="coach-count">${num} of ${total}</span>`;
    }

    window.requestAnimationFrame(() => {
      if (guidedStep && step.target) {
        const target = document.querySelector(step.target);
        if (target) {
          target.classList.add("sim-highlight");
          scrollIntoViewSafe(target);
        }
      }
      positionCoach();
      focusForStep();
    });
  }

  function renderChecklist() {
    const items = [
      { done: state.selectedTerm === config.termId, text: `Set the term to ${config.termLabel}` },
      { done: state.selectedCourseId === config.courseId, text: `Open ${config.courseTitle} (${config.courseSection})` },
      { done: state.selectedDate === config.meetingDateISO, text: `Open the ${config.meetingDateLabel} meeting` },
      { done: rosterStatus().ready, text: `Mark the roster (${targetsSentence()})` },
      { done: state.attendanceSaved, text: "Post it with Update" }
    ];
    coachChecklist.innerHTML = items
      .map((item) => `<li class="${item.done ? "done" : ""}"><span class="cl-mark" aria-hidden="true">${item.done ? "✓" : "○"}</span><span>${escapeHtml(item.text)}</span></li>`)
      .join("");
  }

  function actionsHtml(isDone, practice) {
    if (practice) {
      return `
        <button class="coach-primary" data-action="practice" type="button">Run it again</button>
        <button class="coach-link subtle" data-action="intro" type="button">Start over</button>
      `;
    }
    return `
      <button class="coach-primary" data-action="practice" type="button">Try it without hints</button>
      <button class="coach-link subtle" data-action="intro" type="button">Start over</button>
    `;
  }

  function showStepFeedback(message) {
    const step = currentStep();
    let text;
    if (message) {
      text = message;
    } else if (state.mode === "practice") {
      state.wrongCount += 1;
      text = state.wrongCount >= 2
        ? fill(step.wrong || "Check your task above and look for the right control.")
        : "Not the next step yet. Check your task above, then try another control.";
    } else {
      text = fill(step.wrong || "Use the highlighted control to continue.");
    }
    applyFeedback(text, "error");
    positionCoach();
  }

  function applyFeedback(text, tone) {
    state.feedbackText = text || "";
    state.feedbackTone = tone || "error";
    coachFeedback.textContent = state.feedbackText;
    coachFeedback.className = "coach-feedback"
      + (state.feedbackText ? " active" : "")
      + (state.feedbackText && state.feedbackTone === "info" ? " info" : "");
  }

  function clearHighlights() {
    document.querySelectorAll(".sim-highlight").forEach((element) => {
      element.classList.remove("sim-highlight");
    });
  }

  /* --------------------------------------------------- coach positioning */

  function positionCoach() {
    const step = currentStep();
    const guidedStep = state.started && !coach.hidden && state.mode === "guided" && step && step.action !== "done";

    if (!guidedStep) {
      hideSpotlight();
      hideConnector();
      dockCoach();
      return;
    }

    const target = step.target ? document.querySelector(step.target) : null;
    const rect = target ? target.getBoundingClientRect() : null;
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hideSpotlight();
      hideConnector();
      dockCoach();
      return;
    }

    drawSpotlight(rect);

    if (window.innerWidth <= 620) {
      dockCoach();
      hideConnector();
      return;
    }

    const cw = coach.offsetWidth;
    const ch = coach.offsetHeight;
    const gap = 20;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const candidates = {
      right: { left: rect.right + gap, top: clamp(rect.top + rect.height / 2 - ch / 2, margin, vh - ch - margin) },
      left: { left: rect.left - gap - cw, top: clamp(rect.top + rect.height / 2 - ch / 2, margin, vh - ch - margin) },
      below: { left: clamp(rect.left + rect.width / 2 - cw / 2, margin, vw - cw - margin), top: rect.bottom + gap },
      above: { left: clamp(rect.left + rect.width / 2 - cw / 2, margin, vw - cw - margin), top: rect.top - gap - ch }
    };

    const preferred = step.placement && candidates[step.placement] ? step.placement : "right";
    const order = [preferred, "right", "below", "above", "left"];

    let chosen = null;
    let chosenSide = null;
    for (const side of order) {
      const candidate = candidates[side];
      if (candidate && fitsViewport(candidate, cw, ch, vw, vh, margin)) {
        chosen = candidate;
        chosenSide = side;
        break;
      }
    }

    if (!chosen) {
      dockCoach();
      hideConnector();
      return;
    }

    coach.classList.add("anchored");
    coach.style.left = `${Math.round(chosen.left)}px`;
    coach.style.top = `${Math.round(chosen.top)}px`;
    coach.style.right = "auto";
    coach.style.bottom = "auto";

    drawConnector(rect, chosenSide, coach.getBoundingClientRect());
  }

  function drawSpotlight(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;
    const x = Math.max(0, rect.left - pad);
    const y = Math.max(0, rect.top - pad);
    const w = Math.min(vw - x, rect.width + pad * 2);
    const h = Math.min(vh - y, rect.height + pad * 2);
    const outer = `M0 0 H${vw} V${vh} H0 Z`;
    const inner = roundedRectPath(x, y, w, h, 8);
    spotlight.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    spotlight.setAttribute("width", vw);
    spotlight.setAttribute("height", vh);
    spotlightPath.setAttribute("d", `${outer} ${inner}`);
    spotlight.classList.add("show");
  }

  function hideSpotlight() {
    spotlight.classList.remove("show");
  }

  function roundedRectPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  }

  function drawConnector(rect, side, cardRect) {
    const tcx = rect.left + rect.width / 2;
    const tcy = rect.top + rect.height / 2;
    const ccx = cardRect.left + cardRect.width / 2;
    const ccy = cardRect.top + cardRect.height / 2;

    let dot;
    let anchor;
    if (side === "right") {
      dot = { x: rect.right, y: tcy };
      anchor = { x: cardRect.left, y: ccy };
    } else if (side === "left") {
      dot = { x: rect.left, y: tcy };
      anchor = { x: cardRect.right, y: ccy };
    } else if (side === "below") {
      dot = { x: tcx, y: rect.bottom };
      anchor = { x: ccx, y: cardRect.top };
    } else {
      dot = { x: tcx, y: rect.top };
      anchor = { x: ccx, y: cardRect.bottom };
    }

    const dx = anchor.x - dot.x;
    const dy = anchor.y - dot.y;
    const length = Math.max(0, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    connectorDot.style.left = `${dot.x}px`;
    connectorDot.style.top = `${dot.y}px`;
    connectorLine.style.left = `${dot.x}px`;
    connectorLine.style.top = `${dot.y}px`;
    connectorLine.style.width = `${length}px`;
    connectorLine.style.transform = `rotate(${angle}deg)`;
    connector.classList.add("show");
  }

  function hideConnector() {
    connector.classList.remove("show");
  }

  function fitsViewport(pos, cw, ch, vw, vh, margin) {
    return pos.left >= margin
      && pos.top >= margin
      && pos.left + cw <= vw - margin
      && pos.top + ch <= vh - margin;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function dockCoach() {
    coach.classList.remove("anchored");
    ["left", "top", "right", "bottom"].forEach((prop) => coach.style.removeProperty(prop));
  }

  function scrollIntoViewSafe(element) {
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top >= 64 && rect.bottom <= vh - 64) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      element.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    } catch (_) {
      element.scrollIntoView();
    }
  }

  /* ------------------------------------------------------ focus handling */

  function focusForStep() {
    if (!state.started) return;
    const step = currentStep();

    if (step && step.action === "done") {
      if (!focusEl(document.querySelector("#completionPanel"))) {
        focusEl(coach);
      }
      return;
    }

    if (state.mode === "practice") {
      focusEl(main);
      return;
    }

    // Guided: focus the control to act on, so it works with the keyboard too.
    if (step && step.id === "mark-attendance") {
      if (focusEl(document.querySelector(".attendance-select"))) return;
    }
    if (step && step.target) {
      const target = document.querySelector(step.target);
      if (isFocusable(target)) {
        focusEl(target);
        return;
      }
    }
    focusEl(coach);
  }

  function isFocusable(element) {
    if (!element || element.disabled) return false;
    if (element.offsetParent === null) return false;
    return /^(BUTTON|SELECT|INPUT|TEXTAREA|A)$/.test(element.tagName);
  }

  function focusEl(element) {
    if (element && typeof element.focus === "function") {
      try {
        element.focus({ preventScroll: true });
      } catch (_) {
        element.focus();
      }
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------ helpers */

  function currentStep() {
    return steps[state.currentStepIndex] || steps[steps.length - 1];
  }

  function advanceStep() {
    if (state.currentStepIndex < steps.length - 1) {
      state.currentStepIndex += 1;
    }
  }

  function selectedCourse() {
    return portalData.courses.find((course) => course.id === state.selectedCourseId)
      || portalData.courses.find((course) => course.id === config.courseId)
      || portalData.courses[0];
  }

  function studentById(id) {
    return portalData.students.find((student) => student.id === id);
  }

  function niceName(student) {
    if (!student) return "";
    const parts = student.name.split(", ");
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : student.name;
  }

  function formatSelectedDate() {
    return state.selectedDate === config.meetingDateISO ? config.meetingDateLabel : "Not Selected";
  }

  function meetingWeekday() {
    const iso = config.meetingDateISO || "";
    const parts = iso.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return "scheduled";
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    try {
      return date.toLocaleDateString(undefined, { weekday: "long" });
    } catch (_) {
      return "scheduled";
    }
  }

  function fill(text) {
    if (text == null) return "";
    return String(text)
      .replaceAll("{TERM}", config.termLabel || "")
      .replaceAll("{COURSE}", `${config.courseTitle || ""} (${config.courseSection || ""})`)
      .replaceAll("{DATE}", config.meetingDateLabel || "")
      .replaceAll("{TARGETS}", targetsSentence());
  }

  function pageHeading(text) {
    return `
      <header class="page-heading">
        <h1>${text}</h1>
        <div class="purple-rule" aria-hidden="true"></div>
      </header>
    `;
  }

  function detailPair(label, value) {
    return `
      <div class="detail-pair">
        <strong>${label}</strong>
        <span>${value}</span>
      </div>
    `;
  }

  /* ----------------------------------------------------------- calendar */

  function renderJuneCalendar() {
    return `
      <table class="month-table" aria-label="June 2026 attendance calendar">
        <caption>June 2026</caption>
        <thead><tr>${dayHeaders()}</tr></thead>
        <tbody>
          <tr>
            ${mutedDay("31")}${plainDay("1")}${plainDay("2")}${attendanceDay("3", "2026-06-03", "state-requires", true)}${plainDay("4")}${plainDay("5")}${plainDay("6")}
          </tr>
          <tr>
            ${plainDay("7")}${plainDay("8")}${plainDay("9")}${attendanceDay("10", "2026-06-10", "state-requires", true)}${plainDay("11")}${plainDay("12")}${plainDay("13")}
          </tr>
          <tr>
            ${plainDay("14")}${plainDay("15")}${plainDay("16")}${attendanceDay("17", "2026-06-17", "state-requires", true)}${plainDay("18")}${plainDay("19")}${plainDay("20")}
          </tr>
          <tr>
            ${plainDay("21")}${plainDay("22")}${plainDay("23")}${plainDay("24", "state-scheduled")}${plainDay("25")}${plainDay("26")}${plainDay("27")}
          </tr>
          <tr>
            ${plainDay("28")}${plainDay("29")}${plainDay("30")}${mutedDay("1")}${mutedDay("2")}${mutedDay("3", "state-holiday")}${mutedDay("4")}
          </tr>
          <tr>
            ${mutedDay("5")}${mutedDay("6")}${mutedDay("7")}${mutedDay("8")}${mutedDay("9")}${mutedDay("10")}${mutedDay("11")}
          </tr>
        </tbody>
      </table>
    `;
  }

  function renderJulyCalendar() {
    return `
      <table class="month-table" aria-label="July 2026 attendance calendar">
        <caption>July 2026</caption>
        <thead><tr>${dayHeaders()}</tr></thead>
        <tbody>
          <tr>
            ${mutedDay("28")}${mutedDay("29")}${mutedDay("30")}${plainDay("1", "state-scheduled")}${plainDay("2")}${plainDay("3", "state-holiday")}${plainDay("4")}
          </tr>
          <tr>
            ${plainDay("5")}${plainDay("6")}${plainDay("7")}${plainDay("8", "state-scheduled")}${plainDay("9")}${plainDay("10")}${plainDay("11")}
          </tr>
          <tr>
            ${plainDay("12")}${plainDay("13")}${plainDay("14")}${plainDay("15", "state-scheduled")}${plainDay("16")}${plainDay("17")}${plainDay("18")}
          </tr>
          <tr>
            ${plainDay("19")}${plainDay("20")}${plainDay("21")}${plainDay("22", "state-scheduled")}${plainDay("23")}${plainDay("24")}${plainDay("25")}
          </tr>
          <tr>
            ${plainDay("26")}${plainDay("27")}${plainDay("28")}${plainDay("29", "state-scheduled")}${plainDay("30")}${plainDay("31")}${mutedDay("1")}
          </tr>
          <tr>
            ${mutedDay("2")}${mutedDay("3")}${mutedDay("4")}${mutedDay("5")}${mutedDay("6")}${mutedDay("7")}${mutedDay("8")}
          </tr>
        </tbody>
      </table>
    `;
  }

  function dayHeaders() {
    return ["S", "M", "T", "W", "T", "F", "S"].map((day) => `<th scope="col">${day}</th>`).join("");
  }

  function attendanceDay(label, date, className, clickable) {
    if (!clickable) return plainDay(label, className);
    const stateLabel = className === "state-requires" ? ", attendance needs posting" : "";
    return `
      <td class="${className}">
        <button class="date-cell linklike" type="button" data-attendance-date="${date}" aria-label="June ${label}, 2026${stateLabel}">${label}</button>
      </td>
    `;
  }

  function plainDay(label, className) {
    return `<td class="${className || ""}"><span>${label}</span></td>`;
  }

  function mutedDay(label, className) {
    return `<td class="muted-date ${className || ""}"><span>${label}</span></td>`;
  }

  function renderLegend() {
    return `
      <ul class="legend" aria-label="Attendance calendar legend">
        <li><span class="swatch state-posted"></span> Attendance Posted</li>
        <li><span class="swatch state-requires"></span> Requires Posting</li>
        <li><span class="swatch state-scheduled"></span> Scheduled</li>
        <li><span class="swatch state-holiday"></span> Holiday</li>
        <li><span class="swatch state-cancelled"></span> Cancelled</li>
      </ul>
    `;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function nowStamp() {
    const date = new Date();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${mm}/${dd}/${date.getFullYear()} ${hours}:${minutes} ${ampm}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  init();
})();
