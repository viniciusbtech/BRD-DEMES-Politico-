import { createBrowserRouter, redirect } from "react-router";
import IntroPage from "../pages/IntroPage";
import HomePage from "../pages/HomePage";
import DeputadoPage from "../pages/DeputadoPage";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/intro"),
  },
  {
    path: "/intro",
    Component: IntroPage,
  },
  {
    path: "/home",
    Component: HomePage,
  },
  {
    path: "/deputado",
    Component: DeputadoPage,
  },
]);
