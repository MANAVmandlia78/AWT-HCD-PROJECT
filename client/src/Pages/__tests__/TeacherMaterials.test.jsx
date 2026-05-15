import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import TeacherMaterials from "../TeacherMaterials";
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

        setTimeout(() => {
          successCallback();
        }, 100);
      },

      snapshot: {
        ref: {},
      },
    })),

    getDownloadURL: vi.fn(() =>
      Promise.resolve(
        "https://fakeurl.com/material.pdf"
      )
    ),
  };
});

describe("TeacherMaterials Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Week 1 Slides",
          description: "Introduction",
          file_name: "slides.pdf",
          file_type: "pdf",
          file_url: "https://fakeurl.com/slides.pdf",
          created_at: "2026-05-09T10:00:00Z",
        },
      ],
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    axios.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  test("renders materials page", async () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    expect(
      document.querySelector(".materials-page-title")
    ).toBeInTheDocument();
  });

  test("fetches uploaded materials", async () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Week 1 Slides/i)
    ).toBeInTheDocument();
  });

  test("title input works", () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      /Week 3 - Lecture Slides/i
    );

    fireEvent.change(input, {
      target: {
        value: "DBMS Notes",
      },
    });

    expect(input.value).toBe("DBMS Notes");
  });

  test("description input works", () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText(
      /Brief description/i
    );

    fireEvent.change(textarea, {
      target: {
        value: "Normalization Notes",
      },
    });

    expect(textarea.value)
      .toBe("Normalization Notes");
  });

  test("file selection works", () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const file = new File(
      ["dummy"],
      "notes.pdf",
      {
        type: "application/pdf",
      }
    );

    const input = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText(/notes.pdf/i)
    ).toBeInTheDocument();
  });

  test("upload button gets enabled", () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Week 3 - Lecture Slides/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "React Notes",
      },
    });

    const file = new File(
      ["dummy"],
      "react.pdf",
      {
        type: "application/pdf",
      }
    );

    const input = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const uploadBtn = screen.getByRole("button", {
      name: /Upload Material/i,
    });

    expect(uploadBtn).not.toBeDisabled();
  });

  test("progress bar appears while uploading", async () => {

  render(
    <BrowserRouter>
      <TeacherMaterials />
    </BrowserRouter>
  );

  const titleInput = screen.getByPlaceholderText(
    /Week 3 - Lecture Slides/i
  );

  fireEvent.change(titleInput, {
    target: {
      value: "React Notes",
    },
  });

  const file = new File(
    ["dummy"],
    "react.pdf",
    {
      type: "application/pdf",
    }
  );

  const input = document.querySelector(
    'input[type="file"]'
  );

  fireEvent.change(input, {
    target: {
      files: [file],
    },
  });

  // verify button enabled first
  const uploadBtn = screen.getByRole("button", {
    name: /Upload Material/i,
  });

  expect(uploadBtn).not.toBeDisabled();

  fireEvent.click(uploadBtn);

  // instead of searching text
  await waitFor(() => {

    expect(
      document.querySelector(".mat-progress-wrap")
    ).not.toBeNull();

  });

});

  test("material upload API works", async () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Week 3 - Lecture Slides/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "React Notes",
      },
    });

    const file = new File(
      ["dummy"],
      "react.pdf",
      {
        type: "application/pdf",
      }
    );

    const input = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const uploadBtn = screen.getByRole("button", {
      name: /Upload Material/i,
    });

    fireEvent.click(uploadBtn);

    await waitFor(() => {

      expect(axios.post)
        .toHaveBeenCalled();

    });
  });

  test("delete material works", async () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    const deleteBtn = await screen.findByRole(
      "button",
      {
        name: /Delete/i,
      }
    );

    fireEvent.click(deleteBtn);

    await waitFor(() => {

      expect(axios.delete)
        .toHaveBeenCalled();

    });
  });

  test("empty materials state works", async () => {

    axios.get.mockResolvedValue({
      data: [],
    });

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(
        /No materials uploaded yet/i
      )
    ).toBeInTheDocument();
  });

  test("back button renders", () => {

    render(
      <BrowserRouter>
        <TeacherMaterials />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
        name: /Back/i,
      })
    ).toBeInTheDocument();
  });

});