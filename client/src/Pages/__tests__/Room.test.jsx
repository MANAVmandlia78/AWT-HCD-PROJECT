import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import Room from "../Room";
import { BrowserRouter } from "react-router-dom";

// Mock socket provider
vi.mock("../../Providers/Socket", () => ({
  useSocket: () => ({
    id: "socket-123",

    emit: vi.fn(),

    on: vi.fn(),

    off: vi.fn(),
  }),
}));

// Mock Whiteboard
vi.mock("../Whiteboard", () => ({
  default: () => <div>Whiteboard Component</div>,
}));

// Mock Clipboard
vi.mock("../Clipboard", () => ({
  default: () => <div>Clipboard Component</div>,
}));

// Mock router
vi.mock("react-router-dom", async () => {

  const actual = await vi.importActual(
    "react-router-dom"
  );

  return {
    ...actual,

    useParams: () => ({
      roomId: "ROOM101",
    }),
  };
});

// Mock WebRTC
global.RTCPeerConnection = vi.fn(() => ({
  createOffer: vi.fn(),
  createAnswer: vi.fn(),

  setLocalDescription: vi.fn(),

  setRemoteDescription: vi.fn(),

  addIceCandidate: vi.fn(),

  addTrack: vi.fn(),

  close: vi.fn(),

  onicecandidate: null,
  ontrack: null,
}));

// Mock mediaDevices
Object.defineProperty(
  navigator,
  "mediaDevices",
  {
    value: {
      getDisplayMedia: vi.fn(() =>
        Promise.resolve({
          getTracks: () => [
            {
              stop: vi.fn(),
            },
          ],
        })
      ),
    },

    writable: true,
  }
);

describe("Room Component", () => {

  beforeEach(() => {

    // fake teacher token
    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify({
          role: "teacher",
        })
      )}.signature`
    );
  });

  test("renders room ID", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/ROOM101/i)
    ).toBeInTheDocument();
  });

  test("renders whiteboard tab", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
  name: /Whiteboard/i,
})
    ).toBeInTheDocument();
  });

  test("renders clipboard tab", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
  name: /Clipboard/i,
})
    ).toBeInTheDocument();
  });

  test("shows empty screen state", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        /No screen being shared/i
      )
    ).toBeInTheDocument();
  });

  test("share screen button renders", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
        name: /Share Screen/i,
      })
    ).toBeInTheDocument();
  });

  test("participant count renders", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Participants/i)
    ).toBeInTheDocument();
  });

  test("clipboard tab switching works", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    const clipboardTab = screen.getByRole(
  "button",
  {
    name: /Clipboard/i,
  }
);

    fireEvent.click(clipboardTab);

    expect(
      screen.getByText(
        /Clipboard Component/i
      )
    ).toBeInTheDocument();
  });

  test("whiteboard tab switching works", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    const whiteboardTab = screen.getByRole(
  "button",
  {
    name: /Whiteboard/i,
  }
);

    fireEvent.click(whiteboardTab);

    expect(
      screen.getByText(
        /Whiteboard Component/i
      )
    ).toBeInTheDocument();
  });

  test("volume slider renders", () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("slider")
    ).toBeInTheDocument();
  });

  test("share screen button click works", async () => {

    render(
      <BrowserRouter>
        <Room />
      </BrowserRouter>
    );

    const btn = screen.getByRole("button", {
      name: /Share Screen/i,
    });

    fireEvent.click(btn);

    expect(
      navigator.mediaDevices.getDisplayMedia
    ).toHaveBeenCalled();
  });

});