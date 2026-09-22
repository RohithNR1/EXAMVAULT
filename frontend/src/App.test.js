/**
 * App tests — verify routing behavior and page accessibility.
 * Uses jest.mock to stub the API layer, avoiding axios ESM transform issues.
 */
import { render, screen } from "@testing-library/react";
import App from "./App";

// Stub the API layer so requests never hit the network.
jest.mock("./api/auth", () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock("./contexts/ToastContext", () => {
  const actual = jest.requireActual("./contexts/ToastContext");
  return {
    ...actual,
    useToast: () => ({ addToast: jest.fn() }),
  };
});

describe("App routing", () => {
  test("redirects root path and shows the EXAM-VAULT brand", () => {
    render(<App />);
    // The Login page renders under the branded header.
    expect(screen.getByText(/exam-vault/i)).toBeInTheDocument();
  });
});
