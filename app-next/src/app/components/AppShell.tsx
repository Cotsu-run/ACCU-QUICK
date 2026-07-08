"use client";

import { useState } from "react";
import Sidebar, { type PageId } from "./Sidebar";
import Hero from "./Hero";
import DocumentInspect from "./DocumentInspect";
import UsageHistory from "./UsageHistory";

export default function AppShell() {
  const [page, setPage] = useState<PageId>("docreview");
  return (
    <>
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main">
        {page === "usage" ? (
          <UsageHistory />
        ) : (
          <>
            <Hero />
            <DocumentInspect />
          </>
        )}
      </main>
    </>
  );
}
