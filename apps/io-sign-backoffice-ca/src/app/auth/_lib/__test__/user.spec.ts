import { vi, it, expect, describe } from "vitest";

import { getLoggedUser, authenticate } from "../user";

const mocks = vi.hoisted(() => ({
  user: {
    id: "53680989-1538-40f4-932d-36a63fa1135d",
    email: "unit+test@pagopa.it",
    firstName: "Mario",
    lastName: "Rossi",
  },
  organization: {
    id: "53680989-1538-40f4-932d-36a63fa1135d",
  },
}));

const { getPayloadFromSessionCookie, createSessionCookie } = vi.hoisted(() => ({
  getPayloadFromSessionCookie: vi.fn(() => mocks.user),
  createSessionCookie: vi.fn(),
}));

vi.mock("../session", () => ({
  getPayloadFromSessionCookie,
  createSessionCookie,
}));

vi.mock("../self-care", () => ({
  verifySelfCareIdToken: vi.fn(async () => ({
    uid: mocks.user.id,
    email: mocks.user.email,
    name: mocks.user.firstName,
    family_name: mocks.user.lastName,
    organization: mocks.organization,
    iat: Date.now(),
    desired_exp: Date.now() + 15 * 60 * 1000,
  })),
}));

describe("getLoggedUser", () => {
  it("returns the User object stored in the session cookie", async () => {
    const user = await getLoggedUser();
    expect(user).toEqual(mocks.user);
  });
  it("throws on invalid payload", async () => {
    getPayloadFromSessionCookie.mockImplementationOnce(() => ({
      ...mocks.user,
      email: "unit+test",
    }));
    await expect(() => getLoggedUser()).rejects.toThrowError(/unauthenticated/);
  });
});

describe("authenticate", () => {
  it("creates a session cookie with the right payload", async () => {
    const { institutionId } = await authenticate("my-id-tok");
    expect(institutionId).toBe(mocks.organization.id);
    expect(createSessionCookie).toHaveBeenCalledWith(mocks.user, 15 * 60);
  });
});
