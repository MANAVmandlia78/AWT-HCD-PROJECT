import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudentQuiz from "../StudentQuiz";
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
  };
});

describe("StudentQuiz Component", () => {

  beforeEach(() => {

    axios.get.mockImplementation((url) => {

      // result check API
      if (url.includes("/result")) {
        return Promise.resolve({
          data: {
            attempted: false,
          },
        });
      }

      // quiz fetch API
      return Promise.resolve({
        data: [
          {
            id: 1,
            question_text: "What is 2 + 2?",
            option_a: "3",
            option_b: "4",
            option_c: "5",
            option_d: "6",
            image_url: "https://fakeimg.com/test.png",
          },
        ],
      });
    });

    axios.post.mockResolvedValue({
      data: {
        score: 8,
      },
    });
  });

  test("renders loading state initially", () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Loading quiz/i)
    ).toBeInTheDocument();
  });

  test("renders quiz questions", async () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/What is 2 \+ 2/i)
    ).toBeInTheDocument();
  });

  test("option selection works", async () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    const option = await screen.findByDisplayValue("B");

    fireEvent.click(option);

    expect(option.checked).toBe(true);
  });

  test("submit quiz works", async () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    const option = await screen.findByDisplayValue("B");

    fireEvent.click(option);

    const submitBtn = screen.getByRole("button", {
      name: /Submit Quiz/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(
        screen.getByText(/Quiz Completed/i)
      ).toBeInTheDocument();

    });
  });

  test("score displays after submission", async () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    const option = await screen.findByDisplayValue("B");

    fireEvent.click(option);

    const submitBtn = screen.getByRole("button", {
      name: /Submit Quiz/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(
        screen.getByText("8")
      ).toBeInTheDocument();

    });
  });

  test("image lightbox opens", async () => {

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    const image = await screen.findByAltText(
      /Question reference/i
    );

    fireEvent.click(image);

    expect(
  screen.getAllByAltText(/Reference/i).length
).toBeGreaterThan(1);
  });

  test("already attempted quiz flow works", async () => {

    axios.get.mockImplementation((url) => {

      if (url.includes("/result")) {
        return Promise.resolve({
          data: {
            attempted: true,
            score: 9,
          },
        });
      }

      return Promise.resolve({
        data: [],
      });
    });

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Quiz Completed/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("9")
    ).toBeInTheDocument();
  });

  test("empty quiz state works", async () => {

    axios.get.mockImplementation((url) => {

      if (url.includes("/result")) {
        return Promise.resolve({
          data: {
            attempted: false,
          },
        });
      }

      return Promise.resolve({
        data: [],
      });
    });

    render(
      <BrowserRouter>
        <StudentQuiz />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/No questions found/i)
    ).toBeInTheDocument();
  });

});