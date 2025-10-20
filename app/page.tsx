import { redirect } from "next/navigation";

export default function Home() {
  redirect("/panel"); // сразу перенаправляем в панель
}
