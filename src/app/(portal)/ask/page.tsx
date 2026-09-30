import { AskChat } from "./ask-chat";

export const metadata = { title: "Ask NCPOR" };

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const sp = await searchParams;
  return <AskChat initial={typeof sp.q === "string" ? sp.q.slice(0, 300) : ""} />;
}
