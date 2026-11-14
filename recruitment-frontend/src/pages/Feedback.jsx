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

const blank = {
  interview: "",
  application: "",
  interviewerId: "",
  interviewerName: "",
  overallRating: 3,
  recommendation: "YES",
  strengths: "",
  weaknesses: "",
  comments: "",
  competencies: [
    { name: "Technical skills", rating: 3, comments: "" },
    { name: "Communication", rating: 3, comments: "" },
  ],
};

export default function Feedback({ user }) {
  const isInterviewer = user?.role === "INTERVIEWER";
  const [rows, setRows] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [feedbackResponse, interviewResponse] = await Promise.all([
        getResource("/feedback"),
        getResource("/interviews"),
      ]);
      setRows(feedbackResponse.data.data || []);
      setInterviews((interviewResponse.data.data || []).filter(
        (interview) => interview.status === "COMPLETED"
      ));
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

  const submit = async () => {
    try {
      await api.post("/feedback", {
        ...form,
        overallRating: Number(form.overallRating),
        competencies: form.competencies.map((item) => ({
          ...item,
          rating: Number(item.rating),
        })),
      });
      setOpen(false);
      setNotice("Feedback submitted");
      setForm(blank);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const selectedInterview = interviews.find((item) => item._id === form.interview);
  const hasAssignedInterviewer = isInterviewer || Boolean(form.interviewerId.trim());

  return (
    <Stack spacing={2}>
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
        <Button
          variant="contained"
          startIcon={<Add />}
          disabled={!interviews.length}
          onClick={() => setOpen(true)}
        >
          Submit feedback
        </Button>
      </Stack>
      <PageState loading={loading} error={error}>
        <DataTable
          columns={[
            { key: "interviewerName", label: "Interviewer" },
            {
              key: "interview",
              label: "Interview",
              render: (row) => row.interview?.roundName || row.interview?._id || "—",
            },
            { key: "overallRating", label: "Rating" },
            {
              key: "recommendation",
              label: "Recommendation",
              render: (row) => <StatusChip value={row.recommendation} />,
            },
            {
              key: "submittedAt",
              label: "Submitted",
              render: (row) => row.submittedAt
                ? new Date(row.submittedAt).toLocaleDateString()
                : "—",
            },
          ]}
          rows={rows}
        />
      </PageState>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit interview feedback</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Field
              label="Completed interview"
              value={form.interview}
              onChange={(value) => {
                const interview = interviews.find((item) => item._id === value);
                setForm({
                  ...form,
                  interview: value,
                  application: interview?.application?._id || interview?.application || "",
                });
              }}
              options={interviews.map((interview) => ({
                value: interview._id,
                label: `${interview.roundName} · ${interview.application?.candidate?.email || interview._id}`,
              }))}
              required
            />
            {!isInterviewer && (
              <>
                <Field
                  label="Interviewer ID"
                  value={form.interviewerId}
                  onChange={(value) => setForm({ ...form, interviewerId: value })}
                  required
                />
                <Field
                  label="Interviewer name"
                  value={form.interviewerName}
                  onChange={(value) => setForm({ ...form, interviewerName: value })}
                  required
                />
              </>
            )}
            <Field
              label="Overall rating (1–5)"
              type="number"
              value={form.overallRating}
              onChange={(value) => setForm({ ...form, overallRating: value })}
              required
            />
            <Field
              label="Recommendation"
              value={form.recommendation}
              onChange={(value) => setForm({ ...form, recommendation: value })}
              options={["STRONG_YES", "YES", "NO", "STRONG_NO", "HOLD"].map((value) => ({
                value,
                label: value,
              }))}
              required
            />
            <Field
              label="Strengths"
              value={form.strengths}
              onChange={(value) => setForm({ ...form, strengths: value })}
              multiline
            />
            <Field
              label="Weaknesses"
              value={form.weaknesses}
              onChange={(value) => setForm({ ...form, weaknesses: value })}
              multiline
            />
            <Field
              label="Comments"
              value={form.comments}
              onChange={(value) => setForm({ ...form, comments: value })}
              multiline
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!selectedInterview || !hasAssignedInterviewer || (!isInterviewer && !form.interviewerName.trim())}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
