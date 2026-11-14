import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import api from "../api";
import { getResource } from "../dataSource";
import { Field, PageState } from "../components/Ui";
import DataTable, { StatusChip } from "../components/DataTable";

const initialForm = {
  title: "",
  department: "",
  location: "",
  employmentType: "FULL_TIME",
  experienceMin: 0,
  experienceMax: 3,
  salaryMin: 0,
  salaryMax: 0,
  openings: 1,
  description: "",
  skills: [],
  hiringManager: "",
};

export default function Requisitions({ user }) {
  const canRequest = !user || ["BUSINESS_REQUESTER", "PROCESS_OWNER", "SYSTEM_ADMIN"].includes(user.role);
  const canApprove = !user || ["APPROVER", "SYSTEM_ADMIN"].includes(user.role);
  const canManageLifecycle = !user || ["PROCESS_OWNER", "SYSTEM_ADMIN"].includes(user.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getResource("/requisitions");
      setRows(response.data.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setFormError("");
    const skills = typeof form.skills === "string"
      ? form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : form.skills;
    const issues = [];

    if (!form.title.trim() || form.title.trim().length < 2) issues.push("Enter a job title with at least 2 characters.");
    if (!form.department.trim() || form.department.trim().length < 2) issues.push("Enter a department.");
    if (!form.location.trim() || form.location.trim().length < 2) issues.push("Enter a location.");
    if (!form.hiringManager.trim() || form.hiringManager.trim().length < 2) issues.push("Enter a hiring manager.");
    if (!form.description.trim() || form.description.trim().length < 10) issues.push("Description must be at least 10 characters.");
    if (Number(form.experienceMax) < Number(form.experienceMin)) issues.push("Maximum experience must be greater than or equal to minimum experience.");
    if (Number(form.salaryMax) < Number(form.salaryMin)) issues.push("Maximum salary must be greater than or equal to minimum salary.");
    if (Number(form.experienceMin) === 0 && !skills.length) issues.push("Add at least one required skill when minimum experience is zero.");

    if (issues.length) {
      setFormError(issues.join(" "));
      return;
    }

    try {
      const payload = { ...form, skills };
      if (editing) await api.patch(`/requisitions/${form._id}`, payload);
      else await api.post("/requisitions", payload);
      setFormOpen(false);
      setEditing(false);
      setNotice(editing ? "Requisition updated" : "Requisition created");
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const runAction = async (requisition, action) => {
    try {
      const body = action === "reject" ? { remarks: "Rejected from frontend" } : {};
      await api.post(`/requisitions/${requisition._id}/${action}`, body);
      setNotice(`Requisition ${action} successful`);
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const columns = [
    { key: "title", label: "Position" },
    { key: "department", label: "Department" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} /> },
    { key: "openings", label: "Openings" },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
    },
  ];

  return (
    <Stack spacing={2}>
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
        {canRequest && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditing(false);
              setForm(initialForm);
              setFormError("");
              setFormOpen(true);
            }}
          >
            New requisition
          </Button>
        )}
      </Stack>

      <PageState loading={loading} error={error}>
        <DataTable columns={columns} rows={rows} onView={setSelected} />
      </PageState>

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editing ? "Edit requisition" : "Create requisition"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {[
              ["title", "Job title"],
              ["department", "Department"],
              ["location", "Location"],
              ["hiringManager", "Hiring manager"],
              ["experienceMin", "Min experience"],
              ["experienceMax", "Max experience"],
              ["salaryMin", "Min salary"],
              ["salaryMax", "Max salary"],
              ["openings", "Openings"],
            ].map(([key, label]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Field
                  label={label}
                  value={form[key]}
                  onChange={(value) => setForm({
                    ...form,
                    [key]: ["experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings"].includes(key)
                      ? Number(value)
                      : value,
                  })}
                  type={["experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings"].includes(key) ? "number" : "text"}
                  required={["title", "department", "location", "hiringManager", "experienceMin", "experienceMax", "openings"].includes(key)}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Field
                label="Employment type"
                value={form.employmentType}
                onChange={(value) => setForm({ ...form, employmentType: value })}
                options={["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((value) => ({
                  value,
                  label: value.replaceAll("_", " "),
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                label="Required skills"
                value={Array.isArray(form.skills) ? form.skills.join(", ") : form.skills}
                onChange={(value) => setForm({ ...form, skills: value })}
                required={Number(form.experienceMin) === 0}
                helperText={Number(form.experienceMin) === 0 ? "Required when minimum experience is zero; separate skills with commas." : "Separate skills with commas."}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                label="Description"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                multiline
                required
                helperText="Enter at least 10 characters."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editing ? "Save changes" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Requisition actions</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Alert severity="info">{selected?.title} · {selected?.status}</Alert>
            {canRequest && ["DRAFT", "REJECTED"].includes(selected?.status) && (
              <Button onClick={() => {
                setForm({ ...initialForm, ...selected });
                setEditing(true);
                setFormError("");
                setSelected(null);
                setFormOpen(true);
              }}>
                Edit requisition
              </Button>
            )}
            {canRequest && ["DRAFT", "REJECTED"].includes(selected?.status) && (
              <Button onClick={() => runAction(selected, "submit")}>Submit for approval</Button>
            )}
            {canApprove && selected?.status === "PENDING_APPROVAL" && (
              <>
                <Button onClick={() => runAction(selected, "approve")}>Approve</Button>
                <Button color="error" onClick={() => runAction(selected, "reject")}>Reject</Button>
              </>
            )}
            {canManageLifecycle && selected?.status === "APPROVED" && (
              <Button onClick={() => runAction(selected, "open")}>Open requisition</Button>
            )}
            {canManageLifecycle && selected?.status === "OPEN" && (
              <>
                <Button onClick={() => runAction(selected, "hold")}>Put on hold</Button>
                <Button color="error" onClick={() => runAction(selected, "close")}>Close</Button>
              </>
            )}
            {canManageLifecycle && ["DRAFT", "PENDING_APPROVAL", "APPROVED", "OPEN", "ON_HOLD"].includes(selected?.status) && (
              <Button color="error" onClick={() => runAction(selected, "cancel")}>Cancel requisition</Button>
            )}
            {!canRequest && !canApprove && !canManageLifecycle && (
              <Alert severity="info">You can view requisitions, but your role has no actions for this item.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
