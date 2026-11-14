jest.mock("../src/models/User", () => ({
  countDocuments: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../src/models/Interviewer", () => ({
  findOne: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const Interviewer = require("../src/models/Interviewer");
const authService = require("../src/services/authService");

const admin = {
  _id: { toString: () => "admin-id" },
  name: "Test Admin",
  email: "admin@example.test",
  role: "SYSTEM_ADMIN",
};

describe("authService", () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousSetupKey = process.env.BOOTSTRAP_ADMIN_SETUP_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-that-is-long-enough-123";
    process.env.BOOTSTRAP_ADMIN_SETUP_KEY = "test-first-admin-setup-key-long-enough";
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousSetupKey === undefined) delete process.env.BOOTSTRAP_ADMIN_SETUP_KEY;
    else process.env.BOOTSTRAP_ADMIN_SETUP_KEY = previousSetupKey;
  });

  test("creates the first account as System Admin and returns a valid signed token", async () => {
    User.countDocuments.mockResolvedValue(0);
    User.create.mockResolvedValue(admin);

    const result = await authService.createBootstrapAdmin({
      name: admin.name,
      email: admin.email,
      password: "example-password-long",
      setupKey: process.env.BOOTSTRAP_ADMIN_SETUP_KEY,
    });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: "SYSTEM_ADMIN",
      isBootstrapAdmin: true,
    }));
    await expect(bcrypt.compare(
      "example-password-long",
      User.create.mock.calls[0][0].passwordHash
    )).resolves.toBe(true);
    expect(jwt.verify(result.token, process.env.JWT_SECRET)).toMatchObject({
      sub: "admin-id",
      role: "SYSTEM_ADMIN",
    });
    expect(result.user).toEqual({
      id: "admin-id",
      name: admin.name,
      email: admin.email,
      role: "SYSTEM_ADMIN",
    });
  });

  test("refuses bootstrap after any account already exists", async () => {
    User.countDocuments.mockResolvedValue(1);

    await expect(authService.createBootstrapAdmin({
      name: admin.name,
      email: admin.email,
      password: "example-password-long",
      setupKey: process.env.BOOTSTRAP_ADMIN_SETUP_KEY,
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(User.create).not.toHaveBeenCalled();
  });

  test("does not return password hashes when listing provisioned users", async () => {
    const safeUser = { ...admin, createdAt: new Date() };
    User.findOne = jest.fn();
    User.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([safeUser]),
    });

    const users = await authService.listUsers();
    expect(users).toHaveLength(1);
    expect(users[0]).not.toHaveProperty("passwordHash");
  });

  test("links interviewer accounts to an active interviewer profile", async () => {
    const linkedUser = {
      ...admin,
      role: "INTERVIEWER",
      interviewerId: "INT-2030-0001",
    };
    Interviewer.findOne.mockResolvedValue({ interviewerId: linkedUser.interviewerId });
    User.create.mockResolvedValue(linkedUser);

    await expect(authService.createUser({
      name: linkedUser.name,
      email: linkedUser.email,
      password: "example-password-long",
      role: "INTERVIEWER",
      interviewerId: linkedUser.interviewerId,
    })).resolves.toMatchObject({
      role: "INTERVIEWER",
      interviewerId: linkedUser.interviewerId,
    });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: "INTERVIEWER",
      interviewerId: linkedUser.interviewerId,
    }));
  });
});
