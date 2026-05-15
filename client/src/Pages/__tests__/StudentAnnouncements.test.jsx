import { render, screen } from "@testing-library/react";
import StudentAnnouncements from "../../Components/StudentAnnouncements";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

// Mock router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({
      id: "101",
    }),
  };
});

describe("StudentAnnouncements Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Exam Notice",
          message: "Exam on Monday",
          course_name: "Web Development",
          teacher_name: "Prof. John",
          created_at: "2026-05-09T10:00:00Z",
        },
      ],
    });
  });

  test("renders announcements page", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Course Announcements/i)
    ).toBeInTheDocument();
  });

  test("fetches announcement title", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Exam Notice/i)
    ).toBeInTheDocument();
  });

  test("fetches announcement message", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Exam on Monday/i)
    ).toBeInTheDocument();
  });

  test("shows course name", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Web Development/i)
    ).toBeInTheDocument();
  });

  test("shows teacher name", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Prof. John/i)
    ).toBeInTheDocument();
  });

  test("shows empty announcement state", async () => {

    axios.get.mockResolvedValue({
      data: [],
    });

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(
        /No announcements for this course/i
      )
    ).toBeInTheDocument();
  });

  test("back button renders", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
        name: /Back/i,
      })
    ).toBeInTheDocument();
  });

  test("API gets called correctly", async () => {

    render(
      <BrowserRouter>
        <StudentAnnouncements />
      </BrowserRouter>
    );

    expect(axios.get).toHaveBeenCalled();
  });

});