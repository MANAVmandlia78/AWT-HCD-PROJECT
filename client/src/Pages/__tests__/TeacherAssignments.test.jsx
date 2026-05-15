import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeacherAssignments from "../TeacherAssignments";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

// Mock router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useParams: () => ({
      id: "101",
    }),
    useNavigate: () => vi.fn(),
  };
});

// Mock Firebase
vi.mock("firebase/storage", async () => {

  return {

    getStorage: vi.fn(() => ({})),

    ref: vi.fn(),

    uploadBytes: vi.fn(() => Promise.resolve()),

    getDownloadURL: vi.fn(() =>
      Promise.resolve("https://fakeurl.com/assignment.pdf")
    ),
  };
});

describe("TeacherAssignments Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: [],
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });
  });

  test("renders assignment page", async () => {

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Your Assignments/i)
    ).toBeInTheDocument();
  });

  test("shows empty assignment state", async () => {

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/No assignments yet/i)
    ).toBeInTheDocument();
  });

  test("input fields work properly", async () => {

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Enter assignment title/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "React Assignment",
      },
    });

    expect(titleInput.value).toBe("React Assignment");
  });

  test("file upload selection works", async () => {

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    const file = new File(
      ["dummy pdf"],
      "assignment.pdf",
      {
        type: "application/pdf",
      }
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("assignment.pdf")
    ).toBeInTheDocument();
  });

  test("creates assignment successfully", async () => {

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Enter assignment title/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "React Assignment",
      },
    });

    const file = new File(
      ["dummy pdf"],
      "assignment.pdf",
      {
        type: "application/pdf",
      }
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    const createBtn = screen.getByRole("button", {
  name: /Create Assignment/i,
});

    fireEvent.click(createBtn);

    await waitFor(() => {

      expect(axios.post).toHaveBeenCalled();

    });
  });

  test("fetches assignments from API", async () => {

    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "DBMS Assignment",
          description: "Normalization",
        },
      ],
    });

    render(
      <BrowserRouter>
        <TeacherAssignments />
      </BrowserRouter>
    );

    expect(
      await screen.findByText("DBMS Assignment")
    ).toBeInTheDocument();
  });

});