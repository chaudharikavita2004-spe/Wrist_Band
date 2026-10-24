// Desktop entry: renders the same pages as the website, fully offline.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";

import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "../src/styles.css";

import { routeTree } from "../src/routeTree.gen";
import { Route as RootRoute } from "../src/routes/__root";

// The website's HTML shell and web-only head tags (online fonts, social cards)
// are not used on the desktop; this window already has its own page.
RootRoute.update({
  shellComponent: ({ children }: { children: ReactNode }) => <>{children}</>,
  head: () => ({ meta: [{ title: "Wrist Band" }] }),
} as never);

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  context: { queryClient },
  // Hash URLs work when pages are loaded from disk.
  history: createHashHistory(),
  scrollRestoration: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
