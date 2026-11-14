import api from "./api";
import { getDataMode } from "./dataMode";

let demoDataRequest;
let demoResourcesRequest;

const withId = (record, id) => ({ ...record, _id: id });

async function loadDemoData() {
  if (!demoDataRequest) {
    demoDataRequest = api.get("/demo-data").then((response) => response.data).catch((error) => {
      demoDataRequest = null;
      throw error;
    });
  }
  return demoDataRequest;
}

function loadDemoResources() {
  if (!demoResourcesRequest) {
    demoResourcesRequest = loadDemoData().then(buildDemoResources).catch((error) => {
      demoResourcesRequest = null;
      throw error;
    });
  }
  return demoResourcesRequest;
}

function buildDemoResources(data) {
  const departments = new Map((data.departments || []).map((item) => [item.departmentId, item.name]));
  const candidates = (data.candidates || []).map((item) => withId(item, item.candidateId));
  const interviewers = (data.interviewers || []).map((item) => withId({
    ...item,
    name: [item.firstName, item.lastName].filter(Boolean).join(" "),
  }, item.interviewerId));
  const requisitions = (data.requisitions || []).map((item) => withId({
    ...item,
    department: departments.get(item.departmentId) || item.departmentId,
    createdAt: item.createdAt || item.statusHistory?.[0]?.timestamp,
  }, item.requisitionId));
  const candidateById = new Map(candidates.map((item) => [item.candidateId, item]));
  const requisitionById = new Map(requisitions.map((item) => [item.requisitionId, item]));
  const applications = (data.applications || []).map((item) => withId({
    ...item,
    candidate: candidateById.get(item.candidateId) || item.candidateId,
    requisition: requisitionById.get(item.requisitionId) || item.requisitionId,
  }, item.applicationId));
  const applicationById = new Map(applications.map((item) => [item.applicationId, item]));
  const interviews = (data.interviews || []).map((item) => withId({
    ...item,
    application: applicationById.get(item.applicationId) || item.applicationId,
  }, item.interviewId));
  const interviewById = new Map(interviews.map((item) => [item.interviewId, item]));
  const feedback = (data.feedback || []).map((item) => {
    const interview = interviewById.get(item.interviewId);
    const assignedInterviewer = interview?.panel?.find(
      (member) => member.interviewerId === item.interviewerId
    );
    return withId({
      ...item,
      interviewerName: item.interviewerName === "undefined undefined"
        ? assignedInterviewer?.interviewerName || item.interviewerId
        : item.interviewerName,
      interview: interview || item.interviewId,
      application: applicationById.get(item.applicationId) || item.applicationId,
    }, item.feedbackId);
  });
  const offers = (data.offers || []).map((item) => withId({
    ...item,
    department: departments.get(item.departmentId) || item.departmentId,
    application: applicationById.get(item.applicationId) || item.applicationId,
  }, item.offerId));

  return {
    "/requisitions": requisitions,
    "/candidates": candidates,
    "/interviewers": interviewers,
    "/applications": applications,
    "/interviews": interviews,
    "/feedback": feedback,
    "/offers": offers,
  };
}

export async function getResource(endpoint, config) {
  if (getDataMode() !== "demo") return api.get(endpoint, config);

  const resources = await loadDemoResources();
  const resourcePath = endpoint.replace(/\/search$/, "");
  let records = resources[resourcePath];
  if (!records) throw new Error(`Unsupported demo resource: ${endpoint}`);

  const keyword = config?.params?.keyword;
  if (resourcePath === "/candidates" && keyword) {
    const query = String(keyword).toLowerCase();
    records = records.filter((candidate) =>
      [candidate.firstName, candidate.lastName, candidate.email, ...(candidate.skills || [])]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }

  return { data: { success: true, results: records.length, data: records } };
}
