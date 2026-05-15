import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import Home from "../Home";
import { BrowserRouter } from "react-router-dom";

// mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {

  const actual = await vi.importActual(
    "react-router-dom"
  );

  return {
    ...actual,

    useNavigate: () => mockNavigate,
  };
});

describe("Home Component", () => {

  beforeEach(() => {

    localStorage.clear();

    vi.clearAllMocks();

    window.alert = vi.fn();
  });

  // ─────────────────────────────────────
  // Logged out state
  // ─────────────────────────────────────

  test("renders logged out UI", () => {

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Please/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/log in/i)
    ).toBeInTheDocument();
  });

  // ─────────────────────────────────────
  // Teacher UI
  // ─────────────────────────────────────

  test("renders teacher dashboard", () => {

    const teacherPayload = {
      role: "teacher",
      name: "Manav",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(teacherPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Teacher/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Start a Session/i)
    ).toBeInTheDocument();
  });

  test("teacher room code gets generated", () => {

    const teacherPayload = {
      role: "teacher",
      name: "Manav",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(teacherPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const roomCode =
      document.querySelector(
        ".room-code-value"
      );

    expect(roomCode.textContent)
      .toMatch(/[A-Z]{2}-\d{4}/);
  });

  test("generate new code button works", () => {

    const teacherPayload = {
      role: "teacher",
      name: "Manav",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(teacherPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const firstCode =
      document.querySelector(
        ".room-code-value"
      ).textContent;

    const generateBtn =
      screen.getByRole("button", {
        name: /Generate New Code/i,
      });

    fireEvent.click(generateBtn);

    const secondCode =
      document.querySelector(
        ".room-code-value"
      ).textContent;

    expect(firstCode)
      .not.toBe(secondCode);
  });

  test("teacher enter room button navigates", () => {

    const teacherPayload = {
      role: "teacher",
      name: "Manav",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(teacherPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const btn =
      screen.getByRole("button", {
        name: /Enter Room/i,
      });

    fireEvent.click(btn);

    expect(mockNavigate)
      .toHaveBeenCalled();
  });

  // ─────────────────────────────────────
  // Student UI
  // ─────────────────────────────────────

  test("renders student dashboard", () => {

    const studentPayload = {
      role: "student",
      name: "Rahul",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(studentPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Student/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Join a Session/i)
    ).toBeInTheDocument();
  });

  test("student room input works", async () => {

  const studentPayload = {
    role: "student",
    name: "Rahul",
  };

  localStorage.setItem(
    "token",

    `header.${btoa(
      JSON.stringify(studentPayload)
    )}.signature`
  );

  render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );

  const input =
    screen.getByPlaceholderText(
      /XK-7842/i
    );

  fireEvent.change(input, {
    target: {
      value: "ab-1234",
    },
  });

  // wait for React state update
  expect(
    await screen.findByDisplayValue(
      "AB-1234"
    )
  ).toBeInTheDocument();

});

  test("student enter room button disabled initially", () => {

    const studentPayload = {
      role: "student",
      name: "Rahul",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(studentPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const btn =
      screen.getByRole("button", {
        name: /Enter Room/i,
      });

    expect(btn).toBeDisabled();
  });

  test("student enter room button enables after typing", () => {

    const studentPayload = {
      role: "student",
      name: "Rahul",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(studentPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const input =
      screen.getByPlaceholderText(
        /XK-7842/i
      );

    fireEvent.change(input, {
      target: {
        value: "AB-1234",
      },
    });

    const btn =
      screen.getByRole("button", {
        name: /Enter Room/i,
      });

    expect(btn)
      .not.toBeDisabled();
  });

  test("student enter room navigates correctly", () => {

    const studentPayload = {
      role: "student",
      name: "Rahul",
    };

    localStorage.setItem(
      "token",

      `header.${btoa(
        JSON.stringify(studentPayload)
      )}.signature`
    );

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const input =
      screen.getByPlaceholderText(
        /XK-7842/i
      );

    fireEvent.change(input, {
      target: {
        value: "AB-1234",
      },
    });

    const btn =
      screen.getByRole("button", {
        name: /Enter Room/i,
      });

    fireEvent.click(btn);

    expect(mockNavigate)
      .toHaveBeenCalledWith(
        "/room/AB-1234"
      );
  });

});