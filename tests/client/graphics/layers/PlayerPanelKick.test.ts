vi.mock("lit", () => ({
  html: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
  LitElement: class extends EventTarget {
    requestUpdate() {}
  },
}));

vi.mock("lit/decorators.js", () => ({
  customElement: () => (clazz: unknown) => clazz,
  state: () => () => {},
  property: () => () => {},
  query: () => () => {},
}));

vi.mock("../../../../src/client/Utils", () => ({
  translateText: vi.fn((key: string) => key),
  renderDuration: vi.fn(),
  renderNumber: vi.fn(),
  renderTroops: vi.fn(),
}));

vi.mock("../../../../src/client/components/ui/ActionButton", () => ({
  actionButton: vi.fn((props: unknown) => props),
}));

import { actionButton } from "../../../../src/client/components/ui/ActionButton";
import { PlayerModerationModal } from "../../../../src/client/graphics/layers/PlayerModerationModal";
import { PlayerPanel } from "../../../../src/client/graphics/layers/PlayerPanel";
import { SendKickPlayerIntentEvent } from "../../../../src/client/Transport";
import { PlayerType } from "../../../../src/core/game/Game";
import { PlayerView } from "../../../../src/core/game/GameView";

function collectTemplateText(node: unknown): string {
  if (Array.isArray(node)) {
    return node.map((entry) => collectTemplateText(entry)).join("");
  }

  if (!node || typeof node !== "object") {
    return String(node ?? "");
  }

  const templateNode = node as { strings?: string[]; values?: unknown[] };
  const strings = templateNode.strings ?? [];
  const values = templateNode.values ?? [];

  return strings
    .map((part, index) => part + collectTemplateText(values[index]))
    .join("");
}

describe("PlayerPanel - kick player moderation", () => {
  let panel: PlayerPanel;
  const originalConfirm = globalThis.confirm;

  beforeEach(() => {
    panel = new PlayerPanel();
    (panel as any).requestUpdate = vi.fn();
    (panel as any).isVisible = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
    globalThis.confirm = originalConfirm;
  });

  test("renders moderation action only when allowed or already kicked", () => {
    const my = { isLobbyCreator: () => true } as unknown as PlayerView;
    const other = {
      id: () => 2,
      name: () => "Other",
      displayName: () => "[TAG] Other",
      type: () => PlayerType.Human,
      clientID: () => "client-2",
    } as unknown as PlayerView;

    (actionButton as unknown as ReturnType<typeof vi.fn>).mockClear();
    (panel as any).renderModeration(my, other);
    expect(actionButton).toHaveBeenCalledTimes(1);
    expect(
      (actionButton as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0],
    ).toMatchObject({
      label: "player_panel.moderation",
      title: "player_panel.moderation",
      type: "red",
    });

    (actionButton as unknown as ReturnType<typeof vi.fn>).mockClear();
    (panel as any).kickedPlayerIDs.add("2");
    (panel as any).renderModeration(my, other);
    expect(actionButton).toHaveBeenCalledTimes(1);

    const notCreator = { isLobbyCreator: () => false } as unknown as PlayerView;
    (actionButton as unknown as ReturnType<typeof vi.fn>).mockClear();
    (panel as any).kickedPlayerIDs.clear();
    (panel as any).renderModeration(notCreator, other);
    expect(actionButton).not.toHaveBeenCalled();
  });

  test("opens moderation modal and hides after a kick", () => {
    const other = {
      id: () => 2,
      name: () => "Other",
      displayName: () => "[TAG] Other",
      type: () => PlayerType.Human,
      clientID: () => "client-2",
    } as unknown as PlayerView;

    (panel as any).openModeration({ stopPropagation: vi.fn() }, other);
    expect((panel as any).moderationTarget).toBe(other);
    expect((panel as any).suppressNextHide).toBe(true);

    (panel as any).handleModerationKicked(
      new CustomEvent("kicked", { detail: { playerId: "2" } }),
    );

    expect((panel as any).kickedPlayerIDs.has("2")).toBe(true);
    expect((panel as any).moderationTarget).toBe(null);
    expect((panel as any).isVisible).toBe(false);
  });
});

describe("PlayerPanel - spectator replay rendering", () => {
  let panel: PlayerPanel;

  beforeEach(() => {
    vi.clearAllMocks();
    panel = new PlayerPanel();
    (panel as any).requestUpdate = vi.fn();
    (panel as any).isVisible = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders alliances when myPlayer is unavailable", () => {
    const alliedPlayer = {
      displayName: () => "Allied Player",
    } as unknown as PlayerView;

    const owner = {
      isPlayer: () => true,
      isTraitor: () => false,
      displayName: () => "Owner",
      type: () => PlayerType.Human,
      cosmetics: { flag: undefined },
      gold: () => 1000,
      troops: () => 250,
      allies: () => [alliedPlayer],
      data: { betrayals: 2 },
      hasEmbargoAgainst: () => false,
    } as unknown as PlayerView;

    (panel as any).g = {
      myPlayer: () => null,
      owner: () => owner,
      config: () => ({
        disableAlliances: () => false,
        isUnitDisabled: () => false,
        maxTroops: () => 1000,
        theme: () => ({
          teamColor: () => ({ toHex: () => "#ffffff" }),
        }),
      }),
      ticks: () => 100,
    };
    (panel as any).tile = {};

    (panel as any).actions = null;

    const rendered = panel.render();
    const text = collectTemplateText(rendered);

    expect(text).toContain("player_panel.alliances");
    expect(text).toContain("Allied Player");
    expect(actionButton).not.toHaveBeenCalled();
  });
});

describe("PlayerModerationModal - kick confirmation", () => {
  const originalConfirm = globalThis.confirm;

  afterEach(() => {
    vi.clearAllMocks();
    globalThis.confirm = originalConfirm;
  });

  test("emits SendKickPlayerIntentEvent and dispatches kicked when confirmed", () => {
    (globalThis as any).confirm = vi.fn(() => true);

    const modal = new PlayerModerationModal();
    const eventBus = { emit: vi.fn() };
    const my = { isLobbyCreator: () => true } as unknown as PlayerView;
    const other = {
      id: () => 2,
      name: () => "Other",
      displayName: () => "[TAG] Other",
      type: () => PlayerType.Human,
      clientID: () => "client-2",
    } as unknown as PlayerView;

    modal.eventBus = eventBus as any;
    modal.myPlayer = my;
    modal.target = other;

    const kickedListener = vi.fn();
    modal.addEventListener("kicked", kickedListener as any);

    (modal as any).handleKickClick({ stopPropagation: vi.fn() });

    expect(eventBus.emit).toHaveBeenCalledTimes(1);
    const event = eventBus.emit.mock.calls[0][0] as SendKickPlayerIntentEvent;
    expect(event).toBeInstanceOf(SendKickPlayerIntentEvent);
    expect(event.target).toBe("client-2");

    expect(kickedListener).toHaveBeenCalledTimes(1);
    const kickedEvent = kickedListener.mock.calls[0][0] as CustomEvent;
    expect(kickedEvent.detail).toEqual({ playerId: "2" });
  });

  test("does not emit when confirmation is cancelled", () => {
    (globalThis as any).confirm = vi.fn(() => false);

    const modal = new PlayerModerationModal();
    const eventBus = { emit: vi.fn() };
    const my = { isLobbyCreator: () => true } as unknown as PlayerView;
    const other = {
      id: () => 2,
      name: () => "Other",
      displayName: () => "[TAG] Other",
      type: () => PlayerType.Human,
      clientID: () => "client-2",
    } as unknown as PlayerView;

    modal.eventBus = eventBus as any;
    modal.myPlayer = my;
    modal.target = other;

    const kickedListener = vi.fn();
    modal.addEventListener("kicked", kickedListener as any);

    (modal as any).handleKickClick({ stopPropagation: vi.fn() });

    expect(eventBus.emit).not.toHaveBeenCalled();
    expect(kickedListener).not.toHaveBeenCalled();
  });
});
