import { describe, expect, it } from "vitest";
import { UserMeResponse } from "../../src/core/ApiSchemas";
import { getLinkedProviders, hasLinkedAccount } from "../../src/client/Api";

function makeUserMeResponse(params: {
  discord?: UserMeResponse["user"]["discord"];
  email?: string;
  linkedProviders?: UserMeResponse["user"]["linkedProviders"];
}): UserMeResponse {
  return {
    user: {
      ...(params.discord ? { discord: params.discord } : {}),
      ...(params.email ? { email: params.email } : {}),
      ...(params.linkedProviders
        ? { linkedProviders: params.linkedProviders }
        : {}),
    },
    player: {
      publicId: "test-public-id",
      achievements: {
        singleplayerMap: [],
      },
    },
  };
}

describe("hasLinkedAccount", () => {
  it("returns false when userMeResponse is false", () => {
    expect(hasLinkedAccount(false)).toBe(false);
  });

  it("returns true when Discord account is present", () => {
    const response = makeUserMeResponse({
      discord: {
        id: "1",
        avatar: null,
        username: "player",
        global_name: null,
        discriminator: "0001",
      },
    });

    expect(hasLinkedAccount(response)).toBe(true);
  });

  it("returns true when email account is present", () => {
    const response = makeUserMeResponse({
      email: "player@example.com",
    });

    expect(hasLinkedAccount(response)).toBe(true);
  });

  it("returns true when both Discord and email are present", () => {
    const response = makeUserMeResponse({
      discord: {
        id: "1",
        avatar: null,
        username: "player",
        global_name: null,
        discriminator: "0001",
      },
      email: "player@example.com",
    });

    expect(hasLinkedAccount(response)).toBe(true);
  });

  it("returns false when neither Discord nor email is present", () => {
    const response = makeUserMeResponse({});
    expect(hasLinkedAccount(response)).toBe(false);
  });

  it("returns providers inferred from discord/email fields", () => {
    const response = makeUserMeResponse({
      discord: {
        id: "1",
        avatar: null,
        username: "player",
        global_name: null,
        discriminator: "0001",
      },
      email: "player@example.com",
    });

    expect(getLinkedProviders(response).sort()).toEqual(["discord", "email"]);
  });

  it("preserves providers returned by backend, even without explicit fields", () => {
    const response = makeUserMeResponse({
      linkedProviders: ["discord"],
    });

    expect(getLinkedProviders(response)).toEqual(["discord"]);
    expect(hasLinkedAccount(response)).toBe(true);
  });
});
