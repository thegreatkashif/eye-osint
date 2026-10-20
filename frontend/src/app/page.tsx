
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createInvestigation,
  listInvestigations,
  type Investigation,
} from "@/lib/api";

type FeedEvent = {
  time: string;
  type: string;
  message: string;
  color: "green" | "amber" | "red";
};

const modules = [
  {
    icon: "⌘",
    title: "Domain Recon",
    code: "RECON-01",
    description: "DNS records, WHOIS, certificates and subdomains.",
  },
  {
    icon: "◎",
    title: "IP Intelligence",
    code: "NET-02",
    description: "Public IP metadata and network intelligence.",
  },
  {
    icon: "◉",
    title: "Identity Search",
    code: "IDENT-03",
    description: "Discover publicly accessible profiles.",
  },
  {
    icon: "⌖",
    title: "Geospatial Intel",
    code: "GEO-04",
    description: "Explore authorized geospatial datasets.",
  },
  {
    icon: "⬡",
    title: "Evidence Vault",
    code: "EVID-05",
    description: "Preserve findings, hashes and source provenance.",
  },
  {
    icon: "⟁",
    title: "Link Analysis",
    code: "GRAPH-06",
    description: "Explore relationships between collected entities.",
  },
];

function getTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export default function Home() {
  const [clock, setClock] = useState("--:--:--");
  const [target, setTarget] = useState("");
  const [targetType, setTargetType] = useState("DOMAIN");
  const [activeTab, setActiveTab] = useState("NETWORK");
  const [activeModule, setActiveModule] = useState("");
  const [events, setEvents] = useState<FeedEvent[]>([
    {
      time: "BOOT",
      type: "SYSTEM",
      message: "EYE workspace initialized",
      color: "green",
    },
    {
      time: "BOOT",
      type: "API",
      message: "Checking backend connectivity",
      color: "amber",
    },
  ]);
  const [notice, setNotice] = useState("");
  const [apiStatus, setApiStatus] = useState<
    "CHECKING" | "ONLINE" | "OFFLINE"
  >("CHECKING");
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loadingInvestigations, setLoadingInvestigations] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const logEvent = useCallback(
    (type: string, message: string, color: FeedEvent["color"] = "red") => {
      setEvents((previous) =>
        [{ time: getTime(), type, message, color }, ...previous].slice(0, 8),
      );
    },
    [],
  );

  const refreshInvestigations = useCallback(async () => {
    setLoadingInvestigations(true);

    try {
      const data = await listInvestigations();
      setInvestigations(data);
      setApiStatus("ONLINE");
      return data;
    } catch (error) {
      setApiStatus("OFFLINE");
      setNotice(`API ERROR // ${getErrorMessage(error)}`);
      throw error;
    } finally {
      setLoadingInvestigations(false);
    }
  }, []);

  useEffect(() => {
    const tick = () => setClock(getTime());

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const data = await listInvestigations();

        if (!cancelled) {
          setInvestigations(data);
          setApiStatus("ONLINE");
          setEvents((previous) =>
            [
              {
                time: getTime(),
                type: "API",
                message: `Backend connected // ${data.length} cases loaded`,
                color: "green" as const,
              },
              ...previous,
            ].slice(0, 8),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setApiStatus("OFFLINE");
          setNotice(`API OFFLINE // ${getErrorMessage(error)}`);
          setEvents((previous) =>
            [
              {
                time: getTime(),
                type: "API",
                message: getErrorMessage(error),
                color: "amber" as const,
              },
              ...previous,
            ].slice(0, 8),
          );
        }
      } finally {
        if (!cancelled) setLoadingInvestigations(false);
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = target.trim();

    if (!value) {
      setNotice("ERROR // TARGET IDENTIFIER REQUIRED");
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setNotice("CONTACTING EYE API // CREATING INVESTIGATION");

    try {
      const created = await createInvestigation({
        title: `${targetType}: ${value}`,
        description:
          `Target: ${value}\n` +
          `Target type: ${targetType}\n` +
          "Created from the EYE dashboard. Reconnaissance has not yet run.",
        status: "open",
      });

      setInvestigations((previous) =>
        [created, ...previous.filter((item) => item.id !== created.id)].slice(
          0,
          50,
        ),
      );

      setApiStatus("ONLINE");
      setTarget("");
      setNotice(`INVESTIGATION CREATED // CASE #${created.id}`);
      logEvent("API", `Case #${created.id} created: ${created.title}`, "green");
    } catch (error) {
      const message = getErrorMessage(error);
      setNotice(`CREATE FAILED // ${message}`);
      logEvent("API", message, "amber");
    } finally {
      setSubmitting(false);
    }
  }

  function navigate(tab: string) {
    setActiveTab(tab);
    setActiveModule("");
  }

  async function handleRefresh() {
    try {
      const data = await refreshInvestigations();
      setNotice(`SYNC COMPLETE // ${data.length} CASES LOADED`);
      logEvent("API", "Investigation list refreshed", "green");
    } catch (error) {
      logEvent("API", getErrorMessage(error), "amber");
    }
  }

  return (
    <main className="eye">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Rajdhani:wght@400;500;600;700&display=swap");

        :root {
          color-scheme: dark;
          --bg: #080908;
          --line: rgba(177, 191, 169, 0.16);
          --muted: #73796d;
          --text: #d1d1c7;
          --red: #ff573e;
          --green: #83d68b;
          --amber: #d69a5e;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: "Rajdhani", sans-serif;
        }
        button, input, select { font: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: wait; opacity: .65; }

        .eye {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 28%, rgba(65, 76, 60, .15), transparent 48%),
            radial-gradient(ellipse at 82% 23%, rgba(119, 34, 19, .15), transparent 35%),
            #080908;
          position: relative;
          isolation: isolate;
        }
        .eye::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .25;
          background-image:
            linear-gradient(rgba(200, 215, 194, .035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 215, 194, .035) 1px, transparent 1px);
          background-size: 36px 36px;
        }
        .eye::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 20;
          pointer-events: none;
          opacity: .1;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0, 0, 0, .32) 4px
          );
        }
        .frame {
          position: relative;
          margin: 12px;
          min-height: calc(100vh - 24px);
          border: 1px solid rgba(190, 201, 181, .19);
        }
        .frame-corner {
          position: absolute;
          width: 19px;
          height: 19px;
          z-index: 5;
          pointer-events: none;
          border-color: rgba(255, 88, 62, .62);
        }
        .topbar {
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 19px 28px;
          border-bottom: 1px solid rgba(200, 210, 190, .09);
          background: rgba(7, 9, 7, .55);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 210px;
          padding: 0;
          border: 0;
          background: transparent;
          text-align: left;
        }
        .brand-icon {
          color: #c6c9bb;
          font-size: 39px;
          line-height: 1;
          text-shadow: 0 0 18px rgba(255, 255, 235, .13);
        }
        .brand-name {
          color: #d5d6cc;
          font-family: "Barlow Condensed", sans-serif;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: .12em;
          line-height: .9;
        }
        .brand-sub {
          margin-top: 7px;
          color: #6e796b;
          font-family: "IBM Plex Mono", monospace;
          font-size: 8px;
          letter-spacing: .17em;
        }
        .nav {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: clamp(13px, 2.4vw, 35px);
        }
        .nav button {
          padding: 10px 0;
          border: 0;
          background: transparent;
          color: #95664f;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .04em;
          transition: color .2s, text-shadow .2s;
        }
        .nav button:nth-child(1) { color: #d84e42; }
        .nav button:nth-child(3) { color: #c7834b; }
        .nav button:nth-child(4) { color: #7c9875; }
        .nav button:hover, .nav button.active {
          color: #ffe0ce;
          text-shadow: 0 0 15px rgba(255, 80, 50, .4);
        }
        .connect {
          min-width: 120px;
          padding: 13px 20px;
          border: 1px solid rgba(255, 91, 67, .75);
          background: linear-gradient(135deg, #24100d, #130c0b);
          color: #e1d7ce;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .12em;
          clip-path: polygon(7% 0, 100% 0, 100% 78%, 91% 100%, 0 100%, 0 20%);
        }
        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 270px;
          min-height: calc(100vh - 175px);
        }
        .hero {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 0;
          min-height: 690px;
          padding: clamp(42px, 7vw, 105px) clamp(24px, 8vw, 125px);
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 64% 37%, rgba(105, 116, 95, .17), transparent 38%),
            radial-gradient(ellipse at 78% 50%, rgba(255, 80, 43, .09), transparent 30%),
            linear-gradient(90deg, transparent 55%, rgba(0, 0, 0, .16));
        }
        .arch {
          position: absolute;
          top: 5%;
          left: 57%;
          width: 42%;
          height: 68%;
          border: 1px solid rgba(161, 175, 148, .15);
          border-bottom: 0;
          border-radius: 50% 50% 0 0;
          transform: translateX(-50%);
          box-shadow: inset 0 0 50px rgba(120, 140, 112, .035);
        }
        .arch::before {
          content: "";
          position: absolute;
          inset: 12px 12px 0;
          border: 1px solid rgba(161, 175, 148, .1);
          border-bottom: 0;
          border-radius: 50% 50% 0 0;
        }
        .embers { position: absolute; inset: 0; overflow: hidden; }
        .ember {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #ff6944;
          box-shadow: 0 0 10px 2px rgba(255, 81, 42, .45);
          animation: ember 6s ease-in-out infinite;
        }
        @keyframes ember {
          0%, 100% { transform: translate(0, 0); opacity: .2; }
          50% { transform: translate(13px, -23px); opacity: 1; }
        }
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 830px;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          color: #b47c5e;
          font-family: "IBM Plex Mono", monospace;
          font-size: 10px;
          letter-spacing: .16em;
        }
        .eyebrow::before {
          content: "";
          width: 25px;
          height: 1px;
          background: var(--red);
          box-shadow: 0 0 10px rgba(255, 70, 45, .55);
        }
        .headline {
          margin: 0;
          color: #d0d0c6;
          font-family: "Barlow Condensed", sans-serif;
          font-size: clamp(51px, 6.4vw, 96px);
          font-weight: 900;
          line-height: .92;
          letter-spacing: -.015em;
          text-transform: uppercase;
          text-shadow: 0 4px 0 rgba(0, 0, 0, .4);
        }
        .headline .red {
          color: #ff654a;
          text-shadow: 0 0 30px rgba(255, 65, 40, .12);
        }
        .hero-copy {
          margin: 24px 0 0;
          color: #bcbcb2;
          font-family: "IBM Plex Mono", monospace;
          font-size: clamp(13px, 1.55vw, 19px);
          line-height: 1.7;
        }
        .target-form {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 12px;
          max-width: 780px;
          margin-top: 28px;
        }
        .target-box {
          display: flex;
          flex: 1 1 340px;
          min-width: 0;
          min-height: 56px;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border: 1px solid rgba(205, 211, 196, .56);
          background: rgba(5, 7, 6, .86);
          box-shadow: inset 0 0 22px rgba(0, 0, 0, .45);
        }
        .target-box:focus-within {
          border-color: #ff644a;
          box-shadow: 0 0 20px rgba(255, 68, 42, .08), inset 0 0 22px rgba(0, 0, 0, .45);
        }
        .prompt {
          flex-shrink: 0;
          color: #80d68b;
          font-family: "IBM Plex Mono", monospace;
          font-size: 11px;
        }
        .target-input {
          width: 100%;
          min-width: 0;
          padding: 16px 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #f1e7d9;
          font-family: "IBM Plex Mono", monospace;
          font-size: 12px;
        }
        .target-input::placeholder { color: #777b70; }
        .target-select {
          width: 105px;
          flex-shrink: 0;
          padding: 10px 2px 10px 8px;
          border: 0;
          border-left: 1px solid rgba(255, 255, 255, .1);
          outline: none;
          background: #0b0d0b;
          color: #c2c4b8;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
        }
        .initiate {
          flex: 0 1 230px;
          min-height: 56px;
          padding: 0 19px;
          border: 1px solid #ff654a;
          background: linear-gradient(115deg, #38140e, #712719 50%, #33100b);
          color: #f5e6da;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .035em;
          clip-path: polygon(0 0, 95% 0, 100% 20%, 100% 80%, 94% 100%, 0 100%);
          box-shadow: inset 0 0 16px rgba(255, 70, 42, .2), 0 0 18px rgba(255, 65, 40, .08);
        }
        .initiate:hover:not(:disabled) { filter: brightness(1.25); }
        .notice {
          min-height: 20px;
          margin-top: 12px;
          color: #d28c70;
          font-family: "IBM Plex Mono", monospace;
          font-size: 10px;
          overflow-wrap: anywhere;
        }
        .micro {
          margin-top: 10px;
          color: #73796c;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
          line-height: 1.9;
          letter-spacing: .035em;
        }
        .console {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          padding: 20px 15px;
          border-left: 1px solid rgba(200, 210, 190, .11);
          background: rgba(5, 7, 5, .62);
        }
        .monitor {
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(166, 180, 157, .24);
          background: linear-gradient(145deg, rgba(26, 29, 25, .72), rgba(8, 10, 8, .9));
        }
        .monitor-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 10px;
          border-bottom: 1px solid rgba(160, 174, 150, .17);
          background: rgba(155, 166, 143, .065);
          color: #b5b8aa;
          font-family: "IBM Plex Mono", monospace;
          font-size: 10px;
          letter-spacing: .045em;
        }
        .monitor-led { color: #72a572; font-size: 8px; }
        .monitor-body { padding: 10px; }
        .feed {
          display: grid;
          grid-template-columns: 51px minmax(0, 1fr);
          gap: 7px;
          margin-bottom: 9px;
          font-family: "IBM Plex Mono", monospace;
          font-size: 8px;
          line-height: 1.55;
        }
        .feed-time { color: #657763; }
        .feed-message { overflow-wrap: anywhere; }
        .green { color: #82bb7c; }
        .amber { color: #d2a16d; }
        .red { color: #d56e58; }
        .telemetry {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          font-family: "IBM Plex Mono", monospace;
          font-size: 8px;
          line-height: 1.5;
        }
        .telemetry span:nth-child(odd) { color: #7c8377; }
        .telemetry span:nth-child(even) { color: #cb906e; text-align: right; }
        .map-grid {
          position: relative;
          height: 100px;
          overflow: hidden;
          background:
            repeating-linear-gradient(0deg, transparent 0 13px, rgba(116, 153, 111, .07) 14px),
            repeating-linear-gradient(90deg, transparent 0 13px, rgba(116, 153, 111, .07) 14px),
            #0a100d;
        }
        .land {
          position: absolute;
          border: 1px solid rgba(119, 153, 110, .24);
          background: rgba(73, 109, 75, .1);
          clip-path: polygon(9% 19%, 27% 4%, 46% 18%, 61% 9%, 80% 30%, 74% 51%, 93% 66%, 69% 88%, 48% 72%, 30% 88%, 15% 60%, 4% 45%);
        }
        .map-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff6348;
          box-shadow: 0 0 8px 2px rgba(255, 65, 40, .55);
        }
        .section {
          padding: 32px clamp(18px, 4vw, 40px);
          border-top: 1px solid rgba(200, 210, 190, .08);
        }
        .section-heading {
          display: flex;
          flex-wrap: wrap;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-kicker {
          color: #ff654a;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
          letter-spacing: .2em;
        }
        .section-title {
          margin-top: 8px;
          color: #d1d1c7;
          font-size: 25px;
          font-weight: 700;
        }
        .case-grid, .module-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .case-card, .module-card {
          min-width: 0;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, .1);
          background: rgba(13, 16, 13, .9);
        }
        .case-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          font-family: "IBM Plex Mono", monospace;
          font-size: 10px;
        }
        .case-id { color: #ff654a; }
        .case-status { color: #82bb7c; text-transform: uppercase; }
        .case-title {
          margin-top: 15px;
          color: #e0e0d7;
          font-size: 19px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .case-description {
          margin-top: 8px;
          color: #8b8d82;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-line;
          overflow-wrap: anywhere;
        }
        .case-date {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, .07);
          color: #73796c;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
        }
        .empty {
          border: 1px solid rgba(255, 255, 255, .1);
          background: rgba(13, 16, 13, .9);
          padding: 20px;
          color: #858a7d;
          font-family: "IBM Plex Mono", monospace;
          font-size: 11px;
          overflow-wrap: anywhere;
        }
        .module-card {
          text-align: left;
          transition: border-color .2s, transform .2s, background .2s;
        }
        .module-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 87, 62, .5);
          background: #151714;
        }
        .module-card.selected { border-color: rgba(255, 87, 62, .65); }
        .module-icon { color: #ff654a; font-size: 25px; }
        .module-code {
          color: #73796c;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
        }
        .module-title {
          margin-top: 18px;
          color: #e0e0d7;
          font-size: 18px;
          font-weight: 700;
        }
        .module-description {
          min-height: 44px;
          margin-top: 7px;
          color: #858a7d;
          font-size: 13px;
          line-height: 1.6;
        }
        .module-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, .07);
          color: #bd8b43;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
        }
        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px 20px;
          min-height: 49px;
          padding: 12px 26px;
          border-top: 1px solid rgba(200, 210, 190, .14);
          background: rgba(3, 5, 4, .8);
          color: #858a7d;
          font-family: "IBM Plex Mono", monospace;
          font-size: 9px;
        }
        .footer-group { display: flex; flex-wrap: wrap; gap: 18px; }
        .credit { color: #8c9586; }
        .credit strong { color: #c5c7b9; font-weight: 500; }
        .status-red { color: #d45b49; }
        .status-green { color: #7db17c; }

        @media (max-width: 1100px) {
          .topbar { flex-wrap: wrap; }
          .nav { flex: 1; min-width: 260px; }
          .layout { grid-template-columns: minmax(0, 1fr) 235px; }
          .hero { padding: 55px 30px; }
          .headline { font-size: clamp(50px, 6vw, 70px); }
          .initiate { flex: 1 1 180px; }
          .case-grid, .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .frame { margin: 6px; }
          .topbar { padding: 18px; gap: 17px; }
          .brand { min-width: 0; }
          .brand-name { font-size: 31px; }
          .brand-icon { font-size: 31px; }
          .nav {
            order: 3;
            width: 100%;
            min-width: 0;
            justify-content: flex-start;
            gap: 19px;
          }
          .nav button { font-size: 12px; }
          .connect { margin-left: auto; min-width: 105px; padding: 11px 14px; font-size: 12px; }
          .layout { grid-template-columns: minmax(0, 1fr); }
          .hero { min-height: 600px; padding: 60px 22px; }
          .arch { left: 68%; width: 62%; }
          .headline { font-size: clamp(47px, 11vw, 74px); }
          .hero-copy { font-size: 13px; }
          .console {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            border-top: 1px solid rgba(200, 210, 190, .1);
            border-left: 0;
          }
          .initiate { flex-basis: 100%; }
          .footer { padding: 14px 16px; }
        }
        @media (max-width: 430px) {
          .nav { gap: 12px; }
          .nav button { font-size: 10px; }
          .hero { min-height: 570px; }
          .headline { font-size: 46px; }
          .prompt { font-size: 9px; }
          .target-box { gap: 7px; padding: 0 9px; }
          .target-select { width: 84px; font-size: 8px; }
          .console, .case-grid, .module-grid { grid-template-columns: minmax(0, 1fr); }
          .footer-group { gap: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="frame">
        <span
          className="frame-corner"
          style={{ top: 0, left: 0, borderTop: "1px solid", borderLeft: "1px solid" }}
        />
        <span
          className="frame-corner"
          style={{ top: 0, right: 0, borderTop: "1px solid", borderRight: "1px solid" }}
        />
        <span
          className="frame-corner"
          style={{ bottom: 0, left: 0, borderBottom: "1px solid", borderLeft: "1px solid" }}
        />
        <span
          className="frame-corner"
          style={{ bottom: 0, right: 0, borderBottom: "1px solid", borderRight: "1px solid" }}
        />

        <header className="topbar">
          <button
            className="brand"
            onClick={() => navigate("NETWORK")}
            aria-label="EYE home"
          >
            <span className="brand-icon">⛧</span>
            <span>
              <span className="brand-name block">EYE_VOID</span>
              <span className="brand-sub block">OPEN INTELLIGENCE SYSTEM</span>
            </span>
          </button>

          <nav className="nav" aria-label="Main navigation">
            {["NETWORK", "BREACH DATA", "ALGORITHMS", "TERMINAL"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => navigate(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button className="connect" onClick={() => void handleRefresh()}>
            {apiStatus === "CHECKING" ? "CHECKING" : "SYNC API"}
          </button>
        </header>

        <div className="layout">
          <section className="hero">
            <div className="hero-bg" aria-hidden="true">
              <div className="arch" />
              <div className="embers">
                {Array.from({ length: 27 }, (_, i) => (
                  <span
                    className="ember"
                    key={i}
                    style={{
                      left: `${5 + ((i * 37) % 90)}%`,
                      top: `${8 + ((i * 29) % 84)}%`,
                      animationDelay: `${-0.7 * (i % 7)}s`,
                      animationDuration: `${4 + (i % 5)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="hero-content">
              <div className="eyebrow">
                EYE INTELLIGENCE DIVISION / {clock}
              </div>

              <h1 className="headline">
                FROM THE
                <br />
                DEEPEST <span className="red">SHADOWS,</span>
                <br />
                NO DATA
                <br />
                IS SAFE.
              </h1>

              <p className="hero-copy">
                RECLAIM the unseen. Harness OSINT
                <br />
                from the digital underbelly.
              </p>

              <form className="target-form" onSubmit={submitTarget}>
                <div className="target-box">
                  <label className="prompt" htmlFor="eye-target">
                    [EYE@VOID:~]$
                  </label>

                  <input
                    id="eye-target"
                    className="target-input"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="ENTER TARGET OR IP..."
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={200}
                    disabled={submitting}
                  />

                  <select
                    className="target-select"
                    value={targetType}
                    onChange={(event) => setTargetType(event.target.value)}
                    aria-label="Target type"
                    disabled={submitting}
                  >
                    <option value="DOMAIN">DOMAIN</option>
                    <option value="PUBLIC IP">PUBLIC IP</option>
                    <option value="USERNAME">USERNAME</option>
                  </select>
                </div>

                <button className="initiate" type="submit" disabled={submitting}>
                  {submitting ? "CREATING CASE..." : "CREATE INVESTIGATION ↗"}
                </button>
              </form>

              <div className="notice" aria-live="polite">
                {notice}
              </div>

              <p className="micro">
  PUBLIC-SOURCE INTELLIGENCE ONLY.
  <br />
  NO PRIVATE SYSTEM ACCESS. NO UNAUTHORIZED TRACKING.
  <br />
  {activeTab} {"//"} API {apiStatus} {"//"} CASES:{" "}
  {investigations.length}
              </p>
            </div>
          </section>

          <aside className="console">
            <section className="monitor">
              <div className="monitor-head">
                <span>DATA FEEDS</span>
                <span className="monitor-led">●</span>
              </div>
              <div className="monitor-body">
                {events.slice(0, 5).map((item, index) => (
                  <div className="feed" key={`${item.time}-${item.type}-${index}`}>
                    <span className="feed-time">{item.time}</span>
                    <span className={`feed-message ${item.color}`}>
                      {item.type}: {item.message}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="monitor">
              <div className="monitor-head">
                <span>INTELLIGENCE LOG</span>
                <span className="monitor-led">●</span>
              </div>
              <div className="monitor-body">
                {[
                  "Investigation API integration enabled",
                  "Evidence provenance fields available",
                  "External intelligence providers not configured",
                  "No reconnaissance executed automatically",
                ].map((line, index) => (
                  <div className="feed" key={line}>
                    <span className="feed-time">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                    <span className="feed-message amber">{line}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="monitor">
              <div className="monitor-head">
                <span>NETWORK TELEMETRY</span>
                <span className="monitor-led">●</span>
              </div>
              <div className="monitor-body">
                <div className="telemetry">
                  <span>API STATUS</span>
                  <span className={apiStatus === "ONLINE" ? "green" : "amber"}>
                    {apiStatus}
                  </span>
                  <span>RECON ENGINE</span><span>NOT CONFIGURED</span>
                  <span>DATABASE CASES</span><span>{investigations.length}</span>
                  <span>AUTH STATUS</span><span>DEV ONLY</span>
                </div>
              </div>
            </section>

            <section className="monitor">
              <div className="monitor-head">
                <span>PING MAP / GEOINT</span>
                <span className="monitor-led">●</span>
              </div>
              <div className="map-grid" aria-label="Decorative map-style grid">
                <div className="land" style={{ left: "5%", top: "15%", width: "38%", height: "60%" }} />
                <div className="land" style={{ left: "45%", top: "8%", width: "48%", height: "78%" }} />
                <span className="map-dot" style={{ left: "27%", top: "40%" }} />
                <span className="map-dot" style={{ left: "66%", top: "28%" }} />
                <span className="map-dot" style={{ left: "75%", top: "69%" }} />
                <span className="map-dot" style={{ left: "49%", top: "58%" }} />
              </div>
              <div className="monitor-body">
                <div className="feed-message green" style={{ fontSize: 8 }}>
                  SIMULATED GRID // NO LIVE LOCATION DATA
                </div>
              </div>
            </section>

            <section className="monitor">
              <div className="monitor-head">
                <span>SYSTEM FLAGS</span>
                <span className="monitor-led">●</span>
              </div>
              <div className="monitor-body">
                <div className="telemetry">
                  <span>LOCAL TIME</span><span>{clock}</span>
                  <span>API</span><span>{apiStatus}</span>
                  <span>CASE STORE</span><span>{loadingInvestigations ? "SYNCING" : "READY"}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="section">
          <div className="section-heading">
            <div>
              <div className="section-kicker">DATABASE // CASE MANAGEMENT</div>
              <h2 className="section-title">Active investigations</h2>
            </div>
            <button className="connect" onClick={() => void handleRefresh()}>
              REFRESH CASES
            </button>
          </div>

          {loadingInvestigations ? (
            <div className="empty">CONNECTING TO EYE API...</div>
          ) : investigations.length === 0 ? (
            <div className="empty">
              NO CASES FOUND // CREATE AN INVESTIGATION ABOVE
            </div>
          ) : (
            <div className="case-grid">
              {investigations.map((item) => (
                <article className="case-card" key={item.id}>
                  <div className="case-top">
                    <span className="case-id">CASE #{item.id}</span>
                    <span className="case-status">{item.status}</span>
                  </div>
                  <h3 className="case-title">{item.title}</h3>
                  <p className="case-description">
                    {item.description || "No description provided."}
                  </p>
                  <p className="case-date">
                    CREATED {new Date(item.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <div className="section-kicker">WORKSPACE MODULES</div>
              <h2 className="section-title">Intelligence arsenal</h2>
            </div>
            <span className="module-code">
              {activeModule ? `SELECTED: ${activeModule}` : "SELECT A MODULE"}
            </span>
          </div>

          <div className="module-grid">
            {modules.map((module) => (
              <button
                key={module.code}
                onClick={() => {
                  setActiveModule(module.title);
                  logEvent(
                    "MODULE",
                    `${module.title} selected // integration pending`,
                    "amber",
                  );
                }}
                className={`module-card ${activeModule === module.title ? "selected" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="module-icon">{module.icon}</span>
                  <span className="module-code">{module.code}</span>
                </div>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
                <div className="module-footer">
                  INTEGRATION PENDING <span className="float-right">↗</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="footer">
          <div className="footer-group">
            <span>
              API:{" "}
              <span className={apiStatus === "ONLINE" ? "status-green" : "status-red"}>
                {apiStatus}
              </span>
            </span>
            <span>
              RECON: <span className="status-red">NOT CONFIGURED</span>
            </span>
          </div>
          <span className="credit">
            EYE OSINT {"//"} DEVELOPED BY{" "}
            <strong>THEGREATKASHIF</strong>
          </span>
        </footer>
      </div>
    </main>
  );
}
