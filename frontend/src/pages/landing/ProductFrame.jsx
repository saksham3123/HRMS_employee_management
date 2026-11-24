import { useState } from "react";

// The landing page's product picture: PeopleDesk's overview as each role
// sees it, rebuilt in code with sample data (labelled on the frame).

const ROLES = [
  { key: "employee", label: "Employee" },
  { key: "manager", label: "Manager" },
  { key: "hr", label: "HR" },
  { key: "admin", label: "Admin" },
];

const NAV = {
  employee: ["Overview", "Leave", "My Attendance", "My Profile"],
  manager: ["Overview", "My Team", "Leave", "My Attendance", "My Profile"],
  hr: ["Overview", "Employees", "Departments", "Leave", "Attendance", "Payroll"],
  admin: ["Overview", "Employees", "Departments", "Reporting Managers", "Leave", "Attendance", "Payroll"],
};

const PEOPLE = {
  employee: { name: "Ravi Kumar", greeting: "Ravi" },
  manager: { name: "Meera Iyer", greeting: "Meera" },
  hr: { name: "Priya Sharma", greeting: "Priya" },
  admin: { name: "Arjun Mehta", greeting: "Arjun" },
};

function Panel({ title, link, children, wide = false }) {
  return (
    <div className={`pdf-panel ${wide ? "is-wide" : ""}`}>
      <div className="pdf-panel-head">
        <span className="pdf-panel-title">{title}</span>
        {link && <span className="pdf-panel-link">{link} →</span>}
      </div>
      {children}
    </div>
  );
}

function Rows({ rows }) {
  return (
    <ul className="pdf-rows">
      {rows.map(([name, detail, status]) => (
        <li key={name + detail}>
          <span className="pdf-row-name">{name}</span>
          <span className="pdf-row-detail">
            {detail}
            {status && <em className={`pdf-status is-${status.toLowerCase()}`}>{status}</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Facts({ facts }) {
  return (
    <dl className="pdf-facts">
      {facts.map(([label, value, live]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {live && <span className="pdf-live" aria-hidden="true" />}
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function YourDay() {
  return (
    <Panel title="Your day" link="History">
      <p className="pdf-lead">
        Working since <strong>09:12 am</strong>
      </p>
      <div className="pdf-buttons">
        <span className="pdf-btn is-muted">Clock In</span>
        <span className="pdf-btn is-dark">Clock Out</span>
      </div>
    </Panel>
  );
}

function YourLeave() {
  return (
    <Panel title="Your leave" link="Apply">
      <Rows
        rows={[
          ["Annual", "01 – 04 Dec", "Pending"],
          ["Sick", "03 Oct", "Approved"],
        ]}
      />
    </Panel>
  );
}

const VIEWS = {
  employee: () => (
    <>
      <YourDay />
      <YourLeave />
    </>
  ),
  manager: () => (
    <>
      <Panel title="Your team's leave requests" link="Review" wide>
        <p className="pdf-lead">
          <strong>3 requests</strong> waiting for you
        </p>
        <Rows
          rows={[
            ["Anita Desai", "Sick · Today"],
            ["Karthik Rao", "Personal · 28 Nov"],
            ["Ravi Kumar", "Annual · 01 – 04 Dec"],
          ]}
        />
        <div className="pdf-buttons">
          <span className="pdf-btn is-green">Approve</span>
          <span className="pdf-btn is-line">Reject</span>
        </div>
      </Panel>
      <Panel title="Your team today" link="My team">
        <p className="pdf-lead">
          <strong>6 direct reports</strong>, 1 on leave
        </p>
      </Panel>
      <YourDay />
    </>
  ),
  hr: () => (
    <>
      <Panel title="Today at Northwind" link="Attendance" wide>
        <Facts
          facts={[
            ["Working now", "42", true],
            ["Finished", "5"],
            ["On approved leave", "3"],
          ]}
        />
      </Panel>
      <Panel title="Leave requests" link="Review" wide>
        <p className="pdf-lead">
          <strong>7 requests</strong> waiting for a decision
        </p>
        <Rows
          rows={[
            ["Anita Desai", "Sick · Today"],
            ["Sana Khan", "Annual · 08 – 12 Dec"],
            ["Dev Malhotra", "Personal · 15 Dec"],
          ]}
        />
      </Panel>
    </>
  ),
  admin: () => (
    <>
      <Panel title="Today at Northwind" link="Attendance" wide>
        <Facts
          facts={[
            ["Working now", "42", true],
            ["Active employees", "57"],
            ["Departments", "6"],
          ]}
        />
      </Panel>
      <Panel title="Payroll · November" link="Payroll">
        <Facts
          facts={[
            ["Total pay", "₹4,82,300"],
            ["Hours worked", "1,214"],
          ]}
        />
      </Panel>
      <Panel title="Reporting lines" link="Managers">
        <Rows
          rows={[
            ["Meera Iyer", "6 reports"],
            ["Rohan Gupta", "4 reports"],
          ]}
        />
      </Panel>
    </>
  ),
};

export default function ProductFrame() {
  const [role, setRole] = useState("employee");
  const View = VIEWS[role];
  const person = PEOPLE[role];

  return (
    <figure className="pd-frame-wrap" aria-labelledby="pd-frame-caption">
      <div className="pd-viewas" role="group" aria-label="View PeopleDesk as">
        <span className="pd-viewas-label">View as</span>
        {ROLES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={role === option.key}
            onClick={() => setRole(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="pd-frame-stage">
        <div className="pd-frame" aria-hidden="true">
          <aside className="pdf-side">
            <span className="pdf-brand">PeopleDesk</span>
            <span className="pdf-org">Northwind Traders</span>
            <ul>
              {NAV[role].map((item, index) => (
                <li key={item} className={index === 0 ? "is-active" : undefined}>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
          <div className="pdf-main">
            <div className="pdf-top">
              <span>Northwind Traders</span>
              <span className="pdf-avatar">{person.name[0]}</span>
            </div>
            <div className="pdf-body" key={role}>
              <p className="pdf-hello">Good to see you, {person.greeting}</p>
              <div className="pdf-grid">
                <View />
              </div>
            </div>
          </div>
        </div>
      </div>

      <figcaption id="pd-frame-caption" className="pd-frame-caption">
        The overview each role opens on. Sample company and data.
      </figcaption>
    </figure>
  );
}
