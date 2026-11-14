import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  AssignmentOutlined,
  EventOutlined,
  Groups2Outlined,
  LocalOfferOutlined,
  Refresh,
  WorkOutline,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getResource } from "../dataSource";
import DataTable, { StatusChip } from "../components/DataTable";

const metrics = [
  { name: "Requisitions", endpoint: "/requisitions", path: "/requisitions", Icon: WorkOutline, roles: null, color: "#4f46e5" },
  { name: "Candidates", endpoint: "/candidates", path: "/candidates", Icon: Groups2Outlined, roles: ["OPERATIONS_ANALYST", "SYSTEM_ADMIN"], color: "#0f766e" },
  { name: "Applications", endpoint: "/applications", path: "/applications", Icon: AssignmentOutlined, roles: ["OPERATIONS_ANALYST", "SYSTEM_ADMIN"], color: "#d97706" },
  { name: "Interviews", endpoint: "/interviews", path: "/interviews", Icon: EventOutlined, roles: ["OPERATIONS_ANALYST", "INTERVIEWER", "SYSTEM_ADMIN"], color: "#7c3aed" },
  { name: "Offers", endpoint: "/offers", path: "/offers", Icon: LocalOfferOutlined, roles: ["OPERATIONS_ANALYST", "APPROVER", "SYSTEM_ADMIN"], color: "#db2777" },
];

const chartColors = ["#4f46e5", "#0f766e", "#d97706", "#db2777", "#0891b2", "#7c3aed", "#dc2626"];
const tooltipStyle = {
  border: "1px solid #e6eaf2",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(15, 23, 42, .1)",
};

function ChartPanel({ title, subtitle, children }) {
  return (
    <Paper className="dashboard-panel" elevation={0}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={750}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </Box>
      {children}
    </Paper>
  );
}

function EmptyChart() {
  return (
    <Box className="chart-empty">
      <Typography variant="body2" color="text.secondary">No records available yet</Typography>
    </Box>
  );
}

export default function Dashboard({ user }) {
  const [counts, setCounts] = useState({});
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const visibleMetrics = useMemo(
    () => metrics.filter((metric) => !user || !metric.roles || metric.roles.includes(user.role)),
    [user?.role]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all(
      visibleMetrics.map(async (metric) => {
        try {
          const response = await getResource(metric.endpoint);
          const records = Array.isArray(response.data.data) ? response.data.data : [];
          return { name: metric.name, count: records.length, records };
        } catch (requestError) {
          return { name: metric.name, error: requestError.message };
        }
      })
    ).then((results) => {
      if (!active) return;
      setCounts(Object.fromEntries(results.map(({ name, count }) => [name, count ?? null])));
      setApplications(results.find((result) => result.name === "Applications")?.records || []);
      setRequisitions(results.find((result) => result.name === "Requisitions")?.records || []);
      setErrors(results.filter((result) => result.error).map(({ name, error }) => `${name}: ${error}`));
      setLoading(false);
    }).catch((requestError) => {
      if (!active) return;
      setErrors([requestError.message]);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [visibleMetrics, refreshKey]);

  const applicationStatuses = useMemo(() => {
    const grouped = applications.reduce((result, application) => {
      const status = (application.status || "UNKNOWN").replaceAll("_", " ");
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [applications]);

  const applicationsByMonth = useMemo(() => {
    const grouped = new Map();
    applications.forEach((application) => {
      const date = new Date(application.appliedAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
      const current = grouped.get(key);
      grouped.set(key, { month: label, applications: (current?.applications || 0) + 1 });
    });
    return Array.from(grouped.entries())
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([, value]) => value);
  }, [applications]);

  const requisitionsByStatus = useMemo(() => {
    const grouped = requisitions.reduce((result, requisition) => {
      const status = (requisition.status || "UNKNOWN").replaceAll("_", " ");
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});
    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  }, [requisitions]);

  const hasApplications = visibleMetrics.some((metric) => metric.name === "Applications");

  return (
    <Stack spacing={3}>
      <Paper className="dashboard-hero" elevation={0}>
        <Box>
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,.72)", letterSpacing: 1.5 }}>
            HIRING OPERATIONS
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
            Recruitment overview
          </Typography>
          <Typography sx={{ mt: 1, color: "rgba(255,255,255,.78)" }}>
            A clear view of your hiring pipeline and activity.
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={1}>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,.8)" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Typography>
          <Button
            onClick={() => setRefreshKey((current) => current + 1)}
            startIcon={<Refresh />}
            variant="outlined"
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,.45)", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,.08)" } }}
          >
            Refresh data
          </Button>
        </Stack>
      </Paper>

      {errors.length > 0 && (
        <Alert severity="warning">
          Some metrics could not be loaded. {errors.join("; ")}
        </Alert>
      )}

      <Grid container spacing={2}>
        {visibleMetrics.map(({ name, path, Icon, color }) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={name}>
            <Card className="metric-card" component={Link} to={path} variant="outlined">
              <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">{name}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75 }}>
                      {loading ? "…" : counts[name] === null ? "—" : counts[name] ?? 0}
                    </Typography>
                  </Box>
                  <Box className="metric-icon" sx={{ color, bgcolor: `${color}14` }}>
                    <Icon />
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  View records <ArrowForward sx={{ fontSize: 13, verticalAlign: "middle", ml: 0.5 }} />
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {hasApplications && (
          <>
            <Grid item xs={12} lg={5}>
              <ChartPanel title="Application pipeline" subtitle="Applications by current stage">
                <Box className="chart-container">
                  {applicationStatuses.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={applicationStatuses} dataKey="value" nameKey="name" innerRadius={66} outerRadius={100} paddingAngle={3} stroke="#fff" strokeWidth={3}>
                          {applicationStatuses.map((entry, index) => (
                            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend verticalAlign="bottom" height={42} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </Box>
              </ChartPanel>
            </Grid>
            <Grid item xs={12} lg={7}>
              <ChartPanel title="Application activity" subtitle="Monthly application volume">
                <Box className="chart-container">
                  {applicationsByMonth.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={applicationsByMonth} margin={{ top: 14, right: 18, left: -12, bottom: 4 }}>
                        <CartesianGrid stroke="#edf0f5" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="applications" name="Applications" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </Box>
              </ChartPanel>
            </Grid>
          </>
        )}
        <Grid item xs={12} lg={12}>
          <ChartPanel title="Requisition status" subtitle="Open roles and hiring progress">
            <Box className="chart-container chart-container-short">
              {requisitionsByStatus.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requisitionsByStatus} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="#edf0f5" vertical={false} />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} interval={0} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Requisitions" fill="#0f766e" radius={[7, 7, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </Box>
          </ChartPanel>
        </Grid>
      </Grid>

      {hasApplications && (
        <Paper className="dashboard-panel" elevation={0}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={750}>Recent applications</Typography>
              <Typography variant="body2" color="text.secondary">Latest activity in your hiring pipeline</Typography>
            </Box>
            <Button component={Link} to="/applications" endIcon={<ArrowForward />} size="small">View all</Button>
          </Stack>
          <DataTable
            columns={[
              {
                key: "candidate",
                label: "Candidate",
                render: (row) => row.candidate?.firstName
                  ? `${row.candidate.firstName} ${row.candidate.lastName || ""}`
                  : row.candidate?.email || "—",
              },
              { key: "requisition", label: "Requisition", render: (row) => row.requisition?.title || "—" },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} /> },
              {
                key: "appliedAt",
                label: "Applied",
                render: (row) => row.appliedAt ? new Date(row.appliedAt).toLocaleDateString() : "—",
              },
            ]}
            rows={applications.slice(0, 6)}
          />
        </Paper>
      )}
    </Stack>
  );
}
