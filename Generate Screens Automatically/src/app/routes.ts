import { createBrowserRouter, redirect } from "react-router";
import IntroPage from "../pages/IntroPage";
import HomePage from "../pages/HomePage";
import DeputadoPage from "../pages/DeputadoPage";
import PartidosPage from "../pages/PartidosPage";
import PanoramaPage from "../pages/PanoramaPage";
import GastosSociaisPage from "../pages/GastosSociaisPage";
import FornecedoresPage from "../pages/FornecedoresPage";
import InfluenciaPage from "../pages/InfluenciaPage";
import ComportamentoPage from "../pages/ComportamentoPage";
import EscolaridadePage from "../pages/EscolaridadePage";
import NotFound from "./NotFound";

export const router = createBrowserRouter([
  { path: "/",          loader: () => redirect("/intro") },
  { path: "/intro",     Component: IntroPage },
  { path: "/home",      Component: HomePage },
  { path: "/panorama",  Component: PanoramaPage },
  { path: "/deputado",  Component: DeputadoPage },
  { path: "/partidos",       Component: PartidosPage },
  { path: "/gastos-sociais",  Component: GastosSociaisPage },
  { path: "/fornecedores",    Component: FornecedoresPage },
  { path: "/influencia",       Component: InfluenciaPage },
  { path: "/comportamento",   Component: ComportamentoPage },
  { path: "/escolaridade",    Component: EscolaridadePage },
  { path: "*",                Component: NotFound },
]);
