import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function Page() {
  redirect("/login");
}