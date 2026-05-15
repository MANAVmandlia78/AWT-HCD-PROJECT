import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeacherAnnouncements from "../../Components/TeacherAnnouncements";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

// Mock router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("TeacherAnnouncements Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Web Development",
        },
        {
          id: 2,
          title: "Machine Learning",
        },
      ],
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    window.alert = vi.fn();
  });

  test("renders announcements page", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    expect(
      document.querySelector(".announcements-page-title")
    ).toBeInTheDocument();
  });

  test("fetches courses correctly", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    expect(
      await screen.findByText("Web Development")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Machine Learning")
    ).toBeInTheDocument();
  });

  test("title input works", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Announcement title/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "Exam Notice",
      },
    });

    expect(titleInput.value).toBe("Exam Notice");
  });

  test("message textarea works", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    const messageBox = screen.getByPlaceholderText(
      /Write your message/i
    );

    fireEvent.change(messageBox, {
      target: {
        value: "Exam on Monday",
      },
    });

    expect(messageBox.value).toBe("Exam on Monday");
  });

  test("course selection works", async () => {

  render(
    <BrowserRouter>
      <TeacherAnnouncements />
    </BrowserRouter>
  );

  // wait for courses to load
  await screen.findByText("Web Development");

  const select = screen.getByRole("combobox");

  fireEvent.change(select, {
    target: {
      value: "1",
    },
  });

  expect(select.value).toBe("1");
});

  test("announcement submission works", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Announcement title/i
    );

    const messageBox = screen.getByPlaceholderText(
      /Write your message/i
    );

    const select = screen.getByDisplayValue(
      /Select a course/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "Exam Notice",
      },
    });

    fireEvent.change(messageBox, {
      target: {
        value: "Exam on Monday",
      },
    });

    fireEvent.change(select, {
      target: {
        value: "1",
      },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Post Announcement/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(axios.post).toHaveBeenCalled();

    });
  });

  test("form resets after submission", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(
      /Announcement title/i
    );

    const messageBox = screen.getByPlaceholderText(
      /Write your message/i
    );

    const select = screen.getByDisplayValue(
      /Select a course/i
    );

    fireEvent.change(titleInput, {
      target: {
        value: "Exam Notice",
      },
    });

    fireEvent.change(messageBox, {
      target: {
        value: "Exam on Monday",
      },
    });

    fireEvent.change(select, {
      target: {
        value: "1",
      },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Post Announcement/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(titleInput.value).toBe("");
      expect(messageBox.value).toBe("");
      expect(select.value).toBe("");

    });
  });

  test("success alert appears", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole("button", {
      name: /Post Announcement/i,
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {

      expect(window.alert).toHaveBeenCalled();

    });
  });

  test("back button renders", async () => {

    render(
      <BrowserRouter>
        <TeacherAnnouncements />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
        name: /Back/i,
      })
    ).toBeInTheDocument();
  });

});