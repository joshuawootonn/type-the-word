import { HistoryOverview } from "./history-overview";
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "~/server/auth";
import { getHistory } from "./getHistory";
import { HistoryLogV2 } from "./history-log-2";
import { WPMChart } from "./wpm-chart";
import { cookies } from "next/headers";
import PostHogClient from "~/server/posthog";

export const metadata: Metadata = {
  title: "Type the Word - History",
  description: "History of all the passages you have typed.",
};

export default async function History() {
  const session = await getServerSession(authOptions);
  const cookieStore = cookies();

  const timezoneOffset = parseInt(cookieStore.get("timezoneOffset")?.value ?? "0");

  if (session == null) {
    redirect("/");
  }

  // Check feature flags first
  const [useOptimizedHistory, showWpmChart] = await Promise.all([
    PostHogClient().isFeatureEnabled("use-read-optimized-history", session.user.id),
    PostHogClient().isFeatureEnabled("use-wpm-accuracy-history-chart", session.user.id),
  ]);

  // Then fetch history using appropriate path based on flag
  const { overview, log2, allVerseStats } = await getHistory(
    session.user.id,
    timezoneOffset,
    useOptimizedHistory ?? false,
  );

  return (
    <>
      <h2>
        Overview{" "}
        {useOptimizedHistory ? (
          <div className="-translate-y-1.5 inline-block border border-primary px-1.5 py-0.5 text-xs font-medium text-primary">
            beta
          </div>
        ) : (
          ""
        )}
      </h2>
      {overview.length === 0 ? (
        <p>
          Once you have typed more verses this section will include details on what books of the
          bible you have typed through.
        </p>
      ) : (
        <HistoryOverview overview={overview} />
      )}
      {showWpmChart && (
        <>
          <hr className="mx-0 w-full border-t-2 border-primary" />
          <WPMChart
            allStats={allVerseStats}
            title={
              <div className="flex items-center gap-2">
                <h2 className="m-0">WPM + Accuracy</h2>
                <div className="-translate-y-0 inline-block border border-primary px-1.5 py-0.5 text-xs font-medium text-primary">
                  beta
                </div>
              </div>
            }
          />
        </>
      )}
      <hr className="mx-0 w-full border-t-2 border-primary" />
      <h2>Log</h2>
      {log2.length === 0 ? (
        <p>
          Once you have typed more verses this section will include details on how often you have
          typed over the past few months.
        </p>
      ) : (
        <HistoryLogV2 monthLogs={log2} />
      )}
    </>
  );
}
