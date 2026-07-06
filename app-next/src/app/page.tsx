import Sidebar from "./components/Sidebar";
import Hero from "./components/Hero";
import DocumentInspect from "./components/DocumentInspect";

export default function Home() {
  return (
    <>
      <Sidebar />
      <main className="main">
        <Hero />
        <DocumentInspect />
      </main>
    </>
  );
}
