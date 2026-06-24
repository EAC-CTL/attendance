/*
  Scenario configuration, the single source of truth for this practice run.

  Want to reuse this shell for a different Faculty Portal attendance entry?
  Change the values below and the matching student data in app.js. Targets are
  keyed by student id, so renaming a student never breaks the check that
  decides when the roster is ready to post.
*/
window.attendanceSimulationConfig = {
  termId: "2026SU",
  termLabel: "Summer 2026",
  courseId: "ART161-U2045",
  courseTitle: "Beginning Ceramics I",
  courseSection: "U2045",
  meetingDateISO: "2026-06-03",
  meetingDateLabel: "06/03/2026",
  // Who differs from Present, and how. Everyone else stays Present.
  targets: [
    { studentId: "901317", display: "Susan Wood-Belate", status: "Absent" },
    { studentId: "901649", display: "Kevin Peckmark", status: "Excused" }
  ]
};

/*
  Practice steps.

  Each step names the expected action, the UI target to highlight (guided
  mode), and the learner-facing copy. Placeholders {TERM} {COURSE} {DATE}
  {TARGETS} are filled from the config above so the wording can never drift
  out of sync with the scenario. App-specific validation lives in app.js.
*/
(function () {
  var C = window.attendanceSimulationConfig;

  window.attendanceSimulationSteps = [
    {
      id: "open-faculty-portal",
      target: "#facultyPortalCard",
      action: "open-faculty-portal",
      placement: "below",
      title: "Open the Faculty Portal",
      body: "The Faculty Portal is the Self-Service side, where you manage your classes, grades, and attendance. Choose Faculty Portal Homepage. (The student portal is a separate login.)",
      success: "You're in the Faculty Portal.",
      wrong: "Choose Faculty Portal Homepage. The student portal and course schedule are separate."
    },
    {
      id: "signin-next",
      target: "#signInNext",
      action: "signin-next",
      placement: "right",
      title: "Sign in",
      body: "Normally you sign in with your EAC account. Here it is filled in for you, so just select Next. This practice version never asks for a password, and nothing is saved.",
      success: "Signed in.",
      wrong: "Select Next to continue into the portal."
    },
    {
      id: "expand-my-classes",
      target: "#navMyClasses",
      action: "expand-my-classes",
      placement: "right",
      title: "Open My Classes",
      body: "My Classes holds your Gradebook, Class Schedule, and roster tools. Open it from the left menu to reach the Gradebook.",
      success: "My Classes is open.",
      wrong: "Open My Classes in the left menu first."
    },
    {
      id: "open-gradebook",
      target: "#gradebookLink",
      action: "open-gradebook",
      placement: "right",
      title: "Open the Gradebook",
      body: "You post attendance and enter grades from the Gradebook. Open it to see your course list.",
      success: "Gradebook open.",
      wrong: "Choose Gradebook inside the My Classes menu."
    },
    {
      id: "select-term",
      target: "#termSelect",
      action: "select-term",
      placement: "below",
      title: "Set the term first",
      body: "The list opens on your most recent classes, which can be a future term. Set View Course List for Term to {TERM} so the right sections load. It shows the courses you teach as primary instructor.",
      success: "{TERM} courses loaded.",
      wrong: "Set the term to {TERM} before picking a class."
    },
    {
      id: "choose-course",
      target: "[data-course-id='" + C.courseId + "']",
      action: "choose-course",
      placement: "below",
      title: "Open your class",
      body: "Each row is a section you teach. Open {COURSE} to see its Course Details and the attendance calendar.",
      success: "Class opened.",
      wrong: "Open {COURSE} from the {TERM} course list."
    },
    {
      id: "choose-date",
      target: "[data-attendance-date='" + C.meetingDateISO + "']",
      action: "choose-date",
      placement: "above",
      title: "Pick the meeting that needs attendance",
      body: "On the Attendance tab, the calendar marks every class meeting. Orange means attendance still needs posting; green means it is already done. Open Wednesday, {DATE}.",
      success: "{DATE} opened.",
      wrong: "Open the orange date, Wednesday {DATE}, on the calendar."
    },
    {
      id: "click-edit",
      target: "#editAttendanceButton",
      action: "click-edit",
      placement: "above",
      title: "Make the roster editable",
      body: "The roster opens read only, with a Status, Time Present, Course Absent, Excused, and Reason column per student. Check the Class Meeting Date reads {DATE}, then select Edit.",
      success: "The roster is editable.",
      wrong: "Select Edit once you have checked the meeting date."
    },
    {
      id: "mark-attendance",
      target: "#attendanceTable",
      action: "mark-attendance",
      placement: "above",
      title: "Mark the roster",
      body: "Everyone starts Present for the full class. Change only the students who differ: {TARGETS}. You can add a Reason in that row if your campus requires one.",
      success: "Roster's ready to post.",
      wrong: "Change only the exceptions: {TARGETS}."
    },
    {
      id: "update-attendance",
      target: "#updateAttendanceButton",
      action: "update-attendance",
      placement: "above",
      title: "Post it",
      body: "Select Update to post attendance for {DATE}. Nothing saves until you do. Posting updates the student record right away, and the date turns green on the calendar.",
      success: "Attendance posted.",
      wrong: "Select Update once the roster is right."
    },
    {
      id: "complete",
      target: "#completionPanel",
      action: "done",
      placement: "above",
      title: "Done, attendance is posted",
      body: "The roster shows the posted values, Course Details lists {DATE} as the last posted attendance, and the calendar date is now green. Repeat for any other meeting that is still orange. (The portal needs all attendance posted before you can submit final grades.)",
      success: "",
      wrong: ""
    }
  ];
})();
