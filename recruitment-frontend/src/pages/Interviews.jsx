import React, { useEffect, useState } from "react";
import { Stack, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import api from "../api";
import { getResource } from "../dataSource";
import { Field, PageState, showDate } from "../components/Ui";
import DataTable, { StatusChip } from "../components/DataTable";

const blank = {
  application: "",
  round: 1,
  roundName: "Technical",
  interviewType: "TECHNICAL",
  mode: "ONLINE",
  scheduledAt: "",
  durationMinutes: 60,
  meetingLink: "",
  location: "",
  panelText: "",
};

export default function Interviews({ user }) {
  const isInterviewer = user?.role === "INTERVIEWER";
  const canSchedule = !user || ["OPERATIONS_ANALYST", "SYSTEM_ADMIN"].includes(user.role);
  const [rows, setRows] = useState([]);
  const [apps, setApps] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [sel, setSel] = useState(null);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState("PASS");
  const [notes, setNotes] = useState("");
  const [reschedule, setReschedule] = useState({ scheduledAt: "", reason: "" });

  const load = async () => {
    setLoading(true);
    try {
      const i = await getResource("/interviews");
      setRows(i.data.data || []);
      if (isInterviewer) {
        setApps([]);
        setInterviewers([]);
      } else {
        const [a, panel] = await Promise.all([
          getResource("/applications"),
          getResource("/interviewers"),
        ]);
        setApps((a.data.data || []).filter((x) => ["SHORTLISTED", "INTERVIEW"].includes(x.status)));
        setInterviewers(panel.data.data || []);
      }
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isInterviewer]);

  const create = async () => {
    try {
      const panel = (form.panelText || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((interviewerId) => ({ interviewerId, interviewerName: interviewerId }));

      const data = {
        ...form,
        round: Number(form.round),
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        panel,
      };
      delete data.panelText;

      await api.post("/interviews", data);
      setOpen(false);
      setNotice("Interview scheduled");
      setForm(blank);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const action = async (path, body = {}) => {
    try {
      await api.patch(`/interviews/${sel._id}/${path}`, body);
      setNotice("Interview updated");
      setSel(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Stack spacing={2}>
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button startIcon={<Refresh />} onClick={load}>
          Refresh
        </Button>
        {canSchedule && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Schedule interview
          </Button>
        )}
      </Stack>

      <PageState loading={loading} error={error}>
        <DataTable
          columns={[
            {
              key: "application",
              label: "Application",
              render: (r) => r.application?.candidate?.email || r.application?._id || "—",
            },
            { key: "round", label: "Round" },
            { key: "roundName", label: "Round name" },
            { key: "scheduledAt", label: "Scheduled", render: (r) => showDate(r.scheduledAt) },
            { key: "status", label: "Status", render: (r) => <StatusChip value={r.status} /> },
            { key: "result", label: "Result", render: (r) => <StatusChip value={r.result} /> },
          ]}
          rows={rows}
          onView={setSel}
        />
      </PageState>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Schedule interview</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <Field
                label="Application"
                value={form.application}
                onChange={(v) => setForm({ ...form, application: v })}
                options={apps.map((a) => ({
                  value: a._id,
                  label: `${a.candidate?.email || a._id} — ${a.requisition?.title || ""}`,
                }))}
              />
            </Grid>

            {[
              ["round", "Round"],
              ["roundName", "Round name"],
              ["scheduledAt", "Date & time"],
              ["durationMinutes", "Duration (minutes)"],
              ["meetingLink", "Meeting link"],
              ["location", "Location"],
              ["panelText", "Interviewer IDs (comma separated)"],
            ].map(([k, l]) => (
              <Grid item xs={12} sm={6} key={k}>
                <Field
                  label={l}
                  value={form[k] || ""}
                  onChange={(v) => setForm({ ...form, [k]: v })}
                  type={k === "scheduledAt" ? "datetime-local" : k === "round" || k === "durationMinutes" ? "number" : "text"}
                  helperText={k === "panelText" ? `Use active interviewer IDs: ${interviewers.slice(0, 8).map((item) => item.interviewerId).join(", ") || "none available"}` : undefined}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Field
                label="Interview type"
                value={form.interviewType}
                onChange={(v) => setForm({ ...form, interviewType: v })}
                options={["TECHNICAL", "HR", "MANAGERIAL", "SCREENING", "OTHER"].map((x) => ({ value: x, label: x }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Field
                label="Mode"
                value={form.mode}
                onChange={(v) => setForm({ ...form, mode: v })}
                options={[
                  { value: "ONLINE", label: "Online" },
                  { value: "ONSITE", label: "Onsite" },
                ]}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create}>Schedule</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!sel} onClose={() => setSel(null)}>
        <DialogTitle>Interview actions</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Alert severity="info">
              {sel?.status} · {showDate(sel?.scheduledAt)}
            </Alert>
            {["SCHEDULED", "RESCHEDULED"].includes(sel?.status) && (
              <>
                <Field
                  label="Interview result"
                  value={result}
                  onChange={setResult}
                  options={["PASS", "FAIL", "ON_HOLD"].map((value) => ({ value, label: value.replaceAll("_", " ") }))}
                />
                <Field label="Completion notes" value={notes} onChange={setNotes} multiline />
                <Button onClick={() => action("complete", { result, notes })}>Mark completed</Button>
                {!isInterviewer && (
                  <>
                    <Field
                      label="New date and time"
                      type="datetime-local"
                      value={reschedule.scheduledAt}
                      onChange={(value) => setReschedule({ ...reschedule, scheduledAt: value })}
                    />
                    <Field
                      label="Reschedule reason"
                      value={reschedule.reason}
                      onChange={(value) => setReschedule({ ...reschedule, reason: value })}
                    />
                    <Button
                      disabled={!reschedule.scheduledAt || reschedule.reason.trim().length < 2}
                      onClick={() => action("reschedule", {
                        scheduledAt: new Date(reschedule.scheduledAt).toISOString(),
                        reason: reschedule.reason,
                      })}
                    >
                      Reschedule
                    </Button>
                  </>
                )}
              </>
            )}
            {!isInterviewer && ["SCHEDULED", "RESCHEDULED"].includes(sel?.status) && <Button color="error" onClick={() => action("cancel", { reason: "Cancelled from frontend" })}>
              Cancel interview
            </Button>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSel(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
