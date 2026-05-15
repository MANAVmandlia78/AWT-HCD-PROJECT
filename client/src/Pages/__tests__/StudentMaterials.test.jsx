import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import StudentMaterials from "../StudentMaterials";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

// Mock router
vi.mock("react-router-dom", async () => {

  const actual = await vi.importActual(
    "react-router-dom"
  );

  return {
    ...actual,

    useParams: () => ({
      id: "101",
    }),

    useNavigate: () => vi.fn(),
  };
});

describe("StudentMaterials Component", () => {

  beforeEach(() => {

    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Week 1 Slides",
          description: "Introduction to React",
          file_name: "slides.pdf",
          file_type: "pdf",
          file_url: "https://fakeurl.com/slides.pdf",
          teacher_name: "Prof. John",
          created_at: "2026-05-09T10:00:00Z",
        },
      ],
    });
  });

  test("shows loading state initially", () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Loading materials/i)
    ).toBeInTheDocument();
  });

  test("fetches materials correctly", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Week 1 Slides/i)
    ).toBeInTheDocument();
  });

  test("shows material description", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(
        /Introduction to React/i
      )
    ).toBeInTheDocument();
  });

  test("shows teacher name", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Prof. John/i)
    ).toBeInTheDocument();
  });

  test("shows PDF badge", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/PDF/i)
    ).toBeInTheDocument();
  });

  test("open button renders", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByRole("link", {
        name: /Open/i,
      })
    ).toBeInTheDocument();
  });

  test("back button renders", () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("button", {
        name: /Back/i,
      })
    ).toBeInTheDocument();
  });

  test("empty materials state works", async () => {

    axios.get.mockResolvedValue({
      data: [],
    });

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(
        /No materials uploaded yet/i
      )
    ).toBeInTheDocument();
  });

  test("API gets called", async () => {

    render(
      <BrowserRouter>
        <StudentMaterials />
      </BrowserRouter>
    );

    await waitFor(() => {

      expect(axios.get)
        .toHaveBeenCalled();

    });
  });

});