import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeacherQuiz from "../TeacherQuiz";
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
      Promise.resolve("https://fakeurl.com/image.png")
    ),
  };
});

// Mock URL preview
global.URL.createObjectURL = vi.fn(() => "preview-url");
global.URL.revokeObjectURL = vi.fn();

describe("TeacherQuiz Component", () => {

  beforeEach(() => {

    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    window.alert = vi.fn();
  });

  test("renders quiz page", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    expect(
      screen.getByText((content, element) => {
  return element?.className === "teacherquiz-title";
})
    ).toBeInTheDocument();
  });

  test("quiz title input works", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      /Enter quiz title/i
    );

    fireEvent.change(input, {
      target: {
        value: "Math Quiz",
      },
    });

    expect(input.value).toBe("Math Quiz");
  });

  test("question inputs work", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const questionBoxes = screen.getAllByPlaceholderText(
      /Find the roots/i
    );

    fireEvent.change(questionBoxes[0], {
      target: {
        value: "What is 2 + 2?",
      },
    });

    expect(questionBoxes[0].value)
      .toBe("What is 2 + 2?");
  });

  test("option inputs work", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const optionA = screen.getAllByPlaceholderText(
      /Option A/i
    )[0];

    fireEvent.change(optionA, {
      target: {
        value: "4",
      },
    });

    expect(optionA.value).toBe("4");
  });

  test("latex preview button works", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const previewButtons = document.querySelectorAll(
  ".preview-toggle-btn"
);

    fireEvent.click(previewButtons[0]);

    expect(
      document.querySelector(".latex-preview-panel")
    ).toBeInTheDocument();
  });

  test("latex equations render correctly", async () => {

  render(
    <BrowserRouter>
      <TeacherQuiz />
    </BrowserRouter>
  );

  const questionBoxes = screen.getAllByPlaceholderText(
    /Find the roots/i
  );

  fireEvent.change(questionBoxes[0], {
    target: {
      value: "$x^2 + y^2 = z^2$",
    },
  });

  const previewButtons = document.querySelectorAll(
    ".preview-toggle-btn"
  );

  fireEvent.click(previewButtons[0]);

  await waitFor(() => {

    expect(
      document.querySelector(".latex-preview-panel")
    ).not.toBeNull();

  });

});

  test("image upload works", async () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const file = new File(
      ["dummy image"],
      "test.png",
      {
        type: "image/png",
      }
    );

    const fileInputs = document.querySelectorAll(
      'input[type="file"]'
    );

    fireEvent.change(fileInputs[0], {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {

      expect(
        screen.getByText(/Upload complete/i)
      ).toBeInTheDocument();

    });
  });

  test("remove image works", async () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const file = new File(
      ["dummy image"],
      "test.png",
      {
        type: "image/png",
      }
    );

    const fileInputs = document.querySelectorAll(
      'input[type="file"]'
    );

    fireEvent.change(fileInputs[0], {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {

      expect(
        screen.getByText(/Upload complete/i)
      ).toBeInTheDocument();

    });

    const removeBtn = screen.getByText(/Remove/i);

    fireEvent.click(removeBtn);

    expect(
      screen.queryByText(/Upload complete/i)
    ).not.toBeInTheDocument();
  });

  test("question count changes to 20", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const select = screen.getByDisplayValue(
      /10 Questions/i
    );

    fireEvent.change(select, {
      target: {
        value: "20",
      },
    });

    const questions = screen.getAllByText(
      /Question/i
    );

    expect(questions.length)
      .toBeGreaterThan(10);
  });

  test("question count changes to 30", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const select = screen.getByDisplayValue(
      /10 Questions/i
    );

    fireEvent.change(select, {
      target: {
        value: "30",
      },
    });

    const questions = screen.getAllByText(
      /Question/i
    );

    expect(questions.length)
      .toBeGreaterThan(20);
  });

  test("quiz title validation works", () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const createBtn = screen.getByRole("button", {
      name: /Create Quiz/i,
    });

    fireEvent.click(createBtn);

    expect(window.alert).toHaveBeenCalled();
  });

  test("submit button shows creating state", async () => {

    axios.post.mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: {} }), 500)
      )
    );

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Enter quiz title/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "Physics Quiz",
      },
    });

    const createBtn = screen.getByRole("button", {
      name: /Create Quiz/i,
    });

    fireEvent.click(createBtn);

    expect(
      screen.getByText(/Creating/i)
    ).toBeInTheDocument();
  });

  test("quiz creation API works", async () => {

    render(
      <BrowserRouter>
        <TeacherQuiz />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Enter quiz title/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "Physics Quiz",
      },
    });

    const createBtn = screen.getByRole("button", {
      name: /Create Quiz/i,
    });

    fireEvent.click(createBtn);

    await waitFor(() => {

      expect(axios.post).toHaveBeenCalled();

    });
  });

});