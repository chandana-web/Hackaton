import React, { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import api from "../api";
import { Field, PageState, showDate } from "../components/Ui";
import DataTable from "../components/DataTable";

const localInputValue = (date) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
};
const defaultStart = localInputValue(new Date(Date.now() + 60 * 60 * 1000));
const defaultEnd = localInputValue(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
const emptyForm = {
  interviewerId: "",
  firstName: "",
  lastName: "",
  email: "",
  skills: "",
  startTime: defaultStart,
  endTime: defaultEnd,
};

export default function Interviewers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/interviewers");
      setRows(response.data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setError("");
    try {
      await api.post("/interviewers", {
        interviewerId: form.interviewerId.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        availability: [{
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }],
      });
      setOpen(false);
      setForm(emptyForm);
      setNotice("Interviewer created");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <Stack spacing={2}>
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add interviewer
        </Button>
      </Stack>
      <PageState loading={loading} error={error}>
        <DataTable
          columns={[
            { key: "interviewerId", label: "Interviewer ID" },
            { key: "name", label: "Name", render: (row) => `${row.firstName} ${row.lastName}` },
            { key: "email", label: "Email" },
            { key: "availability", label: "Availability", render: (row) => row.availability?.[0] ? `${showDate(row.availability[0].startTime)} – ${showDate(row.availability[0].endTime)}` : "—" },
          ]}
          rows={rows}
        />
      </PageState>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add interviewer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">Availability must include the interview date. You can add another record if availability changes.</Alert>
            <Field label="Interviewer ID" value={form.interviewerId} onChange={(value) => setForm({ ...form, interviewerId: value })} required />
            <Field label="First name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required />
            <Field label="Last name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field label="Skills (comma separated)" value={form.skills} onChange={(value) => setForm({ ...form, skills: value })} />
            <Field label="Availability start" type="datetime-local" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} required />
            <Field label="Availability end" type="datetime-local" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} required />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={create}
            disabled={!form.interviewerId || !form.firstName || !form.lastName || !form.email || !form.startTime || !form.endTime || new Date(form.endTime) <= new Date(form.startTime)}
          >
            Create interviewer
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
