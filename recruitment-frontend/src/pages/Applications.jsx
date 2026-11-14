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
import { getResource } from "../dataSource";
import { Field, PageState } from "../components/Ui";
import DataTable, { StatusChip } from "../components/DataTable";

const emptyApplication = { candidate: "", requisition: "" };
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const allowedTransitions = {
  APPLIED: ["SCREENING", "REJECTED", "WITHDRAWN"],
  SCREENING: ["REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["REJECTED", "WITHDRAWN"],
  INTERVIEW: ["REJECTED", "WITHDRAWN"],
  OFFER: ["REJECTED", "WITHDRAWN"],
};

const mongoId = (record) => {
  const id = record?._id;
  return typeof id === "string" ? id : id?.toString?.() || "";
};

export default function Applications() {
  const [rows, setRows] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyApplication);
  const [selected, setSelected] = useState(null);
  const [screening, setScreening] = useState({ remarks: "" });
  const [status, setStatus] = useState("SCREENING");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [applicationResponse, candidateResponse, requisitionResponse] = await Promise.all([
        getResource("/applications"),
        getResource("/candidates"),
        getResource("/requisitions"),
      ]);
      setRows(applicationResponse.data.data || []);
      setCandidates((candidateResponse.data.data || []).filter((candidate) => objectIdPattern.test(mongoId(candidate))));
      setRequisitions(
        (requisitionResponse.data.data || []).filter(
          (requisition) => objectIdPattern.test(mongoId(requisition))
        )
      );
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

  const create = async () => {
    setFormError("");
    if (!objectIdPattern.test(form.candidate) || !objectIdPattern.test(form.requisition)) {
      setFormError("Select both a candidate and an open requisition from the lists.");
      return;
    }
    if (!requisitions.some((requisition) => (
      mongoId(requisition) === form.requisition && requisition.status === "OPEN"
    ))) {
      setFormError("Applications can only be created for requisitions with OPEN status.");
      return;
    }

    try {
      await api.post("/applications", form);
      setOpen(false);
      setForm(emptyApplication);
      setNotice("Application created");
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const runScreening = async () => {
    try {
      await api.patch(`/applications/${selected._id}/screen`, screening);
      setNotice("Screening saved");
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateStatus = async () => {
    try {
      await api.patch(`/applications/${selected._id}/status`, {
        status,
        remarks: "Updated from frontend",
      });
      setNotice("Application status updated");
      setSelected(null);
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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setForm(emptyApplication);
            setFormError("");
            setOpen(true);
          }}
        >
          New application
        </Button>
      </Stack>
      <PageState loading={loading} error={error}>
        <DataTable
          columns={[
            {
              key: "candidate",
              label: "Candidate",
              render: (row) => row.candidate
                ? `${row.candidate.firstName || ""} ${row.candidate.lastName || row.candidate.email || ""}`
                : "—",
            },
            { key: "requisition", label: "Requisition", render: (row) => row.requisition?.title || "—" },
            { key: "status", label: "Stage", render: (row) => <StatusChip value={row.status} /> },
            {
              key: "appliedAt",
              label: "Applied",
              render: (row) => row.appliedAt ? new Date(row.appliedAt).toLocaleDateString() : "—",
            },
          ]}
          rows={rows}
          onView={(row) => {
            setSelected(row);
            setScreening({ remarks: "" });
            setStatus(allowedTransitions[row.status]?.[0] || "");
          }}
        />
      </PageState>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Create application</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Field
              label="Candidate"
              value={form.candidate}
              onChange={(value) => setForm({ ...form, candidate: value })}
              options={candidates.map((candidate) => ({
                value: mongoId(candidate),
                label: `${candidate.firstName || ""} ${candidate.lastName || ""} · ${candidate.email || ""}`.trim(),
              }))}
              helperText={candidates.length ? "Choose an existing candidate." : "No candidates with valid database IDs are available."}
              required
            />
            <Field
              label="Open requisition"
              value={form.requisition}
              onChange={(value) => setForm({ ...form, requisition: value })}
              options={requisitions.map((requisition) => ({
                value: mongoId(requisition),
                label: `${requisition.title} · ${(requisition.status || "UNKNOWN").replaceAll("_", " ")}`,
                disabled: requisition.status !== "OPEN",
              }))}
              helperText={requisitions.length
                ? "All requisitions are listed. Only OPEN requisitions can accept applications; others must be submitted, approved, and opened first."
                : "No requisitions with valid database IDs are available."}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={create}
            disabled={!form.candidate || !form.requisition}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Application actions</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">Current stage: {selected?.status}</Alert>
            {["APPLIED", "SCREENING"].includes(selected?.status) && (
              <>
                <Field
                  label="Screening remarks"
                  value={screening.remarks}
                  onChange={(value) => setScreening({ ...screening, remarks: value })}
                  multiline
                />
                <Button variant="outlined" onClick={runScreening}>Run criteria-based screening</Button>
              </>
            )}
            {(allowedTransitions[selected?.status] || []).length > 0 && (
              <>
                <Field
                  label="Change stage"
                  value={status}
                  onChange={setStatus}
                  options={allowedTransitions[selected.status].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <Button variant="contained" onClick={updateStatus}>Update stage</Button>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
