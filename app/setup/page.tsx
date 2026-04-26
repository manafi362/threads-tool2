import { notFound } from "next/navigation";

export const metadata = {
  title: "Not Found",
  description: "This page is not available.",
};

export default function SetupPage() {
  notFound();
}
