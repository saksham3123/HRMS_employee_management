import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AttendanceActions from "../attendance/AttendanceActions";
import { getTodayAttendance } from "../../services/attendanceService";
import { getTodayAttendanceForAdmin } from "../../services/adminService";
import managerService from "../../services/managerServices";
import { apiRequest } from "../../services/api";
import { canAccessModule, findModule } from "./dashboardModules";
import { hoursWorked, useNow } from "../../utils/workTime";
import { companyPath } from "../../utils/companyPath";

// The overview opens on each person's real work for today. Every panel is
// gated by the same access rules as its module, loads on its own, and fails
// on its own, so one slow or broken request never blanks the page.

const leaveList = (data) =>
  Array.isArray(data) ? data : data?.leaveRequests ?? data?.requests ?? [];

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Leave dates are stored as UTC-midnight calendar dates.
const formatLeaveDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      })
    : "—";

const leaveDates = (request) => {
  const start = formatLeaveDate(request.start_date);
  const end = formatLeaveDate(request.end_date);
  return start === end ? start : `${start} – ${end}`;
};

// Today's calendar date in the viewer's timezone, as YYYY-MM-DD.
const todayKey = () => new Date().toLocaleDateString("en-CA");

const isOnLeaveToday = (request, today) =>
  request.status === "approved" &&
  request.start_date?.slice(0, 10) <= today &&
  request.end_date?.slice(0, 10) >= today;

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function useOverviewData(load, enabled) {
  const [state, setState] = useState({ loading: enabled, error: "", data: null });

  // State is only set once the request settles, never synchronously.
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await load();
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState({ loading: false, error: error.message || "Couldn't load this.", data: null });
    }
  }, [load, enabled]);

  useEffect(() => {
    // fetchData only sets state after the request settles; the rule can't
    // see past the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // "Try again" shows the loading state first; clocking in or out refreshes
  // quietly so the panel doesn't flicker.
  const retry = () => {
    setState((previous) => ({ ...previous, loading: true }));
    fetchData();
  };

  return { ...state, refresh: fetchData, retry };
}

const loadMyAttendance = async () => (await getTodayAttendance()).attendance ?? null;
const loadAllLeave = async () => leaveList(await apiRequest("/leave"));
const loadTeamLeave = async () => leaveList(await apiRequest("/leave/team"));
const loadMyLeave = async () => leaveList(await apiRequest("/leave/mine"));
const loadOrgAttendance = async () =>
  (await getTodayAttendanceForAdmin()).attendance ?? [];
const loadTeam = async () => (await managerService.getMyTeam()).team ?? [];

export default function DashboardOverview({ user, hasPermission }) {
  const can = (key) => canAccessModule(findModule(key), user, hasPermission);
  const canClock = can("myAttendance") && hasPermission("attendance.clock");
  const reviewsAll = hasPermission("leave.manage");
  const reviewsTeam = !reviewsAll && hasPermission("leave.approve.team");
  const appliesForLeave = user?.role !== "admin" && hasPermission("leave.apply");

  const myAttendance = useOverviewData(loadMyAttendance, can("myAttendance"));
  const reviewLeave = useOverviewData(
    reviewsAll ? loadAllLeave : loadTeamLeave,
    reviewsAll || reviewsTeam
  );
  const myLeave = useOverviewData(loadMyLeave, appliesForLeave);
  const orgAttendance = useOverviewData(loadOrgAttendance, can("attendance"));
  const team = useOverviewData(loadTeam, can("team"));

  const today = todayKey();
  const firstName = user?.name?.split(" ")[0];
  const organizationName = user?.organization?.name;

  return (
    <>
      <div className="dashq-page-heading">
        <div>
          <h1>Good to see you{firstName ? `, ${firstName}` : ""}</h1>
          <p>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {organizationName && ` · ${organizationName}`}
          </p>
        </div>
      </div>

      <div className="dashq-overview-grid">
        {can("myAttendance") && (
          <OverviewPanel
            title="Your day"
            link={{ to: companyPath(user, "/dashboard/myAttendance"), label: "Attendance history" }}
            state={myAttendance}
          >
            <ClockState attendance={myAttendance.data} />
            {canClock && (
              <div className="dashq-overview-actions">
                <AttendanceActions
                  variant="inline"
                  attendance={myAttendance.data}
                  onAttendanceUpdated={myAttendance.refresh}
                />
              </div>
            )}
          </OverviewPanel>
        )}

        {(reviewsAll || reviewsTeam) && (
          <OverviewPanel
            title={reviewsAll ? "Leave requests" : "Your team's leave requests"}
            link={{ to: companyPath(user, "/dashboard/leaves"), label: "Review leave" }}
            state={reviewLeave}
          >
            {reviewLeave.data && (
              <PendingLeave
                // Only requests still waiting on this person's own decision.
                requests={reviewLeave.data.filter((request) => request.my_step)}
              />
            )}
          </OverviewPanel>
        )}

        {can("attendance") && (
          <OverviewPanel
            title={organizationName ? `Today at ${organizationName}` : "Today across the organization"}
            link={{ to: companyPath(user, "/dashboard/attendance"), label: "Today's attendance" }}
            state={orgAttendance}
          >
            {orgAttendance.data && (
              <dl className="dashq-facts">
                <Fact
                  label="Working now"
                  value={orgAttendance.data.filter((r) => r.login_time && !r.logout_time).length}
                />
                <Fact
                  label="Finished for the day"
                  value={orgAttendance.data.filter((r) => r.login_time && r.logout_time).length}
                />
                {reviewsAll && reviewLeave.data && (
                  <Fact
                    label="On approved leave"
                    value={reviewLeave.data.filter((r) => isOnLeaveToday(r, today)).length}
                  />
                )}
              </dl>
            )}
          </OverviewPanel>
        )}

        {can("team") && (
          <OverviewPanel
            title="Your team today"
            link={{ to: companyPath(user, "/dashboard/team"), label: "My team" }}
            state={team}
          >
            {team.data && (
              <TeamToday
                team={team.data}
                onLeave={(reviewLeave.data ?? []).filter((r) => isOnLeaveToday(r, today))}
              />
            )}
          </OverviewPanel>
        )}

        {appliesForLeave && (
          <OverviewPanel
            title="Your leave"
            link={{ to: companyPath(user, "/dashboard/leaves"), label: "Apply or see all" }}
            state={myLeave}
          >
            {myLeave.data && <MyLeave requests={myLeave.data} />}
          </OverviewPanel>
        )}
      </div>
    </>
  );
}

function OverviewPanel({ title, link, state, children }) {
  return (
    <section className="dashq-content-panel dashq-overview-panel" aria-label={title}>
      <div className="dashq-overview-panel-heading">
        <h2>{title}</h2>
        {link && (
          <Link to={link.to} className="dashq-text-link">
            {link.label} <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        )}
      </div>
      {state.loading ? (
        <p className="dashq-overview-muted">Loading…</p>
      ) : state.error ? (
        <div role="alert" className="dashq-overview-error">
          <p>{state.error}</p>
          <button type="button" className="dashq-text-link" onClick={state.retry}>
            Try again
          </button>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function Fact({ label, value }) {
  return (
    <div className="dashq-fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ClockState({ attendance }) {
  const now = useNow();
  const login = attendance?.login_time;
  const logout = attendance?.logout_time;

  if (!login) {
    return <p className="dashq-overview-lead">You haven't clocked in today.</p>;
  }

  if (!logout) {
    return (
      <p className="dashq-overview-lead">
        Working since <strong>{formatTime(login)}</strong>,{" "}
        {hoursWorked(attendance, now).toFixed(2)} hrs so far
      </p>
    );
  }

  return (
    <p className="dashq-overview-lead">
      Done for the day: <strong>{formatTime(login)} – {formatTime(logout)}</strong>,{" "}
      {Number(attendance.working_hours ?? 0).toFixed(2)} hrs
    </p>
  );
}

function PendingLeave({ requests }) {
  if (requests.length === 0) {
    return <p className="dashq-overview-lead">Nothing is waiting for you.</p>;
  }

  return (
    <>
      <p className="dashq-overview-lead">
        <strong>{plural(requests.length, "request", "requests")}</strong> waiting for your decision
      </p>
      <ul className="dashq-overview-list">
        {requests.slice(0, 4).map((request) => (
          <li key={request.id}>
            <span className="dashq-overview-name">{request.employee_name}</span>
            <span>
              {request.leave_type} · {leaveDates(request)}
            </span>
          </li>
        ))}
      </ul>
      {requests.length > 4 && (
        <p className="dashq-overview-muted">and {requests.length - 4} more</p>
      )}
    </>
  );
}

function TeamToday({ team, onLeave }) {
  if (team.length === 0) {
    return (
      <p className="dashq-overview-lead">
        No one reports to you yet. HR or your admin sets up reporting lines.
      </p>
    );
  }

  return (
    <>
      <p className="dashq-overview-lead">
        <strong>{plural(team.length, "direct report", "direct reports")}</strong>
        {onLeave.length === 0
          ? ", none on leave today"
          : `, ${onLeave.length} on leave today`}
      </p>
      {onLeave.length > 0 && (
        <ul className="dashq-overview-list">
          {onLeave.map((request) => (
            <li key={request.id}>
              <span className="dashq-overview-name">{request.employee_name}</span>
              <span>
                {request.leave_type} · until {formatLeaveDate(request.end_date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function MyLeave({ requests }) {
  if (requests.length === 0) {
    return <p className="dashq-overview-lead">You haven't requested any leave yet.</p>;
  }

  const pending = requests.filter((request) => request.status === "pending").length;

  return (
    <>
      <p className="dashq-overview-lead">
        {pending === 0
          ? "No requests waiting for review."
          : <><strong>{plural(pending, "request", "requests")}</strong> waiting for review</>}
      </p>
      <ul className="dashq-overview-list">
        {requests.slice(0, 3).map((request) => (
          <li key={request.id}>
            <span className="dashq-overview-name">
              {request.leave_type} · {leaveDates(request)}
            </span>
            <span className={`dashq-leave-status is-${request.status}`}>{request.status}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
