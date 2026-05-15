import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AssignmentDetail from "../AssignmentDetail";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useParams: () => ({
      assignmentId: "123",
    }),
    useNavigate: () => vi.fn(),
  };
});

// Mock Firebase
vi.mock("firebase/storage", async () => {

  return {

    getStorage: vi.fn(() => ({})),

    ref: vi.fn(),

    uploadBytesResumable: vi.fn(() => ({
      on: (
        event,
        progressCallback,
        errorCallback,
        successCallback
      ) => {

        progressCallback({
          bytesTransferred: 100,
          totalBytes: 100,
        });

        // delay success
        setTimeout(() => {
          successCallback();
        }, 100);
      },

      snapshot: {
        ref: {},
      },
    })),

    getDownloadURL: vi.fn(() =>
      Promise.resolve("https://fakeurl.com/test.pdf")
    ),
  };
});

describe("AssignmentDetail Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: {
        title: "Test Assignment",
        description: "Test Description",
        alreadySubmitted: false,
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });
  });

  test("renders assignment title", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    expect(
      await screen.findByText("Test Assignment")
    ).toBeInTheDocument();
  });

  test("start assignment button works", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    const startBtn = await screen.findByText(/Start Assignment/i);

    fireEvent.click(startBtn);

    expect(
      screen.getByText(/Drag & drop your file here/i)
    ).toBeInTheDocument();
  });

  test("file upload input works", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    const startBtn = await screen.findByText(/Start Assignment/i);

    fireEvent.click(startBtn);

    const file = new File(
      ["hello"],
      "assignment.pdf",
      { type: "application/pdf" }
    );

    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("assignment.pdf")
    ).toBeInTheDocument();
  });

  test("submit button gets enabled after file selection", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    const startBtn = await screen.findByText(/Start Assignment/i);

    fireEvent.click(startBtn);

    const file = new File(
      ["hello"],
      "assignment.pdf",
      { type: "application/pdf" }
    );

    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const submitBtn = screen.getByText(/Submit Assignment/i);

    expect(submitBtn).not.toBeDisabled();
  });


  test("successful assignment submission", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    const startBtn = await screen.findByText(/Start Assignment/i);

    fireEvent.click(startBtn);

    const file = new File(
      ["hello"],
      "assignment.pdf",
      { type: "application/pdf" }
    );

    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const submitBtn = screen.getByText(/Submit Assignment/i);

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(
        screen.getByText(/Assignment Submitted/i)
      ).toBeInTheDocument();

    });
  });

  test("API submission gets called", async () => {

    render(
      <BrowserRouter>
        <AssignmentDetail />
      </BrowserRouter>
    );

    const startBtn = await screen.findByText(/Start Assignment/i);

    fireEvent.click(startBtn);

    const file = new File(
      ["hello"],
      "assignment.pdf",
      { type: "application/pdf" }
    );

    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const submitBtn = screen.getByText(/Submit Assignment/i);

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(axios.post).toHaveBeenCalled();

    });
  });

});