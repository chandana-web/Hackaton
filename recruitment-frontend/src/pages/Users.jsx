import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import api from "../api";
import { Field, PageState } from "../components/Ui";
import DataTable, { StatusChip } from "../components/DataTable";

const roles = [
  "BUSINESS_REQUESTER",
  "PROCESS_OWNER",
  "APPROVER",
  "OPERATIONS_ANALYST",
  "INTERVIEWER",
  "CANDIDATE",
  "SYSTEM_ADMIN",
];
const emptyForm = { name: "", email: "", password: "", role: "OPERATIONS_ANALYST", interviewerId: "" };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [response, interviewerResponse] = await Promise.all([
        api.get("/auth/users"),
        api.get("/interviewers"),
      ]);
      setRows(response.data.data || []);
      setInterviewers(interviewerResponse.data.data || []);
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
      const payload = { ...form };
      if (payload.role !== "INTERVIEWER") delete payload.interviewerId;
      await api.post("/auth/users", payload);
      setForm(emptyForm);
      setOpen(false);
      setNotice("User created");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Create accounts here and assign their workflow roles. To approve a requisition, create an account with the Approver role, then sign out and sign in with that account. Public self-registration is disabled so users cannot assign privileged roles to themselves.
      </Alert>
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add user
        </Button>
      </Stack>
      <PageState loading={loading} error={error}>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (row) => <StatusChip value={row.role} /> },
            { key: "interviewerId", label: "Interviewer profile" },
            { key: "createdAt", label: "Created", render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
          ]}
          rows={rows}
        />
      </PageState>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field
              label="Temporary password"
              type="password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              helperText="At least 12 characters. Share this temporary credential securely."
              required
            />
            <Field
              label="Role"
              value={form.role}
              onChange={(value) => setForm({ ...form, role: value, interviewerId: "" })}
              options={roles.map((role) => ({ value: role, label: role.replaceAll("_", " ") }))}
              required
            />
            {form.role === "INTERVIEWER" && (
              <Field
                label="Interviewer profile"
                value={form.interviewerId}
                onChange={(value) => setForm({ ...form, interviewerId: value })}
                options={interviewers.map((interviewer) => ({
                  value: interviewer.interviewerId,
                  label: `${interviewer.firstName} ${interviewer.lastName} · ${interviewer.interviewerId}`,
                }))}
                required
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create} disabled={!form.name || !form.email || form.password.length < 12 || (form.role === "INTERVIEWER" && !form.interviewerId)}>
            Create account
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
