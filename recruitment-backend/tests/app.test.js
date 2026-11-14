jest.mock("../src/services/requisitionService", () => ({
  getAllRequisitions: jest.fn().mockResolvedValue([]),
  createRequisition: jest.fn().mockImplementation(async (data) => data),
}));
jest.mock("../src/services/authService", () => ({
  createBootstrapAdmin: jest.fn(),
  login: jest.fn(),
  getCurrentUser: jest.fn(),
  listUsers: jest.fn(),
  createUser: jest.fn(),
}));

process.env.JWT_SECRET = "test-secret-value-that-is-long-enough";
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const requisitionService = require("../src/services/requisitionService");
const authService = require("../src/services/authService");

const tokenFor = (role, subject = "actor-1") =>
  jwt.sign({ role }, process.env.JWT_SECRET, {
    subject,
    expiresIn: "1h",
  });

describe("HTTP application", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("mounts API routes before the not-found handler", async () => {
    const response = await request(app)
      .get("/api/requisitions")
      .set("Authorization", `Bearer ${tokenFor("OPERATIONS_ANALYST")}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test("keeps the health endpoint public", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("supports local login and one-time first-admin setup", async () => {
    const account = { id: "account-1", name: "Admin", email: "admin@example.test", role: "SYSTEM_ADMIN" };
    authService.login.mockResolvedValue({ token: "signed-token", user: account });
    authService.createBootstrapAdmin.mockResolvedValue({ token: "admin-token", user: account });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: account.email, password: "example-password-long" });
    expect(login.status).toBe(200);
    expect(login.body.data.user).toEqual(account);

    const bootstrap = await request(app)
      .post("/api/auth/bootstrap")
      .send({
        name: account.name,
        email: account.email,
        password: "example-password-long",
        setupKey: "test-setup-key",
      });
    expect(bootstrap.status).toBe(201);
      expect(authService.createBootstrapAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ email: account.email, setupKey: "test-setup-key" })
      );
  });

  test("limits account listing to System Admins", async () => {
    const anonymous = await request(app).get("/api/auth/users");
    const forbidden = await request(app)
      .get("/api/auth/users")
      .set("Authorization", `Bearer ${tokenFor("OPERATIONS_ANALYST")}`);

    expect(anonymous.status).toBe(401);
    expect(forbidden.status).toBe(403);
  });

  test("returns the authenticated account and permits admin user provisioning", async () => {
    const account = { id: "admin-1", name: "Admin", email: "admin@example.test", role: "SYSTEM_ADMIN" };
    authService.getCurrentUser.mockResolvedValue(account);
    authService.createUser.mockResolvedValue({
      id: "new-user",
      name: "Recruiter",
      email: "recruiter@example.test",
      role: "OPERATIONS_ANALYST",
    });

    const currentUser = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenFor("SYSTEM_ADMIN", "admin-1")}`);
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.data).toEqual(account);

    const created = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${tokenFor("SYSTEM_ADMIN", "admin-1")}`)
      .send({
        name: "Recruiter",
        email: "recruiter@example.test",
        password: "example-password-long",
        role: "OPERATIONS_ANALYST",
      });
    expect(created.status).toBe(201);
    expect(created.body.data).not.toHaveProperty("passwordHash");
  });

  test("serves the generated synthetic dataset through the demo endpoint", async () => {
    const response = await request(app).get("/api/demo-data");
    expect(response.status).toBe(200);
    expect(response.body.candidates.length).toBeGreaterThan(0);
    expect(response.body.applications.length).toBeGreaterThan(0);
  });

  test("does not expose demo data in production by default", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousDemoSetting = process.env.ENABLE_DEMO_DATA;
    process.env.NODE_ENV = "production";
    delete process.env.ENABLE_DEMO_DATA;

    try {
      const response = await request(app).get("/api/demo-data");
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Demo data is disabled");
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousDemoSetting === undefined) delete process.env.ENABLE_DEMO_DATA;
      else process.env.ENABLE_DEMO_DATA = previousDemoSetting;
    }
  });

  test("uses sanitized Zod input rather than untrusted request fields", async () => {
    const response = await request(app)
      .post("/api/requisitions")
      .set("Authorization", `Bearer ${tokenFor("BUSINESS_REQUESTER")}`)
      .send({
        title: "Platform Engineer",
        department: "Engineering",
        location: "Remote",
        employmentType: "FULL_TIME",
        experienceMin: 2,
        experienceMax: 6,
        openings: 1,
        description: "Build and maintain platform services.",
        skills: ["Node.js"],
        hiringManager: "Hiring Manager",
        createdBy: "requester-1",
        status: "OPEN",
        approvalHistory: [{ action: "APPROVED" }],
      });

    expect(response.status).toBe(201);
    expect(requisitionService.createRequisition).toHaveBeenCalledWith(
      expect.not.objectContaining({
        status: "OPEN",
        approvalHistory: expect.anything(),
      }),
      "actor-1"
    );
    expect(requisitionService.createRequisition.mock.calls[0][0].status).toBeUndefined();
  });

  test("returns a JSON 404 for unknown paths", async () => {
    const response = await request(app).get("/api/unknown");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("requires a valid actor token and enforces role permissions", async () => {
    const anonymous = await request(app).get("/api/requisitions");
    expect(anonymous.status).toBe(401);

    const forbidden = await request(app)
      .post("/api/requisitions")
      .set("Authorization", `Bearer ${tokenFor("CANDIDATE")}`)
      .send({});
    expect(forbidden.status).toBe(403);
  });
});
